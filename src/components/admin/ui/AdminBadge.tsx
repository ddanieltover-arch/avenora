/**
 * @license Apache-2.0
 * Admin status / role / origin badge.
 */

import React from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'gold';

interface AdminBadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}

const TONE: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
  danger: 'bg-rose-50 text-rose-800 border-rose-200',
  info: 'bg-sky-50 text-sky-800 border-sky-200',
  brand: 'bg-brand-accent-light text-brand-deep border-brand-primary/20',
  gold: 'bg-[#f7f1e4] text-[#7a5c28] border-brand-gold/40',
};

export function badgeToneForStatus(status?: string): Tone {
  const s = (status || '').toUpperCase();
  if (['ACTIVE', 'APPROVED', 'POSTED', 'VERIFIED', 'ACTIVE_SIMULATED'].includes(s)) return 'success';
  if (['PENDING', 'PENDING_REVIEW', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'SUBMITTED', 'IN_PROGRESS'].includes(s))
    return 'warning';
  if (['REJECTED', 'SUSPENDED', 'LOCKED', 'FROZEN', 'TERMINATED', 'DECLINED'].includes(s)) return 'danger';
  if (['SUPER_ADMIN', 'ADMIN'].includes(s)) return 'brand';
  if (['SUPPORT', 'COMPLIANCE_REVIEWER'].includes(s)) return 'info';
  return 'neutral';
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({
  children,
  tone = 'neutral',
  className = '',
}) => (
  <span
    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${TONE[tone]} ${className}`}
  >
    {children}
  </span>
);
