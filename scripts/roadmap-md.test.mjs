import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { makeRoadmapMd, parseRoadmapMd } from './roadmap-md.mjs';

describe('ROADMAP.md of the game repo', () => {
  it('round-trips statuses of all 99 steps', () => {
    const p = JSON.parse(readFileSync(new URL('../src/data/default-project.json', import.meta.url), 'utf8'));
    const tasks = parseRoadmapMd(makeRoadmapMd(p));
    expect(Object.keys(tasks)).toHaveLength(99);
    for (const [id, t] of Object.entries(p.tasks)) expect(tasks[id], id).toBe(t.status);
  });

  it('reads markers written by hand', () => {
    const md = ['- [x] `i4-t06` Монстр хватает', '- [ ] `i4-t07` Экран смерти (в работе)', '* [X] `i4-t08` Звуки', '- [ ] `i4-t09` Лифт (на проверке)', '- [ ] `i4-t10` Сборка', '- [x] без кода'].join('\n');
    expect(parseRoadmapMd(md)).toEqual({ 'i4-t06': 'done', 'i4-t07': 'in_progress', 'i4-t08': 'done', 'i4-t09': 'review', 'i4-t10': 'todo' });
  });
});
