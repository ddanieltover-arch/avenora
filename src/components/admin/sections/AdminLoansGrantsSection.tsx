/**
 * @license Apache-2.0
 * Admin control center — loans_grants tab section (extracted).
 */

import React from 'react';
import {
  AlertTriangle,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminButton,
  AdminBadge,
  badgeToneForStatus,
  adminInputClass,
  adminSelectClass,
  AdminEmptyState,
  AdminModal,
} from '../ui';

export interface AdminLoansGrantsSectionProps {
  user: any;
  loading: boolean;
  loansGrantsSubTab: 'loans' | 'grants';
  setLoansGrantsSubTab: (v: 'loans' | 'grants') => void;
  loanApplications: any[];
  grantApplications: any[];
  selectedLoan: any;
  setSelectedLoan: (v: any) => void;
  loanDecision: any;
  setLoanDecision: (v: any) => void;
  loanReason: string;
  setLoanReason: (v: string) => void;
  handleLoanReviewSubmit: () => void;
  selectedGrant: any;
  setSelectedGrant: (v: any) => void;
  grantDecision: any;
  setGrantDecision: (v: any) => void;
  grantReason: string;
  setGrantReason: (v: string) => void;
  handleGrantReviewSubmit: () => void;
  handleSimulateGrantDisburse: (appId: string) => void;
}

