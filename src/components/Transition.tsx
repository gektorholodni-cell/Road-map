// Кинематографичные переходы между картой и островами — свой для каждого мира.
import { useEffect, useMemo, useRef } from 'react';
import type { ThemeId } from '../types';
import { THEMES } from '../data/themes';

export interface TransitionSpec {
  kind: 'enter' | 'exit';
  islandId: string;
  theme: ThemeId;
  title: string;
  subtitle: string;
  nonce: number;
}

interface Props extends TransitionSpec {
  reduced: boolean;
  /** Момент, когда экран полностью закрыт эффектом: здесь переключается сцена. */
  onMid: () => void;
  onDone: () => void;
}

export const ENTER_MS = 2100;
export const EXIT_MS = 1300;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function Transition({ kind, theme, title, subtitle, reduced, onMid, onDone }: Props) {
  const total = reduced ? 500 : kind === 'enter' ? ENTER_MS : EXIT_MS;
  const mid = reduced ? 220 : kind === 'enter' ? 1050 : 600;
  const cbs = useRef({ onMid, onDone });
  cbs.current = { onMid, onDone };
  useEffect(() => {
    const a = window.setTimeout(() => cbs.current.onMid(), mid);
    const b = window.setTimeout(() => cbs.current.onDone(), total);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [mid, total]);

  const th = THEMES[theme];
  const parts = useMemo(() => {
    const r = rng(theme.length * 13 + (kind === 'enter' ? 1 : 2));
    return Array.from({ length: 48 }, (_, i) => ({ i, x: r() * 100, y: r() * 100, d: r() * 0.5, s: 0.5 + r(), a: r() * 360 }));
  }, [theme, kind]);

  if (reduced) {
    return (
      <div className="transition reduced" style={{ ['--glow' as string]: th.glow, animationDuration: `${total}ms` }} aria-hidden>
        <div className="tr-title">
          <div className="tr-sub">{subtitle}</div>
          <div className="tr-name">{title}</div>
        </div>
      </div>
    );
  }

  const effect = kind === 'exit' ? 'exit' : theme;
  return (
    <div className={`transition tr-${effect}`} style={{ ['--glow' as string]: th.glow, ['--accent' as string]: th.accent, ['--sky0' as string]: th.sceneSky[0], ['--sky1' as string]: th.sceneSky[1], ['--sky2' as string]: th.sceneSky[2], ['--dur' as string]: `${total}ms` }} aria-hidden>
      <div className="tr-tint" />
      {effect === 'meadow' && parts.slice(0, 40).map((p) => <i key={p.i} className="leaf" style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${p.d}s`, ['--r' as string]: `${p.a}deg`, ['--s' as string]: p.s }} />)}
      {effect === 'architecture' && (
        <>
          <div className="blueprint" />
          <div className="light-bridge" />
        </>
      )}
      {effect === 'mechanics' &&
        [0, 1, 2, 3, 4].map((i) => (
          <svg key={i} className={`tr-gear g${i}`} viewBox="-50 -50 100 100">
            <path
              d="M-6 -48 L6 -48 L8 -36 L18 -32 L28 -40 L36 -32 L30 -22 L34 -12 L46 -10 L46 2 L34 4 L30 14 L38 24 L30 32 L20 26 L10 30 L8 42 L-6 42 L-8 30 L-18 26 L-28 32 L-36 24 L-30 14 L-34 4 L-46 2 L-46 -10 L-34 -12 L-30 -22 L-36 -32 L-28 -40 L-18 -32 L-8 -36 Z"
              fill={i % 2 ? '#a8824a' : '#c8a25a'}
            />
            <circle r="14" fill="#2a2016" />
          </svg>
        ))}
      {effect === 'mechanics' && parts.slice(0, 24).map((p) => <i key={p.i} className="spark" style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${p.d}s` }} />)}
      {effect === 'citadel' && (
        <>
          <div className="gate left">
            <span className="rune" />
          </div>
          <div className="gate right">
            <span className="rune" />
          </div>
        </>
      )}
      {effect === 'underwater' && (
        <>
          <div className="water" />
          {parts.map((p) => (
            <i key={p.i} className="bubble" style={{ left: `${p.x}%`, animationDelay: `${p.d * 1.4}s`, ['--s' as string]: p.s }} />
          ))}
          {parts.slice(0, 4).map((p) => (
            <i key={`j${p.i}`} className="jelly" style={{ left: `${10 + p.x * 0.8}%`, top: `${30 + p.y * 0.5}%`, animationDelay: `${p.d}s` }} />
          ))}
        </>
      )}
      {effect === 'ice' && (
        <>
          <div className="fog" />
          {parts.map((p) => (
            <i key={p.i} className="flake" style={{ left: `${p.x}%`, top: `${p.y - 20}%`, animationDelay: `${p.d * 0.6}s`, ['--s' as string]: p.s }} />
          ))}
        </>
      )}
      {effect === 'sky' && (
        <>
          <div className="rays" />
          {parts.slice(0, 16).map((p) => (
            <i key={p.i} className="cloud" style={{ left: `${p.x - 10}%`, animationDelay: `${p.d}s`, ['--s' as string]: p.s }} />
          ))}
        </>
      )}
      {effect === 'cosmos' && (
        <>
          <div className="portal-ring" />
          {parts.map((p) => (
            <i key={p.i} className="streak" style={{ ['--a' as string]: `${p.a}deg`, animationDelay: `${p.d * 0.8}s`, ['--s' as string]: p.s }} />
          ))}
        </>
      )}
      {effect === 'exit' && parts.slice(0, 18).map((p) => <i key={p.i} className="cloud" style={{ left: `${p.x - 10}%`, animationDelay: `${p.d * 0.5}s`, ['--s' as string]: p.s }} />)}
      <div className="tr-title">
        <div className="tr-sub">{kind === 'enter' ? subtitle : 'Возвращение на карту мира'}</div>
        <div className="tr-name">{title}</div>
        {kind === 'enter' && <div className="tr-travel">{th.travel}</div>}
      </div>
    </div>
  );
}
