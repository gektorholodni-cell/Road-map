// Голосования в комнате: любой участник поднимает флаг с вопросом, остальные выбирают вариант.
// Хранятся у каждого игрока и передаются по живому каналу целиком; при встрече копии сливаются,
// поэтому базе данных ничего менять не нужно, а опоздавший получает опросы от тех, кто уже в комнате.
import { useSyncExternalStore } from 'react';
import { coopSettings, deviceId, pollBridge, sendPoll, sendPollHello } from './room';

export interface PollVote {
  option: number;
  name: string;
  color: string;
  at: number;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  by: { id: string; name: string; color: string };
  at: number;
  closedAt?: number;
  votes: Record<string, PollVote>;
}

export const MAX_OPTIONS = 6;
const KEY = 'islands-roadmap-polls';
const WEEK = 7 * 24 * 3600 * 1000;
/** Итоги закрытого голосования всплывают, если оно завершилось не раньше этого срока. */
const RESULT_FRESH = 6 * 3600 * 1000;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);

/** Проверяет присланный по сети опрос: данные от других игроков не доверенные. */
export function parsePoll(raw: unknown): Poll | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id, 40);
  const question = str(r.question, 140);
  const options = Array.isArray(r.options) ? r.options.slice(0, MAX_OPTIONS).map((o) => str(o, 60)) : [];
  const by = (r.by ?? {}) as Record<string, unknown>;
  const at = num(r.at);
  if (!/^[a-z0-9-]{4,40}$/i.test(id) || !question || options.length < 2 || options.some((o) => !o) || Number.isNaN(at)) return null;
  const votes: Record<string, PollVote> = {};
  if (r.votes && typeof r.votes === 'object') {
    for (const [voter, v] of Object.entries(r.votes as Record<string, unknown>).slice(0, 50)) {
      const vv = (v ?? {}) as Record<string, unknown>;
      const option = num(vv.option);
      const vAt = num(vv.at);
      if (!/^[a-z0-9-]{2,40}$/i.test(voter) || !Number.isInteger(option) || option < 0 || option >= options.length || Number.isNaN(vAt)) continue;
      votes[voter] = { option, at: vAt, name: str(vv.name, 24) || 'Игрок', color: safeColor(vv.color) };
    }
  }
  const closedAt = num(r.closedAt);
  return {
    id,
    question,
    options,
    at,
    by: { id: str(by.id, 40), name: str(by.name, 24) || 'Игрок', color: safeColor(by.color) },
    votes,
    ...(Number.isNaN(closedAt) ? {} : { closedAt }),
  };
}

const safeColor = (v: unknown) => (typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v) ? v : '#9aa6c8');

/** Сливает две копии одного опроса: у каждого голосующего побеждает последний выбор, завершение — самое раннее. */
export function mergePoll(a: Poll, b: Poll): Poll {
  const votes = { ...a.votes };
  for (const [voter, v] of Object.entries(b.votes)) if (!votes[voter] || votes[voter].at < v.at) votes[voter] = v;
  const closed = [a.closedAt, b.closedAt].filter((x): x is number => x !== undefined);
  return { ...a, votes, ...(closed.length ? { closedAt: Math.min(...closed) } : {}) };
}

export interface Tally {
  counts: number[];
  total: number;
  /** Индексы вариантов с наибольшим числом голосов (пусто, если голосов нет). */
  leaders: number[];
}

export function tally(poll: Poll): Tally {
  const counts = poll.options.map(() => 0);
  for (const v of Object.values(poll.votes)) counts[v.option]++;
  const total = counts.reduce((s, c) => s + c, 0);
  const max = Math.max(...counts);
  return { counts, total, leaders: max > 0 ? counts.flatMap((c, i) => (c === max ? [i] : [])) : [] };
}

// ----- Хранилище опросов этой комнаты -----
interface Saved {
  polls: Poll[];
  /** Свёрнутые окна: ключ «id:a» для идущего голосования и «id:r» для итогов. */
  minimized: Record<string, true>;
  /** Итоги, которые игрок уже посмотрел и закрыл. */
  dismissed: Record<string, true>;
}

let state: Saved = { polls: [], minimized: {}, dismissed: {} };
let loadedRoom: string | null = null;
const listeners = new Set<() => void>();
const freshListeners = new Set<(poll: Poll, kind: 'new' | 'closed') => void>();

const storageKey = (room: string) => `${KEY}-${room}`;

function ensureLoaded() {
  const room = coopSettings()?.room ?? null;
  if (room === loadedRoom) return;
  loadedRoom = room;
  state = { polls: [], minimized: {}, dismissed: {} };
  if (!room) return;
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(room)) ?? 'null') as Partial<Saved> | null;
    if (raw) {
      state = {
        polls: (raw.polls ?? []).map(parsePoll).filter((p): p is Poll => !!p),
        minimized: raw.minimized ?? {},
        dismissed: raw.dismissed ?? {},
      };
    }
  } catch {
    /* повреждённая запись — начнём с чистого листа */
  }
}

