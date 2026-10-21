// Карточка задания: описание, критерий, статус, зависимости, подзадачи, заметки.
import { useMemo, useState } from 'react';
import { ArrowRight, Ban, CalendarDays, Check, CircleDot, Eye, Lock, Play, Plus, RotateCcw, Trash2, Trophy, X } from 'lucide-react';
import type { StoredStatus, Task } from '../../types';
import { useStore } from '../../state/store';
import { dependents, getIsland, taskState, wouldCreateCycle } from '../../systems/progress';
import { Modal } from '../ui/Modal';
import { useChoose, useConfirm } from '../ui/confirm';
import { PRIORITY_LABEL, STATUS_LABEL, formatDate } from '../ui/labels';
import { ACHIEVEMENT_ICON } from '../ui/icons';
import { RARITY_LABEL } from '../../systems/achievements';
import { playSound } from '../../systems/sound';

interface Props {
  taskId: string;
  /** active — задание можно выполнять; preview — только просмотр (закрытый остров или вид с карты). */
  mode: 'active' | 'preview';
  previewReason?: string;
  onClose: () => void;
  onOpenTask: (id: string) => void;
}

export function TaskCard({ taskId, mode, previewReason, onClose, onOpenTask }: Props) {
  const { project, dispatch, toast } = useStore();
  const choose = useChoose();
  const confirm = useConfirm();
  const task = project.tasks[taskId];
  const [newSub, setNewSub] = useState('');
  const [depQuery, setDepQuery] = useState('');
  const active = mode === 'active';

  const island = task ? getIsland(project, task.islandId) : undefined;
  const chapter = island?.chapters.find((c) => c.id === task?.chapterId);
  const stage = chapter?.stages.find((s) => s.id === task?.stageId);
  const st = task ? taskState(project, task) : null;
  const deps = task ? task.dependsOn.map((id) => project.tasks[id]).filter(Boolean) : [];
  const opens = task ? dependents(project, task.id) : [];
  const achievements = task ? project.achievements.filter((a) => task.achievementIds.includes(a.id)) : [];

  const depCandidates = useMemo(() => {
    if (!task || depQuery.trim().length < 2) return [];
    const q = depQuery.toLowerCase();
    return Object.values(project.tasks)
      .filter((t) => t.id !== task.id && !task.dependsOn.includes(t.id) && t.title.toLowerCase().includes(q))
      .slice(0, 8);
  }, [project.tasks, task, depQuery]);

  if (!task || !st) {
    return (
      <Modal title="Задание не найдено" onClose={onClose}>
        <p>Задание было удалено.</p>
      </Modal>
    );
  }

  const setStatus = async (status: StoredStatus) => {
    // Нарушение последовательности — только с подтверждением.
    if ((status === 'in_progress' || status === 'review' || status === 'done') && st.unmetDeps.length > 0) {
      const ok = await confirm(
        'Нарушить последовательность?',
        <>
          <p>У задачи есть незавершённые требования:</p>
          <ul className="reasons">
            {st.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p>Продолжить вопреки зависимостям?</p>
        </>,
        'Да, продолжить',
        true,
      );
      if (!ok) return;
    }
    let subtasks: 'all' | 'keep' = 'keep';
    if (status === 'done' && task.subtasks.some((s) => !s.done)) {
      const left = task.subtasks.filter((s) => !s.done).length;
      const res = await choose({
        title: 'Незавершённые подзадачи',
        message: <p>Подзадач не отмечено: {left}. Как поступить?</p>,
        options: [
          { id: 'keep', label: 'Завершить только задачу', tone: 'ghost' },
          { id: 'all', label: 'Отметить и подзадачи' },
        ],
      });
      if (!res) return;
      subtasks = res as 'all' | 'keep';
    }
    if (task.status === 'done' && status !== 'done') {
      const ok = await confirm('Отменить выполнение?', <p>Задача «{task.title}» снова станет незавершённой. Зависящие от неё задачи могут заблокироваться.</p>, 'Открыть заново');
      if (!ok) return;
    }
    if (status === 'skipped') {
      const ok = await confirm(
        'Пропустить задачу?',
        <p>
          Пропущенная задача не считается выполненной, но не блокирует зависимые задачи и прохождение острова. {task.required && 'Это обязательная задача.'}
        </p>,
        'Пропустить',
      );
      if (!ok) return;
    }
    dispatch({ type: 'task/status', taskId: task.id, status, subtasks });
    if (status === 'done') {
      if (project.settings.soundEnabled) playSound('complete');
      toast(`Выполнено: «${task.title}»`, 'success');
    }
  };

  const addDep = (id: string) => {
    if (wouldCreateCycle(project, task.id, id)) {
      toast('Нельзя: получится циклическая зависимость.', 'warn');
      return;
    }
    dispatch({ type: 'task/update', taskId: task.id, patch: { dependsOn: [...task.dependsOn, id] } });
    setDepQuery('');
  };

  const statusIcon = (s: string) =>
    s === 'done' ? <Check size={14} /> : s === 'locked' ? <Lock size={14} /> : s === 'skipped' ? <Ban size={14} /> : s === 'review' ? <Eye size={14} /> : <CircleDot size={14} />;

  const actions = () => {
    if (!active) return null;
    const s = task.status;
    const locked = st.status === 'locked';
    return (
      <div className="task-actions">
        {s === 'todo' && (
          <button className={`btn ${locked ? 'ghost' : 'primary'}`} onClick={() => setStatus('in_progress')}>
            <Play size={16} /> {locked ? 'Начать вопреки блокировке' : 'Взять в работу'}
          </button>
        )}
        {s === 'in_progress' && (
          <button className="btn ghost" onClick={() => setStatus('review')}>
            <Eye size={16} /> На проверку
          </button>
        )}
        {(s === 'todo' || s === 'in_progress' || s === 'review') && (
          <button className={`btn ${s === 'todo' && locked ? 'ghost' : 'success'}`} onClick={() => setStatus('done')}>
            <Check size={16} /> {s === 'review' ? 'Подтвердить выполнение' : 'Завершить'}
          </button>
        )}
        {(s === 'in_progress' || s === 'review') && (
          <button className="btn ghost" onClick={() => setStatus('todo')}>
            <RotateCcw size={16} /> {s === 'review' ? 'Вернуть в работу' : 'Отложить'}
          </button>
        )}
        {s !== 'done' && s !== 'skipped' && (
          <button className="btn ghost subtle" onClick={() => setStatus('skipped')}>
            <Ban size={16} /> Пропустить
          </button>
        )}
        {s === 'done' && (
          <button className="btn ghost" onClick={() => setStatus('todo')}>
            <RotateCcw size={16} /> Открыть заново
          </button>
        )}
        {s === 'skipped' && (
          <button className="btn ghost" onClick={() => setStatus('todo')}>
            <RotateCcw size={16} /> Вернуть из пропущенных
          </button>
        )}
      </div>
    );
  };

  return (
    <Modal
      side
      onClose={onClose}
      className={`task-card st-${st.status}`}
      title={
        <div>
          <div className="crumbs">
            {island?.name} › {chapter?.title} › {stage?.title}
          </div>
          <h2>{task.title}</h2>
          <div className="chips">
            <span className={`chip status st-${st.status}`}>
              {statusIcon(st.status)} {STATUS_LABEL[st.status]}
            </span>
            <span className={`chip prio p-${task.priority}`}>Приоритет: {PRIORITY_LABEL[task.priority]}</span>
            <span className={`chip ${task.required ? 'req' : 'opt'}`}>{task.required ? 'Обязательная' : 'Необязательная'}</span>
          </div>
        </div>
      }
    >
      {!active && (
        <div className="notice preview">
          <Lock size={16} /> {previewReason ?? 'Предварительный просмотр. Выполнять задание можно после входа на остров.'}
        </div>
      )}
      {st.reasons.length > 0 && (
        <div className={`notice ${st.status === 'locked' ? 'blocked' : 'warn'}`}>
          <strong>{st.status === 'locked' ? 'Почему заблокировано' : 'Внимание'}</strong>
          <ul className="reasons">
            {st.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {actions()}

      <section>
        <h3>Описание</h3>
        <p className="desc">{task.description || <em>Описание пока не заполнено.</em>}</p>
      </section>
      <section className="criteria">
        <h3>Критерий завершения</h3>
        <p>{task.criteria || <em>Критерий не задан — добавьте его в режиме редактирования.</em>}</p>
      </section>

      <section>
        <h3>
          Подзадачи{' '}
          {task.subtasks.length > 0 && (
            <span className="muted">
              {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
            </span>
          )}
        </h3>
        <ul className="subtasks">
          {task.subtasks.map((s) => (
            <li key={s.id} className={s.done ? 'done' : ''}>
              <label>
                <input type="checkbox" checked={s.done} disabled={!active} onChange={() => dispatch({ type: 'subtask/toggle', taskId: task.id, subtaskId: s.id })} />
                <span>{s.title}</span>
              </label>
              {active && (
                <button
                  className="icon-btn small"
                  aria-label={`Удалить подзадачу ${s.title}`}
                  onClick={async () => {
                    if (await confirm('Удалить подзадачу?', <p>«{s.title}» будет удалена.</p>, 'Удалить', true)) dispatch({ type: 'subtask/delete', taskId: task.id, subtaskId: s.id });
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
          {task.subtasks.length === 0 && <li className="muted">Подзадач нет.</li>}
        </ul>
        {active && (
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: 'subtask/add', taskId: task.id, title: newSub });
              setNewSub('');
            }}
          >
            <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Новая подзадача…" aria-label="Новая подзадача" />
            <button className="btn ghost" type="submit" disabled={!newSub.trim()}>
              <Plus size={16} /> Добавить
            </button>
          </form>
        )}
      </section>

      <section>
        <h3>Требует завершения</h3>
        <ul className="dep-list">
          {deps.map((d) => {
            const ds = taskState(project, d).status;
            const other = d.islandId !== task.islandId ? getIsland(project, d.islandId) : undefined;
            return (
              <li key={d.id} className={`st-${ds}`}>
                <button className="link" onClick={() => onOpenTask(d.id)}>
                  {statusIcon(ds)} {d.title}
                  {other && <span className="muted"> · {other.name}</span>}
                </button>
                {active && (
                  <button
                    className="icon-btn small"
                    aria-label="Убрать зависимость"
                    onClick={() => dispatch({ type: 'task/update', taskId: task.id, patch: { dependsOn: task.dependsOn.filter((x) => x !== d.id) } })}
                  >
                    <X size={14} />
                  </button>
                )}
              </li>
            );
          })}
          {deps.length === 0 && <li className="muted">Нет зависимостей — задача доступна сразу.</li>}
        </ul>
        {active && (
          <div className="dep-add">
            <input value={depQuery} onChange={(e) => setDepQuery(e.target.value)} placeholder="Добавить зависимость: начните вводить название…" aria-label="Поиск задачи для зависимости" />
            {depCandidates.length > 0 && (
              <ul className="dep-suggest glass">
                {depCandidates.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => addDep(c.id)}>
                      {c.title} <span className="muted">· {getIsland(project, c.islandId)?.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {opens.length > 0 && (
        <section>
          <h3>Открывает задачи</h3>
          <ul className="dep-list">
            {opens.map((d) => (
              <li key={d.id}>
                <button className="link" onClick={() => onOpenTask(d.id)}>
                  <ArrowRight size={14} /> {d.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {achievements.length > 0 && (
        <section>
          <h3>Награды за задачу</h3>
          <ul className="ach-mini">
            {achievements.map((a) => {
              const I = ACHIEVEMENT_ICON[a.icon] ?? Trophy;
              return (
                <li key={a.id} className={`r-${a.rarity} ${project.unlocked[a.id] ? 'got' : ''}`}>
                  <I size={16} /> {a.title} <span className="muted">· {RARITY_LABEL[a.rarity]}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h3>Заметки</h3>
        <textarea
          value={task.notes}
          readOnly={!active}
          placeholder={active ? 'Мысли, ссылки, решения…' : 'Заметок нет.'}
          rows={4}
          onChange={(e) => dispatch({ type: 'task/update', taskId: task.id, patch: { notes: e.target.value } })}
          aria-label="Заметки"
        />
      </section>

      <section className="meta-grid">
        <div>
          <span className="muted">Создана</span> {formatDate(task.createdAt)}
        </div>
        {task.completedAt && (
          <div>
            <span className="muted">Выполнена</span> {formatDate(task.completedAt)}
          </div>
        )}
        <label>
          <span className="muted">
            <CalendarDays size={13} /> Срок
          </span>
          <input
            type="date"
            value={task.dueDate ?? ''}
            disabled={!active}
            onChange={(e) => dispatch({ type: 'task/update', taskId: task.id, patch: { dueDate: e.target.value || undefined } })}
          />
        </label>
      </section>
    </Modal>
  );
}

export type { Task };
