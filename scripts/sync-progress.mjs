#!/usr/bin/env node
// Переносит отметки из ROADMAP.md репозитория игры в public/progress.json сайта.
// Запуск: node scripts/sync-progress.mjs путь/к/ROADMAP.md [источник]
// Файл перезаписывается, только если отметки изменились.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parseRoadmapMd } from './roadmap-md.mjs';

const [, , mdPath, source = 'gektorholodni-cell/Crab-castle: ROADMAP.md'] = process.argv;
if (!mdPath) {
  console.error('Укажите путь к ROADMAP.md');
  process.exit(1);
}
const tasks = parseRoadmapMd(readFileSync(mdPath, 'utf8'));
const out = new URL('../public/progress.json', import.meta.url);
const prev = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : null;
const same = prev && JSON.stringify(prev.tasks) === JSON.stringify(tasks);
if (same) {
  console.log('Без изменений:', Object.keys(tasks).length, 'шагов');
  process.exit(0);
}
writeFileSync(out, JSON.stringify({ updatedAt: new Date().toISOString(), source, tasks }, null, 2) + '\n');
const done = Object.values(tasks).filter((s) => s === 'done').length;
console.log(`Обновлено: ${done} из ${Object.keys(tasks).length} шагов выполнено`);
