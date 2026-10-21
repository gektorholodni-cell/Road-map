// Экран завершения острова: анимация, награды и выбор — продолжить путь или остаться.
import { ArrowRight, Home } from 'lucide-react';
import type { Island } from '../../types';
import { useStore } from '../../state/store';
import { THEMES } from '../../data/themes';
import { AchievementMedal } from './Achievements';

interface Props {
  island: Island;
  next?: Island;
  onContinue: () => void;
  onStay: () => void;
}

export function IslandComplete({ island, next, onContinue, onStay }: Props) {
  const { project } = useStore();
  const th = THEMES[island.theme];
  const rewards = project.achievements.filter((a) => project.unlocked[a.id] && a.condition.type === 'island_complete' && a.condition.islandId === island.id);
  return (
    <div className="complete-backdrop" role="dialog" aria-modal="true" aria-label={`Остров «${island.name}» пройден`} style={{ ['--glow' as string]: th.glow }}>
      <div className="complete-burst" aria-hidden>
        {Array.from({ length: 24 }, (_, i) => (
          <i key={i} style={{ transform: `rotate(${i * 15}deg)`, animationDelay: `${(i % 6) * 0.08}s` }} />
        ))}
      </div>
      <div className="complete-card glass">
        <div className="complete-kicker">Остров пройден</div>
        <h2>{island.name}</h2>
        <p className="muted">{island.completionCriteria}</p>
        {rewards.length > 0 && (
          <div className="complete-rewards">
            {rewards.map((a) => (
              <div key={a.id} className="reward">
                <AchievementMedal def={a} got size={64} />
                <div>
                  <div className="toast-kicker">Достижение</div>
                  <div className="toast-title">{a.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {next ? (
          <p>
            Мост к острову <strong>«{next.name}»</strong> активирован. Следующий этап: {next.subtitle.toLowerCase()}.
          </p>
        ) : (
          <p>Основной маршрут завершён. Впереди — бесконечное развитие игры.</p>
        )}
        <div className="complete-actions">
          <button className="btn ghost" onClick={onStay}>
            <Home size={16} /> Остаться на острове
          </button>
          {next && (
            <button className="btn primary" onClick={onContinue} autoFocus>
              Продолжить путешествие <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
