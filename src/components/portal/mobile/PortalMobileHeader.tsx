/**
 * @license Apache-2.0
 * Avenora — compact mobile portal header
 */

import React from 'react';
import type { PortalTabId } from '../../../routing/appRoutes.ts';
import type { AuthUser } from '../../AuthContext.tsx';
import { AvenoraLogo } from '../../branding/AvenoraLogo.tsx';
import { customerGreetingName, customerInitials, timeOfDayGreeting } from '../../../lib/walletDisplay.ts';

interface PortalMobileHeaderProps {
  user: AuthUser | null;
  activeTab: PortalTabId;
  onOpenProfile: () => void;
}

function mobileScreenTitle(tab: PortalTabId): string | null {
  switch (tab) {
    case 'overview':
      return null;
    case 'wallets':
      return 'Wallets';
    case 'transfers':
      return 'Transfers';
    case 'transactions':
      return 'Activity';
    case 'cards':
      return 'Cards';
    case 'statements':
      return 'Statements';
    case 'kyc':
      return 'Verification';
    case 'loans':
      return 'Loans';
    case 'grants':
      return 'Grants';
    case 'profile':
      return 'Profile';
    case 'support':
      return 'Help';
    default:
      return 'Avenora';
  }
}

export const PortalMobileHeader: React.FC<PortalMobileHeaderProps> = ({
  user,
  activeTab,
  onOpenProfile,
}) => {
  const title = mobileScreenTitle(activeTab);
  const greeting = timeOfDayGreeting();
  const greetingName = customerGreetingName(user?.fullName);

  return (
    <header
      className="shrink-0 z-30 bg-[#F1F4F1]/95 backdrop-blur-sm border-b border-[#E2E8E4]/80 pt-[max(0.5rem,env(safe-area-inset-top))] px-4 pb-3 lg:hidden"
    >
      {title ? (
        <div className="flex items-center justify-between gap-3 h-11">
          <div className="flex items-center gap-2 min-w-0">
            <AvenoraLogo size="xs" className="rounded-md" />
            <h1 className="font-serif font-bold text-[#17231F] text-lg truncate">{title}</h1>
          </div>
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#075B46] to-[#19A77A] text-white text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#19A77A]/50"
            aria-label="Open profile"
          >
            {customerInitials(user?.fullName)}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AvenoraLogo size="sm" className="rounded-lg shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-[#68746E] font-medium">
                {greeting}, {greetingName}
              </p>
              <p className="font-serif font-bold text-[#17231F] text-base truncate leading-tight">
                {user?.fullName || 'Customer'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#075B46] to-[#19A77A] text-white text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#19A77A]/50"
            aria-label="Open profile"
          >
            {customerInitials(user?.fullName)}
          </button>
        </div>
      )}
    </header>
  );
};
