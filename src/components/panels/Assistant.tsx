// Панель помощника по планированию. Честно сообщает, что AI не подключён.
import { useMemo, useState } from 'react';
import { Bot, Info, Plus, Sparkles } from 'lucide-react';
import { useStore } from '../../state/store';
import { localAssistant } from '../../systems/assistant';
import { currentIsland, getIsland, islandTasks } from '../../systems/progress';
import { Modal } from '../ui/Modal';

type Tab = 'next' | 'split' | 'deps' | 'gaps' | 'plan';

export function AssistantPanel({ onClose, onOpenTask, contextIslandId }: { onClose: () => void; onOpenTask: (id: string) => void; contextIslandId?: string }) {
  const { project, dispatch, toast } = useStore();
  const ai = localAssistant;
  const [tab, setTab] = useState<Tab>('next');
  const island = getIsland(project, contextIslandId) ?? currentIsland(project);
  const islandTaskList = useMemo(() => (island ? islandTasks(project, island) : []), [project, island]);
  const [taskId, setTaskId] = useState<string>(() => islandTaskList.find((t) => t.status !== 'done')?.id ?? islandTaskList[0]?.id ?? '');
  const task = project.tasks[taskId];

  const next = useMemo(() => ai.nextSteps(project), [ai, project]);
  const gaps = useMemo(() => ai.findGaps(project), [ai, project]);

  const taskSelect = (
    <label className="field">
      <span>Задача острова «{island?.name}»</span>
      <select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
        {islandTaskList.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <Modal
      wide
      onClose={onClose}
      className="assistant"
      title={
        <div className="row">
          <Bot size={22} />
          <div>
            <h2>Помощник по планированию</h2>
            <div className="muted">Режим: {ai.name}</div>
          </div>
        </div>
      }
    >
      <div className="notice preview">
        <Info size={16} /> AI-модель не подключена. Подсказки строятся локально по правилам и шаблонам из текущего плана — без интернета. Интерфейс
        <code> AssistantProvider</code> (src/systems/assistant.ts) позволяет позже подключить настоящий AI, не меняя эту панель.
      </div>
      <div className="seg" role="tablist">
        {(
          [
            ['next', 'Следующий шаг'],
            ['split', 'Разбить задачу'],
            ['deps', 'Объяснить зависимости'],
            ['gaps', 'Пропущенные этапы'],
            ['plan', 'План'],
          ] as const
        ).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'next' && (
        <ol className="assist-list">
          {next.map((s) => (
            <li key={s.taskId}>
              <button className="link" onClick={() => onOpenTask(s.taskId)}>
                {project.tasks[s.taskId]?.title}
              </button>
              <div className="muted">
                {getIsland(project, project.tasks[s.taskId]?.islandId)?.name} — {s.reason}
              </div>
            </li>
          ))}
          {next.length === 0 && <li className="muted">Доступных задач нет — проверьте закрытые острова или зависимости.</li>}
        </ol>
      )}

      {tab === 'split' && task && (
        <div>
          {taskSelect}
          <h4>Предлагаемые подзадачи</h4>
          <ul className="assist-list">
            {ai.splitTask(task).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div className="btn-row">
            <button
              className="btn primary"
              onClick={() => {
                const titles = ai.splitTask(task);
                if (!titles.length) return toast('Эти подзадачи уже добавлены.', 'info');
                dispatch({ type: 'subtask/addMany', taskId: task.id, titles });
                toast(`Добавлено подзадач: ${titles.length}`, 'success');
              }}
            >
              <Plus size={16} /> Добавить подзадачи
            </button>
          </div>
          <h4>Предлагаемый критерий завершения</h4>
          <p className="criteria-suggest">{ai.suggestCriteria(task)}</p>
          <p className="muted">Сейчас: {task.criteria || 'не задан'}</p>
          <button
            className="btn ghost"
            onClick={() => {
              dispatch({ type: 'task/update', taskId: task.id, patch: { criteria: ai.suggestCriteria(task) } });
              toast('Критерий обновлён.', 'success');
            }}
          >
            <Sparkles size={16} /> Применить критерий
          </button>
        </div>
      )}

      {tab === 'deps' && task && (
        <div>
          {taskSelect}
          <ul className="assist-list mono">
            {ai.explainDependencies(project, task.id).map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'gaps' && (
        <ul className="assist-list">
          {gaps.map((g) => {
            const target = getIsland(project, g.suggestedIslandId);
            const stage = target?.chapters.at(-1)?.stages.at(-1);
            return (
              <li key={g.id}>
                <strong>{g.topic}</strong> — {g.why}
                {stage && target && (
                  <div>
                    <button
                      className="btn ghost small"
                      onClick={() => {
                        dispatch({ type: 'task/add', stageId: stage.id, title: g.suggestedTitle, description: g.why, criteria: '', required: false });
                        toast(`Задача добавлена на остров «${target.name}» как необязательная.`, 'success');
                      }}
                    >
                      <Plus size={14} /> Добавить «{g.suggestedTitle}» на остров «{target.name}»
                    </button>
                  </div>
                )}
              </li>
            );
          })}
          {gaps.length === 0 && <li className="muted">Явных пропусков по контрольному списку не найдено.</li>}
        </ul>
      )}

      {tab === 'plan' && (
        <ul className="assist-list">
          {ai.planSummary(project).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
