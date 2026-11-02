// Визуальные темы объектов НИИ «Тишина» (в коде по-прежнему «сектора»): палитры, подписи переходов и объекты сцен.
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
  /** Фон сцены сектора: небо/вода/космос. */
  sceneSky: [string, string, string];
  /** Поверхность сектора в сцене. */
  ground: [string, string];
  path: string;
  /** Текст перехода при входе. */
  travel: string;
  poiKinds: PoiKind[];
}

export const THEMES: Record<ThemeId, Theme> = {
  meadow: {
    id: 'meadow',
    label: 'Проходная',
    top: ['#5d605a', '#3a3d39'],
    rock: ['#5a5650', '#1a1917'],
    glow: '#ffb347',
    accent: '#ffb347',
    sceneSky: ['#3a4044', '#20262a', '#0b0e10'],
    ground: ['#55584f', '#3e413b'],
    path: '#6e705f',
    travel: 'Через КПП на территорию НИИ «Тишина»',
    poiKinds: ['campfire', 'tent', 'book', 'tower', 'board', 'chest'],
  },
  architecture: {
    id: 'architecture',
    label: 'Чертёжное бюро',
    top: ['#62655d', '#3d4039'],
    rock: ['#5c5852', '#1b1a18'],
    glow: '#ffd27a',
    accent: '#ffd27a',
    sceneSky: ['#3c4246', '#22282c', '#0c0f11'],
    ground: ['#5a5d54', '#42453e'],
    path: '#77796a',
    travel: 'По коридору к чертёжному бюро',
    poiKinds: ['table', 'book', 'board', 'anvil', 'npc', 'chest'],
  },
  mechanics: {
    id: 'mechanics',
    label: 'Лаборатория',
    top: ['#575c52', '#363a33'],
    rock: ['#544f48', '#181715'],
    glow: '#a8f07a',
    accent: '#a8f07a',
    sceneSky: ['#3a4438', '#1f2a20', '#0a0f0a'],
    ground: ['#525a4c', '#3b4237'],
    path: '#6c7560',
    travel: 'Сквозь пар и трубы лаборатории',
    poiKinds: ['arena', 'device', 'anvil', 'board', 'tower', 'chest'],
  },
  citadel: {
    id: 'citadel',
    label: 'Сектор Ноль',
    top: ['#5a5653', '#363230'],
    rock: ['#57504b', '#1a1514'],
    glow: '#e0453a',
    accent: '#ff6b5a',
    sceneSky: ['#46302e', '#241718', '#0d0808'],
    ground: ['#55504b', '#3d3936'],
    path: '#706860',
    travel: 'Лифт вниз, на минус первый этаж',
    poiKinds: ['device', 'tower', 'altar', 'board', 'anvil', 'npc'],
  },
  underwater: {
    id: 'underwater',
    label: 'Офисы с телевизорами',
    top: ['#4f5a5e', '#2f383b'],
    rock: ['#4a5256', '#121618'],
    glow: '#9fe8ff',
    accent: '#9fe8ff',
    sceneSky: ['#2a3c44', '#162228', '#070b0e'],
    ground: ['#4b565a', '#353e42'],
    path: '#647278',
    travel: 'На шум помех из тёмных офисов',
    poiKinds: ['chest', 'altar', 'crystal', 'npc', 'portal', 'device'],
  },
  ice: {
    id: 'ice',
    label: 'Карантин',
    top: ['#8a9296', '#5e666a'],
    rock: ['#626a6e', '#1c2023'],
    glow: '#cfe8ff',
    accent: '#cfe8ff',
    sceneSky: ['#5a6870', '#2c363c', '#0e1214'],
    ground: ['#7d868a', '#5f686c'],
    path: '#9aa3a6',
    travel: 'Через снег и колючую проволоку карантина',
    poiKinds: ['tower', 'crystal', 'device', 'board', 'npc', 'altar'],
  },
  sky: {
    id: 'sky',
    label: 'Радиоцентр',
    top: ['#5d5a58', '#3a3735'],
    rock: ['#58534f', '#1a1816'],
    glow: '#ff7a5a',
    accent: '#ff8a5a',
    sceneSky: ['#4a3a3a', '#251c1e', '#0c090a'],
    ground: ['#57534f', '#403d3a'],
    path: '#736c66',
    travel: 'На красные огни радиомачты',
    poiKinds: ['altar', 'portal', 'board', 'book', 'tower', 'chest'],
  },
  cosmos: {
    id: 'cosmos',
    label: 'Бункер',
    top: ['#4d524b', '#2e322c'],
    rock: ['#4a4c46', '#121311'],
    glow: '#a8f07a',
    accent: '#a8f07a',
    sceneSky: ['#283028', '#141914', '#050705'],
    ground: ['#4a4f47', '#353a33'],
    path: '#646b5e',
    travel: 'Вниз по лестнице в старый бункер',
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
