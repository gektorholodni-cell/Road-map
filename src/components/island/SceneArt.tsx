// Окружение сцен объектов НИИ: асфальт и бетон, постройки, дальний фон и частицы.
import { memo, type ReactNode } from 'react';
import type { ThemeId } from '../../types';
import { THEMES } from '../../data/themes';
import { SharedDefs } from '../art/primitives';
import {
  ALARM,
  Barrels,
  Barrier,
  Block,
  Booth,
  Bunker,
  Chimney,
  CRT,
  DeadTree,
  Dish,
  ElevatorShaft,
  Fence,
  HazardSign,
  LampPost,
  MainBuilding,
  Pipes,
  RadioMast,
  Rubble,
  Signboard,
  Tank,
  TOXIC,
  TvStack,
  Watchtower,
} from '../art/nii';
import { SCENE_H, SCENE_W, WALK, type SceneLayout } from './layout';

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------- Земля

export const SceneGround = memo(function SceneGround({ theme, layout, complete }: { theme: ThemeId; layout: SceneLayout; complete: boolean }) {
  const th = THEMES[theme];
  const r = rng(theme.length * 97 + 13);
  const specks = Array.from({ length: 140 }, () => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 0.95;
    return { x: WALK.cx + Math.cos(a) * WALK.rx * d, y: WALK.cy + Math.sin(a) * WALK.ry * d, s: 4 + r() * 10, l: r() > 0.5 };
  });
  const floating = true;
  const { cx, cy, rx, ry } = WALK;
  return (
    <svg className="scene-ground" width={SCENE_W} height={SCENE_H} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} aria-hidden>
      <SharedDefs />
      <defs>
        <radialGradient id="sg-ground" cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor={th.ground[0]} />
          <stop offset="1" stopColor={th.ground[1]} />
        </radialGradient>
        <linearGradient id="sg-rock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={th.rock[0]} />
          <stop offset="1" stopColor={th.rock[1]} />
        </linearGradient>
        <radialGradient id="sg-aura">
          <stop offset="0" stopColor={th.glow} stopOpacity=".35" />
          <stop offset="1" stopColor={th.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      {floating && (
        <g>
          {/* Толща сектора и обрыв */}
          <path
            d={`M${cx - rx} ${cy} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy} L${cx + rx * 0.9} ${cy + 160} L${cx + rx * 0.6} ${cy + ry + 200} L${cx + rx * 0.2} ${cy + ry + 300} L${cx - rx * 0.25} ${cy + ry + 260} L${cx - rx * 0.7} ${cy + ry + 150} L${cx - rx * 0.95} ${cy + 140} Z`}
            fill="url(#sg-rock)"
          />
          <path d={`M${cx - rx * 0.7} ${cy + ry + 150} L${cx - rx * 0.4} ${cy + ry + 100} L${cx} ${cy + ry + 160} L${cx + rx * 0.4} ${cy + ry + 110} L${cx + rx * 0.6} ${cy + ry + 200}`} stroke="#000" strokeOpacity=".2" strokeWidth="14" fill="none" />
        </g>
      )}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#sg-ground)" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={th.top[1]} strokeWidth="18" opacity=".6" />
      {complete && <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#sg-aura)" className="anim-pulse" />}
      {specks.map((s, i) => (
        <ellipse key={i} cx={s.x} cy={s.y} rx={s.s} ry={s.s * 0.45} fill={s.l ? '#fff' : '#000'} opacity={s.l ? 0.07 : 0.08} />
      ))}
      {groundFeatures(theme)}
      {/* Тропинки от места высадки к главам */}
      {layout.zones.map((z) => (
        <path
          key={z.chapterId}
          d={`M${layout.spawn.x} ${layout.spawn.y} Q${(layout.spawn.x + z.x) / 2} ${(layout.spawn.y + z.y) / 2 + 120} ${z.x} ${z.y + 40}`}
          stroke={th.path}
          strokeWidth="34"
          fill="none"
          strokeLinecap="round"
          opacity=".55"
          strokeDasharray="40 10"
        />
      ))}
      <ellipse cx={layout.spawn.x} cy={layout.spawn.y} rx="90" ry="34" fill={th.path} opacity=".6" />
      <ellipse cx={layout.spawn.x} cy={layout.spawn.y} rx="70" ry="24" fill="none" stroke={th.glow} strokeWidth="3" opacity=".7" />
    </svg>
  );
});

