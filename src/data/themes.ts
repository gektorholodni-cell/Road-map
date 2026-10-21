// Визуальные темы островов: палитры, подписи переходов и объекты сцен.
import type { ThemeId } from '../types';

export type PoiKind =
  | 'book'
  | 'table'
  | 'campfire'
  | 'tent'
  | 'tower'
  | 'device'
  | 'arena'
  | 'chest'
  | 'altar'
  | 'board'
  | 'npc'
  | 'crystal'
  | 'portal'
  | 'anvil';

export interface Theme {
  id: ThemeId;
  label: string;
  /** Цвета верхней поверхности, скал, свечения и акцента. */
  top: [string, string];
  rock: [string, string];
  glow: string;
  accent: string;
  /** Фон сцены острова: небо/вода/космос. */
  sceneSky: [string, string, string];
  /** Поверхность острова в сцене. */
  ground: [string, string];
  path: string;
  /** Текст перехода при входе. */
  travel: string;
  poiKinds: PoiKind[];
}

export const THEMES: Record<ThemeId, Theme> = {
  meadow: {
    id: 'meadow',
    label: 'Зелёный луг',
    top: ['#8fd16a', '#3f8a3a'],
    rock: ['#7a5a3c', '#2b1d14'],
    glow: '#ffcf6b',
    accent: '#e9a94a',
    sceneSky: ['#fbd38d', '#f59e6b', '#6b7fd7'],
    ground: ['#7fc25b', '#4f9a3d'],
    path: '#c9a46a',
    travel: 'Сквозь листву к костру лагеря',
    poiKinds: ['campfire', 'tent', 'book', 'tower', 'board', 'chest'],
  },
  architecture: {
    id: 'architecture',
    label: 'Чертежи и камень',
    top: ['#a9c96f', '#5f8a44'],
    rock: ['#9a8a74', '#3a322a'],
    glow: '#ffe08a',
    accent: '#d9b56a',
    sceneSky: ['#ffe2b0', '#d7a77e', '#5b6fb5'],
    ground: ['#a4c174', '#6f944e'],
    path: '#cdbf9f',
    travel: 'По светящемуся архитектурному мосту',
    poiKinds: ['table', 'book', 'board', 'anvil', 'npc', 'chest'],
  },
  mechanics: {
    id: 'mechanics',
    label: 'Механизмы',
    top: ['#a8a59a', '#6b685f'],
    rock: ['#6f6458', '#241f1a'],
    glow: '#ffb347',
    accent: '#ff9a3c',
    sceneSky: ['#f8c89a', '#b9876a', '#3e4a7a'],
    ground: ['#9d9a8c', '#706d61'],
    path: '#c7b48a',
    travel: 'Сквозь вращающиеся механизмы',
    poiKinds: ['arena', 'device', 'anvil', 'board', 'tower', 'chest'],
  },
  citadel: {
    id: 'citadel',
    label: 'Магический город',
    top: ['#7fb86a', '#3e6e44'],
    rock: ['#5f6a86', '#1c2034'],
    glow: '#7cc7ff',
    accent: '#6aa8ff',
    sceneSky: ['#c3b6ff', '#6c7fd6', '#1f2a5c'],
    ground: ['#6ea866', '#4b7d4c'],
    path: '#b9b4c9',
    travel: 'Через магические ворота города',
    poiKinds: ['device', 'tower', 'altar', 'board', 'anvil', 'npc'],
  },
  underwater: {
    id: 'underwater',
    label: 'Подводный мир',
    top: ['#3fd6c6', '#14707a'],
    rock: ['#2a5f7a', '#071d2e'],
    glow: '#5ef2ff',
    accent: '#3ee6d0',
    sceneSky: ['#0e7c9a', '#074a6e', '#021a33'],
    ground: ['#1f8f95', '#0f5f6e'],
    path: '#9fd8cf',
    travel: 'Погружение в подводное царство',
    poiKinds: ['chest', 'altar', 'crystal', 'npc', 'portal', 'device'],
  },
  ice: {
    id: 'ice',
    label: 'Ледяной мир',
    top: ['#f2fbff', '#a9d4ec'],
    rock: ['#7fa6c4', '#1f3550'],
    glow: '#9be7ff',
    accent: '#7fd6ff',
    sceneSky: ['#dff4ff', '#8fbde0', '#2b4a78'],
    ground: ['#e9f6fd', '#bfe0f2'],
    path: '#9cc9e4',
    travel: 'Сквозь снежную бурю',
    poiKinds: ['tower', 'crystal', 'device', 'board', 'npc', 'altar'],
  },
  sky: {
    id: 'sky',
    label: 'Небесное царство',
    top: ['#fff6dc', '#e8cf8f'],
    rock: ['#e6dcc8', '#8a7a62'],
    glow: '#fff1a8',
    accent: '#ffd36b',
    sceneSky: ['#fff7e0', '#ffd9a0', '#8fb6f0'],
    ground: ['#fbf3dc', '#ecdcae'],
    path: '#f3d27a',
    travel: 'Сквозь облака к небесному дворцу',
    poiKinds: ['altar', 'portal', 'board', 'book', 'tower', 'chest'],
  },
  cosmos: {
    id: 'cosmos',
    label: 'Космос',
    top: ['#8a5cff', '#3a1f7a'],
    rock: ['#3b2466', '#0b0620'],
    glow: '#e07bff',
    accent: '#5ef2ff',
    sceneSky: ['#2a0f55', '#120634', '#03010d'],
    ground: ['#4b2c8f', '#2c185c'],
    path: '#9c7bff',
    travel: 'Через звёздный портал в галактику',
    poiKinds: ['portal', 'crystal', 'device', 'altar', 'tower', 'npc'],
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

/** Подбор объекта сцены по смыслу задачи, иначе — по теме мира. */
export function poiKindFor(title: string, theme: ThemeId, index: number): PoiKind {
  const s = title.toLowerCase();
  const rules: Array<[RegExp, PoiKind]> = [
    [/тест|провер|баланс|сложност|производит|памят/, 'tower'],
    [/сохран|настро|состояни/, 'device'],
    [/прототип|механик|движени|перемещ|управлен|поворот|камер|действи|арен/, 'arena'],
    [/жанр|концепц|документ|описа|сформул|дизайн|аудитор|платформ/, 'book'],
    [/архитект|схем|структур|спроектир|план|этап/, 'table'],
    [/ресурс|модел|текстур|анимац|звук|предмет|наград|резервн/, 'chest'],
    [/релиз|публик|верси|опубликов/, 'altar'],
    [/интерфейс|меню|hud|экран|страниц|иконк|скриншот/, 'board'],
    [/риск|ошибк|обратн|отзыв|интерес/, 'npc'],
    [/портал|развит|следующ|дорожн/, 'portal'],
    [/инструмент|сборк|собрат|реализова|создать проект|git|репозитор/, 'anvil'],
  ];
  for (const [re, kind] of rules) if (re.test(s)) return kind;
  const kinds = THEMES[theme].poiKinds;
  return kinds[index % kinds.length];
}
