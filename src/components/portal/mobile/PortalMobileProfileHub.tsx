/**
 * @license Apache-2.0
 * Avenora — mobile profile & services hub
 */

import React from 'react';
import type { PortalTabId } from '../../../routing/appRoutes.ts';
import type { AuthUser } from '../../AuthContext.tsx';
import { useLocalization } from '../../LocalizationContext.tsx';
import { customerInitials } from '../../../lib/walletDisplay.ts';
import {
  Award,
  ChevronRight,
  FileText,
  Globe,
  HelpCircle,
  KeyRound,
  LogOut,
  ScrollText,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface PortalMobileProfileHubProps {
  user: AuthUser | null;
  onTabChange: (tab: PortalTabId) => void;
  onOpenSecurity: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
}

type HubItem = {
  id: string;
  label: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
};

export const PortalMobileProfileHub: React.FC<PortalMobileProfileHubProps> = ({
  user,
  onTabChange,
  onOpenSecurity,
  onOpenAdmin,
  onLogout,
}) => {
  const { t, locale, setLocale } = useLocalization();
  const isStaff = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');

  const items: HubItem[] = [
    {
      id: 'security',
      label: 'Account & security',
      sub: user?.mfaEnabled ? 'MFA enabled' : 'Enable MFA',
      icon: KeyRound,
      action: onOpenSecurity,
    },
    {
      id: 'kyc',
      label: t.tabs.kyc,
      sub: (user?.kycStatus || 'NOT_STARTED').replace(/_/g, ' '),
      icon: UserCheck,
      action: () => onTabChange('kyc'),
    },
    {
      id: 'statements',
      label: t.tabs.statements,
      icon: ScrollText,
      action: () => onTabChange('statements'),
    },
    {
      id: 'loans',
      label: t.tabs.loans,
      icon: FileText,
      action: () => onTabChange('loans'),
    },
    {
      id: 'grants',
      label: t.tabs.grants,
      icon: Award,
      action: () => onTabChange('grants'),
    },
    {
      id: 'support',
      label: t.tabs.helpSupport,
      icon: HelpCircle,
      action: () => onTabChange('support'),
    },
  ];

  if (isStaff && onOpenAdmin) {
    items.push({
      id: 'admin',
      label: 'Admin console',
      sub: 'Operations',
      icon: ShieldCheck,
      action: onOpenAdmin,
    });
  }

  return (
    <div className="max-w-lg mx-auto w-full space-y-4 pb-4">
      <div className="bg-white rounded-3xl border border-[#E2E8E4]/80 p-4 flex items-center gap-3 shadow-sm">
        <span
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#075B46] to-[#19A77A] text-white text-lg font-bold flex items-center justify-center shrink-0"
          aria-hidden
        >
          {customerInitials(user?.fullName)}
        </span>
        <div className="min-w-0">
          <p className="font-serif font-bold text-[#17231F] truncate">{user?.fullName}</p>
          <p className="text-xs text-[#68746E] truncate">{user?.email}</p>
          <p className="text-[10px] text-[#075B46] font-medium mt-1">
            {user?.status?.replace(/_/g, ' ') || 'ACTIVE'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E2E8E4]/80 overflow-hidden shadow-sm">
        <ul>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="border-b border-[#F1F4F1] last:border-0">
                <button
                  type="button"
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#F1F4F1]/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#19A77A]/40"
                >
                  <span className="w-9 h-9 rounded-xl bg-[#F1F4F1] flex items-center justify-center text-[#075B46] shrink-0">
                    <Icon className="w-4 h-4" aria-hidden />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-[#17231F]">{item.label}</span>
                    {item.sub && <span className="block text-[11px] text-[#68746E] truncate">{item.sub}</span>}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#68746E] shrink-0" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-white rounded-3xl border border-[#E2E8E4]/80 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-[#075B46]" aria-hidden />
          <p className="text-sm font-semibold text-[#17231F]">Language</p>
        </div>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as typeof locale)}
          className="w-full h-11 rounded-xl border border-[#E2E8E4] bg-[#FAFAF7] px-3 text-sm text-[#17231F]"
          aria-label="Language preference"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="pt-BR">Português (Brasil)</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-rose-200 bg-white text-sm font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60"
      >
        <LogOut className="w-4 h-4" aria-hidden />
        Sign out
      </button>
    </div>
  );
};
