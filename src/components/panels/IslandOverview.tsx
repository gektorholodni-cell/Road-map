// Обзор острова: предварительный просмотр с карты и список заданий внутри сцены.
import { useState } from 'react';
import { Ban, Check, ChevronDown, CircleDot, Crosshair, Eye, Flag, Key, Lock, LogIn } from 'lucide-react';
import type { Island } from '../../types';
import { useStore } from '../../state/store';
import { chapterProgress, currentIsland, isIslandUnlocked, islandMapState, islandProgress, taskState, unlockConditionText } from '../../systems/progress';
import { Modal } from '../ui/Modal';
import { useConfirm } from '../ui/confirm';
import { STATUS_LABEL, pct } from '../ui/labels';
import { IslandBadgeIcon } from '../ui/icons';
import { THEMES } from '../../data/themes';

interface Props {
  island: Island;
  /** preview — с карты, задания только для просмотра; scene — список внутри острова. */
  mode: 'preview' | 'scene';
  onClose: () => void;
  onOpenTask: (taskId: string) => void;
  onEnter?: () => void;
  onGoCurrent?: () => void;
  onCompleteChapter?: (chapterId: string) => void;
  /** Раскрыть только эту главу. */
  focusChapterId?: string;
}

const icon = (s: string) =>
  s === 'done' ? <Check size={14} /> : s === 'locked' ? <Lock size={14} /> : s === 'skipped' ? <Ban size={14} /> : s === 'review' ? <Eye size={14} /> : <CircleDot size={14} />;

