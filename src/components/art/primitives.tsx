// Небольшие SVG-примитивы окружения. Все рисуются от «основания» (x, y) вверх.
// Используются и на карте мира, и в сценах островов.

interface P {
  x: number;
  y: number;
  s?: number;
}

export function RoundTree({ x, y, s = 1, c1 = '#5fb85a', c2 = '#2f7a3c' }: P & { c1?: string; c2?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="16" ry="5" fill="#000" opacity=".22" />
      <rect x="-3" y="-26" width="6" height="28" rx="2" fill="#6b4a2e" />
      <circle cx="0" cy="-38" r="20" fill={c2} />
      <circle cx="-9" cy="-44" r="13" fill={c1} />
      <circle cx="8" cy="-48" r="12" fill={c1} />
      <circle cx="-3" cy="-52" r="7" fill="#fff" opacity=".12" />
    </g>
  );
}

export function PineTree({ x, y, s = 1, c1 = '#3f8f5a', c2 = '#235c3b', snow = false }: P & { c1?: string; c2?: string; snow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="13" ry="4" fill="#000" opacity=".22" />
      <rect x="-2.5" y="-12" width="5" height="14" fill="#5a3d26" />
      <path d="M0 -70 L18 -30 L9 -30 L22 -8 L-22 -8 L-9 -30 L-18 -30 Z" fill={c2} />
      <path d="M0 -70 L18 -30 L9 -30 L22 -8 L0 -8 Z" fill={c1} opacity=".55" />
      {snow && <path d="M0 -70 L9 -50 L4 -48 L0 -54 L-5 -47 L-9 -50 Z" fill="#fff" />}
    </g>
  );
}

export function Rock({ x, y, s = 1, c = '#8a8070' }: P & { c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-16 0 L-12 -12 L-2 -18 L10 -14 L16 0 Z" fill={c} />
      <path d="M-2 -18 L10 -14 L16 0 L4 0 Z" fill="#000" opacity=".18" />
    </g>
  );
}

export function Tent({ x, y, s = 1, c = '#e9a94a' }: P & { c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="26" ry="6" fill="#000" opacity=".25" />
      <path d="M-24 0 L0 -32 L24 0 Z" fill={c} />
      <path d="M0 -32 L24 0 L8 0 Z" fill="#000" opacity=".2" />
      <path d="M-6 0 L0 -14 L6 0 Z" fill="#3a2414" />
    </g>
  );
}

export function Campfire({ x, y, s = 1, animated = true }: P & { animated?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="-8" r="34" fill="url(#fireGlow)" opacity=".9" className={animated ? 'anim-flicker' : undefined} />
      <rect x="-14" y="-4" width="28" height="5" rx="2" fill="#5a3a22" transform="rotate(14)" />
      <rect x="-14" y="-4" width="28" height="5" rx="2" fill="#6b4a2e" transform="rotate(-14)" />
      <g className={animated ? 'anim-flame' : undefined} style={{ transformOrigin: '0px 0px' }}>
        <path d="M0 -26 C8 -14 10 -6 0 0 C-10 -6 -8 -14 0 -26 Z" fill="#ff8a2a" />
        <path d="M0 -17 C5 -9 5 -4 0 0 C-5 -4 -5 -9 0 -17 Z" fill="#ffe27a" />
      </g>
    </g>
  );
}

export function WoodTower({ x, y, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="18" ry="5" fill="#000" opacity=".25" />
      <path d="M-12 0 L-8 -60 M12 0 L8 -60 M-11 -16 L10 -34 M11 -16 L-10 -34 M-10 -40 L9 -56" stroke="#6b4a2e" strokeWidth="3.5" fill="none" />
      <rect x="-16" y="-70" width="32" height="12" rx="2" fill="#8a5f38" />
      <path d="M-19 -70 L0 -88 L19 -70 Z" fill="#b5523a" />
      <path d="M0 -88 L0 -104" stroke="#5a3d26" strokeWidth="2" />
      <path d="M0 -104 L14 -99 L0 -94 Z" fill="#ffcf6b" />
    </g>
  );
}

export function House({ x, y, s = 1, wall = '#e8d9b8', roof = '#9a4a3a', lit = false }: P & { wall?: string; roof?: string; lit?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="26" ry="6" fill="#000" opacity=".25" />
      <rect x="-20" y="-28" width="40" height="28" fill={wall} />
      <rect x="0" y="-28" width="20" height="28" fill="#000" opacity=".12" />
      <path d="M-25 -26 L0 -48 L25 -26 Z" fill={roof} />
      <path d="M0 -48 L25 -26 L8 -26 Z" fill="#000" opacity=".18" />
      <rect x="-12" y="-20" width="8" height="8" fill={lit ? '#ffd97a' : '#5a4a3a'} />
      <rect x="5" y="-14" width="7" height="14" fill="#4a3424" />
    </g>
  );
}

