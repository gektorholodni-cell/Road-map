// Атмосферный фон карты в мировых координатах: рассвет слева, космос справа,
// море облаков внизу, далёкие горы, звёзды и светлячки.
import { memo } from 'react';
import type { Rect } from './camera';

function seeded(n: number) {
  let s = n;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function CloudBank({ x, y, w, o = 0.9, tint = '#ffffff', drift = false }: { x: number; y: number; w: number; o?: number; tint?: string; drift?: boolean }) {
  const r = seeded(Math.round(x * 7 + y * 3));
  const puffs = Array.from({ length: 9 }, (_, i) => ({ cx: x + (i / 8 - 0.5) * w + (r() - 0.5) * 60, cy: y + (r() - 0.5) * 40, rr: w * (0.1 + r() * 0.08) }));
  const gid = `cloud-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g opacity={o} className={drift ? 'anim-drift' : undefined}>
      <defs>
        <radialGradient id={gid}>
          <stop offset="0" stopColor={tint} stopOpacity=".95" />
          <stop offset=".6" stopColor={tint} stopOpacity=".55" />
          <stop offset="1" stopColor={tint} stopOpacity="0" />
        </radialGradient>
      </defs>
      {puffs.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={p.rr} fill={`url(#${gid})`} />
      ))}
    </g>
  );
}

