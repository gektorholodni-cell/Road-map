// Мост, энергетическая дорога или портал между соседними островами.
import { memo } from 'react';
import type { Island } from '../../types';
import { THEMES } from '../../data/themes';
import { islandRadius } from './geometry';

type Kind = 'wood' | 'stone' | 'energy' | 'portal';

const kindFor = (to: Island): Kind => {
  switch (to.theme) {
    case 'architecture':
      return 'wood';
    case 'mechanics':
      return 'stone';
    case 'underwater':
    case 'cosmos':
      return 'portal';
    default:
      return 'energy';
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
  const sag = kind === 'wood' || kind === 'stone' ? 70 : -90;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  const d = `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
  const glow = THEMES[to.theme].glow;
  const id = `br-${from.id}-${to.id}`;
  const lit = state !== 'dormant';
  const color = lit ? glow : '#8a8fb0';

  return (
    <g className={`bridge state-${state}`} opacity={state === 'dormant' ? 0.45 : 1}>
      <path id={id} d={d} fill="none" stroke="none" />
      {kind === 'wood' && (
        <g>
          <path d={d} stroke="#3a2614" strokeWidth="26" fill="none" opacity=".55" />
          <path d={d} stroke="#9a6a3c" strokeWidth="20" fill="none" strokeDasharray="8 5" />
          <path d={d} stroke="#5a3d26" strokeWidth="3" fill="none" transform="translate(0 -12)" />
        </g>
      )}
      {kind === 'stone' && (
        <g>
          <path d={d} stroke="#2a2420" strokeWidth="30" fill="none" opacity=".5" />
          <path d={d} stroke="#b9b0a0" strokeWidth="22" fill="none" />
          <path d={d} stroke="#8a8070" strokeWidth="22" fill="none" strokeDasharray="2 22" />
        </g>
      )}
      {(kind === 'energy' || kind === 'portal') && (
        <g>
          <path d={d} stroke={color} strokeWidth="26" fill="none" opacity={lit ? 0.18 : 0.08} />
          <path d={d} stroke={color} strokeWidth="6" fill="none" opacity={lit ? 0.9 : 0.5} strokeDasharray={lit ? undefined : '10 12'} />
        </g>
      )}
      {kind === 'portal' &&
        [
          [x1, y1],
          [x2, y2],
        ].map(([px, py], i) => (
          <g key={i} transform={`translate(${px} ${py - 40})`}>
            <ellipse rx="26" ry="44" fill={color} opacity={lit ? 0.18 : 0.06} />
            <ellipse rx="26" ry="44" fill="none" stroke={color} strokeWidth="5" opacity={lit ? 0.95 : 0.4} className={lit && animated ? 'anim-pulse' : undefined} />
          </g>
        ))}
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
          return <circle key={t} cx={bx} cy={by - 18} r="5" fill={glow} className={animated ? 'anim-twinkle' : undefined} />;
        })}
    </g>
  );
}

export const Bridge = memo(BridgeImpl);
