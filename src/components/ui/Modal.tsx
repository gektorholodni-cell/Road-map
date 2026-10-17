import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  side?: boolean;
  className?: string;
  labelledBy?: string;
}

/** Стеклянное модальное окно: Esc закрывает, фокус переносится внутрь. */
export function Modal({ title, onClose, children, footer, wide, side, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Закрываем только верхнее окно.
        const all = document.querySelectorAll('[data-modal]');
        if (all[all.length - 1] === ref.current) {
          e.stopPropagation();
          closeRef.current();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      prev?.focus?.();
    };
  }, []);
  return (
    <div className={`modal-backdrop ${side ? 'side' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} data-modal className={`modal glass ${wide ? 'wide' : ''} ${side ? 'side' : ''} ${className}`} role="dialog" aria-modal="true" tabIndex={-1}>
        <header className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть" title="Закрыть (Esc)">
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}
