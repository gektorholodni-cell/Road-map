// Все изменения проекта — через чистые действия. Это упрощает сохранение,
// тестирование и будущую синхронизацию.
import type {
  AchievementDef,
  Chapter,
  HeroPos,
  Island,
  Priority,
  Project,
  Settings,
  Stage,
  StoredStatus,
  Task,
  ThemeId,
} from '../types';
import { chapterTaskIds, islandTaskIds } from '../systems/progress';

export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export type TaskPatch = Partial<
  Pick<Task, 'title' | 'description' | 'criteria' | 'priority' | 'required' | 'notes' | 'dueDate' | 'dependsOn' | 'achievementIds'>
>;

export type Action =
  | { type: 'replace'; project: Project }
  | { type: 'task/status'; taskId: string; status: StoredStatus; subtasks?: 'all' | 'keep' }
  | { type: 'task/update'; taskId: string; patch: TaskPatch }
  | { type: 'task/add'; stageId: string; title: string; description?: string; criteria?: string; status?: StoredStatus; priority?: Priority; required?: boolean }
  | { type: 'task/delete'; taskId: string }
  | { type: 'task/move'; taskId: string; toStageId: string; index: number }
  | { type: 'subtask/add'; taskId: string; title: string }
  | { type: 'subtask/addMany'; taskId: string; titles: string[] }
  | { type: 'subtask/toggle'; taskId: string; subtaskId: string }
  | { type: 'subtask/rename'; taskId: string; subtaskId: string; title: string }
  | { type: 'subtask/delete'; taskId: string; subtaskId: string }
  | { type: 'chapter/complete'; chapterId: string }
  | { type: 'island/add'; name: string; theme: ThemeId }
  | { type: 'island/update'; islandId: string; patch: Partial<Pick<Island, 'name' | 'subtitle' | 'description' | 'theme' | 'completionCriteria' | 'unlockRule'>> }
  | { type: 'island/delete'; islandId: string }
  | { type: 'island/move'; islandId: string; dir: -1 | 1 }
  | { type: 'island/manualUnlock'; islandId: string; value: boolean }
  | { type: 'chapter/add'; islandId: string; title: string }
  | { type: 'chapter/update'; chapterId: string; patch: Partial<Pick<Chapter, 'title' | 'description'>> }
  | { type: 'chapter/delete'; chapterId: string }
  | { type: 'chapter/move'; chapterId: string; dir: -1 | 1 }
  | { type: 'stage/add'; chapterId: string; title: string }
  | { type: 'stage/update'; stageId: string; title: string }
  | { type: 'stage/delete'; stageId: string }
  | { type: 'achievement/add'; def: AchievementDef; taskId?: string }
  | { type: 'achievement/delete'; achievementId: string }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'project/rename'; name: string }
  | { type: 'session/view'; view: 'map' | 'island'; islandId?: string }
  | { type: 'session/hero'; islandId: string; pos: HeroPos };

function mapIslands(p: Project, fn: (i: Island) => Island): Project {
  return { ...p, islands: p.islands.map(fn) };
}

function mapChapters(p: Project, fn: (c: Chapter, i: Island) => Chapter): Project {
  return mapIslands(p, (i) => ({ ...i, chapters: i.chapters.map((c) => fn(c, i)) }));
}

function mapStages(p: Project, fn: (s: Stage, c: Chapter, i: Island) => Stage): Project {
  return mapChapters(p, (c, i) => ({ ...c, stages: c.stages.map((s) => fn(s, c, i)) }));
}

function updateTask(p: Project, taskId: string, fn: (t: Task) => Task): Project {
  const t = p.tasks[taskId];
  if (!t) return p;
  return { ...p, tasks: { ...p.tasks, [taskId]: fn(t) } };
}

function findStage(p: Project, stageId: string): { island: Island; chapter: Chapter; stage: Stage } | null {
  for (const island of p.islands)
    for (const chapter of island.chapters)
      for (const stage of chapter.stages) if (stage.id === stageId) return { island, chapter, stage };
  return null;
}

/** Удаляет задачи и чистит ссылки на них в зависимостях. */
function removeTasks(p: Project, ids: string[]): Project {
  if (!ids.length) return p;
  const drop = new Set(ids);
  const tasks: Record<string, Task> = {};
  for (const [id, t] of Object.entries(p.tasks)) {
    if (drop.has(id)) continue;
    tasks[id] = t.dependsOn.some((d) => drop.has(d)) ? { ...t, dependsOn: t.dependsOn.filter((d) => !drop.has(d)) } : t;
  }
  return { ...p, tasks };
}

function setStatus(t: Task, status: StoredStatus, now: string): Task {
  return { ...t, status, completedAt: status === 'done' ? t.completedAt ?? now : undefined };
}

const NEXT_SPOTS: Array<[number, number]> = [
  [400, 380],
  [-300, -420],
  [520, -260],
];