function groundFeatures(theme: ThemeId): ReactNode {
  const { cx, cy, rx, ry } = WALK;
  const r = rng(theme.length * 53 + 7);
  // Трещины асфальта
  const cracks = Array.from({ length: 14 }, (_, i) => {
    const a0 = r() * Math.PI * 2;
    const d0 = 0.2 + r() * 0.7;
    let px = cx + Math.cos(a0) * rx * d0;
    let py = cy + Math.sin(a0) * ry * d0;
    let path = `M${px} ${py}`;
    for (let k = 0; k < 4; k++) {
      px += (r() - 0.5) * 140;
      py += (r() - 0.5) * 60;
      path += ` L${px} ${py}`;
    }
    return <path key={`c${i}`} d={path} stroke="#000" strokeOpacity=".32" strokeWidth={2 + (i % 3)} fill="none" />;
  });
  // Лужи с отражением света
  const th = THEMES[theme];
  const puddles = Array.from({ length: theme === 'underwater' ? 12 : 5 }, (_, i) => {
    const a0 = r() * Math.PI * 2;
    const d0 = 0.25 + r() * 0.6;
    const w = 50 + r() * 90;
    return (
      <g key={`p${i}`}>
        <ellipse cx={cx + Math.cos(a0) * rx * d0} cy={cy + Math.sin(a0) * ry * d0} rx={w} ry={w * 0.3} fill="#11161a" opacity=".55" />
        <ellipse cx={cx + Math.cos(a0) * rx * d0 - w * 0.2} cy={cy + Math.sin(a0) * ry * d0 - 3} rx={w * 0.4} ry={w * 0.08} fill={th.glow} opacity=".14" />
      </g>
    );
  });
  // Канализационные люки
  const hatches = [0.3, 0.7].map((t, i) => <ellipse key={`h${i}`} cx={cx - rx * 0.6 + rx * 1.2 * t} cy={cy + ry * 0.45} rx="30" ry="12" fill="#2a2d2b" stroke="#6a6d66" strokeWidth="3" />);
  let extra: ReactNode = null;
  if (theme === 'ice') {
    extra = Array.from({ length: 30 }, (_, i) => (
      <ellipse key={`s${i}`} cx={cx + (r() - 0.5) * rx * 1.7} cy={cy + (r() - 0.5) * ry * 1.6} rx={40 + r() * 80} ry={10 + r() * 14} fill="#dfe6e8" opacity=".35" />
    ));
  } else if (theme === 'citadel' || theme === 'sky') {
    extra = <path d={`M${cx - rx * 0.7} ${cy + 40} L${cx + rx * 0.7} ${cy + 40}`} stroke={ALARM} strokeOpacity=".35" strokeWidth="8" strokeDasharray="40 30" />;
  } else if (theme === 'mechanics' || theme === 'cosmos') {
    extra = Array.from({ length: 6 }, (_, i) => <ellipse key={`t${i}`} cx={cx + (r() - 0.5) * rx * 1.4} cy={cy + (r() - 0.5) * ry * 1.2} rx={30 + r() * 40} ry={10} fill={TOXIC} opacity=".08" />);
  }
  return (
    <g>
      {cracks}
      {puddles}
      {hatches}
      {/* Разметка */}
      <path d={`M${cx - rx * 0.8} ${cy - ry * 0.1} L${cx + rx * 0.8} ${cy - ry * 0.1}`} stroke="#d8d2b8" strokeOpacity=".16" strokeWidth="10" strokeDasharray="60 50" />
      {extra}
    </g>
  );
}

// ---------------------------------------------------------------- Декорации (сортируются по глубине)

export interface Decoration {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  at: number;
  el: ReactNode;
}

/** Точки на кольце у края сектора. */
function ring(count: number, seed: number, d0 = 0.95, skipTopArc = 0.0): Array<{ x: number; y: number }> {
  const r = rng(seed);
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + r() * 0.2;
    // Не загораживаем низ (место высадки) и при необходимости верх (центральное сооружение).
    const deg = ((a * 180) / Math.PI) % 360;
    if (deg > 70 && deg < 110) continue;
    if (skipTopArc && deg > 270 - skipTopArc && deg < 270 + skipTopArc) continue;
    const d = d0 + r() * 0.06;
    pts.push({ x: WALK.cx + Math.cos(a) * WALK.rx * d, y: WALK.cy + Math.sin(a) * WALK.ry * d });
  }
  return pts;
}

