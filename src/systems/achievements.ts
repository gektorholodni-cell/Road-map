// Система достижений: проверка условий по текущему состоянию проекта.
import type { AchievementDef, Project, UnlockedAchievement } from '../types';
import { isIslandComplete, islandTasks } from './progress';

/** Возвращает данные разблокировки, если условие выполнено, иначе null. */
export function checkAchievement(p: Project, def: AchievementDef): Omit<UnlockedAchievement, 'unlockedAt'> | null {
  const tasks = Object.values(p.tasks);
  const c = def.condition;
  switch (c.type) {
    case 'tasks_done':
      return tasks.filter((t) => t.status === 'done').length >= c.count ? {} : null;
    case 'island_complete': {
      const island = p.islands.find((i) => i.id === c.islandId);
      return island && isIslandComplete(p, island) ? { islandId: island.id } : null;
    }
    case 'all_islands':
      return p.islands.length > 0 && p.islands.every((i) => isIslandComplete(p, i)) ? {} : null;
    case 'perfectionist': {
      const island = p.islands.find((i) => {
        const ts = islandTasks(p, i);
        return ts.length > 0 && ts.every((t) => t.status === 'done');
      });
      return island ? { islandId: island.id } : null;
    }
    case 'no_return': {
      const island = p.islands.find((i) => isIslandComplete(p, i) && !(p.stats.reopened[i.id] > 0));
      return island ? { islandId: island.id } : null;
    }
    case 'subtasks_done':
      return tasks.reduce((n, t) => n + t.subtasks.filter((s) => s.done).length, 0) >= c.count ? {} : null;
    case 'notes':
      return tasks.filter((t) => t.notes.trim().length > 0).length >= c.count ? {} : null;
    case 'manual_unlock':
      return p.islands.some((i) => i.manuallyUnlocked) ? {} : null;
    case 'task_done':
      return c.taskIds.length > 0 && c.taskIds.every((id) => p.tasks[id]?.status === 'done') ? {} : null;
  }
}

export const RARITY_LABEL: Record<AchievementDef['rarity'], string> = {
  common: 'Обычное',
  rare: 'Редкое',
  epic: 'Эпическое',
  legendary: 'Легендарное',
};
