import { useRef } from 'react';
import type { Project } from '../../types';
import { bridgeState, islandMapState } from '../../systems/progress';
import { THEMES } from '../../data/themes';
import type { Camera, Rect } from './camera';

const W = 240;
const H = 140;

interface Props {
  project: Project;
  world: Rect;
  cam: Camera;
  view: { w: number; h: number };
  onMove: (wx: number, wy: number) => void;
}

/** Мини-карта: весь мир и текущая область просмотра. Клик/перетаскивание перемещает камеру. */
export function MiniMap({ project, world, cam, view, onMove }: Props) {
  const s = Math.min(W / world.w, H / world.h);
  const ox = (W - world.w * s) / 2;
  const oy = (H - world.h * s) / 2;
  const toM = (x: number, y: number) => [ox + (x - world.x) * s, oy + (y - world.y) * s] as const;
  const vx = -cam.x / cam.k;
  const vy = -cam.y / cam.k;
  const [rx, ry] = toM(vx, vy);
  const rw = (view.w / cam.k) * s;
  const rh = (view.h / cam.k) * s;
  const dragging = useRef(false);

  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * W;
    const my = ((e.clientY - r.top) / r.height) * H;
    onMove(world.x + (mx - ox) / s, world.y + (my - oy) / s);
  };

  return (
    <div className="minimap glass" aria-label="Мини-карта">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        onPointerDown={(e) => {
          e.stopPropagation();
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e);
        }}
        onPointerMove={(e) => dragging.current && move(e)}
        onPointerUp={() => (dragging.current = false)}
      >
        <defs>
          <linearGradient id="miniSky" x1="0" x2="1">
            <stop offset="0" stopColor="#5a4a5a" />
            <stop offset=".5" stopColor="#1e2550" />
            <stop offset="1" stopColor="#2a124a" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} rx="8" fill="url(#miniSky)" opacity=".7" />
        {project.islands.slice(0, -1).map((a, i) => {
          const b = project.islands[i + 1];
          const [x1, y1] = toM(a.map.x, a.map.y);
          const [x2, y2] = toM(b.map.x, b.map.y);
          const st = bridgeState(project, i);
          return <line key={a.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke={st === 'dormant' ? '#556' : '#fff'} strokeWidth="1.5" strokeDasharray={st === 'active' ? undefined : '3 3'} opacity={st === 'dormant' ? 0.6 : 0.9} />;
        })}
        {project.islands.map((i) => {
          const [x, y] = toM(i.map.x, i.map.y);
          const st = islandMapState(project, i);
          return (
            <g key={i.id}>
              <circle cx={x} cy={y} r={4 + i.map.scale * 2} fill={st === 'locked' ? '#4a4d66' : THEMES[i.theme].glow} opacity={st === 'locked' ? 0.8 : 1} />
              {st === 'complete' && <circle cx={x} cy={y} r={8 + i.map.scale * 2} fill="none" stroke="#5ff0a0" strokeWidth="1.5" />}
            </g>
          );
        })}
        <rect x={rx} y={ry} width={rw} height={rh} fill="#fff" fillOpacity=".06" stroke="#fff" strokeOpacity=".85" strokeWidth="1.2" rx="2" />
      </svg>
    </div>
  );
}
