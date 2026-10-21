/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Verified Grant Directory & Application Portal (Phase 03)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useLocalization } from './LocalizationContext.tsx';
import { useCustomerWalletScope } from '../hooks/useCustomerWalletScope.ts';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Search,
  Filter,
  Building,
  Calendar,
  Globe2,
  ArrowRight,
  ShieldCheck,
  Coins,
  Send,
  Clock,
  Sparkles,
} from 'lucide-react';

interface GrantProgram {
  id: string;
  name: string;
  description: string;
  organizationName: string;
  fundingSourceRef: string;
  verificationStatus: 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  eligibleCountries: string[];
  fundingMinMinor: string;
  fundingMaxMinor: string;
  formattedFundingRange: string;
  currency: string;
  openingDate: string;
  closingDate: string;
  eligibilityCriteria: string[];
}

interface GrantApplication {
  id: string;
  programId: string;
  programName: string;
  userId: string;
  applicantName: string;
  projectTitle: string;
  projectSummary: string;
  requestedAmountMinor: string;
  formattedRequestedAmount: string;
  currency: string;
  status: string;
  eligibilityAnswers: Record<string, boolean>;
  award?: {
    id: string;
    awardedAmountMinor: string;
    formattedAwardedAmount: string;
    reconciliationRef: string;
    disbursementStatus: string;
    disbursedAt?: string;
  };
  submittedAt?: string;
  reviewHistory: Array<{
    actorUserId: string;
    previousStatus: string;
    newStatus: string;
    notes?: string;
    timestamp: string;
  }>;
}

