// Типизированные модели данных Islands Roadmap.
// Иерархия: Проект → Остров → Глава → Этап → Задача → Подзадача.

export const SCHEMA_VERSION = 1;
export const APP_ID = 'islands-roadmap';

/** Статус, который хранится в задаче и меняется пользователем. */
export type StoredStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'skipped';

/** Итоговый статус с учётом зависимостей и блокировки острова. */
export type TaskStatus = 'locked' | 'available' | 'in_progress' | 'review' | 'done' | 'skipped';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type ThemeId =
  | 'meadow'
  | 'architecture'
  | 'mechanics'
  | 'citadel'
  | 'underwater'
  | 'ice'
  | 'sky'
  | 'cosmos';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  islandId: string;
  chapterId: string;
  stageId: string;
  title: string;
  description: string;
  criteria: string;
  status: StoredStatus;
  priority: Priority;
  /** Обязательная задача влияет на прохождение острова. */
  required: boolean;
  /** Идентификаторы задач, которые нужно завершить (или пропустить) прежде. */
  dependsOn: string[];
  /** Пользовательские достижения, выдаваемые за эту задачу. */
  achievementIds: string[];
  notes: string;
  createdAt: string;
  dueDate?: string;
  completedAt?: string;
  subtasks: Subtask[];
}

export interface Stage {
  id: string;
  title: string;
  taskIds: string[];
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  stages: Stage[];
}

export interface IslandMapPlacement {
  x: number;
  y: number;
  scale: number;
}

export interface Island {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  theme: ThemeId;
  completionCriteria: string;
  chapters: Chapter[];
  /** sequential — открывается после предыдущего острова; always — открыт всегда. */
  unlockRule: 'sequential' | 'always';
  /** Ручное открытие для свободного исследования (отдельно от прохождения). */
  manuallyUnlocked: boolean;
  /** Когда остров открылся по ходу прохождения. После открытия он не закрывается снова. */
  unlockedAt?: string;
  completedAt?: string;
  /** Остров уже проходили — повторное завершение не празднуется второй раз. */
  everCompleted?: boolean;
  map: IslandMapPlacement;
}

export type AchievementCondition =
  | { type: 'tasks_done'; count: number }
  | { type: 'island_complete'; islandId: string }
  | { type: 'all_islands' }
  | { type: 'perfectionist' }
  | { type: 'no_return' }
  | { type: 'subtasks_done'; count: number }
  | { type: 'notes'; count: number }
  | { type: 'manual_unlock' }
  | { type: 'task_done'; taskIds: string[] };

export type AchievementIcon =
  | 'footprints'
  | 'compass'
  | 'ruler'
  | 'cog'
  | 'castle'
  | 'waves'
  | 'snowflake'
  | 'sun'
  | 'orbit'
  | 'gem'
  | 'shield'
  | 'flame'
  | 'scroll'
  | 'key'
  | 'star'
  | 'trophy'
  | 'feather'
  | 'mountain';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  /** Человекочитаемое условие получения. */
  conditionText: string;
  condition: AchievementCondition;
  icon: AchievementIcon;
  rarity: Rarity;
  custom?: boolean;
}

export interface UnlockedAchievement {
  unlockedAt: string;
  /** Для «Перфекциониста» и «Без возврата» — остров, на котором получено. */
  islandId?: string;
}

export interface Settings {
  soundEnabled: boolean;
  /** auto — следовать prefers-reduced-motion. */
  reducedMotion: 'auto' | 'on' | 'off';
  /** Разрешает вручную открывать острова для свободного исследования. */
  allowManualUnlock: boolean;
  showMinimap: boolean;
}

export interface HeroPos {
  x: number;
  y: number;
}

export interface SessionState {
  view: 'map' | 'island';
  islandId?: string;
  heroPos: Record<string, HeroPos>;
}

export interface Project {
  app: typeof APP_ID;
  schemaVersion: number;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  islands: Island[];
  tasks: Record<string, Task>;
  achievements: AchievementDef[];
  unlocked: Record<string, UnlockedAchievement>;
  stats: {
    /** Сколько раз завершённые задачи острова открывались заново. */
    reopened: Record<string, number>;
  };
  settings: Settings;
  session: SessionState;
}

/** События, которые порождает система прогресса для интерфейса. */
export type GameEvent =
  | { kind: 'achievement'; achievementId: string; id: string }
  | { kind: 'island_complete'; islandId: string; id: string }
  | { kind: 'island_unlocked'; islandId: string; id: string }
  | { kind: 'tasks_unlocked'; taskIds: string[]; id: string }
  | { kind: 'toast'; text: string; tone?: 'info' | 'success' | 'warn' | 'error'; id: string };
