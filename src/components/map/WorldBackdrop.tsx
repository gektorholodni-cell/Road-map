// Фон карты в стиле «Сектора Ноль»: пасмурная ночь над закрытым городом НИИ,
// силуэты панельных домов с редкими окнами, ЛЭП, туман внизу и пепел в воздухе.
import { memo } from 'react';
import type { Rect } from './camera';

function seeded(n: number) {
  let s = n;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function FogBank({ x, y, w, o = 0.6, tint = '#8e978f', drift = false }: { x: number; y: number; w: number; o?: number; tint?: string; drift?: boolean }) {
  const r = seeded(Math.round(x * 7 + y * 3));
  const puffs = Array.from({ length: 9 }, (_, i) => ({ cx: x + (i / 8 - 0.5) * w + (r() - 0.5) * 60, cy: y + (r() - 0.5) * 30, rx: w * (0.14 + r() * 0.08) }));
  const gid = `fog-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g opacity={o} className={drift ? 'anim-drift' : undefined}>
      <defs>
        <radialGradient id={gid}>
          <stop offset="0" stopColor={tint} stopOpacity=".75" />
          <stop offset=".6" stopColor={tint} stopOpacity=".35" />
          <stop offset="1" stopColor={tint} stopOpacity="0" />
        </radialGradient>
      </defs>
      {puffs.map((p, i) => (
        <ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.rx * 0.32} fill={`url(#${gid})`} />
      ))}
    </g>
  );
}

/** Ряд панельных домов-силуэтов с редкими жёлтыми окнами. */
function Skyline({ x0, x1, base, hMin, hMax, seed, color, windowsOn, animated }: { x0: number; x1: number; base: number; hMin: number; hMax: number; seed: number; color: string; windowsOn: number; animated: boolean }) {
  const r = seeded(seed);
  const blocks: Array<{ x: number; w: number; h: number }> = [];
  for (let x = x0; x < x1; ) {
    const w = 120 + r() * 220;
    blocks.push({ x, w, h: hMin + r() * (hMax - hMin) });
    x += w + r() * 60;
  }
  const lit: Array<{ x: number; y: number; f: boolean }> = [];
  blocks.forEach((b) => {
    const cols = Math.floor(b.w / 26);
    const rows = Math.floor(b.h / 30);
    for (let c = 0; c < cols; c++)
      for (let rr = 0; rr < rows; rr++) if (r() < windowsOn) lit.push({ x: b.x + 10 + c * 26, y: base - b.h + 14 + rr * 30, f: r() > 0.85 });
  });
  return (
    <g>
      {blocks.map((b, i) => (
        <rect key={i} x={b.x} y={base - b.h} width={b.w} height={b.h + 600} fill={color} />
      ))}
      {lit.map((w, i) => (
        <rect key={i} x={w.x} y={w.y} width="10" height="12" fill="#ffb347" opacity=".55" className={w.f && animated ? 'anim-flicker' : undefined} />
      ))}
    </g>
  );
}

/** Опора ЛЭП. */
function Pylon({ x, base, h, color }: { x: number; base: number; h: number; color: string }) {
  return (
    <g stroke={color} strokeWidth="5" fill="none">
      <path d={`M${x - 50} ${base} L${x - 8} ${base - h} L${x + 8} ${base - h} L${x + 50} ${base}`} />
      <path d={`M${x - 70} ${base - h * 0.72} L${x + 70} ${base - h * 0.72} M${x - 55} ${base - h * 0.9} L${x + 55} ${base - h * 0.9}`} />
      <path d={`M${x - 38} ${base - h * 0.3} L${x + 30} ${base - h * 0.6} M${x + 38} ${base - h * 0.3} L${x - 30} ${base - h * 0.6}`} strokeWidth="3" />
    </g>
  );
}

