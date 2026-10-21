/**
 * @license Apache-2.0
 * Mobile bottom navigation mapping for customer portal tabs.
 */

import type { PortalTabId } from '../../../routing/appRoutes.ts';

export type MobileNavId = 'home' | 'wallets' | 'activity' | 'cards' | 'profile';

export const MOBILE_NAV_PRIMARY_TAB: Record<MobileNavId, PortalTabId> = {
  home: 'overview',
  wallets: 'wallets',
  activity: 'transactions',
  cards: 'cards',
  profile: 'profile',
};

/** Highlight bottom nav item when viewing related portal routes. */
export function mobileNavActiveId(activeTab: PortalTabId): MobileNavId | null {
  switch (activeTab) {
    case 'overview':
      return 'home';
    case 'wallets':
    case 'transfers':
      return 'wallets';
    case 'transactions':
    case 'ledger':
      return 'activity';
    case 'cards':
      return 'cards';
    case 'profile':
    case 'kyc':
    case 'statements':
    case 'loans':
    case 'grants':
    case 'support':
    case 'security':
    case 'health':
    case 'webhooks':
    case 'zerofloat':
      return 'profile';
    default:
      return null;
  }
}
