/**
 * @license Apache-2.0
 * Avenora — desktop customer portal sidebar navigation
 */

import React from 'react';
import type { PortalTabId } from '../../routing/appRoutes.ts';
import { useLocalization } from '../LocalizationContext.tsx';
import type { AuthUser } from '../AuthContext.tsx';
import { AvenoraLogo } from '../branding/AvenoraLogo.tsx';
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  ListOrdered,
  CreditCard,
  FileText,
  Award,
  ScrollText,
  UserCheck,
  KeyRound,
  HelpCircle,
  BookOpen,
  Calculator,
  Webhook,
  Activity,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

const STAFF_ROLES = new Set(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']);

interface PortalSidebarProps {
  activeTab: PortalTabId;
  onTabChange: (tab: PortalTabId) => void;
  user: AuthUser | null;
  onOpenAdmin?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

type NavItem = {
  id: PortalTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function kycSidebarHint(status: AuthUser['kycStatus'] | undefined): { title: string; body: string; cta: string } {
  switch (status) {
    case 'APPROVED':
      return {
        title: 'Identity verified',
        body: 'Your profile passed internal KYC review. Live settlement is not enabled in prototype mode.',
        cta: 'View verification',
      };
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
    case 'IN_PROGRESS':
      return {
        title: 'Verification in progress',
        body: 'We are reviewing your documents. You will be notified when the status changes.',
        cta: 'Track status',
      };
    case 'NEEDS_MORE_INFORMATION':
    case 'REJECTED':
      return {
        title: 'Action required',
        body: 'Additional information is needed to continue identity verification.',
        cta: 'Continue KYC',
      };
    default:
      return {
        title: 'Complete verification',
        body: 'Submit identity documents to unlock higher limits when available.',
        cta: 'Start verification',
      };
  }
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({
  activeTab,
  onTabChange,
  user,
  onOpenAdmin,
  mobileOpen = false,
  onMobileClose,
}) => {
  const { t } = useLocalization();
  const { tabs, metrics } = t;
  const isStaff = user?.role ? STAFF_ROLES.has(user.role) : false;

  const primaryItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'wallets', label: tabs.wallets.replace('Multicurrency ', ''), icon: Wallet },
    { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
    { id: 'transactions', label: 'Transactions', icon: ListOrdered },
    { id: 'cards', label: tabs.cards, icon: CreditCard },
    { id: 'loans', label: 'Loans', icon: FileText },
    { id: 'grants', label: 'Grants', icon: Award },
    { id: 'statements', label: 'Statements', icon: ScrollText },
    { id: 'kyc', label: 'Identity Verification', icon: UserCheck },
    { id: 'profile', label: 'Profile & Security', icon: KeyRound },
  ];

  const staffItems: NavItem[] = [
    { id: 'ledger', label: tabs.ledger, icon: BookOpen },
    { id: 'zerofloat', label: metrics.precisionEngine, icon: Calculator },
    { id: 'webhooks', label: tabs.webhooks, icon: Webhook },
    { id: 'health', label: tabs.health, icon: Activity },
    { id: 'security', label: tabs.security, icon: ShieldCheck },
  ];

  const kycHint = kycSidebarHint(user?.kycStatus);

  const navButtonClass = (selected: boolean) =>
    `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19A77A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
      selected
        ? 'bg-gradient-to-r from-[#075B46] to-[#063D32] text-white shadow-sm'
        : 'text-[#17231F] hover:bg-[#F1F4F1]'
    }`;

  const handleNav = (tab: PortalTabId) => {
    onTabChange(tab);
    onMobileClose?.();
  };

  return (
    <aside
      className={`flex flex-col w-[260px] shrink-0 bg-[#FAFAF7] border-r border-[#E2E8E4] z-50 ${
        mobileOpen
          ? 'fixed inset-y-0 left-0 shadow-2xl min-h-0'
          : 'hidden lg:flex lg:sticky lg:top-0 lg:self-start lg:h-[calc(100dvh-2.25rem)] lg:max-h-[calc(100dvh-2.25rem)]'
      }`}
      aria-label="Portal navigation"
    >
      <div className="px-5 pt-6 pb-4 border-b border-[#E2E8E4]/80">
        <div className="flex items-center gap-3">
          <AvenoraLogo size="sm" className="rounded-lg" />
          <div className="min-w-0">
            <p className="font-serif font-bold text-[#075B46] text-base leading-tight tracking-tight">Avenora</p>
            <p className="text-[11px] text-[#68746E] truncate">Customer banking</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" role="navigation">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const selected = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={navButtonClass(selected)}
              aria-current={selected ? 'page' : undefined}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 ${selected ? 'text-white' : 'text-[#68746E]'}`}
                aria-hidden
              />
              <span className="truncate text-left">{item.label}</span>
            </button>
          );
        })}

        {isStaff && (
          <div className="pt-4 mt-2 border-t border-[#E2E8E4] space-y-1">
            <p className="px-3.5 text-[10px] font-semibold uppercase tracking-wider text-[#68746E] mb-2">
              Operations
            </p>
            {staffItems.map((item) => {
              const Icon = item.icon;
              const selected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={navButtonClass(selected)}
                  aria-current={selected ? 'page' : undefined}
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${selected ? 'text-white' : 'text-[#68746E]'}`}
                    aria-hidden
                  />
                  <span className="truncate text-left">{item.label}</span>
                </button>
              );
            })}
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="w-full mt-2 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold bg-[#075B46] text-white hover:bg-[#063D32] transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C6A568]" aria-hidden />
                  Admin console
                </span>
                <ChevronRight className="w-4 h-4 opacity-80" aria-hidden />
              </button>
            )}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-[#E2E8E4]">
        <div className="rounded-2xl bg-gradient-to-br from-[#E8F6F2] to-white border border-[#19A77A]/20 p-4 space-y-2">
          <p className="text-xs font-semibold text-[#075B46]">{kycHint.title}</p>
          <p className="text-[11px] leading-relaxed text-[#68746E]">{kycHint.body}</p>
          <button
            type="button"
            onClick={() => handleNav('kyc')}
            className="text-[11px] font-semibold text-[#075B46] hover:text-[#063D32] flex items-center gap-1 cursor-pointer"
          >
            {kycHint.cta}
            <ChevronRight className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>
        <button
          type="button"
          onClick={() => handleNav('support')}
          className="mt-3 w-full flex items-center gap-2 px-2 py-1.5 text-[12px] font-medium text-[#68746E] hover:text-[#075B46] rounded-lg hover:bg-[#F1F4F1] cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" aria-hidden />
          {tabs.helpSupport}
        </button>
      </div>
    </aside>
  );
};
