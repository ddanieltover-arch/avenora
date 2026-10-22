/**
 * @license Apache-2.0
 * Admin control center — transactions tab section (extracted).
 */

import React from 'react';
import {
  RefreshCw,
  DollarSign,
  ArrowUpRight,
  Search,
  Eye,
  RotateCcw,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminButton,
  AdminBadge,
  badgeToneForStatus,
  AdminFilterBar,
  adminInputClass,
  adminSelectClass,
  AdminTable,
  AdminTableHead,
  AdminTh,
  AdminTableBody,
  AdminTr,
  AdminTd,
  AdminEmptyState,
  AdminModal,
} from '../ui';

export interface AdminTransactionsSectionProps {
  user: any;
  loading: boolean;
  pendingDeposits: any[];
  pendingWithdrawals: any[];
  depositRejectId: string | null;
  setDepositRejectId: (v: string | null) => void;
  depositRejectReason: string;
  setDepositRejectReason: (v: string) => void;
  approvePendingDeposit: (id: string) => void;
  rejectPendingDeposit: () => void;
  withdrawalRejectId: string | null;
  setWithdrawalRejectId: (v: string | null) => void;
  withdrawalRejectReason: string;
  setWithdrawalRejectReason: (v: string) => void;
  approvePendingWithdrawal: (id: string) => void;
  rejectPendingWithdrawal: () => void;
  transactions: any[];
  txSearch: string;
  setTxSearch: (v: string) => void;
  txStatusFilter: string;
  setTxStatusFilter: (v: string) => void;
  fetchTransactions: () => void;
  inspectTransaction: (id: string) => void;
  txDetailData: any;
  setTxDetailData: (v: any) => void;
  reversalModalTx: any;
  setReversalModalTx: (v: any) => void;
  reversalReason: string;
  setReversalReason: (v: string) => void;
  handleReverseTransaction: () => void;
}

