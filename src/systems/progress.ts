// Система прогресса: вычисляет итоговые статусы, причины блокировки,
// прогресс глав/островов/проекта и открытие островов.
import type { Chapter, Island, Project, Task, TaskStatus } from '../types';

export interface Progress {
  done: number;
  skipped: number;
  total: number;
  /** done / (total - skipped), 0..1 */
  ratio: number;
  requiredDone: number;
  requiredTotal: number;
}

const resolved = (t: Task | undefined) => !!t && (t.status === 'done' || t.status === 'skipped');

export function islandIndex(p: Project, islandId: string) {
  return p.islands.findIndex((i) => i.id === islandId);
}

export function getIsland(p: Project, islandId: string | undefined): Island | undefined {
  return p.islands.find((i) => i.id === islandId);
}

export function islandTaskIds(island: Island): string[] {
  return island.chapters.flatMap((c) => c.stages.flatMap((s) => s.taskIds));
}

export function chapterTaskIds(chapter: Chapter): string[] {
  return chapter.stages.flatMap((s) => s.taskIds);
}

export function islandTasks(p: Project, island: Island): Task[] {
  return islandTaskIds(island)
    .map((id) => p.tasks[id])
    .filter(Boolean);
}

/** Остров открыт для прохождения (по ходу пути, по правилу или вручную). */
export function isIslandUnlocked(p: Project, island: Island): boolean {
  const idx = islandIndex(p, island.id);
  return idx === 0 || island.unlockRule === 'always' || island.manuallyUnlocked || !!island.unlockedAt;
}

/** Все обязательные задачи острова закрыты (выполнены или осознанно пропущены). */
export function isIslandComplete(p: Project, island: Island): boolean {
  const tasks = islandTasks(p, island);
  const required = tasks.filter((t) => t.required);
  if (tasks.length === 0) return false;
  // Если обязательных нет вовсе — нужно закрыть все задачи.
  const pool = required.length > 0 ? required : tasks;
  return pool.every(resolved);
}

export function computeProgress(tasks: Task[]): Progress {
  let done = 0;
  let skipped = 0;
  let requiredDone = 0;
  let requiredTotal = 0;
  for (const t of tasks) {
    if (t.status === 'done') done++;
    if (t.status === 'skipped') skipped++;
    if (t.required && t.status !== 'skipped') {
      requiredTotal++;
      if (t.status === 'done') requiredDone++;
    }
  }
  const denom = tasks.length - skipped;
  return { done, skipped, total: tasks.length, ratio: denom > 0 ? done / denom : tasks.length > 0 ? 1 : 0, requiredDone, requiredTotal };
}

export function islandProgress(p: Project, island: Island) {
  return computeProgress(islandTasks(p, island));
}

export function chapterProgress(p: Project, chapter: Chapter) {
  return computeProgress(chapterTaskIds(chapter).map((id) => p.tasks[id]).filter(Boolean));
}

export function projectProgress(p: Project) {
  return computeProgress(p.islands.flatMap((i) => islandTasks(p, i)));
}

export interface TaskState {
  status: TaskStatus;
  /** Причины блокировки (или предупреждения для задач в работе). */
  reasons: string[];
  /** Незавершённые зависимости. */
  unmetDeps: Task[];
  islandLocked: boolean;
}

/** Остров, который нужно завершить, чтобы открыть данный. */
export function previousIsland(p: Project, island: Island): Island | undefined {
  const idx = islandIndex(p, island.id);
  return idx > 0 ? p.islands[idx - 1] : undefined;
}

export function unlockConditionText(p: Project, island: Island): string {
  if (isIslandUnlocked(p, island)) {
    if (island.manuallyUnlocked && !island.unlockedAt && islandIndex(p, island.id) !== 0) return 'Открыт вручную для свободного исследования.';
    return 'Остров открыт.';
  }
  const prev = previousIsland(p, island);
  return prev ? `Завершите все обязательные задачи острова «${prev.name}».` : 'Остров откроется автоматически.';
}

export function taskState(p: Project, task: Task): TaskState {
  const island = getIsland(p, task.islandId);
  const islandLocked = island ? !isIslandUnlocked(p, island) : false;
  const unmetDeps = task.dependsOn.map((id) => p.tasks[id]).filter((d): d is Task => !!d && !resolved(d));
  const reasons: string[] = [];
  if (islandLocked && island) {
    const prev = previousIsland(p, island);
    reasons.push(prev ? `Остров закрыт: сначала завершите остров «${prev.name}».` : 'Остров закрыт.');
  }
  for (const d of unmetDeps) {
    const other = d.islandId !== task.islandId ? getIsland(p, d.islandId) : undefined;
    reasons.push(other ? `Сначала завершите задачу «${d.title}» (остров «${other.name}»).` : `Сначала завершите задачу «${d.title}».`);
  }

  let status: TaskStatus;
  switch (task.status) {
    case 'done':
      status = 'done';
      break;
    case 'skipped':
      status = 'skipped';
      break;
    case 'in_progress':
      status = 'in_progress';
      break;
    case 'review':
      status = 'review';
      break;
    default:
      status = islandLocked || unmetDeps.length > 0 ? 'locked' : 'available';
  }
  return { status, reasons, unmetDeps, islandLocked };
}

/** Задачи, которые зависят от данной. */
export function dependents(p: Project, taskId: string): Task[] {
  return Object.values(p.tasks).filter((t) => t.dependsOn.includes(taskId));
}

/** Проверка на цикл: появится ли цикл, если task начнёт зависеть от depId. */
export function wouldCreateCycle(p: Project, taskId: string, depId: string): boolean {
  if (taskId === depId) return true;
  const seen = new Set<string>();
  const stack = [depId];
  while (stack.length) {
    const id = stack.pop()!;
    if (id === taskId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    const t = p.tasks[id];
    if (t) stack.push(...t.dependsOn);
  }
  return false;
}

/** Текущий остров маршрута: первый открытый незавершённый. */
export function currentIsland(p: Project): Island | undefined {
  return (
    p.islands.find((i) => isIslandUnlocked(p, i) && !isIslandComplete(p, i)) ??
    [...p.islands].reverse().find((i) => isIslandUnlocked(p, i)) ??
    p.islands[0]
  );
}

export type IslandMapState = 'locked' | 'open' | 'complete';

export function islandMapState(p: Project, island: Island): IslandMapState {
  if (island.completedAt) return 'complete';
  return isIslandUnlocked(p, island) ? 'open' : 'locked';
}

/** Состояние моста от острова index к index+1. */
export function bridgeState(p: Project, fromIndex: number): 'active' | 'route' | 'dormant' {
  const from = p.islands[fromIndex];
  const to = p.islands[fromIndex + 1];
  if (!from || !to) return 'dormant';
  if (from.completedAt && isIslandUnlocked(p, to)) return 'active';
  const cur = currentIsland(p);
  if (cur && cur.id === from.id) return 'route';
  return 'dormant';
}
