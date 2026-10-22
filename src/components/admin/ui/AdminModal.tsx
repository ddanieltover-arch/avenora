/**
 * @license Apache-2.0
 * Accessible admin dialog shell.
 */

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
  tone?: 'default' | 'danger' | 'warning';
}

const SIZE: Record<NonNullable<AdminModalProps['size']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export const AdminModal: React.FC<AdminModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  tone = 'default',
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea')?.focus();
    }, 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const accent =
    tone === 'danger'
      ? 'text-rose-700'
      : tone === 'warning'
        ? 'text-amber-700'
        : 'text-brand-deep';

  return (
    <div
      className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs flex modal-overlay-scroll justify-center p-4 z-50 motion-safe:animate-in"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-white rounded-2xl border border-slate-200 ${SIZE[size]} w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[min(calc(100dvh-1.5rem),90vh)] overflow-y-auto overscroll-y-contain my-auto motion-safe:transition-opacity motion-safe:duration-200`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="min-w-0">
            <h3 id={titleId} className={`font-serif font-bold text-base ${accent}`}>
              {title}
            </h3>
            {description ? (
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-dark hover:bg-brand-neutral cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>{children}</div>
        {footer ? (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-end gap-2">{footer}</div>
        ) : null}
      </div>
    </div>
  );
};
