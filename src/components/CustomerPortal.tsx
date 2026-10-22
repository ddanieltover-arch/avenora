/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Authenticated Customer Portal
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCustomerWalletScope } from '../hooks/useCustomerWalletScope.ts';
import { usePortalDashboardData } from '../hooks/usePortalDashboardData.ts';
import {
  formatMajorBalance,
  portfolioHoldMajor,
  portfolioValueMajor,
} from '../lib/illustrativeFx.ts';
import { useLocalization } from './LocalizationContext.tsx';
import { useAuth } from './AuthContext.tsx';
import { WalletView, type WalletDeepLinkModal } from './WalletView.tsx';
import { CardManagementView } from './CardManagementView.tsx';
import { LoanManagementView } from './LoanManagementView.tsx';
import { GrantManagementView } from './GrantManagementView.tsx';
import { KycVerificationView } from './KycVerificationView.tsx';
import { LedgerExplorer } from './LedgerExplorer.tsx';
import { ZeroFloatDemo } from './ZeroFloatDemo.tsx';
import { WebhookConsole } from './WebhookConsole.tsx';
import { HealthStatusCard } from './HealthStatusCard.tsx';
import { SecurityCompliance } from './SecurityCompliance.tsx';
import { TransactionsView } from './TransactionsView.tsx';
import { StatementsView } from './StatementsView.tsx';
import { ProfileSecurityView } from './ProfileSecurityView.tsx';
import { HelpSupportView } from './HelpSupportView.tsx';
import { Lock, ShieldCheck, ChevronLeft } from 'lucide-react';
import type { PortalTabId } from '../routing/appRoutes.ts';
import { PortalSidebar } from './portal/PortalSidebar.tsx';
import { PortalTopHeader } from './portal/PortalTopHeader.tsx';
import { DashboardOverview } from './portal/DashboardOverview.tsx';
import { AccountSuspendedBanner } from './portal/AccountSuspendedBanner.tsx';
import { AccountPendingVerificationBanner } from './portal/AccountPendingVerificationBanner.tsx';
import { AccountLockedModal } from './portal/AccountLockedModal.tsx';
import { PortalBottomNav } from './portal/mobile/PortalBottomNav.tsx';
import { PortalMobileHeader } from './portal/mobile/PortalMobileHeader.tsx';
import { DashboardMobileHome } from './portal/mobile/DashboardMobileHome.tsx';
import { MobileActivityScreen } from './portal/mobile/MobileActivityScreen.tsx';
import { PortalMobileProfileHub } from './portal/mobile/PortalMobileProfileHub.tsx';