function commit(next: Saved) {
  const now = Date.now();
  // Старые завершённые опросы больше не нужны; держим не больше 20 последних.
  const polls = next.polls
    .filter((p) => !p.closedAt || now - p.closedAt < WEEK)
    .sort((a, b) => b.at - a.at)
    .slice(0, 20);
  const ids = new Set(polls.map((p) => p.id));
  const keep = <T,>(rec: Record<string, T>) => Object.fromEntries(Object.entries(rec).filter(([k]) => ids.has(k.split(':')[0])));
  state = { polls, minimized: keep(next.minimized), dismissed: keep(next.dismissed) };
  if (loadedRoom) {
    try {
      localStorage.setItem(storageKey(loadedRoom), JSON.stringify(state));
    } catch {
      /* без хранилища опросы живут до перезагрузки */
    }
  }
  listeners.forEach((l) => l());
}

/** Принимает опрос (свой или чужой), сливая с известной копией. Возвращает итоговую версию. */
function upsert(incoming: Poll, announce: boolean): Poll {
  ensureLoaded();
  const old = state.polls.find((p) => p.id === incoming.id);
  const merged = old ? mergePoll(old, incoming) : incoming;
  if (old && JSON.stringify(old) === JSON.stringify(merged)) return old;
  const minimized = { ...state.minimized };
  if (!old) delete minimized[`${merged.id}:a`];
  commit({ ...state, minimized, polls: [merged, ...state.polls.filter((p) => p.id !== merged.id)] });
  if (announce) {
    if (!old && !merged.closedAt) freshListeners.forEach((l) => l(merged, 'new'));
    else if (old && !old.closedAt && merged.closedAt) freshListeners.forEach((l) => l(merged, 'closed'));
  }
  return merged;
}

pollBridge.onPoll = (raw) => {
  const p = parsePoll(raw);
  if (p) upsert(p, true);
};
// Новичок в комнате просит рассказать о голосованиях — отвечаем идущими и недавно завершёнными.
pollBridge.onHello = () => {
  ensureLoaded();
  const now = Date.now();
  state.polls.filter((p) => !p.closedAt || now - p.closedAt < RESULT_FRESH).forEach((p) => sendPoll(p));
};
pollBridge.onJoined = () => {
  sendPollHello();
  pollBridge.onHello();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const snapshot = () => {
  ensureLoaded();
  return state;
};

export function usePollState(): Saved {
  return useSyncExternalStore(subscribe, snapshot);
}

/** Сообщает о новом голосовании или его завершении (для звука). */
export function onPollEvent(fn: (poll: Poll, kind: 'new' | 'closed') => void) {
  freshListeners.add(fn);
  return () => {
    freshListeners.delete(fn);
  };
}

/** Опрос, который сейчас показывать: идущий или свежие итоги, которые ещё не закрыли. */
export function currentPoll(s: Saved, now = Date.now()): Poll | null {
  const active = s.polls.filter((p) => !p.closedAt).sort((a, b) => b.at - a.at)[0];
  if (active) return active;
  return s.polls.filter((p) => p.closedAt && now - p.closedAt < RESULT_FRESH && !s.dismissed[p.id]).sort((a, b) => b.closedAt! - a.closedAt!)[0] ?? null;
}

export const pollViewKey = (p: Poll) => `${p.id}:${p.closedAt ? 'r' : 'a'}`;

// ----- Действия игрока -----
const meInfo = () => {
  const s = coopSettings();
  return { name: s?.name ?? 'Игрок', color: s?.color ?? '#9aa6c8' };
};

export function startPoll(question: string, options: string[]): Poll | null {
  const me = meInfo();
  const poll = parsePoll({
    id: `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    question,
    options: options.map((o) => o.trim()).filter(Boolean),
    by: { id: deviceId, ...me },
    at: Date.now(),
    votes: {},
  });
  if (!poll) return null;
  sendPoll(upsert(poll, false));
  return poll;
}

export function vote(poll: Poll, option: number) {
  if (poll.closedAt) return;
  const next: Poll = { ...poll, votes: { ...poll.votes, [deviceId]: { option, at: Date.now(), ...meInfo() } } };
  sendPoll(upsert(next, false));
}

export function closePoll(poll: Poll) {
  if (poll.closedAt) return;
  sendPoll(upsert({ ...poll, closedAt: Date.now() }, false));
}

export function setMinimized(p: Poll, value: boolean) {
  ensureLoaded();
  const minimized = { ...state.minimized };
  if (value) minimized[pollViewKey(p)] = true;
  else delete minimized[pollViewKey(p)];
  commit({ ...state, minimized });
}

export function dismissResult(p: Poll) {
  ensureLoaded();
  commit({ ...state, dismissed: { ...state.dismissed, [p.id]: true } });
}
