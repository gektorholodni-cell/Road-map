// Летающий остров для карты мира. Рисуется вокруг (0,0) — центра верхней поверхности,
// радиус поверхности 200 единиц. Часть построек появляется по мере прогресса острова.
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
  StoneTower,
  Tent,
  Waterfall,
  WoodTower,
} from './primitives';

interface Props {
  theme: ThemeId;
  uid: string;
  progress: number;
  complete: boolean;
  animated: boolean;
}

type Deco = [number, ReactNode];

const ROCK =
  'M-200 0 L-188 34 L-176 66 L-150 92 L-136 128 L-104 146 L-88 182 L-56 196 L-38 236 L-12 222 L4 262 L24 220 L52 206 L70 170 L104 150 L124 112 L156 92 L178 58 L192 28 L200 0 Z';
const STRATA = [
  'M-176 66 L-120 74 L-60 70 L0 80 L64 72 L124 76 L178 58 L156 92 L104 98 L40 104 L-30 100 L-104 102 L-150 92 Z',
  'M-104 146 L-50 150 L10 160 L70 150 L104 150 L70 170 L20 178 L-40 176 L-88 182 Z',
];

function decorations(theme: ThemeId, a: boolean): Deco[] {
  switch (theme) {
    case 'meadow':
      return [
        [0, <RoundTree key="t1" x={-140} y={-6} s={1.1} />],
        [0, <RoundTree key="t2" x={-110} y={22} s={0.9} />],
        [0, <PineTree key="p1" x={140} y={0} s={1} />],
        [0, <Campfire key="f" x={-10} y={20} s={1} animated={a} />],
        [0, <Tent key="tent" x={-60} y={6} s={1} />],
        [0, <WoodTower key="w" x={80} y={-8} s={1} />],
        [0.3, <RoundTree key="t3" x={150} y={30} s={0.8} />],
        [0.6, <Banner key="b" x={30} y={-14} s={0.9} c="#3f6fd8" />],
        [0.85, <House key="h" x={-40} y={-30} s={0.8} wall="#d9b98a" roof="#8a4a2a" lit />],
      ];
    case 'architecture':
      return [
        [0, <House key="h1" x={-120} y={0} s={1.1} wall="#e8dcc0" roof="#7a4a8a" lit />],
        [0, <House key="h2" x={110} y={6} s={1} wall="#e8dcc0" roof="#4a6a9a" lit />],
        [0, <StoneTower key="lib" x={0} y={-16} s={1.1} wall="#efe4c8" roof="#a0503a" h={56} />],
        [0, <RoundTree key="t" x={-160} y={24} s={0.8} c1="#8fbf5a" />],
        [0, <Rock key="r" x={160} y={26} s={1.1} c="#a89a80" />],
        [0.35, <House key="h3" x={-50} y={30} s={0.85} wall="#f0e6cc" roof="#a0503a" lit />],
        [0.65, <StoneTower key="t2" x={60} y={30} s={0.8} wall="#efe4c8" roof="#4a6a9a" h={40} />],
        [0.9, <Banner key="b" x={150} y={-4} s={0.8} c="#d9b56a" />],
      ];
    case 'mechanics':
      return [
        [0, <Gear key="g1" x={-110} y={-40} r={34} c="#c8a25a" spin={a} />],
        [0, <Gear key="g2" x={-62} y={-62} r={22} c="#a8824a" spin={a} reverse />],
        [0, <StoneTower key="ch" x={110} y={0} s={1} wall="#8a8478" roof="#5a4a3a" h={60} glow="#ffb347" />],
        [0, <Rock key="r1" x={-150} y={28} s={1.4} c="#8a8070" />],
        [0, <Rock key="r2" x={160} y={30} s={1} c="#7a7060" />],
        [0, <ellipse key="arena" cx={10} cy={20} rx={60} ry={20} fill="#6b5f50" stroke="#c8a25a" strokeWidth={3} />],
        [0.4, <Gear key="g3" x={40} y={-56} r={26} c="#d9b06a" spin={a} />],
        [0.7, <House key="w" x={-30} y={-6} s={0.9} wall="#a89a88" roof="#5a4a3a" lit />],
      ];
    case 'citadel':
      return [
        [0, <Castle key="c" x={0} y={-6} s={1.1} />],
        [0, <PineTree key="p1" x={-160} y={16} s={0.9} />],
        [0, <PineTree key="p2" x={160} y={20} s={0.9} />],
        [0, <House key="h1" x={-110} y={30} s={0.8} wall="#d6d3e6" roof="#4a6fd8" lit />],
        [0.4, <House key="h2" x={110} y={34} s={0.8} wall="#d6d3e6" roof="#4a6fd8" lit />],
        [0.6, <Crystal key="cr" x={-150} y={-10} s={0.8} c="#7cc7ff" />],
        [0.8, <Crystal key="cr2" x={150} y={-12} s={0.8} c="#7cc7ff" />],
      ];
    case 'underwater':
      return [
        [0, <Column key="c1" x={-60} y={-6} s={1.1} c="#a8d8d0" />],
        [0, <Column key="c2" x={-30} y={-12} s={1.2} c="#a8d8d0" broken />],
        [0, <Column key="c3" x={40} y={-10} s={1.1} c="#a8d8d0" broken />],
        [0, <StoneTower key="t" x={0} y={-20} s={1} wall="#9fd8cf" roof="#2fa8a0" h={50} glow="#5ef2ff" />],
        [0, <Coral key="co1" x={-140} y={20} s={1.2} c="#ff6fae" />],
        [0, <Coral key="co2" x={130} y={24} s={1.1} c="#ffa86f" />],
        [0, <Seaweed key="s1" x={-110} y={30} s={1} />],
        [0, <Seaweed key="s2" x={160} y={10} s={0.9} />],
        [0.5, <Crystal key="cr" x={90} y={0} s={0.8} c="#5ef2ff" />],
        [0.8, <Coral key="co3" x={60} y={36} s={0.8} c="#c86fff" />],
      ];
    case 'ice':
      return [
        [0, <path key="m" d="M-170 10 L-120 -90 L-90 -40 L-60 -120 L-10 6 Z" fill="#e8f6ff" />],
        [0, <path key="m2" d="M-120 -90 L-108 -66 L-118 -60 L-130 -70 Z M-60 -120 L-46 -88 L-60 -80 L-72 -96 Z" fill="#fff" />],
        [0, <StoneTower key="t1" x={70} y={-6} s={1.1} wall="#dff2ff" roof="#5aa8e0" h={80} glow="#9be7ff" />],
        [0, <Crystal key="c1" x={140} y={14} s={1.1} c="#9be7ff" />],
        [0, <Crystal key="c2" x={-20} y={26} s={0.9} c="#bff0ff" />],
        [0, <PineTree key="p" x={20} y={-10} s={0.9} c1="#5a9ab8" c2="#2a5a78" snow />],
        [0.5, <StoneTower key="t2" x={130} y={-30} s={0.8} wall="#dff2ff" roof="#5aa8e0" h={60} glow="#9be7ff" />],
        [0.8, <Crystal key="c3" x={-150} y={30} s={0.8} c="#9be7ff" />],
      ];
    case 'sky':
      return [
        [0, <Palace key="p" x={0} y={-4} s={1.2} />],
        [0, <StoneTower key="t1" x={-140} y={10} s={0.9} wall="#fbf6ea" roof="#f2c75c" h={70} glow="#fff1a8" />],
        [0, <StoneTower key="t2" x={140} y={14} s={0.9} wall="#fbf6ea" roof="#f2c75c" h={60} glow="#fff1a8" />],
        [0.4, <Column key="c" x={-80} y={34} s={0.9} c="#fbf6ea" />],
        [0.6, <Column key="c2" x={80} y={36} s={0.9} c="#fbf6ea" />],
        [0.85, <Banner key="b" x={40} y={30} s={0.8} c="#f2c75c" />],
      ];
    case 'cosmos':
      return [
        [0, <StoneTower key="t1" x={0} y={-10} s={1.4} wall="#5a3a9a" roof="#e07bff" h={90} glow="#5ef2ff" />],
        [0, <StoneTower key="t2" x={-70} y={10} s={1} wall="#4a2c8a" roof="#9c7bff" h={60} glow="#5ef2ff" />],
        [0, <StoneTower key="t3" x={70} y={12} s={1} wall="#4a2c8a" roof="#9c7bff" h={66} glow="#5ef2ff" />],
        [0, <Crystal key="c1" x={-140} y={18} s={1.2} c="#e07bff" />],
        [0, <Crystal key="c2" x={140} y={20} s={1.1} c="#5ef2ff" />],
        [0.5, <Crystal key="c3" x={-30} y={40} s={0.8} c="#ff7bd5" />],
        [0.8, <Crystal key="c4" x={40} y={44} s={0.7} c="#9c7bff" />],
      ];
  }
}

