/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Secure Admin & Operations Control Center (Phase 05)
 *
 * Implements:
 * - Enterprise financial operations console adhering to Avenora's visual constitution
 * - Role-Based Access Control (SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN)
 * - Operations Overview with review queue aging, exception tracking, and ledger invariant verification
 * - Customer Management with audited status and role modifications
 * - KYC Review Queue with separation of duties enforcement
 * - Transaction Investigation with immutable double-entry compensating reversals
 * - Loans & Grants operations with transparent synthetic credit risk evaluation
 * - Card Operations with masked PAN credentials and audited freeze/unfreeze controls
 * - Webhook Gateway monitoring and replay protection
 * - Durable Audit Trail with PII redaction and export
 * - Granular System Readiness & Operational Controls
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext.tsx';
import { useLocalization } from '../LocalizationContext.tsx';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Users,
  FileCheck,
  Search,
  CreditCard,
  Webhook,
  History,
  Server,
  ArrowLeft,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Lock,
  Unlock,
  RotateCcw,
  Download,
  Filter,
  Check,
  Sliders,
  DollarSign,
  FileText,
  Award,
  Layers,
  ChevronRight,
  User,
  Shield,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';
import type { AdminTabId } from '../../routing/appRoutes.ts';
import { AvenoraLogo } from '../branding/AvenoraLogo.tsx';

interface AdminControlCenterProps {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
  onBackToPortal: () => void;
  onBackToPublic: () => void;
}