function WorldBackdropImpl({ world, animated }: { world: Rect; animated: boolean }) {
  const { x, y, w, h } = world;
  const rnd = seeded(42);
  const stars = Array.from({ length: 160 }, () => ({ sx: x + w * (0.35 + rnd() * 0.65), sy: y + h * rnd() * 0.65, r: 0.8 + rnd() * 2.4, d: rnd() * 4 }));
  const rnd2 = seeded(7);
  const flies = Array.from({ length: 46 }, () => ({ fx: x + rnd2() * w, fy: y + h * (0.35 + rnd2() * 0.6), d: rnd2() * 6, c: rnd2() > 0.5 ? '#ffe9a0' : '#9ff7ff' }));
  return (
    <g>
      <defs>
        <linearGradient id="skyH" gradientUnits="userSpaceOnUse" x1={x} y1={0} x2={x + w} y2={0}>
          <stop offset="0" stopColor="#f3a76a" />
          <stop offset=".18" stopColor="#c9806f" />
          <stop offset=".42" stopColor="#3b4d86" />
          <stop offset=".7" stopColor="#1b1f52" />
          <stop offset="1" stopColor="#1a0b3d" />
        </linearGradient>
        <linearGradient id="skyV" gradientUnits="userSpaceOnUse" x1={0} y1={y} x2={0} y2={y + h}>
          <stop offset="0" stopColor="#0b0b2a" stopOpacity=".75" />
          <stop offset=".35" stopColor="#0b0b2a" stopOpacity="0" />
          <stop offset=".75" stopColor="#0a1530" stopOpacity="0" />
          <stop offset="1" stopColor="#050a1a" stopOpacity=".8" />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor="#fff2c4" stopOpacity=".95" />
          <stop offset=".3" stopColor="#ffc27a" stopOpacity=".5" />
          <stop offset="1" stopColor="#ff9a5a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nebula1">
          <stop offset="0" stopColor="#c64bff" stopOpacity=".55" />
          <stop offset=".5" stopColor="#5a2bd6" stopOpacity=".25" />
          <stop offset="1" stopColor="#1a0b3d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nebula2">
          <stop offset="0" stopColor="#2fd6ff" stopOpacity=".35" />
          <stop offset="1" stopColor="#2fd6ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="seaGlow">
          <stop offset="0" stopColor="#2fe0ff" stopOpacity=".35" />
          <stop offset="1" stopColor="#2fe0ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Фон шире мира, чтобы при панорамировании не было видно края */}
      <rect x={x - w} y={y - h} width={w * 3} height={h * 3} fill="url(#skyH)" />
      <rect x={x - w} y={y - h} width={w * 3} height={h * 3} fill="url(#skyV)" />
      <circle cx={x + w * 0.06} cy={y + h * 0.36} r={900} fill="url(#sunGlow)" />
      <ellipse cx={x + w * 0.86} cy={y + h * 0.22} rx={1300} ry={900} fill="url(#nebula1)" />
      <ellipse cx={x + w * 0.66} cy={y + h * 0.12} rx={700} ry={420} fill="url(#nebula2)" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.sx} cy={s.sy} r={s.r} fill="#fff" opacity={0.35 + (i % 5) * 0.12} className={animated && i % 3 === 0 ? 'anim-twinkle' : undefined} style={{ animationDelay: `${s.d}s` }} />
      ))}
      {/* Галактика в правом верхнем углу */}
      <g transform={`translate(${x + w * 0.93} ${y + h * 0.1})`} opacity=".7">
        <ellipse rx="260" ry="90" fill="url(#nebula1)" transform="rotate(-20)" />
        <ellipse rx="60" ry="22" fill="#ffe6ff" opacity=".6" transform="rotate(-20)" />
      </g>
      {/* Далёкие горы на горизонте рассвета: растворяются в дымке и облаках */}
      <defs>
        <linearGradient id="mtFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a7fa8" stopOpacity=".55" />
          <stop offset="1" stopColor="#9a7fa8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mtNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a4a72" stopOpacity=".7" />
          <stop offset="1" stopColor="#5a4a72" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M${x - 1500} ${y + h * 0.66} L${x - 900} ${y + h * 0.56} L${x - 500} ${y + h * 0.6} L${x - 100} ${y + h * 0.47} L${x + 260} ${y + h * 0.55} L${x + 560} ${y + h * 0.44} L${x + 900} ${y + h * 0.54} L${x + 1250} ${y + h * 0.5} L${x + 1700} ${y + h * 0.6} L${x + 2300} ${y + h * 0.68} L${x + 2300} ${y + h * 0.8} L${x - 1500} ${y + h * 0.8} Z`}
        fill="url(#mtFar)"
      />
      <path
        d={`M${x - 1500} ${y + h * 0.7} L${x - 700} ${y + h * 0.6} L${x - 250} ${y + h * 0.64} L${x + 200} ${y + h * 0.57} L${x + 650} ${y + h * 0.63} L${x + 1050} ${y + h * 0.58} L${x + 1500} ${y + h * 0.66} L${x + 2000} ${y + h * 0.72} L${x + 2000} ${y + h * 0.82} L${x - 1500} ${y + h * 0.82} Z`}
        fill="url(#mtNear)"
      />
      {/* Светящееся море под подводным миром */}
      <ellipse cx={x + w * 0.56} cy={y + h * 0.94} rx={900} ry={260} fill="url(#seaGlow)" />
      {/* Море облаков */}
      <CloudBank x={x + 600} y={y + h * 0.78} w={1500} tint="#ffe2c4" o={0.7} />
      <CloudBank x={x + 1900} y={y + h * 0.84} w={1600} tint="#c9c6e8" o={0.55} />
      <CloudBank x={x + 3300} y={y + h * 0.76} w={1500} tint="#a9a2d8" o={0.45} />
      <CloudBank x={x + 2600} y={y + h * 0.42} w={900} tint="#d8d0ff" o={0.4} drift={animated} />
      <CloudBank x={x + 1200} y={y + h * 0.3} w={900} tint="#ffd9b8" o={0.4} drift={animated} />
      <CloudBank x={x + 3600} y={y + h * 0.36} w={900} tint="#b8b0ff" o={0.35} drift={animated} />
      <CloudBank x={x + 800} y={y + h * 0.98} w={2200} tint="#3a3c6a" o={0.8} />
      <CloudBank x={x + 3200} y={y + h * 1.0} w={2400} tint="#2a2654" o={0.8} />
      {/* Светлячки и искры */}
      {flies.map((f, i) => (
        <circle key={i} cx={f.fx} cy={f.fy} r={3} fill={f.c} className={animated ? 'anim-firefly' : undefined} style={{ animationDelay: `${f.d}s` }} opacity=".8" />
      ))}
    </g>
  );
}

export const WorldBackdrop = memo(WorldBackdropImpl);