export function StoneTower({
  x,
  y,
  s = 1,
  wall = '#d9d3c7',
  roof = '#3e5fa8',
  h = 70,
  lit = true,
  glow = '#ffd97a',
}: P & { wall?: string; roof?: string; h?: number; lit?: boolean; glow?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="18" ry="5" fill="#000" opacity=".25" />
      <rect x="-12" y={-h} width="24" height={h} fill={wall} />
      <rect x="0" y={-h} width="12" height={h} fill="#000" opacity=".15" />
      <rect x="-15" y={-h - 6} width="30" height="8" fill={wall} />
      <path d={`M-16 ${-h - 6} L0 ${-h - 44} L16 ${-h - 6} Z`} fill={roof} />
      <path d={`M0 ${-h - 44} L16 ${-h - 6} L4 ${-h - 6} Z`} fill="#000" opacity=".2" />
      <rect x="-4" y={-h + 14} width="8" height="12" rx="4" fill={lit ? glow : '#3a3a4a'} />
      <rect x="-4" y={-h + 40} width="8" height="10" rx="4" fill={lit ? glow : '#3a3a4a'} opacity=".85" />
    </g>
  );
}

export function Gear({ x, y, r = 20, c = '#c8a25a', spin = true, reverse = false }: { x: number; y: number; r?: number; c?: string; spin?: boolean; reverse?: boolean }) {
  const teeth = 10;
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.8;
    const a2 = a + Math.PI / (teeth * 2);
    pts.push(`${Math.cos(a) * rr},${Math.sin(a) * rr}`, `${Math.cos(a2) * rr},${Math.sin(a2) * rr}`);
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={spin ? (reverse ? 'anim-spin-rev' : 'anim-spin') : undefined}>
        <polygon points={pts.join(' ')} fill={c} />
        <circle r={r * 0.55} fill="#000" opacity=".25" />
        <circle r={r * 0.25} fill={c} />
      </g>
    </g>
  );
}

export function Crystal({ x, y, s = 1, c = '#9be7ff', glow = true }: P & { c?: string; glow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {glow && <ellipse cx="0" cy="-16" rx="22" ry="26" fill={c} opacity=".18" className="anim-pulse" />}
      <path d="M0 -44 L10 -18 L4 0 L-6 0 L-10 -20 Z" fill={c} />
      <path d="M0 -44 L10 -18 L4 0 L1 -20 Z" fill="#fff" opacity=".35" />
      <path d="M-14 0 L-18 -18 L-11 -26 L-6 -8 Z" fill={c} opacity=".8" />
      <path d="M8 0 L16 -22 L20 -10 L14 0 Z" fill={c} opacity=".75" />
    </g>
  );
}

export function Coral({ x, y, s = 1, c = '#ff6fae' }: P & { c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="anim-sway">
      <path d="M0 0 C-2 -14 -12 -18 -14 -30 M0 0 C1 -16 4 -24 2 -40 M0 0 C4 -10 14 -14 16 -26 M2 -22 C8 -26 10 -30 10 -36" stroke={c} strokeWidth="5" strokeLinecap="round" fill="none" />
    </g>
  );
}

export function Seaweed({ x, y, s = 1, c = '#2fbf8f' }: P & { c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="anim-sway">
      <path d="M0 0 C-8 -14 8 -26 0 -40 C-6 -52 6 -60 2 -70" stroke={c} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M6 0 C0 -12 12 -20 8 -34" stroke={c} strokeWidth="3" strokeLinecap="round" fill="none" opacity=".8" />
    </g>
  );
}

export function Jellyfish({ x, y, s = 1, c = '#7ff7ff' }: P & { c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="anim-float">
        <ellipse cx="0" cy="0" rx="20" ry="22" fill={c} opacity=".15" />
        <path d="M-12 0 C-12 -16 12 -16 12 0 Z" fill={c} opacity=".8" />
        <path d="M-8 0 C-10 10 -6 16 -9 24 M-3 0 C-4 12 0 18 -2 28 M3 0 C4 10 0 18 3 26 M8 0 C10 10 7 16 9 22" stroke={c} strokeWidth="1.6" fill="none" opacity=".75" />
      </g>
    </g>
  );
}

