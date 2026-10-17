// Настройки и управление данными: экспорт, импорт, резервные копии, сброс.
import { useEffect, useRef, useState } from 'react';
import { Archive, Download, RotateCcw, Trash2, Upload } from 'lucide-react';
import { useStore } from '../../state/store';
import { Modal } from '../ui/Modal';
import { useConfirm } from '../ui/confirm';
import { createBackup, deleteBackup, listBackups, readBackup, type BackupMeta } from '../../storage/db';
import { downloadText, exportProject, parseProject } from '../../storage/io';
import { buildSeedProject } from '../../data/seed';
import { projectProgress } from '../../systems/progress';
import { formatDate } from '../ui/labels';

export function useDataActions() {
  const { project, dispatch, toast } = useStore();
  const confirm = useConfirm();

  const doExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(`islands-roadmap-${stamp}.json`, exportProject(project));
    toast('Проект экспортирован в JSON.', 'success');
  };

  const importText = async (text: string, source: string) => {
    const r = parseProject(text);
    if (!r.ok) {
      toast(`Импорт не выполнен: ${r.error}`, 'error');
      return false;
    }
    const prog = projectProgress(r.project);
    const ok = await confirm(
      'Заменить текущий проект?',
      <>
        <p>
          {source}: «{r.project.name}», островов {r.project.islands.length}, задач {prog.total}, выполнено {prog.done}.
        </p>
        <p>Перед заменой будет создана резервная копия текущего проекта.</p>
        {r.warnings.length > 0 && (
          <ul className="reasons">
            {r.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </>,
      'Заменить',
    );
    if (!ok) return false;
    try {
      const cur = projectProgress(project);
      await createBackup(project, 'Автоматически перед импортом', cur.done, cur.total);
    } catch {
      /* резервная копия не критична для импорта */
    }
    dispatch({ type: 'replace', project: { ...r.project, session: { ...r.project.session, view: 'map' } } });
    toast('Проект загружен.', 'success');
    return true;
  };

  const pickFile = () =>
    new Promise<void>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = async () => {
        const f = input.files?.[0];
        if (f) {
          try {
            await importText(await f.text(), `Файл ${f.name}`);
          } catch (e) {
            toast(`Не удалось прочитать файл: ${(e as Error).message}`, 'error');
          }
        }
        resolve();
      };
      input.click();
    });

  const reset = async () => {
    const ok = await confirm(
      'Сбросить проект?',
      <p>Все задачи, статусы, заметки и достижения вернутся к стартовому шаблону. Перед сбросом будет создана резервная копия.</p>,
      'Сбросить',
      true,
    );
    if (!ok) return;
    try {
      const cur = projectProgress(project);
      await createBackup(project, 'Автоматически перед сбросом', cur.done, cur.total);
    } catch {
      /* продолжаем */
    }
    const fresh = buildSeedProject();
    dispatch({ type: 'replace', project: { ...fresh, settings: project.settings } });
    toast('Проект сброшен к стартовому шаблону.', 'info');
  };

  return { doExport, importText, pickFile, reset };
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { project, dispatch, toast, saveState, saveError } = useStore();
  const confirm = useConfirm();
  const { doExport, pickFile, reset, importText } = useDataActions();
  const [backups, setBackups] = useState<BackupMeta[] | null>(null);
  const [backupErr, setBackupErr] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const mounted = useRef(true);
  const s = project.settings;

  const refresh = () =>
    listBackups()
      .then((b) => mounted.current && setBackups(b))
      .catch((e) => mounted.current && setBackupErr((e as Error).message));

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
    };
  }, []);

  const makeBackup = async () => {
    try {
      const p = projectProgress(project);
      await createBackup(project, label.trim() || 'Ручная копия', p.done, p.total);
      setLabel('');
      toast('Резервная копия создана.', 'success');
      void refresh();
    } catch (e) {
      toast(`Не удалось создать копию: ${(e as Error).message}`, 'error');
    }
  };

  const restore = async (b: BackupMeta) => {
    const data = await readBackup(b.id);
    if (!data) {
      toast('Копия не найдена.', 'error');
      return;
    }
    if (await importText(data, `Резервная копия от ${formatDate(b.createdAt)}`)) void refresh();
  };

  return (
    <Modal wide onClose={onClose} title={<h2>Настройки</h2>} className="settings">
      <section>
        <h3>Проект</h3>
        <label className="field">
          <span>Название игры</span>
          <input value={project.name} onChange={(e) => dispatch({ type: 'project/rename', name: e.target.value })} />
        </label>
        <div className={`save-state s-${saveState}`}>
          {saveState === 'saved' && 'Все изменения сохранены локально (IndexedDB).'}
          {saveState === 'saving' && 'Сохранение…'}
          {saveState === 'error' && `Ошибка сохранения: ${saveError}`}
        </div>
      </section>
      <section>
        <h3>Интерфейс</h3>
        <label className="toggle">
          <input type="checkbox" checked={s.soundEnabled} onChange={(e) => dispatch({ type: 'settings', patch: { soundEnabled: e.target.checked } })} />
          <span>Звуковые эффекты (синтезируются локально, по умолчанию выключены)</span>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={s.showMinimap} onChange={(e) => dispatch({ type: 'settings', patch: { showMinimap: e.target.checked } })} />
          <span>Показывать мини-карту</span>
        </label>
        <label className="field inline">
          <span>Анимации</span>
          <select value={s.reducedMotion} onChange={(e) => dispatch({ type: 'settings', patch: { reducedMotion: e.target.value as typeof s.reducedMotion } })}>
            <option value="auto">Как в системе (prefers-reduced-motion)</option>
            <option value="off">Полные анимации</option>
            <option value="on">Минимум движения</option>
          </select>
        </label>
      </section>
      <section>
        <h3>Прохождение</h3>
        <label className="toggle">
          <input
            type="checkbox"
            checked={s.allowManualUnlock}
            onChange={async (e) => {
              const v = e.target.checked;
              if (v && !(await confirm('Разрешить ручное открытие островов?', <p>В предварительном просмотре закрытых островов появится кнопка «Открыть вручную». Это отдельный режим свободного исследования, он не меняет обычное прохождение.</p>, 'Разрешить')))
                return;
              dispatch({ type: 'settings', patch: { allowManualUnlock: v } });
            }}
          />
          <span>Разрешить ручное открытие островов для свободного исследования</span>
        </label>
      </section>
      <section>
        <h3>Данные</h3>
        <div className="btn-row">
          <button className="btn ghost" onClick={doExport}>
            <Download size={16} /> Экспорт в JSON
          </button>
          <button className="btn ghost" onClick={() => void pickFile()}>
            <Upload size={16} /> Импорт из JSON
          </button>
          <button className="btn danger" onClick={() => void reset()}>
            <RotateCcw size={16} /> Сброс к шаблону
          </button>
        </div>
        <h4>Резервные копии</h4>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            void makeBackup();
          }}
        >
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Подпись копии (необязательно)" aria-label="Подпись резервной копии" />
          <button className="btn primary" type="submit">
            <Archive size={16} /> Создать копию
          </button>
        </form>
        {backupErr && <div className="notice blocked">Хранилище копий недоступно: {backupErr}</div>}
        {backups === null && !backupErr && <div className="muted">Загрузка…</div>}
        {backups && backups.length === 0 && <div className="muted">Копий пока нет.</div>}
        {backups && backups.length > 0 && (
          <ul className="backup-list">
            {backups.map((b) => (
              <li key={b.id}>
                <div>
                  <div>{b.label}</div>
                  <div className="muted">
                    {new Date(b.createdAt).toLocaleString('ru-RU')} · «{b.projectName}» · {b.done}/{b.total}
                  </div>
                </div>
                <button className="btn ghost small" onClick={() => void restore(b)}>
                  Восстановить
                </button>
                <button
                  className="icon-btn small"
                  aria-label="Удалить копию"
                  onClick={async () => {
                    if (await confirm('Удалить резервную копию?', <p>«{b.label}» будет удалена без возможности восстановления.</p>, 'Удалить', true)) {
                      await deleteBackup(b.id);
                      void refresh();
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Modal>
  );
}
