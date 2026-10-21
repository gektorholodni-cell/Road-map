// Окружение сцен островов: земля, декорации, дальний фон и частицы для каждого мира.
import { memo, type ReactNode } from 'react';
import type { ThemeId } from '../../types';
import { THEMES } from '../../data/themes';
import {
  Banner,
  Campfire,
  Castle,
  Column,
  Coral,
  Crystal,
  Gear,
  House,
  Jellyfish,
  Palace,
  PineTree,
  Rock,
  RoundTree,
  Seaweed,
  SharedDefs,
  StoneTower,
  Tent,
  WoodTower,
} from '../art/primitives';
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
  const floating = theme !== 'underwater';
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
          {/* Толща острова и обрыв */}
          <path
            d={`M${cx - rx} ${cy} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy} L${cx + rx * 0.9} ${cy + 160} L${cx + rx * 0.6} ${cy + ry + 200} L${cx + rx * 0.2} ${cy + ry + 300} L${cx - rx * 0.25} ${cy + ry + 260} L${cx - rx * 0.7} ${cy + ry + 150} L${cx - rx * 0.95} ${cy + 140} Z`}
            fill="url(#sg-rock)"
          />
          <path d={`M${cx - rx * 0.7} ${cy + ry + 150} L${cx - rx * 0.4} ${cy + ry + 100} L${cx} ${cy + ry + 160} L${cx + rx * 0.4} ${cy + ry + 110} L${cx + rx * 0.6} ${cy + ry + 200}`} stroke="#000" strokeOpacity=".2" strokeWidth="14" fill="none" />
        </g>
      )}
      {!floating && <ellipse cx={cx} cy={cy + 40} rx={rx * 1.25} ry={ry * 1.3} fill="#0b5a66" opacity=".55" />}
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
          strokeDasharray={theme === 'architecture' || theme === 'citadel' ? '40 8' : undefined}
        />
      ))}
      <ellipse cx={layout.spawn.x} cy={layout.spawn.y} rx="90" ry="34" fill={th.path} opacity=".6" />
      <ellipse cx={layout.spawn.x} cy={layout.spawn.y} rx="70" ry="24" fill="none" stroke={th.glow} strokeWidth="3" opacity=".7" />
    </svg>
  );
});

