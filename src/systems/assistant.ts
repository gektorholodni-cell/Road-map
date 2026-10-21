// Помощник по планированию. Сейчас работает ЛОКАЛЬНО на правилах и шаблонах —
// никакой нейросети здесь нет. Интерфейс AssistantProvider позволяет позже
// подключить настоящий AI (например, через свой сервер), не меняя интерфейс.
import type { Project, Task } from '../types';
import { currentIsland, dependents, getIsland, isIslandUnlocked, islandTasks, taskState } from './progress';

export interface Suggestion {
  taskId: string;
  reason: string;
}

export interface Gap {
  id: string;
  topic: string;
  why: string;
  suggestedTitle: string;
  suggestedIslandId?: string;
}

export interface AssistantProvider {
  readonly name: string;
  readonly isAI: boolean;
  nextSteps(p: Project): Suggestion[];
  explainDependencies(p: Project, taskId: string): string[];
  splitTask(task: Task): string[];
  suggestCriteria(task: Task): string;
  findGaps(p: Project): Gap[];
  planSummary(p: Project): string[];
}

const PRIORITY_WEIGHT = { critical: 4, high: 3, medium: 2, low: 1 } as const;

type Category = 'design' | 'build' | 'test' | 'content' | 'release' | 'research' | 'generic';

function categorize(title: string): Category {
  const s = title.toLowerCase();
  if (/тест|провер|баланс|производит|памят/.test(s)) return 'test';
  if (/опубликов|релиз|сборк|верси|страниц|метадан/.test(s)) return 'release';
  if (/модел|текстур|анимац|звук|уров|контент|ресурс|предмет/.test(s)) return 'content';
  if (/реализ|созда|добав|настро|собрат/.test(s)) return 'build';
  if (/определ|описа|сформулир|спроектир|выбрать|составить|подготовить/.test(s)) return 'design';
  if (/собрать обратн|изучить|интерес/.test(s)) return 'research';
  return 'generic';
}

const SPLIT: Record<Category, string[]> = {
  design: ['Собрать варианты и примеры', 'Выписать плюсы и минусы каждого варианта', 'Принять решение и записать причину', 'Показать решение кому-то со стороны'],
  build: ['Сделать минимальную рабочую версию', 'Подключить к остальным системам', 'Обработать ошибочные случаи', 'Проверить вручную по критерию завершения', 'Закоммитить и описать изменения'],
  test: ['Составить список проверок (тест-кейсы)', 'Пройти проверки и записать результат', 'Завести записи о найденных проблемах', 'Повторить проверку после исправлений'],
  content: ['Составить список нужных элементов', 'Сделать или подобрать первый вариант', 'Встроить в игру и посмотреть в контексте', 'Доработать по замечаниям', 'Проверить лицензии и ссылки'],
  release: ['Составить чек-лист требований', 'Подготовить материалы', 'Проверить на чистом окружении', 'Зафиксировать версию и дату'],
  research: ['Определить, какие вопросы нужно прояснить', 'Собрать данные (отзывы, статистику)', 'Сгруппировать выводы', 'Записать решения и следующие шаги'],
  generic: ['Уточнить, что именно нужно сделать', 'Сделать первый вариант', 'Проверить результат по критерию', 'Записать итог в заметки'],
};

const CRITERIA: Record<Category, (t: string) => string> = {
  design: (t) => `Решение по задаче «${t}» записано в документе вместе с причиной выбора, и его понимает человек вне проекта.`,
  build: (t) => `«${t}» работает в сборке без ошибок в консоли и проверено вручную по основному сценарию.`,
  test: (t) => `Все проверки по «${t}» пройдены, найденные проблемы записаны с шагами воспроизведения и приоритетом.`,
  content: (t) => `Материалы по «${t}» встроены в игру, проверены в контексте и не содержат временных заглушек.`,
  release: (t) => `«${t}» выполнено по чек-листу площадки, результат проверен на чистом окружении.`,
  research: (t) => `По «${t}» есть короткий отчёт с выводами и списком решений.`,
  generic: (t) => `Результат «${t}» можно показать и проверить, итог записан в заметках.`,
};

