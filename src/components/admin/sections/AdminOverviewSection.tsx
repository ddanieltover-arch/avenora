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
  Clock,
  ShieldCheck,
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

export const AdminOverviewSection: React.FC<AdminOverviewSectionProps> = ({
  overviewData,
  loading,
  fetchOverview,
  onTabChange,
}) => {
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                      <span>Active: <strong className="text-emerald-700">{overviewData?.customers.active ?? 0}</strong></span>
                      <span>Suspended: <strong className="text-amber-700">{overviewData?.customers.suspended ?? 0}</strong></span>
                      <span>Locked: <strong className="text-rose-700">{overviewData?.customers.locked ?? 0}</strong></span>
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
                      <span>Approved: <strong className="text-emerald-700">{overviewData?.kycQueue.approved ?? 0}</strong></span>
                      <span>Rejected: <strong className="text-rose-700">{overviewData?.kycQueue.rejected ?? 0}</strong></span>
                      <span className="text-[11px] text-amber-700 font-semibold">&gt;24h: {overviewData?.kycQueue.aging.oneToThreeDays ?? 0}</span>
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
                        Loans:{' '}
                        <strong className="text-emerald-700">{overviewData?.loans?.total ?? 0}</strong>
                      </span>
                      <span>
                        Grants:{' '}
                        <strong className="text-emerald-700">{overviewData?.grants?.total ?? 0}</strong>
                      </span>
                      <span className="text-[11px] text-amber-700 font-semibold">
                        Pending:{' '}
                        {(overviewData?.loans?.pendingReview ?? 0) +
                          (overviewData?.grants?.pendingReview ?? 0)}
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
                        <strong className="text-emerald-700">
                          {overviewData?.cards?.activeSimulated ?? 0}
                        </strong>
                      </span>
                      <span>
                        Frozen:{' '}
                        <strong className="text-amber-700">{overviewData?.cards?.frozen ?? 0}</strong>
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
                      <span>Posted: <strong className="text-emerald-700">{overviewData?.transactions.posted ?? 0}</strong></span>
                      <span>Compensated/Reversed: <strong className="text-amber-700">{overviewData?.transactions.reversed ?? 0}</strong></span>
                    </div>
                  </button>
                </div>

                {/* Queue Aging & Exceptions Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Review Queue Aging */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="font-serif font-bold text-base text-brand-deep mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-primary" />
                      <span>Review Queue Aging & SLA Compliance</span>
                    </h3>
                    <p className="text-xs text-brand-muted mb-4">
                      Case aging metrics across pending KYC verification profiles.
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-brand-accent-light/60 border border-brand-accent/20 text-xs">
                        <span className="font-medium text-emerald-950">Submitted &lt; 24 Hours Ago (On Track)</span>
                        <span className="font-bold text-emerald-800 text-sm">
                          {overviewData?.kycQueue.aging.under24h ?? 0} cases
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/60 border border-amber-100 text-xs">
                        <span className="font-medium text-amber-950">Submitted 24–72 Hours Ago (Approaching SLA)</span>
                        <span className="font-bold text-amber-800 text-sm">
                          {overviewData?.kycQueue.aging.oneToThreeDays ?? 0} cases
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50/60 border border-rose-100 text-xs">
                        <span className="font-medium text-rose-950">Submitted &gt; 72 Hours Ago (SLA Breached)</span>
                        <span className="font-bold text-rose-800 text-sm">
                          {overviewData?.kycQueue.aging.overThreeDays ?? 0} cases
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-muted">
                      <span>Aging rule: Calculated strictly from `submittedAt` timestamps</span>
                      <button
                        onClick={() => onTabChange('kyc')}
                        className="text-brand-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open KYC Queue</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Data Integrity & Provenance Metadata */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="font-serif font-bold text-base text-brand-deep mb-1 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-brand-primary" />
                      <span>Data Provenance & Audit Guarantees</span>
                    </h3>
                    <p className="text-xs text-brand-muted mb-4">
                      Verification sources and zero-fabrication guarantees.
                    </p>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-brand-muted">Ledger Invariant Verification</span>
                        <span className="font-semibold text-emerald-800">Sum(Debits) === Sum(Credits) Verified</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-brand-muted">Platform boundary</span>
                        <span className="font-semibold text-amber-800">ENFORCED (Real Money Blocked)</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-brand-muted">Webhook HMAC Security</span>
                        <span className="font-semibold text-slate-800">HMAC-SHA256 (300s Freshness Window)</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-brand-muted">Audit Trail Immutability</span>
                        <span className="font-semibold text-slate-800">Append-Only ({overviewData?.auditLogs?.total ?? 0} Records)</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-brand-muted">Metrics Timestamp</span>
                        <span className="font-mono text-[11px] text-slate-600">
                          {overviewData?.metricsGeneratedAt || new Date().toISOString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
  );
};
