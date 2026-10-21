// Сцена острова: окружение, управляемый персонаж и задания в виде игровых объектов.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bot, ListChecks, Lock, Menu, Trophy, Unlock } from 'lucide-react';
import type { Island } from '../../types';
import { useStore } from '../../state/store';
import { chapterProgress, islandProgress, isIslandComplete, taskState } from '../../systems/progress';
import { THEMES } from '../../data/themes';
import { STATUS_LABEL, pct } from '../ui/labels';
import { buildLayout, clampToWalk, SCENE_H, SCENE_W } from './layout';
import { SceneBackdrop, SceneGround, SceneParticles, sceneDecorations } from './SceneArt';
import { PoiSprite } from './PoiSprite';
import { Hero } from './Hero';
import { RemoteHeroes } from './RemoteHeroes';
import { sendPosition } from '../../multiplayer/room';
import { StatusMarker } from './StatusMarker';

interface Props {
  island: Island;
  animated: boolean;
  paused: boolean;
  arriving: boolean;
  onExit: () => void;
  onOpenTask: (taskId: string) => void;
  onOpenChapter: (chapterId: string) => void;
  onOpenList: () => void;
  onOpenAchievements: () => void;
  onOpenAssistant: () => void;
  onMenu: () => void;
}

const SPEED = 360;
const NEAR = 120;

