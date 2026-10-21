/**
 * @license Apache-2.0
 * Avenora — mobile transaction insights (period totals & chart)
 */

import React, { useMemo, useState } from 'react';
import type { PortalTransactionSummary } from '../../../hooks/usePortalDashboardData.ts';
import { formatOperationTypeLabel } from '../../../lib/operationDisplay.ts';

type PeriodKey = 'week' | 'month' | 'year';

interface MobileTransactionAnalyticsProps {
  transactions: PortalTransactionSummary[];
  loading?: boolean;
}

function inPeriod(date: Date, period: PeriodKey, now: Date): boolean {
  const start = new Date(now);
  if (period === 'week') {
    start.setDate(now.getDate() - 7);
    return date >= start;
  }
  if (period === 'month') {
    start.setMonth(now.getMonth() - 1);
    return date >= start;
  }
  start.setFullYear(now.getFullYear() - 1);
  return date >= start;
}

export const MobileTransactionAnalytics: React.FC<MobileTransactionAnalyticsProps> = ({
  transactions,
  loading,
}) => {
  const [period, setPeriod] = useState<PeriodKey>('month');

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => inPeriod(new Date(tx.timestamp), period, now));
  }, [transactions, period]);

  const totals = useMemo(() => {
    let incoming = 0;
    let outgoing = 0;
    for (const tx of filtered) {
      const minor = Math.abs(Number(tx.amountMinor) || 0);
      const isCredit =
        tx.direction === 'CREDIT' ||
        tx.operationType === 'SIMULATED_DEPOSIT' ||
        tx.operationType === 'GRANT_DISBURSEMENT';
      if (isCredit) incoming += minor;
      else outgoing += minor;
    }
    return { incoming, outgoing, count: filtered.length };
  }, [filtered]);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of filtered) {
      const label = formatOperationTypeLabel(tx.operationType);
      map.set(label, (map.get(label) ?? 0) + Math.abs(Number(tx.amountMinor) || 0));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [filtered]);

  const maxBar = Math.max(...byType.map(([, v]) => v), 1);

  const periodLabels: Record<PeriodKey, string> = {
    week: '7 days',
    month: '30 days',
    year: '12 months',
  };

  if (loading) {
    return <div className="h-64 rounded-3xl bg-white/80 animate-pulse" aria-busy="true" />;
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto w-full">
      <div className="flex gap-2" role="tablist" aria-label="Analytics period">
        {(['week', 'month', 'year'] as PeriodKey[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={period === key}
            onClick={() => setPeriod(key)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
              period === key
                ? 'bg-[#075B46] text-white'
                : 'bg-white border border-[#E2E8E4] text-[#68746E]'
            }`}
          >
            {periodLabels[key]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-[#E2E8E4]/80 p-4 shadow-sm">
        <p className="text-xs text-[#68746E]">Activity volume (minor units, all currencies)</p>
        <p className="text-2xl font-serif font-bold text-[#17231F] mt-1 tabular-nums" data-financial-amount="true">
          {totals.count} transactions
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-2xl bg-[#E8F6F2] p-3">
            <p className="text-[10px] font-semibold text-[#075B46] uppercase tracking-wide">Incoming</p>
            <p className="text-lg font-bold text-[#075B46] tabular-nums" data-financial-amount="true">
              {totals.incoming.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-[#68746E] uppercase tracking-wide">Outgoing</p>
            <p className="text-lg font-bold text-[#17231F] tabular-nums" data-financial-amount="true">
              {totals.outgoing.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {byType.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2E8E4]/80 p-6 text-center text-sm text-[#68746E]">
          No transaction data for this period. Try another range or make a simulated transfer.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E2E8E4]/80 p-4 shadow-sm">
          <h3 className="font-serif font-bold text-[#17231F] mb-4">By operation type</h3>
          <ul className="space-y-3" aria-label="Operation type breakdown">
            {byType.map(([label, minor]) => (
              <li key={label}>
                <div className="flex justify-between text-xs mb-1 gap-2">
                  <span className="text-[#17231F] font-medium truncate">{label}</span>
                  <span className="text-[#68746E] tabular-nums shrink-0">{minor.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-[#F1F4F1] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#19A77A]"
                    style={{ width: `${(minor / maxBar) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-[#68746E] mt-4 leading-relaxed">
            Totals are not converted across currencies. Budget categories are not available in Avenora prototype data.
          </p>
        </div>
      )}
    </div>
  );
};