const deco = (key: string, x: number, y: number, w: number, h: number, el: ReactNode, at = 0): Decoration => ({ key, x, y, w, h, at, el });

export function sceneDecorations(theme: ThemeId, animated: boolean): Decoration[] {
  const top = { x: WALK.cx, y: WALK.cy - WALK.ry * 0.78 };
  const list: Decoration[] = [];
  const pts = ring(34, theme.length * 31, 0.97, 22);
  const edge = (key: string, i: number, el: ReactNode, at = 0) => {
    const p = pts[i];
    return deco(key, p.x, p.y, 120, 170, el, at);
  };
  const ringItems = (make: (i: number) => ReactNode, lateEvery = 5) => pts.forEach((_, i) => list.push(edge(`e${i}`, i, make(i), i % lateEvery === lateEvery - 1 ? 0.5 : 0)));
  switch (theme) {
    case 'meadow': // Проходная
      list.push(deco('booth', top.x - 120, top.y + 40, 160, 160, <Booth x={0} y={0} s={2.6} animated={animated} />));
      list.push(deco('barrier', top.x + 10, top.y + 60, 220, 80, <Barrier x={0} y={0} s={2.4} />));
      list.push(deco('fence1', top.x - 380, top.y + 30, 260, 90, <Fence x={0} y={0} s={2.4} w={100} />));
      list.push(deco('fence2', top.x + 380, top.y + 30, 260, 90, <Fence x={0} y={0} s={2.4} w={100} />));
      list.push(deco('sign', top.x + 220, top.y + 90, 140, 120, <Signboard x={0} y={0} s={2.2} text="КПП-1" />, 0.4));
      ringItems((i) => (i % 3 === 0 ? <LampPost x={0} y={0} s={2.1} animated={animated} /> : i % 3 === 1 ? <DeadTree x={0} y={0} s={2.4} /> : <Rubble x={0} y={0} s={2.4} />));
      break;
    case 'architecture': // Чертёжное бюро
      list.push(deco('b1', top.x, top.y + 40, 320, 220, <Block x={0} y={0} s={2.4} w={120} h={70} cols={8} rows={4} seed={2} animated={animated} />));
      list.push(deco('b2', top.x - 380, top.y + 110, 220, 160, <Block x={0} y={0} s={2.2} w={80} h={48} cols={5} rows={3} seed={4} wall="#9a9a8e" animated={animated} />));
      list.push(deco('dish', top.x + 360, top.y + 100, 140, 140, <Dish x={0} y={0} s={2.4} />, 0.4));
      list.push(deco('sign', top.x + 200, top.y + 130, 140, 120, <Signboard x={0} y={0} s={2.2} text="ОКБ" />, 0.7));
      ringItems((i) => (i % 2 ? <LampPost x={0} y={0} s={2} animated={animated} /> : <Rubble x={0} y={0} s={2.4} />));
      break;
    case 'mechanics': // Лаборатория
      list.push(deco('lab', top.x - 60, top.y + 40, 300, 220, <Block x={0} y={0} s={2.4} w={100} h={66} cols={6} rows={3} seed={6} lit={TOXIC} animated={animated} />));
      list.push(deco('chimney', top.x + 250, top.y + 20, 120, 330, <Chimney x={0} y={0} s={2.2} h={120} animated={animated} />));
      list.push(deco('tank1', top.x - 380, top.y + 90, 140, 160, <Tank x={0} y={0} s={2.4} />));
      list.push(deco('pipes', top.x + 420, top.y + 140, 260, 100, <Pipes x={0} y={0} s={2.2} w={110} />, 0.4));
      list.push(deco('tank2', top.x + 520, top.y + 220, 120, 140, <Tank x={0} y={0} s={2} c="#7f8a74" />, 0.7));
      ringItems((i) => (i % 2 ? <Barrels x={0} y={0} s={2.2} /> : <Rubble x={0} y={0} s={2.4} />));
      break;
    case 'citadel': // Сектор Ноль
      list.push(deco('main', top.x, top.y + 40, 380, 360, <MainBuilding x={0} y={0} s={2.3} animated={animated} />));
      list.push(deco('elev', top.x - 360, top.y + 110, 100, 280, <ElevatorShaft x={0} y={0} s={2.4} animated={animated} />));
      list.push(deco('haz', top.x + 360, top.y + 120, 90, 120, <HazardSign x={0} y={0} s={2.4} />, 0.3));
      list.push(deco('bar', top.x - 520, top.y + 200, 100, 110, <Barrels x={0} y={0} s={2.2} />, 0.6));
      ringItems((i) => (i % 2 ? <LampPost x={0} y={0} s={2.1} animated={animated} c={i % 4 === 1 ? ALARM : undefined} /> : <Fence x={0} y={0} s={2} w={50} />));
      break;
    case 'underwater': // Офисы с телевизорами
      list.push(deco('office', top.x, top.y + 40, 380, 220, <Block x={0} y={0} s={2.4} w={140} h={66} cols={9} rows={3} seed={8} lit={CRT} animated={animated} />));
      list.push(deco('tv1', top.x - 360, top.y + 100, 180, 160, <TvStack x={0} y={0} s={2.4} animated={animated} />));
      list.push(deco('tv2', top.x + 360, top.y + 100, 180, 160, <TvStack x={0} y={0} s={2.2} animated={animated} />, 0.4));
      list.push(deco('sign', top.x + 180, top.y + 140, 140, 120, <Signboard x={0} y={0} s={2.2} text="ОТДЕЛ 4" c="#3a6a8a" />, 0.7));
      ringItems((i) => (i % 3 === 0 ? <TvStack x={0} y={0} s={1.3} animated={animated} /> : i % 3 === 1 ? <LampPost x={0} y={0} s={2} c={CRT} broken={i % 2 === 0} animated={animated} /> : <Rubble x={0} y={0} s={2.2} />));
      break;
    case 'ice': // Карантин
      list.push(deco('tower', top.x, top.y + 40, 160, 320, <Watchtower x={0} y={0} s={2.6} animated={animated} />));
      list.push(deco('b', top.x - 320, top.y + 90, 220, 140, <Block x={0} y={0} s={2.2} w={80} h={40} cols={5} rows={2} seed={9} wall="#9aa3a6" lit="#cfe8ff" animated={animated} />, 0.3));
      list.push(deco('haz', top.x + 300, top.y + 100, 90, 120, <HazardSign x={0} y={0} s={2.4} />));
      list.push(deco('tower2', top.x + 480, top.y + 180, 120, 260, <Watchtower x={0} y={0} s={2} animated={animated} />, 0.7));
      ringItems((i) => (i % 2 ? <Fence x={0} y={0} s={2} w={60} /> : <DeadTree x={0} y={0} s={2.4} />));
      break;
    case 'sky': // Радиоцентр
      list.push(deco('mast', top.x, top.y + 40, 160, 420, <RadioMast x={0} y={0} s={2.3} h={170} animated={animated} />));
      list.push(deco('b', top.x - 300, top.y + 90, 220, 140, <Block x={0} y={0} s={2.2} w={80} h={44} cols={5} rows={2} seed={12} animated={animated} />));
      list.push(deco('dish1', top.x + 300, top.y + 90, 140, 140, <Dish x={0} y={0} s={2.6} />));
      list.push(deco('dish2', top.x + 480, top.y + 180, 120, 120, <Dish x={0} y={0} s={2} />, 0.5));
      list.push(deco('sign', top.x - 160, top.y + 150, 140, 120, <Signboard x={0} y={0} s={2.2} text="ЭФИР" />, 0.7));
      ringItems((i) => (i % 3 === 0 ? <RadioMast x={0} y={0} s={1.2} h={80} animated={animated} /> : <LampPost x={0} y={0} s={2} animated={animated} />));
      break;
    case 'cosmos': // Бункер
      list.push(deco('bunker', top.x, top.y + 40, 320, 200, <Bunker x={0} y={0} s={2.6} animated={animated} />));
      list.push(deco('mast', top.x - 330, top.y + 100, 120, 300, <RadioMast x={0} y={0} s={2} h={120} animated={animated} />));
      list.push(deco('bar', top.x + 300, top.y + 100, 110, 110, <Barrels x={0} y={0} s={2.4} c="#3e4a3a" />));
      list.push(deco('haz', top.x + 480, top.y + 180, 90, 120, <HazardSign x={0} y={0} s={2.4} />, 0.5));
      ringItems((i) => (i % 2 ? <LampPost x={0} y={0} s={2} c={TOXIC} animated={animated} /> : <Rubble x={0} y={0} s={2.4} />));
      break;
  }
  return list;
}

