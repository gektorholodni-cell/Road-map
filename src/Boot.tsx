// Загрузка проекта из IndexedDB с обработкой ошибок и повреждённых данных.
import { Component, useEffect, useState, type ReactNode } from 'react';
import type { Project } from './types';
import { clearProject, loadRaw, saveProject } from './storage/db';
import { downloadText, parseProject } from './storage/io';
import { buildSeedProject } from './data/seed';
import { StoreProvider } from './state/store';
import { ConfirmProvider } from './components/ui/confirm';
import App from './App';

type BootState = { kind: 'loading' } | { kind: 'ready'; project: Project; volatile?: string } | { kind: 'corrupt'; error: string; raw: string };

export function Boot() {
  const [state, setState] = useState<BootState>({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    loadRaw()
      .then((raw) => {
        if (!alive) return;
        if (raw == null) {
          setState({ kind: 'ready', project: buildSeedProject() });
          return;
        }
        const r = parseProject(raw);
        if (r.ok) setState({ kind: 'ready', project: r.project });
        else setState({ kind: 'corrupt', error: r.error, raw });
      })
      .catch((e: Error) => {
        // IndexedDB недоступен (например, приватный режим): работаем без сохранения.
        if (alive) setState({ kind: 'ready', project: buildSeedProject(), volatile: e.message });
      });
    return () => {
      alive = false;
    };
  }, []);

  if (state.kind === 'loading')
    return (
      <div className="boot">
        <div className="boot-spinner" />
        <div>Загрузка мира…</div>
      </div>
    );

  if (state.kind === 'corrupt')
    return (
      <div className="boot">
        <div className="boot-card glass">
          <h1>Сохранённые данные повреждены</h1>
          <p>{state.error}</p>
          <p>Скачайте копию повреждённых данных (их можно попытаться исправить вручную) и начните заново, либо восстановите проект из файла через «Импорт» после запуска.</p>
          <div className="btn-row">
            <button className="btn ghost" onClick={() => downloadText('islands-roadmap-corrupted.json', state.raw)}>
              Скачать повреждённые данные
            </button>
            <button
              className="btn danger"
              onClick={async () => {
                const p = buildSeedProject();
                await clearProject().catch(() => {});
                await saveProject(p).catch(() => {});
                setState({ kind: 'ready', project: p });
              }}
            >
              Начать с шаблона
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <ErrorBoundary>
      <StoreProvider initial={state.project}>
        <ConfirmProvider>
          {state.volatile && <div className="volatile-banner">Локальное хранилище недоступно ({state.volatile}). Изменения не сохранятся — используйте «Экспорт».</div>}
          <App />
        </ConfirmProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error('Islands Roadmap: ошибка интерфейса', error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="boot">
        <div className="boot-card glass">
          <h1>Что-то пошло не так</h1>
          <p>{this.state.error.message}</p>
          <p>Данные сохраняются автоматически. Перезагрузите страницу — прогресс останется.</p>
          <button className="btn primary" onClick={() => window.location.reload()}>
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }
}
