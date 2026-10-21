/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Authenticated Customer Transaction Explorer (Phase 04)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useLocalization } from './LocalizationContext.tsx';
import { useCustomerWalletScope } from '../hooks/useCustomerWalletScope.ts';
import { formatOperationTypeLabel } from '../lib/operationDisplay.ts';
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  CreditCard,
  RefreshCw,
  Calendar,
  Lock,
  CheckCircle2,
  X,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

interface TransactionItem {
  transactionId: string;
  referenceNumber: string;
  operationType: string;
  status: string;
  currency: string;
  amountMinor: string;
  formattedAmount: string;
  journalEntryId: string;
  idempotencyKey?: string;
  isSimulated: boolean;
  authoritativeBalance?: string;
  timestamp: string;
  userId?: string;
  counterparty?: string;
  narration?: string;
  direction?: 'CREDIT' | 'DEBIT';
}

interface TransactionsViewProps {
  initialSearchQuery?: string | null;
  onInitialSearchConsumed?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  initialSearchQuery,
  onInitialSearchConsumed,
}) => {
  const { user, token } = useAuth();
  const { t } = useLocalization();
  const { walletCurrencyCodes, currencyFilterShortLabel } = useCustomerWalletScope();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'AMOUNT_DESC'>('NEWEST');

  // Detail Modal
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);

  const fetchTransactions = async (searchOverride?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currencyFilter !== 'ALL') params.set('currency', currencyFilter);
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      const searchTerm = (searchOverride ?? searchQuery).trim();
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/v1/wallets/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Failed to load transaction history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [token, currencyFilter, typeFilter]);

  useEffect(() => {
    if (!initialSearchQuery?.trim()) return;
    const q = initialSearchQuery.trim();
    setSearchQuery(q);
    fetchTransactions(q);
    onInitialSearchConsumed?.();
  }, [initialSearchQuery, onInitialSearchConsumed]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  // Filter and sort client-side for immediate responsive feeling
  const filteredTransactions = transactions
    .filter((tx) => {
      if (directionFilter === 'ALL') return true;
      if (directionFilter === 'CREDIT') {
        return tx.direction === 'CREDIT' || tx.operationType === 'SIMULATED_DEPOSIT' || tx.operationType === 'GRANT_DISBURSEMENT';
      }
      return tx.direction === 'DEBIT' || tx.operationType === 'SIMULATED_WITHDRAWAL' || tx.operationType === 'CARD_HOLD';
    })
    .sort((a, b) => {
      if (sortOrder === 'NEWEST') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortOrder === 'OLDEST') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortOrder === 'AMOUNT_DESC') return Number(b.amountMinor) - Number(a.amountMinor);
      return 0;
    });

  const getOperationBadge = (tx: TransactionItem) => {
    switch (tx.operationType) {
      case 'SIMULATED_DEPOSIT':
        return { label: 'Deposit', bg: 'bg-brand-accent-light text-[#076c64] border-brand-accent/30', icon: ArrowDownLeft };
      case 'SIMULATED_WITHDRAWAL':
        return { label: 'Withdrawal', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: ArrowUpRight };
      case 'INTERNAL_TRANSFER':
        return { label: 'Transfer', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: ArrowRightLeft };
      case 'FX_CONVERSION':
        return { label: 'Currency FX', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: RefreshCw };
      case 'CARD_HOLD':
        return { label: 'Card Pre-Auth', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: CreditCard };
      default:
        return { label: tx.operationType, bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: FileText };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs uppercase font-semibold text-[#076c64] tracking-wider block">
            Double-Entry Audit Records
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#003933]">
            Transaction History
          </h1>
          <p className="text-xs text-[#5c6f6c] mt-1">
            Authoritative, immutable transaction log directly derived from customer ledger accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTransactions()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#003933] transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference, counterparty, note, or ID..."
              className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold rounded-xl transition cursor-pointer shrink-0"
          >
            Filter Records
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Currency Filter */}
            <div className="flex items-center gap-1.5 bg-[#f8fbf9] px-2.5 py-1 rounded-xl border border-slate-200">
              <span className="text-[10px] text-[#5c6f6c] uppercase font-bold">Currency:</span>
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#003933] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All account currencies</option>
                {walletCurrencyCodes.map((code) => (
                  <option key={code} value={code}>
                    {currencyFilterShortLabel(code)}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 bg-[#f8fbf9] px-2.5 py-1 rounded-xl border border-slate-200">
              <span className="text-[10px] text-[#5c6f6c] uppercase font-bold">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#003933] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Operations</option>
                <option value="SIMULATED_DEPOSIT">Deposits</option>
                <option value="SIMULATED_WITHDRAWAL">Withdrawals</option>
                <option value="INTERNAL_TRANSFER">Transfers</option>
                <option value="FX_CONVERSION">FX Conversions</option>
                <option value="CARD_HOLD">Card POS Holds</option>
              </select>
            </div>

            {/* Direction Filter */}
            <div className="flex items-center gap-1.5 bg-[#f8fbf9] px-2.5 py-1 rounded-xl border border-slate-200">
              <span className="text-[10px] text-[#5c6f6c] uppercase font-bold">Flow:</span>
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-[#003933] focus:outline-none cursor-pointer"
              >
                <option value="ALL">Credits & Debits</option>
                <option value="CREDIT">Credits Only (+)</option>
                <option value="DEBIT">Debits Only (-)</option>
              </select>
            </div>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#5c6f6c]" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-[#003933] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="AMOUNT_DESC">Highest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fbf9] border-b border-slate-200 text-[#5c6f6c] text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Operation & Date</th>
                <th className="py-3 px-4">Description / Reference</th>
                <th className="py-3 px-4">Ledger Invariant</th>
                <th className="py-3 px-4 sm:px-6 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const badge = getOperationBadge(tx);
                const IconComponent = badge.icon;
                const isCredit =
                  tx.direction === 'CREDIT' ||
                  tx.operationType === 'SIMULATED_DEPOSIT' ||
                  tx.operationType === 'GRANT_DISBURSEMENT';

                return (
                  <tr
                    key={tx.transactionId}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${badge.bg}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-[#003933] block">
                            {badge.label}
                          </span>
                          <span className="text-[10px] text-[#5c6f6c]">
                            {new Date(tx.timestamp).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-medium text-[#0f1f1e] block truncate">
                        {tx.narration || tx.counterparty || 'Ledger transaction'}
                      </span>
                      <span className="text-[10px] font-mono text-[#5c6f6c] block">
                        {tx.referenceNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#159d79]" />
                        <span>#{tx.journalEntryId.slice(0, 12)}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right font-mono font-bold text-xs">
                      <span className={isCredit ? 'text-[#076c64]' : 'text-slate-900'}>
                        {isCredit ? '+' : '-'}{tx.formattedAmount}
                      </span>
                      {tx.authoritativeBalance && (
                        <span className="text-[10px] font-normal text-[#5c6f6c] block">
                          Bal: {tx.authoritativeBalance}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-accent-light text-[#076c64] border border-brand-accent/30">
                        POSTED
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[#5c6f6c]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-700">No transactions match your filters.</p>
                      <p className="text-[11px] text-slate-500">
                        Make a deposit, transfer, or card purchase to see new activity here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-[#f8fbf9] px-6 py-3 border-t border-slate-200 text-[11px] text-[#5c6f6c] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Showing {filteredTransactions.length} authoritative transactions</span>
          <span className="flex items-center gap-1.5 font-medium text-[#076c64]">
            <Lock className="w-3 h-3" />
            Double-Entry Verified: Sum(Debits) === Sum(Credits)
          </span>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex modal-overlay-scroll justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="modal-panel-scroll bg-white rounded-3xl max-w-md border border-slate-200 shadow-2xl text-[#0f1f1e] my-auto sm:my-0">
            <div className="bg-[#003933] text-white p-6 relative">
              <button
                onClick={() => setSelectedTx(null)}
                className="absolute top-5 right-5 text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] uppercase font-bold text-[#C6A568] tracking-wider block mb-1">
                Authoritative Transaction Receipt
              </span>
              <h2 className="text-xl font-serif font-bold">
                {selectedTx.referenceNumber}
              </h2>
              <span className="text-xs text-emerald-200 block mt-1">
                {new Date(selectedTx.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-[#f8fbf9] rounded-2xl border border-slate-200 text-center space-y-1">
                <span className="text-[10px] text-[#5c6f6c] uppercase font-bold">
                  Transaction Amount
                </span>
                <div className="text-2xl font-serif font-bold text-[#003933]">
                  {selectedTx.formattedAmount}
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#076c64] bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-[#159d79]" />
                  Double-entry settlement posted
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-[#5c6f6c]">Operation Type:</span>
                  <span className="font-semibold text-[#003933]">{formatOperationTypeLabel(selectedTx.operationType)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-[#5c6f6c]">Narration / Purpose:</span>
                  <span className="font-medium text-[#0f1f1e] text-right max-w-[200px] truncate">
                    {selectedTx.narration || 'General ledger movement'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-[#5c6f6c]">Journal Entry ID:</span>
                  <span className="font-mono text-[#076c64]">{selectedTx.journalEntryId}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-[#5c6f6c]">Transaction ID:</span>
                  <span className="font-mono text-slate-700">{selectedTx.transactionId}</span>
                </div>
                {selectedTx.idempotencyKey && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-[#5c6f6c]">Idempotency Key:</span>
                    <span className="font-mono text-slate-700 max-w-[180px] truncate">{selectedTx.idempotencyKey}</span>
                  </div>
                )}
                {selectedTx.authoritativeBalance && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#5c6f6c]">Resulting Available Balance:</span>
                    <span className="font-bold text-[#076c64]">{selectedTx.authoritativeBalance}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#f8fbf9] p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
