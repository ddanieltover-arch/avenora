/**
 * @license Apache-2.0
 * Admin console button primitive.
 */

import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type Size = 'sm' | 'md';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-brand-primary text-white hover:bg-brand-deep border border-transparent shadow-xs',
  secondary:
    'bg-white text-brand-dark border border-slate-200 hover:bg-brand-neutral',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 border border-transparent',
  ghost: 'bg-transparent text-brand-muted hover:bg-brand-neutral border border-transparent',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent',
};

const SIZE: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-[11px] rounded-lg',
  md: 'px-3.5 py-2 text-xs rounded-xl',
};

export const AdminButton: React.FC<AdminButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled,
  children,
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-1.5 font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    {...rest}
  >
    {children}
  </button>
);
