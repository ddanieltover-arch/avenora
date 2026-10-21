/**
 * @license Apache-2.0
 * Avenora — mobile customer portal bottom navigation
 */

import React from 'react';
import { Home, Wallet, ListOrdered, CreditCard, User } from 'lucide-react';
import type { PortalTabId } from '../../../routing/appRoutes.ts';
import { useLocalization } from '../../LocalizationContext.tsx';
import {
  MOBILE_NAV_PRIMARY_TAB,
  mobileNavActiveId,
  type MobileNavId,
} from './portalMobileNav.ts';

interface PortalBottomNavProps {
  activeTab: PortalTabId;
  onTabChange: (tab: PortalTabId) => void;
}

const ITEMS: { id: MobileNavId; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', icon: Home },
  { id: 'wallets', icon: Wallet },
  { id: 'activity', icon: ListOrdered },
  { id: 'cards', icon: CreditCard },
  { id: 'profile', icon: User },
];

export const PortalBottomNav: React.FC<PortalBottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLocalization();
  const selected = mobileNavActiveId(activeTab);

  const labels: Record<MobileNavId, string> = {
    home: t.tabs.overview,
    wallets: 'Wallets',
    activity: 'Activity',
    cards: t.tabs.cards.replace('Payment ', ''),
    profile: 'Profile',
  };

  return (
    <nav
      className="portal-bottom-nav fixed bottom-0 inset-x-0 z-40 bg-[#FAFAF7]/95 backdrop-blur-md border-t border-[#E2E8E4] lg:hidden"
      aria-label="Main navigation"
    >
      <ul className="flex items-stretch justify-around max-w-lg mx-auto px-1 pt-1.5 pb-1.5">
        {ITEMS.map(({ id, icon: Icon }) => {
          const isActive = selected === id;
          return (
            <li key={id} className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onTabChange(MOBILE_NAV_PRIMARY_TAB[id])}
                className={`w-full flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19A77A]/50 ${
                  isActive ? 'text-[#075B46]' : 'text-[#68746E]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? 'text-[#075B46]' : 'text-[#68746E]'}`}
                  strokeWidth={isActive ? 2.25 : 2}
                  aria-hidden
                />
                <span className={`text-[10px] font-semibold truncate max-w-full ${isActive ? 'text-[#075B46]' : ''}`}>
                  {labels[id]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
