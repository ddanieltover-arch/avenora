/**
 * @license Apache-2.0
 * Admin control center — audit tab section (extracted).
 */

import React from 'react';
import {
  Download,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminButton,
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
} from '../ui';

export interface AdminAuditSectionProps {
  loading: boolean;
  auditLogs: any[];
  auditSearch: string;
  setAuditSearch: (v: string) => void;
  auditActionFilter: string;
  setAuditActionFilter: (v: string) => void;
  fetchAuditLogs: () => void;
  exportAuditLogsJson: () => void;
}

export const AdminAuditSection: React.FC<AdminAuditSectionProps> = ({
  loading,
  auditLogs,
  auditSearch,
  setAuditSearch,
  auditActionFilter,
  setAuditActionFilter,
  fetchAuditLogs,
  exportAuditLogsJson,
}) => {
  return (
    <div className="space-y-6">
                <AdminPageHeader
              title="Immutable Administrative Audit Trail"
              subtitle="Complete log of sensitive actions across actors, roles, resources, reasons, and correlation IDs with automatic PII redaction."
              actions={
                <>
                  <AdminButton variant="secondary" onClick={exportAuditLogsJson}>
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </AdminButton>
                  <AdminButton onClick={fetchAuditLogs}>
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </AdminButton>
                </>
              }
            />

                {/* Filter */}
                <AdminFilterBar className="md:flex-row">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search by action, actor, resource ID, or reason..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchAuditLogs()}
                      className={`w-full pl-9 ${adminInputClass}`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={auditActionFilter}
                      onChange={(e) => setAuditActionFilter(e.target.value)}
                      className={adminSelectClass}
                    >
                      <option value="ALL">All Actions</option>
                      <option value="USER_STATUS_CHANGED">USER_STATUS_CHANGED</option>
                      <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
                      <option value="KYC_REVIEWED">KYC_REVIEWED</option>
                      <option value="TRANSACTION_REVERSED">TRANSACTION_REVERSED</option>
                      <option value="CARD_STATUS_CHANGED">CARD_STATUS_CHANGED</option>
                      <option value="LOAN_APPLICATION_REVIEWED">LOAN_APPLICATION_REVIEWED</option>
                      <option value="GRANT_PROGRAM_VERIFIED">GRANT_PROGRAM_VERIFIED</option>
                      <option value="GRANT_AWARD_DISBURSED">GRANT_AWARD_DISBURSED</option>
                      <option value="JOURNAL_POSTED">JOURNAL_POSTED</option>
                    </select>

                    <AdminButton onClick={fetchAuditLogs}>Apply</AdminButton>
                  </div>
                </AdminFilterBar>

                {/* Audit Logs Table */}
                <AdminTable>
                      <AdminTableHead>
                        <AdminTr>
                          <AdminTh>Action</AdminTh>
                          <AdminTh>Actor & Role</AdminTh>
                          <AdminTh>Resource</AdminTh>
                          <AdminTh>Transition</AdminTh>
                          <AdminTh>Documented Reason</AdminTh>
                          <AdminTh className="text-right">Timestamp</AdminTh>
                        </AdminTr>
                      </AdminTableHead>
                      <AdminTableBody>
                        {auditLogs.length === 0 ? (
                          <AdminTr>
                            <AdminTd colSpan={6}>
                              <AdminEmptyState title="No audit records found." />
                            </AdminTd>
                          </AdminTr>
                        ) : (
                          auditLogs.map((log) => (
                            <AdminTr key={log.id} className="hover:bg-slate-50 transition">
                              <AdminTd>
                                <span className="font-mono font-bold text-slate-800 block">{log.action}</span>
                                <span className="font-mono text-[10px] text-slate-400">{log.id}</span>
                              </AdminTd>
                              <AdminTd>
                                <span className="font-semibold text-slate-900 block">{log.actorRole}</span>
                                <span className="font-mono text-[10px] text-slate-500">{log.actorUserId || 'system'}</span>
                              </AdminTd>
                              <AdminTd>
                                <span className="font-semibold text-slate-800 block">{log.resourceType}</span>
                                <span className="font-mono text-[10px] text-slate-500">{log.resourceId || 'N/A'}</span>
                              </AdminTd>
                              <AdminTd>
                                {log.previousState && log.newState ? (
                                  <div className="flex items-center gap-1 text-[11px]">
                                    <span className="text-slate-500 line-through">{log.previousState}</span>
                                    <span>→</span>
                                    <span className="font-bold text-emerald-800">{log.newState}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </AdminTd>
                              <AdminTd className="py-3 px-4 text-slate-700 max-w-xs truncate" title={log.reason}>
                                {log.reason || 'System operation'}
                              </AdminTd>
                              <AdminTd className="py-3 px-4 text-right text-brand-muted">
                                {new Date(log.createdAt).toLocaleString()}
                              </AdminTd>
                            </AdminTr>
                          ))
                        )}
                      </AdminTableBody>
                    </AdminTable>
              </div>
  );
};
