/**
 * @license Apache-2.0
 * Admin control center — overview tab section (extracted).
 */

import React from 'react';
import {
  Users,
  FileCheck,
  Award,
  CreditCard,
  DollarSign,
  BarChart3,
  Activity,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import type { AdminTabId } from '../../../routing/appRoutes.ts';
import {
  AdminPageHeader,
  AdminButton,
} from '../ui';

export interface AdminOverviewSectionProps {
  overviewData: any;
  loading: boolean;
  fetchOverview: () => void;
  onTabChange: (tab: AdminTabId) => void;
}

function barWidthPct(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

type QueueBar = {
  key: string;
  label: string;
  count: number;
  tab: AdminTabId;
  barClass: string;
};

type MetricBar = {
  key: string;
  label: string;
  count: number;
  barClass: string;
  trackClass: string;
};

export const AdminOverviewSection: React.FC<AdminOverviewSectionProps> = ({
  overviewData,
  loading,
  fetchOverview,
  onTabChange,
}) => {
  const kycPending = overviewData?.kycQueue?.pendingReview ?? 0;
  const depositPending = overviewData?.deposits?.pendingReview ?? 0;
  const withdrawalPending = overviewData?.withdrawals?.pendingReview ?? 0;
  const creditPending =
    (overviewData?.loans?.pendingReview ?? 0) + (overviewData?.grants?.pendingReview ?? 0);
  const cardsPending = overviewData?.cards?.pendingIssuance ?? 0;

  const queueBars: QueueBar[] = [
    {
      key: 'kyc',
      label: 'KYC review',
      count: kycPending,
      tab: 'kyc',
      barClass: 'bg-brand-primary',
    },
    {
      key: 'deposits',
      label: 'Deposit holds',
      count: depositPending,
      tab: 'transactions',
      barClass: 'bg-amber-500',
    },
    {
      key: 'withdrawals',
      label: 'Withdrawal holds',
      count: withdrawalPending,
      tab: 'transactions',
      barClass: 'bg-sky-500',
    },
    {
      key: 'credit',
      label: 'Loans & grants',
      count: creditPending,
      tab: 'loans_grants',
      barClass: 'bg-violet-500',
    },
    {
      key: 'cards',
      label: 'Card issuance',
      count: cardsPending,
      tab: 'cards',
      barClass: 'bg-teal-600',
    },
  ];
  const queueMax = Math.max(1, ...queueBars.map((b) => b.count));

  const agingBars: MetricBar[] = [
    {
      key: 'under24h',
      label: 'Under 24 hours',
      count: overviewData?.kycQueue?.aging?.under24h ?? 0,
      barClass: 'bg-emerald-500',
      trackClass: 'bg-emerald-50',
    },
    {
      key: 'oneToThreeDays',
      label: '24–72 hours',
      count: overviewData?.kycQueue?.aging?.oneToThreeDays ?? 0,
      barClass: 'bg-amber-500',
      trackClass: 'bg-amber-50',
    },
    {
      key: 'overThreeDays',
      label: 'Over 72 hours',
      count: overviewData?.kycQueue?.aging?.overThreeDays ?? 0,
      barClass: 'bg-rose-500',
      trackClass: 'bg-rose-50',
    },
  ];
  const agingMax = Math.max(1, ...agingBars.map((b) => b.count));

  const customersTotal = overviewData?.customers?.total ?? 0;
  const customersActive = overviewData?.customers?.active ?? 0;
  const customersSuspended = overviewData?.customers?.suspended ?? 0;
  const customersLocked = overviewData?.customers?.locked ?? 0;
  const customersPending = Math.max(
    0,
    customersTotal - customersActive - customersSuspended - customersLocked,
  );

  const accountBars: MetricBar[] = [
    {
      key: 'active',
      label: 'Active',
      count: customersActive,
      barClass: 'bg-emerald-600',
      trackClass: 'bg-slate-100',
    },
    {
      key: 'pending',
      label: 'Pending verification',
      count: customersPending,
      barClass: 'bg-amber-500',
      trackClass: 'bg-slate-100',
    },
    {
      key: 'suspended',
      label: 'Suspended',
      count: customersSuspended,
      barClass: 'bg-orange-500',
      trackClass: 'bg-slate-100',
    },
    {
      key: 'locked',
      label: 'Locked',
      count: customersLocked,
      barClass: 'bg-rose-600',
      trackClass: 'bg-slate-100',
    },
  ];
  const accountMax = Math.max(1, ...accountBars.map((b) => b.count));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Operations Overview & Workflow Health"
        subtitle="Real-time operational metrics across customer identity, credit underwriting, ledger reconciliation, and gateway events."
        actions={
          <AdminButton variant="secondary" onClick={fetchOverview} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Metrics</span>
          </AdminButton>
        }
      />

      {/* Key Metric Cards — click through to matching admin sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <button
          type="button"
          onClick={() => onTabChange('customers')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs text-left transition hover:border-brand-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 cursor-pointer"
        >
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Customer Accounts</span>
            <Users className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-bold text-brand-deep">
            {overviewData ? overviewData.customers.total : '—'}
          </div>
          <div className="mt-2 text-xs text-brand-muted flex items-center justify-between border-t border-slate-100 pt-2">
            <span>
              Active: <strong className="text-emerald-700">{overviewData?.customers.active ?? 0}</strong>
            </span>
            <span>
              Suspended:{' '}
              <strong className="text-amber-700">{overviewData?.customers.suspended ?? 0}</strong>
            </span>
            <span>
              Locked: <strong className="text-rose-700">{overviewData?.customers.locked ?? 0}</strong>
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('kyc')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs text-left transition hover:border-brand-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 cursor-pointer"
        >
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase tracking-wider mb-2">
            <span>KYC Review Queue</span>
            <FileCheck className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-bold text-brand-deep">
            {overviewData ? overviewData.kycQueue.pendingReview : '—'}
          </div>
          <div className="mt-2 text-xs text-brand-muted flex items-center justify-between border-t border-slate-100 pt-2">
            <span>
              Approved:{' '}
              <strong className="text-emerald-700">{overviewData?.kycQueue.approved ?? 0}</strong>
            </span>
            <span>
              Rejected:{' '}
              <strong className="text-rose-700">{overviewData?.kycQueue.rejected ?? 0}</strong>
            </span>
            <span className="text-[11px] text-amber-700 font-semibold">
              &gt;24h: {overviewData?.kycQueue.aging.oneToThreeDays ?? 0}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('loans_grants')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs text-left transition hover:border-brand-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 cursor-pointer"
        >
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Loans & Grants</span>
            <Award className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-bold text-brand-deep">
            {overviewData
              ? (overviewData.loans?.pendingReview ?? 0) + (overviewData.grants?.pendingReview ?? 0)
              : '—'}
          </div>
          <div className="mt-2 text-xs text-brand-muted flex items-center justify-between border-t border-slate-100 pt-2 gap-2">
            <span>
              Loans: <strong className="text-emerald-700">{overviewData?.loans?.total ?? 0}</strong>
            </span>
            <span>
              Grants: <strong className="text-emerald-700">{overviewData?.grants?.total ?? 0}</strong>
            </span>
            <span className="text-[11px] text-amber-700 font-semibold">
              Pending:{' '}
              {(overviewData?.loans?.pendingReview ?? 0) + (overviewData?.grants?.pendingReview ?? 0)}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('cards')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs text-left transition hover:border-brand-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 cursor-pointer"
        >
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Card Operations</span>
            <CreditCard className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-bold text-brand-deep">
            {overviewData ? overviewData.cards?.total ?? 0 : '—'}
          </div>
          <div className="mt-2 text-xs text-brand-muted flex items-center justify-between border-t border-slate-100 pt-2 gap-2">
            <span>
              Active:{' '}
              <strong className="text-emerald-700">{overviewData?.cards?.activeSimulated ?? 0}</strong>
            </span>
            <span>
              Frozen: <strong className="text-amber-700">{overviewData?.cards?.frozen ?? 0}</strong>
            </span>
            <span className="text-[11px] text-amber-700 font-semibold">
              Pending: {overviewData?.cards?.pendingIssuance ?? 0}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('transactions')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs text-left transition hover:border-brand-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 cursor-pointer"
        >
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Financial Transactions</span>
            <DollarSign className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-bold text-brand-deep">
            {overviewData ? overviewData.transactions.total : '—'}
          </div>
          <div className="mt-2 text-xs text-brand-muted flex items-center justify-between border-t border-slate-100 pt-2">
            <span>
              Posted:{' '}
              <strong className="text-emerald-700">{overviewData?.transactions.posted ?? 0}</strong>
            </span>
            <span>
              Compensated/Reversed:{' '}
              <strong className="text-amber-700">{overviewData?.transactions.reversed ?? 0}</strong>
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('transactions')}
          className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs text-left transition hover:border-amber-400/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/35 cursor-pointer"
        >
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Funding Approvals</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-brand-deep">
            {overviewData
              ? (overviewData.deposits?.pendingReview ?? 0) +
                (overviewData.withdrawals?.pendingReview ?? 0)
              : '—'}
          </div>
          <div className="mt-2 text-xs text-brand-muted flex items-center justify-between border-t border-slate-100 pt-2 gap-2">
            <span>
              Deposits:{' '}
              <strong className="text-amber-700">{overviewData?.deposits?.pendingReview ?? 0}</strong>
            </span>
            <span>
              Withdrawals:{' '}
              <strong className="text-amber-700">
                {overviewData?.withdrawals?.pendingReview ?? 0}
              </strong>
            </span>
            <span className="text-[11px] text-brand-primary font-semibold flex items-center gap-0.5">
              Open queue
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>
      </div>

      {/* Ops charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs"
          aria-labelledby="pending-queues-heading"
        >
          <h3
            id="pending-queues-heading"
            className="font-serif font-bold text-base text-brand-deep mb-1 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4 text-brand-primary" aria-hidden />
            <span>Pending work queues</span>
          </h3>
          <p className="text-xs text-brand-muted mb-4">
            Live backlog waiting on admin action. Select a row to open that queue.
          </p>

          <ul className="space-y-3" role="list">
            {queueBars.map((row) => {
              const width = barWidthPct(row.count, queueMax);
              return (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={() => onTabChange(row.tab)}
                    className="w-full text-left rounded-lg p-2 -mx-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 cursor-pointer"
                    aria-label={`${row.label}: ${row.count} pending. Open queue.`}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                      <span className="font-medium text-brand-deep">{row.label}</span>
                      <span className="font-bold tabular-nums text-brand-deep">{row.count}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden>
                      <div
                        className={`h-full rounded-full ${row.barClass} transition-[width] duration-500 ease-out`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs"
          aria-labelledby="health-charts-heading"
        >
          <h3
            id="health-charts-heading"
            className="font-serif font-bold text-base text-brand-deep mb-1 flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-brand-primary" aria-hidden />
            <span>KYC aging & account health</span>
          </h3>
          <p className="text-xs text-brand-muted mb-4">
            SLA pressure on pending KYC cases and current customer account mix.
          </p>

          <div className="space-y-5">
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-2.5">
                KYC SLA aging
              </h4>
              <ul className="space-y-2.5" role="list">
                {agingBars.map((row) => {
                  const width = barWidthPct(row.count, agingMax);
                  return (
                    <li key={row.key}>
                      <div className="flex items-center justify-between gap-3 text-xs mb-1">
                        <span className="font-medium text-brand-deep">{row.label}</span>
                        <span className="font-bold tabular-nums text-brand-deep" aria-label={`${row.count} cases`}>
                          {row.count}
                        </span>
                      </div>
                      <div
                        className={`h-2.5 rounded-full overflow-hidden ${row.trackClass}`}
                        role="meter"
                        aria-valuenow={row.count}
                        aria-valuemin={0}
                        aria-valuemax={agingMax}
                        aria-label={`${row.label}: ${row.count}`}
                      >
                        <div
                          className={`h-full rounded-full ${row.barClass} transition-[width] duration-500 ease-out`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted mb-2.5">
                Customer account mix
              </h4>
              <ul className="space-y-2.5" role="list">
                {accountBars.map((row) => {
                  const width = barWidthPct(row.count, accountMax);
                  return (
                    <li key={row.key}>
                      <div className="flex items-center justify-between gap-3 text-xs mb-1">
                        <span className="font-medium text-brand-deep">{row.label}</span>
                        <span className="font-bold tabular-nums text-brand-deep" aria-label={`${row.count} accounts`}>
                          {row.count}
                        </span>
                      </div>
                      <div
                        className={`h-2.5 rounded-full overflow-hidden ${row.trackClass}`}
                        role="meter"
                        aria-valuenow={row.count}
                        aria-valuemin={0}
                        aria-valuemax={accountMax}
                        aria-label={`${row.label}: ${row.count}`}
                      >
                        <div
                          className={`h-full rounded-full ${row.barClass} transition-[width] duration-500 ease-out`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end text-xs">
            <button
              type="button"
              onClick={() => onTabChange('kyc')}
              className="text-brand-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open KYC Queue</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
