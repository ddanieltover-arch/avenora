/**
 * @license Apache-2.0
 * Admin control center — customers tab section (extracted).
 */

import React from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  Trash2,
  CreditCard,
  Sliders,
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

export interface AdminCustomersSectionProps {
  user: any;
  loading: boolean;
  customers: any[];
  customerSearch: string;
  setCustomerSearch: (v: string) => void;
  customerRoleFilter: string;
  setCustomerRoleFilter: (v: string) => void;
  customerStatusFilter: string;
  setCustomerStatusFilter: (v: string) => void;
  fetchCustomers: () => void;
  inspectCustomer: (id: string) => void;
  selectedCustomer: any;
  setSelectedCustomer: (v: any) => void;
  statusModalCustomer: any;
  setStatusModalCustomer: (v: any) => void;
  newStatusValue: any;
  setNewStatusValue: (v: any) => void;
  statusChangeReason: string;
  setStatusChangeReason: (v: string) => void;
  handleUpdateCustomerStatus: () => void;
  roleModalCustomer: any;
  setRoleModalCustomer: (v: any) => void;
  newRoleValue: string;
  setNewRoleValue: (v: string) => void;
  roleChangeReason: string;
  setRoleChangeReason: (v: string) => void;
  handleUpdateCustomerRole: () => void;
  deleteModalCustomer: any;
  setDeleteModalCustomer: (v: any) => void;
  deleteCustomerReason: string;
  setDeleteCustomerReason: (v: string) => void;
  handleDeleteCustomer: () => void;
  fundingDirection: 'CREDIT' | 'DEBIT';
  setFundingDirection: (v: 'CREDIT' | 'DEBIT') => void;
  fundingCurrency: string;
  setFundingCurrency: (v: string) => void;
  fundingAmount: string;
  setFundingAmount: (v: string) => void;
  fundingReason: string;
  setFundingReason: (v: string) => void;
  handleFundingAdjustment: () => void;
}

