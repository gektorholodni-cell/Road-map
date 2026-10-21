// Корневой компонент: управляет видами (карта / остров), переходами и окнами.
import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Home, ListChecks, Map as MapIcon, Pencil, Play, Settings, Trophy } from 'lucide-react';
import { useStore } from './state/store';
import { WorldMap, type WorldMapHandle } from './components/map/WorldMap';
import { IslandScene } from './components/island/IslandScene';
import { MapHud } from './components/MapHud';
import { Transition, type TransitionSpec } from './components/Transition';
import { TaskCard } from './components/panels/TaskCard';
import { IslandOverview } from './components/panels/IslandOverview';
import { AchievementsJournal, EventToasts } from './components/panels/Achievements';
import { IslandComplete } from './components/panels/IslandComplete';
import { SettingsPanel, useDataActions } from './components/panels/Settings';
import { AssistantPanel } from './components/panels/Assistant';
import { CoopPanel } from './components/panels/Coop';
import { roomFromHash, setPresence } from './multiplayer/room';
import { Editor } from './components/editor/Editor';
import { Modal } from './components/ui/Modal';
import { useConfirm } from './components/ui/confirm';
import { chapterTaskIds, currentIsland, getIsland, isIslandUnlocked } from './systems/progress';
import { playSound } from './systems/sound';

type Panel =
  | { type: 'task'; taskId: string }
  | { type: 'overview'; islandId: string; mode: 'preview' | 'scene'; focusChapterId?: string }
  | { type: 'achievements' }
  | { type: 'settings' }
  | { type: 'assistant' }
  | { type: 'menu' }
  | { type: 'coop' };

function usePrefersReducedMotion() {
  const [v, setV] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!m) return;
    const on = () => setV(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return v;
}

