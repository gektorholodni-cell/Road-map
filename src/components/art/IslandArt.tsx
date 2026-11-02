// Парящая плита-объект НИИ для карты мира. Рисуется вокруг (0,0) — центра верхней поверхности,
// радиус поверхности 200 единиц. Часть построек появляется по мере прогресса сектора.
import { memo, type ReactNode } from 'react';
import type { ThemeId } from '../../types';
import { THEMES } from '../../data/themes';
import { Banner } from './primitives';
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
  FogBand,
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
} from './nii';

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
/** Торчащая арматура и обрывки труб под плитой. */
const REBAR = 'M-150 92 L-162 128 M-136 128 L-128 160 M-56 196 L-64 230 M70 170 L80 204 M124 112 L140 140 M156 92 L172 116';

// Каждый сектор — отдельный объект НИИ «Тишина». Часть построек появляется по мере прогресса.
function decorations(theme: ThemeId, a: boolean): Deco[] {
  switch (theme) {
    case 'meadow': // Проходная
      return [
        [0, <Fence key="f1" x={-130} y={-10} w={90} />],
        [0, <Fence key="f2" x={140} y={-6} w={80} />],
        [0, <Booth key="b" x={-30} y={4} s={1.2} animated={a} />],
        [0, <Barrier key="br" x={-2} y={16} s={1} />],
        [0, <LampPost key="l1" x={-90} y={30} s={1.1} animated={a} />],
        [0, <DeadTree key="t1" x={150} y={30} s={1.1} />],
        [0.3, <DeadTree key="t2" x={-160} y={24} s={0.9} />],
        [0.6, <Signboard key="s" x={90} y={22} s={1} text="КПП-1" />],
        [0.85, <LampPost key="l2" x={60} y={-20} s={1} animated={a} />],
      ];
    case 'architecture': // Чертёжное бюро
      return [
        [0, <Block key="b1" x={-80} y={-4} w={100} h={54} cols={7} rows={3} seed={2} animated={a} />],
        [0, <Block key="b2" x={70} y={4} w={80} h={44} cols={5} rows={3} seed={4} wall="#9a9a8e" animated={a} />],
        [0, <LampPost key="l" x={-160} y={28} animated={a} />],
        [0, <Rubble key="r" x={150} y={30} s={1.2} />],
        [0.35, <Signboard key="s" x={10} y={34} s={1} text="ОКБ" />],
        [0.65, <Dish key="d" x={70} y={-40} s={0.9} />],
        [0.9, <LampPost key="l2" x={150} y={-4} animated={a} />],
      ];
    case 'mechanics': // Лаборатория
      return [
        [0, <Block key="lab" x={-50} y={-6} w={90} h={60} cols={5} rows={3} seed={6} lit={TOXIC} animated={a} />],
        [0, <Chimney key="ch" x={60} y={-14} h={110} animated={a} />],
        [0, <Tank key="t1" x={120} y={20} />],
        [0, <Pipes key="p" x={-20} y={34} w={120} />],
        [0, <Rubble key="r" x={-160} y={26} s={1.2} />],
        [0.4, <Barrels key="ba" x={-140} y={10} />],
        [0.7, <Tank key="t2" x={160} y={-10} s={0.8} c="#7f8a74" />],
      ];
    case 'citadel': // Сектор Ноль
      return [
        [0, <MainBuilding key="m" x={0} y={-6} s={1.05} animated={a} />],
        [0, <ElevatorShaft key="e" x={-130} y={16} animated={a} />],
        [0, <LampPost key="l1" x={-170} y={30} animated={a} c={ALARM} />],
        [0, <LampPost key="l2" x={130} y={32} animated={a} />],
        [0.4, <Barrels key="b" x={160} y={18} />],
        [0.6, <Fence key="f" x={-60} y={46} w={60} />],
        [0.8, <HazardSign key="h" x={100} y={44} />],
      ];
    case 'underwater': // Офисы с телевизорами
      return [
        [0, <Block key="o" x={-30} y={-10} w={120} h={60} cols={8} rows={3} seed={8} lit={CRT} animated={a} />],
        [0, <TvStack key="tv1" x={100} y={24} s={1} animated={a} />],
        [0, <LampPost key="l" x={-150} y={26} animated={a} c={CRT} broken />],
        [0, <Rubble key="r" x={160} y={-6} />],
        [0.5, <TvStack key="tv2" x={-120} y={36} s={0.8} animated={a} />],
        [0.8, <Signboard key="s" x={20} y={40} text="ОТДЕЛ 4" c="#3a6a8a" />],
      ];
    case 'ice': // Карантин
      return [
        [0, <Watchtower key="w" x={-120} y={6} s={1.1} animated={a} />],
        [0, <Fence key="f1" x={0} y={-16} w={150} />],
        [0, <Block key="b" x={60} y={-20} w={70} h={40} cols={4} rows={2} seed={9} wall="#9aa3a6" lit="#cfe8ff" animated={a} />],
        [0, <HazardSign key="h1" x={-40} y={34} />],
        [0, <DeadTree key="t" x={160} y={26} />],
        [0.5, <HazardSign key="h2" x={120} y={40} />],
        [0.8, <Watchtower key="w2" x={150} y={-14} s={0.8} animated={a} />],
      ];
    case 'sky': // Радиоцентр: Steam, маркетинг, релиз
      return [
        [0, <RadioMast key="m" x={20} y={-8} h={170} animated={a} />],
        [0, <Block key="b" x={-90} y={0} w={80} h={44} cols={5} rows={2} seed={12} animated={a} />],
        [0, <Dish key="d1" x={110} y={16} s={1.1} />],
        [0, <LampPost key="l" x={-160} y={28} animated={a} />],
        [0.4, <Dish key="d2" x={150} y={-12} s={0.8} />],
        [0.6, <Signboard key="s" x={-30} y={40} text="ЭФИР" />],
        [0.85, <RadioMast key="m2" x={-150} y={-4} h={90} animated={a} />],
      ];
    case 'cosmos': // Бункер: жизнь после релиза
      return [
        [0, <Bunker key="b" x={0} y={-2} s={1.2} animated={a} />],
        [0, <RadioMast key="m" x={-120} y={6} h={110} animated={a} />],
        [0, <Barrels key="ba" x={110} y={26} c="#3e4a3a" />],
        [0, <LampPost key="l" x={150} y={-6} animated={a} c={TOXIC} />],
        [0.5, <Fence key="f" x={-40} y={48} w={70} />],
        [0.8, <HazardSign key="h" x={-170} y={30} />],
      ];
  }
}