export function IslandScene({ island, animated, paused, arriving, onExit, onOpenTask, onOpenChapter, onOpenList, onOpenAchievements, onOpenAssistant, onMenu }: Props) {
  const { project, dispatch } = useStore();
  const theme = THEMES[island.theme];
  const layout = useMemo(() => buildLayout(project, island), [project, island]);
  const progress = islandProgress(project, island);
  const complete = isIslandComplete(project, island);
  const decorations = useMemo(() => sceneDecorations(island.theme, animated), [island.theme, animated]);

  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const saved = project.session.heroPos[island.id];
  const pos = useRef(clampToWalk(saved?.x ?? layout.spawn.x, saved?.y ?? layout.spawn.y));
  const target = useRef<{ x: number; y: number; poi?: string } | null>(null);
  const keys = useRef(new Set<string>());
  const camK = useRef(1);
  const [near, setNear] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const nearRef = useRef<string | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const poisRef = useRef(layout.pois);
  poisRef.current = layout.pois;
  const islandIdRef = useRef(island.id);
  islandIdRef.current = island.id;
  const openRef = useRef(onOpenTask);
  openRef.current = onOpenTask;

  const savePos = useCallback(() => {
    dispatch({ type: 'session/hero', islandId: island.id, pos: { x: Math.round(pos.current.x), y: Math.round(pos.current.y) } });
  }, [dispatch, island.id]);
  const savePosRef = useRef(savePos);
  savePosRef.current = savePos;

  // Игровой цикл: движение, камера, параллакс, ближайший объект.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let walking = false;
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const root = rootRef.current;
      const hero = heroRef.current;
      const world = worldRef.current;
      if (!root || !hero || !world) {
        raf = requestAnimationFrame(frame);
        return;
      }
      let vx = 0;
      let vy = 0;
      if (!pausedRef.current) {
        const k = keys.current;
        if (k.has('ArrowLeft') || k.has('KeyA')) vx -= 1;
        if (k.has('ArrowRight') || k.has('KeyD')) vx += 1;
        if (k.has('ArrowUp') || k.has('KeyW')) vy -= 1;
        if (k.has('ArrowDown') || k.has('KeyS')) vy += 1;
        if (vx || vy) target.current = null;
        else if (target.current) {
          const dx = target.current.x - pos.current.x;
          const dy = target.current.y - pos.current.y;
          const d = Math.hypot(dx, dy);
          if (d < 10) {
            const poi = target.current.poi;
            target.current = null;
            if (poi) openRef.current(poi);
          } else {
            vx = dx / d;
            vy = dy / d;
          }
        }
      }
      const len = Math.hypot(vx, vy);
      const moving = len > 0;
      if (moving) {
        const p = clampToWalk(pos.current.x + (vx / len) * SPEED * dt, pos.current.y + (vy / len) * SPEED * dt * 0.8);
        pos.current = p;
        if (vx !== 0) hero.classList.toggle('flip', vx < 0);
      }
      if (moving !== walking) {
        walking = moving;
        hero.classList.toggle('walking', moving);
        if (!moving) savePosRef.current();
      }
      // Камера следует за персонажем.
      const vw = root.clientWidth;
      const vh = root.clientHeight;
      const k = Math.max(0.42, Math.min(1, Math.min(vw / 1900, vh / 1240)));
      camK.current = k;
      let tx = vw / 2 - pos.current.x * k;
      let ty = vh / 2 - pos.current.y * k + vh * 0.06;
      tx = Math.min(80, Math.max(vw - SCENE_W * k - 80, tx));
      ty = Math.min(60, Math.max(vh - SCENE_H * k - 40, ty));
      if (SCENE_W * k < vw) tx = (vw - SCENE_W * k) / 2;
      world.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${k})`;
      hero.style.transform = `translate3d(${pos.current.x - 30}px, ${pos.current.y - 88}px, 0)`;
      sendPosition(islandIdRef.current, pos.current.x, pos.current.y, hero.classList.contains('flip'), moving);
      hero.style.zIndex = String(Math.round(pos.current.y) + 1);
      if (backRef.current) backRef.current.style.transform = `translate3d(${tx * 0.06}px, ${ty * 0.04}px, 0) scale(1.12)`;
      // Ближайшее задание.
      let best: string | null = null;
      let bd = NEAR;
      for (const poi of poisRef.current) {
        const d = Math.hypot(poi.x - pos.current.x, poi.y + 20 - pos.current.y);
        if (d < bd) {
          bd = d;
          best = poi.taskId;
        }
      }
      if (best !== nearRef.current) {
        nearRef.current = best;
        setNear(best);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Сохраняем позицию при уходе со сцены.
  useEffect(() => () => savePosRef.current(), []);

  // Клавиатура.
  useEffect(() => {
    const isField = (e: KeyboardEvent) => !!(e.target as HTMLElement).closest?.('input,textarea,select,[contenteditable]');
    const down = (e: KeyboardEvent) => {
      if (pausedRef.current || isField(e)) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        keys.current.add(e.code);
        e.preventDefault();
      } else if ((e.code === 'KeyE' || e.key === 'Enter') && nearRef.current && !(e.target as HTMLElement).closest?.('button')) {
        e.preventDefault();
        openRef.current(nearRef.current);
      } else if (e.key === 'Escape') {
        onMenu();
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') {
        onExit();
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [onMenu, onExit]);

  useEffect(() => {
    if (paused) keys.current.clear();
  }, [paused]);

  const walkTo = (x: number, y: number, poi?: string) => {
    const p = clampToWalk(x, y);
    target.current = { ...p, poi };
  };

  const onGroundClick = (e: React.MouseEvent) => {
    const w = worldRef.current;
    if (!w) return;
    const r = w.getBoundingClientRect();
    walkTo((e.clientX - r.left) / camK.current, (e.clientY - r.top) / camK.current);
  };

  const onPoiClick = (taskId: string, x: number, y: number, viaKeyboard: boolean) => {
    if (viaKeyboard || Math.hypot(x - pos.current.x, y + 20 - pos.current.y) < NEAR) {
      onOpenTask(taskId);
      return;
    }
    walkTo(x, y + 34, taskId);
  };

  const hoverPoi = hover ? layout.pois.find((p) => p.taskId === hover) : undefined;
  const hoverTask = hoverPoi ? project.tasks[hoverPoi.taskId] : undefined;
  const nearTask = near ? project.tasks[near] : undefined;

  return (
    <div ref={rootRef} className={`island-scene theme-${island.theme} ${arriving ? 'arriving' : ''} ${complete ? 'complete' : ''}`}>
      <div ref={backRef} className="scene-backdrop">
        <SceneBackdrop theme={island.theme} animated={animated} />
      </div>
      <div ref={worldRef} className="scene-world" style={{ width: SCENE_W, height: SCENE_H }} onClick={onGroundClick}>
        <SceneGround theme={island.theme} layout={layout} complete={complete} />
        {decorations
          .filter((d) => complete || progress.ratio >= d.at)
          .map((d) => (
            <svg
              key={d.key}
              className="scene-deco"
              style={{ left: d.x - d.w / 2, top: d.y - d.h + 12, zIndex: Math.round(d.y) }}
              width={d.w}
              height={d.h}
              viewBox={`${-d.w / 2} ${-d.h + 12} ${d.w} ${d.h}`}
              aria-hidden
            >
              {d.el}
            </svg>
          ))}
        {layout.zones.map((z) => {
          const ch = island.chapters.find((c) => c.id === z.chapterId)!;
          const cp = chapterProgress(project, ch);
          return (
            <button
              key={z.chapterId}
              className="zone-sign"
              style={{ left: z.x, top: z.y, zIndex: Math.round(z.y) }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenChapter(z.chapterId);
              }}
              aria-label={`Глава ${String.fromCharCode(65 + z.index)}: ${z.title}. Прогресс ${pct(cp.ratio)}`}
            >
              <span className="zone-letter">Глава {String.fromCharCode(65 + z.index)}</span>
              <span className="zone-title">{z.title}</span>
              <span className="zone-bar">
                <i style={{ width: pct(cp.ratio) }} />
              </span>
            </button>
          );
        })}
        {layout.pois.map((poi) => {
          const task = project.tasks[poi.taskId];
          const st = taskState(project, task);
          return (
            <button
              key={poi.taskId}
              className={`poi st-${st.status} ${near === poi.taskId ? 'near' : ''}`}
              style={{ left: poi.x - 60, top: poi.y - 110, zIndex: Math.round(poi.y) }}
              onClick={(e) => {
                e.stopPropagation();
                onPoiClick(poi.taskId, poi.x, poi.y, e.detail === 0);
              }}
              onPointerEnter={() => setHover(poi.taskId)}
              onPointerLeave={() => setHover((h) => (h === poi.taskId ? null : h))}
              onFocus={() => setHover(poi.taskId)}
              onBlur={() => setHover((h) => (h === poi.taskId ? null : h))}
              aria-label={`Задание: ${task.title}. ${STATUS_LABEL[st.status]}`}
            >
              <PoiSprite kind={poi.kind} accent={theme.accent} glow={theme.glow} lit={st.status !== 'locked' && st.status !== 'skipped'} animated={animated} />
              <StatusMarker status={st.status} required={task.required} />
            </button>
          );
        })}
        <Hero ref={heroRef} scarf={theme.accent} />
        <RemoteHeroes islandId={island.id} />
        {hoverPoi && hoverTask && (
          <div className="poi-tip glass" style={{ left: hoverPoi.x, top: hoverPoi.y - 150, zIndex: 100000 }} role="tooltip">
            <div className="tip-title">{hoverTask.title}</div>
            <div className={`tip-status st-${taskState(project, hoverTask).status}`}>
              {STATUS_LABEL[taskState(project, hoverTask).status]}
              {!hoverTask.required && ' · необязательная'}
            </div>
            {taskState(project, hoverTask).status === 'locked' && taskState(project, hoverTask).reasons[0] && <div className="tip-reason">{taskState(project, hoverTask).reasons[0]}</div>}
            <div className="tip-desc">{hoverTask.description.length > 110 ? `${hoverTask.description.slice(0, 110)}…` : hoverTask.description}</div>
          </div>
        )}
      </div>
      {animated && <SceneParticles theme={island.theme} />}
      <div className="scene-vignette" aria-hidden />

      {/* HUD острова */}
      <div className="scene-hud top">
        <button className="btn glass back" onClick={onExit} title="Вернуться на карту (M)">
          <ArrowLeft size={18} /> На карту
        </button>
        <div className="scene-title glass">
          <div className="st-name">
            {island.name}
            {island.manuallyUnlocked && !island.unlockedAt && (
              <span className="chip warn" title="Остров открыт вручную, вне обычного прохождения">
                <Unlock size={12} /> свободное исследование
              </span>
            )}
          </div>
          <div className="st-sub">{island.subtitle}</div>
          <div className="st-bar" aria-label={`Прогресс острова ${pct(progress.ratio)}`}>
            <i style={{ width: pct(progress.ratio), background: theme.glow }} />
          </div>
          <div className="st-meta">
            {pct(progress.ratio)} · обязательные {progress.requiredDone}/{progress.requiredTotal}
            {progress.skipped > 0 && ` · пропущено ${progress.skipped}`}
          </div>
        </div>
        <div className="hud-actions">
          <button className="icon-btn glass" onClick={onOpenList} aria-label="Список заданий острова" title="Задания острова">
            <ListChecks size={18} />
          </button>
          <button className="icon-btn glass" onClick={onOpenAchievements} aria-label="Журнал достижений" title="Достижения">
            <Trophy size={18} />
          </button>
          <button className="icon-btn glass" onClick={onOpenAssistant} aria-label="Помощник по планированию" title="Помощник">
            <Bot size={18} />
          </button>
          <button className="icon-btn glass" onClick={onMenu} aria-label="Меню" title="Меню (Esc)">
            <Menu size={18} />
          </button>
        </div>
      </div>
      {nearTask && !paused && (
        <button className="near-prompt glass" onClick={() => onOpenTask(nearTask.id)}>
          <kbd>E</kbd> открыть «{nearTask.title}»
          {taskState(project, nearTask).status === 'locked' && (
            <span className="locked">
              <Lock size={12} /> заблокировано
            </span>
          )}
        </button>
      )}
      <div className="scene-hint">WASD / стрелки — движение · клик — подойти · E — открыть · M — карта · Esc — меню</div>
    </div>
  );
}
