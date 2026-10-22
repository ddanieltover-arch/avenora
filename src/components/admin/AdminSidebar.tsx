/**
 * @license Apache-2.0
 * Admin console sidebar navigation (desktop + mobile drawer).
 */

import React from 'react';
import {
  Activity,
  Users,
  FileCheck,
  Search,
  CreditCard,
  History,
  Award,
  ArrowLeft,
} from 'lucide-react';
import type { AdminTabId } from '../../routing/appRoutes.ts';
import { AvenoraLogo } from '../branding/AvenoraLogo.tsx';

export const ADMIN_LIVE_TABS: {
  id: Exclude<AdminTabId, 'webhooks' | 'readiness'>;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'kyc', label: 'KYC Queue', icon: FileCheck },
  { id: 'transactions', label: 'Transactions', icon: Search },
  { id: 'loans_grants', label: 'Loans & Grants', icon: Award },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'audit', label: 'Audit Trail', icon: History },
];

interface AdminSidebarProps {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onBackToPortal: () => void;
  onBackToPublic: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  mobileOpen,
  onMobileClose,
  onBackToPortal,
  onBackToPublic,
}) => {
  const handleNav = (tab: AdminTabId) => {
    onTabChange(tab);
    onMobileClose();
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 bg-brand-dark/40 z-40 lg:hidden cursor-default"
          aria-label="Close navigation overlay"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={`flex flex-col w-[248px] shrink-0 bg-brand-deep text-white z-50 transition-transform duration-200 ease-out motion-reduce:transition-none ${
          mobileOpen
            ? 'fixed inset-y-0 left-0 shadow-2xl'
            : 'hidden lg:flex lg:sticky lg:top-0 lg:self-start lg:h-dvh lg:max-h-dvh'
        }`}
        aria-label="Admin navigation"
      >
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <AvenoraLogo size="sm" className="rounded-lg bg-white/95 p-0.5" />
            <div className="min-w-0">
              <p className="font-serif font-bold text-sm tracking-tight leading-tight">Avenora</p>
              <p className="text-[10px] text-emerald-300/90 font-medium uppercase tracking-wider">
                Admin & Ops
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-0.5" role="navigation">
          {ADMIN_LIVE_TABS.map((item) => {
            const Icon = item.icon;
            const selected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                aria-current={selected ? 'page' : undefined}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 ${
                  selected
                    ? 'bg-white/12 text-white'
                    : 'text-white/70 hover:bg-white/8 hover:text-white'
                }`}
              >
                {selected ? (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r bg-brand-accent"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className={`w-[17px] h-[17px] shrink-0 ${selected ? 'text-brand-accent' : 'text-white/55'}`}
                  aria-hidden
                />
                <span className="truncate text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            type="button"
            onClick={onBackToPortal}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/8 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
            Customer portal
          </button>
          <button
            type="button"
            onClick={onBackToPublic}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-white/50 hover:text-white hover:bg-white/8 cursor-pointer"
          >
            Public site
          </button>
        </div>
      </aside>
    </>
  );
};
