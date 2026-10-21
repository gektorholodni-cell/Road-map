import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { GameEvent, Project } from '../types';
import { apply, isSessionAction, type Action } from './actions';
import { eventId, sync } from '../systems/sync';
import { saveProject } from '../storage/db';
import { connectShared, sharedJson, type SharedDoc } from '../storage/shared';
import { parseProject } from '../storage/io';
import { playSound } from '../systems/sound';

interface State {
  project: Project;
  events: GameEvent[];
}

type Internal = Action | { type: '__dismiss'; id: string } | { type: '__toast'; text: string; tone?: 'info' | 'success' | 'warn' | 'error' };

function reducer(state: State, a: Internal): State {
  if (a.type === '__dismiss') return { ...state, events: state.events.filter((e) => e.id !== a.id) };
  if (a.type === '__toast') return { ...state, events: [...state.events, { kind: 'toast', text: a.text, tone: a.tone, id: eventId() }] };
  const now = new Date().toISOString();
  let next = apply(state.project, a, now);
  if (next === state.project) return state;
  // Замена целиком (импорт, общий прогресс) сохраняет время изменения из источника, иначе две страницы перезаписывали бы друг друга по кругу.
  if (!isSessionAction(a) && a.type !== 'replace') next = { ...next, updatedAt: now };
  // При полной замене проекта (импорт, восстановление) события прошлого не нужны.
  const { project, events } = sync(a.type === 'replace' ? null : state.project, next, now);
  return { project, events: a.type === 'replace' ? state.events : [...state.events, ...events] };
}

export type SaveState = 'saved' | 'saving' | 'error';

interface Store {
  project: Project;
  events: GameEvent[];
  dispatch: (a: Action) => void;
  dismiss: (id: string) => void;
  toast: (text: string, tone?: 'info' | 'success' | 'warn' | 'error') => void;
  saveState: SaveState;
  saveError: string | null;
  flush: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ initial, children }: { initial: Project; children: ReactNode }) {
  const [state, raw] = useReducer(reducer, undefined, () => ({ project: sync(null, initial).project, events: [] }));
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const latest = useRef(state.project);
  const timer = useRef<number | undefined>(undefined);
  const first = useRef(true);

  // ----- Общий прогресс (только на странице в Claude) -----
  const shared = useRef<SharedDoc | null>(null);
  const lastShared = useRef<string | null>(null);
  const pushing = useRef(false);
  const pushAgain = useRef(false);
  const readOnly = useRef(false);

  const pushShared = useCallback(async () => {
    const doc = shared.current;
    if (!doc || readOnly.current) return;
    if (pushing.current) {
      pushAgain.current = true;
      return;
    }
    const json = sharedJson(latest.current);
    if (json === lastShared.current) return;
    pushing.current = true;
    try {
      await doc.set({ json, savedAt: new Date().toISOString() });
      lastShared.current = json;
    } catch (e) {
      // Участник без права записи видит общий прогресс, но не меняет его.
      if ((e as { code?: string }).code === 'invalid_argument') readOnly.current = true;
    } finally {
      pushing.current = false;
      if (pushAgain.current) {
        pushAgain.current = false;
        void pushShared();
      }
    }
  }, []);

  useEffect(() => {
    let alive = true;
    let stop = () => {};
    let first = true;
    void connectShared().then((doc) => {
      if (!doc || !alive) return;
      shared.current = doc;
      stop = doc.onSnapshot(
        (snap) => {
          if (snap.metadata.hasPendingWrites) return;
          const json = snap.data()?.json;
          if (!snap.exists || typeof json !== 'string') {
            // Общего прогресса ещё нет — первым его заполняет тот, кто открыл страницу.
            void pushShared();
            return;
          }
          if (json === lastShared.current) return;
          const parsed = parseProject(json);
          if (!parsed.ok) return;
          const local = latest.current;
          const next = { ...parsed.project, session: local.session, settings: local.settings };
          lastShared.current = sharedJson(next);
          raw({ type: 'replace', project: next });
          raw({ type: '__toast', text: first ? 'Подключён общий прогресс.' : 'Общий прогресс обновлён.', tone: 'info' });
          first = false;
        },
        () => {
          shared.current = null;
        },
      );
    });
    return () => {
      alive = false;
      stop();
    };
  }, [pushShared]);

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    void pushShared();
    try {
      await saveProject(latest.current);
      setSaveState('saved');
      setSaveError(null);
    } catch (e) {
      setSaveState('error');
      setSaveError((e as Error).message);
    }
  }, [pushShared]);

  // Автосохранение с небольшой задержкой — без потери данных при частых изменениях.
  useEffect(() => {
    latest.current = state.project;
    if (first.current) {
      first.current = false;
      void flush();
      return;
    }
    setSaveState('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), 350);
  }, [state.project, flush]);

  useEffect(() => {
    const onHide = () => void flush();
    window.addEventListener('beforeunload', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', onHide);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [flush]);

  // Звуки событий (по умолчанию выключены).
  const heard = useRef(new Set<string>());
  useEffect(() => {
    if (!state.project.settings.soundEnabled) return;
    for (const e of state.events) {
      if (heard.current.has(e.id)) continue;
      heard.current.add(e.id);
      if (e.kind === 'achievement') playSound('achievement');
      else if (e.kind === 'island_complete') playSound('fanfare');
      else if (e.kind === 'island_unlocked' || e.kind === 'tasks_unlocked') playSound('unlock');
    }
  }, [state.events, state.project.settings.soundEnabled]);

  // Стабильные функции: не меняются между рендерами.
  const dispatch = useCallback((a: Action) => raw(a), []);
  const dismiss = useCallback((id: string) => raw({ type: '__dismiss', id }), []);
  const toast = useCallback((text: string, tone?: 'info' | 'success' | 'warn' | 'error') => raw({ type: '__toast', text, tone }), []);

  const store = useMemo<Store>(
    () => ({
      project: state.project,
      events: state.events,
      dispatch,
      dismiss,
      toast,
      saveState,
      saveError,
      flush,
    }),
    [state, saveState, saveError, flush, dispatch, dismiss, toast],
  );
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore вне StoreProvider');
  return s;
}
