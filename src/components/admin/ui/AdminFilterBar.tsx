/**
 * @license Apache-2.0
 * Filter / search toolbar for admin tables.
 */

import React from 'react';

interface AdminFilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export const AdminFilterBar: React.FC<AdminFilterBarProps> = ({
  children,
  className = '',
}) => (
  <div
    className={`flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white shadow-xs ${className}`}
  >
    {children}
  </div>
);

export const adminInputClass =
  'px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-brand-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-primary';

export const adminSelectClass = `${adminInputClass} cursor-pointer`;