const GAP_RULES: Array<{ id: string; re: RegExp; topic: string; why: string; title: string; theme: string }> = [
  { id: 'save', re: /сохранен/, topic: 'Сохранения', why: 'Без продуманных сохранений игроки теряют прогресс.', title: 'Спроектировать систему сохранений', theme: 'architecture' },
  { id: 'tests', re: /тест|провер/, topic: 'Тестирование', why: 'Без проверок ошибки найдут игроки.', title: 'Провести функциональное тестирование', theme: 'ice' },
  { id: 'perf', re: /производител/, topic: 'Производительность', why: 'Игра должна держать целевой FPS на минимальном железе.', title: 'Проверить производительность', theme: 'ice' },
  { id: 'backup', re: /резервн/, topic: 'Резервные копии', why: 'Потеря проекта — самый дорогой риск.', title: 'Настроить резервное копирование проекта', theme: 'architecture' },
  { id: 'license', re: /лиценз/, topic: 'Лицензии', why: 'Чужие ресурсы без лицензии могут заблокировать релиз.', title: 'Проверить лицензии ресурсов', theme: 'underwater' },
  { id: 'feedback', re: /обратн.. связ|отзыв/, topic: 'Обратная связь', why: 'Взгляд со стороны находит проблемы, которые вы не видите.', title: 'Собрать обратную связь от игроков', theme: 'ice' },
  { id: 'tutorial', re: /обучени/, topic: 'Обучение', why: 'Новый игрок должен понять игру без подсказок.', title: 'Проверить понятность обучения', theme: 'ice' },
  { id: 'audio', re: /звук/, topic: 'Звук', why: 'Звук сильно влияет на ощущение от игры.', title: 'Подготовить звуковые ресурсы', theme: 'underwater' },
  { id: 'settings', re: /настрой/, topic: 'Настройки', why: 'Игрокам нужно управлять графикой, звуком и управлением.', title: 'Добавить настройки игры', theme: 'citadel' },
  { id: 'a11y', re: /доступност/, topic: 'Доступность', why: 'Субтитры, контраст и переназначение клавиш расширяют аудиторию.', title: 'Проверить доступность важных функций', theme: 'ice' },
  { id: 'l10n', re: /локализ|перевод|язык/, topic: 'Локализация', why: 'Если игра выйдет на нескольких языках, тексты нужно готовить к переводу заранее.', title: 'Подготовить тексты игры к локализации', theme: 'underwater' },
  { id: 'analytics', re: /аналитик|метрик/, topic: 'Аналитика', why: 'После релиза важно понимать, где игроки бросают игру.', title: 'Определить ключевые метрики и способ их сбора', theme: 'cosmos' },
  { id: 'marketing', re: /маркетинг|продвиж|сообществ|трейлер/, topic: 'Продвижение', why: 'Об игре должны узнать до релиза.', title: 'Составить план продвижения игры', theme: 'sky' },
];

