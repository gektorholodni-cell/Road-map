import { describe, expect, it } from 'vitest';
import { buildDefaultProject } from './defaultProject';
import { isLegacyProject } from './legacy';
import { buildSeedProject } from '../test/legacyTemplate';

describe('default project «Сектор Ноль»', () => {
  it('loads 8 islands and 99 tasks with valid dependencies', () => {
    const p = buildDefaultProject();
    expect(p.name).toContain('Сектор Ноль');
    expect(p.islands).toHaveLength(8);
    expect(Object.keys(p.tasks)).toHaveLength(99);
    for (const t of Object.values(p.tasks)) for (const d of t.dependsOn) expect(p.tasks[d], `${t.id} -> ${d}`).toBeDefined();
  });

  it('is not treated as an old project', () => {
    expect(isLegacyProject(buildDefaultProject())).toBe(false);
  });
});

describe('old project detection', () => {
  it('flags the previous template', () => {
    expect(isLegacyProject(buildSeedProject())).toBe(true);
  });

  it('flags a Crab Castle project', () => {
    const p = { ...buildDefaultProject(), name: 'Crab Castle' };
    expect(isLegacyProject(p)).toBe(true);
  });

  it('does not flag an unrelated custom project', () => {
    const p = buildDefaultProject();
    const custom = { ...p, name: 'Моя RPG', islands: p.islands.map((i, k) => ({ ...i, name: `Сектор ${k + 1}` })) };
    expect(isLegacyProject(custom)).toBe(false);
  });
});

describe('renaming islands of an imported «Сектор Ноль»', () => {
  it('renames only untouched old names', async () => {
    const { renameSectorIslands } = await import('./legacy');
    const p = buildDefaultProject();
    const old = { ...p, islands: p.islands.map((i, k) => (k === 0 ? { ...i, name: 'Зелёный остров' } : k === 1 ? { ...i, name: 'Мой остров' } : i)) };
    const r = renameSectorIslands(old, p.islands.map((i) => i.name));
    expect(r.islands[0].name).toBe('Проходная');
    expect(r.islands[1].name).toBe('Мой остров');
  });
});

describe('progress from the game repo', () => {
  it('only moves tasks forward and only in «Сектор Ноль»', async () => {
    const { progressUpdates } = await import('../systems/gameProgress');
    const p = buildDefaultProject();
    const gp = { updatedAt: 'x', tasks: { 'i4-t06': 'done', 'i1-t01': 'todo', 'i4-t10': 'in_progress', 'nope-t1': 'done' } as const };
    expect(progressUpdates(p, gp)).toEqual([
      { taskId: 'i4-t06', status: 'done' },
      { taskId: 'i4-t10', status: 'in_progress' },
    ]);
    expect(progressUpdates({ ...p, name: 'Другая игра' }, gp)).toEqual([]);
  });
});
