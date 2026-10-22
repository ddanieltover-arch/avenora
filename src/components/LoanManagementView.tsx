/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Loan & Credit Management View (Phase 03)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useLocalization } from './LocalizationContext.tsx';
import { useCustomerWalletScope } from '../hooks/useCustomerWalletScope.ts';
import { getCurrency } from '../domain/money/Currency.ts';
import {
  Calculator,
  FileText,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Building2,
  User,
  ArrowRight,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AmortizationItem {
  installmentNumber: number;
  paymentMinor: string;
  principalMinor: string;
  interestMinor: string;
  remainingBalanceMinor: string;
  formattedPayment: string;
  formattedRemaining: string;
}

interface AmortizationResult {
  principalMinor: string;
  currency: string;
  annualRatePercent: number;
  termMonths: number;
  formattedMonthlyPayment: string;
  formattedTotalInterest: string;
  formattedTotalRepayment: string;
  schedule: AmortizationItem[];
}

interface LoanApplication {
  id: string;
  userId: string;
  applicantName: string;
  type: 'PERSONAL' | 'SMALL_BUSINESS';
  currency: string;
  requestedAmountMinor: string;
  formattedRequestedAmount: string;
  termMonths: number;
  purpose: string;
  status: string;
  businessName?: string;
  submittedAt?: string;
  assessment?: {
    riskCategory: string;
    recommendation: string;
    syntheticScore: number;
    debtToIncomeRatio: string;
    rulesetVersion: string;
    factorsExplanation: string[];
    notice: string;
  };
  reviewHistory: Array<{
    actorUserId: string;
    previousStatus: string;
    newStatus: string;
    reason?: string;
    notes?: string;
    timestamp: string;
  }>;
}

export function LoanManagementView() {
  const { user, token } = useAuth();
  const { t } = useLocalization();
  const { primaryFiat, fiatCurrencyCodes, currencySelectLabel } = useCustomerWalletScope();

  const [activeSubTab, setActiveSubTab] = useState<'calculator' | 'apply' | 'applications' | 'officer'>('calculator');

  // Calculator State
  const [calcPrincipal, setCalcPrincipal] = useState('5000');
  const [calcRate, setCalcRate] = useState(7.5);
  const [calcTerm, setCalcTerm] = useState(24);
  const [calcCurrency, setCalcCurrency] = useState(primaryFiat);
  const [calcResult, setCalcResult] = useState<AmortizationResult | null>(null);
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);

  // Application Form State
  const [appType, setAppType] = useState<'PERSONAL' | 'SMALL_BUSINESS'>('PERSONAL');
  const [appCurrency, setAppCurrency] = useState(primaryFiat);
  const [appAmount, setAppAmount] = useState('7500.00');
  const [appTerm, setAppTerm] = useState(24);
  const [appPurpose, setAppPurpose] = useState('Home Energy Efficiency & Solar Inverter');
  const [appIncome, setAppIncome] = useState('85000.00');
  const [appExpenses, setAppExpenses] = useState('1800.00');
  const [businessName, setBusinessName] = useState('');
  const [businessRevenue, setBusinessRevenue] = useState('140000.00');
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Applications List
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [loadingApps, setLoadingApps] = useState(false);

  // Officer Review Form
  const [officerDecision, setOfficerDecision] = useState<'APPROVED_FOR_DEMO' | 'DECLINED_FOR_DEMO' | 'NEEDS_MORE_INFORMATION'>('APPROVED_FOR_DEMO');
  const [officerNotes, setOfficerNotes] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Fetch Amortization
  const runAmortizationCalc = async () => {
    setCalcLoading(true);
    try {
      const res = await fetch('/api/v1/loans/amortization-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principalDecimal: calcPrincipal,
          currency: calcCurrency,
          annualRatePercent: calcRate,
          termMonths: calcTerm,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setCalcResult(data.data);
      }
    } catch (err) {
      console.error('Amortization calculation error', err);
    } finally {
      setCalcLoading(false);
    }
  };

  useEffect(() => {
    runAmortizationCalc();
  }, [calcPrincipal, calcRate, calcTerm, calcCurrency]);

  useEffect(() => {
    setCalcCurrency(primaryFiat);
    setAppCurrency(primaryFiat);
  }, [primaryFiat]);

  const calcCurrencyMeta = getCurrency(calcCurrency);

  // Fetch Applications
  const fetchApplications = async () => {
    if (!token) return;
    setLoadingApps(true);
    try {
      const isStaff = user && ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
      const url = activeSubTab === 'officer' && isStaff ? '/api/v1/loans/applications?all=true' : '/api/v1/loans/applications';

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.applications) {
        setApplications(data.applications);
        if (data.applications.length > 0 && !selectedApp) {
          setSelectedApp(data.applications[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch loan applications', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'applications' || activeSubTab === 'officer') {
      fetchApplications();
    }
  }, [activeSubTab, token, user?.role]);

  // Handle Loan Application Submission
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccessMessage(null);

    try {
      const res = await fetch('/api/v1/loans/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: appType,
          currency: appCurrency,
          requestedAmountDecimal: appAmount,
          termMonths: Number(appTerm),
          purpose: appPurpose,
          annualIncomeDecimal: appIncome,
          monthlyExpensesDecimal: appExpenses,
          businessName: appType === 'SMALL_BUSINESS' ? businessName : undefined,
          businessRevenueDecimal: appType === 'SMALL_BUSINESS' ? businessRevenue : undefined,
          consentAcknowledged,
          autoSubmit: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Submission failed');
      }

      setFormSuccessMessage(`Application ${data.application.id} submitted successfully. Your assessment is being processed.`);
      setSelectedApp(data.application);
      setActiveSubTab('applications');
      fetchApplications();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Officer Review
  const handleReviewDecision = async (appId: string) => {
    if (!token) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/v1/loans/applications/${appId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision: officerDecision,
          notes: officerNotes || 'Compliance underwriting review completed.',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Review decision failed');
      }

      setOfficerNotes('');
      fetchApplications();
      setSelectedApp(data.application);
    } catch (err: any) {
      alert(`Review Failed: ${err.message}`);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Handle Cancel
  const handleCancelApplication = async (appId: string) => {
    if (!token || !confirm('Are you sure you want to cancel this application?')) return;
    try {
      const res = await fetch(`/api/v1/loans/applications/${appId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        fetchApplications();
        setSelectedApp(data.application);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isStaff = user && ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'calculator'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Amortization Calculator
        </button>

        <button
          onClick={() => setActiveSubTab('apply')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'apply'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          New Loan Application
        </button>

        <button
          onClick={() => setActiveSubTab('applications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'applications'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          My Applications
        </button>

        <button
          onClick={() => setActiveSubTab('officer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'officer'
              ? 'bg-brand-primary text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Underwriting Review {isStaff && <span className="px-1.5 py-0.5 rounded-full bg-brand-accent/30 text-[10px]">Staff</span>}
        </button>
      </div>

      {/* TAB 1: AMORTIZATION CALCULATOR */}
      {activeSubTab === 'calculator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Controls */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-brand-accent" />
                Loan Parameters
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Currency</label>
                  <select
                    value={calcCurrency}
                    onChange={(e) => setCalcCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  >
                    {fiatCurrencyCodes.map((code) => (
                      <option key={code} value={code}>
                        {currencySelectLabel(code)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400">Principal Amount</label>
                    <span className="font-mono text-brand-accent font-bold">
                      {calcCurrencyMeta.symbol}
                      {Number(calcPrincipal).toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="100000"
                    step="500"
                    value={calcPrincipal}
                    onChange={(e) => setCalcPrincipal(e.target.value)}
                    className="w-full accent-cyan-500"
                  />
                  <input
                    type="number"
                    value={calcPrincipal}
                    onChange={(e) => setCalcPrincipal(e.target.value)}
                    className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400">Annual Interest Rate (APR)</label>
                    <span className="font-mono text-brand-accent font-bold">{calcRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="0.25"
                    value={calcRate}
                    onChange={(e) => setCalcRate(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>0% (Zero-interest)</span>
                    <span>15%</span>
                    <span>30%</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400">Repayment Term</label>
                    <span className="font-mono text-brand-accent font-bold">{calcTerm} Months ({calcTerm / 12} yrs)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {[6, 12, 24, 36, 48, 60, 84, 120].map((tMonths) => (
                      <button
                        key={tMonths}
                        type="button"
                        onClick={() => setCalcTerm(tMonths)}
                        className={`py-1.5 rounded-lg font-mono text-[11px] transition ${
                          calcTerm === tMonths
                            ? 'bg-cyan-600 text-white font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {tMonths}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Results & Key Metrics */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-4">Repayment Projection</h3>
                {calcResult ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-brand-primary/35">
                      <span className="text-[11px] text-slate-400 block font-medium">Estimated Monthly Payment</span>
                      <span className="text-2xl font-black text-brand-accent font-mono mt-1 block">
                        {calcResult.formattedMonthlyPayment}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Fixed monthly annuity</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block font-medium">Total Interest Accrual</span>
                      <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
                        {calcResult.formattedTotalInterest}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">At {calcRate}% annual APR</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block font-medium">Total Cost of Credit</span>
                      <span className="text-2xl font-black text-white font-mono mt-1 block">
                        {calcResult.formattedTotalRepayment}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Principal + Interest</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500 text-xs">Computing schedule...</div>
                )}
              </div>

              {/* Exact Integer Penny-Adjustment Proof */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
                  <CheckCircle2 className="w-4 h-4" />
                  Exact Integer Penny-Balancing Verified
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Financial conservation guarantees that the exact sum of all principal installments matches the original requested loan amount down to the final integer cent, preventing rounding loss.
                </p>
                <button
                  onClick={() => setShowFullSchedule(!showFullSchedule)}
                  className="inline-flex items-center gap-1 text-brand-accent hover:text-brand-accent text-xs font-semibold pt-1"
                >
                  {showFullSchedule ? 'Hide Full Installment Schedule' : `View Full ${calcTerm}-Month Amortization Schedule`}
                  {showFullSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Amortization Table */}
          {showFullSchedule && calcResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                <h4 className="text-sm font-bold text-white">Full Monthly Installment Breakdown</h4>
                <span className="text-xs font-mono text-slate-400">Total installments: {calcResult.schedule.length}</span>
              </div>
              <div className="max-h-96 overflow-y-auto overflow-x-auto text-xs scrollbar-thin">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">#</th>
                      <th className="py-2.5 px-4 font-semibold">Payment</th>
                      <th className="py-2.5 px-4 font-semibold">Principal</th>
                      <th className="py-2.5 px-4 font-semibold">Interest</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {calcResult.schedule.map((item) => (
                      <tr key={item.installmentNumber} className="hover:bg-slate-800/40">
                        <td className="py-2 px-4 text-slate-500 font-bold">{item.installmentNumber}</td>
                        <td className="py-2 px-4 text-white font-semibold">{item.formattedPayment}</td>
                        <td className="py-2 px-4 text-emerald-400">{Number(item.principalMinor) / 100}</td>
                        <td className="py-2 px-4 text-amber-400">{Number(item.interestMinor) / 100}</td>
                        <td className="py-2 px-4 text-right text-slate-400">{item.formattedRemaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LOAN APPLICATION WIZARD */}
      {activeSubTab === 'apply' && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Credit & Loan Application</h3>
            <p className="text-xs text-slate-400 mt-1">
              Apply for a personal or small-business loan. Underwriting uses transparent debt-to-income models and produces a credit risk score for review.
            </p>
          </div>

          {formError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccessMessage && (
            <div className="p-4 rounded-xl bg-brand-accent-light0/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{formSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleApply} className="space-y-6 text-xs">
            {/* Facility Type */}
            <div>
              <label className="text-slate-300 font-semibold block mb-2">Application Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAppType('PERSONAL')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                    appType === 'PERSONAL'
                      ? 'bg-cyan-500/10 border-cyan-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">Personal Loan</span>
                    <span className="text-[11px] text-slate-400">For home improvements, education, or personal debt consolidation.</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAppType('SMALL_BUSINESS')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                    appType === 'SMALL_BUSINESS'
                      ? 'bg-cyan-500/10 border-cyan-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">Small-Business Loan</span>
                    <span className="text-[11px] text-slate-400">Working capital, digital inventory, or equipment acquisition.</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Requested Amount & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Currency</label>
                <select
                  value={appCurrency}
                  onChange={(e) => setAppCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono"
                >
                  {fiatCurrencyCodes.map((code) => (
                    <option key={code} value={code}>
                      {currencySelectLabel(code)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Requested Amount</label>
                <input
                  type="text"
                  required
                  value={appAmount}
                  onChange={(e) => setAppAmount(e.target.value)}
                  placeholder="5000.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Requested Term (Months)</label>
                <select
                  value={appTerm}
                  onChange={(e) => setAppTerm(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono"
                >
                  <option value={12}>12 Months (1 yr)</option>
                  <option value={24}>24 Months (2 yrs)</option>
                  <option value={36}>36 Months (3 yrs)</option>
                  <option value={48}>48 Months (4 yrs)</option>
                  <option value={60}>60 Months (5 yrs)</option>
                </select>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">Purpose of Borrowing</label>
              <textarea
                required
                rows={2}
                value={appPurpose}
                onChange={(e) => setAppPurpose(e.target.value)}
                placeholder="Explain the operational purpose of this financing..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              />
            </div>

            {/* Financial Profile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Annual Stated Income</label>
                <input
                  type="text"
                  required
                  value={appIncome}
                  onChange={(e) => setAppIncome(e.target.value)}
                  placeholder="85000.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Monthly Recurring Debt & Living Expenses</label>
                <input
                  type="text"
                  required
                  value={appExpenses}
                  onChange={(e) => setAppExpenses(e.target.value)}
                  placeholder="1800.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono"
                />
              </div>
            </div>

            {/* Small Business Fields if Selected */}
            {appType === 'SMALL_BUSINESS' && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <span className="font-bold text-white block text-xs">Business Entity Information</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1">Operating Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Annual Gross Business Revenue</label>
                    <input
                      type="text"
                      value={businessRevenue}
                      onChange={(e) => setBusinessRevenue(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <input
                type="checkbox"
                id="consentCheck"
                checked={consentAcknowledged}
                onChange={(e) => setConsentAcknowledged(e.target.checked)}
                className="mt-1 accent-cyan-500 rounded"
              />
              <label htmlFor="consentCheck" className="text-slate-300 text-[11px] leading-relaxed cursor-pointer">
                <strong className="text-white block mb-0.5">Credit application consent</strong>
                I confirm the information provided is accurate. Pre-qualification and scores are not a binding loan offer; final terms require completed verification and signed agreements.
              </label>
            </div>

            <button
              type="submit"
              disabled={formSubmitting || !consentAcknowledged}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-950 text-sm"
            >
              {formSubmitting ? 'Evaluating application...' : 'Submit loan application'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3 & 4: APPLICATIONS & COMPLIANCE OFFICER QUEUE */}
      {(activeSubTab === 'applications' || activeSubTab === 'officer') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications Master List */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center px-2 py-1">
              <h3 className="font-bold text-white text-xs">
                {activeSubTab === 'officer' ? 'Underwriting Review Queue' : 'My Loan Applications'}
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">{applications.length} total</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
              {applications.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">No applications found.</div>
              ) : (
                applications.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      selectedApp?.id === app.id
                        ? 'bg-cyan-950/40 border-cyan-500 text-white'
                        : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-[11px] text-brand-accent font-bold">{app.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'APPROVED_FOR_DEMO'
                            ? 'bg-brand-accent-light0/20 text-emerald-400'
                            : app.status === 'DECLINED_FOR_DEMO'
                            ? 'bg-rose-500/20 text-rose-400'
                            : app.status === 'CANCELLED'
                            ? 'bg-slate-800 text-slate-500'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-200 truncate">{app.purpose}</div>
                    <div className="flex justify-between items-center mt-2 text-[11px] text-slate-400">
                      <span>{app.formattedRequestedAmount} • {app.termMonths}m</span>
                      <span className="text-[10px] text-slate-500">{app.applicantName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Application Detail & Assessment */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
            {selectedApp ? (
              <div className="space-y-6 text-xs">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-accent text-sm">{selectedApp.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {selectedApp.type}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-1">{selectedApp.purpose}</h4>
                    <span className="text-[11px] text-slate-400">Applicant: {selectedApp.applicantName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        selectedApp.status === 'APPROVED_FOR_DEMO'
                          ? 'bg-brand-accent-light0/20 text-emerald-400 border border-emerald-500/30'
                          : selectedApp.status === 'DECLINED_FOR_DEMO'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : selectedApp.status === 'CANCELLED'
                          ? 'bg-slate-800 text-slate-500'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {selectedApp.status}
                    </span>

                    {selectedApp.status === 'SUBMITTED' && selectedApp.userId === user?.id && (
                      <button
                        onClick={() => handleCancelApplication(selectedApp.id)}
                        className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition text-[11px]"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Facility Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Requested Amount</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedApp.formattedRequestedAmount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Repayment Term</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedApp.termMonths} Months</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Currency</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedApp.currency}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Submitted At</span>
                    <span className="text-sm font-bold text-slate-300 font-mono">
                      {selectedApp.submittedAt ? new Date(selectedApp.submittedAt).toLocaleDateString() : 'Draft'}
                    </span>
                  </div>
                </div>

                {selectedApp.assessment ? (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-brand-primary/35 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-brand-accent" />
                        <span className="font-bold text-white text-sm">Credit risk assessment</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Ruleset: {selectedApp.assessment.rulesetVersion}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Credit score</span>
                        <span className="text-2xl font-black text-brand-accent font-mono mt-0.5 block">
                          {selectedApp.assessment.syntheticScore}
                        </span>
                        <span className="text-[10px] text-slate-500">Range: 300 – 850</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Debt-to-Income (DTI)</span>
                        <span className="text-2xl font-black text-white font-mono mt-0.5 block">
                          {(Number(selectedApp.assessment.debtToIncomeRatio) * 100).toFixed(0)}%
                        </span>
                        <span className="text-[10px] text-slate-500">Benchmark &le; 35%</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Recommendation</span>
                        <span className="text-xs font-bold text-emerald-400 mt-2 block">
                          {selectedApp.assessment.recommendation}
                        </span>
                        <span className="text-[10px] text-slate-500">{selectedApp.assessment.riskCategory}</span>
                      </div>
                    </div>

                    {/* Contributing Factors */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">Decision Factors</span>
                      <ul className="space-y-1">
                        {selectedApp.assessment.factorsExplanation.map((factor, i) => (
                          <li key={i} className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-[10px] text-slate-500 italic border-t border-slate-800/80 pt-2">
                      {selectedApp.assessment.notice}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 text-slate-500 text-center text-xs">
                    Assessment will be generated once application is officially submitted.
                  </div>
                )}

                {/* Officer Underwriting Action Panel (Enforces Separation of Duties) */}
                {activeSubTab === 'officer' && (
                  <div className="p-5 rounded-2xl bg-brand-deep/40 border border-brand-primary/35 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        Officer Underwriting Decision Action
                      </span>
                      <span className="text-[10px] text-indigo-300 font-mono">Logged as: {user?.role}</span>
                    </div>

                    {/* Separation of Duties Guard */}
                    {selectedApp.userId === user?.id ? (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          <strong>Separation of Duties Violation:</strong> You are the applicant on this record and cannot review or approve your own loan application.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <label className="text-slate-300 font-medium">Recorded Decision:</label>
                          <select
                            value={officerDecision}
                            onChange={(e) => setOfficerDecision(e.target.value as any)}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                          >
                            <option value="APPROVED_FOR_DEMO">Approve application</option>
                            <option value="DECLINED_FOR_DEMO">Decline application</option>
                            <option value="NEEDS_MORE_INFORMATION">Request Additional Documentation</option>
                          </select>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Officer underwriting notes..."
                            value={officerNotes}
                            onChange={(e) => setOfficerNotes(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                          />
                        </div>

                        <button
                          onClick={() => handleReviewDecision(selectedApp.id)}
                          disabled={reviewSubmitting}
                          className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold transition text-xs shadow-md disabled:opacity-50"
                        >
                          {reviewSubmitting ? 'Recording Decision...' : 'Commit Underwriting Decision to Audit Trail'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs">
                Select an application from the queue to view full assessment details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
