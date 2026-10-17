// Журнал достижений и всплывающие уведомления о новых наградах.
import { useEffect, useState } from 'react';
import { Lock, Trophy } from 'lucide-react';
import type { AchievementDef, Rarity } from '../../types';
import { useStore } from '../../state/store';
import { RARITY_LABEL } from '../../systems/achievements';
import { Modal } from '../ui/Modal';
import { ACHIEVEMENT_ICON } from '../ui/icons';
import { formatDate } from '../ui/labels';

const ORDER: Rarity[] = ['legendary', 'epic', 'rare', 'common'];

export function AchievementMedal({ def, got, size = 54 }: { def: AchievementDef; got: boolean; size?: number }) {
  const I = ACHIEVEMENT_ICON[def.icon] ?? Trophy;
  return (
    <span className={`medal r-${def.rarity} ${got ? 'got' : 'locked'}`} style={{ width: size, height: size }} aria-hidden>
      {got ? <I size={size * 0.45} /> : <Lock size={size * 0.36} />}
    </span>
  );
}

export function AchievementsJournal({ onClose }: { onClose: () => void }) {
  const { project } = useStore();
  const [filter, setFilter] = useState<'all' | 'got' | 'left'>('all');
  const total = project.achievements.length;
  const got = project.achievements.filter((a) => project.unlocked[a.id]).length;
  const list = [...project.achievements]
    .filter((a) => (filter === 'got' ? project.unlocked[a.id] : filter === 'left' ? !project.unlocked[a.id] : true))
    .sort((a, b) => {
      const ga = project.unlocked[a.id] ? 0 : 1;
      const gb = project.unlocked[b.id] ? 0 : 1;
      return ga - gb || ORDER.indexOf(a.rarity) - ORDER.indexOf(b.rarity);
    });
  return (
    <Modal
      wide
      onClose={onClose}
      className="achievements"
      title={
        <div>
          <h2>Журнал достижений</h2>
          <div className="muted">
            Получено {got} из {total}
          </div>
        </div>
      }
    >
      <div className="seg" role="tablist" aria-label="Фильтр достижений">
        {(
          [
            ['all', 'Все'],
            ['got', 'Полученные'],
            ['left', 'Впереди'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      <ul className="ach-grid">
        {list.map((a) => {
          const u = project.unlocked[a.id];
          const island = u?.islandId ? project.islands.find((i) => i.id === u.islandId) : undefined;
          return (
            <li key={a.id} className={`ach r-${a.rarity} ${u ? 'got' : 'locked'}`}>
              <AchievementMedal def={a} got={!!u} />
              <div className="ach-text">
                <div className="ach-title">
                  {a.title} <span className={`rarity r-${a.rarity}`}>{RARITY_LABEL[a.rarity]}</span>
                  {a.custom && <span className="chip">своё</span>}
                </div>
                <div className="ach-desc">{a.description}</div>
                <div className="ach-cond">Условие: {a.conditionText}</div>
                {u && (
                  <div className="ach-date">
                    Получено {formatDate(u.unlockedAt)}
                    {island && ` · ${island.name}`}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

/** Очередь всплывающих уведомлений: достижения, открытые задачи, сообщения. */
export function EventToasts() {
  const { project, events, dismiss } = useStore();
  const shown = events.filter((e) => e.kind === 'achievement' || e.kind === 'toast' || e.kind === 'tasks_unlocked' || e.kind === 'island_unlocked').slice(0, 4);
  return (
    <div className="toasts" aria-live="polite">
      {shown.map((e) => (
        <Toast key={e.id} onDone={() => dismiss(e.id)} long={e.kind === 'achievement'}>
          {e.kind === 'achievement' &&
            (() => {
              const def = project.achievements.find((a) => a.id === e.achievementId);
              if (!def) return null;
              return (
                <div className={`toast-ach r-${def.rarity}`}>
                  <AchievementMedal def={def} got size={46} />
                  <div>
                    <div className="toast-kicker">Достижение получено · {RARITY_LABEL[def.rarity]}</div>
                    <div className="toast-title">{def.title}</div>
                    <div className="toast-text">{def.description}</div>
                  </div>
                </div>
              );
            })()}
          {e.kind === 'toast' && <div className={`toast-plain tone-${e.tone ?? 'info'}`}>{e.text}</div>}
          {e.kind === 'tasks_unlocked' && (
            <div className="toast-plain tone-info">
              {e.taskIds.length === 1 ? `Открыта задача: «${project.tasks[e.taskIds[0]]?.title ?? ''}»` : `Открыто задач: ${e.taskIds.length}`}
            </div>
          )}
          {e.kind === 'island_unlocked' && (
            <div className="toast-plain tone-success">Мост активирован: остров «{project.islands.find((i) => i.id === e.islandId)?.name}» открыт</div>
          )}
        </Toast>
      ))}
    </div>
  );
}

function Toast({ children, onDone, long }: { children: React.ReactNode; onDone: () => void; long?: boolean }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, long ? 5200 : 3200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="toast glass" role="status" onClick={onDone}>
      {children}
    </div>
  );
}
