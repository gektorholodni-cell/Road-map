// Примитивы в стиле игры «Сектор Ноль»: советский НИИ, бетон, туман, мигающие лампы.
// Как и primitives.tsx, всё рисуется от «основания» (x, y) вверх.

interface P {
  x: number;
  y: number;
  s?: number;
}

const CONCRETE = '#8a8d86';
const CONCRETE_DARK = '#4a4d49';
const RUST = '#7a4a2e';
export const SODIUM = '#ffb347';
export const ALARM = '#e0453a';
export const CRT = '#9fe8ff';
export const TOXIC = '#a8f07a';

function shadow(rx: number) {
  return <ellipse cx="0" cy="2" rx={rx} ry={rx * 0.18} fill="#000" opacity=".35" />;
}

/** Окна: детерминированно часть горит, часть мигает. */
function windows(cols: number, rows: number, w: number, h: number, x0: number, y0: number, seed: number, lit = SODIUM, animated = false) {
  const out = [];
  let s = seed * 9301 + 49297;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const cw = w / cols;
  const ch = h / rows;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const v = rnd();
      const on = v > 0.62;
      const flick = on && v > 0.92;
      out.push(
        <rect
          key={`${r}-${c}`}
          x={x0 + c * cw + cw * 0.22}
          y={y0 + r * ch + ch * 0.22}
          width={cw * 0.56}
          height={ch * 0.5}
          fill={on ? lit : '#1b1e22'}
          opacity={on ? 0.9 : 0.85}
          className={flick && animated ? 'anim-flicker' : undefined}
        />,
      );
    }
  return out;
}

/** Панельный корпус НИИ. */
export function Block({
  x,
  y,
  s = 1,
  w = 90,
  h = 70,
  cols = 6,
  rows = 4,
  wall = CONCRETE,
  lit = SODIUM,
  seed = 1,
  animated = false,
}: P & { w?: number; h?: number; cols?: number; rows?: number; wall?: string; lit?: string; seed?: number; animated?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow(w * 0.62)}
      <rect x={-w / 2} y={-h} width={w} height={h} fill={wall} />
      <rect x={w * 0.1} y={-h} width={w * 0.4} height={h} fill="#000" opacity=".2" />
      {Array.from({ length: rows - 1 }, (_, i) => (
        <rect key={i} x={-w / 2} y={-h + ((i + 1) * h) / rows - 1} width={w} height="1.6" fill="#000" opacity=".22" />
      ))}
      {windows(cols, rows, w, h, -w / 2, -h, seed, lit, animated)}
      <rect x={-w / 2 - 3} y={-h - 4} width={w + 6} height="5" fill={CONCRETE_DARK} />
      {/* Потёки на бетоне */}
      <path d={`M${-w * 0.3} ${-h} l0 ${h * 0.35} M${w * 0.32} ${-h} l0 ${h * 0.5}`} stroke="#000" strokeOpacity=".18" strokeWidth="3" />
      <rect x="-7" y="-14" width="14" height="14" fill="#202326" />
    </g>
  );
}

/** Главный корпус «Сектора Ноль» со звездой и шахтой лифта. */
export function MainBuilding({ x, y, s = 1, animated = false }: P & { animated?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow(80)}
      <Block x={-58} y={0} w={60} h={62} cols={4} rows={4} seed={3} animated={animated} />
      <Block x={58} y={0} w={60} h={56} cols={4} rows={4} seed={5} animated={animated} />
      <rect x="-34" y="-118" width="68" height="118" fill="#9a9c94" />
      <rect x="0" y="-118" width="34" height="118" fill="#000" opacity=".18" />
      {windows(4, 7, 68, 100, -34, -112, 11, SODIUM, animated)}
      <rect x="-40" y="-124" width="80" height="7" fill={CONCRETE_DARK} />
      {/* Звезда на крыше */}
      <g transform="translate(0 -146)">
        <path d="M0 -16 L4.7 -5 L16 -5 L7 2 L10 13 L0 6 L-10 13 L-7 2 L-16 -5 L-4.7 -5 Z" fill={ALARM} />
        <g opacity=".18">
          <circle r="26" fill={ALARM} className={animated ? 'anim-pulse' : undefined} />
        </g>
        <rect x="-1.5" y="12" width="3" height="12" fill={CONCRETE_DARK} />
      </g>
      {/* Табличка */}
      <rect x="-26" y="-10" width="52" height="10" fill="#2a1414" />
      <rect x="-22" y="-8" width="44" height="6" fill={ALARM} opacity=".8" />
    </g>
  );
}