function groundFeatures(theme: ThemeId): ReactNode {
  const { cx, cy, rx, ry } = WALK;
  switch (theme) {
    case 'meadow': {
      const r = rng(5);
      return Array.from({ length: 60 }, (_, i) => {
        const a = r() * Math.PI * 2;
        const d = 0.3 + r() * 0.65;
        const c = ['#ffe27a', '#ff9ac0', '#ffffff', '#c9a0ff'][i % 4];
        return <circle key={i} cx={cx + Math.cos(a) * rx * d} cy={cy + Math.sin(a) * ry * d} r={4} fill={c} opacity=".85" />;
      });
    }
    case 'architecture':
      return <ellipse cx={cx} cy={cy - 40} rx={360} ry={150} fill="#cdbf9f" opacity=".45" stroke="#a89a80" strokeWidth="6" strokeDasharray="30 10" />;
    case 'mechanics':
      return (
        <g opacity=".7">
          <path d={`M${cx - rx * 0.8} ${cy + 80} L${cx + rx * 0.8} ${cy + 80}`} stroke="#5a4a3a" strokeWidth="10" strokeDasharray="6 22" />
          <path d={`M${cx - rx * 0.8} ${cy + 70} L${cx + rx * 0.8} ${cy + 70} M${cx - rx * 0.8} ${cy + 90} L${cx + rx * 0.8} ${cy + 90}`} stroke="#8a8478" strokeWidth="4" />
        </g>
      );
    case 'citadel':
      return <ellipse cx={cx} cy={cy - 30} rx={420} ry={170} fill="#b9b4c9" opacity=".35" stroke="#7cc7ff" strokeWidth="4" strokeOpacity=".5" />;
    case 'underwater': {
      const r = rng(9);
      return (
        <g>
          {Array.from({ length: 24 }, (_, i) => {
            const y = cy - ry * 0.8 + i * 45;
            return <path key={i} d={`M${cx - rx} ${y} Q${cx - rx / 2} ${y - 18} ${cx} ${y} T${cx + rx} ${y}`} stroke="#bff" strokeOpacity=".07" strokeWidth="6" fill="none" />;
          })}
          {Array.from({ length: 20 }, (_, i) => (
            <ellipse key={`s${i}`} cx={cx + (r() - 0.5) * rx * 1.6} cy={cy + (r() - 0.5) * ry * 1.4} rx={8 + r() * 10} ry={4} fill="#f2e6c2" opacity=".35" />
          ))}
        </g>
      );
    }
    case 'ice':
      return (
        <g stroke="#9cc9e4" strokeWidth="3" fill="none" opacity=".7">
          <path d={`M${cx - 600} ${cy - 100} L${cx - 450} ${cy - 40} L${cx - 380} ${cy + 60} L${cx - 220} ${cy + 100}`} />
          <path d={`M${cx + 300} ${cy - 200} L${cx + 420} ${cy - 80} L${cx + 560} ${cy - 50}`} />
          <path d={`M${cx + 100} ${cy + 300} L${cx + 250} ${cy + 260} L${cx + 330} ${cy + 330}`} />
        </g>
      );
    case 'sky':
      return (
        <g>
          <ellipse cx={cx} cy={cy - 40} rx={440} ry={180} fill="#f3d27a" opacity=".25" stroke="#f2c75c" strokeWidth="6" />
          <ellipse cx={cx} cy={cy - 40} rx={300} ry={120} fill="none" stroke="#f2c75c" strokeWidth="3" opacity=".6" />
        </g>
      );
    case 'cosmos':
      return (
        <g stroke="#9c7bff" strokeWidth="4" fill="none" opacity=".6" className="anim-pulse">
          <path d={`M${cx - 700} ${cy} L${cx - 400} ${cy} L${cx - 300} ${cy - 120} L${cx + 300} ${cy - 120} L${cx + 400} ${cy} L${cx + 700} ${cy}`} />
          <path d={`M${cx - 500} ${cy + 250} L${cx - 200} ${cy + 250} L${cx - 100} ${cy + 150} L${cx + 100} ${cy + 150} L${cx + 200} ${cy + 250} L${cx + 500} ${cy + 250}`} stroke="#5ef2ff" />
        </g>
      );
  }
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

/** Точки на кольце у края острова. */
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
  switch (theme) {
    case 'meadow':
      list.push(deco('tower', top.x + 220, top.y + 10, 160, 260, <WoodTower x={0} y={0} s={2.2} />));
      list.push(deco('fire', top.x, top.y + 40, 160, 140, <Campfire x={0} y={0} s={2.2} animated={animated} />));
      list.push(deco('tent1', top.x - 200, top.y + 20, 140, 100, <Tent x={0} y={0} s={2.2} />));
      list.push(deco('tent2', top.x - 330, top.y + 60, 120, 90, <Tent x={0} y={0} s={1.8} c="#c9734a" />, 0.4));
      list.push(deco('banner', top.x + 90, top.y + 30, 90, 150, <Banner x={-20} y={0} s={2} c="#3f6fd8" />, 0.7));
      pts.forEach((p, i) => list.push(deco(`t${i}`, p.x, p.y, 120, 170, i % 3 === 0 ? <PineTree x={0} y={0} s={2} /> : <RoundTree x={0} y={0} s={2} />, i % 5 === 4 ? 0.5 : 0)));
      break;
    case 'architecture':
      list.push(deco('lib', top.x, top.y + 30, 160, 300, <StoneTower x={0} y={0} s={2.4} wall="#efe4c8" roof="#a0503a" h={70} />));
      list.push(deco('h1', top.x - 230, top.y + 50, 160, 160, <House x={0} y={0} s={2.6} wall="#e8dcc0" roof="#7a4a8a" lit />));
      list.push(deco('h2', top.x + 230, top.y + 50, 160, 160, <House x={0} y={0} s={2.6} wall="#e8dcc0" roof="#4a6a9a" lit />));
      list.push(deco('h3', top.x - 420, top.y + 120, 140, 140, <House x={0} y={0} s={2.2} wall="#f0e6cc" roof="#a0503a" lit />, 0.4));
      list.push(deco('t2', top.x + 420, top.y + 120, 120, 220, <StoneTower x={0} y={0} s={1.8} wall="#efe4c8" roof="#4a6a9a" h={50} />, 0.7));
      pts.forEach((p, i) => list.push(deco(`t${i}`, p.x, p.y, 120, 170, i % 2 ? <RoundTree x={0} y={0} s={1.9} c1="#9fca6a" /> : <Rock x={0} y={0} s={2.4} c="#a89a80" />)));
      break;
    case 'mechanics':
      list.push(deco('g1', top.x - 120, top.y + 20, 240, 240, <Gear x={0} y={-110} r={100} c="#c8a25a" spin={animated} />));
      list.push(deco('g2', top.x + 80, top.y - 10, 160, 160, <Gear x={0} y={-70} r={62} c="#a8824a" spin={animated} reverse />));
      list.push(deco('ch', top.x + 300, top.y + 40, 140, 280, <StoneTower x={0} y={0} s={2.2} wall="#8a8478" roof="#5a4a3a" h={70} glow="#ffb347" />));
      list.push(deco('g3', top.x - 380, top.y + 80, 160, 160, <Gear x={0} y={-70} r={60} c="#d9b06a" spin={animated} />, 0.5));
      list.push(
        deco(
          'plat',
          top.x + 520,
          top.y + 160,
          200,
          120,
          <g className={animated ? 'anim-platform' : undefined}>
            <rect x="-70" y="-50" width="140" height="22" rx="4" fill="#8a8478" stroke="#c8a25a" strokeWidth="4" />
          </g>,
        ),
      );
      pts.forEach((p, i) => list.push(deco(`r${i}`, p.x, p.y, 110, 80, <Rock x={0} y={0} s={2.4 + (i % 3) * 0.4} c={i % 2 ? '#8a8070' : '#6f6458'} />)));
      break;
    case 'citadel':
      list.push(deco('castle', top.x, top.y + 40, 360, 330, <Castle x={0} y={0} s={2.6} />));
      list.push(deco('h1', top.x - 360, top.y + 110, 140, 140, <House x={0} y={0} s={2.2} wall="#d6d3e6" roof="#4a6fd8" lit />));
      list.push(deco('h2', top.x + 360, top.y + 110, 140, 140, <House x={0} y={0} s={2.2} wall="#d6d3e6" roof="#4a6fd8" lit />, 0.3));
      list.push(deco('cr1', top.x - 520, top.y + 200, 120, 140, <Crystal x={0} y={0} s={2} c="#7cc7ff" />, 0.6));
      list.push(deco('cr2', top.x + 520, top.y + 200, 120, 140, <Crystal x={0} y={0} s={2} c="#7cc7ff" />, 0.8));
      pts.forEach((p, i) =>
        list.push(
          deco(
            `l${i}`,
            p.x,
            p.y,
            100,
            170,
            i % 2 ? (
              <PineTree x={0} y={0} s={2} />
            ) : (
              <g>
                <rect x="-3" y="-90" width="6" height="90" fill="#3e4258" />
                <circle cx="0" cy="-96" r="10" fill="#ffd97a" className={animated ? 'anim-flicker' : undefined} />
                <circle cx="0" cy="-96" r="24" fill="#ffd97a" opacity=".2" />
              </g>
            ),
          ),
        ),
      );
      break;
    case 'underwater':
      list.push(
        deco(
          'ruins',
          top.x,
          top.y + 40,
          360,
          280,
          <g>
            <StoneTower x={0} y={0} s={2.4} wall="#9fd8cf" roof="#2fa8a0" h={60} glow="#5ef2ff" />
            <Column x={-110} y={0} s={2.2} c="#a8d8d0" />
            <Column x={110} y={0} s={2.2} c="#a8d8d0" broken />
          </g>,
        ),
      );
      list.push(deco('c1', top.x - 330, top.y + 90, 120, 160, <Column x={0} y={0} s={2.4} c="#a8d8d0" broken />));
      list.push(deco('c2', top.x + 330, top.y + 90, 120, 160, <Column x={0} y={0} s={2.4} c="#a8d8d0" />, 0.4));
      pts.forEach((p, i) =>
        list.push(
          deco(
            `u${i}`,
            p.x,
            p.y,
            120,
            170,
            i % 3 === 0 ? <Coral x={0} y={0} s={2.2} c={['#ff6fae', '#ffa86f', '#c86fff'][i % 3]} /> : i % 3 === 1 ? <Seaweed x={0} y={0} s={2.2} /> : <Coral x={0} y={0} s={2} c="#ffa86f" />,
            i % 6 === 5 ? 0.5 : 0,
          ),
        ),
      );
      break;
    case 'ice':
      list.push(deco('t1', top.x, top.y + 40, 160, 330, <StoneTower x={0} y={0} s={2.5} wall="#dff2ff" roof="#5aa8e0" h={90} glow="#9be7ff" />));
      list.push(deco('t2', top.x - 260, top.y + 80, 130, 260, <StoneTower x={0} y={0} s={2} wall="#dff2ff" roof="#5aa8e0" h={70} glow="#9be7ff" />, 0.4));
      list.push(deco('t3', top.x + 260, top.y + 80, 130, 260, <StoneTower x={0} y={0} s={2} wall="#dff2ff" roof="#5aa8e0" h={70} glow="#9be7ff" />, 0.7));
      pts.forEach((p, i) => list.push(deco(`i${i}`, p.x, p.y, 120, 170, i % 2 ? <Crystal x={0} y={0} s={2} c="#9be7ff" /> : <PineTree x={0} y={0} s={2} c1="#5a9ab8" c2="#2a5a78" snow />)));
      break;
    case 'sky':
      list.push(deco('palace', top.x, top.y + 40, 340, 320, <Palace x={0} y={0} s={2.6} />));
      list.push(deco('t1', top.x - 330, top.y + 100, 130, 260, <StoneTower x={0} y={0} s={2} wall="#fbf6ea" roof="#f2c75c" h={70} glow="#fff1a8" />));
      list.push(deco('t2', top.x + 330, top.y + 100, 130, 260, <StoneTower x={0} y={0} s={2} wall="#fbf6ea" roof="#f2c75c" h={70} glow="#fff1a8" />, 0.5));
      pts.forEach((p, i) => list.push(deco(`s${i}`, p.x, p.y, 100, 150, i % 2 ? <Column x={0} y={0} s={2.2} c="#fbf6ea" /> : <Banner x={-10} y={0} s={1.8} c="#f2c75c" />, i % 4 === 3 ? 0.5 : 0)));
      break;
    case 'cosmos':
      list.push(
        deco(
          'portal',
          top.x,
          top.y + 40,
          420,
          420,
          <g>
            <circle cx="0" cy="-190" r="170" fill="url(#cosmosPortal)" />
            <g className={animated ? 'anim-spin-slow' : undefined} style={{ transformOrigin: '0px -190px' }}>
              <path d="M0 -190 C60 -280 150 -220 135 -145 M0 -190 C-60 -100 -150 -160 -135 -235 M0 -190 C90 -130 30 -40 -45 -55 M0 -190 C-90 -250 -30 -340 45 -325" stroke="#ffd6ff" strokeWidth="8" fill="none" opacity=".7" />
            </g>
            <circle cx="0" cy="-190" r="160" fill="none" stroke="#5ef2ff" strokeWidth="8" opacity=".8" />
            <StoneTower x={-150} y={0} s={2} wall="#4a2c8a" roof="#9c7bff" h={70} glow="#5ef2ff" />
            <StoneTower x={150} y={0} s={2} wall="#4a2c8a" roof="#9c7bff" h={70} glow="#5ef2ff" />
          </g>,
        ),
      );
      pts.forEach((p, i) => list.push(deco(`c${i}`, p.x, p.y, 120, 170, <Crystal x={0} y={0} s={2} c={['#e07bff', '#5ef2ff', '#9c7bff'][i % 3]} />, i % 5 === 4 ? 0.5 : 0)));
      break;
  }
  return list;
}