// ---------------------------------------------------------------- Дальний фон

export const SceneBackdrop = memo(function SceneBackdrop({ theme, animated }: { theme: ThemeId; animated: boolean }) {
  const th = THEMES[theme];
  const r = rng(77 + theme.length);
  const far = Array.from({ length: 14 }, (_, i) => ({ x: i * 120 + r() * 40 - 40, w: 90 + r() * 70, h: 120 + r() * 220 }));
  const near = Array.from({ length: 9 }, (_, i) => ({ x: i * 190 + r() * 60 - 60, w: 140 + r() * 80, h: 80 + r() * 150 }));
  const lit = far.flatMap((b, i) =>
    Array.from({ length: 6 }, (_, k) => ({ x: b.x + 12 + (k % 3) * 26, y: 700 - b.h + 20 + Math.floor(k / 3) * 34 + (i % 3) * 30, on: r() > 0.7, f: r() > 0.9 })),
  );
  return (
    <svg className="scene-backdrop-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="bd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={th.sceneSky[2]} />
          <stop offset=".6" stopColor={th.sceneSky[1]} />
          <stop offset="1" stopColor={th.sceneSky[0]} />
        </linearGradient>
        <radialGradient id="bd-glow">
          <stop offset="0" stopColor={th.glow} stopOpacity=".35" />
          <stop offset="1" stopColor={th.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bd-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8e978f" stopOpacity="0" />
          <stop offset=".5" stopColor="#8e978f" stopOpacity=".28" />
          <stop offset="1" stopColor="#8e978f" stopOpacity=".05" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#bd-sky)" />
      <circle cx="1240" cy="200" r="70" fill="#d9d6c6" opacity=".18" />
      <ellipse cx="800" cy="720" rx="900" ry="360" fill="url(#bd-glow)" className={animated ? 'anim-pulse' : undefined} />
      {far.map((b, i) => (
        <rect key={`f${i}`} x={b.x} y={700 - b.h} width={b.w} height={b.h + 400} fill="#0f1316" opacity=".8" />
      ))}
      {lit.map((w, i) =>
        w.on ? <rect key={`w${i}`} x={w.x} y={w.y} width="12" height="14" fill="#ffb347" opacity=".45" className={animated && w.f ? 'anim-flicker' : undefined} /> : null,
      )}
      <rect x="0" y="560" width="1600" height="300" fill="url(#bd-fog)" />
      {near.map((b, i) => (
        <rect key={`n${i}`} x={b.x} y={820 - b.h} width={b.w} height={b.h + 300} fill="#080a0c" opacity=".85" />
      ))}
      {(theme === 'sky' || theme === 'citadel') && <circle cx="300" cy="380" r="5" fill={ALARM} className={animated ? 'anim-twinkle' : undefined} />}
      {theme === 'ice' && (
        <g opacity=".06">
          <path d="M1100 0 L1300 1000 L900 1000 Z" fill="#f6f1d8" className={animated ? 'anim-pulse' : undefined} />
        </g>
      )}
      <rect x="0" y="820" width="1600" height="180" fill="url(#bd-fog)" />
    </svg>
  );
});

// ---------------------------------------------------------------- Частицы переднего плана

export const SceneParticles = memo(function SceneParticles({ theme }: { theme: ThemeId }) {
  const r = rng(theme.length * 11 + 3);
  const kind =
    theme === 'ice' ? 'snow' : theme === 'mechanics' ? 'spark' : theme === 'underwater' ? 'static' : 'ash';
  const count = kind === 'snow' ? 70 : 34;
  return (
    <div className={`scene-particles p-${kind}`} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${r() * 100}%`,
            top: `${r() * 100}%`,
            animationDelay: `${-r() * 10}s`,
            animationDuration: `${(kind === 'snow' ? 5 : 8) + r() * 8}s`,
            ['--s' as string]: `${0.5 + r()}`,
          }}
        />
      ))}
      <div className="scene-fog" />
      {theme === 'underwater' && <div className="crt-scan" />}
    </div>
  );
});
