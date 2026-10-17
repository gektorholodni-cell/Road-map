import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { GameEvent, Project } from '../types';
import { apply, isSessionAction, type Action } from './actions';
import { eventId, sync } from '../systems/sync';
import { saveProject } from '../storage/db';
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
  if (!isSessionAction(a)) next = { ...next, updatedAt: now };
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

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    try {
      await saveProject(latest.current);
      setSaveState('saved');
      setSaveError(null);
    } catch (e) {
      setSaveState('error');
      setSaveError((e as Error).message);
    }
  }, []);

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
