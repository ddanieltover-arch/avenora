/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Double-Entry Ledger Explorer & Simulator
 */

import React, { useState, useEffect } from 'react';
import { useCustomerWalletScope } from '../hooks/useCustomerWalletScope.ts';
import { getCurrency } from '../domain/money/Currency.ts';
import {
  BookOpen,
  CheckCircle2,
  AlertOctagon,
  ArrowRightLeft,
  FileText,
  DollarSign,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

interface AccountBalance {
  account: {
    id: string;
    accountNumber: string;
    name: string;
    type: string;
    classification: string;
    currency: string;
  };
  debitMinor: string;
  creditMinor: string;
  netBalanceMinor: string;
  formattedBalance: string;
}

interface JournalEntryLine {
  accountId: string;
  direction: 'DEBIT' | 'CREDIT';
  amountMinor: string;
  description?: string;
}

interface JournalEntry {
  id: string;
  transactionId: string;
  entrySequence: number;
  currency: string;
  narration: string;
  postedAt: string;
  lines: JournalEntryLine[];
}

export const LedgerExplorer: React.FC = () => {
  const { primaryFiat, fiatCurrencyCodes } = useCustomerWalletScope();

  const [summary, setSummary] = useState<{
    totalAccounts: number;
    totalEntries: number;
    globalDebitsMinor: string;
    globalCreditsMinor: string;
    isBalanced: boolean;
    imbalanceMinor: string;
    accountBalances: AccountBalance[];
  } | null>(null);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'accounts' | 'entries' | 'post'>('accounts');
  const [loading, setLoading] = useState(false);

  // Simulation form states
  const [simCurrency, setSimCurrency] = useState(primaryFiat);
  const [simNarration, setSimNarration] = useState('Customer Internal Savings Allocation');
  const [simDebitAccount, setSimDebitAccount] = useState('acc_safeguarding_cash_usd');
  const [simCreditAccount, setSimCreditAccount] = useState('acc_equity_reserve_usd');
  const [simAmountCents, setSimAmountCents] = useState('50.00');
  const [simulateImbalance, setSimulateImbalance] = useState(false);
  const [postResult, setPostResult] = useState<{
    success: boolean;
    title: string;
    message: string;
    details?: unknown;
  } | null>(null);

  const loadLedgerData = async () => {
    setLoading(true);
    try {
      const [sumRes, entRes] = await Promise.all([
        fetch('/api/v1/ledger/summary'),
        fetch('/api/v1/ledger/entries'),
      ]);
      const sumJson = await sumRes.json();
      const entJson = await entRes.json();
      setSummary(sumJson);
      setEntries(entJson.entries || []);
    } catch (err) {
      console.error('Failed to load ledger data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedgerData();
  }, []);

  useEffect(() => {
    setSimCurrency(primaryFiat);
  }, [primaryFiat]);

  const handleSimulatePosting = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostResult(null);

    // Convert decimal to cents
    const rawCents = Math.round(parseFloat(simAmountCents) * 100);
    const debitCents = rawCents;
    // If simulateImbalance is true, we intentionally introduce a 1-cent discrepancy to test the invariant guard!
    const creditCents = simulateImbalance ? rawCents - 1 : rawCents;

    const payload = {
      transactionId: `tx_sim_${Date.now()}`,
      currency: simCurrency,
      narration: simNarration,
      lines: [
        {
          accountId: simDebitAccount,
          direction: 'DEBIT',
          amountMinor: debitCents.toString(),
          description: 'Test debit leg',
        },
        {
          accountId: simCreditAccount,
          direction: 'CREDIT',
          amountMinor: creditCents.toString(),
          description: simulateImbalance
            ? 'Test credit leg (tampered imbalance -1 cent)'
            : 'Test credit leg',
        },
      ],
    };

    try {
      const response = await fetch('/api/v1/ledger/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setPostResult({
          success: true,
          title: 'Journal Entry Posted Immutably',
          message: `Balanced entry #${data.entry.id} recorded with 0 imbalance.`,
          details: data,
        });
        loadLedgerData();
      } else {
        setPostResult({
          success: false,
          title: data.title || 'Posting Rejected by Ledger Guard',
          message: data.detail || 'The entry violated accounting invariants.',
          details: data,
        });
      }
    } catch (err) {
      setPostResult({
        success: false,
        title: 'Network / Client Error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Title & Mathematical Invariant Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Double-Entry Financial Ledger</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Strict debit/credit parity. Stored in zero-float integer minor units (BigInt) with immutable audit history.
          </p>
        </div>

        {/* Global Invariant Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold ${
              summary?.isBalanced
                ? 'bg-brand-accent-light0/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {summary?.isBalanced ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            )}
            <span>
              {summary?.isBalanced
                ? 'INVARIANT PRESERVED: SUM(DEBITS) === SUM(CREDITS)'
                : `IMBALANCE DETECTED: ${summary?.imbalanceMinor} MINOR UNITS`}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'accounts'
              ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Chart of Accounts ({summary?.accountBalances?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('entries')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'entries'
              ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Immutable Journal Entries ({entries.length})
        </button>
        <button
          onClick={() => setActiveTab('post')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'post'
              ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Ledger invariant testing
        </button>
      </div>

      {/* Tab 1: Chart of Accounts */}
      {activeTab === 'accounts' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Account Number</th>
                <th className="py-2.5 px-3 font-semibold">Account Name</th>
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold">Classification</th>
                <th className="py-2.5 px-3 font-semibold text-right">Debits (Minor)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Credits (Minor)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Net Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {summary?.accountBalances.map((item) => (
                <tr key={item.account.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 text-cyan-400">{item.account.accountNumber}</td>
                  <td className="py-2.5 px-3 font-sans text-white">{item.account.name}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.account.type === 'ASSET'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : item.account.type === 'LIABILITY'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : item.account.type === 'EQUITY'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-brand-accent-light0/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {item.account.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">
                    {item.account.classification}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{item.debitMinor}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{item.creditMinor}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-white">
                    {item.formattedBalance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Immutable Journal Entries */}
      {activeTab === 'entries' && (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-cyan-400">{entry.id}</span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-xs text-white font-medium">{entry.narration}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Tx: {entry.transactionId} | Posted: {new Date(entry.postedAt).toLocaleString()}
                </div>
              </div>

              {/* Lines */}
              <div className="space-y-1 font-mono text-xs">
                {entry.lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/50"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          line.direction === 'DEBIT'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-brand-accent-light0/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {line.direction}
                      </span>
                      <span className="text-slate-300">{line.accountId}</span>
                      {line.description && (
                        <span className="text-slate-500 text-[11px] font-sans">
                          ({line.description})
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-white">
                      {line.amountMinor} {entry.currency} minor units
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Interactive invariant test */}
      {activeTab === 'post' && (
        <form onSubmit={handleSimulatePosting} className="space-y-4 max-w-2xl">
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-300 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Interactive Double-Entry Guard Test</p>
              <p className="text-slate-300 mt-0.5">
                Test submitting a balanced entry ($50.00 debit = $50.00 credit) or toggle
                &quot;Introduce 1-cent imbalance&quot; to test how Avenora&apos;s server-side engine
                instantly rejects invalid financial commands with RFC 7807 Problem Details.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Currency</label>
              <select
                value={simCurrency}
                onChange={(e) => setSimCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                {fiatCurrencyCodes.map((code) => {
                  const def = getCurrency(code);
                  return (
                    <option key={code} value={code}>
                      {code} — {def.name} ({def.minorUnits} minor units)
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Monetary Amount ({getCurrency(simCurrency).symbol})
              </label>
              <input
                type="text"
                value={simAmountCents}
                onChange={(e) => setSimAmountCents(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                placeholder="50.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Narration</label>
            <input
              type="text"
              value={simNarration}
              onChange={(e) => setSimNarration(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Debit Account</label>
              <select
                value={simDebitAccount}
                onChange={(e) => setSimDebitAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              >
                <option value="acc_safeguarding_cash_usd">Safeguarding cash vault (USD)</option>
                <option value="acc_equity_reserve_usd">Tier-1 capital reserve (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Credit Account</label>
              <select
                value={simCreditAccount}
                onChange={(e) => setSimCreditAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              >
                <option value="acc_fee_revenue_fx">Platform fee revenue</option>
              </select>
            </div>
          </div>

          {/* Tamper checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="tamperCheck"
              checked={simulateImbalance}
              onChange={(e) => setSimulateImbalance(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-rose-500 focus:ring-rose-500"
            />
            <label htmlFor="tamperCheck" className="text-xs text-rose-300 font-medium cursor-pointer">
              Introduce 1-cent imbalance (tests automatic server rejection)
            </label>
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition shadow-lg shadow-cyan-950"
          >
            Submit Journal Entry to Engine
          </button>

          {/* Feedback */}
          {postResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 mt-4 ${
                postResult.success
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {postResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                )}
                <span>{postResult.title}</span>
              </div>
              {postResult.details != null && (
                <pre className="p-2.5 rounded bg-slate-950 text-[11px] font-mono overflow-x-auto text-slate-400">
                  {JSON.stringify(postResult.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
};
