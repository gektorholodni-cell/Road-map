// Прогресс из репозитория игры «Сектор Ноль».
// Claude в проекте игры отмечает галочки в ROADMAP.md, а регулярная проверка
// переносит их в public/progress.json этого сайта. При открытии сайт подтягивает
// новые отметки: задача может только продвинуться вперёд, ручные отметки не откатываются.
import type { Project, StoredStatus } from '../types';

export interface GameProgress {
  /** Когда файл обновлялся последний раз (ISO). */
  updatedAt: string;
  /** Откуда взяты отметки, для подписи. */
  source?: string;
  tasks: Record<string, StoredStatus>;
}

const RANK: Record<StoredStatus, number> = { todo: 0, skipped: 0, in_progress: 1, review: 2, done: 3 };
const SEEN_KEY = 'islands-roadmap-game-progress-seen';
const SECTOR = /сектор\s*ноль/i;

/** Какие задачи нужно продвинуть: только вперёд и только в проекте «Сектор Ноль». */
export function progressUpdates(p: Project, gp: GameProgress): Array<{ taskId: string; status: StoredStatus }> {
  if (!SECTOR.test(p.name)) return [];
  const out: Array<{ taskId: string; status: StoredStatus }> = [];
  for (const [taskId, status] of Object.entries(gp.tasks ?? {})) {
    const t = p.tasks[taskId];
    if (!t || !(status in RANK)) continue;
    if (RANK[status] > RANK[t.status]) out.push({ taskId, status });
  }
  return out;
}

/** Обрабатываем каждый выпуск файла один раз, чтобы не спорить с ручными правками. */
export function alreadySeen(gp: GameProgress): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === gp.updatedAt;
  } catch {
    return false;
  }
}

export function markSeen(gp: GameProgress): void {
  try {
    localStorage.setItem(SEEN_KEY, gp.updatedAt);
  } catch {
    /* без хранилища просто проверим ещё раз в следующий раз */
  }
}

export async function fetchGameProgress(): Promise<GameProgress | null> {
  try {
    const res = await fetch('./progress.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as GameProgress;
    if (!data || typeof data.updatedAt !== 'string' || typeof data.tasks !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}
