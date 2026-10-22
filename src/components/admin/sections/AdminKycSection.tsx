/**
 * @license Apache-2.0
 * Admin control center — kyc tab section (extracted).
 */

import React from 'react';
import {
  RefreshCw,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminButton,
  AdminBadge,
  badgeToneForStatus,
  AdminFilterBar,
  adminInputClass,
  adminSelectClass,
  AdminEmptyState,
  AdminModal,
} from '../ui';

function formatKycFileSize(bytes?: number) {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function kycDocumentSideLabel(fileName?: string) {
  if (!fileName) return null;
  if (fileName.includes('_FRONT_')) return 'Front';
  if (fileName.includes('_BACK_')) return 'Back';
  return null;
}

export interface AdminKycSectionProps {
  user: any;
  loading: boolean;
  kycCases: any[];
  kycStatusFilter: string;
  setKycStatusFilter: (v: string) => void;
  fetchKycQueue: () => void;
  selectedKycCase: any;
  setSelectedKycCase: (v: any) => void;
  openKycReviewModal: (caseRow: any) => void;
  kycDecision: any;
  setKycDecision: (v: any) => void;
  kycReason: string;
  setKycReason: (v: string) => void;
  handleKycReviewSubmit: () => void;
}

export const AdminKycSection: React.FC<AdminKycSectionProps> = ({
  user,
  loading,
  kycCases,
  kycStatusFilter,
  setKycStatusFilter,
  fetchKycQueue,
  selectedKycCase,
  setSelectedKycCase,
  openKycReviewModal,
  kycDecision,
  setKycDecision,
  kycReason,
  setKycReason,
  handleKycReviewSubmit,
}) => {
  return (
    <div className="space-y-6">
                <AdminPageHeader
              title="KYC Verification Review Queue"
              subtitle="Review identity verification submissions with separation of duties enforcement. All decisions are auditable."
              actions={
                <AdminButton variant="secondary" onClick={fetchKycQueue}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Queue</span>
                </AdminButton>
              }
            />

                {/* Filter */}
                <AdminFilterBar className="justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Filter Queue Status:</span>
                    <select
                      value={kycStatusFilter}
                      onChange={(e) => setKycStatusFilter(e.target.value)}
                      className={adminSelectClass}
                    >
                      <option value="ALL">All Cases</option>
                      <option value="SUBMITTED">SUBMITTED (Pending Review)</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                      <option value="NEEDS_MORE_INFORMATION">NEEDS_MORE_INFORMATION</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                    <AdminButton size="sm" onClick={fetchKycQueue}>Apply</AdminButton>
                  </div>
                  <span className="text-xs text-brand-muted font-medium">
                    Total cases displayed: {kycCases.length}
                  </span>
                </AdminFilterBar>

                {/* KYC Cases List */}
                <div className="space-y-3">
                  {kycCases.length === 0 ? (
                    <AdminEmptyState title="No KYC cases pending review." />
                  ) : (
                    kycCases.map((c) => {
                      const isSelf = user?.id === c.userId;
                      return (
                        <div
                          key={c.id}
                          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-bold text-base text-brand-deep">
                                {c.legalFirstName} {c.legalLastName}
                              </span>
                              <AdminBadge tone={badgeToneForStatus(c.status)}>{c.status}</AdminBadge>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                Tier {c.tier}
                              </span>
                            </div>

                            <div className="text-xs text-brand-muted flex flex-wrap items-center gap-3">
                              <span>User ID: <strong className="font-mono text-[11px]">{c.userId}</strong></span>
                              <span>·</span>
                              <span>DOB: <strong>{c.dateOfBirth || 'N/A'}</strong></span>
                              <span>·</span>
                              <span>Tax ID ({c.taxIdType}): <strong className="font-mono">{c.taxIdMasked}</strong></span>
                              <span>·</span>
                              <span>Country: <strong>{c.residentialAddress?.country || 'US'}</strong></span>
                            </div>

                            {/* Document vault references */}
                            <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                              <span>Secure vault refs:</span>
                              {c.documentRefs?.map((doc: any) => (
                                <span
                                  key={doc.id}
                                  className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                                  title={doc.storageRef}
                                >
                                  {doc.type} ({doc.storageRef?.slice(0, 24)}...)
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isSelf ? (
                              <div className="text-xs text-rose-700 font-semibold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                                Separation of duties: Cannot review own KYC
                              </div>
                            ) : (
                              ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
                                <AdminButton onClick={() => openKycReviewModal(c)}>Record Review Decision</AdminButton>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* KYC Review Decision Modal — full customer submission */}
                {selectedKycCase && (
                  <AdminModal
                    open={Boolean(selectedKycCase)}
                    onClose={() => setSelectedKycCase(null)}
                    title={`Compliance Decision: ${selectedKycCase.legalFirstName} ${selectedKycCase.legalLastName}`}
                    size="xl"
                    footer={
                      <>
                        <AdminButton variant="secondary" onClick={() => setSelectedKycCase(null)}>
                          Cancel
                        </AdminButton>
                        <AdminButton
                          onClick={handleKycReviewSubmit}
                          disabled={loading || (kycDecision === 'REJECTED' && kycReason.trim().length < 5)}
                        >
                          {loading ? 'Recording...' : 'Submit Decision'}
                        </AdminButton>
                      </>
                    }
                  >

                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-4 text-xs text-slate-700">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Submission status
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                            <div>User ID: <strong className="font-mono">{selectedKycCase.userId}</strong></div>
                            <div>
                              Status:{' '}
                              <strong className="text-brand-deep">{selectedKycCase.status || '—'}</strong>
                            </div>
                            <div>Tier: <strong>{selectedKycCase.tier ?? '—'}</strong></div>
                            <div>Version: <strong>{selectedKycCase.version ?? '—'}</strong></div>
                            <div>
                              Submitted:{' '}
                              <strong>
                                {selectedKycCase.submittedAt
                                  ? new Date(selectedKycCase.submittedAt).toLocaleString()
                                  : '—'}
                              </strong>
                            </div>
                            <div>
                              Resubmissions:{' '}
                              <strong>{selectedKycCase.resubmissionCount ?? 0}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Personal details
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                            <div>
                              Legal first name:{' '}
                              <strong>{selectedKycCase.legalFirstName || '—'}</strong>
                            </div>
                            <div>
                              Legal last name:{' '}
                              <strong>{selectedKycCase.legalLastName || '—'}</strong>
                            </div>
                            <div>
                              Date of birth:{' '}
                              <strong className="font-mono">{selectedKycCase.dateOfBirth || '—'}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Residential address
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                            <div className="sm:col-span-2">
                              Street:{' '}
                              <strong>{selectedKycCase.residentialAddress?.street || '—'}</strong>
                            </div>
                            <div>
                              City: <strong>{selectedKycCase.residentialAddress?.city || '—'}</strong>
                            </div>
                            <div>
                              State / region:{' '}
                              <strong>{selectedKycCase.residentialAddress?.state || '—'}</strong>
                            </div>
                            <div>
                              Postal code:{' '}
                              <strong>{selectedKycCase.residentialAddress?.postalCode || '—'}</strong>
                            </div>
                            <div>
                              Country:{' '}
                              <strong className="font-mono">
                                {selectedKycCase.residentialAddress?.country || '—'}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Tax identification
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                            <div>
                              Tax ID type: <strong>{selectedKycCase.taxIdType || '—'}</strong>
                            </div>
                            <div>
                              Tax ID (full):{' '}
                              <strong className="font-mono">
                                {selectedKycCase.taxIdFull || selectedKycCase.taxIdMasked || '—'}
                              </strong>
                            </div>
                            {selectedKycCase.taxIdFull && selectedKycCase.taxIdMasked && (
                              <div className="sm:col-span-2 text-slate-500">
                                Masked display: {selectedKycCase.taxIdMasked}
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedKycCase.externalVerification && (
                          <div className="border-t border-slate-200 pt-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                              External screening (advisory)
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                              <div>
                                Provider:{' '}
                                <strong>{selectedKycCase.externalVerification.providerCode}</strong>
                              </div>
                              <div>
                                Status:{' '}
                                <strong>{selectedKycCase.externalVerification.status}</strong>
                              </div>
                              {typeof selectedKycCase.externalVerification.confidenceScore === 'number' && (
                                <div>
                                  Confidence:{' '}
                                  <strong>{selectedKycCase.externalVerification.confidenceScore}</strong>
                                </div>
                              )}
                            </div>
                            {selectedKycCase.externalVerification.checksSummary && (
                              <ul className="mt-2 space-y-0.5 text-slate-600">
                                <li>
                                  Document authenticity:{' '}
                                  {selectedKycCase.externalVerification.checksSummary.documentAuthenticity
                                    ? 'Pass'
                                    : 'Fail / unknown'}
                                </li>
                                <li>
                                  Facial match:{' '}
                                  {selectedKycCase.externalVerification.checksSummary.facialMatch
                                    ? 'Pass'
                                    : 'Fail / unknown'}
                                </li>
                                <li>
                                  Sanctions clear:{' '}
                                  {selectedKycCase.externalVerification.checksSummary.sanctionsClear
                                    ? 'Yes'
                                    : 'No / unknown'}
                                </li>
                                <li>
                                  PEP clear:{' '}
                                  {selectedKycCase.externalVerification.checksSummary.pepClear
                                    ? 'Yes'
                                    : 'No / unknown'}
                                </li>
                              </ul>
                            )}
                          </div>
                        )}

                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Identity documents ({(selectedKycCase.documentRefs || []).length})
                          </p>
                          {(selectedKycCase.documentRefs || []).length === 0 ? (
                            <p className="text-slate-500 italic">No documents attached to this submission.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(selectedKycCase.documentRefs || []).map((doc: any) => {
                                const side = kycDocumentSideLabel(doc.fileName);
                                const isImage =
                                  typeof doc.previewDataUrl === 'string' &&
                                  doc.previewDataUrl.startsWith('data:image/');
                                return (
                                  <div
                                    key={doc.id}
                                    className="rounded-lg border border-slate-200 bg-white p-3 space-y-2"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="font-semibold text-brand-deep">
                                          {String(doc.type || 'DOCUMENT').replace(/_/g, ' ')}
                                          {side ? ` · ${side}` : ''}
                                        </p>
                                        <p className="text-[11px] text-slate-500 break-all mt-0.5">
                                          {doc.fileName}
                                        </p>
                                      </div>
                                      <span className="shrink-0 text-[10px] font-mono text-slate-400">
                                        {formatKycFileSize(doc.fileSize)}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                      {doc.mimeType || 'unknown type'}
                                    </p>
                                    {isImage ? (
                                      <a
                                        href={doc.previewDataUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block rounded-md overflow-hidden border border-slate-100 bg-slate-50"
                                      >
                                        <img
                                          src={doc.previewDataUrl}
                                          alt={`${doc.type} preview`}
                                          className="w-full max-h-48 object-contain"
                                        />
                                      </a>
                                    ) : (
                                      <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-[11px] text-slate-500">
                                        Preview unavailable — vault ref only
                                        <div className="font-mono text-[10px] mt-1 break-all text-slate-400">
                                          {doc.storageRef}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Compliance Action</label>
                        <select
                          value={kycDecision}
                          onChange={(e) => setKycDecision(e.target.value as any)}
                          className={`w-full ${adminSelectClass}`}
                        >
                          <option value="APPROVED">APPROVE Verification</option>
                          <option value="NEEDS_MORE_INFORMATION">REQUEST MORE INFORMATION</option>
                          <option value="REJECTED">REJECT Submission</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Reviewer Notes & Decision Rationale <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          placeholder="Document sanction checks, evidence review, or reason for rejection..."
                          value={kycReason}
                          onChange={(e) => setKycReason(e.target.value)}
                          rows={3}
                          className={`w-full ${adminInputClass}`}
                        />
                      </div>

                      </AdminModal>
                )}
              </div>
  );
};
