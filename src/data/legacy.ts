// Распознаёт старый проект (Crab Castle или прежний шаблон «Моя игра»),
// чтобы один раз спросить пользователя, оставить его или заменить на «Сектор Ноль».
import type { Project } from '../types';

/** Названия островов прежнего стартового шаблона. */
const OLD_TEMPLATE_ISLANDS = [
  'Зелёный остров',
  'Остров чертежей',
  'Остров механизмов',
  'Магический город',
  'Подводное царство',
  'Ледяной бастион',
  'Небесное царство',
  'Космическая цитадель',
];

const CRAB = /crab|краб/i;
const NEW_DEFAULT = /сектор\s*ноль/i;

export function isLegacyProject(p: Project): boolean {
  if (NEW_DEFAULT.test(p.name)) return false;
  const texts = [p.name, ...p.islands.flatMap((i) => [i.name, i.subtitle, i.description])];
  if (texts.some((s) => CRAB.test(s ?? ''))) return true;
  const names = new Set(p.islands.map((i) => i.name));
  return OLD_TEMPLATE_ISLANDS.filter((n) => names.has(n)).length >= 5;
}

const CHOICE_KEY = 'islands-roadmap-legacy-choice';

/** Пользователь уже ответил на вопрос про этот проект («Оставить»)? */
export function legacyChoiceMade(p: Project): boolean {
  try {
    return localStorage.getItem(CHOICE_KEY) === p.id;
  } catch {
    return false;
  }
}

export function rememberLegacyChoice(p: Project): void {
  try {
    localStorage.setItem(CHOICE_KEY, p.id);
  } catch {
    /* хранилище недоступно — спросим ещё раз в следующий раз */
  }
}

/**
 * У тех, кто уже импортировал «Сектор Ноль» со старыми названиями островов
 * («Зелёный остров» и т.д.), переименовываем острова в объекты НИИ.
 * Меняется только название, и только если оно совпадает со старым один в один.
 */
export function renameSectorIslands(p: Project, names: string[]): Project {
  if (!NEW_DEFAULT.test(p.name)) return p;
  let changed = false;
  const islands = p.islands.map((i, k) => {
    if (OLD_TEMPLATE_ISLANDS[k] === i.name && names[k]) {
      changed = true;
      return { ...i, name: names[k] };
    }
    return i;
  });
  return changed ? { ...p, islands } : p;
}
