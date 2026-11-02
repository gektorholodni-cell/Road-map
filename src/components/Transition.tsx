// Переходы между картой и секторами в стиле «Сектора Ноль»: мигание света, помехи и туман.
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

  const effect = kind === 'exit' ? 'exit' : 'nii';
  return (
    <div className={`transition tr-${effect}`} style={{ ['--glow' as string]: th.glow, ['--accent' as string]: th.accent, ['--sky0' as string]: th.sceneSky[0], ['--sky1' as string]: th.sceneSky[1], ['--sky2' as string]: th.sceneSky[2], ['--dur' as string]: `${total}ms` }} aria-hidden>
      <div className="tr-tint" />
      {effect === 'nii' && (
        <>
          {/* Свет мигает, по экрану идут помехи, наползает туман */}
          <div className="tr-static" />
          <div className="tr-fog" />
          <div className="tr-scanline" />
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