/** Шахта лифта с табло «-1». */
export function ElevatorShaft({ x, y, s = 1, animated = false }: P & { animated?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow(18)}
      <rect x="-14" y="-96" width="28" height="96" fill="#5e615c" />
      <path d="M-14 -96 L14 -72 M14 -96 L-14 -72 M-14 -72 L14 -48 M14 -72 L-14 -48 M-14 -48 L14 -24 M14 -48 L-14 -24" stroke="#2c2f2c" strokeWidth="2" />
      <rect x="-10" y="-30" width="20" height="30" fill="#1a1c1e" />
      <rect x="-9" y="-112" width="18" height="12" fill="#140808" />
      <text x="0" y="-102.5" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="monospace" fill={ALARM} className={animated ? 'anim-flicker' : undefined}>
        -1
      </text>
    </g>
  );
}

/** Будка охраны КПП. */
export function Booth({ x, y, s = 1, animated = false }: P & { animated?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow(22)}
      <rect x="-20" y="-34" width="40" height="34" fill="#a3a59c" />
      <rect x="2" y="-34" width="18" height="34" fill="#000" opacity=".18" />
      <rect x="-15" y="-27" width="22" height="12" fill={SODIUM} opacity=".85" className={animated ? 'anim-flicker' : undefined} />
      <path d="M-24 -34 L24 -34 L20 -42 L-20 -42 Z" fill="#4c5a4a" />
      <rect x="8" y="-22" width="8" height="22" fill="#2a2d2b" />
    </g>
  );
}

/** Шлагбаум (красно-белый). */
export function Barrier({ x, y, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-4" y="-22" width="8" height="22" fill="#3a3d3a" />
      <rect x="0" y="-22" width="70" height="5" fill="#e8e4dc" />
      {[8, 26, 44, 62].map((bx) => (
        <rect key={bx} x={bx} y="-22" width="9" height="5" fill={ALARM} />
      ))}
    </g>
  );
}

/** Фонарь с натриевой лампой. */
export function LampPost({ x, y, s = 1, animated = false, c = SODIUM, broken = false }: P & { animated?: boolean; c?: string; broken?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 L0 -62 Q0 -70 10 -70 L16 -70" stroke="#2c2f2c" strokeWidth="3" fill="none" />
      <path d="M8 -70 L24 -70 L20 -66 L12 -66 Z" fill="#3a3d3a" />
      {!broken && (
        <g className={animated ? 'anim-flicker' : undefined}>
          <path d="M12 -66 L20 -66 L40 0 L-8 0 Z" fill={c} opacity=".1" />
          <circle cx="16" cy="-65" r="3.5" fill={c} />
          <circle cx="16" cy="-65" r="12" fill={c} opacity=".25" />
        </g>
      )}
    </g>
  );
}

/** Бетонный забор с колючей проволокой. */
export function Fence({ x, y, s = 1, w = 80 }: P & { w?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-w / 2} y="-22" width={w} height="22" fill="#5c5e58" />
      {Array.from({ length: Math.floor(w / 20) }, (_, i) => (
        <rect key={i} x={-w / 2 + i * 20} y="-22" width="1.5" height="22" fill="#000" opacity=".25" />
      ))}
      <path d={`M${-w / 2} -26 ${Array.from({ length: Math.floor(w / 6) }, (_, i) => `L${-w / 2 + (i + 1) * 6} ${i % 2 ? -26 : -30}`).join(' ')}`} stroke="#3a3d3a" strokeWidth="1.2" fill="none" />
    </g>
  );
}

/** Труба котельной (красно-белые полосы) с дымом. */
export function Chimney({ x, y, s = 1, animated = false, h = 120 }: P & { animated?: boolean; h?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow(14)}
      <path d={`M-10 0 L-6 ${-h} L6 ${-h} L10 0 Z`} fill="#b9b2a6" />
      {[0.15, 0.4, 0.65, 0.9].map((t) => (
        <path key={t} d={`M${-10 + 4 * t} ${-h * t} L${10 - 4 * t} ${-h * t} L${10 - 4 * (t + 0.1)} ${-h * (t + 0.1)} L${-10 + 4 * (t + 0.1)} ${-h * (t + 0.1)} Z`} fill={ALARM} opacity=".85" />
      ))}
      <circle cx="0" cy={-h - 3} r="2.5" fill={ALARM} className={animated ? 'anim-twinkle' : undefined} />
      <g className={animated ? 'anim-drift' : undefined} opacity=".5">
        <circle cx="6" cy={-h - 16} r="10" fill="#6f7370" />
        <circle cx="18" cy={-h - 30} r="14" fill="#5f6360" />
        <circle cx="34" cy={-h - 44} r="18" fill="#505450" opacity=".7" />
      </g>
    </g>
  );
}

