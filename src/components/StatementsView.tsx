/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Monthly Financial Statements Generator (Phase 04)
 */

import React, { useState, useEffect } from 'react';
import { AvenoraLogo } from './branding/AvenoraLogo.tsx';
import { useAuth } from './AuthContext.tsx';
import { useLocalization } from './LocalizationContext.tsx';
import { useCustomerWalletScope } from '../hooks/useCustomerWalletScope.ts';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Lock,
  CheckCircle2,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface StatementData {
  statementId: string;
  period: string;
  currency: string;
  generatedAt: string;
  accountNumber: string;
  startingBalanceMinor: string;
  formattedStartingBalance: string;
  totalCreditsMinor: string;
  formattedTotalCredits: string;
  totalDebitsMinor: string;
  formattedTotalDebits: string;
  endingBalanceMinor: string;
  formattedEndingBalance: string;
  transactionsCount: number;
  transactions: any[];
  isSimulated: boolean;
  legalNotice: string;
}

export const StatementsView: React.FC = () => {
  const { user, token } = useAuth();
  const { t } = useLocalization();
  const { primaryFiat, walletCurrencyCodes, currencyFilterShortLabel } = useCustomerWalletScope();

  const [currency, setCurrency] = useState(primaryFiat);
  const [selectedMonth, setSelectedMonth] = useState('10');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [statement, setStatement] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatement = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/wallets/statements?currency=${currency}&year=${selectedYear}&month=${selectedMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok && data.statement) {
        setStatement(data.statement);
      }
    } catch (err) {
      console.error('Failed to load monthly statement', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrency(primaryFiat);
  }, [primaryFiat]);

  useEffect(() => {
    fetchStatement();
  }, [token, currency, selectedMonth, selectedYear]);

  const handleDownloadCsv = () => {
    if (!statement || !statement.transactions) return;
    const headers = ['Date', 'Transaction ID', 'Reference', 'Operation', 'Direction', 'Amount', 'Currency', 'Narration'];
    const rows = statement.transactions.map((tx: any) => [
      new Date(tx.timestamp).toISOString(),
      tx.transactionId,
      tx.referenceNumber,
      tx.operationType,
      tx.direction || 'DEBIT',
      (Number(tx.amountMinor) / 100).toFixed(2),
      tx.currency,
      `"${(tx.narration || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Avenora_Statement_${currency}_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    if (!statement) return;
    const jsonStr = JSON.stringify(statement, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Avenora_Audit_${currency}_${selectedYear}_${selectedMonth}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs uppercase font-semibold text-[#076c64] tracking-wider block">
            Institutional Accounting
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#003933]">
            Monthly Account Statements
          </h1>
          <p className="text-xs text-[#5c6f6c] mt-1">
            Generate and export itemized double-entry statements with exact starting, movement, and closing balances.
          </p>
        </div>

        {/* Statement Selectors & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#003933] focus:outline-none cursor-pointer"
          >
            {walletCurrencyCodes.map((code) => (
              <option key={code} value={code}>
                {currencyFilterShortLabel(code)}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#003933] focus:outline-none cursor-pointer"
          >
            <option value="10">October 2026</option>
            <option value="9">September 2026</option>
            <option value="8">August 2026</option>
            <option value="7">July 2026</option>
            <option value="6">June 2026</option>
          </select>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#003933] hover:bg-slate-50 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            disabled={!statement}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#076c64] hover:bg-[#003933] text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Statement Document Preview */}
      {statement && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 space-y-8 print:border-none print:shadow-none">
          {/* Statement Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <AvenoraLogo size="sm" className="rounded-xl" />
                <span className="font-serif font-bold text-xl text-[#003933]">
                  AVENORA FINTECH
                </span>
              </div>
              <p className="text-[11px] text-[#5c6f6c]">
                Institutional custody & double-entry ledger
              </p>
              <div className="text-[11px] text-slate-500 space-y-0.5">
                <p>Account Holder: <strong className="text-[#0f1f1e]">{user?.fullName || '—'}</strong></p>
                <p>Account Number: <strong className="text-[#0f1f1e] font-mono">{statement.accountNumber}</strong></p>
              </div>
            </div>

            <div className="sm:text-right space-y-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-[#C6A568] tracking-widest block">
                Official Account Statement
              </span>
              <p className="font-mono font-bold text-sm text-[#003933]">{statement.statementId}</p>
              <p className="text-[11px] text-[#5c6f6c]">Period: <strong>{statement.period}</strong></p>
              <p className="text-[10px] text-[#5c6f6c]">Generated: {new Date(statement.generatedAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Balance Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#f8fbf9] rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#5c6f6c] block">
                Starting Balance
              </span>
              <span className="text-base font-serif font-bold text-[#003933] block">
                {statement.formattedStartingBalance}
              </span>
            </div>

            <div className="p-4 bg-brand-accent-light/60 rounded-2xl border border-brand-accent/20 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#076c64] block flex items-center gap-1">
                <ArrowDownLeft className="w-3 h-3 text-[#159d79]" />
                Total Credits (+)
              </span>
              <span className="text-base font-serif font-bold text-[#076c64] block">
                {statement.formattedTotalCredits}
              </span>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-800 block flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-amber-600" />
                Total Debits (-)
              </span>
              <span className="text-base font-serif font-bold text-amber-900 block">
                {statement.formattedTotalDebits}
              </span>
            </div>

            <div className="p-4 bg-[#003933] text-white rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                Closing Balance
              </span>
              <span className="text-base font-serif font-bold text-white block">
                {statement.formattedEndingBalance}
              </span>
            </div>
          </div>

          {/* Itemized Transactions Table */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-sm text-[#003933] flex items-center justify-between">
              <span>Itemized Ledger Postings ({statement.transactionsCount})</span>
              <span className="text-[10px] font-mono text-[#5c6f6c]">Currency: {statement.currency}</span>
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#f8fbf9] border-b border-slate-200 text-[#5c6f6c] text-[10px] uppercase font-semibold">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Reference</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-right">Debit (-)</th>
                    <th className="py-2.5 px-4 text-right">Credit (+)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {statement.transactions.map((tx: any, idx: number) => {
                    const isCredit = tx.direction === 'CREDIT' || tx.operationType === 'SIMULATED_DEPOSIT';
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 text-[#5c6f6c]">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[10px] text-[#003933]">
                          {tx.referenceNumber}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-[#0f1f1e] max-w-xs truncate">
                          {tx.narration || tx.counterparty || tx.operationType}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-amber-800">
                          {!isCredit ? tx.formattedAmount : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#076c64] font-semibold">
                          {isCredit ? tx.formattedAmount : '—'}
                        </td>
                      </tr>
                    );
                  })}

                  {statement.transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[#5c6f6c] italic">
                        No transactions recorded for this currency during the selected monthly cycle.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statement Legal Disclaimer */}
          <div className="p-4 rounded-2xl bg-[#f8fbf9] border border-slate-200 text-[10px] text-[#5c6f6c] space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-[#003933]">
              <Lock className="w-3.5 h-3.5 text-[#076c64]" />
              <span>{statement.legalNotice}</span>
            </div>
            <p>
              This statement is generated from your authoritative ledger balances and transaction history. Deposit insurance and product availability depend on your region and account type—see your account agreements for details.
            </p>
          </div>

          {/* Secondary Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 print:hidden">
            <button
              onClick={handleExportJson}
              className="text-xs font-semibold text-[#076c64] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Raw Ledger Verification (JSON)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
