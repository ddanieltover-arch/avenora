/**
 * @license Apache-2.0
 * Admin console top bar with persona menu and refresh.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, RefreshCw, User } from 'lucide-react';
import type { AuthUser } from '../AuthContext.tsx';
import type { AdminTabId } from '../../routing/appRoutes.ts';
import { AdminBadge, badgeToneForStatus } from './ui/AdminBadge.tsx';
import { AdminButton } from './ui/AdminButton.tsx';
import { ADMIN_LIVE_TABS } from './AdminSidebar.tsx';

interface AdminTopbarProps {
  user: AuthUser;
  activeTab: AdminTabId;
  loading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onOpenMobileNav: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  user,
  activeTab,
  loading,
  onRefresh,
  onLogout,
  onOpenMobileNav,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tabMeta = ADMIN_LIVE_TABS.find((t) => t.id === activeTab);
  const title = tabMeta?.label || 'Operations';

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  return (
    <header className="shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg border border-slate-200 text-brand-deep hover:bg-brand-neutral cursor-pointer"
            onClick={onOpenMobileNav}
            aria-label="Open navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
              Operations console
            </p>
            <h1 className="font-serif font-bold text-base text-brand-deep truncate leading-tight">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh current view"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </AdminButton>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-brand-warm cursor-pointer"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="w-7 h-7 rounded-lg bg-brand-accent-light text-brand-deep flex items-center justify-center">
                <User className="w-3.5 h-3.5" aria-hidden />
              </span>
              <span className="hidden sm:flex flex-col items-start min-w-0">
                <span className="text-[11px] font-semibold text-brand-deep truncate max-w-[140px]">
                  {user.fullName}
                </span>
                <AdminBadge tone={badgeToneForStatus(user.role)}>{user.role}</AdminBadge>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-brand-muted" aria-hidden />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 z-40"
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-brand-deep truncate">{user.fullName}</p>
                  <p className="text-[11px] text-brand-muted truncate">{user.email}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
