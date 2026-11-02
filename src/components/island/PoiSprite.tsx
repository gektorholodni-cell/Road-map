// Объекты-задания в стиле НИИ: папка, кульман, бочка-костёр, прожектор, ЭВМ, ящик, сейф, лифт и т. д.
import { memo } from 'react';
import type { PoiKind } from '../../data/themes';

interface Props {
  kind: PoiKind;
  accent: string;
  glow: string;
  lit: boolean;
  animated: boolean;
}

function Sprite({ kind, accent, glow, lit, animated }: Props) {
  const light = lit ? glow : '#5e625e';
  switch (kind) {
    case 'book': // Папка с документами «Совершенно секретно»
      return (
        <g>
          <rect x="-24" y="-26" width="48" height="26" fill="#4a4d49" />
          <rect x="-20" y="-44" width="40" height="22" fill="#c9b78a" transform="rotate(-6 0 -33)" />
          <rect x="-18" y="-46" width="40" height="22" fill="#d9c79a" transform="rotate(4 0 -35)" />
          <rect x="-10" y="-41" width="24" height="5" fill="#b03a2e" opacity=".85" transform="rotate(4 0 -35)" />
          <path d="M-12 -32 L12 -30 M-12 -28 L8 -26" stroke="#6a5a3a" strokeWidth="1.2" />
          <circle cx="0" cy="-40" r="22" fill={light} opacity=".14" />
        </g>
      );
    case 'table': // Кульман
      return (
        <g>
          <path d="M-20 0 L-6 -24 M20 0 L6 -24" stroke="#2c2f2c" strokeWidth="4" />
          <path d="M-30 -70 L26 -60 L22 -22 L-32 -32 Z" fill="#d8d2bc" stroke="#4a4d49" strokeWidth="3" />
          <path d="M-24 -56 L14 -50 M-26 -44 L10 -38 M-8 -64 L-12 -30" stroke="#5a6a7a" strokeWidth="1.2" />
          <path d="M18 -62 L34 -76" stroke="#2c2f2c" strokeWidth="3" />
          <path d="M28 -80 L44 -72 L38 -66 L26 -74 Z" fill="#3a3d3a" />
          <circle cx="36" cy="-68" r="3" fill={light} />
          <path d="M36 -68 L20 -40 L46 -40 Z" fill={light} opacity=".12" />
        </g>
      );
    case 'campfire': // Костёр в железной бочке
      return (
        <g>
          <circle cx="0" cy="-30" r="30" fill="url(#fireGlow)" opacity={lit ? 0.9 : 0.25} className={animated && lit ? 'anim-flicker' : undefined} />
          <rect x="-14" y="-30" width="28" height="30" rx="2" fill="#7a4a2e" />
          <path d="M-14 -20 L14 -20 M-14 -10 L14 -10" stroke="#000" strokeOpacity=".3" strokeWidth="2" />
          {lit && <path d="M-8 -30 Q-6 -46 0 -52 Q2 -42 8 -40 Q10 -34 8 -30 Z" fill="#ffb347" className={animated ? 'anim-flame' : undefined} />}
        </g>
      );
    case 'tent': // Армейская палатка
      return (
        <g>
          <path d="M-32 0 L-22 -32 L22 -32 L32 0 Z" fill="#4f5a3e" />
          <path d="M0 -32 L22 -32 L32 0 L8 0 Z" fill="#000" opacity=".2" />
          <path d="M-8 0 L0 -22 L8 0 Z" fill="#1d2016" />
          <rect x="-20" y="-28" width="10" height="6" fill={light} opacity=".7" />
        </g>
      );
    case 'tower': // Осветительная мачта
      return (
        <g>
          <path d="M-10 0 L-3 -84 M10 0 L3 -84 M-9 -12 L8 -40 M9 -12 L-8 -40 M-6 -44 L5 -72 M6 -44 L-5 -72" stroke="#3a3d3a" strokeWidth="2.5" fill="none" />
          <rect x="-16" y="-98" width="32" height="14" fill="#4a4d49" />
          {[-11, -2, 7].map((x) => (
            <rect key={x} x={x} y="-95" width="6" height="8" fill={light} />
          ))}
          <g opacity={lit ? 0.12 : 0.04}>
            <path d="M-16 -86 L-44 -10 L44 -10 L16 -86 Z" fill={light} className={animated && lit ? 'anim-flicker' : undefined} />
          </g>
        </g>
      );
    case 'device': // ЭВМ с катушками
      return (
        <g>
          <rect x="-26" y="-56" width="52" height="56" fill="#9a9c90" />
          <rect x="0" y="-56" width="26" height="56" fill="#000" opacity=".12" />
          <circle cx="-12" cy="-42" r="8" fill="#2c2f2c" />
          <circle cx="12" cy="-42" r="8" fill="#2c2f2c" />
          <g className={animated && lit ? 'anim-spin' : undefined} style={{ transformOrigin: '-12px -42px' }}>
            <path d="M-12 -48 L-12 -36 M-18 -42 L-6 -42" stroke="#8a8c80" strokeWidth="2" />
          </g>
          <rect x="-20" y="-24" width="40" height="8" fill="#2c2f2c" />
          {[-16, -8, 0, 8, 16].map((x, i) => (
            <circle key={x} cx={x} cy="-20" r="2" fill={i % 2 ? light : '#e0453a'} className={animated && lit && i % 2 ? 'anim-twinkle' : undefined} />
          ))}
        </g>
      );
    case 'arena': // Испытательный стенд
      return (
        <g>
          <ellipse cx="0" cy="-4" rx="40" ry="12" fill="#3a3d3a" />
          <ellipse cx="0" cy="-6" rx="34" ry="9" fill="none" stroke="#f2c230" strokeWidth="3" strokeDasharray="8 6" />
          <rect x="-14" y="-30" width="28" height="22" fill="#6a6d66" />
          <rect x="-10" y="-26" width="20" height="8" fill={light} opacity=".8" />
          <path d="M-30 -8 L-30 -40 L30 -40 L30 -8" stroke="#2c2f2c" strokeWidth="3" fill="none" />
        </g>
      );
    case 'chest': // Ящик с маркировкой
      return (
        <g>
          <rect x="-24" y="-28" width="48" height="28" fill="#5a6040" />
          <rect x="-24" y="-28" width="48" height="5" fill="#4a5034" />
          <path d="M-24 -28 L24 0 M24 -28 L-24 0" stroke="#3a3f28" strokeWidth="2" />
          <rect x="-12" y="-20" width="24" height="10" fill="#c9c2a6" />
          <path d="M-8 -15 L8 -15" stroke="#2a2a2a" strokeWidth="2" />
          {lit && (
            <g opacity=".3">
              <ellipse cx="0" cy="-30" rx="26" ry="10" fill={glow} className={animated ? 'anim-pulse' : undefined} />
            </g>
          )}
        </g>
      );
    case 'altar': // Сейф-терминал
      return (
        <g>
          <rect x="-20" y="-50" width="40" height="50" fill="#5e615c" />
          <rect x="-16" y="-46" width="32" height="42" fill="#4a4d49" />
          <circle cx="0" cy="-26" r="9" fill="none" stroke="#9a9c94" strokeWidth="3" />
          <path d="M0 -26 L6 -30" stroke="#9a9c94" strokeWidth="2" />
          <rect x="-8" y="-44" width="16" height="6" fill={light} className={animated && lit ? 'anim-flicker' : undefined} />
          <ellipse cx="0" cy="-30" rx="26" ry="26" fill={light} opacity=".1" />
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
    case 'npc': // Научный сотрудник в халате
      return (
        <g>
          <ellipse cx="0" cy="0" rx="14" ry="4" fill="#000" opacity=".3" />
          <path d="M-12 0 L-10 -30 Q0 -36 10 -30 L12 0 Z" fill="#dcd8cc" />
          <path d="M0 -32 L0 0" stroke="#a8a498" strokeWidth="1.5" />
          <circle cx="0" cy="-40" r="10" fill="#d9b896" />
          <path d="M-10 -44 Q0 -54 10 -44 L10 -40 Q0 -48 -10 -40 Z" fill="#3a3330" />
          <rect x="-7" y="-42" width="5" height="3" fill="none" stroke="#2a2a2a" strokeWidth="1" />
          <rect x="2" y="-42" width="5" height="3" fill="none" stroke="#2a2a2a" strokeWidth="1" />
          <rect x="12" y="-26" width="10" height="14" fill={accent} />
          <circle cx="17" cy="-32" r="4" fill={light} opacity=".8" className={animated && lit ? 'anim-pulse' : undefined} />
        </g>
      );
    case 'crystal': // Колба с образцом
      return (
        <g>
          <rect x="-16" y="-6" width="32" height="6" fill="#3a3d3a" />
          <path d="M-6 -60 L6 -60 L6 -40 L16 -10 L-16 -10 L-6 -40 Z" fill="#cfe0dc" opacity=".35" stroke="#cfe0dc" strokeWidth="2" />
          <path d="M-12 -18 L12 -18 L16 -10 L-16 -10 Z" fill={lit ? glow : '#6a706c'} />
          {lit && (
            <g opacity=".18">
              <circle cx="0" cy="-30" r="24" fill={glow} className={animated ? 'anim-pulse' : undefined} />
            </g>
          )}
        </g>
      );
    case 'portal': // Двери лифта
      return (
        <g>
          <rect x="-26" y="-80" width="52" height="80" fill="#5e615c" />
          <rect x="-20" y="-70" width="19" height="70" fill="#7d8078" />
          <rect x="1" y="-70" width="19" height="70" fill="#7d8078" />
          <rect x="-1" y="-70" width="2" height="70" fill={light} opacity={lit ? 0.9 : 0.2} className={animated && lit ? 'anim-flicker' : undefined} />
          <rect x="-9" y="-92" width="18" height="10" fill="#140808" />
          <text x="0" y="-84" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#e0453a">-1</text>
        </g>
      );
    case 'anvil': // Верстак с тисками
      return (
        <g>
          <rect x="-30" y="-26" width="60" height="6" fill="#7a4a2e" />
          <path d="M-26 -20 L-26 0 M26 -20 L26 0" stroke="#3a3d3a" strokeWidth="4" />
          <rect x="-14" y="-38" width="16" height="12" fill="#4a4d49" />
          <rect x="2" y="-34" width="8" height="4" fill="#4a4d49" />
          <path d="M14 -30 L26 -44 M18 -28 L30 -36" stroke="#9a9c94" strokeWidth="3" strokeLinecap="round" />
          {lit && <circle cx="-6" cy="-40" r="3" fill={glow} className={animated ? 'anim-twinkle' : undefined} />}
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