export function GrantManagementView() {
  const { user, token } = useAuth();
  const { t } = useLocalization();
  const { primaryFiat, countryCode, currencyFilterShortLabel } = useCustomerWalletScope();

  const [activeTab, setActiveTab] = useState<'directory' | 'applications' | 'officer'>('directory');

  // Programs & Filtering
  const [programs, setPrograms] = useState<GrantProgram[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState(countryCode);
  const [currencyFilter, setCurrencyFilter] = useState(primaryFiat);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  useEffect(() => {
    setCountryFilter(countryCode);
    setCurrencyFilter(primaryFiat);
  }, [countryCode, primaryFiat]);

  // Applications
  const [applications, setApplications] = useState<GrantApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<GrantApplication | null>(null);
  const [loadingApps, setLoadingApps] = useState(false);

  // Apply Modal
  const [applyingProgram, setApplyingProgram] = useState<GrantProgram | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectSummary, setProjectSummary] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('15000.00');
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, boolean>>({});
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [appSuccess, setAppSuccess] = useState<string | null>(null);

  // Review & Disburse state
  const [reviewDecision, setReviewDecision] = useState<'APPROVED_FOR_DEMO' | 'DECLINED' | 'UNDER_REVIEW'>('APPROVED_FOR_DEMO');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [disburseLoading, setDisburseLoading] = useState(false);

  // Fetch Programs
  const fetchPrograms = async () => {
    setLoadingPrograms(true);
    try {
      const res = await fetch('/api/v1/grants/programs');
      const data = await res.json();
      if (res.ok && data.programs) {
        setPrograms(data.programs);
      }
    } catch (err) {
      console.error('Failed to load grant programs', err);
    } finally {
      setLoadingPrograms(false);
    }
  };

  // Fetch Applications
  const fetchApplications = async () => {
    if (!token) return;
    setLoadingApps(true);
    try {
      const isStaff = user && ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
      const url = activeTab === 'officer' && isStaff ? '/api/v1/grants/applications?all=true' : '/api/v1/grants/applications';

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
      console.error('Failed to load grant applications', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (activeTab === 'applications' || activeTab === 'officer') {
      fetchApplications();
    }
  }, [activeTab, token, user?.role]);

  // Open Apply Modal
  const handleOpenApply = (prog: GrantProgram) => {
    setApplyingProgram(prog);
    setRequestedAmount(prog.currency === primaryFiat ? '25000.00' : '15000.00');
    setProjectTitle('');
    setProjectSummary('');
    const initialAnswers: Record<string, boolean> = {};
    for (const c of prog.eligibilityCriteria) {
      initialAnswers[c] = false;
    }
    setChecklistAnswers(initialAnswers);
    setAppError(null);
    setAppSuccess(null);
  };

  // Submit Grant Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !applyingProgram) return;

    setSubmittingApp(true);
    setAppError(null);
    try {
      const res = await fetch('/api/v1/grants/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          programId: applyingProgram.id,
          projectTitle,
          projectSummary,
          requestedAmountDecimal: requestedAmount,
          eligibilityAnswers: checklistAnswers,
          autoSubmit: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Failed to submit application');
      }

      setAppSuccess(`Application submitted successfully! Tracking ref: ${data.application.id}`);
      setApplyingProgram(null);
      setActiveTab('applications');
      fetchApplications();
    } catch (err: any) {
      setAppError(err.message);
    } finally {
      setSubmittingApp(false);
    }
  };

  // Review Application
  const handleReviewApplication = async (appId: string) => {
    if (!token) return;
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/v1/grants/applications/${appId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision: reviewDecision,
          notes: reviewNotes || 'Compliance eligibility and impact review completed.',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Review failed');
      }

      setReviewNotes('');
      fetchApplications();
      setSelectedApp(data.application);
    } catch (err: any) {
      alert(`Review Error: ${err.message}`);
    } finally {
      setReviewLoading(false);
    }
  };

  // Disburse Award
  const handleDisburseAward = async (appId: string) => {
    if (!token) return;
    setDisburseLoading(true);
    try {
      const res = await fetch(`/api/v1/grants/applications/${appId}/disburse`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-idempotency-key': `idem_grant_disb_${appId}_${Date.now()}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Disbursement failed');
      }

      alert(`Grant Disbursed! Reconciliation Ref: ${data.award.reconciliationRef}. Funds credited to customer's wallet.`);
      fetchApplications();
      setSelectedApp(data.application);
    } catch (err: any) {
      alert(`Disbursement Error: ${err.message}`);
    } finally {
      setDisburseLoading(false);
    }
  };

  // Filtered Programs
  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organizationName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCountry = countryFilter === 'ALL' || p.eligibleCountries.includes(countryFilter);
    const matchesCurrency = currencyFilter === 'ALL' || p.currency === currencyFilter;

    return matchesSearch && matchesCountry && matchesCurrency;
  });

  const isStaff = user && ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'directory'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Verified Grant Directory ({filteredPrograms.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'applications'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          My Grant Applications
        </button>

        <button
          onClick={() => setActiveTab('officer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'officer'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Officer Grant Review & Disbursement {isStaff && <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-[10px]">Staff</span>}
        </button>
      </div>

      {/* TAB 1: GRANT DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search programs by name, technology, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
              >
                <option value="ALL">All Countries</option>
                <option value="US">United States (US)</option>
                <option value="BR">Brazil (BR)</option>
                <option value="ES">Spain (ES)</option>
                <option value="DE">Germany (DE)</option>
              </select>

              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
              >
                <option value="ALL">All program currencies</option>
                <option value={primaryFiat}>{currencyFilterShortLabel(primaryFiat)} (your account)</option>
              </select>
            </div>
          </div>

          {/* Programs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPrograms.map((prog) => (
              <div
                key={prog.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition shadow-lg space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-cyan-400 font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60">
                        {prog.currency}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{prog.organizationName}</span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        prog.verificationStatus === 'VERIFIED'
                          ? 'bg-brand-accent-light0/10 border border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {prog.verificationStatus}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">{prog.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{prog.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Award Amount:</span>
                    <span className="font-bold font-mono text-cyan-300">{prog.formattedFundingRange}</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Globe2 className="w-3.5 h-3.5 text-slate-500" />
                      {prog.eligibleCountries.join(', ')}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Closes: {new Date(prog.closingDate).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenApply(prog)}
                    disabled={prog.verificationStatus !== 'VERIFIED'}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold transition flex items-center justify-center gap-2 text-xs shadow-md shadow-cyan-950"
                  >
                    <span>Apply for Program</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPLY MODAL */}
      {applyingProgram && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex modal-overlay-scroll justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[min(calc(100dvh-1.5rem),920px)] overflow-y-auto overscroll-y-contain p-6 sm:p-8 space-y-6 scrollbar-thin shadow-2xl my-auto sm:my-0">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] text-cyan-400 font-bold block">{applyingProgram.organizationName}</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{applyingProgram.name}</h3>
                <span className="text-xs text-slate-400 font-mono">Range: {applyingProgram.formattedFundingRange}</span>
              </div>
              <button
                onClick={() => setApplyingProgram(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {appError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {appError}
              </div>
            )}

            <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Community Rooftop Solar Battery Inverter..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Project Summary & Impact Objectives</label>
                <textarea
                  required
                  rows={3}
                  value={projectSummary}
                  onChange={(e) => setProjectSummary(e.target.value)}
                  placeholder="Describe the research, social, or technical deliverable..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Requested Funding Amount ({applyingProgram.currency})
                </label>
                <input
                  type="text"
                  required
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              {/* Eligibility Criteria Checklist */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-200 block text-xs">Mandatory Eligibility Verification</span>
                {applyingProgram.eligibilityCriteria.map((criterion) => (
                  <label key={criterion} className="flex items-start gap-2.5 cursor-pointer text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!checklistAnswers[criterion]}
                      onChange={(e) =>
                        setChecklistAnswers({
                          ...checklistAnswers,
                          [criterion]: e.target.checked,
                        })
                      }
                      className="mt-0.5 accent-cyan-500 rounded"
                    />
                    <span>{criterion}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setApplyingProgram(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-md shadow-cyan-950 disabled:opacity-50"
                >
                  {submittingApp ? 'Submitting...' : 'Submit Grant Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2 & 3: APPLICATIONS & COMPLIANCE REVIEW / DISBURSEMENT */}
      {(activeTab === 'applications' || activeTab === 'officer') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications Master List */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center px-2 py-1">
              <h3 className="font-bold text-white text-xs">
                {activeTab === 'officer' ? 'Officer Grant Approval Queue' : 'My Grant Applications'}
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">{applications.length} total</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
              {applications.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">No grant applications found.</div>
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
                      <span className="font-mono text-[11px] text-cyan-400 font-bold">{app.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'APPROVED_FOR_DEMO'
                            ? 'bg-brand-accent-light0/20 text-emerald-400'
                            : app.status === 'DECLINED' || app.status === 'INELIGIBLE'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-200 truncate">{app.projectTitle}</div>
                    <div className="flex justify-between items-center mt-2 text-[11px] text-slate-400">
                      <span>{app.formattedRequestedAmount}</span>
                      <span className="text-[10px] text-slate-500">{app.applicantName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Application Detail & Disbursement Inspector */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
            {selectedApp ? (
              <div className="space-y-6 text-xs">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400 text-sm">{selectedApp.id}</span>
                      <span className="text-slate-400">• {selectedApp.programName}</span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-1">{selectedApp.projectTitle}</h4>
                    <span className="text-[11px] text-slate-400">Applicant: {selectedApp.applicantName}</span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedApp.status === 'APPROVED_FOR_DEMO'
                        ? 'bg-brand-accent-light0/20 text-emerald-400 border border-emerald-500/30'
                        : selectedApp.status === 'DECLINED' || selectedApp.status === 'INELIGIBLE'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {selectedApp.status}
                  </span>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-semibold block text-[11px]">Proposal Summary</span>
                  <p className="text-slate-200 leading-relaxed">{selectedApp.projectSummary}</p>
                  <div className="flex justify-between items-center pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
                    <span>Requested Grant Capital:</span>
                    <span className="font-bold font-mono text-cyan-400">{selectedApp.formattedRequestedAmount}</span>
                  </div>
                </div>

                {/* Award & Reconciliation Certificate */}
                {selectedApp.award ? (
                  <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Grant award certificate</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-300 bg-brand-accent-light0/20 px-2 py-0.5 rounded-full">
                        {selectedApp.award.disbursementStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Awarded Capital</span>
                        <span className="text-lg font-black font-mono text-white mt-0.5 block">
                          {selectedApp.award.formattedAwardedAmount}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Unique Reconciliation Reference</span>
                        <span className="text-xs font-bold font-mono text-emerald-300 mt-1 block">
                          {selectedApp.award.reconciliationRef}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-emerald-200/80 pt-1 border-t border-emerald-500/20">
                      Disbursement settled and posted to the recipient wallet with ledger verification.
                    </div>
                  </div>
                ) : null}

                {/* Officer review & disbursement */}
                {activeTab === 'officer' && (
                  <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        Compliance Grant Decision & Disbursement Engine
                      </span>
                      <span className="text-[10px] text-indigo-300 font-mono">Logged as: {user?.role}</span>
                    </div>

                    {/* Separation of Duties Guard */}
                    {selectedApp.userId === user?.id ? (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          <strong>Separation of Duties Violation:</strong> You are the author of this grant application and cannot record decisions or disburse funds to yourself.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedApp.status !== 'APPROVED_FOR_DEMO' ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <label className="text-slate-300 font-medium">Recorded Decision:</label>
                              <select
                                value={reviewDecision}
                                onChange={(e) => setReviewDecision(e.target.value as any)}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                              >
                                <option value="APPROVED_FOR_DEMO">Approve grant proposal</option>
                                <option value="DECLINED">Decline Proposal</option>
                                <option value="UNDER_REVIEW">Mark Under Formal Review</option>
                              </select>
                            </div>

                            <input
                              type="text"
                              placeholder="Reviewer notes..."
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                            />

                            <button
                              onClick={() => handleReviewApplication(selectedApp.id)}
                              disabled={reviewLoading}
                              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs shadow-md shadow-indigo-950 disabled:opacity-50"
                            >
                              {reviewLoading ? 'Recording...' : 'Commit Review Decision'}
                            </button>
                          </div>
                        ) : !selectedApp.award ? (
                          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
                            <span className="text-emerald-300 font-bold block text-xs">
                              Application approved for disbursement
                            </span>
                            <p className="text-slate-300 text-[11px]">
                              Disbursement posts a double-entry ledger credit to the recipient wallet and generates a reconciliation reference.
                            </p>
                            <button
                              onClick={() => handleDisburseAward(selectedApp.id)}
                              disabled={disburseLoading}
                              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-brand-accent-light0 text-white font-bold transition text-xs shadow-lg shadow-emerald-950 flex items-center gap-2 disabled:opacity-50"
                            >
                              <Coins className="w-4 h-4" />
                              <span>{disburseLoading ? 'Executing transfer...' : 'Disburse grant funds'}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-emerald-400 text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Funds successfully disbursed to customer account.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs">
                Select an application to view full details and award status.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
