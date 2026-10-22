/**
 * @license Apache-2.0
 * Avenora — customer portal top header (search, profile)
 */

import React, { FormEvent, useEffect, useRef, useState } from 'react';
import type { PortalTabId } from '../../routing/appRoutes.ts';
import type { AuthUser } from '../AuthContext.tsx';
import { customerInitials } from '../../lib/walletDisplay.ts';
import { Search, ChevronDown, KeyRound, HelpCircle, Lock, Menu } from 'lucide-react';

interface PortalTopHeaderProps {
  user: AuthUser | null;
  activeTab: PortalTabId;
  onTabChange: (tab: PortalTabId) => void;
  onLogout: () => void;
  onTransactionSearch: (query: string) => void;
  onToggleMobileNav?: () => void;
}

export const PortalTopHeader: React.FC<PortalTopHeaderProps> = ({
  user,
  activeTab,
  onTabChange,
  onLogout,
  onTransactionSearch,
  onToggleMobileNav,
}) => {
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = search.trim();
    if (!q) return;
    onTransactionSearch(q);
    onTabChange('transactions');
  };

  const displayName =
    user?.fullName?.trim() ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Account';
  const avatarLabel = customerInitials(user?.fullName?.trim() || displayName);

  const pageTitle = (() => {
    switch (activeTab) {
      case 'overview':
        return 'Overview';
      case 'wallets':
        return 'Wallets';
      case 'transfers':
        return 'Transfers';
      case 'transactions':
        return 'Transactions';
      case 'cards':
        return 'Payment cards';
      case 'loans':
        return 'Loans';
      case 'grants':
        return 'Grants';
      case 'statements':
        return 'Statements';
      case 'kyc':
        return 'Identity verification';
      case 'profile':
        return 'Profile & security';
      case 'support':
        return 'Help & support';
      default:
        return 'Customer portal';
    }
  })();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#E2E8E4]">
      <div className="h-[76px] px-4 sm:px-6 lg:px-8 flex items-center gap-4">
        {onToggleMobileNav && (
          <button
            type="button"
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-[#E2E8E4] text-[#075B46] hover:bg-[#F1F4F1] cursor-pointer"
            onClick={onToggleMobileNav}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="hidden sm:block min-w-[8rem]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#68746E]">Dashboard</p>
          <h1 className="text-lg font-serif font-bold text-[#17231F] leading-tight">{pageTitle}</h1>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto hidden md:block">
          <label className="sr-only" htmlFor="portal-global-search">Search transactions</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68746E]" aria-hidden />
            <input
              id="portal-global-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions by reference, narration, or counterparty…"
              className="w-full h-11 pl-11 pr-4 rounded-2xl bg-[#F1F4F1] border border-transparent focus:border-[#19A77A]/40 focus:bg-white text-sm text-[#17231F] placeholder:text-[#68746E]/80 outline-none focus-visible:ring-2 focus-visible:ring-[#19A77A]/30"
            />
          </div>
        </form>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl hover:bg-[#F1F4F1] border border-transparent hover:border-[#E2E8E4] transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19A77A]/40"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#075B46] to-[#19A77A] text-white text-xs font-bold flex items-center justify-center"
              aria-hidden
            >
              {avatarLabel}
            </span>
            <span className="hidden sm:block text-left max-w-[10rem]">
              <span className="block text-sm font-semibold text-[#17231F] truncate">{displayName}</span>
              <span className="block text-[10px] text-[#68746E] truncate">{user?.email}</span>
            </span>
            <ChevronDown className="w-4 h-4 text-[#68746E] hidden sm:block" aria-hidden />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#E2E8E4] shadow-xl p-2 z-50 text-xs"
              role="menu"
            >
              <div className="px-2.5 py-2 border-b border-[#E2E8E4] mb-1">
                <span className="font-semibold text-[#17231F] block truncate">{displayName}</span>
                <span className="text-[10px] text-[#68746E] truncate block">{user?.email}</span>
                {user?.status && (
                  <span className="mt-1 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F1F4F1] text-[#68746E]">
                    Account: {user.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onTabChange('profile');
                  setMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F1F4F1] text-[#17231F] flex items-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#075B46]" aria-hidden />
                Security & MFA
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onTabChange('support');
                  setMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F1F4F1] text-[#17231F] flex items-center gap-2 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#075B46]" aria-hidden />
                Help & support
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onLogout();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-rose-50 text-rose-700 flex items-center gap-2 cursor-pointer font-semibold"
              >
                <Lock className="w-3.5 h-3.5" aria-hidden />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68746E]" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="w-full h-10 pl-10 pr-3 rounded-xl bg-[#F1F4F1] text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#19A77A]/30"
            aria-label="Search transactions"
          />
        </div>
      </form>
    </header>
  );
};
