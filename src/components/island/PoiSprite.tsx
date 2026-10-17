// Игровые объекты-задания: книга, стол чертежей, костёр, башня, устройство, сундук и т. д.
import { memo } from 'react';
import type { PoiKind } from '../../data/themes';
import { Campfire, Crystal, Tent } from '../art/primitives';

interface Props {
  kind: PoiKind;
  accent: string;
  glow: string;
  lit: boolean;
  animated: boolean;
}

function Sprite({ kind, accent, glow, lit, animated }: Props) {
  const light = lit ? glow : '#6a6f86';
  switch (kind) {
    case 'book':
      return (
        <g>
          <rect x="-22" y="-30" width="44" height="30" rx="3" fill="#6b4a2e" />
          <rect x="-26" y="-34" width="52" height="6" rx="2" fill="#8a5f38" />
          <path d="M-22 -36 Q-11 -44 0 -38 Q11 -44 22 -36 L22 -50 Q11 -58 0 -52 Q-11 -58 -22 -50 Z" fill="#f4ead2" />
          <path d="M0 -52 L0 -38" stroke="#c9b88a" strokeWidth="1.5" />
          <path d="M-16 -48 L-5 -46 M-16 -44 L-5 -42 M5 -46 L16 -48 M5 -42 L16 -44" stroke="#9a8a6a" strokeWidth="1.2" />
          <circle cx="0" cy="-48" r="22" fill={light} opacity=".14" />
        </g>
      );
    case 'table':
      return (
        <g>
          <path d="M-30 -26 L30 -26 L24 0 M-30 -26 L-24 0" stroke="#5a3d26" strokeWidth="4" fill="none" />
          <path d="M-34 -30 L34 -30 L28 -22 L-28 -22 Z" fill="#8a5f38" />
          <path d="M-26 -32 L22 -34 L26 -26 L-22 -24 Z" fill="#3e6fb8" />
          <path d="M-18 -30 L12 -31 M-14 -27 L18 -28 M-4 -33 L-2 -25" stroke="#bfe0ff" strokeWidth="1" />
          <circle cx="16" cy="-42" r="5" fill={light} />
          <rect x="15" y="-40" width="2" height="10" fill="#5a3d26" />
        </g>
      );
    case 'campfire':
      return <Campfire x={0} y={0} s={1.2} animated={animated && lit} />;
    case 'tent':
      return <Tent x={0} y={0} s={1.3} c={accent} />;
    case 'tower':
      return (
        <g>
          <rect x="-14" y="-78" width="28" height="78" fill="#cfd6e4" />
          <rect x="0" y="-78" width="14" height="78" fill="#000" opacity=".15" />
          <rect x="-18" y="-86" width="36" height="10" fill="#b8c0d0" />
          {[-18, -9, 0, 9].map((x) => (
            <rect key={x} x={x} y="-92" width="6" height="7" fill="#b8c0d0" />
          ))}
          <rect x="-5" y="-66" width="10" height="14" rx="5" fill={light} />
          <rect x="-5" y="-40" width="10" height="12" rx="5" fill={light} opacity=".8" />
          <circle cx="0" cy="-100" r="8" fill={light} className={animated && lit ? 'anim-pulse' : undefined} />
        </g>
      );
    case 'device':
      return (
        <g>
          <path d="M-22 0 L-16 -24 L16 -24 L22 0 Z" fill="#5a5f78" />
          <rect x="-12" y="-46" width="24" height="24" rx="4" fill="#3e4258" />
          <circle cx="0" cy="-34" r="8" fill={light} className={animated && lit ? 'anim-pulse' : undefined} />
          <path d="M-12 -46 L-20 -60 M12 -46 L20 -60" stroke="#8a90b0" strokeWidth="3" />
          <circle cx="-20" cy="-62" r="4" fill={light} />
          <circle cx="20" cy="-62" r="4" fill={light} />
          <g className={animated && lit ? 'anim-spin' : undefined} style={{ transformOrigin: '0px -34px' }}>
            <ellipse cx="0" cy="-34" rx="20" ry="6" fill="none" stroke={light} strokeWidth="1.5" opacity=".7" />
          </g>
        </g>
      );
    case 'arena':
      return (
        <g>
          <ellipse cx="0" cy="-4" rx="40" ry="14" fill="#6b5f50" />
          <ellipse cx="0" cy="-8" rx="36" ry="11" fill="#9a8a72" />
          <ellipse cx="0" cy="-8" rx="24" ry="7" fill="none" stroke={light} strokeWidth="2" strokeDasharray="4 4" />
          <rect x="-3" y="-44" width="6" height="36" fill="#7a6a58" />
          <path d="M-3 -44 L-22 -38 L-3 -32 Z" fill={accent} />
          <rect x="-26" y="-22" width="10" height="10" fill="#c8a25a" />
          <rect x="16" y="-26" width="10" height="14" fill="#c8a25a" />
        </g>
      );
    case 'chest':
      return (
        <g>
          <rect x="-22" y="-22" width="44" height="22" rx="3" fill="#8a5f38" />
          <path d="M-22 -22 Q0 -40 22 -22 Z" fill="#a8743f" />
          <rect x="-22" y="-14" width="44" height="4" fill="#c8a25a" />
          <rect x="-4" y="-18" width="8" height="10" rx="1" fill="#e8c26a" />
          {lit && <ellipse cx="0" cy="-26" rx="24" ry="12" fill={glow} opacity=".35" className={animated ? 'anim-pulse' : undefined} />}
        </g>
      );
    case 'altar':
      return (
        <g>
          <path d="M-26 0 L-20 -12 L20 -12 L26 0 Z" fill="#d9d3c7" />
          <rect x="-14" y="-34" width="28" height="22" fill="#e8e2d6" />
          <rect x="-18" y="-38" width="36" height="5" fill="#cfc8b8" />
          <path d="M0 -70 L10 -52 L0 -40 L-10 -52 Z" fill={light} className={animated && lit ? 'anim-float' : undefined} />
          <ellipse cx="0" cy="-54" rx="20" ry="20" fill={light} opacity=".15" />
        </g>
      );
    case 'board':
      return (
        <g>
          <rect x="-26" y="-18" width="4" height="18" fill="#5a3d26" />
          <rect x="22" y="-18" width="4" height="18" fill="#5a3d26" />
          <rect x="-30" y="-56" width="60" height="40" rx="3" fill="#8a5f38" />
          <rect x="-26" y="-52" width="52" height="32" rx="2" fill="#c9a46a" />
          <rect x="-22" y="-48" width="16" height="12" fill="#f4ead2" transform="rotate(-4 -14 -42)" />
          <rect x="-2" y="-49" width="18" height="14" fill="#f4ead2" transform="rotate(5 7 -42)" />
          <rect x="-14" y="-33" width="20" height="10" fill="#f4ead2" />
          <circle cx="-14" cy="-48" r="1.8" fill="#c0392b" />
          <circle cx="7" cy="-48" r="1.8" fill="#c0392b" />
        </g>
      );
    case 'npc':
      return (
        <g>
          <ellipse cx="0" cy="0" rx="14" ry="4" fill="#000" opacity=".3" />
          <path d="M-12 0 L-10 -30 Q0 -36 10 -30 L12 0 Z" fill={accent} />
          <circle cx="0" cy="-40" r="10" fill="#f0c9a0" />
          <path d="M-12 -42 Q0 -60 12 -42 L8 -44 Q0 -52 -8 -44 Z" fill="#5a3d26" />
          <rect x="14" y="-50" width="3" height="50" fill="#6b4a2e" />
          <circle cx="15.5" cy="-52" r="5" fill={light} className={animated && lit ? 'anim-pulse' : undefined} />
        </g>
      );
    case 'crystal':
      return <Crystal x={0} y={0} s={1.4} c={lit ? glow : '#8a90b0'} glow={lit} />;
    case 'portal':
      return (
        <g>
          <ellipse cx="0" cy="-2" rx="30" ry="8" fill="#3e3a58" />
          <ellipse cx="0" cy="-44" rx="24" ry="40" fill={light} opacity=".22" />
          <ellipse cx="0" cy="-44" rx="24" ry="40" fill="none" stroke={light} strokeWidth="5" className={animated && lit ? 'anim-pulse' : undefined} />
          <ellipse cx="0" cy="-44" rx="14" ry="28" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
        </g>
      );
    case 'anvil':
      return (
        <g>
          <rect x="-8" y="-16" width="16" height="16" fill="#3e4258" />
          <path d="M-26 -30 L22 -30 Q30 -28 30 -22 L14 -22 L10 -16 L-10 -16 L-14 -22 L-26 -22 Z" fill="#5a5f78" />
          <rect x="-34" y="-6" width="12" height="6" fill="#6b4a2e" />
          <path d="M18 -48 L28 -38 M14 -44 L24 -54" stroke="#8a90b0" strokeWidth="4" strokeLinecap="round" />
          {lit && <circle cx="0" cy="-34" r="4" fill={glow} className={animated ? 'anim-twinkle' : undefined} />}
        </g>
      );
  }
}

export const PoiSprite = memo(function PoiSprite(props: Props) {
  return (
    <svg className="poi-sprite" viewBox="-60 -110 120 120" width="120" height="120" aria-hidden>
      <ellipse cx="0" cy="2" rx="34" ry="9" fill="#000" opacity=".25" />
      <Sprite {...props} />
    </svg>
  );
});