function WorldBackdropImpl({ world, animated }: { world: Rect; animated: boolean }) {
  const { x, y, w, h } = world;
  const rnd = seeded(42);
  const stars = Array.from({ length: 50 }, () => ({ sx: x + w * rnd(), sy: y + h * rnd() * 0.35, r: 0.8 + rnd() * 1.6, d: rnd() * 4 }));
  const rnd2 = seeded(7);
  const ash = Array.from({ length: 60 }, () => ({ fx: x + rnd2() * w, fy: y + h * (0.1 + rnd2() * 0.85), d: rnd2() * 6, c: rnd2() > 0.8 ? '#ffb347' : '#b9bdb6' }));
  const skyBase = y + h * 0.62;
  const pylons = [0.08, 0.3, 0.52, 0.74, 0.96].map((t) => x + w * t);
  return (
    <g>
      <defs>
        <linearGradient id="skyV" gradientUnits="userSpaceOnUse" x1={0} y1={y} x2={0} y2={y + h}>
          <stop offset="0" stopColor="#07090b" />
          <stop offset=".35" stopColor="#141a1e" />
          <stop offset=".62" stopColor="#2a3236" />
          <stop offset=".8" stopColor="#1a2024" />
          <stop offset="1" stopColor="#07090a" />
        </linearGradient>
        <linearGradient id="skyH" gradientUnits="userSpaceOnUse" x1={x} y1={0} x2={x + w} y2={0}>
          <stop offset="0" stopColor="#3a2a20" stopOpacity=".35" />
          <stop offset=".45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#2a0e0c" stopOpacity=".4" />
        </linearGradient>
        <radialGradient id="moonGlow">
          <stop offset="0" stopColor="#e6e4d6" stopOpacity=".55" />
          <stop offset=".25" stopColor="#c9c6b4" stopOpacity=".18" />
          <stop offset="1" stopColor="#c9c6b4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cityGlow">
          <stop offset="0" stopColor="#ff9a3c" stopOpacity=".28" />
          <stop offset="1" stopColor="#ff9a3c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="alarmGlow">
          <stop offset="0" stopColor="#e0453a" stopOpacity=".3" />
          <stop offset="1" stopColor="#e0453a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Фон шире мира, чтобы при панорамировании не было видно края */}
      <rect x={x - w} y={y - h} width={w * 3} height={h * 3} fill="url(#skyV)" />
      <rect x={x - w} y={y - h} width={w * 3} height={h * 3} fill="url(#skyH)" />
      {/* Луна за облаками */}
      <circle cx={x + w * 0.18} cy={y + h * 0.14} r={700} fill="url(#moonGlow)" />
      <circle cx={x + w * 0.18} cy={y + h * 0.14} r={46} fill="#d9d6c6" opacity=".55" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.sx} cy={s.sy} r={s.r} fill="#d8dccf" opacity={0.15 + (i % 4) * 0.08} className={animated && i % 4 === 0 ? 'anim-twinkle' : undefined} style={{ animationDelay: `${s.d}s` }} />
      ))}
      {/* Тяжёлые облака */}
      <FogBank x={x + w * 0.3} y={y + h * 0.12} w={1800} o={0.35} tint="#3a4248" drift={animated} />
      <FogBank x={x + w * 0.75} y={y + h * 0.2} w={2000} o={0.35} tint="#40363a" drift={animated} />
      {/* Зарево закрытого города и тревожный красный справа */}
      <ellipse cx={x + w * 0.35} cy={skyBase} rx={1600} ry={420} fill="url(#cityGlow)" />
      <ellipse cx={x + w * 0.62} cy={skyBase - 80} rx={900} ry={400} fill="url(#alarmGlow)" className={animated ? 'anim-pulse' : undefined} />
      {/* Дальний и ближний ряд панельных домов */}
      <Skyline x0={x - 1500} x1={x + w + 1500} base={skyBase} hMin={120} hMax={320} seed={11} color="#1b2125" windowsOn={0.06} animated={animated} />
      <FogBank x={x + w * 0.5} y={skyBase - 20} w={w * 1.4} o={0.4} tint="#59625f" />
      <Skyline x0={x - 1500} x1={x + w + 1500} base={skyBase + 110} hMin={80} hMax={220} seed={23} color="#101417" windowsOn={0.1} animated={animated} />
      {/* ЛЭП с провисшими проводами */}
      {pylons.map((px) => (
        <Pylon key={px} x={px} base={skyBase + 160} h={330} color="#0b0e10" />
      ))}
      {pylons.slice(0, -1).map((px, i) => {
        const nx = pylons[i + 1];
        const yy = skyBase + 160 - 330 * 0.72;
        return (
          <g key={px} stroke="#0b0e10" strokeWidth="2.5" fill="none" opacity=".9">
            <path d={`M${px - 70} ${yy} Q${(px + nx) / 2} ${yy + 110} ${nx - 70} ${yy}`} />
            <path d={`M${px + 70} ${yy} Q${(px + nx) / 2} ${yy + 110} ${nx + 70} ${yy}`} />
          </g>
        );
      })}
      {pylons.map((px, i) => (
        <circle key={`r${px}`} cx={px} cy={skyBase + 160 - 330} r="6" fill="#e0453a" className={animated ? 'anim-twinkle' : undefined} style={{ animationDelay: `${i * 0.6}s` }} />
      ))}
      {/* Туман внизу */}
      <FogBank x={x + 600} y={y + h * 0.82} w={2200} tint="#6b7470" o={0.55} />
      <FogBank x={x + 2200} y={y + h * 0.88} w={2400} tint="#5d6662" o={0.5} />
      <FogBank x={x + 3600} y={y + h * 0.8} w={2000} tint="#666e6a" o={0.45} />
      <FogBank x={x + 1400} y={y + h * 0.45} w={1100} tint="#8e978f" o={0.16} drift={animated} />
      <FogBank x={x + 3000} y={y + h * 0.35} w={1100} tint="#8e978f" o={0.14} drift={animated} />
      <FogBank x={x + 1000} y={y + h * 1.0} w={3000} tint="#1c2224" o={0.9} />
      <FogBank x={x + 3200} y={y + h * 1.02} w={3000} tint="#161a1c" o={0.9} />
      {/* Пепел и редкие искры */}
      {ash.map((f, i) => (
        <circle key={i} cx={f.fx} cy={f.fy} r={f.c === '#ffb347' ? 2.5 : 2} fill={f.c} className={animated ? 'anim-firefly' : undefined} style={{ animationDelay: `${f.d}s` }} opacity=".5" />
      ))}
    </g>
  );
}

export const WorldBackdrop = memo(WorldBackdropImpl);
