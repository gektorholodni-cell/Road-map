import { describe, expect, it } from 'vitest';
import { currentPoll, mergePoll, parsePoll, tally, type Poll } from './polls';

const base: Poll = {
  id: 'v-test-1',
  question: 'Какой остров дальше?',
  options: ['Лес', 'Пустыня', 'Лёд'],
  by: { id: 'p-author', name: 'Айдын', color: '#ffd25b' },
  at: 1000,
  votes: {},
};

describe('голосования', () => {
  it('отбрасывает испорченные данные из сети', () => {
    expect(parsePoll(null)).toBeNull();
    expect(parsePoll({ ...base, options: ['один'] })).toBeNull();
    expect(parsePoll({ ...base, id: '<script>' })).toBeNull();
    const p = parsePoll({ ...base, votes: { 'p-a': { option: 7, at: 1, name: 'x', color: '#fff' }, 'p-b': { option: 1, at: 2, name: 'Друг', color: 'red' } } });
    expect(Object.keys(p!.votes)).toEqual(['p-b']);
    expect(p!.votes['p-b'].color).toBe('#9aa6c8');
  });

  it('сливает копии: у каждого игрока побеждает последний голос, завершение — самое раннее', () => {
    const a: Poll = { ...base, votes: { 'p-1': { option: 0, at: 5, name: 'A', color: '#fff' } } };
    const b: Poll = { ...base, closedAt: 50, votes: { 'p-1': { option: 2, at: 9, name: 'A', color: '#fff' }, 'p-2': { option: 1, at: 3, name: 'B', color: '#000' } } };
    const m = mergePoll(a, { ...b });
    expect(m.votes['p-1'].option).toBe(2);
    expect(m.votes['p-2'].option).toBe(1);
    expect(m.closedAt).toBe(50);
    expect(mergePoll(b, a)).toEqual(m);
    expect(mergePoll({ ...m, closedAt: 40 }, m).closedAt).toBe(40);
  });

  it('считает голоса и лидеров', () => {
    const p: Poll = {
      ...base,
      votes: {
        a: { option: 1, at: 1, name: '', color: '' },
        b: { option: 1, at: 1, name: '', color: '' },
        c: { option: 2, at: 1, name: '', color: '' },
      },
    };
    expect(tally(p)).toEqual({ counts: [0, 2, 1], total: 3, leaders: [1] });
    expect(tally(base).leaders).toEqual([]);
  });

  it('показывает идущее голосование, а после него — свежие итоги, пока их не закрыли', () => {
    const closed: Poll = { ...base, id: 'v-old', closedAt: 2000 };
    const active: Poll = { ...base, id: 'v-new', at: 3000 };
    expect(currentPoll({ polls: [closed, active], minimized: {}, dismissed: {} }, 4000)?.id).toBe('v-new');
    expect(currentPoll({ polls: [closed], minimized: {}, dismissed: {} }, 4000)?.id).toBe('v-old');
    expect(currentPoll({ polls: [closed], minimized: {}, dismissed: { 'v-old': true } }, 4000)).toBeNull();
  });
});