/** Фон позади острова: пузырь воды, облака, туманность. */
function backdrop(theme: ThemeId, uid: string, a: boolean): ReactNode {
  switch (theme) {
    case 'underwater':
      return (
        <g>
          <defs>
            <radialGradient id={`${uid}-water`} cx="50%" cy="40%" r="60%">
              <stop offset="0" stopColor="#1fb7c9" stopOpacity=".55" />
              <stop offset=".7" stopColor="#0a4f7a" stopOpacity=".75" />
              <stop offset="1" stopColor="#04223f" stopOpacity=".9" />
            </radialGradient>
          </defs>
          <circle cx="0" cy="30" r="290" fill={`url(#${uid}-water)`} />
          <circle cx="0" cy="30" r="290" fill="none" stroke="#7ff7ff" strokeOpacity=".5" strokeWidth="3" />
          <path d="M-250 -120 Q-200 -132 -150 -120 T-50 -120 T50 -120 T150 -120 T250 -120" stroke="#bff" strokeOpacity=".5" strokeWidth="3" fill="none" />
          {[-180, -40, 90, 200].map((x) => (
            <path key={x} d={`M${x} -260 L${x + 30} 120 L${x - 10} 120 Z`} fill="#bff" opacity=".07" />
          ))}
          <Jellyfish x={-190} y={-60} s={1.1} />
          <Jellyfish x={200} y={-20} s={0.9} c="#ff9cf0" />
          <Jellyfish x={150} y={-170} s={0.7} />
          {a &&
            [-120, -20, 60, 170].map((x, i) => (
              <circle key={x} cx={x} cy={100} r={4 + (i % 3) * 2} fill="none" stroke="#dff" strokeOpacity=".7" className="anim-bubble" style={{ animationDelay: `${i * 0.9}s` }} />
            ))}
        </g>
      );
    case 'sky':
      return (
        <g>
          {[-120, -40, 40, 120].map((x, i) => (
            <path key={x} d={`M${x} -300 L${x + 60} 60 L${x + 20} 60 Z`} fill="#fff4c0" opacity=".12" className={a ? 'anim-pulse' : undefined} style={{ animationDelay: `${i * 0.7}s` }} />
          ))}
        </g>
      );
    case 'cosmos':
      return (
        <g>
          <defs>
            <radialGradient id={`${uid}-neb`}>
              <stop offset="0" stopColor="#e07bff" stopOpacity=".55" />
              <stop offset=".5" stopColor="#6a3cff" stopOpacity=".25" />
              <stop offset="1" stopColor="#1a0a40" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${uid}-portal`}>
              <stop offset="0" stopColor="#fff" stopOpacity=".95" />
              <stop offset=".25" stopColor="#ff9cf0" stopOpacity=".8" />
              <stop offset=".6" stopColor="#6a3cff" stopOpacity=".55" />
              <stop offset="1" stopColor="#1a0a40" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="0" cy="-40" r="340" fill={`url(#${uid}-neb)`} />
          <g transform="translate(150 -170)">
            <circle r="110" fill={`url(#${uid}-portal)`} />
            <g className={a ? 'anim-spin-slow' : undefined}>
              <path d="M0 0 C40 -60 100 -20 90 30 M0 0 C-40 60 -100 20 -90 -30 M0 0 C60 40 20 100 -30 90 M0 0 C-60 -40 -20 -100 30 -90" stroke="#ffd6ff" strokeWidth="5" fill="none" opacity=".75" />
            </g>
            <circle r="100" fill="none" stroke="#5ef2ff" strokeWidth="4" opacity=".7" />
          </g>
          <circle cx="-240" cy="-140" r="26" fill="#ff8a5a" />
          <circle cx="-248" cy="-148" r="26" fill="#ffb38a" opacity=".5" />
          <circle cx="250" cy="120" r="14" fill="#5ef2ff" opacity=".9" />
        </g>
      );
    default:
      return null;
  }
}

function foreground(theme: ThemeId, a: boolean): ReactNode {
  switch (theme) {
    case 'sky':
      return (
        <g opacity=".95">
          {[
            [-220, 60, 90],
            [-120, 110, 110],
            [20, 130, 130],
            [160, 100, 110],
            [240, 50, 80],
          ].map(([x, y, r]) => (
            <ellipse key={x} cx={x} cy={y} rx={r} ry={r * 0.45} fill="#fff" opacity=".85" className={a ? 'anim-drift' : undefined} />
          ))}
        </g>
      );
    case 'cosmos':
      return (
        <g className={a ? 'anim-orbit' : undefined}>
          <ellipse cx="0" cy="40" rx="290" ry="70" fill="none" stroke="#5ef2ff" strokeWidth="3" opacity=".55" />
          <ellipse cx="0" cy="40" rx="320" ry="82" fill="none" stroke="#e07bff" strokeWidth="2" opacity=".4" strokeDasharray="12 18" />
        </g>
      );
    default:
      return null;
  }
}

function IslandArtImpl({ theme, uid, progress, complete, animated }: Props) {
  const th = THEMES[theme];
  const decos = decorations(theme, animated).filter(([at]) => progress >= at || complete);
  const hasFalls = theme === 'meadow' || theme === 'architecture' || theme === 'citadel' || theme === 'sky' || theme === 'mechanics';
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-rock`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={th.rock[0]} />
          <stop offset="1" stopColor={th.rock[1]} />
        </linearGradient>
        <linearGradient id={`${uid}-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={th.top[0]} />
          <stop offset="1" stopColor={th.top[1]} />
        </linearGradient>
        <radialGradient id={`${uid}-aura`}>
          <stop offset="0" stopColor={th.glow} stopOpacity=".5" />
          <stop offset="1" stopColor={th.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      {complete && <ellipse cx="0" cy="20" rx="320" ry="260" fill={`url(#${uid}-aura)`} className={animated ? 'anim-pulse' : undefined} />}
      {backdrop(theme, uid, animated)}
      {/* Скалы снизу */}
      <path d={ROCK} fill={`url(#${uid}-rock)`} />
      {STRATA.map((d) => (
        <path key={d} d={d} fill="#000" opacity=".16" />
      ))}
      <path d="M40 0 L200 0 L178 58 L156 92 L124 112 L104 150 L70 170 L52 206 L24 220 L4 262 Z" fill="#000" opacity=".18" />
      {theme === 'ice' && <path d="M-150 92 L-144 130 L-136 96 M-56 196 L-50 236 L-44 200 M70 170 L76 206 L82 172 M124 112 L130 146 L136 114" stroke="#cfefff" strokeWidth="5" fill="none" />}
      {theme === 'cosmos' && <path d="M-120 60 L-60 120 L-20 100 L30 170 M80 70 L120 120" stroke="#e07bff" strokeWidth="3" fill="none" opacity=".8" className={animated ? 'anim-pulse' : undefined} />}
      {/* Обломки, парящие под островом */}
      <g className={animated ? 'anim-float' : undefined}>
        <path d="M-150 220 L-130 210 L-120 230 L-138 248 Z" fill={`url(#${uid}-rock)`} />
        <path d="M130 250 L150 244 L156 262 L140 276 Z" fill={`url(#${uid}-rock)`} />
      </g>
      {hasFalls && <Waterfall x={-150} y={70} h={170} w={14} c={theme === 'sky' ? '#fff6cf' : '#bfefff'} />}
      {hasFalls && theme !== 'mechanics' && <Waterfall x={120} y={90} h={130} w={10} c={theme === 'sky' ? '#fff6cf' : '#bfefff'} />}
      {/* Поверхность */}
      <path d="M-200 0 A200 70 0 0 0 200 0 L196 16 A196 70 0 0 1 -196 16 Z" fill={th.top[1]} />
      <ellipse cx="0" cy="0" rx="200" ry="70" fill={`url(#${uid}-top)`} />
      <ellipse cx="-30" cy="-14" rx="140" ry="36" fill="#fff" opacity=".08" />
      {theme === 'meadow' && <path d="M-40 40 Q-10 10 30 20 T90 0" stroke={th.path} strokeWidth="8" fill="none" opacity=".8" strokeLinecap="round" />}
      {theme === 'architecture' && <path d="M-150 20 L-60 10 L0 30 L80 10 L160 20" stroke={th.path} strokeWidth="10" fill="none" strokeDasharray="14 4" />}
      {decos.map(([, el]) => el)}
      {foreground(theme, animated)}
      {complete && (
        <g>
          <Banner x={-180} y={6} s={1} c={th.glow} />
          {[-120, -40, 50, 130].map((x, i) => (
            <circle key={x} cx={x} cy={-60 - (i % 2) * 30} r="4" fill={th.glow} className={animated ? 'anim-twinkle' : undefined} style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </g>
      )}
    </g>
  );
}

export const IslandArt = memo(IslandArtImpl);
