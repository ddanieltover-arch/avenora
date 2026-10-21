/**
 * @license Apache-2.0
 * Avenora — mobile home dashboard
 */

import React, { useMemo, useState } from 'react';
import type { PortalTabId } from '../../../routing/appRoutes.ts';
import type { AuthUser } from '../../AuthContext.tsx';
import {
  customerGreetingName,
  formatWalletAccountBalance,
  formatWalletAccountHold,
  timeOfDayGreeting,
  walletHoldMinorPositive,
} from '../../../lib/walletDisplay.ts';
import { formatOperationTypeLabel } from '../../../lib/operationDisplay.ts';
import type { PortalCardSummary, PortalTransactionSummary } from '../../../hooks/usePortalDashboardData.ts';
import type { WalletAccountLike } from '../../../hooks/useCustomerWalletScope.ts';
import { DomesticBankAccountCard } from '../DomesticBankAccountCard.tsx';
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  Printer,
  RefreshCw,
  ShieldCheck,
  Wallet,
  CreditCard,
  FileText,
} from 'lucide-react';

interface DashboardMobileHomeProps {
  user: AuthUser | null;
  primaryFiat: string;
  primaryFiatBalanceDisplay: string;
  primaryFiatBtcEquivalentDisplay: string;
  primaryFiatHoldDisplay: string | null;
  primaryFiatHasHold: boolean;
  walletsSummary: WalletAccountLike[];
  cardsSummary: PortalCardSummary[];
  loansCount: number;
  grantsCount: number;
  transactions: PortalTransactionSummary[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onTabChange: (tab: PortalTabId) => void;
}

function txDirection(tx: PortalTransactionSummary): 'in' | 'out' {
  if (
    tx.direction === 'CREDIT' ||
    tx.operationType === 'SIMULATED_DEPOSIT' ||
    tx.operationType === 'GRANT_DISBURSEMENT'
  ) {
    return 'in';
  }
  return 'out';
}

export const DashboardMobileHome: React.FC<DashboardMobileHomeProps> = ({
  user,
  primaryFiat,
  primaryFiatBalanceDisplay,
  primaryFiatBtcEquivalentDisplay,
  primaryFiatHoldDisplay,
  primaryFiatHasHold,
  walletsSummary,
  cardsSummary,
  loansCount,
  grantsCount,
  transactions,
  loading,
  error,
  onRetry,
  onTabChange,
}) => {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const greeting = timeOfDayGreeting();

  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5),
    [transactions],
  );

  const quickActions = [
    { label: 'Transfer', icon: ArrowRightLeft, tab: 'transfers' as PortalTabId, tint: 'bg-[#E8F6F2] text-[#075B46]' },
    { label: 'Exchange', icon: Globe, tab: 'wallets' as PortalTabId, tint: 'bg-teal-50 text-teal-800' },
    { label: 'Wallets', icon: Wallet, tab: 'wallets' as PortalTabId, tint: 'bg-emerald-50 text-emerald-800' },
    { label: 'Statements', icon: Printer, tab: 'statements' as PortalTabId, tint: 'bg-indigo-50 text-indigo-800' },
  ];

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse pb-2" aria-busy="true">
        <div className="h-40 rounded-3xl bg-[#063D32]/15" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/80" />
          ))}
        </div>
        <div className="h-48 rounded-3xl bg-white/80" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto w-full pb-2">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-900 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 font-semibold text-rose-800 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden />
            Retry
          </button>
        </div>
      )}

      <section
        className="rounded-3xl bg-gradient-to-br from-[#063D32] via-[#075B46] to-[#19A77A] text-white p-5 shadow-md"
        aria-labelledby="mobile-balance-heading"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-xs text-emerald-100/90">
              {greeting}, {customerGreetingName(user?.fullName)}
            </p>
            <h2 id="mobile-balance-heading" className="font-serif font-bold text-lg leading-tight">
              Available balance
            </h2>
            <p className="text-[10px] text-emerald-100/80 mt-0.5">Primary wallet · {primaryFiat}</p>
          </div>
          <button
            type="button"
            onClick={() => setBalanceVisible((v) => !v)}
            className="p-2 rounded-xl bg-white/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
          >
            {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-3xl font-serif font-bold tabular-nums tracking-tight" data-financial-amount="true">
          {balanceVisible ? primaryFiatBalanceDisplay : '••••••'}
        </p>
        <p className="text-xs text-emerald-100/90 mt-2 tabular-nums" data-financial-amount="true">
          ≈ {balanceVisible ? primaryFiatBtcEquivalentDisplay : '••••'}
          <span className="text-emerald-100/70"> · illustrative FX</span>
        </p>
        {primaryFiatHasHold && primaryFiatHoldDisplay && (
          <p className="text-[11px] text-amber-100/95 mt-2 tabular-nums" data-financial-amount="true">
            Hold (pending): {balanceVisible ? primaryFiatHoldDisplay : '••••'}
          </p>
        )}
        {walletsSummary.length > 1 && (
          <p className="text-[10px] text-emerald-100/75 mt-2">
            {walletsSummary.length} currencies · balances shown separately (no combined FX total)
          </p>
        )}
      </section>

      <section aria-label="Quick actions">
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => onTabChange(action.tab)}
                className="flex flex-col items-center gap-1.5 py-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19A77A]/40 rounded-2xl"
              >
                <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${action.tint}`}>
                  <Icon className="w-5 h-5" aria-hidden />
                </span>
                <span className="text-[10px] font-semibold text-[#17231F] text-center leading-tight">{action.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-[#E2E8E4]/80 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif font-bold text-[#17231F]">Recent activity</h3>
          <button
            type="button"
            onClick={() => onTabChange('transactions')}
            className="text-xs font-semibold text-[#075B46] flex items-center gap-0.5 cursor-pointer"
          >
            See all
            <ChevronRight className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-[#68746E] py-4 text-center">No transactions yet.</p>
        ) : (
          <ul className="space-y-1">
            {recent.map((tx) => {
              const dir = txDirection(tx);
              const label = tx.narration || tx.counterparty || formatOperationTypeLabel(tx.operationType);
              return (
                <li key={tx.transactionId}>
                  <button
                    type="button"
                    onClick={() => onTabChange('transactions')}
                    className="w-full flex items-center gap-3 py-2.5 text-left rounded-xl hover:bg-[#F1F4F1]/80 cursor-pointer"
                  >
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        dir === 'in' ? 'bg-[#E8F6F2] text-[#075B46]' : 'bg-slate-100 text-[#68746E]'
                      }`}
                      aria-hidden
                    >
                      {dir === 'in' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-[#17231F] truncate">{label}</span>
                      <span className="block text-[11px] text-[#68746E]">
                        {new Date(tx.timestamp).toLocaleDateString()} · {tx.status}
                        {tx.isSimulated ? ' · Simulated' : ''}
                      </span>
                    </span>
                    <span
                      className={`text-sm font-bold tabular-nums shrink-0 ${
                        dir === 'in' ? 'text-[#075B46]' : 'text-[#17231F]'
                      }`}
                      data-financial-amount="true"
                    >
                      {dir === 'in' ? '+' : '−'}
                      {tx.formattedAmount || tx.amountMinor}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-3xl border border-[#E2E8E4]/80 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif font-bold text-[#17231F]">Your wallets</h3>
          <button
            type="button"
            onClick={() => onTabChange('wallets')}
            className="text-xs font-semibold text-[#075B46] cursor-pointer"
          >
            Manage
          </button>
        </div>
        {walletsSummary.length === 0 ? (
          <p className="text-xs text-[#68746E] py-2">No wallet accounts loaded.</p>
        ) : (
          <ul className="space-y-2">
            {walletsSummary.map((account, idx) => {
              const code = (account.currency || account.currencyCode || '').toUpperCase();
              const onHold = walletHoldMinorPositive(account);
              return (
                <li
                  key={`${code}-${idx}`}
                  className="p-3 rounded-2xl bg-[#F1F4F1]/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#075B46]">{code}</span>
                    <span className="font-semibold tabular-nums text-[#17231F]" data-financial-amount="true">
                      {formatWalletAccountBalance(account)}
                    </span>
                  </div>
                  {account.accountNumber && (
                    <p className="font-mono text-[10px] text-[#68746E] break-all">{account.accountNumber}</p>
                  )}
                  {onHold && (
                    <p className="text-[10px] text-amber-800 tabular-nums">
                      Hold: {formatWalletAccountHold(account)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <DomesticBankAccountCard onNavigateToKyc={() => onTabChange('kyc')} />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onTabChange('wallets')}
          className="bg-white rounded-2xl border border-[#E2E8E4]/80 p-3 text-left cursor-pointer hover:border-[#19A77A]/30 transition"
        >
          <Wallet className="w-4 h-4 text-[#075B46] mb-2" aria-hidden />
          <p className="text-xs font-bold text-[#17231F]">Deposit & withdraw</p>
          <p className="text-[10px] text-[#68746E] mt-0.5">{walletsSummary.length} wallet accounts</p>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('cards')}
          className="bg-white rounded-2xl border border-[#E2E8E4]/80 p-3 text-left cursor-pointer hover:border-[#19A77A]/30 transition"
        >
          <CreditCard className="w-4 h-4 text-[#075B46] mb-2" aria-hidden />
          <p className="text-xs font-bold text-[#17231F]">Cards</p>
          <p className="text-[10px] text-[#68746E] mt-0.5">{cardsSummary.length} on file</p>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('kyc')}
          className="bg-white rounded-2xl border border-[#E2E8E4]/80 p-3 text-left cursor-pointer hover:border-[#19A77A]/30 transition"
        >
          <ShieldCheck className="w-4 h-4 text-[#075B46] mb-2" aria-hidden />
          <p className="text-xs font-bold text-[#17231F]">Verification</p>
          <p className="text-[10px] text-[#68746E] mt-0.5 truncate">
            {(user?.kycStatus || 'NOT_STARTED').replace(/_/g, ' ')}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('loans')}
          className="bg-white rounded-2xl border border-[#E2E8E4]/80 p-3 text-left cursor-pointer hover:border-[#19A77A]/30 transition"
        >
          <FileText className="w-4 h-4 text-[#075B46] mb-2" aria-hidden />
          <p className="text-xs font-bold text-[#17231F]">Applications</p>
          <p className="text-[10px] text-[#68746E] mt-0.5">
            {loansCount} loans · {grantsCount} grants
          </p>
        </button>
      </div>
    </div>
  );
};