export const AdminTransactionsSection: React.FC<AdminTransactionsSectionProps> = ({
  user,
  loading,
  pendingDeposits,
  pendingWithdrawals,
  depositRejectId,
  setDepositRejectId,
  depositRejectReason,
  setDepositRejectReason,
  approvePendingDeposit,
  rejectPendingDeposit,
  withdrawalRejectId,
  setWithdrawalRejectId,
  withdrawalRejectReason,
  setWithdrawalRejectReason,
  approvePendingWithdrawal,
  rejectPendingWithdrawal,
  transactions,
  txSearch,
  setTxSearch,
  txStatusFilter,
  setTxStatusFilter,
  fetchTransactions,
  inspectTransaction,
  txDetailData,
  setTxDetailData,
  reversalModalTx,
  setReversalModalTx,
  reversalReason,
  setReversalReason,
  handleReverseTransaction,
}) => {
  return (
    <div className="space-y-6">
                <AdminPageHeader
              title="Transaction Investigation & Reversals"
              subtitle="Inspect transaction state transitions and double-entry journal entries. Erroneous postings can be reversed via compensating journal entries."
              actions={
                <AdminButton variant="secondary" onClick={fetchTransactions}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Transactions</span>
                </AdminButton>
              }
            />

                {/* Pending deposit holds */}
                <div className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs">
                  <h3 className="font-serif font-bold text-base text-brand-deep mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span>Pending wallet deposits (customer hold)</span>
                  </h3>
                  <p className="text-xs text-brand-muted mb-4">
                    Approve to move funds from Hold to available balance. Reject to clear the hold without crediting available funds.
                  </p>
                  {pendingDeposits.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No deposits awaiting review.</p>
                  ) : (
                    <AdminTable>
                        <AdminTableHead>
                          <AdminTr>
                            <AdminTh>Reference</AdminTh>
                            <AdminTh>Customer</AdminTh>
                            <AdminTh>Type</AdminTh>
                            <AdminTh>Amount</AdminTh>
                            <AdminTh>Submitted</AdminTh>
                            <AdminTh className="text-right">Actions</AdminTh>
                          </AdminTr>
                        </AdminTableHead>
                        <AdminTableBody>
                          {pendingDeposits.map((dep) => (
                            <AdminTr key={dep.id} className="hover:bg-slate-50/80">
                              <AdminTd className="py-2 px-3 font-mono text-[10px]">{dep.referenceNumber}</AdminTd>
                              <AdminTd>
                                <span className="block font-semibold text-brand-deep">{dep.customerName || dep.userId}</span>
                                <span className="text-[10px] text-slate-500">{dep.customerEmail}</span>
                              </AdminTd>
                              <AdminTd>
                                <span className="block">
                                  {dep.kind}
                                  {dep.sourceRail ? ` · ${dep.sourceRail}` : ''}
                                  {dep.fileName ? ` · ${dep.fileName}` : ''}
                                </span>
                                {dep.origin === 'ADMIN' && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                                    Admin
                                  </span>
                                )}
                                {dep.initiationReason && (
                                  <span
                                    className="block text-[10px] text-slate-500 mt-0.5 max-w-[12rem] truncate"
                                    title={dep.initiationReason}
                                  >
                                    {dep.initiationReason}
                                  </span>
                                )}
                              </AdminTd>
                              <AdminTd className="py-2 px-3 font-bold">{dep.formattedAmount}</AdminTd>
                              <AdminTd className="py-2 px-3 text-slate-600">
                                {dep.submittedAt ? new Date(dep.submittedAt).toLocaleString() : '—'}
                              </AdminTd>
                              <AdminTd className="text-right space-x-2">
                                <AdminButton type="button" size="sm" variant="success" onClick={() => approvePendingDeposit(dep.id)}>
                                  Approve
                                </AdminButton>
                                <AdminButton
                                  type="button"
                                  size="sm"
                                  variant="danger"
                                  onClick={() => {
                                    setDepositRejectId(dep.id);
                                    setDepositRejectReason('');
                                  }}
                                >
                                  Reject
                                </AdminButton>
                              </AdminTd>
                            </AdminTr>
                          ))}
                        </AdminTableBody>
                      </AdminTable>
                  )}
                </div>

                {depositRejectId && (
                  <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-brand-deep">Reject deposit</h4>
                    <textarea
                      value={depositRejectReason}
                      onChange={(e) => setDepositRejectReason(e.target.value)}
                      placeholder="Reason for rejection (required)"
                      className={`w-full min-h-[80px] ${adminInputClass}`}
                    />
                    <div className="flex justify-end gap-2">
                      <AdminButton type="button" variant="secondary" size="sm" onClick={() => setDepositRejectId(null)}>
                    Cancel
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={rejectPendingDeposit}
                    disabled={!depositRejectReason.trim()}
                  >
                    Confirm reject
                  </AdminButton>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-brand-primary/25 p-5 shadow-xs">
                  <h3 className="font-serif font-bold text-base text-brand-deep mb-1 flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-brand-primary" />
                    <span>Pending wallet withdrawals (reserved on hold)</span>
                  </h3>
                  <p className="text-xs text-brand-muted mb-4">
                    Approve to pay out to the customer&apos;s destination and clear hold. Reject to return funds to available balance.
                  </p>
                  {pendingWithdrawals.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No withdrawals awaiting review.</p>
                  ) : (
                    <AdminTable>
                        <AdminTableHead>
                          <AdminTr>
                            <AdminTh>Reference</AdminTh>
                            <AdminTh>Customer</AdminTh>
                            <AdminTh>Destination</AdminTh>
                            <AdminTh>Amount</AdminTh>
                            <AdminTh>Submitted</AdminTh>
                            <AdminTh className="text-right">Actions</AdminTh>
                          </AdminTr>
                        </AdminTableHead>
                        <AdminTableBody>
                          {pendingWithdrawals.map((wth) => (
                            <AdminTr key={wth.id} className="hover:bg-slate-50/80">
                              <AdminTd className="py-2 px-3 font-mono text-[10px]">{wth.referenceNumber}</AdminTd>
                              <AdminTd>
                                <span className="block font-semibold text-brand-deep">{wth.customerName || wth.userId}</span>
                                <span className="text-[10px] text-slate-500">{wth.customerEmail}</span>
                              </AdminTd>
                              <AdminTd className="py-2 px-3 max-w-xs">
                                <span className="block">{wth.kind}{wth.destinationRail ? ` · ${wth.destinationRail}` : ''}</span>
                                {wth.origin === 'ADMIN' && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                                    Admin
                                  </span>
                                )}
                                {wth.initiationReason && (
                                  <span
                                    className="block text-[10px] text-slate-500 mt-0.5 truncate"
                                    title={wth.initiationReason}
                                  >
                                    {wth.initiationReason}
                                  </span>
                                )}
                                {wth.btcAddress ? (
                                  <span className="font-mono text-[10px] text-slate-600 break-all">{wth.btcAddress}</span>
                                ) : wth.origin !== 'ADMIN' ? (
                                  <span className="text-[10px] text-slate-500">
                                    {Object.entries(wth.bankingDetails || {})
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(' · ')}
                                  </span>
                                ) : null}
                              </AdminTd>
                              <AdminTd className="py-2 px-3 font-bold">{wth.formattedAmount}</AdminTd>
                              <AdminTd className="py-2 px-3 text-slate-600">
                                {wth.submittedAt ? new Date(wth.submittedAt).toLocaleString() : '—'}
                              </AdminTd>
                              <AdminTd className="text-right space-x-2">
                                <AdminButton type="button" size="sm" variant="success" onClick={() => approvePendingWithdrawal(wth.id)}>
                                  Approve
                                </AdminButton>
                                <AdminButton
                                  type="button"
                                  size="sm"
                                  variant="danger"
                                  onClick={() => {
                                    setWithdrawalRejectId(wth.id);
                                    setWithdrawalRejectReason('');
                                  }}
                                >
                                  Reject
                                </AdminButton>
                              </AdminTd>
                            </AdminTr>
                          ))}
                        </AdminTableBody>
                      </AdminTable>
                  )}
                </div>

                {withdrawalRejectId && (
                  <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-brand-deep">Reject withdrawal</h4>
                    <textarea
                      value={withdrawalRejectReason}
                      onChange={(e) => setWithdrawalRejectReason(e.target.value)}
                      placeholder="Reason for rejection (required)"
                      className={`w-full min-h-[80px] ${adminInputClass}`}
                    />
                    <div className="flex justify-end gap-2">
                      <AdminButton type="button" variant="secondary" size="sm" onClick={() => setWithdrawalRejectId(null)}>
                    Cancel
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={rejectPendingWithdrawal}
                    disabled={!withdrawalRejectReason.trim()}
                  >
                    Confirm reject
                  </AdminButton>
                    </div>
                  </div>
                )}

                {/* Filter Bar */}
                <AdminFilterBar className="md:flex-row">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search by transaction ID, reference, customer ID, or narration..."
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchTransactions()}
                      className={`w-full pl-9 ${adminInputClass}`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={txStatusFilter}
                      onChange={(e) => setTxStatusFilter(e.target.value)}
                      className={adminSelectClass}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="POSTED">POSTED</option>
                      <option value="REVERSED">REVERSED</option>
                    </select>

                    <AdminButton onClick={fetchTransactions}>Filter</AdminButton>
                  </div>
                </AdminFilterBar>

                {/* Transactions Table */}
                <AdminTable>
                      <AdminTableHead>
                        <AdminTr>
                          <AdminTh>Transaction / Ref</AdminTh>
                          <AdminTh>Type</AdminTh>
                          <AdminTh>Customer</AdminTh>
                          <AdminTh>Amount</AdminTh>
                          <AdminTh>Status</AdminTh>
                          <AdminTh>Timestamp</AdminTh>
                          <AdminTh className="text-right">Actions</AdminTh>
                        </AdminTr>
                      </AdminTableHead>
                      <AdminTableBody>
                        {transactions.length === 0 ? (
                          <AdminTr>
                            <AdminTd colSpan={7}>
                              <AdminEmptyState title="No transactions found matching search criteria." />
                            </AdminTd>
                          </AdminTr>
                        ) : (
                          transactions.map((tx) => (
                            <AdminTr key={tx.transactionId} className="hover:bg-slate-50/80 transition">
                              <AdminTd>
                                <span className="font-semibold text-brand-deep block">{tx.referenceNumber}</span>
                                <span className="font-mono text-[10px] text-slate-500">{tx.transactionId}</span>
                              </AdminTd>
                              <AdminTd>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {tx.operationType}
                                </span>
                              </AdminTd>
                              <AdminTd>
                                <span className="font-mono text-[11px] text-slate-700">{tx.userId || 'System'}</span>
                              </AdminTd>
                              <AdminTd>
                                <span className="font-bold text-slate-900 block">{tx.formattedAmount}</span>
                                <span className="text-[10px] text-slate-500">{tx.currency}</span>
                              </AdminTd>
                              <AdminTd>
                                <AdminBadge tone={badgeToneForStatus(tx.status)}>{tx.status}</AdminBadge>
                              </AdminTd>
                              <AdminTd className="py-3 px-4 text-brand-muted">
                                {new Date(tx.timestamp).toLocaleString()}
                              </AdminTd>
                              <AdminTd className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => inspectTransaction(tx.transactionId)}
                                    title="Inspect double-entry journal & ledger lines"
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-brand-primary" />
                                  </button>

                                  {/* Reversal action strictly for ADMIN / SUPER_ADMIN */}
                                  {['ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && tx.status === 'POSTED' && (
                                    <button
                                      onClick={() => setReversalModalTx(tx)}
                                      title="Post balanced compensating double-entry reversal"
                                      className="p-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-700 transition cursor-pointer"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </AdminTd>
                            </AdminTr>
                          ))
                        )}
                      </AdminTableBody>
                    </AdminTable>

                {/* Transaction Detail & Journal Lines Modal */}
                {txDetailData && (
                  <AdminModal
                    open={Boolean(txDetailData)}
                    onClose={() => setTxDetailData(null)}
                    title="Transaction Detail & Double-Entry Ledger Lines"
                    description={`Reference: ${txDetailData.transaction.referenceNumber} · Status: ${txDetailData.transaction.status}`}
                    size="lg"
                    footer={
                      <AdminButton variant="secondary" onClick={() => setTxDetailData(null)}>
                        Close Inspector
                      </AdminButton>
                    }
                  >

                      {/* Journal Entry Lines Table */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-brand-deep mb-2 flex items-center justify-between">
                          <span>Linked Double-Entry Journal Lines (Immutably Balanced)</span>
                          <span className="text-[10px] text-emerald-800 font-mono">
                            Journal ID: {txDetailData.journalEntry?.id || 'N/A'}
                          </span>
                        </h4>

                        {txDetailData.journalEntry?.lines ? (
                          <AdminTable>
                            <AdminTableHead>
                              <AdminTr>
                                <AdminTh>Account Number / Name</AdminTh>
                                <AdminTh>Direction</AdminTh>
                                <AdminTh className="text-right">Debit (Minor)</AdminTh>
                                <AdminTh className="text-right">Credit (Minor)</AdminTh>
                              </AdminTr>
                            </AdminTableHead>
                            <AdminTableBody>
                              {txDetailData.journalEntry.lines.map((line: any, idx: number) => (
                                <AdminTr key={idx}>
                                  <AdminTd>
                                    <div className="font-semibold text-slate-800">{line.account?.name || line.accountId}</div>
                                    <div className="font-mono text-[10px] text-slate-500">{line.account?.accountNumber}</div>
                                  </AdminTd>
                                  <AdminTd>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                        line.direction === 'DEBIT' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {line.direction}
                                    </span>
                                  </AdminTd>
                                  <AdminTd className="text-right font-mono">
                                    {line.direction === 'DEBIT' ? line.amountMinor : '—'}
                                  </AdminTd>
                                  <AdminTd className="text-right font-mono">
                                    {line.direction === 'CREDIT' ? line.amountMinor : '—'}
                                  </AdminTd>
                                </AdminTr>
                              ))}
                            </AdminTableBody>
                          </AdminTable>
                        ) : (
                          <p className="text-xs text-slate-400">No linked journal entry found for this transaction.</p>
                        )}
                      </div>

                      </AdminModal>
                )}

                {/* Compensating Reversal Modal */}
                {reversalModalTx && (
                  <AdminModal
                    open={Boolean(reversalModalTx)}
                    onClose={() => setReversalModalTx(null)}
                    title="Authorize Compensating Ledger Reversal"
                    tone="warning"
                    footer={
                      <>
                        <AdminButton variant="secondary" onClick={() => setReversalModalTx(null)}>
                          Cancel
                        </AdminButton>
                        <AdminButton
                          onClick={handleReverseTransaction}
                          disabled={loading || reversalReason.trim().length < 5}
                          className="!bg-amber-700 hover:!bg-amber-800"
                        >
                          {loading ? 'Posting...' : 'Post Reversal'}
                        </AdminButton>
                      </>
                    }
                  >

                      <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-900 border border-amber-200 space-y-1">
                        <div><strong>Original Reference:</strong> {reversalModalTx.referenceNumber}</div>
                        <div><strong>Amount:</strong> {reversalModalTx.formattedAmount} ({reversalModalTx.currency})</div>
                        <div><strong>Immutability Notice:</strong> The original posted journal entry will remain permanent and untouched. A balanced compensating reversal entry will be posted to the double-entry ledger.</div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Documented Reason for Reversal <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          placeholder="Explain customer dispute, incorrect settlement, or operational error justification..."
                          value={reversalReason}
                          onChange={(e) => setReversalReason(e.target.value)}
                          rows={3}
                          className={`w-full ${adminInputClass}`}
                        />
                      </div>

                      </AdminModal>
                )}
              </div>
  );
};
