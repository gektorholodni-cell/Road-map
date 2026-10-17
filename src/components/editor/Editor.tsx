// Режим редактирования: острова, главы, этапы, задачи, подзадачи, зависимости и награды.
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Award, ChevronRight, GripVertical, Map as MapIcon, Plus, Trash2, X } from 'lucide-react';
import type { AchievementDef, AchievementIcon, Priority, Rarity, StoredStatus, ThemeId } from '../../types';
import { useStore } from '../../state/store';
import { uid, type TaskPatch } from '../../state/actions';
import { getIsland, isIslandUnlocked, taskState, wouldCreateCycle } from '../../systems/progress';
import { THEMES, THEME_IDS } from '../../data/themes';
import { useConfirm } from '../ui/confirm';
import { PRIORITY_LABEL, STORED_STATUS_LABEL, STATUS_LABEL } from '../ui/labels';
import { ACHIEVEMENT_ICON } from '../ui/icons';
import { RARITY_LABEL } from '../../systems/achievements';

interface Props {
  onClose: () => void;
  initialIslandId?: string;
}

export function Editor({ onClose, initialIslandId }: Props) {
  const { project, dispatch, saveState } = useStore();
  const confirm = useConfirm();
  const [islandId, setIslandId] = useState<string | undefined>(initialIslandId ?? project.islands[0]?.id);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const island = getIsland(project, islandId) ?? project.islands[0];
  const task = taskId ? project.tasks[taskId] : undefined;

  const delIsland = async (id: string) => {
    const i = getIsland(project, id);
    if (!i) return;
    const n = i.chapters.reduce((a, c) => a + c.stages.reduce((b, s) => b + s.taskIds.length, 0), 0);
    if (await confirm('Удалить остров?', <p>Остров «{i.name}» и все его задачи ({n}) будут удалены. Ссылки на них из других задач будут убраны.</p>, 'Удалить остров', true)) {
      dispatch({ type: 'island/delete', islandId: id });
      setIslandId(project.islands.find((x) => x.id !== id)?.id);
      setTaskId(null);
    }
  };

  const drop = (toStageId: string, index: number) => {
    if (!dragId) return;
    dispatch({ type: 'task/move', taskId: dragId, toStageId, index });
    setDragId(null);
  };

  return (
    <div className="editor" role="dialog" aria-label="Режим редактирования">
      <header className="editor-head glass">
        <div>
          <strong>Режим редактирования</strong>
          <span className="muted"> — изменения структуры сохраняются автоматически ({saveState === 'saved' ? 'сохранено' : saveState === 'saving' ? 'сохранение…' : 'ошибка сохранения'})</span>
        </div>
        <button className="btn primary" onClick={onClose}>
          <MapIcon size={16} /> Вернуться к путешествию
        </button>
      </header>
      <div className="editor-body">
        {/* Острова */}
        <aside className="ed-col islands glass">
          <h3>Острова</h3>
          <ul>
            {project.islands.map((i, idx) => (
              <li key={i.id} className={i.id === island?.id ? 'on' : ''}>
                <button className="ed-island" onClick={() => (setIslandId(i.id), setTaskId(null))}>
                  <span className="dot" style={{ background: THEMES[i.theme].glow }} />
                  {idx + 1}. {i.name}
                </button>
                <span className="ed-tools">
                  <button className="icon-btn small" disabled={idx === 0} onClick={() => dispatch({ type: 'island/move', islandId: i.id, dir: -1 })} aria-label="Выше">
                    <ArrowUp size={14} />
                  </button>
                  <button className="icon-btn small" disabled={idx === project.islands.length - 1} onClick={() => dispatch({ type: 'island/move', islandId: i.id, dir: 1 })} aria-label="Ниже">
                    <ArrowDown size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <button
            className="btn ghost"
            onClick={() => {
              const theme = THEME_IDS[project.islands.length % THEME_IDS.length];
              dispatch({ type: 'island/add', name: 'Новый остров', theme });
            }}
          >
            <Plus size={16} /> Добавить остров
          </button>
        </aside>

        {/* Структура острова */}
        {island ? (
          <main className="ed-col structure glass">
            <section className="ed-island-form">
              <div className="grid2">
                <label className="field">
                  <span>Название</span>
                  <input value={island.name} onChange={(e) => dispatch({ type: 'island/update', islandId: island.id, patch: { name: e.target.value } })} />
                </label>
                <label className="field">
                  <span>Этап разработки (подзаголовок)</span>
                  <input value={island.subtitle} onChange={(e) => dispatch({ type: 'island/update', islandId: island.id, patch: { subtitle: e.target.value } })} />
                </label>
                <label className="field">
                  <span>Визуальная тема</span>
                  <select value={island.theme} onChange={(e) => dispatch({ type: 'island/update', islandId: island.id, patch: { theme: e.target.value as ThemeId } })}>
                    {THEME_IDS.map((t) => (
                      <option key={t} value={t}>
                        {THEMES[t].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Доступность</span>
                  <select value={island.unlockRule} onChange={(e) => dispatch({ type: 'island/update', islandId: island.id, patch: { unlockRule: e.target.value as 'sequential' | 'always' } })}>
                    <option value="sequential">После завершения предыдущего острова</option>
                    <option value="always">Открыт всегда</option>
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Описание</span>
                <textarea rows={2} value={island.description} onChange={(e) => dispatch({ type: 'island/update', islandId: island.id, patch: { description: e.target.value } })} />
              </label>
              <label className="field">
                <span>Критерий прохождения</span>
                <input value={island.completionCriteria} onChange={(e) => dispatch({ type: 'island/update', islandId: island.id, patch: { completionCriteria: e.target.value } })} />
              </label>
              <div className="row wrap">
                <label className="toggle">
                  <input type="checkbox" checked={island.manuallyUnlocked} onChange={(e) => dispatch({ type: 'island/manualUnlock', islandId: island.id, value: e.target.checked })} />
                  <span>Открыт вручную (свободное исследование)</span>
                </label>
                <span className="muted">Сейчас: {isIslandUnlocked(project, island) ? 'открыт' : 'закрыт'}</span>
                <button className="btn danger small" onClick={() => void delIsland(island.id)}>
                  <Trash2 size={14} /> Удалить остров
                </button>
              </div>
            </section>

            {island.chapters.map((ch, ci) => (
              <section key={ch.id} className="ed-chapter">
                <div className="ed-chapter-head">
                  <span className="letter">Глава {String.fromCharCode(65 + ci)}</span>
                  <input className="title-input" value={ch.title} onChange={(e) => dispatch({ type: 'chapter/update', chapterId: ch.id, patch: { title: e.target.value } })} aria-label="Название главы" />
                  <button className="icon-btn small" disabled={ci === 0} onClick={() => dispatch({ type: 'chapter/move', chapterId: ch.id, dir: -1 })} aria-label="Глава выше">
                    <ArrowUp size={14} />
                  </button>
                  <button className="icon-btn small" disabled={ci === island.chapters.length - 1} onClick={() => dispatch({ type: 'chapter/move', chapterId: ch.id, dir: 1 })} aria-label="Глава ниже">
                    <ArrowDown size={14} />
                  </button>
                  <button
                    className="icon-btn small"
                    aria-label="Удалить главу"
                    onClick={async () => {
                      const n = ch.stages.reduce((a, s) => a + s.taskIds.length, 0);
                      if (await confirm('Удалить главу?', <p>Глава «{ch.title}» и её задачи ({n}) будут удалены.</p>, 'Удалить', true)) dispatch({ type: 'chapter/delete', chapterId: ch.id });
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input className="desc-input" value={ch.description} placeholder="Описание главы" onChange={(e) => dispatch({ type: 'chapter/update', chapterId: ch.id, patch: { description: e.target.value } })} aria-label="Описание главы" />
                {ch.stages.map((stg) => (
                  <div
                    key={stg.id}
                    className={`ed-stage ${dragId ? 'drop-ready' : ''}`}
                    onDragOver={(e) => dragId && e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      drop(stg.id, stg.taskIds.length);
                    }}
                  >
                    <div className="ed-stage-head">
                      <ChevronRight size={14} />
                      <input className="title-input small" value={stg.title} onChange={(e) => dispatch({ type: 'stage/update', stageId: stg.id, title: e.target.value })} aria-label="Название этапа" />
                      <button
                        className="icon-btn small"
                        aria-label="Удалить этап"
                        onClick={async () => {
                          if (await confirm('Удалить этап?', <p>Этап «{stg.title}» и его задачи ({stg.taskIds.length}) будут удалены.</p>, 'Удалить', true)) dispatch({ type: 'stage/delete', stageId: stg.id });
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <ul className="ed-tasks">
                      {stg.taskIds.map((id, ti) => {
                        const t = project.tasks[id];
                        if (!t) return null;
                        const s = taskState(project, t).status;
                        return (
                          <li
                            key={id}
                            className={`ed-task st-${s} ${taskId === id ? 'on' : ''} ${dragId === id ? 'dragging' : ''}`}
                            draggable
                            onDragStart={(e) => {
                              setDragId(id);
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', id);
                            }}
                            onDragEnd={() => setDragId(null)}
                            onDragOver={(e) => dragId && e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              drop(stg.id, ti);
                            }}
                          >
                            <GripVertical size={14} className="grip" aria-hidden />
                            <button className="ed-task-title" onClick={() => setTaskId(id)}>
                              {t.title}
                              {!t.required && <span className="muted"> · необяз.</span>}
                            </button>
                            <span className="ed-task-st">{STATUS_LABEL[s]}</span>
                            <button className="icon-btn small" disabled={ti === 0} onClick={() => dispatch({ type: 'task/move', taskId: id, toStageId: stg.id, index: ti - 1 })} aria-label="Задачу выше">
                              <ArrowUp size={12} />
                            </button>
                            <button
                              className="icon-btn small"
                              disabled={ti === stg.taskIds.length - 1}
                              onClick={() => dispatch({ type: 'task/move', taskId: id, toStageId: stg.id, index: ti + 1 })}
                              aria-label="Задачу ниже"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    <QuickAddTask stageId={stg.id} onCreated={() => setTaskId(null)} />
                  </div>
                ))}
                <button className="btn ghost small" onClick={() => dispatch({ type: 'stage/add', chapterId: ch.id, title: 'Новый этап' })}>
                  <Plus size={14} /> Этап
                </button>
              </section>
            ))}
            <button className="btn ghost" onClick={() => dispatch({ type: 'chapter/add', islandId: island.id, title: 'Новая глава' })}>
              <Plus size={16} /> Добавить главу
            </button>
          </main>
        ) : (
          <main className="ed-col structure glass">
            <p>Островов нет. Добавьте первый.</p>
          </main>
        )}

        {/* Задача */}
        <aside className="ed-col task glass">{task ? <TaskEditor key={task.id} taskId={task.id} onClose={() => setTaskId(null)} /> : <p className="muted">Выберите задачу, чтобы изменить её. Задачи можно перетаскивать между этапами.</p>}</aside>
      </div>
    </div>
  );
}

function QuickAddTask({ stageId, onCreated }: { stageId: string; onCreated: () => void }) {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState('');
  const [status, setStatus] = useState<StoredStatus>('todo');
  if (!open)
    return (
      <button className="btn ghost small add-task" onClick={() => setOpen(true)}>
        <Plus size={14} /> Задача
      </button>
    );
  return (
    <form
      className="quick-add"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        dispatch({ type: 'task/add', stageId, title, description, criteria, status });
        setTitle('');
        setDescription('');
        setCriteria('');
        setStatus('todo');
        setOpen(false);
        onCreated();
      }}
    >
      <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название задачи" aria-label="Название" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" aria-label="Описание" />
      <input value={criteria} onChange={(e) => setCriteria(e.target.value)} placeholder="Критерий завершения" aria-label="Критерий завершения" />
      <div className="row">
        <select value={status} onChange={(e) => setStatus(e.target.value as StoredStatus)} aria-label="Статус">
          {(Object.keys(STORED_STATUS_LABEL) as StoredStatus[]).map((s) => (
            <option key={s} value={s}>
              {STORED_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button className="btn primary small" type="submit">
          Создать
        </button>
        <button className="btn ghost small" type="button" onClick={() => setOpen(false)}>
          Отмена
        </button>
      </div>
    </form>
  );
}

const ICONS = Object.keys(ACHIEVEMENT_ICON) as AchievementIcon[];

function TaskEditor({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { project, dispatch, toast } = useStore();
  const confirm = useConfirm();
  const t = project.tasks[taskId];
  const [q, setQ] = useState('');
  const [newSub, setNewSub] = useState('');
  const [reward, setReward] = useState<{ title: string; description: string; rarity: Rarity; icon: AchievementIcon } | null>(null);
  const candidates = useMemo(() => {
    if (!t || q.trim().length < 2) return [];
    const s = q.toLowerCase();
    return Object.values(project.tasks)
      .filter((x) => x.id !== t.id && !t.dependsOn.includes(x.id) && x.title.toLowerCase().includes(s))
      .slice(0, 8);
  }, [project.tasks, t, q]);
  if (!t) return null;
  const st = taskState(project, t);
  const patch = (p: TaskPatch) => dispatch({ type: 'task/update', taskId: t.id, patch: p });

  const changeStatus = async (status: StoredStatus) => {
    if ((status === 'done' || status === 'in_progress' || status === 'review') && st.unmetDeps.length) {
      if (!(await confirm('Нарушить последовательность?', <ul className="reasons">{st.reasons.map((r) => <li key={r}>{r}</li>)}</ul>, 'Всё равно изменить', true))) return;
    }
    dispatch({ type: 'task/status', taskId: t.id, status, subtasks: 'keep' });
  };

  return (
    <div className="task-editor">
      <div className="row between">
        <h3>Задача</h3>
        <button className="icon-btn small" onClick={onClose} aria-label="Закрыть редактор задачи">
          <X size={16} />
        </button>
      </div>
      <label className="field">
        <span>Название</span>
        <input value={t.title} onChange={(e) => patch({ title: e.target.value })} />
      </label>
      <label className="field">
        <span>Описание</span>
        <textarea rows={3} value={t.description} onChange={(e) => patch({ description: e.target.value })} />
      </label>
      <label className="field">
        <span>Критерий завершения</span>
        <textarea rows={2} value={t.criteria} onChange={(e) => patch({ criteria: e.target.value })} />
      </label>
      <div className="grid2">
        <label className="field">
          <span>Статус</span>
          <select value={t.status} onChange={(e) => void changeStatus(e.target.value as StoredStatus)}>
            {(Object.keys(STORED_STATUS_LABEL) as StoredStatus[]).map((s) => (
              <option key={s} value={s}>
                {STORED_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Приоритет</span>
          <select value={t.priority} onChange={(e) => patch({ priority: e.target.value as Priority })}>
            {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Срок</span>
          <input type="date" value={t.dueDate ?? ''} onChange={(e) => patch({ dueDate: e.target.value || undefined })} />
        </label>
        <label className="toggle">
          <input type="checkbox" checked={t.required} onChange={(e) => patch({ required: e.target.checked })} />
          <span>Обязательная</span>
        </label>
      </div>

      <h4>Зависимости</h4>
      <ul className="dep-list">
        {t.dependsOn.map((id) => {
          const d = project.tasks[id];
          if (!d) return null;
          return (
            <li key={id}>
              <span>
                {d.title}
                {d.islandId !== t.islandId && <span className="muted"> · {getIsland(project, d.islandId)?.name}</span>}
              </span>
              <button className="icon-btn small" onClick={() => patch({ dependsOn: t.dependsOn.filter((x) => x !== id) })} aria-label="Убрать зависимость">
                <X size={14} />
              </button>
            </li>
          );
        })}
        {t.dependsOn.length === 0 && <li className="muted">Нет</li>}
      </ul>
      <div className="dep-add">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти задачу…" aria-label="Найти задачу для зависимости" />
        {candidates.length > 0 && (
          <ul className="dep-suggest glass">
            {candidates.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => {
                    if (wouldCreateCycle(project, t.id, c.id)) return toast('Нельзя: получится цикл зависимостей.', 'warn');
                    patch({ dependsOn: [...t.dependsOn, c.id] });
                    setQ('');
                  }}
                >
                  {c.title} <span className="muted">· {getIsland(project, c.islandId)?.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h4>Подзадачи</h4>
      <ul className="subtasks">
        {t.subtasks.map((s) => (
          <li key={s.id}>
            <input type="checkbox" checked={s.done} onChange={() => dispatch({ type: 'subtask/toggle', taskId: t.id, subtaskId: s.id })} aria-label="Выполнена" />
            <input className="title-input small" value={s.title} onChange={(e) => dispatch({ type: 'subtask/rename', taskId: t.id, subtaskId: s.id, title: e.target.value })} aria-label="Название подзадачи" />
            <button className="icon-btn small" onClick={() => dispatch({ type: 'subtask/delete', taskId: t.id, subtaskId: s.id })} aria-label="Удалить подзадачу">
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ type: 'subtask/add', taskId: t.id, title: newSub });
          setNewSub('');
        }}
      >
        <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Новая подзадача" aria-label="Новая подзадача" />
        <button className="btn ghost small" type="submit" disabled={!newSub.trim()}>
          <Plus size={14} />
        </button>
      </form>

      <h4>Награды</h4>
      <ul className="ach-mini">
        {project.achievements
          .filter((a) => t.achievementIds.includes(a.id))
          .map((a) => {
            const I = ACHIEVEMENT_ICON[a.icon];
            return (
              <li key={a.id} className={`r-${a.rarity}`}>
                <I size={14} /> {a.title} <span className="muted">· {RARITY_LABEL[a.rarity]}</span>
                <button
                  className="icon-btn small"
                  aria-label="Удалить награду"
                  onClick={async () => {
                    if (await confirm('Удалить достижение?', <p>«{a.title}» будет удалено из журнала.</p>, 'Удалить', true)) dispatch({ type: 'achievement/delete', achievementId: a.id });
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </li>
            );
          })}
      </ul>
      {reward ? (
        <form
          className="reward-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!reward.title.trim()) return;
            const def: AchievementDef = {
              id: uid('ach'),
              title: reward.title.trim(),
              description: reward.description.trim() || `Награда за задачу «${t.title}».`,
              conditionText: `Выполнить задачу «${t.title}».`,
              condition: { type: 'task_done', taskIds: [t.id] },
              icon: reward.icon,
              rarity: reward.rarity,
              custom: true,
            };
            dispatch({ type: 'achievement/add', def, taskId: t.id });
            setReward(null);
            toast('Награда назначена.', 'success');
          }}
        >
          <input autoFocus value={reward.title} onChange={(e) => setReward({ ...reward, title: e.target.value })} placeholder="Название достижения" aria-label="Название достижения" />
          <input value={reward.description} onChange={(e) => setReward({ ...reward, description: e.target.value })} placeholder="Описание" aria-label="Описание достижения" />
          <div className="row">
            <select value={reward.rarity} onChange={(e) => setReward({ ...reward, rarity: e.target.value as Rarity })} aria-label="Редкость">
              {(Object.keys(RARITY_LABEL) as Rarity[]).map((r) => (
                <option key={r} value={r}>
                  {RARITY_LABEL[r]}
                </option>
              ))}
            </select>
            <select value={reward.icon} onChange={(e) => setReward({ ...reward, icon: e.target.value as AchievementIcon })} aria-label="Иконка">
              {ICONS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <button className="btn primary small" type="submit">
              Создать награду
            </button>
            <button className="btn ghost small" type="button" onClick={() => setReward(null)}>
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <button className="btn ghost small" onClick={() => setReward({ title: '', description: '', rarity: 'common', icon: 'star' })}>
          <Award size={14} /> Назначить награду за задачу
        </button>
      )}

      <div className="danger-zone">
        <button
          className="btn danger small"
          onClick={async () => {
            if (await confirm('Удалить задачу?', <p>«{t.title}» будет удалена, ссылки на неё в зависимостях других задач — убраны.</p>, 'Удалить', true)) {
              dispatch({ type: 'task/delete', taskId: t.id });
              onClose();
            }
          }}
        >
          <Trash2 size={14} /> Удалить задачу
        </button>
      </div>
    </div>
  );
}
