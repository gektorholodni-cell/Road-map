import { describe, expect, it } from 'vitest';
import { buildSeedProject } from '../data/seed';
import { apply, type Action } from '../state/actions';
import { sync } from './sync';
import { isIslandComplete, isIslandUnlocked, islandProgress, islandTaskIds, taskState } from './progress';
import { exportProject, parseProject } from '../storage/io';
import type { GameEvent, Project } from '../types';

function run(p: Project, actions: Action[]) {
  const events: GameEvent[] = [];
  for (const a of actions) {
    const r = sync(p, apply(p, a));
    p = r.project;
    events.push(...r.events);
  }
  return { p, events };
}

const completeIsland = (p: Project, idx: number) =>
  run(
    p,
    islandTaskIds(p.islands[idx]).map((taskId) => ({ type: 'task/status', taskId, status: 'done' }) as Action),
  );

describe('seed', () => {
  it('has 8 islands with many tasks and valid dependencies', () => {
    const p = buildSeedProject();
    expect(p.islands).toHaveLength(8);
    expect(Object.keys(p.tasks).length).toBeGreaterThan(150);
    for (const t of Object.values(p.tasks)) for (const d of t.dependsOn) expect(p.tasks[d], `${t.id} -> ${d}`).toBeDefined();
  });
});

describe('dependencies and unlocking', () => {
  it('locks tasks with unmet deps and explains why', () => {
    const p = buildSeedProject();
    expect(taskState(p, p.tasks['i1-t01']).status).toBe('available');
    const s = taskState(p, p.tasks['i1-t02']);
    expect(s.status).toBe('locked');
    expect(s.reasons[0]).toContain('Сформулировать концепцию');
  });

  it('opens dependents after completion and reports them', () => {
    const { p, events } = run(buildSeedProject(), [{ type: 'task/status', taskId: 'i1-t01', status: 'done' }]);
    expect(taskState(p, p.tasks['i1-t02']).status).toBe('available');
    expect(events.some((e) => e.kind === 'tasks_unlocked')).toBe(true);
    expect(events.some((e) => e.kind === 'achievement' && e.achievementId === 'first-step')).toBe(true);
  });

  it('second island is locked until first is complete, then unlocks with bridge event', () => {
    let p = buildSeedProject();
    expect(isIslandUnlocked(p, p.islands[1])).toBe(false);
    expect(taskState(p, p.tasks['i2-t01']).reasons[0]).toContain('Остров закрыт');
    const r = completeIsland(p, 0);
    p = r.p;
    expect(isIslandComplete(p, p.islands[0])).toBe(true);
    expect(isIslandUnlocked(p, p.islands[1])).toBe(true);
    expect(r.events.filter((e) => e.kind === 'island_complete')).toHaveLength(1);
    expect(r.events.some((e) => e.kind === 'island_unlocked' && e.islandId === 'i2')).toBe(true);
    expect(p.unlocked['dreamer']).toBeDefined();
    expect(p.unlocked['perfectionist']).toBeDefined();
    expect(p.unlocked['no-return']).toBeDefined();
  });

  it('optional tasks do not block completion; skipped is not done', () => {
    let p = buildSeedProject();
    p = completeIsland(p, 0).p;
    const optional = islandTaskIds(p.islands[1]).filter((id) => !p.tasks[id].required);
    expect(optional.length).toBeGreaterThan(0);
    const required = islandTaskIds(p.islands[1]).filter((id) => p.tasks[id].required);
    p = run(p, required.map((taskId) => ({ type: 'task/status', taskId, status: 'done' }) as Action)).p;
    expect(isIslandComplete(p, p.islands[1])).toBe(true);
    p = run(p, [{ type: 'task/status', taskId: optional[0], status: 'skipped' }]).p;
    const prog = islandProgress(p, p.islands[1]);
    expect(prog.skipped).toBe(1);
    expect(prog.done).toBe(required.length);
  });

  it('achievements are not granted twice; reopening counts for no-return', () => {
    let p = buildSeedProject();
    let r = run(p, [{ type: 'task/status', taskId: 'i1-t01', status: 'done' }]);
    const firstAt = r.p.unlocked['first-step'].unlockedAt;
    r = run(r.p, [
      { type: 'task/status', taskId: 'i1-t01', status: 'todo' },
      { type: 'task/status', taskId: 'i1-t01', status: 'done' },
    ]);
    expect(r.events.filter((e) => e.kind === 'achievement' && e.achievementId === 'first-step')).toHaveLength(0);
    expect(r.p.unlocked['first-step'].unlockedAt).toBe(firstAt);
    expect(r.p.stats.reopened['i1']).toBe(1);
    p = completeIsland(r.p, 0).p;
    expect(p.unlocked['no-return']).toBeUndefined();
  });

  it('release publishing depends on testing tasks of the ice island', () => {
    const p = buildSeedProject();
    const publish = Object.values(p.tasks).find((t) => t.title.startsWith('Опубликовать игру'))!;
    expect(publish.dependsOn).toContain('i6-t24');
  });
});

describe('editing', () => {
  it('adds, moves and deletes tasks, cleaning dependencies', () => {
    let p = buildSeedProject();
    const stage = p.islands[0].chapters[0].stages[0].id;
    p = apply(p, { type: 'task/add', stageId: stage, title: 'Своя задача' });
    const id = p.islands[0].chapters[0].stages[0].taskIds.at(-1)!;
    expect(p.tasks[id].title).toBe('Своя задача');
    p = apply(p, { type: 'task/move', taskId: id, toStageId: stage, index: 0 });
    expect(p.islands[0].chapters[0].stages[0].taskIds[0]).toBe(id);
    p = apply(p, { type: 'task/delete', taskId: 'i1-t01' });
    expect(p.tasks['i1-t02'].dependsOn).not.toContain('i1-t01');
  });
});

describe('import / export', () => {
  it('round-trips a project', () => {
    const p = completeIsland(buildSeedProject(), 0).p;
    const r = parseProject(exportProject(p));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.keys(r.project.tasks)).toHaveLength(Object.keys(p.tasks).length);
      expect(r.project.unlocked['dreamer']).toBeDefined();
    }
  });

  it('rejects broken JSON, foreign files and newer schema', () => {
    expect(parseProject('{oops').ok).toBe(false);
    expect(parseProject('{"hello":1}').ok).toBe(false);
    const r = parseProject(JSON.stringify({ ...buildSeedProject(), schemaVersion: 99 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('новой версией');
  });
});