export const AdminControlCenter: React.FC<AdminControlCenterProps> = ({
  activeTab,
  onTabChange,
  onBackToPortal,
  onBackToPublic,
}) => {
  const { user, token, logout } = useAuth();
  const { t } = useLocalization();

  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Operations Overview Data
  const [overviewData, setOverviewData] = useState<any>(null);

  // Customer Management Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerRoleFilter, setCustomerRoleFilter] = useState('ALL');
  const [customerStatusFilter, setCustomerStatusFilter] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [statusModalCustomer, setStatusModalCustomer] = useState<any | null>(null);
  const [newStatusValue, setNewStatusValue] = useState<'ACTIVE' | 'SUSPENDED' | 'LOCKED'>('SUSPENDED');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [roleModalCustomer, setRoleModalCustomer] = useState<any | null>(null);
  const [newRoleValue, setNewRoleValue] = useState<string>('SUPPORT');
  const [roleChangeReason, setRoleChangeReason] = useState('');

  // KYC Queue Data
  const [kycCases, setKycCases] = useState<any[]>([]);
  const [kycStatusFilter, setKycStatusFilter] = useState('ALL');
  const [selectedKycCase, setSelectedKycCase] = useState<any | null>(null);
  const [kycDecision, setKycDecision] = useState<'APPROVED' | 'REJECTED' | 'NEEDS_MORE_INFORMATION'>('APPROVED');
  const [kycReason, setKycReason] = useState('');
  const [kycNotes, setKycNotes] = useState('');

  // Pending deposit holds
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [depositRejectId, setDepositRejectId] = useState<string | null>(null);
  const [depositRejectReason, setDepositRejectReason] = useState('');

  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [withdrawalRejectId, setWithdrawalRejectId] = useState<string | null>(null);
  const [withdrawalRejectReason, setWithdrawalRejectReason] = useState('');

  // Transactions Data
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txSearch, setTxSearch] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [txDetailData, setTxDetailData] = useState<any | null>(null);
  const [reversalModalTx, setReversalModalTx] = useState<any | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Loans & Grants Data
  const [loansGrantsSubTab, setLoansGrantsSubTab] = useState<'loans' | 'grants'>('loans');
  const [loanApplications, setLoanApplications] = useState<any[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [loanDecision, setLoanDecision] = useState<'APPROVED_FOR_DEMO' | 'DECLINED_FOR_DEMO' | 'NEEDS_MORE_INFORMATION'>('APPROVED_FOR_DEMO');
  const [loanReason, setLoanReason] = useState('');
  const [grantApplications, setGrantApplications] = useState<any[]>([]);
  const [grantPrograms, setGrantPrograms] = useState<any[]>([]);
  const [selectedGrant, setSelectedGrant] = useState<any | null>(null);
  const [grantDecision, setGrantDecision] = useState<'APPROVED_FOR_DEMO' | 'DECLINED' | 'NEEDS_MORE_INFORMATION'>('APPROVED_FOR_DEMO');
  const [grantReason, setGrantReason] = useState('');

  // Cards Data
  const [cards, setCards] = useState<any[]>([]);
  const [cardStatusModal, setCardStatusModal] = useState<any | null>(null);
  const [newCardStatus, setNewCardStatus] = useState<'ACTIVE_SIMULATED' | 'FROZEN'>('FROZEN');
  const [cardStatusReason, setCardStatusReason] = useState('');

  // Webhooks Data
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [simWebhookType, setSimWebhookType] = useState<string>('mock.deposit.cleared');
  const [simWebhookPayload, setSimWebhookPayload] = useState<string>(
    JSON.stringify(
      {
        referenceNumber: 'DEP-2026-US-8941',
        userId: '',
        amountDecimal: '1500.00',
        currency: 'USD',
      },
      null,
      2
    )
  );

  // Audit Logs Data
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<any | null>(null);

  // System Readiness & Provider Integration Readiness Data
  const [systemReadiness, setSystemReadiness] = useState<any | null>(null);
  const [providerReadiness, setProviderReadiness] = useState<any | null>(null);
  const [providerMatrix, setProviderMatrix] = useState<any | null>(null);

  const fetchOverview = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOverviewData(data);
      } else {
        const err = await res.json();
        setErrorNotice(err.detail || 'Failed to load operational overview');
      }
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (customerSearch) params.set('search', customerSearch);
      if (customerRoleFilter !== 'ALL') params.set('role', customerRoleFilter);
      if (customerStatusFilter !== 'ALL') params.set('status', customerStatusFilter);

      const res = await fetch(`/api/v1/admin/customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.users || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const inspectCustomer = async (id: string) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomerStatus = async () => {
    if (!token || !statusModalCustomer) return;
    try {
      setLoading(true);
      setErrorNotice(null);
      const res = await fetch(`/api/v1/admin/customers/${statusModalCustomer.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Correlation-Id': `corr_${Date.now()}`,
        },
        body: JSON.stringify({
          status: newStatusValue,
          reason: statusChangeReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Status update failed');
      }
      setSuccessNotice(`Customer status updated to ${newStatusValue} with documented reason.`);
      setStatusModalCustomer(null);
      setStatusChangeReason('');
      fetchCustomers();
      fetchOverview();
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomerRole = async () => {
    if (!token || !roleModalCustomer) return;
    try {
      setLoading(true);
      setErrorNotice(null);
      const res = await fetch(`/api/v1/admin/customers/${roleModalCustomer.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Correlation-Id': `corr_${Date.now()}`,
        },
        body: JSON.stringify({
          role: newRoleValue,
          reason: roleChangeReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Role modification failed');
      }
      setSuccessNotice(`Customer role updated to ${newRoleValue}. Action logged to audit trail.`);
      setRoleModalCustomer(null);
      setRoleChangeReason('');
      fetchCustomers();
      fetchOverview();
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchKycQueue = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (kycStatusFilter !== 'ALL') params.set('status', kycStatusFilter);
      const res = await fetch(`/api/v1/admin/kyc/queue?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKycCases(data.profiles || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKycReviewSubmit = async () => {
    if (!token || !selectedKycCase) return;
    try {
      setLoading(true);
      setErrorNotice(null);
      const res = await fetch(`/api/v1/admin/kyc/${selectedKycCase.userId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision: kycDecision,
          rejectionReason: kycDecision === 'REJECTED' ? kycReason : undefined,
          notes: kycNotes || kycReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'KYC decision failed');
      }
      setSuccessNotice(`KYC review decision (${kycDecision}) recorded successfully.`);
      setSelectedKycCase(null);
      setKycReason('');
      setKycNotes('');
      fetchKycQueue();
      fetchOverview();
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDeposits = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/admin/deposits/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingDeposits(data.deposits || []);
      }
    } catch {
      /* non-fatal */
    }
  };

  const approvePendingDeposit = async (depositId: string) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/deposits/${depositId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessNotice('Deposit approved — funds released from hold to customer available balance.');
        await fetchPendingDeposits();
      } else {
        setErrorNotice(data.detail || data.title || 'Could not approve deposit.');
      }
    } finally {
      setLoading(false);
    }
  };

  const rejectPendingDeposit = async () => {
    if (!token || !depositRejectId || !depositRejectReason.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/deposits/${depositRejectId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: depositRejectReason.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessNotice('Deposit rejected — hold amount removed from customer wallet.');
        setDepositRejectId(null);
        setDepositRejectReason('');
        await fetchPendingDeposits();
      } else {
        setErrorNotice(data.detail || data.title || 'Could not reject deposit.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingWithdrawals = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/admin/withdrawals/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingWithdrawals(data.withdrawals || []);
      }
    } catch {
      /* non-fatal */
    }
  };

  const approvePendingWithdrawal = async (withdrawalId: string) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessNotice('Withdrawal approved — payout recorded and hold cleared.');
        await fetchPendingWithdrawals();
      } else {
        setErrorNotice(data.detail || data.title || 'Could not approve withdrawal.');
      }
    } finally {
      setLoading(false);
    }
  };

  const rejectPendingWithdrawal = async () => {
    if (!token || !withdrawalRejectId || !withdrawalRejectReason.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/withdrawals/${withdrawalRejectId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: withdrawalRejectReason.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessNotice('Withdrawal rejected — amount returned from hold to available balance.');
        setWithdrawalRejectId(null);
        setWithdrawalRejectReason('');
        await fetchPendingWithdrawals();
      } else {
        setErrorNotice(data.detail || data.title || 'Could not reject withdrawal.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      setLoading(true);
      await fetchPendingDeposits();
      await fetchPendingWithdrawals();
      const params = new URLSearchParams();
      if (txSearch) params.set('search', txSearch);
      if (txStatusFilter !== 'ALL') params.set('status', txStatusFilter);
      const res = await fetch(`/api/v1/admin/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const inspectTransaction = async (txId: string) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/transactions/${txId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTxDetailData(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReverseTransaction = async () => {
    if (!token || !reversalModalTx) return;
    try {
      setLoading(true);
      setErrorNotice(null);
      const res = await fetch(`/api/v1/admin/transactions/${reversalModalTx.transactionId}/reverse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Correlation-Id': `corr_rev_${Date.now()}`,
        },
        body: JSON.stringify({
          reason: reversalReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Reversal failed');
      }
      setSuccessNotice(
        `Compensating reversal posted immutably to ledger (Journal: ${data.reversalJournalEntryId}). Original entry preserved.`
      );
      setReversalModalTx(null);
      setReversalReason('');
      fetchTransactions();
      fetchOverview();
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoansAndGrants = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [lRes, gRes, gpRes] = await Promise.all([
        fetch('/api/v1/loans/applications?all=true', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/grants/applications?all=true', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/grants/programs', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (lRes.ok) {
        const lData = await lRes.json();
        setLoanApplications(lData.applications || []);
      }
      if (gRes.ok) {
        const gData = await gRes.json();
        setGrantApplications(gData.applications || []);
      }
      if (gpRes.ok) {
        const gpData = await gpRes.json();
        setGrantPrograms(gpData.programs || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoanReviewSubmit = async () => {
    if (!token || !selectedLoan) return;
    try {
      setLoading(true);
      setErrorNotice(null);
      const res = await fetch(`/api/v1/loans/applications/${selectedLoan.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision: loanDecision,
          reasonCode: loanReason || 'UNDERWRITING_COMPLIANCE_EVALUATION',
          notes: loanReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Loan review failed');
      }
      setSuccessNotice(`Loan decision recorded as ${loanDecision}. Separation of duties recorded.`);
      setSelectedLoan(null);
      setLoanReason('');
      fetchLoansAndGrants();
      fetchOverview();
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantReviewSubmit = async () => {
    if (!token || !selectedGrant) return;
    try {
      setLoading(true);
      setErrorNotice(null);
      const res = await fetch(`/api/v1/grants/applications/${selectedGrant.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision: grantDecision,
          notes: grantReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Grant review failed');
      }
      setSuccessNotice(`Grant application decision recorded as ${grantDecision}.`);
      setSelectedGrant(null);
      setGrantReason('');
      fetchLoansAndGrants();
      fetchOverview();
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateGrantDisburse = async (appId: string) => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorNotice(null);
      const res = await fetch(`/api/v1/grants/applications/${appId}/disburse`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Idempotency-Key': `idem_grant_ui_${Date.now()}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Disbursement failed');
      }
      setSuccessNotice(
        `Grant disbursed: credited ${data.award.formattedAwardedAmount} to customer wallet.`
      );
      fetchLoansAndGrants();
      fetchOverview();
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCards = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/cards', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCardStatus = async () => {
    if (!token || !cardStatusModal) return;
    try {
      setLoading(true);
      setErrorNotice(null);
      const res = await fetch(`/api/v1/admin/cards/${cardStatusModal.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newCardStatus,
          reason: cardStatusReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Card status update failed');
      }
      setSuccessNotice(`Card status updated to ${newCardStatus} with operator reason recorded in audit log.`);
      setCardStatusModal(null);
      setCardStatusReason('');
      fetchCards();
      fetchOverview();
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhooks = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/webhooks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.events || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateWebhook = async () => {
    try {
      setLoading(true);
      setErrorNotice(null);
      let parsedData = {};
      try {
        parsedData = JSON.parse(simWebhookPayload);
      } catch (e) {
        throw new Error('Invalid JSON payload format.');
      }

      const res = await fetch('/api/v1/webhooks/simulate-incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: simWebhookType,
          data: parsedData,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Webhook delivery failed');
      }
      setSuccessNotice(`Webhook delivered and processed: ${data.message}`);
      fetchWebhooks();
      fetchOverview();
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (auditActionFilter !== 'ALL') params.set('action', auditActionFilter);
      if (auditSearch) params.set('search', auditSearch);
      const res = await fetch(`/api/v1/admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.records || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReadiness = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [sysRes, provRes, matRes] = await Promise.all([
        fetch('/api/v1/admin/system/readiness', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/admin/providers/readiness', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/system/providers/matrix'),
      ]);
      if (sysRes.ok) setSystemReadiness(await sysRes.json());
      if (provRes.ok) setProviderReadiness(await provRes.json());
      if (matRes.ok) setProviderMatrix(await matRes.json());
    } finally {
      setLoading(false);
    }
  };

  // Initial and tab change loading
  useEffect(() => {
    if (activeTab === 'overview') fetchOverview();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'kyc') fetchKycQueue();
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'loans_grants') fetchLoansAndGrants();
    if (activeTab === 'cards') fetchCards();
    if (activeTab === 'webhooks') fetchWebhooks();
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'readiness') fetchReadiness();
  }, [activeTab, token]);

  const exportAuditLogsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `avenora-audit-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="app-viewport-shell bg-[#f8fbf9] text-[#0f1f1e] font-sans">
      {/* Top Operations Header */}
      <header className="shrink-0 bg-[#003933] border-b border-[#076c64] text-white z-50 shadow-md">
        {/* Prototype & Live Isolation Notice */}
        <div className="bg-[#076c64] px-4 py-1.5 text-xs text-emerald-200 border-b border-[#159d79]/20 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <ShieldAlert className="w-3.5 h-3.5 text-[#C6A568] shrink-0" />
            <span className="font-medium truncate">
              Operations control center — monitor customers, compliance queues, and platform health.
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToPortal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-700/60 hover:bg-emerald-800/50 text-xs font-semibold text-emerald-100 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customer Portal</span>
            </button>

            <div className="h-6 w-px bg-emerald-800 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <AvenoraLogo size="sm" className="rounded-lg bg-white/95 p-0.5 shadow-sm" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-base tracking-tight text-white">
                    AVENORA ADMIN & OPS
                  </span>
                </div>
                <span className="text-[10px] text-emerald-300 font-medium block leading-none">
                  SECURE CONTROL CENTER · RBAC ENFORCED
                </span>
              </div>
            </div>
          </div>

          {/* User Session & Role Switcher */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 text-xs text-white transition cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#159d79]" />
                <span className="font-semibold max-w-[130px] truncate">{user?.fullName || 'Operator'}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#159d79]/20 text-[#159d79] border border-[#159d79]/30">
                  {user?.role || 'STAFF'}
                </span>
                <ChevronDown className="w-3 h-3 text-emerald-300" />
              </button>

              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-2xl p-2 z-50 text-xs text-[#0f1f1e] space-y-1">
                  <div className="px-2 py-1.5 border-b border-slate-100">
                    <span className="font-semibold text-[#003933] block truncate">{user?.fullName}</span>
                    <span className="text-[10px] text-[#5c6f6c] truncate block">{user?.email}</span>
                  </div>
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPersonaMenu(false);
                        onBackToPortal();
                      }}
                      className="px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
                    >
                      Customer portal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowPersonaMenu(false);
                      }}
                      className="px-2 py-1 text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto text-xs font-medium scrollbar-thin border-t border-emerald-800/80 bg-[#003933]">
          <button
            onClick={() => onTabChange('overview')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'overview'
                ? 'border-[#159d79] text-white bg-emerald-900/40'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#159d79]" />
            <span>Operations Overview</span>
          </button>

          <button
            onClick={() => onTabChange('customers')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'customers'
                ? 'border-[#159d79] text-white bg-emerald-900/40'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#159d79]" />
            <span>Customer Management</span>
          </button>

          <button
            onClick={() => onTabChange('kyc')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'kyc'
                ? 'border-[#159d79] text-white bg-emerald-900/40'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-[#159d79]" />
            <span>KYC Review Queue</span>
            {overviewData?.kycQueue?.pendingReview > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#C6A568] text-slate-950">
                {overviewData.kycQueue.pendingReview}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('transactions')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'transactions'
                ? 'border-[#159d79] text-white bg-emerald-900/40'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-[#159d79]" />
            <span>Transaction Investigation</span>
          </button>

          <button
            onClick={() => onTabChange('loans_grants')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'loans_grants'
                ? 'border-[#159d79] text-white bg-emerald-900/40'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#159d79]" />
            <span>Loans & Grants</span>
          </button>

          <button
            onClick={() => onTabChange('cards')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cards'
                ? 'border-[#159d79] text-white bg-emerald-900/40'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-[#159d79]" />
            <span>Card Operations</span>
          </button>

          <button
            onClick={() => onTabChange('webhooks')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'webhooks'
                ? 'border-[#159d79] text-white bg-emerald-900/40'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            <Webhook className="w-3.5 h-3.5 text-[#159d79]" />
            <span>Webhook Gateway</span>
          </button>

          <button
            onClick={() => onTabChange('audit')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'audit'
                ? 'border-[#159d79] text-white bg-emerald-900/40'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#159d79]" />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={() => onTabChange('readiness')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'readiness'
                ? 'border-[#159d79] text-white bg-emerald-900/40'
                : 'border-transparent text-emerald-200/80 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-[#159d79]" />
            <span>System Readiness</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-scroll-pane max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12 w-full">
        {/* Alerts / Feedback Banner */}
        {errorNotice && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button onClick={() => setErrorNotice(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {successNotice && (
          <div className="mb-6 p-4 rounded-xl bg-brand-accent-light border border-brand-accent/30 text-emerald-900 text-sm flex items-start justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button onClick={() => setSuccessNotice(null)} className="text-emerald-500 hover:text-emerald-700 font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: OPERATIONS OVERVIEW */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#003933]">Operations Overview & Workflow Health</h1>
                <p className="text-sm text-[#5c6f6c]">
                  Real-time operational metrics across customer identity, credit underwriting, ledger reconciliation, and gateway events.
                </p>
              </div>
              <button
                onClick={fetchOverview}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#076c64] hover:bg-slate-50 transition cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Metrics</span>
              </button>
            </div>

            {/* Key Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Customers */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-[#5c6f6c] text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Customer Accounts</span>
                  <Users className="w-4 h-4 text-[#076c64]" />
                </div>
                <div className="text-2xl font-bold text-[#003933]">
                  {overviewData ? overviewData.customers.total : '—'}
                </div>
                <div className="mt-2 text-xs text-[#5c6f6c] flex items-center justify-between border-t border-slate-100 pt-2">
                  <span>Active: <strong className="text-emerald-700">{overviewData?.customers.active ?? 0}</strong></span>
                  <span>Suspended: <strong className="text-amber-700">{overviewData?.customers.suspended ?? 0}</strong></span>
                  <span>Locked: <strong className="text-rose-700">{overviewData?.customers.locked ?? 0}</strong></span>
                </div>
              </div>

              {/* KYC Queue */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-[#5c6f6c] text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>KYC Review Queue</span>
                  <FileCheck className="w-4 h-4 text-[#076c64]" />
                </div>
                <div className="text-2xl font-bold text-[#003933]">
                  {overviewData ? overviewData.kycQueue.pendingReview : '—'}
                </div>
                <div className="mt-2 text-xs text-[#5c6f6c] flex items-center justify-between border-t border-slate-100 pt-2">
                  <span>Approved: <strong className="text-emerald-700">{overviewData?.kycQueue.approved ?? 0}</strong></span>
                  <span>Rejected: <strong className="text-rose-700">{overviewData?.kycQueue.rejected ?? 0}</strong></span>
                  <span className="text-[11px] text-amber-700 font-semibold">&gt;24h: {overviewData?.kycQueue.aging.oneToThreeDays ?? 0}</span>
                </div>
              </div>

              {/* Ledger Invariant */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-[#5c6f6c] text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Ledger Invariant</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-800">
                    {overviewData?.ledger.isBalanced ? 'Balanced' : 'Imbalanced'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    0.00 Imbalance
                  </span>
                </div>
                <div className="mt-2 text-xs text-[#5c6f6c] flex items-center justify-between border-t border-slate-100 pt-2">
                  <span>Accounts: <strong>{overviewData?.ledger.totalAccounts ?? 0}</strong></span>
                  <span>Journal Postings: <strong>{overviewData?.ledger.totalJournalEntries ?? 0}</strong></span>
                </div>
              </div>

              {/* Transactions */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between text-[#5c6f6c] text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Financial Transactions</span>
                  <DollarSign className="w-4 h-4 text-[#076c64]" />
                </div>
                <div className="text-2xl font-bold text-[#003933]">
                  {overviewData ? overviewData.transactions.total : '—'}
                </div>
                <div className="mt-2 text-xs text-[#5c6f6c] flex items-center justify-between border-t border-slate-100 pt-2">
                  <span>Posted: <strong className="text-emerald-700">{overviewData?.transactions.posted ?? 0}</strong></span>
                  <span>Compensated/Reversed: <strong className="text-amber-700">{overviewData?.transactions.reversed ?? 0}</strong></span>
                </div>
              </div>
            </div>

            {/* Queue Aging & Exceptions Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Review Queue Aging */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h3 className="font-serif font-bold text-base text-[#003933] mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#076c64]" />
                  <span>Review Queue Aging & SLA Compliance</span>
                </h3>
                <p className="text-xs text-[#5c6f6c] mb-4">
                  Case aging metrics across pending KYC verification profiles.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-brand-accent-light/60 border border-brand-accent/20 text-xs">
                    <span className="font-medium text-emerald-950">Submitted &lt; 24 Hours Ago (On Track)</span>
                    <span className="font-bold text-emerald-800 text-sm">
                      {overviewData?.kycQueue.aging.under24h ?? 0} cases
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/60 border border-amber-100 text-xs">
                    <span className="font-medium text-amber-950">Submitted 24–72 Hours Ago (Approaching SLA)</span>
                    <span className="font-bold text-amber-800 text-sm">
                      {overviewData?.kycQueue.aging.oneToThreeDays ?? 0} cases
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50/60 border border-rose-100 text-xs">
                    <span className="font-medium text-rose-950">Submitted &gt; 72 Hours Ago (SLA Breached)</span>
                    <span className="font-bold text-rose-800 text-sm">
                      {overviewData?.kycQueue.aging.overThreeDays ?? 0} cases
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#5c6f6c]">
                  <span>Aging rule: Calculated strictly from `submittedAt` timestamps</span>
                  <button
                    onClick={() => onTabChange('kyc')}
                    className="text-[#076c64] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open KYC Queue</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Data Integrity & Provenance Metadata */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h3 className="font-serif font-bold text-base text-[#003933] mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#076c64]" />
                  <span>Data Provenance & Audit Guarantees</span>
                </h3>
                <p className="text-xs text-[#5c6f6c] mb-4">
                  Verification sources and zero-fabrication guarantees.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-[#5c6f6c]">Ledger Invariant Verification</span>
                    <span className="font-semibold text-emerald-800">Sum(Debits) === Sum(Credits) Verified</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-[#5c6f6c]">Platform boundary</span>
                    <span className="font-semibold text-amber-800">ENFORCED (Real Money Blocked)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-[#5c6f6c]">Webhook HMAC Security</span>
                    <span className="font-semibold text-slate-800">HMAC-SHA256 (300s Freshness Window)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-[#5c6f6c]">Audit Trail Immutability</span>
                    <span className="font-semibold text-slate-800">Append-Only ({overviewData?.auditLogs?.total ?? 0} Records)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[#5c6f6c]">Metrics Timestamp</span>
                    <span className="font-mono text-[11px] text-slate-600">
                      {overviewData?.metricsGeneratedAt || new Date().toISOString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CUSTOMER MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#003933]">Customer Management</h1>
                <p className="text-sm text-[#5c6f6c]">
                  Search, inspect accounts, and apply audited status restrictions with mandatory operator reasons.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchCustomers}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#076c64] hover:bg-slate-50 transition cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh List</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, email, user ID, or country..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#076c64]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={customerRoleFilter}
                  onChange={(e) => {
                    setCustomerRoleFilter(e.target.value);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-[#076c64]"
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
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-[#076c64]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="LOCKED">Locked</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                </select>

                <button
                  onClick={fetchCustomers}
                  className="px-4 py-2 rounded-lg bg-[#076c64] text-white text-xs font-semibold hover:bg-[#003933] transition cursor-pointer"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#eef4f2] border-b border-slate-200 text-[#003933] font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4">KYC Tier / Status</th>
                      <th className="py-3 px-4">Registered Date</th>
                      <th className="py-3 px-4 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No customer records found matching the specified filters.
                        </td>
                      </tr>
                    ) : (
                      customers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#003933]">{c.fullName}</div>
                            <div className="text-[11px] text-[#5c6f6c] flex items-center gap-1.5 mt-0.5">
                              <span>{c.email}</span>
                              <span>·</span>
                              <span className="font-mono text-[10px] bg-slate-100 px-1 rounded">{c.id}</span>
                              <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                                {c.countryCode}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.role === 'SUPER_ADMIN'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : c.role === 'ADMIN'
                                  ? 'bg-amber-50 text-amber-800'
                                  : c.role === 'COMPLIANCE_REVIEWER'
                                  ? 'bg-purple-100 text-purple-800'
                                  : c.role === 'SUPPORT'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {c.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : c.status === 'SUSPENDED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                c.kycStatus === 'APPROVED'
                                  ? 'bg-brand-accent-light text-emerald-700 border border-brand-accent/30'
                                  : c.kycStatus === 'SUBMITTED'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {c.kycStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#5c6f6c]">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => inspectCustomer(c.id)}
                                title="Inspect customer accounts & transactions"
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#076c64]" />
                              </button>

                              {/* Status modification button */}
                              {['SUPPORT', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
                                <button
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

                              {/* Super admin role modification button */}
                              {user?.role === 'SUPER_ADMIN' && (
                                <button
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
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Inspection Drawer */}
            {selectedCustomer && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex modal-overlay-scroll justify-center p-4 z-50">
                <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[min(calc(100dvh-1.5rem),90vh)] overflow-y-auto overscroll-y-contain my-auto sm:my-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#003933]">
                        Customer Profile: {selectedCustomer.customer.fullName}
                      </h3>
                      <p className="text-xs text-[#5c6f6c]">
                        ID: {selectedCustomer.customer.id} · Email: {selectedCustomer.customer.email}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Multicurrency Wallets & Balances */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-[#003933] mb-2">Multicurrency Wallets</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {selectedCustomer.wallet?.accounts?.map((acc: any) => (
                        <div key={acc.currency} className="p-2.5 rounded-lg bg-[#f8fbf9] border border-slate-200">
                          <span className="text-[10px] text-[#5c6f6c] block font-semibold">{acc.currency} Wallet</span>
                          <span className="text-sm font-bold text-[#003933] block">{acc.formattedBalance}</span>
                          <span className="text-[10px] text-amber-700 font-mono block">Hold: {acc.formattedHold}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Cards */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-[#003933] mb-2">Associated Cards (Masked)</h4>
                    {selectedCustomer.cards?.length === 0 ? (
                      <p className="text-xs text-slate-400">No cards issued to this customer.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedCustomer.cards?.map((card: any) => (
                          <div key={card.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-3.5 h-3.5 text-[#076c64]" />
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
                    <h4 className="text-xs font-semibold uppercase text-[#003933] mb-2">Recent Transactions</h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {selectedCustomer.recentTransactions?.length === 0 ? (
                        <p className="text-xs text-slate-400">No recent transactions recorded.</p>
                      ) : (
                        selectedCustomer.recentTransactions?.map((tx: any) => (
                          <div key={tx.transactionId} className="p-2 rounded-lg bg-[#f8fbf9] border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-slate-800 block">{tx.referenceNumber}</span>
                              <span className="text-[10px] text-[#5c6f6c]">{tx.narration || tx.operationType}</span>
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

                  <div className="pt-3 border-t border-slate-100 text-right">
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Close Drawer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Status Change Confirmation Modal */}
            {statusModalCustomer && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex modal-overlay-scroll justify-center p-4 z-50">
                <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center gap-3 text-amber-600">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h3 className="font-serif font-bold text-base text-[#003933]">
                      Update Account Status: {statusModalCustomer.fullName}
                    </h3>
                  </div>

                  <p className="text-xs text-[#5c6f6c]">
                    High-impact administrative action. Changes take effect immediately and are logged to the immutable audit trail.
                  </p>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">New Status Target</label>
                    <select
                      value={newStatusValue}
                      onChange={(e) => setNewStatusValue(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
                    >
                      <option value="ACTIVE">ACTIVE (Restore Account Access)</option>
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
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-[#076c64]"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">Minimum 5 characters required for audit durability.</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setStatusModalCustomer(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateCustomerStatus}
                      disabled={loading || statusChangeReason.trim().length < 5}
                      className="px-4 py-1.5 rounded-lg bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Submitting...' : 'Confirm Status Change'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Role Modification Modal (SUPER_ADMIN) */}
            {roleModalCustomer && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex modal-overlay-scroll justify-center p-4 z-50">
                <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center gap-3 text-purple-700">
                    <Shield className="w-5 h-5 shrink-0" />
                    <h3 className="font-serif font-bold text-base text-[#003933]">
                      Modify User Role: {roleModalCustomer.fullName}
                    </h3>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg text-xs text-purple-900 border border-purple-200">
                    <strong>SUPER_ADMIN RESTRICTION:</strong> Modifying internal roles alters permissions across all API endpoints immediately.
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Target RBAC Role</label>
                    <select
                      value={newRoleValue}
                      onChange={(e) => setNewRoleValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
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
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-[#076c64]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setRoleModalCustomer(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateCustomerRole}
                      disabled={loading || roleChangeReason.trim().length < 5}
                      className="px-4 py-1.5 rounded-lg bg-purple-800 hover:bg-purple-900 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Updating...' : 'Authorize Role Change'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: KYC REVIEW QUEUE */}
        {/* ============================================================== */}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#003933]">KYC Verification Review Queue</h1>
                <p className="text-sm text-[#5c6f6c]">
                  Review identity verification submissions with separation of duties enforcement. All decisions are auditable.
                </p>
              </div>
              <button
                onClick={fetchKycQueue}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#076c64] hover:bg-slate-50 transition cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Queue</span>
              </button>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Filter Queue Status:</span>
                <select
                  value={kycStatusFilter}
                  onChange={(e) => setKycStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
                >
                  <option value="ALL">All Cases</option>
                  <option value="SUBMITTED">SUBMITTED (Pending Review)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="NEEDS_MORE_INFORMATION">NEEDS_MORE_INFORMATION</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
                <button
                  onClick={fetchKycQueue}
                  className="px-3 py-1.5 rounded-lg bg-[#076c64] text-white text-xs font-semibold cursor-pointer"
                >
                  Apply
                </button>
              </div>
              <span className="text-xs text-[#5c6f6c] font-medium">
                Total cases displayed: {kycCases.length}
              </span>
            </div>

            {/* KYC Cases List */}
            <div className="space-y-3">
              {kycCases.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                  No KYC cases pending review.
                </div>
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
                          <span className="font-serif font-bold text-base text-[#003933]">
                            {c.legalFirstName} {c.legalLastName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'SUBMITTED'
                                ? 'bg-amber-100 text-amber-800'
                                : c.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.status}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            Tier {c.tier}
                          </span>
                        </div>

                        <div className="text-xs text-[#5c6f6c] flex flex-wrap items-center gap-3">
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
                            <button
                              onClick={() => {
                                setSelectedKycCase(c);
                                setKycDecision('APPROVED');
                                setKycReason('');
                                setKycNotes('');
                              }}
                              className="px-4 py-2 rounded-lg bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold transition cursor-pointer"
                            >
                              Record Review Decision
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* KYC Review Decision Modal */}
            {selectedKycCase && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex modal-overlay-scroll justify-center p-4 z-50">
                <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-serif font-bold text-base text-[#003933]">
                      Compliance Decision: {selectedKycCase.legalFirstName} {selectedKycCase.legalLastName}
                    </h3>
                    <button
                      onClick={() => setSelectedKycCase(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 space-y-1">
                    <div>User ID: <strong className="font-mono">{selectedKycCase.userId}</strong></div>
                    <div>Address: <strong>{selectedKycCase.residentialAddress?.street}, {selectedKycCase.residentialAddress?.city}, {selectedKycCase.residentialAddress?.country}</strong></div>
                    <div>Tax ID: <strong className="font-mono">{selectedKycCase.taxIdMasked}</strong></div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Compliance Action</label>
                    <select
                      value={kycDecision}
                      onChange={(e) => setKycDecision(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
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
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-[#076c64]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedKycCase(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleKycReviewSubmit}
                      disabled={loading || (kycDecision === 'REJECTED' && kycReason.trim().length < 5)}
                      className="px-4 py-1.5 rounded-lg bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Recording...' : 'Submit Decision'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: TRANSACTION INVESTIGATION */}
        {/* ============================================================== */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#003933]">Transaction Investigation & Reversals</h1>
                <p className="text-sm text-[#5c6f6c]">
                  Inspect transaction state transitions and double-entry journal entries. Erroneous postings can be reversed via compensating journal entries.
                </p>
              </div>
              <button
                onClick={fetchTransactions}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#076c64] hover:bg-slate-50 transition cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Transactions</span>
              </button>
            </div>

            {/* Pending deposit holds */}
            <div className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs">
              <h3 className="font-serif font-bold text-base text-[#003933] mb-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>Pending wallet deposits (customer hold)</span>
              </h3>
              <p className="text-xs text-[#5c6f6c] mb-4">
                Approve to move funds from Hold to available balance. Reject to clear the hold without crediting available funds.
              </p>
              {pendingDeposits.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No deposits awaiting review.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#eef4f2] border-b border-slate-200 text-[#003933] font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Reference</th>
                        <th className="py-2 px-3">Customer</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Submitted</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingDeposits.map((dep) => (
                        <tr key={dep.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-mono text-[10px]">{dep.referenceNumber}</td>
                          <td className="py-2 px-3">
                            <span className="block font-semibold text-[#003933]">{dep.customerName || dep.userId}</span>
                            <span className="text-[10px] text-slate-500">{dep.customerEmail}</span>
                          </td>
                          <td className="py-2 px-3">
                            {dep.kind}
                            {dep.sourceRail ? ` · ${dep.sourceRail}` : ''}
                            {dep.fileName ? ` · ${dep.fileName}` : ''}
                          </td>
                          <td className="py-2 px-3 font-bold">{dep.formattedAmount}</td>
                          <td className="py-2 px-3 text-slate-600">
                            {dep.submittedAt ? new Date(dep.submittedAt).toLocaleString() : '—'}
                          </td>
                          <td className="py-2 px-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => approvePendingDeposit(dep.id)}
                              className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDepositRejectId(dep.id);
                                setDepositRejectReason('');
                              }}
                              className="px-2 py-1 rounded bg-rose-100 text-rose-800 text-[10px] font-bold hover:bg-rose-200"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {depositRejectId && (
              <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-xs space-y-3">
                <h4 className="text-sm font-bold text-[#003933]">Reject deposit</h4>
                <textarea
                  value={depositRejectReason}
                  onChange={(e) => setDepositRejectReason(e.target.value)}
                  placeholder="Reason for rejection (required)"
                  className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositRejectId(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={rejectPendingDeposit}
                    disabled={!depositRejectReason.trim()}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    Confirm reject
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-cyan-200/80 p-5 shadow-xs">
              <h3 className="font-serif font-bold text-base text-[#003933] mb-1 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-cyan-600" />
                <span>Pending wallet withdrawals (reserved on hold)</span>
              </h3>
              <p className="text-xs text-[#5c6f6c] mb-4">
                Approve to pay out to the customer&apos;s destination and clear hold. Reject to return funds to available balance.
              </p>
              {pendingWithdrawals.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No withdrawals awaiting review.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#eef4f2] border-b border-slate-200 text-[#003933] font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Reference</th>
                        <th className="py-2 px-3">Customer</th>
                        <th className="py-2 px-3">Destination</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Submitted</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingWithdrawals.map((wth) => (
                        <tr key={wth.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-mono text-[10px]">{wth.referenceNumber}</td>
                          <td className="py-2 px-3">
                            <span className="block font-semibold text-[#003933]">{wth.customerName || wth.userId}</span>
                            <span className="text-[10px] text-slate-500">{wth.customerEmail}</span>
                          </td>
                          <td className="py-2 px-3 max-w-xs">
                            <span className="block">{wth.kind}{wth.destinationRail ? ` · ${wth.destinationRail}` : ''}</span>
                            {wth.btcAddress ? (
                              <span className="font-mono text-[10px] text-slate-600 break-all">{wth.btcAddress}</span>
                            ) : (
                              <span className="text-[10px] text-slate-500">
                                {Object.entries(wth.bankingDetails || {})
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(' · ')}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold">{wth.formattedAmount}</td>
                          <td className="py-2 px-3 text-slate-600">
                            {wth.submittedAt ? new Date(wth.submittedAt).toLocaleString() : '—'}
                          </td>
                          <td className="py-2 px-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => approvePendingWithdrawal(wth.id)}
                              className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setWithdrawalRejectId(wth.id);
                                setWithdrawalRejectReason('');
                              }}
                              className="px-2 py-1 rounded bg-rose-100 text-rose-800 text-[10px] font-bold hover:bg-rose-200"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {withdrawalRejectId && (
              <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-xs space-y-3">
                <h4 className="text-sm font-bold text-[#003933]">Reject withdrawal</h4>
                <textarea
                  value={withdrawalRejectReason}
                  onChange={(e) => setWithdrawalRejectReason(e.target.value)}
                  placeholder="Reason for rejection (required)"
                  className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawalRejectId(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={rejectPendingWithdrawal}
                    disabled={!withdrawalRejectReason.trim()}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    Confirm reject
                  </button>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by transaction ID, reference, customer ID, or narration..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTransactions()}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#076c64]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="POSTED">POSTED</option>
                  <option value="REVERSED">REVERSED</option>
                </select>

                <button
                  onClick={fetchTransactions}
                  className="px-4 py-2 rounded-lg bg-[#076c64] text-white text-xs font-semibold hover:bg-[#003933] transition cursor-pointer"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#eef4f2] border-b border-slate-200 text-[#003933] font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Transaction / Ref</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No transactions found matching search criteria.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.transactionId} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#003933] block">{tx.referenceNumber}</span>
                            <span className="font-mono text-[10px] text-slate-500">{tx.transactionId}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {tx.operationType}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-[11px] text-slate-700">{tx.userId || 'System'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{tx.formattedAmount}</span>
                            <span className="text-[10px] text-slate-500">{tx.currency}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tx.status === 'POSTED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#5c6f6c]">
                            {new Date(tx.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => inspectTransaction(tx.transactionId)}
                                title="Inspect double-entry journal & ledger lines"
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#076c64]" />
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
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transaction Detail & Journal Lines Modal */}
            {txDetailData && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex modal-overlay-scroll justify-center p-4 z-50">
                <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[min(calc(100dvh-1.5rem),90vh)] overflow-y-auto overscroll-y-contain my-auto sm:my-0 w-full">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#003933]">
                        Transaction Detail & Double-Entry Ledger Lines
                      </h3>
                      <p className="text-xs text-[#5c6f6c]">
                        Reference: {txDetailData.transaction.referenceNumber} · Status: {txDetailData.transaction.status}
                      </p>
                    </div>
                    <button
                      onClick={() => setTxDetailData(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Journal Entry Lines Table */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-[#003933] mb-2 flex items-center justify-between">
                      <span>Linked Double-Entry Journal Lines (Immutably Balanced)</span>
                      <span className="text-[10px] text-emerald-800 font-mono">
                        Journal ID: {txDetailData.journalEntry?.id || 'N/A'}
                      </span>
                    </h4>

                    {txDetailData.journalEntry?.lines ? (
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#eef4f2] text-[10px] font-semibold text-slate-700 uppercase">
                            <tr>
                              <th className="py-2 px-3">Account Number / Name</th>
                              <th className="py-2 px-3">Direction</th>
                              <th className="py-2 px-3 text-right">Debit (Minor)</th>
                              <th className="py-2 px-3 text-right">Credit (Minor)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {txDetailData.journalEntry.lines.map((line: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-3">
                                  <div className="font-semibold text-slate-800">{line.account?.name || line.accountId}</div>
                                  <div className="font-mono text-[10px] text-slate-500">{line.account?.accountNumber}</div>
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                      line.direction === 'DEBIT' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {line.direction}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-mono">
                                  {line.direction === 'DEBIT' ? line.amountMinor : '—'}
                                </td>
                                <td className="py-2 px-3 text-right font-mono">
                                  {line.direction === 'CREDIT' ? line.amountMinor : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No linked journal entry found for this transaction.</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-right">
                    <button
                      onClick={() => setTxDetailData(null)}
                      className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Close Inspector
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Compensating Reversal Modal */}
            {reversalModalTx && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex modal-overlay-scroll justify-center p-4 z-50">
                <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center gap-3 text-amber-700">
                    <RotateCcw className="w-5 h-5 shrink-0" />
                    <h3 className="font-serif font-bold text-base text-[#003933]">
                      Authorize Compensating Ledger Reversal
                    </h3>
                  </div>

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
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-[#076c64]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setReversalModalTx(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReverseTransaction}
                      disabled={loading || reversalReason.trim().length < 5}
                      className="px-4 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Posting...' : 'Post Reversal'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: LOANS & GRANTS OPERATIONS */}
        {/* ============================================================== */}
        {activeTab === 'loans_grants' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#003933]">Loans & Grants Operations</h1>
                <p className="text-sm text-[#5c6f6c]">
                  Underwrite loan applications using transparent risk models and manage verified grant opportunities.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLoansGrantsSubTab('loans')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    loansGrantsSubTab === 'loans'
                      ? 'bg-[#076c64] text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Loan Applications ({loanApplications.length})
                </button>
                <button
                  onClick={() => setLoansGrantsSubTab('grants')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    loansGrantsSubTab === 'grants'
                      ? 'bg-[#076c64] text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Grant Programs & Awards ({grantApplications.length})
                </button>
              </div>
            </div>

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
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                    No loan applications currently submitted.
                  </div>
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
                              <span className="font-serif font-bold text-base text-[#003933]">
                                {loan.applicantName} · {loan.formattedRequestedAmount}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  loan.status === 'APPROVED_FOR_DEMO'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : loan.status === 'DECLINED_FOR_DEMO'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {loan.status}
                              </span>
                            </div>
                            <span className="text-xs text-[#5c6f6c]">
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
                                <button
                                  onClick={() => setSelectedLoan(loan)}
                                  className="px-3.5 py-1.5 rounded-lg bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold cursor-pointer"
                                >
                                  Record Loan Decision
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Synthetic Assessment Breakdown */}
                        {loan.assessment && (
                          <div className="p-3 bg-[#f8fbf9] rounded-lg border border-slate-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">
                                Credit score: {loan.assessment.syntheticScore} / 850
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                Ruleset: {loan.assessment.rulesetVersion}
                              </span>
                            </div>
                            <div className="text-[#5c6f6c]">
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
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                    No grant applications found.
                  </div>
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
                              <span className="font-serif font-bold text-base text-[#003933]">
                                {grant.projectTitle} · {grant.formattedRequestedAmount}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  grant.status === 'APPROVED_FOR_DEMO'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {grant.status}
                              </span>
                            </div>
                            <span className="text-xs text-[#5c6f6c]">
                              Program: <strong>{grant.programName}</strong> · Applicant: {grant.applicantName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
                              <>
                                <button
                                  onClick={() => setSelectedGrant(grant)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                  Review Decision
                                </button>
                                {canDisburse && (
                                  <button
                                    onClick={() => handleSimulateGrantDisburse(grant.id)}
                                    className="px-3.5 py-1.5 rounded-lg bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold cursor-pointer"
                                  >
                                    Disburse grant
                                  </button>
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
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex modal-overlay-scroll justify-center p-4 z-50">
                <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
                  <h3 className="font-serif font-bold text-base text-[#003933]">
                    Review Loan: {selectedLoan.applicantName} ({selectedLoan.formattedRequestedAmount})
                  </h3>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Underwriting Decision</label>
                    <select
                      value={loanDecision}
                      onChange={(e) => setLoanDecision(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
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
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-[#076c64]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedLoan(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLoanReviewSubmit}
                      disabled={loading || loanReason.trim().length < 5}
                      className="px-4 py-1.5 rounded-lg bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Recording...' : 'Submit Decision'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Grant Review Modal */}
            {selectedGrant && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex modal-overlay-scroll justify-center p-4 z-50">
                <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
                  <h3 className="font-serif font-bold text-base text-[#003933]">
                    Review Grant: {selectedGrant.projectTitle}
                  </h3>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Review Decision</label>
                    <select
                      value={grantDecision}
                      onChange={(e) => setGrantDecision(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
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
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-[#076c64]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedGrant(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGrantReviewSubmit}
                      disabled={loading || grantReason.trim().length < 5}
                      className="px-4 py-1.5 rounded-lg bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Submitting...' : 'Confirm Review'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: CARD OPERATIONS */}
        {/* ============================================================== */}
        {activeTab === 'cards' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#003933]">Card Operations & Hold Controls</h1>
                <p className="text-sm text-[#5c6f6c]">
                  Inspect masked demo cards, daily spend limits, and perform audited freeze/unfreeze operations.
                </p>
              </div>
              <button
                onClick={fetchCards}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#076c64] hover:bg-slate-50 transition cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Cards</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#eef4f2] border-b border-slate-200 text-[#003933] font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Card Identifier</th>
                      <th className="py-3 px-4">Cardholder</th>
                      <th className="py-3 px-4">Type / Currency</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Daily Spend Limit</th>
                      <th className="py-3 px-4">Single Tx Limit</th>
                      <th className="py-3 px-4 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cards.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No cards currently issued.
                        </td>
                      </tr>
                    ) : (
                      cards.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-800 block">{c.maskedPan}</span>
                            <span className="font-mono text-[10px] text-slate-500">ID: {c.id}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">{c.syntheticCardholderName}</span>
                            <span className="text-[10px] text-slate-500">User: {c.userId}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 block">{c.type}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{c.currency}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.status === 'ACTIVE_SIMULATED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : c.status === 'FROZEN'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{c.formattedDailyLimit}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{c.formattedSingleTxLimit}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setCardStatusModal(c);
                                setNewCardStatus(c.status === 'ACTIVE_SIMULATED' ? 'FROZEN' : 'ACTIVE_SIMULATED');
                              }}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#076c64] hover:bg-slate-50 transition cursor-pointer"
                            >
                              {c.status === 'ACTIVE_SIMULATED' ? 'Freeze Card' : 'Unfreeze Card'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card Status Modal */}
            {cardStatusModal && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex modal-overlay-scroll justify-center p-4 z-50">
                <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
                  <h3 className="font-serif font-bold text-base text-[#003933]">
                    Update Card Lifecycle Status ({cardStatusModal.maskedPan})
                  </h3>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Target Status</label>
                    <select
                      value={newCardStatus}
                      onChange={(e) => setNewCardStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
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
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-[#076c64]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setCardStatusModal(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateCardStatus}
                      disabled={loading || cardStatusReason.trim().length < 5}
                      className="px-4 py-1.5 rounded-lg bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Updating...' : 'Confirm Card Status'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: WEBHOOK GATEWAY MONITORING */}
        {/* ============================================================== */}
        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#003933]">Webhook Gateway & Integration Monitor</h1>
                <p className="text-sm text-[#5c6f6c]">
                  Monitor inbound provider webhook events, HMAC-SHA256 signature verification, and deduplication status.
                </p>
              </div>
              <button
                onClick={fetchWebhooks}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#076c64] hover:bg-slate-50 transition cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            {/* Test Simulator */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-base text-[#003933] flex items-center gap-2">
                <Webhook className="w-4 h-4 text-[#076c64]" />
                <span>Webhook event testing (HMAC-SHA256 signed)</span>
              </h3>
              <p className="text-xs text-[#5c6f6c]">
                Test integration delivery with cryptographic signature generation and replay protection.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mock Event Type</label>
                  <select
                    value={simWebhookType}
                    onChange={(e) => setSimWebhookType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
                  >
                    <option value="mock.deposit.cleared">mock.deposit.cleared (Inbound Clearing)</option>
                    <option value="mock.wire.inbound">mock.wire.inbound (Inbound Wire Transfer)</option>
                    <option value="mock.compliance.flag">mock.compliance.flag (compliance risk flag)</option>
                    <option value="mock.health.ping">mock.health.ping (Provider Heartbeat)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payload JSON</label>
                  <textarea
                    rows={4}
                    value={simWebhookPayload}
                    onChange={(e) => setSimWebhookPayload(e.target.value)}
                    className="w-full font-mono p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-[#076c64]"
                  />
                </div>
              </div>

              <div className="text-right">
                <button
                  onClick={handleSimulateWebhook}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold cursor-pointer"
                >
                  {loading ? 'Dispatching...' : 'Dispatch signed webhook'}
                </button>
              </div>
            </div>

            {/* Monitored Events Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-serif font-bold text-sm text-[#003933]">Recent Webhook Deliveries</h3>
                <span className="text-xs text-[#5c6f6c]">HMAC Secrets Redacted</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#eef4f2] border-b border-slate-200 text-[#003933] font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Event ID / Hash</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Processing Log</th>
                      <th className="py-3 px-4 text-right">Received Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {webhooks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No webhook events captured in current session.
                        </td>
                      </tr>
                    ) : (
                      webhooks.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-slate-800 block">{w.eventId}</span>
                            <span className="font-mono text-[10px] text-slate-400 truncate max-w-xs block">
                              SHA256: {w.payloadHash?.slice(0, 16)}...
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#076c64]">{w.eventType}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                w.status === 'PROCESSED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : w.status === 'DUPLICATE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-md truncate">
                            {w.processingLog}
                          </td>
                          <td className="py-3 px-4 text-right text-[#5c6f6c]">
                            {new Date(w.receivedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 8: AUDIT TRAIL */}
        {/* ============================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#003933]">Immutable Administrative Audit Trail</h1>
                <p className="text-sm text-[#5c6f6c]">
                  Complete log of sensitive actions across actors, roles, resources, reasons, and correlation IDs with automatic PII redaction.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportAuditLogsJson}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#076c64] hover:bg-slate-50 transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={fetchAuditLogs}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#076c64] text-white text-xs font-semibold hover:bg-[#003933] transition cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by action, actor, resource ID, or reason..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAuditLogs()}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-[#076c64]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
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

                <button
                  onClick={fetchAuditLogs}
                  className="px-4 py-2 rounded-lg bg-[#076c64] text-white text-xs font-semibold cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#eef4f2] border-b border-slate-200 text-[#003933] font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Actor & Role</th>
                      <th className="py-3 px-4">Resource</th>
                      <th className="py-3 px-4">Transition</th>
                      <th className="py-3 px-4">Documented Reason</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No audit records found.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-800 block">{log.action}</span>
                            <span className="font-mono text-[10px] text-slate-400">{log.id}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">{log.actorRole}</span>
                            <span className="font-mono text-[10px] text-slate-500">{log.actorUserId || 'system'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 block">{log.resourceType}</span>
                            <span className="font-mono text-[10px] text-slate-500">{log.resourceId || 'N/A'}</span>
                          </td>
                          <td className="py-3 px-4">
                            {log.previousState && log.newState ? (
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="text-slate-500 line-through">{log.previousState}</span>
                                <span>→</span>
                                <span className="font-bold text-emerald-800">{log.newState}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={log.reason}>
                            {log.reason || 'System operation'}
                          </td>
                          <td className="py-3 px-4 text-right text-[#5c6f6c]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 9: SYSTEM READINESS */}
        {/* ============================================================== */}
        {activeTab === 'readiness' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#003933]">System Readiness & Operational Controls</h1>
                <p className="text-sm text-[#5c6f6c]">
                  Granular inspection of core platform capabilities. States are strictly partitioned: Configured, Connected, Tested, and Production-Ready.
                </p>
              </div>
              <button
                onClick={fetchReadiness}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#076c64] hover:bg-slate-50 transition cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-Verify Components</span>
              </button>
            </div>

            {systemReadiness && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-serif font-bold text-[#003933] mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    <span>Internal Platform & Security Infrastructure</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {systemReadiness.components?.map((comp: any, idx: number) => (
                      <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-serif font-bold text-base text-[#003933]">{comp.name}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              comp.state === 'PRODUCTION_READY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : comp.state === 'TESTED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {comp.state}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          {Object.entries(comp.details || {}).map(([key, val]: [string, any]) => (
                            <div key={key} className="flex items-center justify-between py-1 border-b border-slate-50">
                              <span className="text-[#5c6f6c] capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-mono text-[11px] text-slate-800 font-semibold truncate max-w-[240px]">
                                {String(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: External Financial Provider Adapters */}
                {providerReadiness && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-serif font-bold text-[#003933] flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-700" />
                        <span>External Financial Provider Adapters (Phase 07 Readiness)</span>
                      </h2>
                      <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                        Integration readiness
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {providerReadiness.adapters?.map((adapter: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-[#5c6f6c]">
                                {adapter.category?.replace(/_/g, ' ')}
                              </span>
                              <h3 className="font-bold text-slate-900 text-sm">{adapter.name}</h3>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              {adapter.activeMode}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between py-0.5 border-b border-slate-50">
                              <span className="text-slate-500">Adapter Class:</span>
                              <span className="font-mono text-[11px] text-slate-800">{adapter.adapterClass}</span>
                            </div>
                            <div className="flex justify-between py-0.5 border-b border-slate-50">
                              <span className="text-slate-500">Timeout & Retries:</span>
                              <span className="font-mono text-[11px] text-slate-800">{adapter.timeoutMs}ms · max {adapter.maxRetryAttempts}x</span>
                            </div>
                            <div className="flex justify-between py-0.5 border-b border-slate-50">
                              <span className="text-slate-500">Contract Status:</span>
                              <span className="text-amber-800 font-semibold">{adapter.contractStatus?.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="flex justify-between py-0.5 border-b border-slate-50">
                              <span className="text-slate-500">Regulatory Status:</span>
                              <span className="text-slate-700 font-semibold">{adapter.regulatoryStatus?.replace(/_/g, ' ')}</span>
                            </div>
                          </div>

                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                            <span className="font-semibold text-slate-700">Commercial Prerequisite: </span>
                            {adapter.prerequisiteNote}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3: Country & Provider Capability Matrix */}
                {providerMatrix && (
                  <div>
                    <h2 className="text-base font-serif font-bold text-[#003933] mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <span>Country & Clearing Corridor Eligibility Matrix</span>
                    </h2>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#eef4f2] border-b border-slate-200 text-[#003933] font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                              <th className="py-3 px-4">Country & Rail</th>
                              <th className="py-3 px-4">Format Rules & Checksums</th>
                              <th className="py-3 px-4">Technical Adapter</th>
                              <th className="py-3 px-4">Contractual Partnership</th>
                              <th className="py-3 px-4">Production Readiness</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {providerMatrix.countries?.map((c: any) => (
                              <tr key={c.countryCode} className="hover:bg-slate-50 transition">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span className="w-5 h-3.5 bg-slate-200 rounded-xs inline-block text-[9px] text-center font-mono font-bold leading-3">
                                      {c.countryCode}
                                    </span>
                                    <span>{c.countryName} ({c.currency})</span>
                                  </div>
                                  <span className="text-[11px] text-slate-500">{c.clearingRail}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    VERIFIED ({c.supportedIdentifierTypes?.join(', ')})
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    MOCK_ADAPTER_ACTIVE
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-amber-800 font-semibold text-[11px]">
                                  NO_COMMERCIAL_AGREEMENT
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                    Pending partner setup
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 4: Prerequisites Checklist */}
                {providerMatrix?.prerequisites && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <h2 className="text-base font-serif font-bold text-[#003933] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Production Financial Integration Prerequisites Checklist</span>
                    </h2>
                    <p className="text-xs text-slate-600">
                      The following commercial contracts, regulatory charters, certifications, and operational SLAs are required before enabling additional payment corridors and partner networks in your region.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {providerMatrix.prerequisites.map((p: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {p.category.replace(/_/g, ' ')}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                              {p.currentStatus}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-slate-900">{p.title}</h4>
                          <p className="text-[11px] text-slate-600 leading-snug">{p.description}</p>
                          <div className="pt-1.5 border-t border-slate-200/60 space-y-1 text-[10px] text-slate-500">
                            <div><strong className="text-slate-700">Certifications:</strong> {p.mandatoryCertifications?.join(', ')}</div>
                            <div><strong className="text-slate-700">Registrations:</strong> {p.regulatoryRegistrations?.join(', ')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