export const localAssistant: AssistantProvider = {
  name: 'Локальные шаблоны',
  isAI: false,

  nextSteps(p) {
    const cur = currentIsland(p);
    const candidates = Object.values(p.tasks).filter((t) => {
      const island = getIsland(p, t.islandId);
      if (!island || !isIslandUnlocked(p, island)) return false;
      const s = taskState(p, t).status;
      return s === 'available' || s === 'in_progress' || s === 'review';
    });
    const score = (t: Task) => {
      const s = taskState(p, t).status;
      return (
        (s === 'review' ? 30 : s === 'in_progress' ? 20 : 0) +
        PRIORITY_WEIGHT[t.priority] * 4 +
        (t.required ? 6 : 0) +
        dependents(p, t.id).length * 3 +
        (cur && t.islandId === cur.id ? 8 : 0)
      );
    };
    return candidates
      .sort((a, b) => score(b) - score(a))
      .slice(0, 5)
      .map((t) => {
        const s = taskState(p, t).status;
        const opens = dependents(p, t.id).length;
        const parts: string[] = [];
        if (s === 'review') parts.push('ждёт проверки — её легко закрыть');
        else if (s === 'in_progress') parts.push('уже в работе — лучше довести до конца');
        if (t.priority === 'critical' || t.priority === 'high') parts.push(`приоритет ${t.priority === 'critical' ? 'критический' : 'высокий'}`);
        if (opens > 0) parts.push(`откроет задач: ${opens}`);
        if (t.required) parts.push('обязательна для прохождения острова');
        return { taskId: t.id, reason: parts.join(', ') || 'доступна сейчас' };
      });
  },

  explainDependencies(p, taskId) {
    const t = p.tasks[taskId];
    if (!t) return [];
    const lines: string[] = [];
    const st = taskState(p, t);
    if (st.islandLocked) lines.push(st.reasons[0]);
    // Полная цепочка незавершённых требований.
    const seen = new Set<string>();
    const walk = (id: string, depth: number) => {
      const d = p.tasks[id];
      if (!d || seen.has(id)) return;
      seen.add(id);
      if (d.status === 'done' || d.status === 'skipped') return;
      lines.push(`${'  '.repeat(depth)}• Нужно завершить «${d.title}»${d.islandId !== t.islandId ? ` (${getIsland(p, d.islandId)?.name})` : ''}`);
      d.dependsOn.forEach((x) => walk(x, depth + 1));
    };
    t.dependsOn.forEach((id) => walk(id, 0));
    if (t.dependsOn.length === 0) lines.push('У задачи нет зависимостей.');
    else if (seen.size > 0 && !lines.some((l) => l.includes('Нужно'))) lines.push('Все требования выполнены.');
    const opens = dependents(p, taskId);
    if (opens.length) lines.push(`После выполнения станут ближе к открытию: ${opens.map((o) => `«${o.title}»`).join(', ')}.`);
    return lines;
  },

  splitTask(task) {
    const existing = new Set(task.subtasks.map((s) => s.title.toLowerCase()));
    return SPLIT[categorize(task.title)].filter((s) => !existing.has(s.toLowerCase()));
  },

  suggestCriteria(task) {
    return CRITERIA[categorize(task.title)](task.title);
  },

  findGaps(p) {
    const titles = Object.values(p.tasks).map((t) => `${t.title} ${t.description}`.toLowerCase());
    return GAP_RULES.filter((r) => !titles.some((t) => r.re.test(t))).map((r) => ({
      id: r.id,
      topic: r.topic,
      why: r.why,
      suggestedTitle: r.title,
      suggestedIslandId: p.islands.find((i) => i.theme === r.theme)?.id ?? p.islands[0]?.id,
    }));
  },

  planSummary(p) {
    const lines: string[] = [];
    for (const island of p.islands) {
      const tasks = islandTasks(p, island);
      const done = tasks.filter((t) => t.status === 'done').length;
      const st = island.completedAt ? 'завершён' : isIslandUnlocked(p, island) ? 'в работе' : 'впереди';
      lines.push(`${island.subtitle || island.name}: ${done}/${tasks.length} — ${st}`);
    }
    const cur = currentIsland(p);
    if (cur) {
      const blockers = islandTasks(p, cur).filter((t) => t.required && t.status !== 'done' && t.status !== 'skipped' && dependents(p, t.id).length >= 2);
      if (blockers.length) lines.push(`Фокус на острове «${cur.name}»: больше всего задач открывают ${blockers.slice(0, 3).map((b) => `«${b.title}»`).join(', ')}.`);
    }
    return lines;
  },
};