/** Трубопровод. */
export function Pipes({ x, y, s = 1, w = 90 }: P & { w?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-w / 2 + 6, w / 2 - 6].map((px) => (
        <rect key={px} x={px - 2} y="-24" width="4" height="24" fill="#3a3d3a" />
      ))}
      <rect x={-w / 2} y="-28" width={w} height="8" rx="4" fill={RUST} />
      <rect x={-w / 2} y="-18" width={w} height="6" rx="3" fill="#6a6d66" />
      <rect x={-w / 2} y="-28" width={w} height="2" fill="#fff" opacity=".12" />
      <rect x="-4" y="-31" width="8" height="14" fill="#2c2f2c" />
    </g>
  );
}

/** Цилиндрический резервуар. */
export function Tank({ x, y, s = 1, c = '#8f9488' }: P & { c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow(22)}
      <rect x="-20" y="-50" width="40" height="50" fill={c} />
      <ellipse cx="0" cy="-50" rx="20" ry="6" fill="#b0b4a8" />
      <rect x="4" y="-50" width="16" height="50" fill="#000" opacity=".16" />
      <path d="M-20 -30 L20 -30 M-20 -14 L20 -14" stroke="#000" strokeOpacity=".22" strokeWidth="2" />
      <path d="M-14 -30 L-14 -6" stroke={RUST} strokeWidth="3" opacity=".7" />
    </g>
  );
}

/** Бочки. */
export function Barrels({ x, y, s = 1, c = '#4f6b3a' }: P & { c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow(18)}
      {[
        [-9, 0, c],
        [9, 0, RUST],
        [0, -18, c],
      ].map(([bx, by, bc], i) => (
        <g key={i} transform={`translate(${bx} ${by})`}>
          <rect x="-8" y="-18" width="16" height="18" rx="2" fill={bc as string} />
          <path d="M-8 -12 L8 -12 M-8 -5 L8 -5" stroke="#000" strokeOpacity=".3" strokeWidth="1.5" />
          <ellipse cx="0" cy="-18" rx="8" ry="2.4" fill="#000" opacity=".25" />
        </g>
      ))}
    </g>
  );
}

/** Стопка старых телевизоров с помехами. */
export function TvStack({ x, y, s = 1, animated = false }: P & { animated?: boolean }) {
  const tvs: Array<[number, number, number]> = [
    [-22, 0, 1],
    [0, 0, 1.1],
    [22, 0, 0.95],
    [-11, -24, 1],
    [12, -25, 1.05],
    [0, -48, 0.9],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow(36)}
      {tvs.map(([tx, ty, k], i) => (
        <g key={i} transform={`translate(${tx} ${ty}) scale(${k})`}>
          <rect x="-11" y="-22" width="22" height="22" rx="2" fill="#3b352c" />
          <rect x="-8" y="-19" width="14" height="14" rx="3" fill={CRT} opacity={i % 3 === 1 ? 0.35 : 0.85} className={animated && i % 2 === 0 ? 'anim-flicker' : undefined} />
          <circle cx="8.5" cy="-14" r="1.3" fill="#888" />
          <circle cx="8.5" cy="-9" r="1.3" fill="#888" />
        </g>
      ))}
      <g opacity=".08">
        <circle cx="0" cy="-30" r="54" fill={CRT} className={animated ? 'anim-pulse' : undefined} />
      </g>
    </g>
  );
}

/** Вышка с прожектором. */
export function Watchtower({ x, y, s = 1, animated = false }: P & { animated?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow(16)}
      <path d="M-12 0 L-6 -70 M12 0 L6 -70 M-11 -10 L10 -36 M11 -10 L-10 -36 M-9 -36 L8 -62 M9 -36 L-8 -62" stroke="#3a3d3a" strokeWidth="2.5" fill="none" />
      <rect x="-14" y="-86" width="28" height="16" fill="#5e615c" />
      <path d="M-17 -86 L17 -86 L0 -98 Z" fill="#3a3d3a" />
      <rect x="-10" y="-82" width="20" height="7" fill={SODIUM} opacity=".6" />
      <g className={animated ? 'anim-sway' : undefined} style={{ transformOrigin: '0px -78px' }}>
        <path d="M0 -78 L-90 30 L-30 40 Z" fill="#f6f1d8" opacity=".12" />
      </g>
    </g>
  );
}

/** Знак радиационной опасности. */
export function HazardSign({ x, y, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.5" y="-28" width="3" height="28" fill="#3a3d3a" />
      <path d="M0 -44 L14 -22 L-14 -22 Z" fill="#f2c230" stroke="#2a2a2a" strokeWidth="1.5" />
      <circle cx="0" cy="-29" r="2" fill="#2a2a2a" />
      <path d="M0 -29 L-4 -36 L4 -36 Z M0 -29 L-7 -25 L-3 -22 Z M0 -29 L7 -25 L3 -22 Z" fill="#2a2a2a" />
    </g>
  );
}

