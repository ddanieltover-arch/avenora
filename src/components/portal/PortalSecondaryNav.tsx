/**
 * @license Apache-2.0
 * Avenora — Customer portal secondary navigation (banking-style tab bar)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PortalTabId } from '../../routing/appRoutes.ts';
import { useLocalization } from '../LocalizationContext.tsx';
import type { AuthUser } from '../AuthContext.tsx';
import {
  Activity,
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  KeyRound,
  LayoutGrid,
  ShieldCheck,
  UserCheck,
  Webhook,
} from 'lucide-react';

interface PortalSecondaryNavProps {
  activeTab: PortalTabId;
  onTabChange: (tab: PortalTabId) => void;
  user: AuthUser | null;
}

type NavItem = {
  id: PortalTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STAFF_ROLES = new Set(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']);

export const PortalSecondaryNav: React.FC<PortalSecondaryNavProps> = ({
  activeTab,
  onTabChange,
  user,
}) => {
  const { t } = useLocalization();
  const { tabs, metrics } = t;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Banking sections (wallets, transfers, cards, etc.) live on Overview quick actions only.
  const primaryItems: NavItem[] = useMemo(
    () => [
      { id: 'overview', label: tabs.overview, icon: Activity },
      { id: 'kyc', label: tabs.kyc, icon: UserCheck },
      { id: 'profile', label: tabs.profile, icon: KeyRound },
      { id: 'support', label: tabs.helpSupport, icon: HelpCircle },
    ],
    [tabs],
  );

  const staffItems: NavItem[] = useMemo(
    () => [
      { id: 'ledger', label: tabs.ledger, icon: BookOpen },
      { id: 'zerofloat', label: metrics.precisionEngine, icon: Calculator },
      { id: 'webhooks', label: tabs.webhooks, icon: Webhook },
      { id: 'health', label: tabs.health, icon: Activity },
      { id: 'security', label: tabs.security, icon: ShieldCheck },
    ],
    [tabs, metrics],
  );

  const isStaff = user?.role ? STAFF_ROLES.has(user.role) : false;
  const moreActive = staffItems.some((item) => item.id === activeTab);

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollHints();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollHints);
    ro.observe(el);
    el.addEventListener('scroll', updateScrollHints, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', updateScrollHints);
    };
  }, [updateScrollHints, primaryItems.length, isStaff]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const tabClass = (selected: boolean) =>
    `relative shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-4 py-3.5 text-[13px] font-semibold tracking-tight whitespace-nowrap rounded-t-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076c64]/40 focus-visible:ring-offset-1 ${
      selected
        ? 'text-[#003933] bg-white shadow-[inset_0_-2px_0_0_#076c64]'
        : 'text-[#5c6f6c] hover:text-[#003933] hover:bg-white/60'
    }`;

  return (
    <nav
      className="bg-[#eef4f2] border-t border-slate-200/90"
      aria-label="Portal sections"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 relative flex items-stretch">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollBy(-220)}
            className="hidden sm:flex absolute left-0 z-10 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-[#076c64] hover:bg-[#f8fbf9] cursor-pointer"
            aria-label="Scroll navigation left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="portal-nav-scroll flex flex-1 items-stretch gap-0.5 overflow-x-auto min-h-[3rem] px-1 sm:px-6"
          role="tablist"
        >
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const selected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onTabChange(item.id)}
                className={tabClass(selected)}
              >
                <Icon className={`w-4 h-4 shrink-0 ${selected ? 'text-[#076c64]' : 'text-[#5c6f6c]'}`} aria-hidden />
                <span>{item.label}</span>
              </button>
            );
          })}

          {isStaff && (
            <div className="relative shrink-0 self-stretch flex items-stretch" ref={moreRef}>
              <button
                type="button"
                role="tab"
                aria-selected={moreActive}
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((open) => !open)}
                className={`${tabClass(moreActive)} pr-3`}
              >
                <LayoutGrid className={`w-4 h-4 shrink-0 ${moreActive ? 'text-[#076c64]' : 'text-[#5c6f6c]'}`} aria-hidden />
                <span>{tabs.architecture}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 opacity-70 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>

              {moreOpen && (
                <div
                  className="absolute right-0 top-full mt-1 min-w-[15rem] rounded-xl border border-slate-200 bg-white shadow-xl py-1.5 z-50 text-sm"
                  role="menu"
                >
                  {staffItems.map((item) => {
                    const Icon = item.icon;
                    const selected = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onTabChange(item.id);
                          setMoreOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-[#f8fbf9] cursor-pointer ${
                          selected ? 'text-[#076c64] font-semibold bg-brand-accent-light/40' : 'text-[#0f1f1e]'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" aria-hidden />
                        <span className="text-xs font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollBy(220)}
            className="hidden sm:flex absolute right-0 z-10 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-[#076c64] hover:bg-[#f8fbf9] cursor-pointer"
            aria-label="Scroll navigation right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="h-px bg-slate-200/90" aria-hidden />
    </nav>
  );
};
