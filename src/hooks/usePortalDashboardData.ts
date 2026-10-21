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
  const [error, setError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);

  const currencyKey = useMemo(() => walletCurrencyCodes.join(','), [walletCurrencyCodes]);

  const fetchAll = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    const generation = fetchGenerationRef.current + 1;
    fetchGenerationRef.current = generation;
    setLoading(true);
    setError(null);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [wRes, cRes, lRes, gRes, tRes] = await Promise.all([
        fetch('/api/v1/wallets/me', { headers }),
        fetch('/api/v1/cards', { headers }),
        fetch('/api/v1/loans/applications', { headers }),
        fetch('/api/v1/grants/applications', { headers }),
        fetch('/api/v1/wallets/transactions', { headers }),
      ]);

      if (fetchGenerationRef.current !== generation) {
        return;
      }

      if (wRes.ok) {
        const wData = await wRes.json();
        setWalletsSummary(filterWalletAccounts(wData.wallet?.accounts || [], walletCurrencyCodes));
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        setCardsSummary(cData.cards || []);
      }

      if (lRes.ok) {
        const lData = await lRes.json();
        setLoansSummary(lData.applications || []);
      }

      if (gRes.ok) {
        const gData = await gRes.json();
        setGrantsSummary(gData.applications || []);
      }

      if (tRes.ok) {
        const tData = await tRes.json();
        setTransactions(tData.transactions || []);
      }

      if (!wRes.ok && !tRes.ok) {
        setError('Unable to load account data. Please try again.');
      }
    } catch {
      if (fetchGenerationRef.current === generation) {
        setError('Unable to load account data. Please try again.');
      }
    } finally {
      if (fetchGenerationRef.current === generation) {
        setLoading(false);
      }
    }
  }, [token, currencyKey, walletCurrencyCodes]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, userId]);

  return {
    walletsSummary,
    cardsSummary,
    loansSummary,
    grantsSummary,
    transactions,
    loading,
    error,
    refetch: fetchAll,
  };
}