/** Фон позади объекта: свечение окон, прожекторы, помехи. */
function backdrop(theme: ThemeId, uid: string, a: boolean): ReactNode {
  const th = THEMES[theme];
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-haze`}>
          <stop offset="0" stopColor={th.glow} stopOpacity=".22" />
          <stop offset="1" stopColor={th.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="-40" rx="300" ry="200" fill={`url(#${uid}-haze)`} className={a ? 'anim-pulse' : undefined} />
      {theme === 'ice' &&
        [-200, 180].map((x, i) => (
          <g key={x} opacity=".07">
            <path d={`M${x} -260 L${x + 40} 40 L${x - 20} 40 Z`} fill="#f6f1d8" className={a ? 'anim-pulse' : undefined} style={{ animationDelay: `${i * 1.3}s` }} />
          </g>
        ))}
    </g>
  );
}

function foreground(_theme: ThemeId, a: boolean): ReactNode {
  return (
    <g>
      <FogBand x={-80} y={56} w={360} o={0.45} animated={a} />
      <FogBand x={120} y={80} w={280} o={0.3} animated={a} />
    </g>
  );
}

function IslandArtImpl({ theme, uid, progress, complete, animated }: Props) {
  const th = THEMES[theme];
  const decos = decorations(theme, animated).filter(([at]) => progress >= at || complete);
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
      <path d={REBAR} stroke="#7a4a2e" strokeWidth="3" fill="none" opacity=".8" />
      {/* Огоньки в трещинах плиты */}
      <circle cx="-60" cy="120" r="3" fill={th.glow} opacity=".7" className={animated ? 'anim-twinkle' : undefined} />
      <circle cx="40" cy="150" r="2.5" fill={th.glow} opacity=".6" className={animated ? 'anim-twinkle' : undefined} />
      {/* Обломки, парящие под сектором */}
      <g className={animated ? 'anim-float' : undefined}>
        <path d="M-150 220 L-130 210 L-120 230 L-138 248 Z" fill={`url(#${uid}-rock)`} />
        <path d="M130 250 L150 244 L156 262 L140 276 Z" fill={`url(#${uid}-rock)`} />
      </g>
      {/* Капли с края плиты */}
      <path d="M-150 92 L-150 150 M118 112 L118 190" stroke="#9fb0b0" strokeWidth="2" strokeDasharray="3 14" opacity=".5" className={animated ? 'anim-fall' : undefined} />
      {/* Поверхность */}
      <path d="M-200 0 A200 70 0 0 0 200 0 L196 16 A196 70 0 0 1 -196 16 Z" fill={th.top[1]} />
      <ellipse cx="0" cy="0" rx="200" ry="70" fill={`url(#${uid}-top)`} />
      <ellipse cx="-30" cy="-14" rx="140" ry="36" fill="#fff" opacity=".08" />
      {/* Трещины асфальта и разметка */}
      <path d="M-150 10 L-100 22 L-80 14 L-40 30 M60 -30 L90 -14 L120 -20 M20 44 L50 52" stroke="#000" strokeOpacity=".3" strokeWidth="2" fill="none" />
      <path d="M-120 40 L120 40" stroke="#d8d2b8" strokeOpacity=".25" strokeWidth="3" strokeDasharray="16 14" />
      {decos.map(([, el]) => el)}
      {foreground(theme, animated)}
      {complete && (
        <g>
          <Banner x={-180} y={6} s={1} c={ALARM} />
          {[-120, -40, 50, 130].map((x, i) => (
            <circle key={x} cx={x} cy={-60 - (i % 2) * 30} r="4" fill={th.glow} className={animated ? 'anim-twinkle' : undefined} style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </g>
      )}
    </g>
  );
}

export const IslandArt = memo(IslandArtImpl);