/** Радиомачта с красными огнями. */
export function RadioMast({ x, y, s = 1, h = 150, animated = false }: P & { h?: number; animated?: boolean }) {
  const segs = 7;
  const lines = [];
  for (let i = 0; i < segs; i++) {
    const y1 = -(h / segs) * i;
    const y2 = -(h / segs) * (i + 1);
    const w1 = 14 * (1 - i / segs) + 3;
    const w2 = 14 * (1 - (i + 1) / segs) + 3;
    lines.push(<path key={i} d={`M${-w1} ${y1} L${-w2} ${y2} M${w1} ${y1} L${w2} ${y2} M${-w1} ${y1} L${w2} ${y2} M${w1} ${y1} L${-w2} ${y2}`} stroke="#4a4d49" strokeWidth="2" fill="none" />);
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow(18)}
      {lines}
      {[0.35, 0.68, 1].map((t, i) => (
        <g key={t}>
          <circle cx="0" cy={-h * t} r="3" fill={ALARM} className={animated ? 'anim-twinkle' : undefined} style={{ animationDelay: `${i * 0.5}s` }} />
          <circle cx="0" cy={-h * t} r="10" fill={ALARM} opacity=".2" />
        </g>
      ))}
    </g>
  );
}

/** Антенна-тарелка. */
export function Dish({ x, y, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow(16)}
      <path d="M0 0 L0 -20 M-8 0 L0 -14 L8 0" stroke="#3a3d3a" strokeWidth="3" fill="none" />
      <path d="M-22 -40 Q0 -12 22 -26 Z" fill="#b8bab2" transform="rotate(-20 0 -26)" />
      <path d="M0 -26 L10 -44" stroke="#3a3d3a" strokeWidth="2" />
    </g>
  );
}

/** Бетонный бункер с люком. */
export function Bunker({ x, y, s = 1, animated = false }: P & { animated?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow(56)}
      <path d="M-56 0 Q-56 -50 0 -54 Q56 -50 56 0 Z" fill="#7d8078" />
      <path d="M10 -53 Q56 -50 56 0 L20 0 Z" fill="#000" opacity=".2" />
      <path d="M-56 0 Q-56 -50 0 -54" stroke="#a6a89f" strokeWidth="3" fill="none" />
      <rect x="-16" y="-30" width="32" height="30" fill="#2a2d2b" />
      <rect x="-13" y="-27" width="26" height="27" fill="#3e4a3a" />
      <circle cx="0" cy="-14" r="5" fill="none" stroke="#9a9c94" strokeWidth="2" />
      <rect x="-24" y="-44" width="10" height="5" fill={TOXIC} opacity=".8" className={animated ? 'anim-flicker' : undefined} />
    </g>
  );
}

/** Сухое дерево. */
export function DeadTree({ x, y, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow(10)}
      <path d="M0 0 L0 -40 M0 -26 L-12 -40 M0 -32 L10 -48 M0 -40 L-4 -56 M-12 -40 L-18 -46 M10 -48 L16 -52" stroke="#2a2522" strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  );
}

/** Обломки бетона с арматурой. */
export function Rubble({ x, y, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-18 0 L-14 -10 L-2 -14 L8 -8 L16 0 Z" fill="#7a7c74" />
      <path d="M-2 -14 L8 -8 L16 0 L4 0 Z" fill="#000" opacity=".2" />
      <path d="M-6 -10 L-10 -22 M4 -10 L8 -24" stroke={RUST} strokeWidth="1.8" />
    </g>
  );
}

/** Доска объявлений / стенд «НИИ». */
export function Signboard({ x, y, s = 1, text = 'НИИ', c = ALARM }: P & { text?: string; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-20" y="-20" width="3" height="20" fill="#3a3d3a" />
      <rect x="17" y="-20" width="3" height="20" fill="#3a3d3a" />
      <rect x="-26" y="-40" width="52" height="22" fill="#e6e0d0" />
      <rect x="-26" y="-40" width="52" height="6" fill={c} />
      <text x="0" y="-22" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="'Arial Narrow', Arial, sans-serif" fill="#2a2a2a">
        {text}
      </text>
    </g>
  );
}

/** Полоса тумана. */
export function FogBand({ x, y, w = 300, o = 0.35, animated = false }: { x: number; y: number; w?: number; o?: number; animated?: boolean }) {
  return (
    <g opacity={o} className={animated ? 'anim-drift' : undefined}>
      <ellipse cx={x} cy={y} rx={w / 2} ry={w * 0.08} fill="url(#niiFog)" />
      <ellipse cx={x + w * 0.2} cy={y - w * 0.04} rx={w * 0.3} ry={w * 0.06} fill="url(#niiFog)" />
    </g>
  );
}
