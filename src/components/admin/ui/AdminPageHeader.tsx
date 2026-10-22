/**
 * @license Apache-2.0
 * Admin page title row with optional actions.
 */

import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  subtitle,
  actions,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
    <div className="min-w-0">
      <h2 className="font-serif font-bold text-xl text-brand-deep tracking-tight">{title}</h2>
      {subtitle ? (
        <p className="text-xs text-brand-muted mt-1 max-w-2xl leading-relaxed">{subtitle}</p>
      ) : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
  </div>
);
