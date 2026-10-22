/**
 * @license Apache-2.0
 * Avenora — desktop dashboard overview (Finora-inspired layout, Avenora data)
 */

import React, { useMemo, useState } from 'react';
import type { PortalTabId } from '../../routing/appRoutes.ts';
import type { AuthUser } from '../AuthContext.tsx';
import {
  customerGreetingName,
  formatWalletAccountBalance,
  formatWalletAccountHold,
  timeOfDayGreeting,
  walletHoldMinorPositive,
} from '../../lib/walletDisplay.ts';
import { formatOperationTypeLabel } from '../../lib/operationDisplay.ts';
import type {
  PortalCardSummary,
  PortalTransactionSummary,
} from '../../hooks/usePortalDashboardData.ts';
import type { WalletAccountLike } from '../../hooks/useCustomerWalletScope.ts';
import type { WalletDeepLinkModal } from '../WalletView.tsx';
import { useDomesticBankAccount } from '../../hooks/useDomesticBankAccount.ts';
import {
  Eye,
  EyeOff,
  Printer,
  Wallet,
  CreditCard,
  FileText,
  Award,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Mail,
  Copy,
  Check,
  Building2,
  Siren,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

const CHART_COLORS = ['#075B46', '#19A77A', '#3B82F6', '#8B5CF6', '#F59E0B', '#64748B'];

interface DashboardOverviewProps {
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
  onOpenWalletModal?: (modal: WalletDeepLinkModal) => void;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string): string {
  const [yRaw, mRaw] = key.split('-');
  const y = Number(yRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return key;
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short' });
}

function kycStatusPresentation(status: AuthUser['kycStatus'] | undefined) {
  switch (status) {
    case 'APPROVED':
      return { label: 'Approved', className: 'bg-emerald-100 text-[#075B46]', description: 'Internal KYC review complete.' };
    case 'SUBMITTED':
      return { label: 'Submitted', className: 'bg-blue-50 text-blue-800', description: 'Awaiting compliance queue.' };
    case 'UNDER_REVIEW':
      return { label: 'Under review', className: 'bg-amber-50 text-amber-900', description: 'Analyst review in progress.' };
    case 'IN_PROGRESS':
      return { label: 'In progress', className: 'bg-slate-100 text-slate-800', description: 'Continue your application.' };
    case 'NEEDS_MORE_INFORMATION':
      return { label: 'Needs info', className: 'bg-orange-50 text-orange-900', description: 'Upload additional documents.' };
    case 'REJECTED':
      return { label: 'Rejected', className: 'bg-rose-50 text-rose-800', description: 'Contact support for next steps.' };
    default:
      return { label: 'Not started', className: 'bg-[#F1F4F1] text-[#68746E]', description: 'Verification not yet submitted.' };
  }
}

function cardStatusLabel(status?: string): string {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
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
  onRetry: _onRetry,
  onTabChange,
  onOpenWalletModal,
}) => {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { data: domesticAccount, loading: domesticLoading } = useDomesticBankAccount();
  const greeting = timeOfDayGreeting();
  const kyc = kycStatusPresentation(user?.kycStatus);
  const domesticFields =
    domesticAccount?.generationStatus === 'GENERATED' ? domesticAccount.displayFields ?? [] : [];
  const domesticCountry =
    domesticAccount?.verifiedCountryCode || user?.countryCode || primaryFiat;
  const kycAlertNeeded =
    !domesticLoading &&
    domesticFields.length === 0 &&
    user?.kycStatus !== 'APPROVED' &&
    domesticAccount?.generationStatus !== 'PENDING_GENERATION';

  const copyDomesticValue = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const monthlyActivity = useMemo(() => {
    const buckets = new Map<string, number>();
    const now = new Date();
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.set(monthKey(d), 0);
    }
    for (const tx of transactions) {
      const d = new Date(tx.timestamp);
      const key = monthKey(d);
      if (!buckets.has(key)) continue;
      buckets.set(key, (buckets.get(key) ?? 0) + Math.abs(Number(tx.amountMinor) || 0));
    }
    return Array.from(buckets.entries()).map(([key, totalMinor]) => ({
      key,
      label: formatMonthLabel(key),
      totalMinor,
    }));
  }, [transactions]);

  const maxMonthlyMinor = useMemo(
    () => Math.max(...monthlyActivity.map((m) => m.totalMinor), 1),
    [monthlyActivity],
  );

  const typeDistribution = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of transactions) {
      const label = formatOperationTypeLabel(tx.operationType);
      totals.set(label, (totals.get(label) ?? 0) + Math.abs(Number(tx.amountMinor) || 0));
    }
    const entries = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    const grand = entries.reduce((sum, [, v]) => sum + v, 0) || 1;
    return entries.map(([label, minor], index) => ({
      label,
      minor,
      percent: (minor / grand) * 100,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [transactions]);

  const donutGradient = useMemo(() => {
    if (typeDistribution.length === 0) return 'conic-gradient(#E2E8E4 0deg 360deg)';
    let cursor = 0;
    const stops: string[] = [];
    for (const slice of typeDistribution) {
      const next = cursor + slice.percent * 3.6;
      stops.push(`${slice.color} ${cursor}deg ${next}deg`);
      cursor = next;
    }
    return `conic-gradient(${stops.join(', ')})`;
  }, [typeDistribution]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  }, [transactions]);

  const quickActions: Array<{
    label: string;
    sub: string;
    icon: React.ComponentType<{ className?: string }>;
    tint: string;
    tab?: PortalTabId;
    walletModal?: WalletDeepLinkModal;
  }> = [
    {
      label: 'View wallets',
      sub: 'Balances',
      icon: Wallet,
      tint: 'bg-emerald-50 text-emerald-800',
      tab: 'wallets',
    },
    {
      label: 'Deposit funds',
      sub: 'Simulated only',
      icon: ArrowDownLeft,
      tint: 'bg-[#E8F6F2] text-[#075B46]',
      walletModal: 'deposit',
    },
    {
      label: 'Withdraw funds',
      sub: 'Bank or BTC',
      icon: ArrowUpRight,
      tint: 'bg-teal-50 text-teal-800',
      walletModal: 'withdraw',
    },
    {
      label: 'Statements',
      sub: 'PDF / CSV',
      icon: Printer,
      tint: 'bg-indigo-50 text-indigo-800',
      tab: 'statements',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
        <div className="h-44 rounded-[22px] bg-[#063D32]/20" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/70" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 h-80 rounded-[22px] bg-white/70" />
          <div className="h-80 rounded-[22px] bg-white/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
            <span>{error}</span>
          </div>
          <a
            href="mailto:support@avenorabank.com?subject=Account%20suspension%20support"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-semibold hover:bg-rose-100 shrink-0"
          >
            <Mail className="w-3.5 h-3.5" aria-hidden />
            Email support
          </a>
        </div>
      )}

      {/* Portfolio hero — balance left, domestic account details right (below visibility toggle) */}
      <section
        className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#063D32] via-[#075B46] to-[#19A77A] text-white p-6 sm:p-8 shadow-lg"
        aria-labelledby="portfolio-hero-title"
      >
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" aria-hidden />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-stretch gap-6 lg:gap-8">
          <div className="min-w-0 flex-1 space-y-5">
            <div>
              <p className="text-xs text-emerald-100/90">
                {greeting}, {customerGreetingName(user?.fullName)}
              </p>
              <h2 id="portfolio-hero-title" className="text-sm sm:text-base font-medium text-emerald-100/95 mt-1">
                Available balance
              </h2>
            </div>

            <p
              className="text-4xl sm:text-5xl font-serif font-bold tabular-nums tracking-tight text-white break-all"
              data-financial-amount="true"
            >
              {balanceVisible ? primaryFiatBalanceDisplay : '••••••'}
            </p>

            <p className="text-xs text-emerald-100/90 tabular-nums" data-financial-amount="true">
              ≈ {balanceVisible ? primaryFiatBtcEquivalentDisplay : '••••'}
            </p>

            {primaryFiatHasHold && primaryFiatHoldDisplay && (
              <p className="text-[11px] text-amber-100/95 tabular-nums" data-financial-amount="true">
                Hold (pending): {balanceVisible ? primaryFiatHoldDisplay : '••••'}
              </p>
            )}

            {walletsSummary.length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {walletsSummary.map((account, idx) => {
                  const code = (account.currency || account.currencyCode || '').toUpperCase();
                  return (
                    <li
                      key={`${code}-${idx}`}
                      className="rounded-xl bg-white/10 border border-white/20 px-3 py-2.5 flex items-center justify-between gap-3"
                    >
                      <span className="text-xs font-semibold text-emerald-50">{code || '—'}</span>
                      <span
                        className="text-sm sm:text-base font-serif font-bold text-white tabular-nums"
                        data-financial-amount="true"
                      >
                        {balanceVisible ? formatWalletAccountBalance(account) : '••••'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <aside className="w-full lg:w-[min(100%,20rem)] shrink-0 flex flex-col gap-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setBalanceVisible((v) => !v)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 shrink-0"
                aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
              >
                {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            <div
              className={`rounded-2xl border p-4 space-y-3 flex-1 ${
                kycAlertNeeded
                  ? 'animate-kyc-siren text-white'
                  : 'bg-white/10 border-white/20'
              }`}
              role={kycAlertNeeded ? 'alert' : undefined}
              aria-live={kycAlertNeeded ? 'polite' : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {kycAlertNeeded ? (
                    <Siren
                      className="w-4 h-4 text-red-100 shrink-0 animate-kyc-siren-icon"
                      aria-hidden
                    />
                  ) : (
                    <Building2 className="w-4 h-4 text-emerald-100 shrink-0" aria-hidden />
                  )}
                  <p className="text-xs font-semibold text-white truncate">
                    {kycAlertNeeded ? 'Verification required' : 'Domestic account'}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                    kycAlertNeeded ? 'text-red-100' : 'text-emerald-100/80'
                  }`}
                >
                  {domesticCountry}
                </span>
              </div>

              {domesticLoading && domesticFields.length === 0 ? (
                <p className="text-[11px] text-emerald-100/80">Loading account details…</p>
              ) : domesticFields.length > 0 ? (
                <ul className="space-y-2">
                  {domesticFields.map((field) => (
                    <li
                      key={field.key}
                      className="flex items-center justify-between gap-2 rounded-xl bg-black/15 border border-white/10 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] text-emerald-100/75">{field.label}</p>
                        <p className="text-xs font-mono font-semibold text-white mt-0.5 break-all">
                          {balanceVisible ? field.value : '••••'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyDomesticValue(field.key, field.value)}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                        aria-label={`Copy ${field.label}`}
                      >
                        {copiedKey === field.key ? (
                          <Check className="w-3.5 h-3.5 text-emerald-200" aria-hidden />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-emerald-100/80" aria-hidden />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : kycAlertNeeded ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-red-50 leading-relaxed font-medium">
                    Complete identity verification to unlock your domestic account numbers.
                  </p>
                  <button
                    type="button"
                    onClick={() => onTabChange('kyc')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-red-950/40 hover:bg-red-950/55 border border-red-100/40 rounded-lg px-3 py-1.5 cursor-pointer"
                  >
                    <Siren className="w-3.5 h-3.5 animate-kyc-siren-icon" aria-hidden />
                    Open verification now
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-emerald-100/85 leading-relaxed">
                    {domesticAccount?.generationStatus === 'PENDING_GENERATION'
                      ? 'Generating your country-format account numbers…'
                      : 'Account details unavailable. Try refreshing.'}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* Quick actions — desktop card style, four equal columns */}
      <section aria-label="Quick actions">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  if (action.walletModal && onOpenWalletModal) {
                    onOpenWalletModal(action.walletModal);
                    return;
                  }
                  if (action.tab) onTabChange(action.tab);
                }}
                className="group flex flex-col items-center text-center p-4 rounded-2xl bg-white border border-[#E2E8E4]/80 shadow-sm hover:shadow-md hover:border-[#19A77A]/30 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19A77A]/40 w-full"
              >
                <span
                  className={`w-11 h-11 rounded-full flex items-center justify-center mb-2 ${action.tint} group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5" aria-hidden />
                </span>
                <span className="text-xs font-semibold text-[#17231F]">{action.label}</span>
                <span className="text-[10px] text-[#68746E] mt-0.5">{action.sub}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left / center column */}
        <div className="xl:col-span-8 space-y-6">
          {/* Activity chart */}
          <article className="bg-white rounded-[20px] border border-[#E2E8E4]/80 shadow-sm p-6">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="font-serif font-bold text-[#17231F] text-lg">Transaction activity</h3>
                <p className="text-xs text-[#68746E]">Absolute ledger volume by month (all currencies, minor units)</p>
              </div>
            </div>
            {transactions.length === 0 ? (
              <p className="text-sm text-[#68746E] py-8 text-center">No transactions yet. Activity will appear here.</p>
            ) : (
              <div className="flex items-end gap-2 sm:gap-3 h-44" role="img" aria-label="Monthly transaction activity chart">
                {monthlyActivity.map((month) => {
                  const height = Math.max(4, (month.totalMinor / maxMonthlyMinor) * 100);
                  const isPeak = month.totalMinor === maxMonthlyMinor && month.totalMinor > 0;
                  return (
                    <div key={month.key} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                      <div className="w-full flex items-end justify-center h-32">
                        <div
                          className={`w-full max-w-[2.25rem] rounded-t-lg transition-all ${
                            isPeak ? 'bg-[#075B46]' : 'bg-[#19A77A]/35'
                          }`}
                          style={{ height: `${height}%` }}
                          title={`${month.label}: ${month.totalMinor} minor units`}
                        />
                      </div>
                      <span className="text-[10px] text-[#68746E] truncate w-full text-center">{month.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          {/* Recent transactions */}
          <article className="bg-white rounded-[20px] border border-[#E2E8E4]/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-[#17231F] text-lg">Recent transactions</h3>
              <button
                type="button"
                onClick={() => onTabChange('transactions')}
                className="text-xs font-semibold text-[#075B46] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-3.5 h-3.5" aria-hidden />
              </button>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-[#68746E] py-6">No transactions recorded for this account yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#68746E] border-b border-[#E2E8E4]">
                      <th className="text-left font-semibold py-2 pr-3">Date</th>
                      <th className="text-left font-semibold py-2 pr-3">Description</th>
                      <th className="text-left font-semibold py-2 pr-3 hidden sm:table-cell">Type</th>
                      <th className="text-right font-semibold py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx) => {
                      const isCredit =
                        tx.direction === 'CREDIT' ||
                        tx.operationType === 'SIMULATED_DEPOSIT' ||
                        tx.operationType === 'GRANT_DISBURSEMENT';
                      const description =
                        tx.narration || tx.counterparty || tx.referenceNumber || tx.transactionId.slice(0, 8);
                      return (
                        <tr key={tx.transactionId} className="border-b border-[#F1F4F1] last:border-0">
                          <td className="py-3 pr-3 text-[#68746E] whitespace-nowrap">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-3 pr-3 text-[#17231F] max-w-[10rem] truncate" title={description}>
                            {description}
                            {tx.isSimulated && (
                              <span className="ml-1 text-[10px] text-amber-700 font-medium">(sim)</span>
                            )}
                          </td>
                          <td className="py-3 pr-3 hidden sm:table-cell text-[#68746E]">
                            {formatOperationTypeLabel(tx.operationType)}
                          </td>
                          <td
                            className={`py-3 text-right font-semibold tabular-nums ${
                              isCredit ? 'text-[#075B46]' : 'text-[#17231F]'
                            }`}
                            data-financial-amount="true"
                          >
                            {isCredit ? '+' : '−'}
                            {tx.formattedAmount || tx.amountMinor} {tx.currency}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>

        {/* Right column */}
        <div className="xl:col-span-4 space-y-6">
          {/* Wallets */}
          <article className="bg-white rounded-[20px] border border-[#E2E8E4]/80 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-[#17231F]">Wallets</h3>
              <button
                type="button"
                onClick={() => onTabChange('wallets')}
                className="text-xs font-semibold text-[#075B46] hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>
            <ul className="space-y-2">
              {walletsSummary.map((account, idx) => {
                const code = (account.currency || account.currencyCode || '').toUpperCase();
                const onHold = walletHoldMinorPositive(account);
                return (
                  <li
                    key={`${code}-${idx}`}
                    className="p-2.5 rounded-xl bg-[#F1F4F1]/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#075B46]">{code}</span>
                      <span className="font-semibold tabular-nums text-[#17231F]" data-financial-amount="true">
                        {formatWalletAccountBalance(account)}
                      </span>
                    </div>
                    {onHold && (
                      <p className="text-[10px] text-amber-800 tabular-nums" data-financial-amount="true">
                        Hold: {formatWalletAccountHold(account)}
                      </p>
                    )}
                  </li>
                );
              })}
              {walletsSummary.length === 0 && (
                <li className="text-xs text-[#68746E] py-2">No wallet accounts loaded.</li>
              )}
            </ul>
          </article>

          {/* Distribution */}
          <article className="bg-white rounded-[20px] border border-[#E2E8E4]/80 shadow-sm p-5">
            <h3 className="font-serif font-bold text-[#17231F] mb-1">Activity mix</h3>
            <p className="text-[11px] text-[#68746E] mb-4">By operation type (ledger minor units)</p>
            {typeDistribution.length === 0 ? (
              <p className="text-xs text-[#68746E]">Insufficient data for a breakdown.</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div
                  className="w-28 h-28 rounded-full shrink-0"
                  style={{ background: donutGradient }}
                  role="img"
                  aria-label="Transaction type distribution chart"
                />
                <ul className="flex-1 space-y-1.5 text-[11px] w-full">
                  {typeDistribution.slice(0, 5).map((slice) => (
                    <li key={slice.label} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: slice.color }} aria-hidden />
                        <span className="truncate text-[#17231F]">{slice.label}</span>
                      </span>
                      <span className="text-[#68746E] tabular-nums shrink-0">{slice.percent.toFixed(0)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          {/* Cards */}
          <article className="bg-white rounded-[20px] border border-[#E2E8E4]/80 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-[#17231F] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#075B46]" aria-hidden />
                Cards
              </h3>
              <button
                type="button"
                onClick={() => onTabChange('cards')}
                className="text-xs font-semibold text-[#075B46] hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>
            {cardsSummary.length === 0 ? (
              <p className="text-xs text-[#68746E]">No cards on file.</p>
            ) : (
              <ul className="space-y-2">
                {cardsSummary.slice(0, 2).map((card, idx) => (
                  <li key={card.id ?? idx} className="p-3 rounded-xl bg-[#F1F4F1]/60 text-xs">
                    <p className="font-semibold text-[#17231F]">
                      •••• {card.lastFour || card.maskedPan?.slice(-4) || '····'}
                    </p>
                    <p className="text-[#68746E] mt-0.5">
                      {card.currency || primaryFiat} · {cardStatusLabel(card.status)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          {/* KYC */}
          <article className="bg-white rounded-[20px] border border-[#E2E8E4]/80 shadow-sm p-5">
            <h3 className="font-serif font-bold text-[#17231F] mb-2">Verification</h3>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${kyc.className}`}>
              {kyc.label}
            </span>
            <p className="text-xs text-[#68746E] mt-2 leading-relaxed">{kyc.description}</p>
            <button
              type="button"
              onClick={() => onTabChange('kyc')}
              className="mt-3 text-xs font-semibold text-[#075B46] hover:underline cursor-pointer"
            >
              Open verification workflow
            </button>
          </article>

          {/* Loans & grants */}
          <article className="bg-white rounded-[20px] border border-[#E2E8E4]/80 shadow-sm p-5 space-y-3">
            <h3 className="font-serif font-bold text-[#17231F]">Applications</h3>
            <button
              type="button"
              onClick={() => onTabChange('loans')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F1F4F1]/60 hover:bg-[#F1F4F1] text-left cursor-pointer transition"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-[#17231F]">
                <FileText className="w-4 h-4 text-[#075B46]" aria-hidden />
                Loan applications
              </span>
              <span className="text-sm font-bold text-[#075B46] tabular-nums">{loansCount}</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('grants')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F1F4F1]/60 hover:bg-[#F1F4F1] text-left cursor-pointer transition"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-[#17231F]">
                <Award className="w-4 h-4 text-[#075B46]" aria-hidden />
                Grant applications
              </span>
              <span className="text-sm font-bold text-[#075B46] tabular-nums">{grantsCount}</span>
            </button>
          </article>
        </div>
      </div>
    </div>
  );
};
