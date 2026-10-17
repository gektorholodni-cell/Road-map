// После каждого изменения проект проходит через sync(): фиксирует завершение
// и открытие островов, выдаёт достижения и сообщает о новых доступных задачах.
import type { GameEvent, Project } from '../types';
import { checkAchievement } from './achievements';
import { isIslandComplete, isIslandUnlocked, taskState } from './progress';

let eventSeq = 0;
export const eventId = () => `ev-${Date.now().toString(36)}-${(eventSeq++).toString(36)}`;

export function sync(prev: Project | null, next: Project, now = new Date().toISOString()): { project: Project; events: GameEvent[] } {
  const events: GameEvent[] = [];
  let islands = next.islands;
  let changed = false;

  // 1. Завершение островов и открытие следующих.
  islands = islands.map((island) => {
    const complete = isIslandComplete(next, island);
    if (complete && !island.completedAt) {
      changed = true;
      events.push(
        island.everCompleted
          ? { kind: 'toast', text: `Остров «${island.name}» снова завершён.`, tone: 'success', id: eventId() }
          : { kind: 'island_complete', islandId: island.id, id: eventId() },
      );
      return { ...island, completedAt: now, everCompleted: true };
    }
    if (!complete && island.completedAt) {
      changed = true;
      return { ...island, completedAt: undefined };
    }
    return island;
  });
  islands = islands.map((island, idx) => {
    if (idx === 0 || island.unlockedAt) return island;
    const prevIsland = islands[idx - 1];
    if (prevIsland.completedAt) {
      changed = true;
      events.push({ kind: 'island_unlocked', islandId: island.id, id: eventId() });
      return { ...island, unlockedAt: now };
    }
    return island;
  });
  let project: Project = changed ? { ...next, islands } : next;

  // 2. Достижения: выдаются один раз.
  let unlocked = project.unlocked;
  for (const def of project.achievements) {
    if (unlocked[def.id]) continue;
    const res = checkAchievement(project, def);
    if (res) {
      unlocked = { ...unlocked, [def.id]: { ...res, unlockedAt: now } };
      events.push({ kind: 'achievement', achievementId: def.id, id: eventId() });
    }
  }
  if (unlocked !== project.unlocked) project = { ...project, unlocked };

  // 3. Задачи, которые стали доступны после этого изменения.
  if (prev) {
    const newly: string[] = [];
    for (const t of Object.values(project.tasks)) {
      const before = prev.tasks[t.id];
      if (!before || t.status !== 'todo') continue;
      const island = project.islands.find((i) => i.id === t.islandId);
      if (!island || !isIslandUnlocked(project, island)) continue;
      if (taskState(project, t).status === 'available' && taskState(prev, before).status === 'locked') newly.push(t.id);
    }
    if (newly.length) events.push({ kind: 'tasks_unlocked', taskIds: newly, id: eventId() });
  }

  return { project, events };
}
