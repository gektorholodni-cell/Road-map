// Проект по умолчанию: «Сектор Ноль: от идеи до продаж».
// Данные лежат в default-project.json в формате экспорта приложения.
import type { Project } from '../types';
import { normalize } from '../storage/io';
import raw from './default-project.json';

export function buildDefaultProject(now = new Date().toISOString()): Project {
  const r = normalize(raw);
  if (!r.ok) throw new Error(`Проект по умолчанию повреждён: ${r.error}`);
  const p = r.project;
  return {
    ...p,
    id: `project-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
    session: { view: 'map', heroPos: {} },
  };
}
