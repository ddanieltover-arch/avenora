/**
 * @license Apache-2.0
 * Empty / idle state for admin lists and queues.
 */

import React from 'react';

interface AdminEmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  title,
  description,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-white/70">
    {icon ? <div className="mb-3 text-brand-muted">{icon}</div> : null}
    <p className="text-sm font-semibold text-brand-deep">{title}</p>
    {description ? (
      <p className="text-xs text-brand-muted mt-1 max-w-sm leading-relaxed">{description}</p>
    ) : null}
  </div>
);
