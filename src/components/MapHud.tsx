// Интерфейс поверх карты: заголовок, общий прогресс, режимы и действия.
import { Bot, Download, Pencil, RotateCcw, Settings, Trophy, Upload, Compass } from 'lucide-react';
import type { Project } from '../types';
import { islandMapState, islandProgress, projectProgress } from '../systems/progress';
import { ProgressRing } from './panels/IslandOverview';

interface Props {
  project: Project;
  saveState: 'saved' | 'saving' | 'error';
  onEditor: () => void;
  onAchievements: () => void;
  onAssistant: () => void;
  onSettings: () => void;
  onImport: () => void;
  onExport: () => void;
  onReset: () => void;
}

export function MapHud({ project, saveState, onEditor, onAchievements, onAssistant, onSettings, onImport, onExport, onReset }: Props) {
  const prog = projectProgress(project);
  const states = project.islands.map((i) => {
    const st = islandMapState(project, i);
    if (st === 'complete') return 'done';
    const p = islandProgress(project, i);
    const active = Object.values(project.tasks).some((t) => t.islandId === i.id && (t.status === 'in_progress' || t.status === 'review'));
    return p.done > 0 || active ? 'progress' : 'idle';
  });
  const done = states.filter((s) => s === 'done').length;
  const inProgress = states.filter((s) => s === 'progress').length;
  const achGot = project.achievements.filter((a) => project.unlocked[a.id]).length;
  return (
    <>
      <div className="hud-logo">
        <svg className="compass" viewBox="-50 -50 100 100" aria-hidden>
          <path d="M0 -46 L8 -8 L46 0 L8 8 L0 46 L-8 8 L-46 0 L-8 -8 Z" fill="#e8eefc" />
          <path d="M0 -46 L8 -8 L0 0 Z M46 0 L8 8 L0 0 Z M0 46 L-8 8 L0 0 Z M-46 0 L-8 -8 L0 0 Z" fill="#9fb2e0" />
          <path d="M-24 -24 L-3 -3 M24 -24 L3 -3 M24 24 L3 3 M-24 24 L-3 3" stroke="#e8eefc" strokeWidth="2" />
          <circle r="5" fill="#0b1026" stroke="#e8eefc" strokeWidth="2" />
        </svg>
        <div>
          <div className="logo-title">ROADMAP</div>
          <div className="logo-sub">Путь создания игры{project.name ? ` · ${project.name}` : ''}</div>
        </div>
      </div>

      <div className="hud-progress glass" aria-label="Общий прогресс">
        <ProgressRing ratio={prog.ratio} color="#4fe3b0" size={84} label={`Общий прогресс ${Math.round(prog.ratio * 100)}%`} />
        <div className="legend">
          <div className="legend-title">Общий прогресс</div>
          <div>
            <i className="dot done" /> Завершено <b>{done}</b>
          </div>
          <div>
            <i className="dot progress" /> В процессе <b>{inProgress}</b>
          </div>
          <div>
            <i className="dot idle" /> Не начато <b>{project.islands.length - done - inProgress}</b>
          </div>
        </div>
        <div className="hud-tasks">
          <div className="muted">Выполнено задач</div>
          <div className="big">
            {prog.done} / {prog.total - prog.skipped}
          </div>
          <div className="muted small">Достижений {achGot}/{project.achievements.length}</div>
        </div>
      </div>

      <div className="hud-modes glass" role="group" aria-label="Режим">
        <button className="on" aria-pressed="true">
          <Compass size={15} /> Путешествие
        </button>
        <button onClick={onEditor} aria-pressed="false">
          <Pencil size={15} /> Редактор
        </button>
      </div>

      <div className="hud-actions-bottom">
        <div className={`save-dot s-${saveState}`} title={saveState === 'saved' ? 'Сохранено' : saveState === 'saving' ? 'Сохранение…' : 'Ошибка сохранения'}>
          {saveState === 'saved' ? 'Сохранено' : saveState === 'saving' ? 'Сохранение…' : 'Ошибка сохранения'}
        </div>
        <button className="btn glass" onClick={onAchievements}>
          <Trophy size={16} /> Достижения
        </button>
        <button className="btn glass" onClick={onAssistant}>
          <Bot size={16} /> Помощник
        </button>
        <button className="btn glass" onClick={onImport}>
          <Upload size={16} /> Импорт
        </button>
        <button className="btn glass" onClick={onExport}>
          <Download size={16} /> Экспорт
        </button>
        <button className="btn glass" onClick={onReset}>
          <RotateCcw size={16} /> Сброс
        </button>
        <button className="icon-btn glass" onClick={onSettings} aria-label="Настройки" title="Настройки">
          <Settings size={18} />
        </button>
      </div>
    </>
  );
}
