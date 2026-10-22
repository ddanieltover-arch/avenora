/**
 * @license Apache-2.0
 * Admin control center — cards tab section (extracted).
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

export interface AdminCardsSectionProps {
  loading: boolean;
  cards: any[];
  fetchCards: () => void;
  openCardRequestManager: (card: any, decision: 'APPROVE' | 'DECLINE' | 'DELETE') => void;
  cardIssuanceModal: any;
  setCardIssuanceModal: (v: any) => void;
  cardIssuanceDecision: 'APPROVE' | 'DECLINE' | 'DELETE';
  setCardIssuanceDecision: (v: 'APPROVE' | 'DECLINE' | 'DELETE') => void;
  cardIssuanceReason: string;
  setCardIssuanceReason: (v: string) => void;
  handleCardIssuanceReview: () => void;
  cardStatusModal: any;
  setCardStatusModal: (v: any) => void;
  newCardStatus: any;
  setNewCardStatus: (v: any) => void;
  cardStatusReason: string;
  setCardStatusReason: (v: string) => void;
  handleUpdateCardStatus: () => void;
}

export const AdminCardsSection: React.FC<AdminCardsSectionProps> = ({
  loading,
  cards,
  fetchCards,
  openCardRequestManager,
  cardIssuanceModal,
  setCardIssuanceModal,
  cardIssuanceDecision,
  setCardIssuanceDecision,
  cardIssuanceReason,
  setCardIssuanceReason,
  handleCardIssuanceReview,
  cardStatusModal,
  setCardStatusModal,
  newCardStatus,
  setNewCardStatus,
  cardStatusReason,
  setCardStatusReason,
  handleUpdateCardStatus,
}) => {
  return (
    <div className="space-y-6">
                <AdminPageHeader
              title="Card Operations & Hold Controls"
              subtitle="Review pending card issuance requests, then freeze or unfreeze issued cards."
              actions={
                <AdminButton variant="secondary" onClick={fetchCards}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Cards</span>
                </AdminButton>
              }
            />

                {cards.some((c) => c.status === 'PENDING_REVIEW' || c.status === 'REQUESTED') && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
                    <span className="font-bold">
                      {cards.filter((c) => c.status === 'PENDING_REVIEW' || c.status === 'REQUESTED').length} card
                      request(s) awaiting issuance approval.
                    </span>
                  </div>
                )}

                <AdminTable>
                      <AdminTableHead>
                        <AdminTr>
                          <AdminTh>Card Identifier</AdminTh>
                          <AdminTh>Cardholder</AdminTh>
                          <AdminTh>Type / Currency</AdminTh>
                          <AdminTh>Status</AdminTh>
                          <AdminTh>Monthly Spend Limit</AdminTh>
                          <AdminTh>Single Tx Limit</AdminTh>
                          <AdminTh className="text-right">Operations</AdminTh>
                        </AdminTr>
                      </AdminTableHead>
                      <AdminTableBody>
                        {cards.length === 0 ? (
                          <AdminTr>
                            <AdminTd colSpan={7}>
                              <AdminEmptyState title="No cards currently issued." />
                            </AdminTd>
                          </AdminTr>
                        ) : (
                          cards.map((c) => {
                            const pendingIssuance =
                              c.status === 'PENDING_REVIEW' || c.status === 'REQUESTED';
                            return (
                            <AdminTr key={c.id} className={`hover:bg-slate-50 transition ${pendingIssuance ? 'bg-amber-50/40' : ''}`}>
                              <AdminTd>
                                <span className="font-mono font-bold text-slate-800 block">{c.maskedPan}</span>
                                <span className="font-mono text-[10px] text-slate-500">ID: {c.id}</span>
                              </AdminTd>
                              <AdminTd>
                                <span className="font-semibold text-slate-900 block">{c.syntheticCardholderName}</span>
                                <span className="text-[10px] text-slate-500">User: {c.userId}</span>
                              </AdminTd>
                              <AdminTd>
                                <span className="font-semibold text-slate-800 block">{c.type}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{c.currency}</span>
                              </AdminTd>
                              <AdminTd>
                                <AdminBadge tone={pendingIssuance ? 'warning' : badgeToneForStatus(c.status)}>{c.status}</AdminBadge>
                              </AdminTd>
                              <AdminTd className="py-3 px-4 font-semibold text-slate-800">{c.formattedDailyLimit}</AdminTd>
                              <AdminTd className="py-3 px-4 font-semibold text-slate-800">{c.formattedSingleTxLimit}</AdminTd>
                              <AdminTd className="text-right">
                                {pendingIssuance ? (
                                  <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => openCardRequestManager(c, 'APPROVE')}
                                      className="px-2.5 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-deep text-white text-[11px] font-semibold transition cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openCardRequestManager(c, 'DECLINE')}
                                      className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-[11px] font-semibold hover:bg-amber-100 transition cursor-pointer"
                                    >
                                      Decline
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openCardRequestManager(c, 'DELETE')}
                                      className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-[11px] font-semibold hover:bg-rose-100 transition cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ) : c.status === 'ACTIVE_SIMULATED' || c.status === 'FROZEN' ? (
                                  <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCardStatusModal(c);
                                        setNewCardStatus(c.status === 'ACTIVE_SIMULATED' ? 'FROZEN' : 'ACTIVE_SIMULATED');
                                        setCardStatusReason('');
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-brand-primary hover:bg-slate-50 transition cursor-pointer"
                                    >
                                      {c.status === 'ACTIVE_SIMULATED' ? 'Freeze' : 'Unfreeze'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openCardRequestManager(c, 'DELETE')}
                                      className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-[11px] font-semibold hover:bg-rose-100 transition cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ) : c.status === 'ISSUANCE_DECLINED' || c.status === 'TERMINATED' || c.status === 'EXPIRED' ? (
                                  <button
                                    type="button"
                                    onClick={() => openCardRequestManager(c, 'DELETE')}
                                    className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-[11px] font-semibold hover:bg-rose-100 transition cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400">No actions</span>
                                )}
                              </AdminTd>
                            </AdminTr>
                            );
                          })
                        )}
                      </AdminTableBody>
                    </AdminTable>

                {/* Card request manager: approve / decline / delete */}
                {cardIssuanceModal && (
                  <AdminModal
                    open={Boolean(cardIssuanceModal)}
                    onClose={() => {
                      setCardIssuanceModal(null);
                      setCardIssuanceDecision('APPROVE');
                    }}
                    title="Manage Card Request"
                    footer={
                      <>
                        <AdminButton
                          variant="secondary"
                          onClick={() => {
                            setCardIssuanceModal(null);
                            setCardIssuanceDecision('APPROVE');
                          }}
                        >
                          Cancel
                        </AdminButton>
                        <AdminButton
                          onClick={handleCardIssuanceReview}
                          disabled={loading || cardIssuanceReason.trim().length < 5}
                          variant={
                            cardIssuanceDecision === 'DELETE'
                              ? 'danger'
                              : cardIssuanceDecision === 'DECLINE'
                                ? 'secondary'
                                : 'primary'
                          }
                          className={
                            cardIssuanceDecision === 'DECLINE'
                              ? '!bg-amber-600 hover:!bg-amber-700 !text-white !border-transparent'
                              : ''
                          }
                        >
                          {loading
                            ? 'Working...'
                            : cardIssuanceDecision === 'APPROVE'
                              ? 'Approve & Issue'
                              : cardIssuanceDecision === 'DECLINE'
                                ? 'Decline Request'
                                : 'Delete Request'}
                        </AdminButton>
                      </>
                    }
                  >
                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-700 space-y-1">
                        <div>
                          Status: <strong>{cardIssuanceModal.status}</strong>
                        </div>
                        <div>
                          Cardholder:{' '}
                          <strong>{cardIssuanceModal.syntheticCardholderName}</strong>
                        </div>
                        <div>
                          Type:{' '}
                          <strong>
                            {cardIssuanceModal.type} · {cardIssuanceModal.form}
                          </strong>
                        </div>
                        <div>
                          Currency: <strong className="font-mono">{cardIssuanceModal.currency}</strong>
                        </div>
                        <div>
                          Monthly limit: <strong>{cardIssuanceModal.formattedDailyLimit}</strong>
                        </div>
                        <div>
                          Single tx limit:{' '}
                          <strong>{cardIssuanceModal.formattedSingleTxLimit}</strong>
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 pt-1">
                          {cardIssuanceModal.id} · User {cardIssuanceModal.userId}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Action</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              { id: 'APPROVE', label: 'Approve' },
                              { id: 'DECLINE', label: 'Decline' },
                              { id: 'DELETE', label: 'Delete' },
                            ] as const
                          ).map((opt) => {
                            const pendingOnly =
                              cardIssuanceModal.status === 'PENDING_REVIEW' ||
                              cardIssuanceModal.status === 'REQUESTED';
                            // Approve/Decline only for pending requests; Delete available for any card.
                            const disabled = opt.id !== 'DELETE' && !pendingOnly;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => setCardIssuanceDecision(opt.id)}
                                className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                  cardIssuanceDecision === opt.id
                                    ? opt.id === 'DELETE'
                                      ? 'bg-rose-600 border-rose-600 text-white'
                                      : opt.id === 'DECLINE'
                                        ? 'bg-amber-600 border-amber-600 text-white'
                                        : 'bg-brand-primary border-brand-primary text-white'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5">
                          {cardIssuanceDecision === 'APPROVE'
                            ? 'Issues the card and makes it active for the customer.'
                            : cardIssuanceDecision === 'DECLINE'
                              ? 'Rejects the request; the customer sees a declined status.'
                              : 'Permanently removes this card from the system (audited). Open holds must be cleared first.'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Operator notes <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          placeholder={
                            cardIssuanceDecision === 'DELETE'
                              ? 'Why is this card request being deleted...'
                              : 'Document identity checks, risk notes, or decline rationale...'
                          }
                          value={cardIssuanceReason}
                          onChange={(e) => setCardIssuanceReason(e.target.value)}
                          rows={3}
                          className={`w-full ${adminInputClass}`}
                        />
                      </div>

                      </AdminModal>
                )}

                {/* Card Status Modal */}
                {cardStatusModal && (
                  <AdminModal
                    open={Boolean(cardStatusModal)}
                    onClose={() => setCardStatusModal(null)}
                    title={`Update Card Lifecycle Status (${cardStatusModal.maskedPan})`}
                    footer={
                      <>
                        <AdminButton variant="secondary" onClick={() => setCardStatusModal(null)}>
                          Cancel
                        </AdminButton>
                        <AdminButton
                          onClick={handleUpdateCardStatus}
                          disabled={loading || cardStatusReason.trim().length < 5}
                        >
                          {loading ? 'Updating...' : 'Confirm Card Status'}
                        </AdminButton>
                      </>
                    }
                  >

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Target Status</label>
                        <select
                          value={newCardStatus}
                          onChange={(e) => setNewCardStatus(e.target.value as any)}
                          className={`w-full ${adminSelectClass}`}
                        >
                          <option value="ACTIVE_SIMULATED">Active (permit POS authorizations)</option>
                          <option value="FROZEN">FROZEN (Block New Authorizations)</option>
                          <option value="TERMINATED">TERMINATED (Permanent Closure)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Operator Reason <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          placeholder="Specify reason for card freeze, reported fraud, or customer request..."
                          value={cardStatusReason}
                          onChange={(e) => setCardStatusReason(e.target.value)}
                          rows={3}
                          className={`w-full ${adminInputClass}`}
                        />
                      </div>

                      </AdminModal>
                )}
              </div>
  );
};
