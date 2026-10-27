/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Secure Admin & Operations Control Center
 *
 * Shell layout with sidebar navigation; tab panels live in sections/*.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext.tsx';
import {
  ShieldAlert,
  Shield,
  Lock,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { AdminTabId } from '../../routing/appRoutes.ts';
import { AvenoraLogo } from '../branding/AvenoraLogo.tsx';
import { AuthModal } from '../auth/AuthModal.tsx';
import { AdminSidebar } from './AdminSidebar.tsx';
import { AdminTopbar } from './AdminTopbar.tsx';
import { AdminButtonNav } from './AdminButtonNav.tsx';
import { AdminButton } from './ui/AdminButton.tsx';
import {
  AdminOverviewSection,
  AdminCustomersSection,
  AdminKycSection,
  AdminTransactionsSection,
  AdminLoansGrantsSection,
  AdminCardsSection,
  AdminAuditSection,
} from './sections/index.ts';

const STAFF_ROLES = new Set(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']);

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
  const { user, token, logout, loading: authLoading, openAuthModal, authModalOpen } = useAuth();
  const isStaff = Boolean(user?.role && STAFF_ROLES.has(user.role));
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
  const [newStatusValue, setNewStatusValue] = useState<
    'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'PENDING_VERIFICATION'
  >('SUSPENDED');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [roleModalCustomer, setRoleModalCustomer] = useState<any | null>(null);
  const [newRoleValue, setNewRoleValue] = useState<string>('SUPPORT');
  const [roleChangeReason, setRoleChangeReason] = useState('');
  const [deleteModalCustomer, setDeleteModalCustomer] = useState<any | null>(null);
  const [deleteCustomerReason, setDeleteCustomerReason] = useState('');
  const [fundingDirection, setFundingDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [fundingCurrency, setFundingCurrency] = useState('');
  const [fundingAmount, setFundingAmount] = useState('');
  const [fundingReason, setFundingReason] = useState('');

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
  const [cardIssuanceModal, setCardIssuanceModal] = useState<any | null>(null);
  const [cardIssuanceDecision, setCardIssuanceDecision] = useState<'APPROVE' | 'DECLINE' | 'DELETE'>(
    'APPROVE'
  );
  const [cardIssuanceReason, setCardIssuanceReason] = useState('');

  // Audit Logs Data
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');

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
        setFundingDirection('CREDIT');
        setFundingAmount('');
        setFundingReason('');
        setFundingCurrency(data.wallet?.accounts?.[0]?.currency || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFundingAdjustment = async () => {
    if (!token || !selectedCustomer?.customer?.id) return;
    try {
      setLoading(true);
      setErrorNotice(null);
      const res = await fetch(
        `/api/v1/admin/customers/${selectedCustomer.customer.id}/funding-adjustment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Correlation-Id': `corr_${Date.now()}`,
          },
          body: JSON.stringify({
            direction: fundingDirection,
            currency: fundingCurrency,
            amountDecimal: fundingAmount.trim(),
            reason: fundingReason.trim(),
          }),
        }
      );
      const raw = await res.text();
      let data: any = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(
            res.ok
              ? 'Funding adjustment succeeded but returned an unreadable response. Refresh and check the pending queues.'
              : `Funding adjustment failed (HTTP ${res.status}). Restart the API server if this endpoint was just added.`
          );
        }
      } else if (!res.ok) {
        throw new Error(
          `Funding adjustment failed (HTTP ${res.status}). The API returned an empty response — restart the server to load the funding-adjustment route.`
        );
      }
      if (!res.ok) {
        throw new Error(data.detail || data.title || `Funding adjustment failed (HTTP ${res.status})`);
      }
      const queueLabel = fundingDirection === 'CREDIT' ? 'deposit' : 'withdrawal';
      setSuccessNotice(
        `Admin ${fundingDirection.toLowerCase()} queued for review (${data.deposit?.referenceNumber || data.withdrawal?.referenceNumber || 'pending'}). Approve from the pending ${queueLabel} queue.`
      );
      setFundingAmount('');
      setFundingReason('');
      await inspectCustomer(selectedCustomer.customer.id);
      await fetchPendingDeposits();
      await fetchPendingWithdrawals();
    } catch (e: any) {
      setErrorNotice(e.message);
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

  const handleDeleteCustomer = async () => {
    if (!token || !deleteModalCustomer) return;
    try {
      setLoading(true);
      setErrorNotice(null);
      const res = await fetch(`/api/v1/admin/customers/${deleteModalCustomer.id}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Correlation-Id': `corr_${Date.now()}`,
        },
        body: JSON.stringify({ reason: deleteCustomerReason }),
      });
      const raw = await res.text();
      let data: any = {};
      if (raw.trim()) {
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(
            `Delete failed (HTTP ${res.status}). Restart the app server if this persists.`
          );
        }
      } else if (!res.ok) {
        throw new Error(`Delete failed (HTTP ${res.status}).`);
      }
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Customer delete failed');
      }
      setSuccessNotice(
        `Account deleted: ${deleteModalCustomer.fullName} (${deleteModalCustomer.email}).`
      );
      setDeleteModalCustomer(null);
      setDeleteCustomerReason('');
      if (selectedCustomer?.customer?.id === deleteModalCustomer.id) {
        setSelectedCustomer(null);
      }
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

  const openKycReviewModal = async (caseRow: any) => {
    if (!token) return;
    setSelectedKycCase(caseRow);
    setKycDecision('APPROVED');
    setKycReason('');
    setKycNotes('');
    try {
      const res = await fetch(`/api/v1/admin/kyc/${caseRow.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setSelectedKycCase(data.profile);
      }
    } catch {
      // Keep queue row data if detail fetch fails
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

  const handleCardIssuanceReview = async () => {
    if (!token || !cardIssuanceModal) return;
    try {
      setLoading(true);
      setErrorNotice(null);

      const res = await fetch(`/api/v1/admin/cards/${cardIssuanceModal.id}/issuance-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision: cardIssuanceDecision,
          reason: cardIssuanceReason,
        }),
      });
      const raw = await res.text();
      let data: any = {};
      if (raw.trim()) {
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(
            res.ok
              ? 'Card action completed but the server returned an unexpected response. Refresh Cards and try again.'
              : `Card action failed (HTTP ${res.status}). Restart the app server if this persists.`
          );
        }
      } else if (!res.ok) {
        throw new Error(
          `Card action failed (HTTP ${res.status}). Restart the app server so the latest card APIs are loaded.`
        );
      }
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Card request action failed');
      }
      setSuccessNotice(
        cardIssuanceDecision === 'APPROVE'
          ? 'Card issuance approved — card is now active for the customer.'
          : cardIssuanceDecision === 'DECLINE'
            ? 'Card issuance declined.'
            : 'Card deleted successfully.'
      );
      setCardIssuanceModal(null);
      setCardIssuanceReason('');
      setCardIssuanceDecision('APPROVE');
      await fetchCards();
      try {
        await fetchOverview();
      } catch {
        /* overview refresh is best-effort */
      }
    } catch (e: any) {
      setErrorNotice(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openCardRequestManager = (
    card: any,
    decision: 'APPROVE' | 'DECLINE' | 'DELETE' = 'APPROVE'
  ) => {
    setCardIssuanceModal(card);
    setCardIssuanceDecision(decision);
    setCardIssuanceReason('');
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

  // Removed nav tabs — send leftover routes to overview.
  useEffect(() => {
    if (activeTab === 'webhooks' || activeTab === 'readiness') {
      onTabChange('overview');
    }
  }, [activeTab, onTabChange]);

  // Initial and tab change loading
  useEffect(() => {
    if (activeTab === 'overview') fetchOverview();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'kyc') fetchKycQueue();
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'loans_grants') fetchLoansAndGrants();
    if (activeTab === 'cards') fetchCards();
    if (activeTab === 'audit') fetchAuditLogs();
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

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const refreshActiveTab = () => {
    if (activeTab === 'overview') fetchOverview();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'kyc') fetchKycQueue();
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'loans_grants') fetchLoansAndGrants();
    if (activeTab === 'cards') fetchCards();
    if (activeTab === 'audit') fetchAuditLogs();
  };

  if (authLoading && !user && !authModalOpen) {
    return (
      <div className="app-viewport-shell bg-brand-warm text-brand-dark font-sans flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-brand-muted">
          <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" />
          Checking secure session…
        </div>
      </div>
    );
  }

  if (!user || !token || !isStaff) {
    return (
      <div className="app-viewport-shell bg-brand-warm text-brand-dark font-sans">
        <header className="shrink-0 bg-brand-deep border-b border-brand-primary text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AvenoraLogo size="sm" className="rounded-lg bg-white/95 p-0.5 shadow-sm" />
              <div>
                <span className="font-serif font-bold text-base tracking-tight text-white block">
                  AVENORA ADMIN & OPS
                </span>
                <span className="text-[10px] text-emerald-300 font-medium leading-none">
                  STAFF SIGN-IN REQUIRED
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onBackToPublic}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-700/60 hover:bg-emerald-800/50 text-xs font-semibold text-emerald-100 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Public site
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center space-y-5">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-deep text-emerald-200 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-bold text-brand-deep">
                {user ? 'Staff access required' : 'Sign in to continue'}
              </h1>
              <p className="text-sm text-brand-muted leading-relaxed">
                {user
                  ? `Your account (${user.email}) is signed in as ${user.role}. Admin & Ops is limited to SUPPORT, COMPLIANCE_REVIEWER, ADMIN, and SUPER_ADMIN.`
                  : 'The control center is locked until a staff session is authenticated. Sign in with the support admin account.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              {!user ? (
                <AdminButton onClick={() => openAuthModal('login')}>
                  <Shield className="w-4 h-4" />
                  Staff sign in
                </AdminButton>
              ) : (
                <AdminButton onClick={() => logout()}>Sign out and switch account</AdminButton>
              )}
              <AdminButton variant="secondary" onClick={onBackToPortal}>
                Customer portal
              </AdminButton>
            </div>
          </div>
        </main>
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="app-viewport-shell bg-brand-warm text-brand-dark font-sans">
      <div className="bg-brand-primary px-4 py-1.5 text-xs text-emerald-100 border-b border-brand-accent/20">
        <div className="flex items-center gap-2 max-w-[1600px] mx-auto w-full">
          <ShieldAlert className="w-3.5 h-3.5 text-brand-gold shrink-0" />
          <span className="font-medium truncate">
            Operations control center — monitor customers, compliance queues, and platform health.
          </span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
          onBackToPortal={onBackToPortal}
          onBackToPublic={onBackToPublic}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <AdminTopbar
            user={user}
            activeTab={activeTab}
            loading={loading}
            onRefresh={refreshActiveTab}
            onLogout={logout}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />

          <AdminButtonNav activeTab={activeTab} onTabChange={onTabChange} />

          <main className="app-scroll-pane flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
              {errorNotice && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs"
                >
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">{errorNotice}</div>
                  <button type="button" className="font-bold cursor-pointer" onClick={() => setErrorNotice(null)}>
                    Dismiss
                  </button>
                </div>
              )}
              {successNotice && (
                <div
                  role="status"
                  className="flex items-start gap-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">{successNotice}</div>
                  <button type="button" className="font-bold cursor-pointer" onClick={() => setSuccessNotice(null)}>
                    Dismiss
                  </button>
                </div>
              )}

              <div role="tabpanel" aria-label={activeTab}>
                {activeTab === 'overview' && (
                  <AdminOverviewSection
                    overviewData={overviewData}
                    loading={loading}
                    fetchOverview={fetchOverview}
                    onTabChange={onTabChange}
                  />
                )}
                {activeTab === 'customers' && (
                  <AdminCustomersSection
                    user={user}
                    loading={loading}
                    customers={customers}
                    customerSearch={customerSearch}
                    setCustomerSearch={setCustomerSearch}
                    customerRoleFilter={customerRoleFilter}
                    setCustomerRoleFilter={setCustomerRoleFilter}
                    customerStatusFilter={customerStatusFilter}
                    setCustomerStatusFilter={setCustomerStatusFilter}
                    fetchCustomers={fetchCustomers}
                    inspectCustomer={inspectCustomer}
                    selectedCustomer={selectedCustomer}
                    setSelectedCustomer={setSelectedCustomer}
                    statusModalCustomer={statusModalCustomer}
                    setStatusModalCustomer={setStatusModalCustomer}
                    newStatusValue={newStatusValue}
                    setNewStatusValue={setNewStatusValue}
                    statusChangeReason={statusChangeReason}
                    setStatusChangeReason={setStatusChangeReason}
                    handleUpdateCustomerStatus={handleUpdateCustomerStatus}
                    roleModalCustomer={roleModalCustomer}
                    setRoleModalCustomer={setRoleModalCustomer}
                    newRoleValue={newRoleValue}
                    setNewRoleValue={setNewRoleValue}
                    roleChangeReason={roleChangeReason}
                    setRoleChangeReason={setRoleChangeReason}
                    handleUpdateCustomerRole={handleUpdateCustomerRole}
                    deleteModalCustomer={deleteModalCustomer}
                    setDeleteModalCustomer={setDeleteModalCustomer}
                    deleteCustomerReason={deleteCustomerReason}
                    setDeleteCustomerReason={setDeleteCustomerReason}
                    handleDeleteCustomer={handleDeleteCustomer}
                    fundingDirection={fundingDirection}
                    setFundingDirection={setFundingDirection}
                    fundingCurrency={fundingCurrency}
                    setFundingCurrency={setFundingCurrency}
                    fundingAmount={fundingAmount}
                    setFundingAmount={setFundingAmount}
                    fundingReason={fundingReason}
                    setFundingReason={setFundingReason}
                    handleFundingAdjustment={handleFundingAdjustment}
                  />
                )}
                {activeTab === 'kyc' && (
                  <AdminKycSection
                    user={user}
                    loading={loading}
                    kycCases={kycCases}
                    kycStatusFilter={kycStatusFilter}
                    setKycStatusFilter={setKycStatusFilter}
                    fetchKycQueue={fetchKycQueue}
                    selectedKycCase={selectedKycCase}
                    setSelectedKycCase={setSelectedKycCase}
                    openKycReviewModal={openKycReviewModal}
                    kycDecision={kycDecision}
                    setKycDecision={setKycDecision}
                    kycReason={kycReason}
                    setKycReason={setKycReason}
                    handleKycReviewSubmit={handleKycReviewSubmit}
                  />
                )}
                {activeTab === 'transactions' && (
                  <AdminTransactionsSection
                    user={user}
                    loading={loading}
                    pendingDeposits={pendingDeposits}
                    pendingWithdrawals={pendingWithdrawals}
                    depositRejectId={depositRejectId}
                    setDepositRejectId={setDepositRejectId}
                    depositRejectReason={depositRejectReason}
                    setDepositRejectReason={setDepositRejectReason}
                    approvePendingDeposit={approvePendingDeposit}
                    rejectPendingDeposit={rejectPendingDeposit}
                    withdrawalRejectId={withdrawalRejectId}
                    setWithdrawalRejectId={setWithdrawalRejectId}
                    withdrawalRejectReason={withdrawalRejectReason}
                    setWithdrawalRejectReason={setWithdrawalRejectReason}
                    approvePendingWithdrawal={approvePendingWithdrawal}
                    rejectPendingWithdrawal={rejectPendingWithdrawal}
                    transactions={transactions}
                    txSearch={txSearch}
                    setTxSearch={setTxSearch}
                    txStatusFilter={txStatusFilter}
                    setTxStatusFilter={setTxStatusFilter}
                    fetchTransactions={fetchTransactions}
                    inspectTransaction={inspectTransaction}
                    txDetailData={txDetailData}
                    setTxDetailData={setTxDetailData}
                    reversalModalTx={reversalModalTx}
                    setReversalModalTx={setReversalModalTx}
                    reversalReason={reversalReason}
                    setReversalReason={setReversalReason}
                    handleReverseTransaction={handleReverseTransaction}
                  />
                )}
                {activeTab === 'loans_grants' && (
                  <AdminLoansGrantsSection
                    user={user}
                    loading={loading}
                    loansGrantsSubTab={loansGrantsSubTab}
                    setLoansGrantsSubTab={setLoansGrantsSubTab}
                    loanApplications={loanApplications}
                    grantApplications={grantApplications}
                    selectedLoan={selectedLoan}
                    setSelectedLoan={setSelectedLoan}
                    loanDecision={loanDecision}
                    setLoanDecision={setLoanDecision}
                    loanReason={loanReason}
                    setLoanReason={setLoanReason}
                    handleLoanReviewSubmit={handleLoanReviewSubmit}
                    selectedGrant={selectedGrant}
                    setSelectedGrant={setSelectedGrant}
                    grantDecision={grantDecision}
                    setGrantDecision={setGrantDecision}
                    grantReason={grantReason}
                    setGrantReason={setGrantReason}
                    handleGrantReviewSubmit={handleGrantReviewSubmit}
                    handleSimulateGrantDisburse={handleSimulateGrantDisburse}
                  />
                )}
                {activeTab === 'cards' && (
                  <AdminCardsSection
                    loading={loading}
                    cards={cards}
                    fetchCards={fetchCards}
                    openCardRequestManager={openCardRequestManager}
                    cardIssuanceModal={cardIssuanceModal}
                    setCardIssuanceModal={setCardIssuanceModal}
                    cardIssuanceDecision={cardIssuanceDecision}
                    setCardIssuanceDecision={setCardIssuanceDecision}
                    cardIssuanceReason={cardIssuanceReason}
                    setCardIssuanceReason={setCardIssuanceReason}
                    handleCardIssuanceReview={handleCardIssuanceReview}
                    cardStatusModal={cardStatusModal}
                    setCardStatusModal={setCardStatusModal}
                    newCardStatus={newCardStatus}
                    setNewCardStatus={setNewCardStatus}
                    cardStatusReason={cardStatusReason}
                    setCardStatusReason={setCardStatusReason}
                    handleUpdateCardStatus={handleUpdateCardStatus}
                  />
                )}
                {activeTab === 'audit' && (
                  <AdminAuditSection
                    loading={loading}
                    auditLogs={auditLogs}
                    auditSearch={auditSearch}
                    setAuditSearch={setAuditSearch}
                    auditActionFilter={auditActionFilter}
                    setAuditActionFilter={setAuditActionFilter}
                    fetchAuditLogs={fetchAuditLogs}
                    exportAuditLogsJson={exportAuditLogsJson}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      <AuthModal />
    </div>
  );
};
