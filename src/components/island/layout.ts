// Раскладка сцены острова: зоны глав, точки интереса задач, проходимая область.
import type { Island, Project } from '../../types';
import { poiKindFor, type PoiKind } from '../../data/themes';

export const SCENE_W = 2400;
export const SCENE_H = 1500;
export const WALK = { cx: 1200, cy: 820, rx: 1060, ry: 560 };

export interface PoiLayout {
  taskId: string;
  x: number;
  y: number;
  kind: PoiKind;
  chapterId: string;
}

export interface ZoneLayout {
  chapterId: string;
  x: number;
  y: number;
  title: string;
  index: number;
}

export interface SceneLayout {
  pois: PoiLayout[];
  zones: ZoneLayout[];
  spawn: { x: number; y: number };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/** Возвращает точку внутри проходимого эллипса (с отступом от края). */
export function clampToWalk(x: number, y: number, margin = 0.94) {
  const dx = (x - WALK.cx) / (WALK.rx * margin);
  const dy = (y - WALK.cy) / (WALK.ry * margin);
  const d = Math.hypot(dx, dy);
  if (d <= 1) return { x, y };
  return { x: WALK.cx + (dx / d) * WALK.rx * margin, y: WALK.cy + (dy / d) * WALK.ry * margin };
}

export function buildLayout(p: Project, island: Island): SceneLayout {
  const chapters = island.chapters;
  const n = Math.max(1, chapters.length);
  const zoneW = (WALK.rx * 2 * 0.86) / n;
  const pois: PoiLayout[] = [];
  const zones: ZoneLayout[] = [];
  let k = 0;
  chapters.forEach((ch, ci) => {
    const zx = WALK.cx - WALK.rx * 0.86 + zoneW * (ci + 0.5);
    const ids = ch.stages.flatMap((s) => s.taskIds).filter((id) => p.tasks[id]);
    const cols = Math.max(1, Math.min(3, Math.round(zoneW / 190)));
    const colW = Math.min(200, zoneW / cols);
    const rows = Math.ceil(ids.length / cols) || 1;
    const rowH = Math.min(160, 760 / rows);
    const top = WALK.cy - (rows - 1) * rowH * 0.5 + 40;
    zones.push({ chapterId: ch.id, x: zx, y: top - rowH * 0.5 - 60, title: ch.title, index: ci });
    ids.forEach((id, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      // Шахматное смещение рядов и лёгкий детерминированный разброс — чтобы не было «таблицы».
      const jx = (hash(id) - 0.5) * 40 + (row % 2 ? colW * 0.25 : -colW * 0.1);
      const jy = (hash(id + 'y') - 0.5) * 34;
      const pos = clampToWalk(zx + (col - (cols - 1) / 2) * colW + jx, top + row * rowH + jy, 0.86);
      pois.push({ taskId: id, x: pos.x, y: pos.y, kind: poiKindFor(p.tasks[id].title, island.theme, k++), chapterId: ch.id });
    });
  });
  for (const z of zones) {
    const c = clampToWalk(z.x, z.y, 0.9);
    z.x = c.x;
    z.y = c.y;
  }
  return { pois, zones, spawn: { x: WALK.cx, y: WALK.cy + WALK.ry * 0.72 } };
}
