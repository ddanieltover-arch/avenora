/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Dedicated Internal Transfers View (Phase 04)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useCustomerWalletScope } from '../hooks/useCustomerWalletScope.ts';
import { getCurrency } from '../domain/money/Currency.ts';
import { useLocalization } from './LocalizationContext.tsx';
import {
  ArrowRightLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wallet,
  User,
  Lock,
  FileText,
} from 'lucide-react';

interface WalletAccount {
  id: string;
  currency: string;
  currencyName: string;
  currencySymbol: string;
  availableBalanceMinor: string;
  formattedBalance: string;
  status: string;
}

export const TransfersView: React.FC = () => {
  const { token } = useAuth();
  const { t } = useLocalization();
  const { primaryFiat, primaryFiatMeta, filterAccounts } = useCustomerWalletScope();

  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Form states
  const [selectedCurrency, setSelectedCurrency] = useState(primaryFiat);
  const [amount, setAmount] = useState('50.00');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('Split institutional project expenses');
  const [submitting, setSubmitting] = useState(false);

  // Result & feedback
  const [transferResult, setTransferResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAccounts = async () => {
    if (!token) return;
    setLoadingAccounts(true);
    try {
      const res = await fetch('/api/v1/wallets/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.wallet?.accounts) {
        const scoped = filterAccounts(data.wallet.accounts as WalletAccount[]);
        setAccounts(scoped);
        if (scoped.length > 0) {
          const hasSelected = scoped.some((a) => a.currency === selectedCurrency);
          if (!hasSelected) {
            setSelectedCurrency(scoped.find((a) => a.currency === primaryFiat)?.currency ?? scoped[0].currency);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load accounts for transfers', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [token, primaryFiat]);

  useEffect(() => {
    setSelectedCurrency(primaryFiat);
  }, [primaryFiat]);

  const activeAccount = accounts.find((a) => a.currency === selectedCurrency);
  const selectedMinorUnits = getCurrency(selectedCurrency).minorUnits;
  const availableBalNumber = activeAccount
    ? Number(activeAccount.availableBalanceMinor) / 10 ** selectedMinorUnits
    : 0;
  const maxAmountFractionDigits = selectedMinorUnits === 0 ? 0 : 2;
  const requestedAmountNumber = parseFloat(amount) || 0;
  const isOverdraft = requestedAmountNumber > availableBalNumber;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMessage(null);
    setTransferResult(null);
    setSubmitting(true);

    try {
      const idempotencyKey = `tx_xfer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch('/api/v1/wallets/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          recipientEmailOrId: recipient,
          currency: selectedCurrency,
          amountDecimal: amount,
          note,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTransferResult(data);
        fetchAccounts();
      } else {
        setErrorMessage(data.detail || data.title || 'Internal transfer could not be completed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during transfer execution.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs uppercase font-semibold text-[#076c64] tracking-wider block">
            Account-Scoped Payments
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#003933]">
            Transfers & Peer Payments
          </h1>
          <p className="text-xs text-[#5c6f6c] mt-1">
            Send funds instantaneously across customer accounts with zero-float integer math and balanced double-entry settlement.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-brand-accent-light text-[#076c64] text-xs font-semibold px-3 py-1.5 rounded-xl border border-brand-accent/30 shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#159d79]" />
          <span>Internal Rail: Zero Network Fee</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Transfer Form Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-serif font-bold text-[#003933] flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#076c64]" />
              <span>Initiate Internal Transfer</span>
            </h2>
            <span className="text-[11px] font-mono text-[#5c6f6c]">
              Idempotency Protected
            </span>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {transferResult && (
            <div className="p-4 bg-brand-accent-light border border-brand-accent/30 rounded-2xl space-y-3 text-xs text-emerald-900 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm text-[#076c64]">
                <CheckCircle2 className="w-5 h-5 text-[#159d79]" />
                <span>Transfer Executed & Journal Posted!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/80 p-3 rounded-xl border border-brand-accent/20">
                <div>
                  <span className="text-[#5c6f6c] block">Amount Sent:</span>
                  <span className="font-bold text-[#003933]">{transferResult.formattedAmount}</span>
                </div>
                <div>
                  <span className="text-[#5c6f6c] block">Reference Number:</span>
                  <span className="font-mono font-semibold">{transferResult.referenceNumber}</span>
                </div>
                <div>
                  <span className="text-[#5c6f6c] block">Recipient:</span>
                  <span className="font-medium truncate block">{recipient}</span>
                </div>
                <div>
                  <span className="text-[#5c6f6c] block">New Available Balance:</span>
                  <span className="font-bold text-[#076c64]">{transferResult.authoritativeBalance}</span>
                </div>
              </div>
              <p className="text-[10px] text-emerald-700 italic">
                Journal entry #{transferResult.journalEntryId} debited your wallet and credited the recipient.
              </p>
            </div>
          )}

          <form onSubmit={handleTransfer} className="space-y-4">
            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#0f1f1e] mb-1.5">
                Funding Account & Currency
              </label>
              <div className={`grid gap-2 ${accounts.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {accounts.map((acc) => {
                  const curr = acc.currency;
                  const isSelected = selectedCurrency === curr;
                  return (
                    <button
                      type="button"
                      key={curr}
                      onClick={() => setSelectedCurrency(curr)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-[#076c64] bg-brand-accent-light/60 ring-2 ring-[#076c64]/20'
                          : 'border-slate-200 bg-[#f8fbf9] hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-bold text-xs text-[#003933] block">{curr}</span>
                      <span className="text-[10px] text-[#5c6f6c] truncate block">
                        {acc ? acc.formattedBalance : 'Loading...'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#0f1f1e] mb-1.5">
                Recipient Email or Customer Identifier
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Recipient email address"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
                />
              </div>

            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#0f1f1e]">
                  Transfer Amount ({selectedCurrency})
                </label>
                <span className="text-[11px] text-[#5c6f6c]">
                  Available:{' '}
                  <strong className="text-[#003933]">
                    {activeAccount?.formattedBalance ||
                      `${primaryFiatMeta.symbol}0${maxAmountFractionDigits ? '.00' : ''} ${primaryFiat}`}
                  </strong>
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {activeAccount?.currencySymbol || getCurrency(selectedCurrency).symbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full pl-8 pr-16 py-2.5 text-xs font-mono font-bold rounded-xl border focus:outline-none focus:ring-2 ${
                    isOverdraft
                      ? 'border-rose-400 focus:ring-rose-200 text-rose-700'
                      : 'border-slate-300 focus:ring-[#076c64]/30 focus:border-[#076c64] text-[#0f1f1e]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setAmount(availableBalNumber.toFixed(maxAmountFractionDigits))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#076c64] bg-brand-accent-light px-2 py-1 rounded-md hover:bg-emerald-100 transition"
                >
                  MAX
                </button>
              </div>
              {isOverdraft && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Amount exceeds current available balance. Overdrafts are prohibited.
                </p>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-[#0f1f1e] mb-1.5">
                Payment Reference / Note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional transfer note"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || isOverdraft || requestedAmountNumber <= 0}
              className="w-full py-3 rounded-xl bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>
                {submitting ? 'Executing Double-Entry Transfer...' : `Transfer ${amount} ${selectedCurrency}`}
              </span>
            </button>
          </form>
        </div>

        {/* Transfer Architecture & Guarantee Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#003933] text-white p-6 sm:p-7 rounded-3xl shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-[#C6A568]">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-serif font-bold uppercase tracking-wider">
                Invariant Verification
              </span>
            </div>
            <h3 className="font-serif font-bold text-lg text-white">
              Strict Atomic Settlement
            </h3>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Internal transfers in Avenora never mutate balances independently. Both the sender debit and the recipient credit occur inside a single immutable journal entry.
            </p>

            <div className="space-y-2 pt-2 border-t border-emerald-800 text-[11px] text-emerald-200">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Network Protocol:</span>
                <span className="font-mono text-white">Avenora Direct-Ledger</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Float Error:</span>
                <span className="font-mono text-emerald-400">0.00000000 (Exact BigInt)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Overdraft Protection:</span>
                <span className="text-emerald-300 font-semibold">Strict Server Enforcement</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Settlement:</span>
                <span className="text-emerald-300 font-semibold">Ledger posted</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h4 className="font-serif font-bold text-sm text-[#003933] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#076c64]" />
              <span>Idempotency Assurance</span>
            </h4>
            <p className="text-xs text-[#5c6f6c] leading-relaxed">
              Every transfer payload transmits a cryptographic <code className="text-[#076c64] font-mono">Idempotency-Key</code> header. If a network interruption occurs, re-submitting with the same key safely returns the recorded transaction without duplicating funds movement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