export function apply(p: Project, a: Action, now = new Date().toISOString()): Project {
  switch (a.type) {
    case 'replace':
      return a.project;

    case 'task/status': {
      const t = p.tasks[a.taskId];
      if (!t || t.status === a.status) return p;
      let next = updateTask(p, a.taskId, (x) => {
        let y = setStatus(x, a.status, now);
        if (a.status === 'done' && a.subtasks === 'all') y = { ...y, subtasks: y.subtasks.map((s) => ({ ...s, done: true })) };
        return y;
      });
      // Повторное открытие завершённой задачи учитывается для «Без возврата».
      if (t.status === 'done' && a.status !== 'done') {
        next = { ...next, stats: { ...next.stats, reopened: { ...next.stats.reopened, [t.islandId]: (next.stats.reopened[t.islandId] ?? 0) + 1 } } };
      }
      return next;
    }

    case 'task/update':
      return updateTask(p, a.taskId, (t) => ({ ...t, ...a.patch }));

    case 'task/add': {
      const loc = findStage(p, a.stageId);
      if (!loc) return p;
      const id = uid('task');
      const task: Task = {
        id,
        islandId: loc.island.id,
        chapterId: loc.chapter.id,
        stageId: a.stageId,
        title: a.title.trim() || 'Новая задача',
        description: a.description ?? '',
        criteria: a.criteria ?? '',
        status: a.status ?? 'todo',
        priority: a.priority ?? 'medium',
        required: a.required ?? true,
        dependsOn: [],
        achievementIds: [],
        notes: '',
        createdAt: now,
        completedAt: a.status === 'done' ? now : undefined,
        subtasks: [],
      };
      const next = mapStages(p, (s) => (s.id === a.stageId ? { ...s, taskIds: [...s.taskIds, id] } : s));
      return { ...next, tasks: { ...next.tasks, [id]: task } };
    }

    case 'task/delete': {
      const next = mapStages(p, (s) => (s.taskIds.includes(a.taskId) ? { ...s, taskIds: s.taskIds.filter((x) => x !== a.taskId) } : s));
      return removeTasks(next, [a.taskId]);
    }

    case 'task/move': {
      const loc = findStage(p, a.toStageId);
      const t = p.tasks[a.taskId];
      if (!loc || !t) return p;
      let next = mapStages(p, (s) => ({ ...s, taskIds: s.taskIds.filter((x) => x !== a.taskId) }));
      next = mapStages(next, (s) => {
        if (s.id !== a.toStageId) return s;
        const ids = [...s.taskIds];
        ids.splice(Math.max(0, Math.min(a.index, ids.length)), 0, a.taskId);
        return { ...s, taskIds: ids };
      });
      return updateTask(next, a.taskId, (x) => ({ ...x, stageId: loc.stage.id, chapterId: loc.chapter.id, islandId: loc.island.id }));
    }

    case 'subtask/add':
      if (!a.title.trim()) return p;
      return updateTask(p, a.taskId, (t) => ({ ...t, subtasks: [...t.subtasks, { id: uid('st'), title: a.title.trim(), done: false }] }));

    case 'subtask/addMany':
      return updateTask(p, a.taskId, (t) => ({
        ...t,
        subtasks: [...t.subtasks, ...a.titles.filter((x) => x.trim()).map((title) => ({ id: uid('st'), title: title.trim(), done: false }))],
      }));

    case 'subtask/toggle':
      return updateTask(p, a.taskId, (t) => ({ ...t, subtasks: t.subtasks.map((s) => (s.id === a.subtaskId ? { ...s, done: !s.done } : s)) }));

    case 'subtask/rename':
      return updateTask(p, a.taskId, (t) => ({ ...t, subtasks: t.subtasks.map((s) => (s.id === a.subtaskId ? { ...s, title: a.title } : s)) }));

    case 'subtask/delete':
      return updateTask(p, a.taskId, (t) => ({ ...t, subtasks: t.subtasks.filter((s) => s.id !== a.subtaskId) }));

    case 'chapter/complete': {
      const chapter = p.islands.flatMap((i) => i.chapters).find((c) => c.id === a.chapterId);
      if (!chapter) return p;
      const tasks = { ...p.tasks };
      for (const id of chapterTaskIds(chapter)) {
        const t = tasks[id];
        if (t && t.status !== 'done' && t.status !== 'skipped') {
          tasks[id] = { ...setStatus(t, 'done', now), subtasks: t.subtasks.map((s) => ({ ...s, done: true })) };
        }
      }
      return { ...p, tasks };
    }

    case 'island/add': {
      const id = uid('island');
      const last = p.islands[p.islands.length - 1];
      const spot = NEXT_SPOTS[p.islands.length % NEXT_SPOTS.length];
      const map = last
        ? { x: Math.max(300, last.map.x + spot[0]), y: Math.min(2400, Math.max(300, last.map.y + spot[1])), scale: Math.min(1.4, last.map.scale) }
        : { x: 600, y: 1800, scale: 0.8 };
      const chapterId = uid('chapter');
      const island: Island = {
        id,
        name: a.name.trim() || 'Новый остров',
        subtitle: 'Новый этап',
        description: '',
        theme: a.theme,
        completionCriteria: 'Все обязательные задачи выполнены.',
        chapters: [{ id: chapterId, title: 'Глава A', description: '', stages: [{ id: uid('stage'), title: 'Этап 1', taskIds: [] }] }],
        unlockRule: 'sequential',
        manuallyUnlocked: false,
        unlockedAt: p.islands.length === 0 ? now : undefined,
        map,
      };
      return { ...p, islands: [...p.islands, island] };
    }

    case 'island/update':
      return mapIslands(p, (i) => (i.id === a.islandId ? { ...i, ...a.patch } : i));

    case 'island/delete': {
      const island = p.islands.find((i) => i.id === a.islandId);
      if (!island) return p;
      const next = { ...p, islands: p.islands.filter((i) => i.id !== a.islandId) };
      // Первый остров всегда открыт.
      if (next.islands[0] && !next.islands[0].unlockedAt) next.islands = [{ ...next.islands[0], unlockedAt: now }, ...next.islands.slice(1)];
      const session = next.session.islandId === a.islandId ? { ...next.session, view: 'map' as const, islandId: undefined } : next.session;
      return removeTasks({ ...next, session }, islandTaskIds(island));
    }

    case 'island/move': {
      const idx = p.islands.findIndex((i) => i.id === a.islandId);
      const to = idx + a.dir;
      if (idx < 0 || to < 0 || to >= p.islands.length) return p;
      const islands = [...p.islands];
      // Меняем местами порядок, но сохраняем позиции на карте — маршрут остаётся красивым.
      const posA = islands[idx].map;
      const posB = islands[to].map;
      [islands[idx], islands[to]] = [{ ...islands[to], map: posA }, { ...islands[idx], map: posB }];
      return { ...p, islands };
    }

    case 'island/manualUnlock':
      return mapIslands(p, (i) => (i.id === a.islandId ? { ...i, manuallyUnlocked: a.value } : i));

    case 'chapter/add':
      return mapIslands(p, (i) =>
        i.id === a.islandId
          ? { ...i, chapters: [...i.chapters, { id: uid('chapter'), title: a.title.trim() || 'Новая глава', description: '', stages: [{ id: uid('stage'), title: 'Этап 1', taskIds: [] }] }] }
          : i,
      );

    case 'chapter/update':
      return mapChapters(p, (c) => (c.id === a.chapterId ? { ...c, ...a.patch } : c));

    case 'chapter/delete': {
      const chapter = p.islands.flatMap((i) => i.chapters).find((c) => c.id === a.chapterId);
      if (!chapter) return p;
      const next = mapIslands(p, (i) => ({ ...i, chapters: i.chapters.filter((c) => c.id !== a.chapterId) }));
      return removeTasks(next, chapterTaskIds(chapter));
    }

    case 'chapter/move':
      return mapIslands(p, (i) => {
        const idx = i.chapters.findIndex((c) => c.id === a.chapterId);
        const to = idx + a.dir;
        if (idx < 0 || to < 0 || to >= i.chapters.length) return i;
        const chapters = [...i.chapters];
        [chapters[idx], chapters[to]] = [chapters[to], chapters[idx]];
        return { ...i, chapters };
      });

    case 'stage/add':
      return mapChapters(p, (c) => (c.id === a.chapterId ? { ...c, stages: [...c.stages, { id: uid('stage'), title: a.title.trim() || 'Новый этап', taskIds: [] }] } : c));

    case 'stage/update':
      return mapStages(p, (s) => (s.id === a.stageId ? { ...s, title: a.title } : s));

    case 'stage/delete': {
      const loc = findStage(p, a.stageId);
      if (!loc) return p;
      const next = mapChapters(p, (c) => ({ ...c, stages: c.stages.filter((s) => s.id !== a.stageId) }));
      return removeTasks(next, loc.stage.taskIds);
    }

    case 'achievement/add': {
      let next: Project = { ...p, achievements: [...p.achievements, a.def] };
      if (a.taskId) next = updateTask(next, a.taskId, (t) => ({ ...t, achievementIds: [...t.achievementIds, a.def.id] }));
      return next;
    }

    case 'achievement/delete': {
      const tasks: Record<string, Task> = {};
      for (const [id, t] of Object.entries(p.tasks))
        tasks[id] = t.achievementIds.includes(a.achievementId) ? { ...t, achievementIds: t.achievementIds.filter((x) => x !== a.achievementId) } : t;
      const unlocked = { ...p.unlocked };
      delete unlocked[a.achievementId];
      return { ...p, tasks, unlocked, achievements: p.achievements.filter((x) => x.id !== a.achievementId) };
    }

    case 'settings':
      return { ...p, settings: { ...p.settings, ...a.patch } };

    case 'project/rename':
      return { ...p, name: a.name };

    case 'session/view':
      return { ...p, session: { ...p.session, view: a.view, islandId: a.islandId ?? p.session.islandId } };

    case 'session/hero':
      return { ...p, session: { ...p.session, heroPos: { ...p.session.heroPos, [a.islandId]: a.pos } } };
  }
}

/** Действия, которые не считаются изменением содержимого (не трогают updatedAt). */
export const isSessionAction = (a: Action) => a.type === 'session/view' || a.type === 'session/hero';
