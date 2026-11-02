// Переход между объектами НИИ: стальной мостик, теплотрасса или кабель под током.
import { memo } from 'react';
import type { Island } from '../../types';
import { THEMES } from '../../data/themes';
import { islandRadius } from './geometry';

type Kind = 'catwalk' | 'pipe' | 'cable';

const kindFor = (to: Island): Kind => {
  switch (to.theme) {
    case 'architecture':
    case 'citadel':
    case 'ice':
      return 'catwalk';
    case 'mechanics':
    case 'cosmos':
      return 'pipe';
    default:
      return 'cable';
  }
};

interface Props {
  from: Island;
  to: Island;
  state: 'active' | 'route' | 'dormant';
  animated: boolean;
}

function BridgeImpl({ from, to, state, animated }: Props) {
  const ra = islandRadius(from);
  const rb = islandRadius(to);
  const dx = to.map.x - from.map.x;
  const dy = to.map.y - from.map.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const x1 = from.map.x + ux * ra * 0.72;
  const y1 = from.map.y + uy * ra * 0.25 + 12;
  const x2 = to.map.x - ux * rb * 0.72;
  const y2 = to.map.y - uy * rb * 0.25 + 12;
  const kind = kindFor(to);
  const sag = kind === 'cable' ? 110 : 60;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  const d = `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
  const glow = THEMES[to.theme].glow;
  const id = `br-${from.id}-${to.id}`;
  const lit = state !== 'dormant';
  const color = lit ? glow : '#6a706c';

  return (
    <g className={`bridge state-${state}`} opacity={state === 'dormant' ? 0.45 : 1}>
      <path id={id} d={d} fill="none" stroke="none" />
      {kind === 'catwalk' && (
        <g>
          <path d={d} stroke="#0c0e10" strokeWidth="26" fill="none" opacity=".6" />
          <path d={d} stroke="#4a4e4a" strokeWidth="18" fill="none" />
          <path d={d} stroke="#2a2d2b" strokeWidth="18" fill="none" strokeDasharray="3 9" />
          <path d={d} stroke="#6a6e68" strokeWidth="2.5" fill="none" transform="translate(0 -14)" />
        </g>
      )}
      {kind === 'pipe' && (
        <g>
          <path d={d} stroke="#0c0e10" strokeWidth="28" fill="none" opacity=".55" />
          <path d={d} stroke="#7a4a2e" strokeWidth="18" fill="none" />
          <path d={d} stroke="#a0683e" strokeWidth="4" fill="none" transform="translate(0 -5)" opacity=".7" />
          <path d={d} stroke="#2a1a10" strokeWidth="22" fill="none" strokeDasharray="4 70" />
        </g>
      )}
      {kind === 'cable' && (
        <g>
          <path d={d} stroke="#0c0e10" strokeWidth="6" fill="none" />
          <path d={d} stroke="#0c0e10" strokeWidth="4" fill="none" transform="translate(0 16)" opacity=".8" />
        </g>
      )}
      {/* Свет вдоль перехода: горит, когда переход открыт */}
      <path d={d} stroke={color} strokeWidth="22" fill="none" opacity={lit ? 0.12 : 0.04} />
      <path d={d} stroke={color} strokeWidth="2.5" fill="none" opacity={lit ? 0.8 : 0.35} strokeDasharray={lit ? undefined : '8 14'} transform="translate(0 -3)" />
      {/* Подсветка маршрута: куда идти дальше */}
      {state === 'route' && <path d={d} stroke="#fff" strokeWidth="5" fill="none" strokeDasharray="14 18" className={animated ? 'anim-dash' : undefined} opacity=".85" />}
      {/* Огни и частицы на завершённых участках */}
      {state === 'active' &&
        animated &&
        [0, 1, 2, 3].map((i) => (
          <circle key={i} r="6" fill={glow}>
            <animateMotion dur="3.2s" begin={`${i * 0.8}s`} repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
        ))}
      {state === 'active' &&
        [0.2, 0.4, 0.6, 0.8].map((t) => {
          const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
          const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
          return <g key={t}>
              <path d={`M${bx} ${by} L${bx} ${by - 30}`} stroke="#1a1d1f" strokeWidth="2.5" />
              <circle cx={bx} cy={by - 32} r="4.5" fill={glow} className={animated ? 'anim-flicker' : undefined} />
            </g>;
        })}
    </g>
  );
}

export const Bridge = memo(BridgeImpl);
