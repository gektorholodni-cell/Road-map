// Маленький исследователь: стилизованный персонаж с анимацией ходьбы и ожидания.
import { forwardRef } from 'react';

export const Hero = forwardRef<HTMLDivElement, { scarf: string; className?: string; label?: string }>(function Hero({ scarf, className = '', label = 'Исследователь' }, ref) {
  return (
    <div ref={ref} className={`hero ${className}`} aria-label={label}>
      <svg viewBox="-30 -84 60 92" width="60" height="92" aria-hidden>
        <ellipse className="hero-shadow" cx="0" cy="2" rx="16" ry="5" fill="#000" opacity=".35" />
        <g className="hero-body">
          <g className="leg leg-l">
            <rect x="-7" y="-20" width="6" height="20" rx="3" fill="#3a2e4a" />
            <rect x="-9" y="-3" width="9" height="5" rx="2" fill="#4a3424" />
          </g>
          <g className="leg leg-r">
            <rect x="1" y="-20" width="6" height="20" rx="3" fill="#2e2440" />
            <rect x="0" y="-3" width="9" height="5" rx="2" fill="#3a2a1c" />
          </g>
          <rect x="-14" y="-46" width="11" height="22" rx="4" fill="#8a5f38" />
          <path d="M-10 -46 L10 -46 L12 -18 L-12 -18 Z" fill="#2f6d7a" />
          <rect x="-12" y="-24" width="24" height="4" fill="#5a3d26" />
          <rect x="-2" y="-25" width="5" height="6" fill="#e8c26a" />
          <g className="arm arm-r">
            <rect x="9" y="-44" width="5" height="18" rx="2.5" fill="#2a5f6a" />
          </g>
          <circle cx="0" cy="-56" r="11" fill="#f0c9a0" />
          <circle cx="4" cy="-57" r="1.6" fill="#2a1d14" />
          <path d="M-12 -60 Q-12 -74 0 -74 Q12 -74 12 -60 Z" fill="#a0703f" />
          <rect x="-17" y="-62" width="34" height="5" rx="2.5" fill="#8a5a30" />
          <path d="M-10 -46 Q0 -40 10 -46 L8 -42 Q0 -38 -8 -42 Z" fill={scarf} />
          <path className="scarf-tail" d="M-8 -44 L-18 -36 L-14 -34 L-6 -40 Z" fill={scarf} />
        </g>
      </svg>
    </div>
  );
});
