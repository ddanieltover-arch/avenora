/**
 * @license Apache-2.0
 * Aggregated customer portal data for dashboard overview.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WalletAccountLike } from './useCustomerWalletScope.ts';

export interface PortalTransactionSummary {
  transactionId: string;
  referenceNumber: string;
  operationType: string;
  status: string;
  currency: string;
  amountMinor: string;
  formattedAmount: string;
  timestamp: string;
  counterparty?: string;
  narration?: string;
  direction?: 'CREDIT' | 'DEBIT';
  isSimulated: boolean;
}

export interface PortalCardSummary {
  id?: string;
  lastFour?: string;
  maskedPan?: string;
  type?: string;
  cardType?: string;
  currency?: string;
  status?: string;
  formattedDailyLimit?: string;
  dailySpendLimitMinor?: string;
  dailyLimitMinor?: string;
}

export interface PortalApplicationSummary {
  id: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

function filterWalletAccounts<T extends WalletAccountLike>(
  accounts: T[],
  allowedCurrencyCodes: readonly string[],
): T[] {
  const allowed = new Set(allowedCurrencyCodes.map((c) => c.toUpperCase()));
  return accounts.filter((a) => {
    const code = (a.currency || a.currencyCode || '').toUpperCase();
    return allowed.has(code);
  });
}

interface UsePortalDashboardDataOptions {
  token: string | null;
  /** Stable list from useCustomerWalletScope (country-scoped currencies). */
  walletCurrencyCodes: readonly string[];
  /** Refetch when the signed-in customer changes. */
  userId?: string | null;
}

export function usePortalDashboardData({
  token,
  walletCurrencyCodes,
  userId,
}: UsePortalDashboardDataOptions) {
  const [walletsSummary, setWalletsSummary] = useState<WalletAccountLike[]>([]);
  const [cardsSummary, setCardsSummary] = useState<PortalCardSummary[]>([]);
  const [loansSummary, setLoansSummary] = useState<PortalApplicationSummary[]>([]);
  const [grantsSummary, setGrantsSummary] = useState<PortalApplicationSummary[]>([]);
  const [transactions, setTransactions] = useState<PortalTransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);

  const currencyKey = useMemo(() => walletCurrencyCodes.join(','), [walletCurrencyCodes]);

  const fetchAll = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const soft = Boolean(opts?.soft && hasLoadedOnceRef.current);
      const generation = fetchGenerationRef.current + 1;
      fetchGenerationRef.current = generation;
      if (soft) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const fetchOpts: RequestInit = { headers, credentials: 'include', cache: 'no-store' };
        const [wRes, cRes, lRes, gRes, tRes] = await Promise.all([
          fetch('/api/v1/wallets/me', fetchOpts),
          fetch('/api/v1/cards', fetchOpts),
          fetch('/api/v1/loans/applications', fetchOpts),
          fetch('/api/v1/grants/applications', fetchOpts),
          fetch('/api/v1/wallets/transactions', fetchOpts),
        ]);

        if (fetchGenerationRef.current !== generation) {
          return;
        }

        const failures: string[] = [];

        if (wRes.ok) {
          const wData = await wRes.json();
          setWalletsSummary(filterWalletAccounts(wData.wallet?.accounts || [], walletCurrencyCodes));
        } else {
          setWalletsSummary([]);
          failures.push('wallet');
        }

        if (cRes.ok) {
          const cData = await cRes.json();
          setCardsSummary(cData.cards || []);
        } else {
          setCardsSummary([]);
          failures.push('cards');
        }

        if (lRes.ok) {
          const lData = await lRes.json();
          setLoansSummary(lData.applications || []);
        } else {
          setLoansSummary([]);
          failures.push('loans');
        }

        if (gRes.ok) {
          const gData = await gRes.json();
          setGrantsSummary(gData.applications || []);
        } else {
          setGrantsSummary([]);
          failures.push('grants');
        }

        if (tRes.ok) {
          const tData = await tRes.json();
          setTransactions(tData.transactions || []);
        } else {
          setTransactions([]);
          failures.push('transactions');
        }

        if (failures.length > 0) {
          setError(
            failures.includes('wallet')
              ? 'Unable to load account data. Please try again.'
              : `Unable to load ${failures.join(', ')}. Please try again.`,
          );
        }
        hasLoadedOnceRef.current = true;
      } catch {
        if (fetchGenerationRef.current === generation) {
          setError('Unable to load account data. Please try again.');
        }
      } finally {
        if (fetchGenerationRef.current === generation) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [token, currencyKey, walletCurrencyCodes],
  );

  useEffect(() => {
    void fetchAll({ soft: false });
  }, [fetchAll, userId]);

  // Refetch when the tab becomes visible again (e.g. after admin posts funds).
  useEffect(() => {
    if (!token) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchAll({ soft: true });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [token, fetchAll]);

  // Poll while any transaction is still pending review.
  const hasPendingReview = useMemo(
    () => transactions.some((tx) => tx.status === 'PENDING_REVIEW'),
    [transactions],
  );

  useEffect(() => {
    if (!token || !hasPendingReview) return;
    const id = window.setInterval(() => {
      void fetchAll({ soft: true });
    }, 8000);
    return () => window.clearInterval(id);
  }, [token, hasPendingReview, fetchAll]);

  return {
    walletsSummary,
    cardsSummary,
    loansSummary,
    grantsSummary,
    transactions,
    loading,
    refreshing,
    error,
    refetch: () => fetchAll({ soft: false }),
    softRefetch: () => fetchAll({ soft: true }),
  };
}