export default function App() {
  const { project, dispatch, events, dismiss, saveState } = useStore();
  const confirm = useConfirm();
  const data = useDataActions();
  const systemReduced = usePrefersReducedMotion();
  const reduced = project.settings.reducedMotion === 'on' || (project.settings.reducedMotion === 'auto' && systemReduced);
  const animated = !reduced;

  const mapRef = useRef<WorldMapHandle>(null);
  const startIsland = project.session.view === 'island' ? getIsland(project, project.session.islandId) : undefined;
  const [sceneId, setSceneId] = useState<string | null>(() => (startIsland && isIslandUnlocked(project, startIsland) ? startIsland.id : null));
  const [arriving, setArriving] = useState(!!sceneId);
  const [transition, setTransition] = useState<TransitionSpec | null>(null);
  // Ссылка-приглашение в комнату сразу открывает окно совместной игры.
  const [panels, setPanels] = useState<Panel[]>(() => (roomFromHash() ? [{ type: 'coop' }] : []));
  const [editor, setEditor] = useState(false);
  const [selected, setSelected] = useState<string | undefined>();
  const [completeQueue, setCompleteQueue] = useState<string[]>([]);
  const busy = useRef(false);

  const scene = sceneId ? getIsland(project, sceneId) : undefined;
  const top = panels[panels.length - 1];
  const push = (p: Panel) => setPanels((ps) => [...ps.filter((x) => x.type !== p.type || p.type === 'task'), p]);
  const pop = () => setPanels((ps) => ps.slice(0, -1));
  const closeAll = () => setPanels([]);

  // Если остров сцены удалили — вернуться на карту.
  useEffect(() => {
    if (sceneId && !scene) setSceneId(null);
  }, [sceneId, scene]);

  useEffect(() => {
    if (!arriving) return;
    const t = window.setTimeout(() => setArriving(false), animated ? 1300 : 50);
    return () => window.clearTimeout(t);
  }, [arriving, animated]);

  // Завершение острова — экран празднования (без автоматического перехода).
  useEffect(() => {
    for (const e of events) {
      if (e.kind === 'island_complete') {
        setCompleteQueue((q) => (q.includes(e.islandId) ? q : [...q, e.islandId]));
        dismiss(e.id);
      }
    }
  }, [events, dismiss]);

  const enterIsland = useCallback(
    async (id: string) => {
      const island = getIsland(project, id);
      if (!island || busy.current) return;
      busy.current = true;
      closeAll();
      if (project.settings.soundEnabled) playSound('whoosh');
      await mapRef.current?.flyTo(id, undefined, animated ? 850 : 0);
      setTransition({ kind: 'enter', islandId: island.id, theme: island.theme, title: island.name, subtitle: island.subtitle, nonce: Date.now() });
    },
    [project, animated],
  );

  const exitIsland = useCallback(() => {
    if (!scene || busy.current) return;
    busy.current = true;
    closeAll();
    setTransition({ kind: 'exit', islandId: scene.id, theme: scene.theme, title: scene.name, subtitle: scene.subtitle, nonce: Date.now() });
  }, [scene]);

  // Другие игроки комнаты видят, где вы: на карте или на острове.
  useEffect(() => setPresence(sceneId ? 'island' : 'map', sceneId ?? undefined), [sceneId]);

  // Кнопка «Назад» в Android-сборке: закрывает верхнее окно, затем редактор, затем выходит с острова на карту.
  const backRef = useRef<() => boolean>(() => false);
  backRef.current = () => {
    if (document.querySelector('[data-modal]')) {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return true;
    }
    if (editor) {
      setEditor(false);
      return true;
    }
    if (scene) {
      exitIsland();
      return true;
    }
    return false;
  };
  useEffect(() => {
    (window as unknown as { __androidBack?: () => boolean }).__androidBack = () => backRef.current();
  }, []);

  const onTransitionMid = () => {
    if (!transition) return;
    if (transition.kind === 'enter') {
      const island = getIsland(project, transition.islandId);
      if (island) {
        setSceneId(island.id);
        setArriving(true);
        dispatch({ type: 'session/view', view: 'island', islandId: island.id });
      }
    } else {
      const id = sceneId;
      setSceneId(null);
      dispatch({ type: 'session/view', view: 'map' });
      if (id) {
        mapRef.current?.jumpTo(id, 1.1);
        setSelected(id);
        window.setTimeout(() => void mapRef.current?.flyTo(id, 0.55, animated ? 1100 : 0), 30);
      }
    }
  };
  const onTransitionDone = () => {
    setTransition(null);
    busy.current = false;
  };

  const onIslandClick = async (id: string) => {
    const island = getIsland(project, id);
    if (!island || busy.current) return;
    setSelected(id);
    if (isIslandUnlocked(project, island)) {
      void enterIsland(id);
    } else {
      // Закрытый остров: камера приближается, но внутрь не переносит.
      void mapRef.current?.flyTo(id, undefined, animated ? 800 : 0);
      push({ type: 'overview', islandId: id, mode: 'preview' });
    }
  };

  const goCurrent = () => {
    const cur = currentIsland(project);
    closeAll();
    if (cur) {
      setSelected(cur.id);
      void mapRef.current?.flyTo(cur.id, undefined, animated ? 800 : 0);
    }
  };

  const completeChapter = async (chapterId: string) => {
    const ch = project.islands.flatMap((i) => i.chapters).find((c) => c.id === chapterId);
    if (!ch) return;
    const open = chapterTaskIds(ch).filter((id) => !['done', 'skipped'].includes(project.tasks[id]?.status));
    const subs = open.reduce((n, id) => n + (project.tasks[id]?.subtasks.filter((s) => !s.done).length ?? 0), 0);
    const ok = await confirm(
      'Завершить главу вручную?',
      <>
        <p>
          Будут отмечены выполненными задачи главы «{ch.title}»: {open.length}
          {subs > 0 && `, а также их подзадачи: ${subs}`}. Зависимости не проверяются.
        </p>
        <ul className="reasons">
          {open.slice(0, 8).map((id) => (
            <li key={id}>{project.tasks[id]?.title}</li>
          ))}
          {open.length > 8 && <li>…и ещё {open.length - 8}</li>}
        </ul>
      </>,
      'Завершить главу',
    );
    if (ok) dispatch({ type: 'chapter/complete', chapterId });
  };

  // Режим карточки задания: выполнять можно только внутри своего открытого острова.
  const taskMode = (taskId: string): { mode: 'active' | 'preview'; reason?: string } => {
    const t = project.tasks[taskId];
    const island = t ? getIsland(project, t.islandId) : undefined;
    if (!t || !island) return { mode: 'preview' };
    if (!isIslandUnlocked(project, island)) return { mode: 'preview', reason: `Остров «${island.name}» закрыт. Задания можно смотреть, но выполнять — только после его открытия и входа на остров.` };
    if (scene?.id === island.id) return { mode: 'active' };
    if (scene) return { mode: 'preview', reason: `Это задание острова «${island.name}». Выполнять его можно, находясь на том острове.` };
    return { mode: 'preview', reason: `Войдите на остров «${island.name}», чтобы выполнять задания.` };
  };

  const completeIsland = completeQueue.length ? getIsland(project, completeQueue[0]) : undefined;
  const nextAfter = completeIsland ? project.islands[project.islands.findIndex((i) => i.id === completeIsland.id) + 1] : undefined;
  const scenePaused = panels.length > 0 || editor || !!transition || !!completeIsland;

  return (
    <div className={`app ${reduced ? 'reduced-motion' : ''}`}>
      <div className={`map-layer ${sceneId ? 'hidden' : ''}`} aria-hidden={!!sceneId}>
        <WorldMap ref={mapRef} project={project} animated={animated && !sceneId} interactive={!sceneId && !transition && !editor} selectedId={selected} onIslandClick={(id) => void onIslandClick(id)} />
        {!sceneId && (
          <MapHud
            project={project}
            saveState={saveState}
            onEditor={() => setEditor(true)}
            onAchievements={() => push({ type: 'achievements' })}
            onAssistant={() => push({ type: 'assistant' })}
            onSettings={() => push({ type: 'settings' })}
            onCoop={() => push({ type: 'coop' })}
            onImport={() => void data.pickFile()}
            onExport={data.doExport}
            onReset={() => void data.reset()}
          />
        )}
      </div>

      {scene && (
        <IslandScene
          key={scene.id}
          island={scene}
          animated={animated}
          paused={scenePaused}
          arriving={arriving}
          onExit={exitIsland}
          onOpenTask={(taskId) => push({ type: 'task', taskId })}
          onOpenChapter={(chapterId) => push({ type: 'overview', islandId: scene.id, mode: 'scene', focusChapterId: chapterId })}
          onOpenList={() => push({ type: 'overview', islandId: scene.id, mode: 'scene' })}
          onOpenAchievements={() => push({ type: 'achievements' })}
          onOpenAssistant={() => push({ type: 'assistant' })}
          onMenu={() => !scenePaused && push({ type: 'menu' })}
        />
      )}

      {/* Окна. Отображаем верхнее, задания поверх обзора — через стек. */}
      {panels.map((p, idx) => {
        const isTop = idx === panels.length - 1;
        if (!isTop && p.type !== 'overview') return null;
        switch (p.type) {
          case 'task': {
            const m = taskMode(p.taskId);
            return <TaskCard key={`t-${idx}-${p.taskId}`} taskId={p.taskId} mode={m.mode} previewReason={m.reason} onClose={pop} onOpenTask={(id) => push({ type: 'task', taskId: id })} />;
          }
          case 'overview': {
            const island = getIsland(project, p.islandId);
            if (!island) return null;
            return (
              <div key={`o-${idx}`} className={isTop ? '' : 'under'}>
                <IslandOverview
                  island={island}
                  mode={p.mode}
                  focusChapterId={p.focusChapterId}
                  onClose={pop}
                  onOpenTask={(id) => push({ type: 'task', taskId: id })}
                  onEnter={() => void enterIsland(island.id)}
                  onGoCurrent={goCurrent}
                  onCompleteChapter={(id) => void completeChapter(id)}
                />
              </div>
            );
          }
          case 'achievements':
            return <AchievementsJournal key="ach" onClose={pop} />;
          case 'settings':
            return <SettingsPanel key="set" onClose={pop} />;
          case 'coop':
            return <CoopPanel key="coop" onClose={pop} />;
          case 'assistant':
            return <AssistantPanel key="ai" onClose={pop} onOpenTask={(id) => push({ type: 'task', taskId: id })} contextIslandId={sceneId ?? selected} />;
          case 'menu':
            return (
              <Modal key="menu" title={scene ? scene.name : 'Меню'} onClose={pop} className="scene-menu">
                <div className="menu-list">
                  <button className="btn primary" onClick={pop}>
                    <Play size={16} /> Продолжить
                  </button>
                  {scene && (
                    <button className="btn ghost" onClick={() => setPanels([{ type: 'overview', islandId: scene.id, mode: 'scene' }])}>
                      <ListChecks size={16} /> Задания острова
                    </button>
                  )}
                  <button className="btn ghost" onClick={() => setPanels([{ type: 'achievements' }])}>
                    <Trophy size={16} /> Журнал достижений
                  </button>
                  <button className="btn ghost" onClick={() => setPanels([{ type: 'assistant' }])}>
                    <BookOpen size={16} /> Помощник по планированию
                  </button>
                  <button className="btn ghost" onClick={() => setPanels([{ type: 'settings' }])}>
                    <Settings size={16} /> Настройки и данные
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => {
                      closeAll();
                      setEditor(true);
                    }}
                  >
                    <Pencil size={16} /> Режим редактирования
                  </button>
                  <button className="btn ghost" onClick={exitIsland}>
                    <MapIcon size={16} /> На карту мира
                  </button>
                </div>
              </Modal>
            );
        }
      })}

      {editor && <Editor initialIslandId={sceneId ?? selected} onClose={() => setEditor(false)} />}

      {completeIsland && !transition && (
        <IslandComplete
          island={completeIsland}
          next={nextAfter}
          onStay={() => setCompleteQueue((q) => q.slice(1))}
          onContinue={() => {
            setCompleteQueue((q) => q.slice(1));
            if (sceneId) {
              exitIsland();
              if (nextAfter) window.setTimeout(() => setSelected(nextAfter.id), 50);
            } else if (nextAfter) {
              setSelected(nextAfter.id);
              void mapRef.current?.flyTo(nextAfter.id, undefined, animated ? 900 : 0);
            }
          }}
        />
      )}

      {transition && <Transition key={transition.nonce} {...transition} reduced={reduced} onMid={onTransitionMid} onDone={onTransitionDone} />}

      <EventToasts />
      {!sceneId && top === undefined && !editor && (
        <button className="sr-only" onClick={goCurrent}>
          <Home size={14} /> К текущему острову
        </button>
      )}
    </div>
  );
}
