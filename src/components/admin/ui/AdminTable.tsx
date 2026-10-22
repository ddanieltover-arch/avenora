/**
 * @license Apache-2.0
 * Admin data table primitives.
 */

import React from 'react';

interface AdminTableProps {
  children: React.ReactNode;
  className?: string;
}

export const AdminTable: React.FC<AdminTableProps> = ({ children, className = '' }) => (
  <div className={`overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>
    <table className="w-full text-left text-xs">{children}</table>
  </div>
);

export const AdminTableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-brand-neutral border-b border-slate-200 text-brand-deep font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10">
    {children}
  </thead>
);

export const AdminTh: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <th className={`py-2.5 px-3 whitespace-nowrap ${className}`} {...rest}>
    {children}
  </th>
);

export const AdminTableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-slate-100">{children}</tbody>
);

export const AdminTr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <tr className={`hover:bg-brand-warm/80 transition-colors ${className}`} {...rest}>
    {children}
  </tr>
);

export const AdminTd: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <td className={`py-2.5 px-3 align-middle ${className}`} {...rest}>
    {children}
  </td>
);
