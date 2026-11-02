// Разбор и создание ROADMAP.md репозитория игры «Сектор Ноль».
// Формат строки шага:
//   - [x] `i1-t01` Название шага                 → выполнено
//   - [ ] `i4-t06` Название шага (в работе)      → в процессе
//   - [ ] `i4-t07` Название шага (на проверке)   → ждёт проверки
//   - [ ] `i4-t10` Название шага                 → ещё не начато

const LINE = /^\s*[-*]\s+\[( |x|X)\]\s+`(i\d+-t\d+)`\s*(.*)$/;

/** ROADMAP.md → { taskId: status } */
export function parseRoadmapMd(text) {
  const tasks = {};
  for (const line of text.split(/\r?\n/)) {
    const m = LINE.exec(line);
    if (!m) continue;
    const [, box, id, rest] = m;
    if (box.toLowerCase() === 'x') tasks[id] = 'done';
    else if (/\(на проверке\)\s*$/i.test(rest)) tasks[id] = 'review';
    else if (/\(в работе\)\s*$/i.test(rest)) tasks[id] = 'in_progress';
    else tasks[id] = 'todo';
  }
  return tasks;
}

/** Проект роадмапа (формат экспорта) → текст ROADMAP.md */
export function makeRoadmapMd(project) {
  const out = [];
  out.push(`# Дорожная карта: ${project.name}`);
  out.push('');
  out.push('Это список всех шагов игры. Его читает сайт-роадмап: https://gektorholodni-cell.github.io/Road-map/');
  out.push('');
  out.push('Как отмечать (правила для Claude и для человека):');
  out.push('- шаг сделан: поставить `[x]`;');
  out.push('- шаг начат: оставить `[ ]` и дописать в конец строки `(в работе)`;');
  out.push('- шаг сделан, но нужен отзыв Айдына: оставить `[ ]` и дописать `(на проверке)`;');
  out.push('- не менять код шага в обратных кавычках (например `i4-t06`), по нему сайт узнаёт задачу.');
  out.push('');
  project.islands.forEach((isl, k) => {
    out.push(`## ${k + 1}. ${isl.subtitle || isl.name} (сектор «${isl.name}»)`);
    out.push('');
    for (const ch of isl.chapters) {
      out.push(`### ${ch.title}`);
      out.push('');
      for (const st of ch.stages) {
        if (st.title) out.push(`**${st.title}**`);
        out.push('');
        for (const id of st.taskIds) {
          const t = project.tasks[id];
          if (!t) continue;
          const box = t.status === 'done' ? 'x' : ' ';
          const tail = t.status === 'in_progress' ? ' (в работе)' : t.status === 'review' ? ' (на проверке)' : '';
          out.push(`- [${box}] \`${id}\` ${t.title}${tail}`);
        }
        out.push('');
      }
    }
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}
