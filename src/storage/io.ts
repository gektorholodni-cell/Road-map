// Импорт/экспорт: разбор JSON, проверка структуры, совместимость версий и нормализация.
import type { AchievementDef, Chapter, Island, Project, Stage, StoredStatus, Subtask, Task, ThemeId } from '../types';
import { APP_ID, SCHEMA_VERSION } from '../types';
import { BUILTIN_ACHIEVEMENTS } from '../data/achievements';

export type ParseResult = { ok: true; project: Project; warnings: string[] } | { ok: false; error: string };

const THEMES: ThemeId[] = ['meadow', 'architecture', 'mechanics', 'citadel', 'underwater', 'ice', 'sky', 'cosmos'];
const STATUSES: StoredStatus[] = ['todo', 'in_progress', 'review', 'done', 'skipped'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

class ImportError extends Error {}

/** Миграции по версиям схемы. Сейчас версия одна; функция — точка расширения. */
function migrate(raw: Obj, from: number, warnings: string[]): Obj {
  let data = raw;
  if (from < 1) {
    warnings.push('Файл без версии схемы: применена совместимость с версией 1.');
    data = { ...data, schemaVersion: 1 };
  }
  return data;
}

export function exportProject(p: Project): string {
  return JSON.stringify({ ...p, exportedAt: new Date().toISOString() }, null, 2);
}

export function parseProject(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Файл повреждён или это не JSON: ${(e as Error).message}` };
  }
  try {
    return normalize(raw);
  } catch (e) {
    return { ok: false, error: e instanceof ImportError ? e.message : `Не удалось прочитать проект: ${(e as Error).message}` };
  }
}

export function normalize(raw: unknown): ParseResult {
  const warnings: string[] = [];
  if (!isObj(raw)) throw new ImportError('Ожидался объект проекта.');
  if (raw.app !== APP_ID) throw new ImportError('Это не файл проекта Islands Roadmap.');
  const version = num(raw.schemaVersion, 0);
  if (version > SCHEMA_VERSION)
    throw new ImportError(`Файл создан более новой версией приложения (схема ${version}, поддерживается до ${SCHEMA_VERSION}). Обновите приложение.`);
  const data = migrate(raw, version, warnings);
  if (!Array.isArray(data.islands)) throw new ImportError('В файле нет списка островов.');
  if (!isObj(data.tasks)) throw new ImportError('В файле нет списка задач.');

  const now = new Date().toISOString();
  const rawTasks = data.tasks as Obj;
  const tasks: Record<string, Task> = {};
  const seen = new Set<string>();

  const islands: Island[] = (data.islands as unknown[]).map((ri, ii) => {
    if (!isObj(ri) || typeof ri.id !== 'string') throw new ImportError(`Остров №${ii + 1} повреждён.`);
    const islandId = ri.id;
    const chapters: Chapter[] = arr(ri.chapters).map((rc, ci) => {
      if (!isObj(rc) || typeof rc.id !== 'string') throw new ImportError(`Глава №${ci + 1} острова «${str(ri.name)}» повреждена.`);
      const chapterId = rc.id;
      const stages: Stage[] = arr(rc.stages).map((rs, si) => {
        if (!isObj(rs) || typeof rs.id !== 'string') throw new ImportError(`Этап №${si + 1} главы «${str(rc.title)}» повреждён.`);
        const taskIds: string[] = [];
        for (const tid of arr(rs.taskIds)) {
          if (typeof tid !== 'string' || seen.has(tid)) continue;
          const rt = rawTasks[tid];
          if (!isObj(rt)) {
            warnings.push(`Пропущена ссылка на отсутствующую задачу ${tid}.`);
            continue;
          }
          seen.add(tid);
          taskIds.push(tid);
          const status = STATUSES.includes(rt.status as StoredStatus) ? (rt.status as StoredStatus) : 'todo';
          tasks[tid] = {
            id: tid,
            islandId,
            chapterId,
            stageId: rs.id,
            title: str(rt.title, 'Без названия'),
            description: str(rt.description),
            criteria: str(rt.criteria),
            status,
            priority: PRIORITIES.includes(rt.priority as never) ? (rt.priority as Task['priority']) : 'medium',
            required: rt.required !== false,
            dependsOn: arr(rt.dependsOn).filter((d): d is string => typeof d === 'string'),
            achievementIds: arr(rt.achievementIds).filter((d): d is string => typeof d === 'string'),
            notes: str(rt.notes),
            createdAt: str(rt.createdAt, now),
            dueDate: typeof rt.dueDate === 'string' && rt.dueDate ? rt.dueDate : undefined,
            completedAt: typeof rt.completedAt === 'string' ? rt.completedAt : undefined,
            subtasks: arr(rt.subtasks)
              .filter(isObj)
              .map((s, k): Subtask => ({ id: str(s.id, `${tid}-st${k}`), title: str(s.title, 'Подзадача'), done: s.done === true })),
          };
        }
        return { id: rs.id, title: str(rs.title, 'Этап'), taskIds };
      });
      return { id: chapterId, title: str(rc.title, 'Глава'), description: str(rc.description), stages };
    });
    const m = isObj(ri.map) ? ri.map : {};
    return {
      id: islandId,
      name: str(ri.name, `Остров ${ii + 1}`),
      subtitle: str(ri.subtitle),
      description: str(ri.description),
      theme: THEMES.includes(ri.theme as ThemeId) ? (ri.theme as ThemeId) : THEMES[ii % THEMES.length],
      completionCriteria: str(ri.completionCriteria),
      chapters,
      unlockRule: ri.unlockRule === 'always' ? 'always' : 'sequential',
      manuallyUnlocked: ri.manuallyUnlocked === true,
      unlockedAt: typeof ri.unlockedAt === 'string' ? ri.unlockedAt : ii === 0 ? now : undefined,
      completedAt: typeof ri.completedAt === 'string' ? ri.completedAt : undefined,
      everCompleted: ri.everCompleted === true || typeof ri.completedAt === 'string',
      map: { x: num(m.x, 500 + ii * 450), y: num(m.y, 1500), scale: num(m.scale, 1) },
    };
  });

  const orphanCount = Object.keys(rawTasks).length - seen.size;
  if (orphanCount > 0) warnings.push(`Задач без главы пропущено: ${orphanCount}.`);
  // Зависимости на несуществующие задачи удаляются.
  for (const t of Object.values(tasks)) t.dependsOn = t.dependsOn.filter((d) => d !== t.id && tasks[d]);

  const achievements: AchievementDef[] = arr(data.achievements).filter(
    (a): a is AchievementDef => isObj(a) && typeof a.id === 'string' && typeof a.title === 'string' && isObj(a.condition),
  );
  for (const b of BUILTIN_ACHIEVEMENTS) if (!achievements.some((a) => a.id === b.id)) achievements.push({ ...b });

  const unlocked: Project['unlocked'] = {};
  if (isObj(data.unlocked))
    for (const [k, v] of Object.entries(data.unlocked)) if (isObj(v) && typeof v.unlockedAt === 'string') unlocked[k] = { unlockedAt: v.unlockedAt, islandId: typeof v.islandId === 'string' ? v.islandId : undefined };

  const s = isObj(data.settings) ? data.settings : {};
  const sess = isObj(data.session) ? data.session : {};
  const stats = isObj(data.stats) && isObj(data.stats.reopened) ? (data.stats.reopened as Record<string, number>) : {};
  const heroPos: Project['session']['heroPos'] = {};
  if (isObj(sess.heroPos))
    for (const [k, v] of Object.entries(sess.heroPos)) if (isObj(v) && typeof v.x === 'number' && typeof v.y === 'number') heroPos[k] = { x: v.x, y: v.y };

  const project: Project = {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    id: str(data.id, `project-${Date.now().toString(36)}`),
    name: str(data.name, 'Моя игра'),
    createdAt: str(data.createdAt, now),
    updatedAt: str(data.updatedAt, now),
    islands,
    tasks,
    achievements,
    unlocked,
    stats: { reopened: stats },
    settings: {
      soundEnabled: s.soundEnabled === true,
      reducedMotion: s.reducedMotion === 'on' || s.reducedMotion === 'off' ? s.reducedMotion : 'auto',
      allowManualUnlock: s.allowManualUnlock === true,
      showMinimap: s.showMinimap !== false,
    },
    session: {
      view: sess.view === 'island' && islands.some((i) => i.id === sess.islandId) ? 'island' : 'map',
      islandId: typeof sess.islandId === 'string' && islands.some((i) => i.id === sess.islandId) ? sess.islandId : undefined,
      heroPos,
    },
  };
  return { ok: true, project, warnings };
}

export function downloadText(filename: string, text: string) {
  // В Android-сборке файл сохраняется через системный диалог «Сохранить как».
  const bridge = (window as unknown as { AndroidBridge?: { saveFile(name: string, text: string): void } }).AndroidBridge;
  if (bridge) {
    bridge.saveFile(filename, text);
    return;
  }
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
