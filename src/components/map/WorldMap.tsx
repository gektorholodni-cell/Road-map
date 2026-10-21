// Главная карта мира: панорама, масштабирование, мосты, подписи и мини-карта.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, House, Minus, Plus } from 'lucide-react';
import type { Island, Project } from '../../types';
import { bridgeState, currentIsland, islandMapState, islandProgress, isIslandUnlocked } from '../../systems/progress';
import { IslandArt } from '../art/IslandArt';
import { SharedDefs } from '../art/primitives';
import { THEMES } from '../../data/themes';
import { IslandBadgeIcon } from '../ui/icons';
import { WorldBackdrop } from './WorldBackdrop';
import { Bridge } from './Bridge';
import { MiniMap } from './MiniMap';
import { animateCamera, centerOn, clampCamera, fitCamera, zoomAt, type Camera, type Rect } from './camera';
import { pct } from '../ui/labels';
import { ART_SCALE, islandRadius } from './geometry';
import { usePeers } from '../../multiplayer/room';


export interface WorldMapHandle {
  /** Плавно приближает камеру к острову. */
  flyTo: (islandId: string, zoom?: number, ms?: number) => Promise<void>;
  /** Мгновенно ставит камеру на остров (для возвращения со сцены). */
  jumpTo: (islandId: string, zoom: number) => void;
  fitAll: (ms?: number) => Promise<void>;
}

interface Props {
  project: Project;
  animated: boolean;
  interactive: boolean;
  selectedId?: string;
  onIslandClick: (id: string) => void;
}

/** Отступы под шапку и нижние панели, чтобы острова не прятались под интерфейсом. */
const hudInset = (w: number, h: number) =>
  w < 600 ? { top: 70, right: 8, bottom: 120, left: 8 } : w < 860 ? { top: 90, right: 10, bottom: 150, left: 10 } : { top: Math.min(140, h * 0.14), right: 30, bottom: Math.min(110, h * 0.1), left: 30 };

function worldBounds(islands: Island[]): Rect {
  if (!islands.length) return { x: 0, y: 0, w: 2000, h: 1400 };
  const xs = islands.flatMap((i) => [i.map.x - islandRadius(i), i.map.x + islandRadius(i)]);
  const ys = islands.flatMap((i) => [i.map.y - islandRadius(i) * 1.1, i.map.y + islandRadius(i) * 1.2]);
  const x = Math.min(...xs) - 120;
  const y = Math.min(...ys) - 220;
  return { x, y, w: Math.max(...xs) + 120 - x, h: Math.max(...ys) + 140 - y };
}