interface CustomerPortalProps {
  activeTab: PortalTabId;
  onTabChange: (tab: PortalTabId) => void;
  onOpenAdmin?: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ activeTab, onTabChange, onOpenAdmin }) => {
  const { t } = useLocalization();
  const { user, token, logout, refreshUser } = useAuth();
  const { primaryFiat, walletCurrencyCodes } = useCustomerWalletScope();
  const [pendingTxSearch, setPendingTxSearch] = useState<string | null>(null);
  const [pendingWalletModal, setPendingWalletModal] = useState<WalletDeepLinkModal | null>(null);
  const [mobileProfileSecurity, setMobileProfileSecurity] = useState(false);
  const mobileMainRef = useRef<HTMLElement>(null);
  const isSuspended = user?.status === 'SUSPENDED';
  const isLocked = user?.status === 'LOCKED';
  const isPendingVerification =
    !isSuspended &&
    !isLocked &&
    (user?.status === 'PENDING_VERIFICATION' ||
      (user?.role === 'CUSTOMER' && user?.kycStatus !== 'APPROVED'));

  const {
    walletsSummary,
    cardsSummary,
    loansSummary,
    grantsSummary,
    transactions,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = usePortalDashboardData({
    token,
    walletCurrencyCodes,
    userId: user?.id,
  });

  useEffect(() => {
    if (activeTab !== 'profile') {
      setMobileProfileSecurity(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'transfers') {
      onTabChange('wallets');
    }
  }, [activeTab, onTabChange]);

  // Keep account status current so suspend/lock notices appear without a full re-login.
  useEffect(() => {
    if (!token) return;
    void refreshUser();
    const id = window.setInterval(() => {
      void refreshUser();
    }, 20_000);
    const onFocus = () => {
      void refreshUser();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [token, refreshUser]);

  useEffect(() => {
    if (activeTab === 'overview' && token) {
      refetchDashboard();
    }
  }, [activeTab, token, refetchDashboard]);

  useEffect(() => {
    mobileMainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  const primaryPortfolioMajor = useMemo(
    () => portfolioValueMajor(walletsSummary, primaryFiat),
    [walletsSummary, primaryFiat],
  );
  const primaryPortfolioBtcMajor = useMemo(
    () => portfolioValueMajor(walletsSummary, 'BTC'),
    [walletsSummary],
  );
  const primaryHoldMajor = useMemo(
    () => portfolioHoldMajor(walletsSummary, primaryFiat),
    [walletsSummary, primaryFiat],
  );
  const primaryFiatBalanceDisplay =
    walletsSummary.length === 0 ? '—' : formatMajorBalance(primaryPortfolioMajor, primaryFiat);
  const primaryFiatBtcEquivalentDisplay = formatMajorBalance(primaryPortfolioBtcMajor, 'BTC');
  const primaryFiatHoldDisplay =
    primaryHoldMajor > 0 ? formatMajorBalance(primaryHoldMajor, primaryFiat) : null;
  const primaryFiatHasHold = primaryHoldMajor > 0;

  const handleTransactionSearch = (query: string) => {
    setPendingTxSearch(query);
  };

  const openWalletDeepLink = (modal: WalletDeepLinkModal) => {
    if (isPendingVerification || isSuspended || isLocked) {
      if (isPendingVerification) onTabChange('kyc');
      else onTabChange('wallets');
      return;
    }
    setPendingWalletModal(modal);
    onTabChange('wallets');
  };

  const walletViewProps = {
    initialModal: pendingWalletModal,
    onInitialModalConsumed: () => setPendingWalletModal(null),
    onWalletActivity: refetchDashboard,
  };

  const dashboardProps = {
    user,
    primaryFiat,
    primaryFiatBalanceDisplay,
    primaryFiatBtcEquivalentDisplay,
    primaryFiatHoldDisplay,
    primaryFiatHasHold,
    walletsSummary,
    cardsSummary,
    loansCount: loansSummary.length,
    grantsCount: grantsSummary.length,
    transactions,
    loading: dashboardLoading,
    error: dashboardError,
    onRetry: refetchDashboard,
    onTabChange,
    onOpenWalletModal: openWalletDeepLink,
  };

  const renderDesktopTab = () => (
    <>
      {activeTab === 'overview' && <DashboardOverview {...dashboardProps} />}
      {activeTab === 'wallets' && <WalletView {...walletViewProps} />}
      {activeTab === 'transactions' && (
        <TransactionsView
          initialSearchQuery={pendingTxSearch}
          onInitialSearchConsumed={() => setPendingTxSearch(null)}
        />
      )}
      {activeTab === 'cards' && <CardManagementView />}
      {activeTab === 'loans' && <LoanManagementView />}
      {activeTab === 'grants' && <GrantManagementView />}
      {activeTab === 'statements' && <StatementsView />}
      {activeTab === 'kyc' && <KycVerificationView />}
      {activeTab === 'profile' && <ProfileSecurityView onNavigateToKyc={() => onTabChange('kyc')} />}
      {activeTab === 'ledger' && <LedgerExplorer />}
      {activeTab === 'zerofloat' && <ZeroFloatDemo />}
      {activeTab === 'webhooks' && <WebhookConsole />}
      {activeTab === 'health' && <HealthStatusCard />}
      {activeTab === 'security' && <SecurityCompliance />}
      {activeTab === 'support' && <HelpSupportView />}
    </>
  );

  const renderMobileTab = () => (
    <div className="portal-mobile-narrow portal-page-stack max-w-lg mx-auto w-full">
      {activeTab === 'overview' && <DashboardMobileHome {...dashboardProps} />}
      {activeTab === 'wallets' && <WalletView {...walletViewProps} />}
      {activeTab === 'transactions' && (
        <MobileActivityScreen
          transactions={transactions}
          transactionsLoading={dashboardLoading}
          initialSearchQuery={pendingTxSearch}
          onInitialSearchConsumed={() => setPendingTxSearch(null)}
        />
      )}
      {activeTab === 'cards' && <CardManagementView />}
      {activeTab === 'loans' && <LoanManagementView />}
      {activeTab === 'grants' && <GrantManagementView />}
      {activeTab === 'statements' && <StatementsView />}
      {activeTab === 'kyc' && <KycVerificationView />}
      {activeTab === 'profile' && (
        <>
          {mobileProfileSecurity ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setMobileProfileSecurity(false)}
                className="flex items-center gap-1 text-xs font-semibold text-[#075B46] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden />
                Back to profile
              </button>
              <ProfileSecurityView onNavigateToKyc={() => onTabChange('kyc')} />
            </div>
          ) : (
            <PortalMobileProfileHub
              user={user}
              onTabChange={onTabChange}
              onOpenSecurity={() => setMobileProfileSecurity(true)}
              onOpenAdmin={onOpenAdmin}
              onLogout={logout}
            />
          )}
        </>
      )}
      {activeTab === 'ledger' && <LedgerExplorer />}
      {activeTab === 'zerofloat' && <ZeroFloatDemo />}
      {activeTab === 'webhooks' && <WebhookConsole />}
      {activeTab === 'health' && <HealthStatusCard />}
      {activeTab === 'security' && <SecurityCompliance />}
      {activeTab === 'support' && <HelpSupportView />}
    </div>
  );

  return (
    <div
      className="app-viewport-shell bg-[#F1F4F1] text-[#17231F] font-sans"
      data-account-status={user?.status || 'ACTIVE'}
    >
      {isLocked && <AccountLockedModal onLogout={logout} />}

      <div className={`flex flex-col flex-1 min-h-0 ${isLocked ? 'blur-sm brightness-75 select-none pointer-events-none' : ''}`}>
      <div className="bg-[#063D32] text-emerald-50 text-[10px] sm:text-[11px] py-1 sm:py-1.5 px-4 font-medium tracking-wide shrink-0">
        <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-2 truncate">
            <Lock className="w-3.5 h-3.5 text-[#19A77A] shrink-0" aria-hidden />
            <span className="truncate">{t.bankingDisclaimer}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0 text-emerald-200/90">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
            <span>{t.prototypeNotice}</span>
          </div>
        </div>
      </div>

      {isSuspended && <AccountSuspendedBanner />}
      {isPendingVerification && (
        <AccountPendingVerificationBanner
          kycStatus={user?.kycStatus}
          onOpenKyc={() => onTabChange('kyc')}
        />
      )}

      {/* Desktop layout (unchanged) */}
      <div className="hidden lg:flex flex-1 min-h-0 max-w-[1600px] mx-auto w-full overflow-hidden">
        <PortalSidebar activeTab={activeTab} onTabChange={onTabChange} user={user} onOpenAdmin={onOpenAdmin} />

        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <PortalTopHeader
            user={user}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onLogout={logout}
            onTransactionSearch={handleTransactionSearch}
          />

          <main className="app-scroll-pane px-4 sm:px-6 lg:px-8 py-6 lg:py-8 w-full">{renderDesktopTab()}</main>

          <footer className="border-t border-[#E2E8E4] bg-white py-4 text-xs text-[#68746E] shrink-0">
            <div className="px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Avenora · Prototype customer banking environment</span>
              <span className="text-[11px] text-[#075B46] font-medium">Session authenticated · Simulated funds only</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="portal-mobile-shell lg:hidden w-full max-w-[1600px] mx-auto">
        <PortalMobileHeader
          user={user}
          activeTab={activeTab}
          onOpenProfile={() => onTabChange('profile')}
        />

        <main
          ref={mobileMainRef}
          className="app-scroll-pane px-4 py-4 portal-mobile-main w-full min-h-0"
        >
          {renderMobileTab()}
          <div className="portal-mobile-scroll-end" aria-hidden />
        </main>
      </div>

      <PortalBottomNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
};
