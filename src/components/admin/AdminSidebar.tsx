/**
 * @license Apache-2.0
 * Admin console sidebar navigation (desktop + mobile drawer).
 * Visual language aligned with the customer portal sidebar.
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
  onBackToPublic: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  mobileOpen,
  onMobileClose,
  onBackToPublic,
}) => {
  const handleNav = (tab: AdminTabId) => {
    onTabChange(tab);
    onMobileClose();
  };

  const navButtonClass = (selected: boolean) =>
    `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19A77A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
      selected
        ? 'bg-gradient-to-r from-[#075B46] to-[#063D32] text-white shadow-sm'
        : 'text-[#17231F] hover:bg-[#F1F4F1]'
    }`;

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 bg-[#0a1210]/40 z-40 lg:hidden cursor-default"
          aria-label="Close navigation overlay"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={`flex flex-col w-[260px] shrink-0 bg-[#FAFAF7] border-r border-[#E2E8E4] z-50 transition-transform duration-200 ease-out motion-reduce:transition-none ${
          mobileOpen
            ? 'fixed inset-y-0 left-0 shadow-2xl'
            : 'hidden lg:flex lg:sticky lg:top-0 lg:self-start lg:h-dvh lg:max-h-dvh'
        }`}
        aria-label="Admin navigation"
      >
        <div className="px-5 pt-6 pb-4 border-b border-[#E2E8E4]/80">
          <div className="flex items-center gap-3">
            <AvenoraLogo size="sm" className="rounded-lg" />
            <div className="min-w-0">
              <p className="font-serif font-bold text-[#075B46] text-base leading-tight tracking-tight">
                Avenora
              </p>
              <p className="text-[11px] text-[#68746E] truncate">Admin &amp; Ops</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" role="navigation">
          {ADMIN_LIVE_TABS.map((item) => {
            const Icon = item.icon;
            const selected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                aria-current={selected ? 'page' : undefined}
                className={navButtonClass(selected)}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${selected ? 'text-white' : 'text-[#68746E]'}`}
                  aria-hidden
                />
                <span className="truncate text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#E2E8E4]">
          <button
            type="button"
            onClick={onBackToPublic}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12px] font-medium text-[#68746E] hover:text-[#17231F] hover:bg-[#F1F4F1] cursor-pointer"
          >
            Public site
          </button>
        </div>
      </aside>
    </>
  );
};