export const WorldMap = forwardRef<WorldMapHandle, Props>(function WorldMap({ project, animated, interactive, selectedId, onIslandClick }, ref) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const islandsBounds = useMemo(() => worldBounds(project.islands), [project.islands]);
  const world = useMemo<Rect>(
    () => ({ x: islandsBounds.x - 900, y: islandsBounds.y - 700, w: islandsBounds.w + 1800, h: islandsBounds.h + 1300 }),
    [islandsBounds],
  );
  const [cam, setCam] = useState<Camera>(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // На телефоне весь мир не помещается читаемо — начинаем с текущего острова.
    const cur = currentIsland(project);
    if (w < 600 && cur) return centerOn(cur.map.x + islandRadius(cur) * 0.6, cur.map.y, (Math.min(w, h) * 0.3) / islandRadius(cur), w, h);
    return fitCamera(islandsBounds, w, h, hudInset(w, h));
  });
  const camRef = useRef(cam);
  camRef.current = cam;
  const cancelAnim = useRef<() => void>(() => {});
  const [hover, setHover] = useState<string | null>(null);
  const peers = usePeers();

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize((s) => {
        if (s.w === r.width && s.h === r.height) return s;
        // Держим тот же центр мира при изменении окна.
        const c = camRef.current;
        const wx = (s.w / 2 - c.x) / c.k;
        const wy = (s.h / 2 - c.y) / c.k;
        setCam(centerOn(wx, wy, c.k, r.width, r.height));
        return { w: r.width, h: r.height };
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const set = useCallback((c: Camera) => setCam(clampCamera(c, world, size.w, size.h)), [world, size]);

  const fly = useCallback(
    (to: Camera, ms: number) =>
      new Promise<void>((resolve) => {
        cancelAnim.current();
        cancelAnim.current = animateCamera(camRef.current, clampCamera(to, world, size.w, size.h), animated ? ms : 0, setCam, resolve);
      }),
    [animated, world, size],
  );

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (id, zoom, ms = 900) => {
        const i = project.islands.find((x) => x.id === id);
        if (!i) return Promise.resolve();
        const k = zoom ?? Math.min(1.2, (Math.min(size.w, size.h) * 0.42) / islandRadius(i));
        return fly(centerOn(i.map.x, i.map.y - islandRadius(i) * 0.15, k, size.w, size.h), ms);
      },
      jumpTo: (id, zoom) => {
        const i = project.islands.find((x) => x.id === id);
        if (!i) return;
        cancelAnim.current();
        setCam(centerOn(i.map.x, i.map.y, zoom, size.w, size.h));
      },
      fitAll: (ms = 900) => fly(fitCamera(islandsBounds, size.w, size.h, hudInset(size.w, size.h)), ms),
    }),
    [project.islands, fly, size, islandsBounds],
  );

  // ----- Перетаскивание и масштабирование (мышь, палец, щипок двумя пальцами) -----
  const drag = useRef<{ sx: number; sy: number; cx: number; cy: number; moved: boolean; id: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d0: number; mx: number; my: number; cam0: Camera } | null>(null);
  const suppressClick = useRef(false);

  const pinchFrame = () => {
    const [a, b] = [...pointers.current.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive || e.button !== 0) return;
    cancelAnim.current();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const f = pinchFrame();
      pinch.current = { d0: Math.max(1, f.d), mx: f.mx, my: f.my, cam0: camRef.current };
      drag.current = null;
      suppressClick.current = true;
      for (const id of pointers.current.keys()) box.current?.setPointerCapture(id);
      return;
    }
    drag.current = { sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false, id: e.pointerId };
    suppressClick.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = pinch.current;
    if (p && pointers.current.size >= 2) {
      const f = pinchFrame();
      const r = box.current!.getBoundingClientRect();
      const z = zoomAt(p.cam0, f.d / p.d0, p.mx - r.left, p.my - r.top);
      set({ k: z.k, x: z.x + f.mx - p.mx, y: z.y + f.my - p.my });
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 5) {
      d.moved = true;
      box.current?.setPointerCapture(d.id);
    }
    if (d.moved) set({ k: cam.k, x: d.cx + dx, y: d.cy + dy });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pinch.current) {
      if (pointers.current.size < 2) pinch.current = null;
      drag.current = null;
      return;
    }
    if (drag.current?.moved) suppressClick.current = true;
    drag.current = null;
  };

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      cancelAnim.current();
      const r = el.getBoundingClientRect();
      const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      setCam((c) => clampCamera(zoomAt(c, f, e.clientX - r.left, e.clientY - r.top), world, size.w, size.h));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [interactive, world, size]);

  const zoomBy = (f: number) => fly(zoomAt(cam, f, size.w / 2, size.h / 2), 250);

  // Клавиатура: стрелки — панорама, +/- — масштаб.
  useEffect(() => {
    if (!interactive) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input,textarea,select,[contenteditable],[data-modal]')) return;
      const step = 120;
      const c = camRef.current;
      if (e.key === 'ArrowLeft') set({ ...c, x: c.x + step });
      else if (e.key === 'ArrowRight') set({ ...c, x: c.x - step });
      else if (e.key === 'ArrowUp') set({ ...c, y: c.y + step });
      else if (e.key === 'ArrowDown') set({ ...c, y: c.y - step });
      else if (e.key === '+' || e.key === '=') void fly(zoomAt(c, 1.25, size.w / 2, size.h / 2), 200);
      else if (e.key === '-') void fly(zoomAt(c, 0.8, size.w / 2, size.h / 2), 200);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [interactive, set, fly, size]);

  const cur = currentIsland(project);
  const focusCurrent = () => {
    if (cur) void fly(centerOn(cur.map.x, cur.map.y, Math.max(cam.k, 0.6), size.w, size.h), 700);
  };

  // Ближайший к центру экрана остров — для подписи «Текущая область».
  const centerWorld = { x: (size.w / 2 - cam.x) / cam.k, y: (size.h / 2 - cam.y) / cam.k };
  const nearest = project.islands.reduce<Island | null>(
    (best, i) => (!best || Math.hypot(i.map.x - centerWorld.x, i.map.y - centerWorld.y) < Math.hypot(best.map.x - centerWorld.x, best.map.y - centerWorld.y) ? i : best),
    null,
  );

  const handleIsland = (id: string) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    onIslandClick(id);
  };

  return (
    <div
      ref={box}
      className={`world-map ${drag.current?.moved ? 'dragging' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label="Карта мира. Перетаскивайте мышью, колёсико — масштаб."
    >
      <svg className="world-svg" width={size.w} height={size.h} role="img" aria-label="Летающие острова">
        <SharedDefs />
        <g transform={`translate(${cam.x} ${cam.y}) scale(${cam.k})`}>
          <WorldBackdrop world={world} animated={animated} />
          {project.islands.slice(0, -1).map((from, idx) => (
            <Bridge key={`${from.id}-${project.islands[idx + 1].id}`} from={from} to={project.islands[idx + 1]} state={bridgeState(project, idx)} animated={animated} />
          ))}
          {project.islands.map((island) => {
            const st = islandMapState(project, island);
            const prog = islandProgress(project, island);
            const isCur = cur?.id === island.id;
            return (
              <g
                key={island.id}
                className={`map-island state-${st} ${hover === island.id ? 'hover' : ''} ${selectedId === island.id ? 'selected' : ''}`}
                transform={`translate(${island.map.x} ${island.map.y}) scale(${island.map.scale * ART_SCALE})`}
                onClick={() => handleIsland(island.id)}
                onPointerEnter={() => setHover(island.id)}
                onPointerLeave={() => setHover((h) => (h === island.id ? null : h))}
                role="button"
                aria-label={`${island.subtitle}: ${island.name}`}
              >
                {isCur && st !== 'locked' && <ellipse cx="0" cy="10" rx="250" ry="95" fill="none" stroke={THEMES[island.theme].glow} strokeWidth="5" className={animated ? 'anim-ring' : undefined} opacity=".7" />}
                <g className="island-art">
                  <IslandArt theme={island.theme} uid={`map-${island.id}`} progress={prog.ratio} complete={st === 'complete'} animated={animated} />
                </g>
                {/* Невидимая зона клика */}
                <ellipse cx="0" cy="40" rx="230" ry="200" fill="transparent" />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Подписи островов в экранных координатах — читаемы при любом масштабе */}
      <div className="map-labels">
        {project.islands.map((island, idx) => {
          const st = islandMapState(project, island);
          const prog = islandProgress(project, island);
          const r = islandRadius(island);
          const sx = island.map.x * cam.k + cam.x;
          const sy = (island.map.y - r * 0.95) * cam.k + cam.y;
          if (sx < -200 || sx > size.w + 200 || sy < -200 || sy > size.h + 200) return null;
          return (
            <button
              key={island.id}
              className={`map-label state-${st} ${hover === island.id ? 'hover' : ''}`}
              style={{ transform: `translate(${Math.round(sx)}px, ${Math.round(sy)}px)`, ['--glow' as string]: THEMES[island.theme].glow }}
              onClick={() => handleIsland(island.id)}
              onPointerEnter={() => setHover(island.id)}
              onPointerLeave={() => setHover((h) => (h === island.id ? null : h))}
              tabIndex={interactive ? 0 : -1}
              aria-label={`${idx + 1}. ${island.subtitle}. ${island.name}. ${st === 'locked' ? 'Закрыт' : st === 'complete' ? 'Завершён' : 'Открыт'}. Прогресс ${pct(prog.ratio)}`}
            >
              <span className="badge">
                <IslandBadgeIcon theme={island.theme} state={st} />
              </span>
              <span className="text">
                <span className="title">
                  {idx + 1}. {island.subtitle || island.name}
                </span>
                <span className="pct">{pct(prog.ratio)}</span>
                <span className="caption">{island.name}</span>
              </span>
              {peers.some((p) => p.view === 'island' && p.islandId === island.id) && (
                <span className="map-peers">
                  {peers
                    .filter((p) => p.view === 'island' && p.islandId === island.id)
                    .map((p) => (
                      <i key={p.id} style={{ background: p.color }} title={`${p.name} здесь`}>
                        {p.name.slice(0, 1).toUpperCase()}
                      </i>
                    ))}
                </span>
              )}
              <span className="pin" aria-hidden />
            </button>
          );
        })}
      </div>

      {project.settings.showMinimap && (
        <div className="map-nav">
          <MiniMap project={project} world={islandsBounds} cam={cam} view={size} onMove={(wx, wy) => set(centerOn(wx, wy, cam.k, size.w, size.h))} />
          <div className="nav-buttons">
            <button className="icon-btn glass" onClick={() => void fly(fitCamera(islandsBounds, size.w, size.h, hudInset(size.w, size.h)), 700)} aria-label="Показать весь мир" title="Весь мир">
              <House size={18} />
            </button>
            <button className="icon-btn glass" onClick={() => void zoomBy(1.3)} aria-label="Приблизить" title="Приблизить (+)">
              <Plus size={18} />
            </button>
            <button className="icon-btn glass" onClick={() => void zoomBy(1 / 1.3)} aria-label="Отдалить" title="Отдалить (−)">
              <Minus size={18} />
            </button>
            <button className="icon-btn glass" onClick={focusCurrent} aria-label="К текущему острову" title="К текущему острову">
              <Crosshair size={18} />
            </button>
          </div>
          <div className="nav-caption">Текущая область: {nearest ? nearest.name : '—'}</div>
        </div>
      )}
      {!project.settings.showMinimap && (
        <div className="map-nav compact">
          <div className="nav-buttons">
            <button className="icon-btn glass" onClick={() => void zoomBy(1.3)} aria-label="Приблизить">
              <Plus size={18} />
            </button>
            <button className="icon-btn glass" onClick={() => void zoomBy(1 / 1.3)} aria-label="Отдалить">
              <Minus size={18} />
            </button>
          </div>
        </div>
      )}
      <span className="sr-only">{project.islands.filter((i) => isIslandUnlocked(project, i)).length} островов открыто</span>
    </div>
  );
});