export const AdminCustomersSection: React.FC<AdminCustomersSectionProps> = ({
  user,
  loading,
  customers,
  customerSearch,
  setCustomerSearch,
  customerRoleFilter,
  setCustomerRoleFilter,
  customerStatusFilter,
  setCustomerStatusFilter,
  fetchCustomers,
  inspectCustomer,
  selectedCustomer,
  setSelectedCustomer,
  statusModalCustomer,
  setStatusModalCustomer,
  newStatusValue,
  setNewStatusValue,
  statusChangeReason,
  setStatusChangeReason,
  handleUpdateCustomerStatus,
  roleModalCustomer,
  setRoleModalCustomer,
  newRoleValue,
  setNewRoleValue,
  roleChangeReason,
  setRoleChangeReason,
  handleUpdateCustomerRole,
  deleteModalCustomer,
  setDeleteModalCustomer,
  deleteCustomerReason,
  setDeleteCustomerReason,
  handleDeleteCustomer,
  fundingDirection,
  setFundingDirection,
  fundingCurrency,
  setFundingCurrency,
  fundingAmount,
  setFundingAmount,
  fundingReason,
  setFundingReason,
  handleFundingAdjustment,
}) => {
  return (
    <div className="space-y-6">
                <AdminPageHeader
              title="Customer Management"
              subtitle="Search, inspect accounts, and apply audited status restrictions with mandatory operator reasons."
              actions={
                <AdminButton variant="secondary" onClick={fetchCustomers}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh List</span>
                </AdminButton>
              }
            />

                {/* Filter Bar */}
                <AdminFilterBar className="md:flex-row">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search by name, email, user ID, or country..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
                      className={`w-full pl-9 ${adminInputClass}`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={customerRoleFilter}
                      onChange={(e) => {
                        setCustomerRoleFilter(e.target.value);
                      }}
                      className={adminSelectClass}
                    >
                      <option value="ALL">All Roles</option>
                      <option value="CUSTOMER">Customer</option>
                      <option value="SUPPORT">Support Specialist</option>
                      <option value="COMPLIANCE_REVIEWER">Compliance Reviewer</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>

                    <select
                      value={customerStatusFilter}
                      onChange={(e) => {
                        setCustomerStatusFilter(e.target.value);
                      }}
                      className={adminSelectClass}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="LOCKED">Locked</option>
                      <option value="PENDING_VERIFICATION">Pending Verification</option>
                    </select>

                    <AdminButton onClick={fetchCustomers}>Filter</AdminButton>
                  </div>
                </AdminFilterBar>

                {/* Customers Table */}
                <AdminTable>
                      <AdminTableHead>
                        <AdminTr>
                          <AdminTh>Customer</AdminTh>
                          <AdminTh>Role</AdminTh>
                          <AdminTh>Account Status</AdminTh>
                          <AdminTh>KYC Tier / Status</AdminTh>
                          <AdminTh>Registered Date</AdminTh>
                          <AdminTh className="text-right">Administrative Actions</AdminTh>
                        </AdminTr>
                      </AdminTableHead>
                      <AdminTableBody>
                        {customers.length === 0 ? (
                          <AdminTr>
                            <AdminTd colSpan={6}>
                              <AdminEmptyState title="No customer records found matching the specified filters." />
                            </AdminTd>
                          </AdminTr>
                        ) : (
                          customers.map((c) => (
                            <AdminTr key={c.id} className="hover:bg-slate-50/80 transition">
                              <AdminTd>
                                <div className="font-semibold text-brand-deep">{c.fullName}</div>
                                <div className="text-[11px] text-brand-muted flex items-center gap-1.5 mt-0.5">
                                  <span>{c.email}</span>
                                  <span>·</span>
                                  <span className="font-mono text-[10px] bg-slate-100 px-1 rounded">{c.id}</span>
                                  <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                                    {c.countryCode}
                                  </span>
                                </div>
                              </AdminTd>
                              <AdminTd>
                                <AdminBadge tone={badgeToneForStatus(c.role)}>{c.role}</AdminBadge>
                              </AdminTd>
                              <AdminTd>
                                <AdminBadge tone={badgeToneForStatus(c.status)}>{c.status}</AdminBadge>
                              </AdminTd>
                              <AdminTd>
                                <AdminBadge tone={badgeToneForStatus(c.kycStatus)}>{c.kycStatus}</AdminBadge>
                              </AdminTd>
                              <AdminTd className="py-3 px-4 text-brand-muted">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </AdminTd>
                              <AdminTd className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => inspectCustomer(c.id)}
                                    title="Inspect customer accounts & transactions"
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-brand-primary" />
                                  </button>

                                  {['SUPPORT', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStatusModalCustomer(c);
                                        setNewStatusValue(c.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                                      }}
                                      title="Update customer account status"
                                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                    >
                                      {c.status === 'ACTIVE' ? (
                                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                                      ) : (
                                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                      )}
                                    </button>
                                  )}

                                  {user?.role === 'SUPER_ADMIN' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRoleModalCustomer(c);
                                        setNewRoleValue(c.role);
                                      }}
                                      title="Modify user role (Super Admin only)"
                                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                    >
                                      <Sliders className="w-3.5 h-3.5 text-purple-600" />
                                    </button>
                                  )}

                                  {['ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') &&
                                    c.id !== user?.id && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeleteModalCustomer(c);
                                          setDeleteCustomerReason('');
                                        }}
                                        title="Delete user account"
                                        className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                </div>
                              </AdminTd>
                            </AdminTr>
                          ))
                        )}
                      </AdminTableBody>
                    </AdminTable>

                {/* Customer Inspection Drawer */}
                {selectedCustomer && (
                  <AdminModal
                    open={Boolean(selectedCustomer)}
                    onClose={() => setSelectedCustomer(null)}
                    title={`Customer Profile: ${selectedCustomer.customer.fullName}`}
                    description={`ID: ${selectedCustomer.customer.id} · Email: ${selectedCustomer.customer.email}`}
                    size="lg"
                    footer={
                      <AdminButton variant="secondary" onClick={() => setSelectedCustomer(null)}>
                        Close Drawer
                      </AdminButton>
                    }
                  >

                      {/* Multicurrency Wallets & Balances */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-brand-deep mb-2">Multicurrency Wallets</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {selectedCustomer.wallet?.accounts?.map((acc: any) => (
                            <div key={acc.currency} className="p-2.5 rounded-lg bg-brand-warm border border-slate-200">
                              <span className="text-[10px] text-brand-muted block font-semibold">{acc.currency} Wallet</span>
                              <span className="text-sm font-bold text-brand-deep block">{acc.formattedBalance}</span>
                              <span className="text-[10px] text-amber-700 font-mono block">Hold: {acc.formattedHold}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {['ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') &&
                        selectedCustomer.customer?.role === 'CUSTOMER' && (
                          <div className="p-3 rounded-lg border border-brand-primary/25 bg-brand-warm space-y-3">
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-brand-deep mb-1">
                                Funding adjustment
                              </h4>
                              <p className="text-[10px] text-brand-muted">
                                Queues a pending hold for approve/reject. Credit → deposit queue; debit →
                                withdrawal queue. Reason required.
                              </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-semibold text-brand-muted uppercase block mb-1">
                                  Direction
                                </label>
                                <select
                                  value={fundingDirection}
                                  onChange={(e) =>
                                    setFundingDirection(e.target.value as 'CREDIT' | 'DEBIT')
                                  }
                                  className={`w-full ${adminSelectClass}`}
                                >
                                  <option value="CREDIT">Credit (add funds)</option>
                                  <option value="DEBIT">Debit (remove funds)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-brand-muted uppercase block mb-1">
                                  Currency
                                </label>
                                <select
                                  value={fundingCurrency}
                                  onChange={(e) => setFundingCurrency(e.target.value)}
                                  className={`w-full ${adminSelectClass}`}
                                >
                                  {(selectedCustomer.wallet?.accounts || []).map((acc: any) => (
                                    <option key={acc.currency} value={acc.currency}>
                                      {acc.currency}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-brand-muted uppercase block mb-1">
                                Amount
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={fundingAmount}
                                onChange={(e) => setFundingAmount(e.target.value)}
                                placeholder="e.g. 100.00"
                                className={`w-full ${adminInputClass}`}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-brand-muted uppercase block mb-1">
                                Reason <span className="text-rose-600">*</span>
                              </label>
                              <textarea
                                value={fundingReason}
                                onChange={(e) => setFundingReason(e.target.value)}
                                placeholder="Document why funds are being added or removed..."
                                className={`w-full min-h-[64px] ${adminInputClass}`}
                              />
                            </div>
                            <div className="flex justify-end">
                              <AdminButton
                              type="button"
                              onClick={handleFundingAdjustment}
                              disabled={
                                loading ||
                                !fundingCurrency ||
                                !fundingAmount.trim() ||
                                fundingReason.trim().length < 3
                              }
                            >
                              Queue {fundingDirection === 'CREDIT' ? 'credit' : 'debit'}
                            </AdminButton>
                            </div>
                          </div>
                        )}

                      {/* Payment Cards */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-brand-deep mb-2">Associated Cards (Masked)</h4>
                        {selectedCustomer.cards?.length === 0 ? (
                          <p className="text-xs text-slate-400">No cards issued to this customer.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {selectedCustomer.cards?.map((card: any) => (
                              <div key={card.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-3.5 h-3.5 text-brand-primary" />
                                  <span className="font-mono font-semibold">{card.maskedPan}</span>
                                  <span className="text-[10px] text-slate-500">Exp: {card.syntheticExpiry}</span>
                                </div>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                                  {card.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Recent Transactions */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-brand-deep mb-2">Recent Transactions</h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {selectedCustomer.recentTransactions?.length === 0 ? (
                            <p className="text-xs text-slate-400">No recent transactions recorded.</p>
                          ) : (
                            selectedCustomer.recentTransactions?.map((tx: any) => (
                              <div key={tx.transactionId} className="p-2 rounded-lg bg-brand-warm border border-slate-200 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-semibold text-slate-800 block">{tx.referenceNumber}</span>
                                  <span className="text-[10px] text-brand-muted">{tx.narration || tx.operationType}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-slate-900 block">{tx.formattedAmount}</span>
                                  <span className={`text-[10px] font-bold ${tx.status === 'POSTED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {tx.status}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      </AdminModal>
                )}

                {/* Status Change Confirmation Modal */}
                {statusModalCustomer && (
                  <AdminModal
                    open={Boolean(statusModalCustomer)}
                    onClose={() => setStatusModalCustomer(null)}
                    title={`Update Account Status: ${statusModalCustomer.fullName}`}
                    description="High-impact administrative action. Changes take effect immediately and are logged to the immutable audit trail."
                    tone="warning"
                    footer={
                      <>
                        <AdminButton variant="secondary" onClick={() => setStatusModalCustomer(null)}>
                          Cancel
                        </AdminButton>
                        <AdminButton
                          onClick={handleUpdateCustomerStatus}
                          disabled={loading || statusChangeReason.trim().length < 5}
                        >
                          {loading ? 'Submitting...' : 'Confirm Status Change'}
                        </AdminButton>
                      </>
                    }
                  >

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">New Status Target</label>
                        <select
                          value={newStatusValue}
                          onChange={(e) => setNewStatusValue(e.target.value as any)}
                          className={`w-full ${adminSelectClass}`}
                        >
                          <option value="ACTIVE">ACTIVE (Restore Account Access)</option>
                          <option value="PENDING_VERIFICATION">PENDING VERIFICATION (Inactive until KYC)</option>
                          <option value="SUSPENDED">SUSPENDED (Temporary Operational Hold)</option>
                          <option value="LOCKED">LOCKED (Security Lockout)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Documented Operational Reason <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          placeholder="Specify the regulatory, compliance, or fraud justification for this status change..."
                          value={statusChangeReason}
                          onChange={(e) => setStatusChangeReason(e.target.value)}
                          rows={3}
                          className={`w-full ${adminInputClass}`}
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">Minimum 5 characters required for audit durability.</span>
                      </div>

                      </AdminModal>
                )}

                {/* Role Modification Modal (SUPER_ADMIN) */}
                {roleModalCustomer && (
                  <AdminModal
                    open={Boolean(roleModalCustomer)}
                    onClose={() => setRoleModalCustomer(null)}
                    title={`Modify User Role: ${roleModalCustomer.fullName}`}
                    footer={
                      <>
                        <AdminButton variant="secondary" onClick={() => setRoleModalCustomer(null)}>
                          Cancel
                        </AdminButton>
                        <AdminButton
                          onClick={handleUpdateCustomerRole}
                          disabled={loading || roleChangeReason.trim().length < 5}
                          className="!bg-purple-800 hover:!bg-purple-900"
                        >
                          {loading ? 'Updating...' : 'Authorize Role Change'}
                        </AdminButton>
                      </>
                    }
                  >

                      <div className="p-3 bg-purple-50 rounded-lg text-xs text-purple-900 border border-purple-200">
                        <strong>SUPER_ADMIN RESTRICTION:</strong> Modifying internal roles alters permissions across all API endpoints immediately.
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Target RBAC Role</label>
                        <select
                          value={newRoleValue}
                          onChange={(e) => setNewRoleValue(e.target.value)}
                          className={`w-full ${adminSelectClass}`}
                        >
                          <option value="CUSTOMER">CUSTOMER (Standard User)</option>
                          <option value="SUPPORT">SUPPORT (Customer Support Specialist)</option>
                          <option value="COMPLIANCE_REVIEWER">COMPLIANCE_REVIEWER (KYC & Underwriting Reviewer)</option>
                          <option value="ADMIN">ADMIN (Operations Administrator)</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Authority)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Reason for Role Change <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          placeholder="Document executive approval, organizational ticket, or compliance authorization reference..."
                          value={roleChangeReason}
                          onChange={(e) => setRoleChangeReason(e.target.value)}
                          rows={3}
                          className={`w-full ${adminInputClass}`}
                        />
                      </div>

                      </AdminModal>
                )}

                {/* Delete Customer Modal */}
                {deleteModalCustomer && (
                  <AdminModal
                    open={Boolean(deleteModalCustomer)}
                    onClose={() => {
                      setDeleteModalCustomer(null);
                      setDeleteCustomerReason('');
                    }}
                    title={`Delete Account: ${deleteModalCustomer.fullName}`}
                    tone="danger"
                    footer={
                      <>
                        <AdminButton
                          variant="secondary"
                          type="button"
                          onClick={() => {
                            setDeleteModalCustomer(null);
                            setDeleteCustomerReason('');
                          }}
                        >
                          Cancel
                        </AdminButton>
                        <AdminButton
                          variant="danger"
                          type="button"
                          onClick={handleDeleteCustomer}
                          disabled={loading || deleteCustomerReason.trim().length < 5}
                        >
                          {loading ? 'Deleting...' : 'Delete Account'}
                        </AdminButton>
                      </>
                    }
                  >

                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 space-y-1">
                        <p className="font-semibold">This permanently removes the account.</p>
                        <p>
                          <strong>{deleteModalCustomer.email}</strong>
                        </p>
                        <p className="font-mono text-[10px] text-rose-800/80">{deleteModalCustomer.id}</p>
                        <p className="text-rose-800/90 pt-1">
                          Sessions are revoked immediately. This action is audited and cannot be undone in this prototype.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Documented reason <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          placeholder="Why is this account being deleted..."
                          value={deleteCustomerReason}
                          onChange={(e) => setDeleteCustomerReason(e.target.value)}
                          rows={3}
                          className={`w-full ${adminInputClass}`}
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">Minimum 5 characters required.</span>
                      </div>

                      </AdminModal>
                )}
              </div>
  );
};