export function IslandOverview({ island, mode, onClose, onOpenTask, onEnter, onGoCurrent, onCompleteChapter, focusChapterId }: Props) {
  const { project, dispatch } = useStore();
  const confirm = useConfirm();
  const unlocked = isIslandUnlocked(project, island);
  const state = islandMapState(project, island);
  const prog = islandProgress(project, island);
  const cur = currentIsland(project);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    focusChapterId ? Object.fromEntries(island.chapters.map((c) => [c.id, c.id !== focusChapterId])) : {},
  );
  const th = THEMES[island.theme];

  const manualUnlock = async () => {
    const ok = await confirm(
      'Открыть остров для свободного исследования?',
      <p>
        Это действие вне обычного прохождения: остров «{island.name}» станет доступен для входа, а его задания — для выполнения, хотя предыдущий остров не завершён.
        Зависимости задач продолжат работать. Отменить можно в редакторе.
      </p>,
      'Открыть вручную',
    );
    if (ok) dispatch({ type: 'island/manualUnlock', islandId: island.id, value: true });
  };

  return (
    <Modal
      side
      onClose={onClose}
      className={`island-overview theme-${island.theme}`}
      title={
        <div className="ov-head" style={{ ['--glow' as string]: th.glow }}>
          <span className={`badge big state-${state}`}>
            <IslandBadgeIcon theme={island.theme} state={state} size={22} />
          </span>
          <div>
            <div className="crumbs">{island.subtitle}</div>
            <h2>{island.name}</h2>
            <div className="chips">
              <span className={`chip state-${state}`}>{state === 'locked' ? 'Закрыт — предварительный просмотр' : state === 'complete' ? 'Завершён' : 'Открыт'}</span>
              {island.manuallyUnlocked && !island.unlockedAt && <span className="chip warn">Открыт вручную</span>}
            </div>
          </div>
        </div>
      }
      footer={
        mode === 'preview' ? (
          <>
            {cur && cur.id !== island.id && onGoCurrent && (
              <button className="btn ghost" onClick={onGoCurrent}>
                <Crosshair size={16} /> Вернуться к текущему острову
              </button>
            )}
            {!unlocked && project.settings.allowManualUnlock && (
              <button className="btn ghost" onClick={manualUnlock}>
                <Key size={16} /> Открыть вручную
              </button>
            )}
            {unlocked && onEnter && (
              <button className="btn primary" onClick={onEnter}>
                <LogIn size={16} /> Войти на остров
              </button>
            )}
          </>
        ) : undefined
      }
    >
      <p className="desc">{island.description}</p>
      <div className="ov-stats">
        <div className="ring-wrap">
          <ProgressRing ratio={prog.ratio} color={th.glow} />
        </div>
        <div>
          <div>
            Выполнено {prog.done} из {prog.total - prog.skipped}
            {prog.skipped > 0 && <span className="muted"> · пропущено {prog.skipped}</span>}
          </div>
          <div className="muted">
            Обязательные: {prog.requiredDone}/{prog.requiredTotal}
          </div>
          <div className="criteria-line">
            <Flag size={14} /> {island.completionCriteria}
          </div>
          {!unlocked && (
            <div className="notice blocked compact">
              <Lock size={14} /> Условие открытия: {unlockConditionText(project, island)}
            </div>
          )}
        </div>
      </div>
      {mode === 'preview' && !unlocked && (
        <div className="notice preview">Все задания видны заранее, но выполнять их можно только после входа на открытый остров.</div>
      )}
      {mode === 'preview' && unlocked && <div className="notice preview">Чтобы выполнять задания, войдите на остров.</div>}

      {island.chapters.map((ch, ci) => {
        const cp = chapterProgress(project, ch);
        const isCollapsed = collapsed[ch.id];
        const allClosed = ch.stages.every((s) => s.taskIds.every((id) => ['done', 'skipped'].includes(project.tasks[id]?.status)));
        return (
          <section key={ch.id} className="ov-chapter">
            <button className="ov-chapter-head" onClick={() => setCollapsed((c) => ({ ...c, [ch.id]: !c[ch.id] }))} aria-expanded={!isCollapsed}>
              <ChevronDown size={16} className={isCollapsed ? 'rot' : ''} />
              <span className="letter">Глава {String.fromCharCode(65 + ci)}</span>
              <span className="title">{ch.title}</span>
              <span className="pct">{pct(cp.ratio)}</span>
            </button>
            {!isCollapsed &&
              ch.stages.map((stg) => (
                <div key={stg.id} className="ov-stage">
                  <div className="ov-stage-title">{stg.title}</div>
                  <ul className="ov-tasks">
                    {stg.taskIds.map((id) => {
                      const t = project.tasks[id];
                      if (!t) return null;
                      const s = taskState(project, t);
                      return (
                        <li key={id} className={`st-${s.status}`}>
                          <button onClick={() => onOpenTask(id)} title={s.reasons.join('\n') || STATUS_LABEL[s.status]}>
                            <span className="st-icon">{icon(s.status)}</span>
                            <span className="t-title">
                              {t.title}
                              {!t.required && <span className="muted"> · необяз.</span>}
                            </span>
                            <span className="t-status">{STATUS_LABEL[s.status]}</span>
                          </button>
                          {s.status === 'locked' && s.reasons.length > 0 && <div className="t-reason">{s.reasons[0]}</div>}
                        </li>
                      );
                    })}
                    {stg.taskIds.length === 0 && <li className="muted">Задач нет.</li>}
                  </ul>
                </div>
              ))}
            {mode === 'scene' && !allClosed && onCompleteChapter && !isCollapsed && (
              <button className="btn ghost small" onClick={() => onCompleteChapter(ch.id)}>
                <Check size={14} /> Завершить главу с подтверждением
              </button>
            )}
          </section>
        );
      })}
    </Modal>
  );
}

export function ProgressRing({ ratio, color = '#5ff0a0', size = 76, label }: { ratio: number; color?: string; size?: number; label?: string }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="progress-ring" role="img" aria-label={label ?? `Прогресс ${pct(ratio)}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.12)" strokeWidth="7" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c * Math.max(0, Math.min(1, ratio))} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray .6s ease' }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="#fff" fontSize={size * 0.24} fontWeight={600}>
        {pct(ratio)}
      </text>
    </svg>
  );
}