export const AdminLoansGrantsSection: React.FC<AdminLoansGrantsSectionProps> = ({
  user,
  loading,
  loansGrantsSubTab,
  setLoansGrantsSubTab,
  loanApplications,
  grantApplications,
  selectedLoan,
  setSelectedLoan,
  loanDecision,
  setLoanDecision,
  loanReason,
  setLoanReason,
  handleLoanReviewSubmit,
  selectedGrant,
  setSelectedGrant,
  grantDecision,
  setGrantDecision,
  grantReason,
  setGrantReason,
  handleGrantReviewSubmit,
  handleSimulateGrantDisburse,
}) => {
  return (
    <div className="space-y-6">
                <AdminPageHeader
              title="Loans & Grants Operations"
              subtitle="Underwrite loan applications using transparent risk models and manage verified grant opportunities."
              actions={
                <>
                  <AdminButton
                    variant={loansGrantsSubTab === 'loans' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setLoansGrantsSubTab('loans')}
                  >
                    Loan Applications ({loanApplications.length})
                  </AdminButton>
                  <AdminButton
                    variant={loansGrantsSubTab === 'grants' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setLoansGrantsSubTab('grants')}
                  >
                    Grant Programs & Awards ({grantApplications.length})
                  </AdminButton>
                </>
              }
            />

                {/* Prototype boundary notice for loans & grants */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Underwriting decisions are recorded in the application queue. Funding and disbursement follow your institution&apos;s approval workflow.
                  </span>
                </div>

                {/* SUB-TAB: LOAN APPLICATIONS */}
                {loansGrantsSubTab === 'loans' && (
                  <div className="space-y-4">
                    {loanApplications.length === 0 ? (
                      <AdminEmptyState title="No loan applications currently submitted." />
                    ) : (
                      loanApplications.map((loan) => {
                        const isSelf = user?.id === loan.userId;
                        return (
                          <div
                            key={loan.id}
                            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-serif font-bold text-base text-brand-deep">
                                    {loan.applicantName} · {loan.formattedRequestedAmount}
                                  </span>
                                  <AdminBadge tone={badgeToneForStatus(loan.status)}>{loan.status}</AdminBadge>
                                </div>
                                <span className="text-xs text-brand-muted">
                                  Type: {loan.type} · Term: {loan.termMonths} Months · Purpose: {loan.purpose}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {isSelf ? (
                                  <span className="text-xs text-rose-700 bg-rose-50 px-2 py-1 rounded">
                                    Reviewer cannot approve own loan
                                  </span>
                                ) : (
                                  ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
                                    <AdminButton size="sm" onClick={() => setSelectedLoan(loan)}>Record Loan Decision</AdminButton>
                                  )
                                )}
                              </div>
                            </div>

                            {/* Synthetic Assessment Breakdown */}
                            {loan.assessment && (
                              <div className="p-3 bg-brand-warm rounded-lg border border-slate-200 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-800">
                                    Credit score: {loan.assessment.syntheticScore} / 850
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    Ruleset: {loan.assessment.rulesetVersion}
                                  </span>
                                </div>
                                <div className="text-brand-muted">
                                  Debt-to-Income (DTI) Ratio: <strong>{loan.assessment.debtToIncomeRatio}</strong>
                                </div>
                                <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                                  {loan.assessment.factorsExplanation?.map((factor: string, idx: number) => (
                                    <li key={idx}>{factor}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* SUB-TAB: GRANTS */}
                {loansGrantsSubTab === 'grants' && (
                  <div className="space-y-4">
                    {grantApplications.length === 0 ? (
                      <AdminEmptyState title="No grant applications found." />
                    ) : (
                      grantApplications.map((grant) => {
                        const isSelf = user?.id === grant.userId;
                        const canDisburse =
                          grant.status === 'APPROVED_FOR_DEMO' &&
                          grant.award?.disbursementStatus !== 'DISBURSED_SIMULATED' &&
                          !isSelf;

                        return (
                          <div
                            key={grant.id}
                            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-serif font-bold text-base text-brand-deep">
                                    {grant.projectTitle} · {grant.formattedRequestedAmount}
                                  </span>
                                  <AdminBadge tone={badgeToneForStatus(grant.status)}>{grant.status}</AdminBadge>
                                </div>
                                <span className="text-xs text-brand-muted">
                                  Program: <strong>{grant.programName}</strong> · Applicant: {grant.applicantName}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
                                  <>
                                    <AdminButton size="sm" variant="secondary" onClick={() => setSelectedGrant(grant)}>Review Decision</AdminButton>
                                    {canDisburse && (
                                      <AdminButton size="sm" onClick={() => handleSimulateGrantDisburse(grant.id)}>Disburse grant</AdminButton>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-slate-600">{grant.projectSummary}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Loan Review Modal */}
                {selectedLoan && (
                  <AdminModal
                    open={Boolean(selectedLoan)}
                    onClose={() => setSelectedLoan(null)}
                    title={`Review Loan: ${selectedLoan.applicantName} (${selectedLoan.formattedRequestedAmount})`}
                    footer={
                      <>
                        <AdminButton variant="secondary" onClick={() => setSelectedLoan(null)}>
                          Cancel
                        </AdminButton>
                        <AdminButton
                          onClick={handleLoanReviewSubmit}
                          disabled={loading || loanReason.trim().length < 5}
                        >
                          {loading ? 'Recording...' : 'Submit Decision'}
                        </AdminButton>
                      </>
                    }
                  >

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Underwriting Decision</label>
                        <select
                          value={loanDecision}
                          onChange={(e) => setLoanDecision(e.target.value as any)}
                          className={`w-full ${adminSelectClass}`}
                        >
                          <option value="APPROVED_FOR_DEMO">APPROVED FOR DEMO</option>
                          <option value="DECLINED_FOR_DEMO">DECLINED FOR DEMO</option>
                          <option value="NEEDS_MORE_INFORMATION">NEEDS MORE INFORMATION</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Decision Reason Code & Notes <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          placeholder="Document credit risk assessment reasons..."
                          value={loanReason}
                          onChange={(e) => setLoanReason(e.target.value)}
                          rows={3}
                          className={`w-full ${adminInputClass}`}
                        />
                      </div>

                      </AdminModal>
                )}

                {/* Grant Review Modal */}
                {selectedGrant && (
                  <AdminModal
                    open={Boolean(selectedGrant)}
                    onClose={() => setSelectedGrant(null)}
                    title={`Review Grant: ${selectedGrant.projectTitle}`}
                    footer={
                      <>
                        <AdminButton variant="secondary" onClick={() => setSelectedGrant(null)}>
                          Cancel
                        </AdminButton>
                        <AdminButton
                          onClick={handleGrantReviewSubmit}
                          disabled={loading || grantReason.trim().length < 5}
                        >
                          {loading ? 'Submitting...' : 'Confirm Review'}
                        </AdminButton>
                      </>
                    }
                  >

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Review Decision</label>
                        <select
                          value={grantDecision}
                          onChange={(e) => setGrantDecision(e.target.value as any)}
                          className={`w-full ${adminSelectClass}`}
                        >
                          <option value="APPROVED_FOR_DEMO">APPROVE FOR DEMO</option>
                          <option value="DECLINED">DECLINE APPLICATION</option>
                          <option value="NEEDS_MORE_INFORMATION">REQUEST MORE INFORMATION</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Reviewer Notes <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          placeholder="Document eligibility checklist and grant criteria evaluations..."
                          value={grantReason}
                          onChange={(e) => setGrantReason(e.target.value)}
                          rows={3}
                          className={`w-full ${adminInputClass}`}
                        />
                      </div>

                      </AdminModal>
                )}
              </div>
  );
};