// ---------------------------------------------------------------- Дальний фон

export const SceneBackdrop = memo(function SceneBackdrop({ theme, animated }: { theme: ThemeId; animated: boolean }) {
  const th = THEMES[theme];
  const r = rng(77);
  const stars = Array.from({ length: 120 }, () => ({ x: r() * 1600, y: r() * 1000, s: 0.6 + r() * 2 }));
  return (
    <svg className="scene-backdrop-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="bd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={th.sceneSky[2]} />
          <stop offset=".55" stopColor={th.sceneSky[1]} />
          <stop offset="1" stopColor={th.sceneSky[0]} />
        </linearGradient>
        <radialGradient id="cosmosPortal">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".3" stopColor="#ff9cf0" stopOpacity=".8" />
          <stop offset=".7" stopColor="#6a3cff" stopOpacity=".5" />
          <stop offset="1" stopColor="#1a0a40" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bd-glow">
          <stop offset="0" stopColor={th.glow} stopOpacity=".7" />
          <stop offset="1" stopColor={th.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="1000" fill={theme === 'underwater' || theme === 'cosmos' ? th.sceneSky[1] : 'url(#bd-sky)'} />
      {theme === 'underwater' && (
        <g>
          <rect width="1600" height="1000" fill="url(#bd-sky)" transform="rotate(180 800 500)" />
          {[200, 520, 900, 1250].map((x, i) => (
            <path key={x} d={`M${x} 0 L${x + 120} 0 L${x + 300} 1000 L${x - 60} 1000 Z`} fill="#bff" opacity=".06" className={animated ? 'anim-pulse' : undefined} style={{ animationDelay: `${i}s` }} />
          ))}
          <g opacity=".35">
            <Jellyfish x={180} y={260} s={2.4} />
            <Jellyfish x={1420} y={200} s={2} c="#ff9cf0" />
          </g>
        </g>
      )}
      {(theme === 'cosmos' || theme === 'citadel' || theme === 'ice') &&
        stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y * (theme === 'cosmos' ? 1 : 0.5)} r={s.s} fill="#fff" opacity={theme === 'cosmos' ? 0.8 : 0.4} className={animated && i % 4 === 0 ? 'anim-twinkle' : undefined} />)}
      {theme === 'cosmos' && (
        <g>
          <ellipse cx="1250" cy="220" rx="380" ry="140" fill="#c64bff" opacity=".25" transform="rotate(-18 1250 220)" />
          <ellipse cx="300" cy="700" rx="420" ry="200" fill="#2fd6ff" opacity=".12" />
          <circle cx="220" cy="200" r="70" fill="#ff8a5a" />
          <circle cx="200" cy="185" r="70" fill="#ffb38a" opacity=".45" />
          <ellipse cx="220" cy="200" rx="120" ry="22" fill="none" stroke="#ffd6b0" strokeWidth="4" opacity=".7" />
          <circle cx="1450" cy="760" r="34" fill="#5ef2ff" opacity=".8" />
        </g>
      )}
      {(theme === 'meadow' || theme === 'architecture' || theme === 'mechanics') && (
        <g>
          <circle cx="1250" cy="260" r="120" fill="url(#bd-glow)" />
          <path d="M0 760 L180 660 L360 720 L560 620 L760 700 L980 610 L1200 690 L1400 630 L1600 700 L1600 1000 L0 1000 Z" fill="#000" opacity=".12" />
        </g>
      )}
      {theme === 'ice' && <path d="M0 800 L160 520 L300 700 L460 420 L640 690 L820 480 L1000 700 L1180 460 L1380 680 L1600 540 L1600 1000 L0 1000 Z" fill="#e8f6ff" opacity=".5" />}
      {theme === 'citadel' && (
        <g fill="#1c2034" opacity=".55">
          <rect x="120" y="520" width="40" height="300" />
          <path d="M110 520 L140 440 L170 520 Z" />
          <rect x="1400" y="480" width="50" height="340" />
          <path d="M1390 480 L1425 390 L1460 480 Z" />
        </g>
      )}
      {(theme === 'sky' || theme === 'meadow' || theme === 'architecture') &&
        [
          [160, 820, 260],
          [560, 880, 320],
          [1050, 860, 300],
          [1450, 830, 260],
        ].map(([x, y, rr], i) => <ellipse key={i} cx={x} cy={y} rx={rr} ry={rr * 0.35} fill="#fff" opacity={theme === 'sky' ? 0.9 : 0.45} className={animated ? 'anim-drift' : undefined} />)}
      {theme === 'sky' && <circle cx="800" cy="120" r="160" fill="url(#bd-glow)" />}
    </svg>
  );
});

// ---------------------------------------------------------------- Частицы переднего плана

export const SceneParticles = memo(function SceneParticles({ theme }: { theme: ThemeId }) {
  const r = rng(theme.length * 11 + 3);
  const kind =
    theme === 'underwater' ? 'bubble' : theme === 'ice' ? 'snow' : theme === 'cosmos' ? 'star' : theme === 'mechanics' ? 'spark' : theme === 'sky' ? 'mote' : theme === 'citadel' ? 'magic' : 'firefly';
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
      {theme === 'underwater' && <div className="caustics" />}
      {theme === 'sky' && <div className="sunrays" />}
    </div>
  );
});