export function Column({ x, y, s = 1, c = '#bfc7c9', broken = false }: P & { c?: string; broken?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-9" y="-4" width="18" height="4" fill={c} />
      <rect x="-6" y={broken ? -30 : -48} width="12" height={broken ? 26 : 44} fill={c} />
      <rect x="1" y={broken ? -30 : -48} width="5" height={broken ? 26 : 44} fill="#000" opacity=".15" />
      {broken ? <path d="M-6 -30 L-2 -36 L2 -31 L6 -34 L6 -30 Z" fill={c} /> : <rect x="-9" y="-52" width="18" height="5" fill={c} />}
    </g>
  );
}

export function Palace({ x, y, s = 1, wall = '#fbf6ea', dome = '#f2c75c' }: P & { wall?: string; dome?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="52" ry="9" fill="#000" opacity=".15" />
      <rect x="-46" y="-34" width="92" height="34" fill={wall} />
      {[-36, -20, -4, 12, 28].map((cx) => (
        <rect key={cx} x={cx} y="-30" width="6" height="30" fill="#e6dcc4" />
      ))}
      <path d="M-50 -34 L0 -50 L50 -34 Z" fill={wall} />
      <rect x="-14" y="-74" width="28" height="26" fill={wall} />
      <path d="M-16 -74 C-16 -100 16 -100 16 -74 Z" fill={dome} />
      <path d="M0 -98 L0 -112" stroke={dome} strokeWidth="2" />
      <circle cx="0" cy="-114" r="3" fill={dome} />
      <rect x="-44" y="-62" width="12" height="28" fill={wall} />
      <path d="M-46 -62 C-46 -76 -30 -76 -30 -62 Z" fill={dome} />
      <rect x="32" y="-62" width="12" height="28" fill={wall} />
      <path d="M30 -62 C30 -76 46 -76 46 -62 Z" fill={dome} />
    </g>
  );
}

export function Castle({ x, y, s = 1, wall = '#d6d3e6', roof = '#4a6fd8', glow = '#ffd97a' }: P & { wall?: string; roof?: string; glow?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="60" ry="10" fill="#000" opacity=".22" />
      <rect x="-46" y="-40" width="92" height="40" fill={wall} />
      <rect x="0" y="-40" width="46" height="40" fill="#000" opacity=".12" />
      {[-46, -30, -14, 2, 18, 34].map((cx) => (
        <rect key={cx} x={cx} y="-46" width="8" height="7" fill={wall} />
      ))}
      <path d="M-8 0 L-8 -18 C-8 -26 8 -26 8 -18 L8 0 Z" fill="#2b2440" />
      <StoneTower x={-50} y={0} s={1.05} wall={wall} roof={roof} h={70} glow={glow} />
      <StoneTower x={50} y={0} s={1.05} wall={wall} roof={roof} h={64} glow={glow} />
      <StoneTower x={0} y={-36} s={1.25} wall={wall} roof={roof} h={62} glow={glow} />
    </g>
  );
}

export function Waterfall({ x, y, h = 120, w = 14, c = '#bfefff' }: { x: number; y: number; h?: number; w?: number; c?: string }) {
  const id = `wf-${c.slice(1)}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity=".9" />
          <stop offset=".6" stopColor={c} stopOpacity=".45" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${x - w / 2} ${y} L${x + w / 2} ${y} L${x + w} ${y + h} L${x - w} ${y + h} Z`} fill={`url(#${id})`} />
      <g opacity=".45">
        <rect x={x - w / 2} y={y} width={w} height={h * 0.7} fill="url(#fallStripes)" className="anim-fall" />
      </g>
      <ellipse cx={x} cy={y + h * 0.95} rx={w * 1.8} ry={w * 0.6} fill="#fff" opacity=".12" />
    </g>
  );
}

export function Banner({ x, y, s = 1, c = '#ffcf6b' }: P & { c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 L0 -60" stroke="#5a3d26" strokeWidth="3" />
      <path d="M0 -58 L26 -52 L20 -44 L26 -36 L0 -40 Z" fill={c} className="anim-wave" />
    </g>
  );
}

/** Общие градиенты, на которые ссылаются примитивы. Вставляется один раз в каждый корневой SVG. */
export function SharedDefs() {
  return (
    <defs>
      <radialGradient id="fireGlow">
        <stop offset="0" stopColor="#ffcf6b" stopOpacity=".9" />
        <stop offset=".4" stopColor="#ff8a2a" stopOpacity=".35" />
        <stop offset="1" stopColor="#ff8a2a" stopOpacity="0" />
      </radialGradient>
      <pattern id="fallStripes" width="14" height="24" patternUnits="userSpaceOnUse">
        <rect width="14" height="24" fill="none" />
        <path d="M2 0 L2 12 M8 6 L8 20 M12 2 L12 10" stroke="#fff" strokeWidth="1.5" opacity=".8" />
      </pattern>
      <radialGradient id="softGlow">
        <stop offset="0" stopColor="#fff" stopOpacity=".9" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}
