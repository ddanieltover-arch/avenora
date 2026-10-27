/**
 * @license Apache-2.0
 * Mobile admin bottom navigation — mirrors customer portal PortalBottomNav.
 */

import React from 'react';
import { Activity, Users, FileCheck, Search, History } from 'lucide-react';
import type { AdminTabId } from '../../routing/appRoutes.ts';

interface AdminBottomNavProps {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
}

const ITEMS: {
  id: Exclude<AdminTabId, 'webhooks' | 'readiness' | 'loans_grants' | 'cards'>;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'kyc', label: 'KYC', icon: FileCheck },
  { id: 'transactions', label: 'Txns', icon: Search },
  { id: 'audit', label: 'Audit', icon: History },
];

function isBottomNavActive(
  activeTab: AdminTabId,
  id: (typeof ITEMS)[number]['id'],
): boolean {
  if (activeTab === id) return true;
  // Map secondary tabs onto closest bottom item
  if (id === 'transactions' && (activeTab === 'loans_grants' || activeTab === 'cards')) {
    return true;
  }
  return false;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      className="portal-bottom-nav fixed bottom-0 inset-x-0 z-40 bg-[#FAFAF7]/95 backdrop-blur-md border-t border-[#E2E8E4] lg:hidden"
      aria-label="Admin main navigation"
    >
      <ul className="flex items-stretch justify-around max-w-lg mx-auto px-1 pt-1.5 pb-1.5">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = isBottomNavActive(activeTab, id);
          return (
            <li key={id} className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onTabChange(id)}
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
                <span
                  className={`text-[10px] font-semibold truncate max-w-full ${isActive ? 'text-[#075B46]' : ''}`}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
