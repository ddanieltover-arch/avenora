/**
 * @license Apache-2.0
 * Avenora — email template catalog (preview registry for all 61 notifications)
 */

import type { EmailPayload } from './types.ts';
import { buildWelcomeEmail } from './templates/welcome.ts';
import * as auth from './templates/auth.ts';
import * as kyc from './templates/kyc.ts';
import * as wallet from './templates/wallet.ts';
import * as cards from './templates/cards.ts';
import * as loans from './templates/loans.ts';
import * as support from './templates/support.ts';
import * as provider from './templates/provider.ts';

export const PLANNED_EMAIL_TEMPLATE_IDS = [
  'welcome',
  'password_reset_request',
  'password_reset_completed',
  'password_changed',
  'login_lockout',
  'login_new_device',
  'login_success',
  'mfa_enrolled',
  'mfa_disabled',
  'account_suspended',
  'account_locked',
  'account_restored',
  'pending_verification',
  'role_changed',
  'account_deleted',
  'kyc_submitted',
  'kyc_under_review',
  'kyc_needs_more_info',
  'kyc_approved',
  'kyc_rejected',
  'domestic_account_issued',
  'domestic_account_failed',
  'deposit_requested',
  'deposit_approved',
  'deposit_rejected',
  'btc_deposit_proof',
  'withdrawal_requested',
  'withdrawal_approved',
  'withdrawal_rejected',
  'transfer_sent',
  'transfer_received',
  'fx_converted',
  'admin_adjustment_queued',
  'transaction_reversed',
  'statement_ready',
  'card_requested',
  'card_issuance_approved',
  'card_issuance_declined',
  'card_frozen',
  'card_unfrozen',
  'card_terminated',
  'card_limits_changed',
  'card_auth_hold',
  'card_hold_settled',
  'loan_submitted',
  'loan_decision',
  'grant_submitted',
  'grant_ineligible',
  'grant_reviewed',
  'grant_disbursed',
  'contact_staff',
  'contact_ack',
  'support_ticket_staff',
  'support_ticket_ack',
  'support_ticket_resolved',
  'provider_deposit_cleared',
  'provider_wire_inbound',
  'compliance_flag',
  'provider_payment_confirmed',
  'provider_payment_failed',
  'reconciliation_required',
] as const;

export type PlannedEmailTemplateId = (typeof PLANNED_EMAIL_TEMPLATE_IDS)[number];
export type EmailTemplateId = PlannedEmailTemplateId;

export const EMAIL_TEMPLATE_IDS: EmailTemplateId[] = [...PLANNED_EMAIL_TEMPLATE_IDS];

const SAMPLE = 'Alex Rivera';

/** Sample payloads for HTML preview (no PII from live users). */
export function renderEmailPreview(id: string): EmailPayload | null {
  switch (id) {
    case 'welcome':
      return buildWelcomeEmail({ fullName: SAMPLE });
    case 'password_reset_request':
      return auth.buildPasswordResetRequestEmail({ fullName: SAMPLE, resetToken: 'preview-token' });
    case 'password_reset_completed':
      return auth.buildPasswordResetCompletedEmail({ fullName: SAMPLE });
    case 'password_changed':
      return auth.buildPasswordChangedEmail({ fullName: SAMPLE });
    case 'login_lockout':
      return auth.buildLoginLockoutEmail({ fullName: SAMPLE, lockMinutes: 15 });
    case 'login_new_device':
      return auth.buildLoginNewDeviceEmail({
        fullName: SAMPLE,
        ipAddress: '203.0.113.42',
        userAgent: 'Chrome on Windows',
        signedInAt: new Date().toISOString(),
      });
    case 'login_success':
      return auth.buildLoginSuccessEmail({
        fullName: SAMPLE,
        ipAddress: '203.0.113.42',
        signedInAt: new Date().toISOString(),
      });
    case 'mfa_enrolled':
      return auth.buildMfaEnrolledEmail({ fullName: SAMPLE });
    case 'mfa_disabled':
      return auth.buildMfaDisabledEmail({ fullName: SAMPLE });
    case 'account_suspended':
      return auth.buildAccountSuspendedEmail({ fullName: SAMPLE, reason: 'Compliance review' });
    case 'account_locked':
      return auth.buildAccountLockedEmail({ fullName: SAMPLE, reason: 'Security hold' });
    case 'account_restored':
      return auth.buildAccountRestoredEmail({ fullName: SAMPLE });
    case 'pending_verification':
      return auth.buildPendingVerificationEmail({ fullName: SAMPLE });
    case 'role_changed':
      return auth.buildRoleChangedEmail({ fullName: SAMPLE, newRole: 'SUPPORT' });
    case 'account_deleted':
      return auth.buildAccountDeletedEmail({ fullName: SAMPLE });
    case 'kyc_submitted':
      return kyc.buildKycSubmittedEmail({ fullName: SAMPLE, reference: 'KYC-1001' });
    case 'kyc_under_review':
      return kyc.buildKycUnderReviewEmail({ fullName: SAMPLE });
    case 'kyc_needs_more_info':
      return kyc.buildKycNeedsMoreInfoEmail({ fullName: SAMPLE, notes: 'Please upload a clearer ID photo.' });
    case 'kyc_approved':
      return kyc.buildKycApprovedEmail({ fullName: SAMPLE });
    case 'kyc_rejected':
      return kyc.buildKycRejectedEmail({ fullName: SAMPLE, notes: 'Document expired.' });
    case 'domestic_account_issued':
      return kyc.buildDomesticAccountIssuedEmail({
        fullName: SAMPLE,
        accountSummary: 'GB29 NWBK 6016 1331 9268 19',
        currency: 'GBP',
      });
    case 'domestic_account_failed':
      return kyc.buildDomesticAccountFailedEmail({ fullName: SAMPLE });
    case 'deposit_requested':
      return wallet.buildDepositRequestedEmail({
        fullName: SAMPLE,
        amount: '1,000.00',
        currency: 'USD',
        reference: 'DEP-1001',
      });
    case 'deposit_approved':
      return wallet.buildDepositApprovedEmail({
        fullName: SAMPLE,
        amount: '1,000.00',
        currency: 'USD',
        reference: 'DEP-1001',
      });
    case 'deposit_rejected':
      return wallet.buildDepositRejectedEmail({
        fullName: SAMPLE,
        amount: '1,000.00',
        currency: 'USD',
        reason: 'Source of funds unclear',
      });
    case 'btc_deposit_proof':
      return wallet.buildBtcDepositProofEmail({
        fullName: SAMPLE,
        amount: '0.05 BTC',
        txHash: 'abc123…',
      });
    case 'withdrawal_requested':
      return wallet.buildWithdrawalRequestedEmail({
        fullName: SAMPLE,
        amount: '250.00',
        currency: 'EUR',
        reference: 'WDR-2001',
      });
    case 'withdrawal_approved':
      return wallet.buildWithdrawalApprovedEmail({
        fullName: SAMPLE,
        amount: '250.00',
        currency: 'EUR',
      });
    case 'withdrawal_rejected':
      return wallet.buildWithdrawalRejectedEmail({
        fullName: SAMPLE,
        amount: '250.00',
        currency: 'EUR',
      });
    case 'transfer_sent':
      return wallet.buildTransferSentEmail({
        fullName: SAMPLE,
        amount: '50.00',
        currency: 'USD',
        recipient: 'Jordan Lee',
        reference: 'TRF-3001',
      });
    case 'transfer_received':
      return wallet.buildTransferReceivedEmail({
        fullName: SAMPLE,
        amount: '50.00',
        currency: 'USD',
        sender: 'Jordan Lee',
      });
    case 'fx_converted':
      return wallet.buildFxConvertedEmail({
        fullName: SAMPLE,
        fromAmount: '100.00',
        fromCurrency: 'USD',
        toAmount: '92.00',
        toCurrency: 'EUR',
        rate: '0.9200',
      });
    case 'admin_adjustment_queued':
      return wallet.buildAdminAdjustmentQueuedEmail({
        fullName: SAMPLE,
        direction: 'Credit',
        amount: '25.00',
        currency: 'USD',
      });
    case 'transaction_reversed':
      return wallet.buildTransactionReversedEmail({
        fullName: SAMPLE,
        amount: '25.00',
        currency: 'USD',
        transactionId: 'txn_demo',
      });
    case 'statement_ready':
      return wallet.buildStatementReadyEmail({ fullName: SAMPLE, periodLabel: 'September 2026' });
    case 'card_requested':
      return cards.buildCardRequestedEmail({ fullName: SAMPLE, cardLabel: 'Virtual Debit' });
    case 'card_issuance_approved':
      return cards.buildCardIssuanceApprovedEmail({ fullName: SAMPLE, last4: '4242' });
    case 'card_issuance_declined':
      return cards.buildCardIssuanceDeclinedEmail({ fullName: SAMPLE });
    case 'card_frozen':
      return cards.buildCardFrozenEmail({ fullName: SAMPLE, last4: '4242' });
    case 'card_unfrozen':
      return cards.buildCardUnfrozenEmail({ fullName: SAMPLE, last4: '4242' });
    case 'card_terminated':
      return cards.buildCardTerminatedEmail({ fullName: SAMPLE, last4: '4242' });
    case 'card_limits_changed':
      return cards.buildCardLimitsChangedEmail({
        fullName: SAMPLE,
        last4: '4242',
        dailyLimit: '1,000 USD',
        monthlyLimit: '5,000 USD',
      });
    case 'card_auth_hold':
      return cards.buildCardAuthHoldEmail({
        fullName: SAMPLE,
        amount: '42.50',
        currency: 'USD',
        merchant: 'Cafe Avenora',
        last4: '4242',
      });
    case 'card_hold_settled':
      return cards.buildCardHoldSettledEmail({
        fullName: SAMPLE,
        amount: '42.50',
        currency: 'USD',
        outcome: 'settled',
        merchant: 'Cafe Avenora',
      });
    case 'loan_submitted':
      return loans.buildLoanSubmittedEmail({
        fullName: SAMPLE,
        applicationId: 'LN-1001',
        amount: '10,000 USD',
      });
    case 'loan_decision':
      return loans.buildLoanDecisionEmail({
        fullName: SAMPLE,
        applicationId: 'LN-1001',
        decision: 'APPROVED',
      });
    case 'grant_submitted':
      return loans.buildGrantSubmittedEmail({ fullName: SAMPLE, applicationId: 'GR-1001' });
    case 'grant_ineligible':
      return loans.buildGrantIneligibleEmail({ fullName: SAMPLE, applicationId: 'GR-1001' });
    case 'grant_reviewed':
      return loans.buildGrantReviewedEmail({
        fullName: SAMPLE,
        applicationId: 'GR-1001',
        decision: 'APPROVED',
      });
    case 'grant_disbursed':
      return loans.buildGrantDisbursedEmail({
        fullName: SAMPLE,
        applicationId: 'GR-1001',
        amount: '500.00',
        currency: 'USD',
      });
    case 'contact_staff':
      return support.buildContactStaffEmail({
        name: SAMPLE,
        email: 'alex@example.com',
        subject: 'Account question',
        message: 'I need help with my wallet.',
        reference: 'CNT-1001',
      });
    case 'contact_ack':
      return support.buildContactAckEmail({ name: SAMPLE, reference: 'CNT-1001' });
    case 'support_ticket_staff':
      return support.buildSupportTicketStaffEmail({
        customerEmail: 'alex@example.com',
        customerName: SAMPLE,
        subject: 'Cannot withdraw',
        message: 'My withdrawal is stuck.',
        ticketId: 'TKT-1001',
        priority: 'HIGH',
      });
    case 'support_ticket_ack':
      return support.buildSupportTicketAckEmail({
        fullName: SAMPLE,
        ticketId: 'TKT-1001',
        subject: 'Cannot withdraw',
      });
    case 'support_ticket_resolved':
      return support.buildSupportTicketResolvedEmail({
        fullName: SAMPLE,
        ticketId: 'TKT-1001',
        subject: 'Cannot withdraw',
        resolutionNote: 'Withdrawal was released.',
      });
    case 'provider_deposit_cleared':
      return provider.buildProviderDepositClearedEmail({
        fullName: SAMPLE,
        amount: '500.00',
        currency: 'USD',
        reference: 'mock.deposit.cleared',
      });
    case 'provider_wire_inbound':
      return provider.buildProviderWireInboundEmail({
        fullName: SAMPLE,
        amount: '1,200.00',
        currency: 'USD',
      });
    case 'compliance_flag':
      return provider.buildComplianceFlagEmail({
        flagType: 'SANCTIONS_SCREEN',
        reference: 'FLG-1',
      });
    case 'provider_payment_confirmed':
      return provider.buildProviderPaymentConfirmedEmail({
        fullName: SAMPLE,
        amount: '75.00',
        currency: 'USD',
        paymentId: 'pay_demo',
      });
    case 'provider_payment_failed':
      return provider.buildProviderPaymentFailedEmail({
        fullName: SAMPLE,
        amount: '75.00',
        currency: 'USD',
        paymentId: 'pay_demo',
      });
    case 'reconciliation_required':
      return provider.buildReconciliationRequiredEmail({ paymentId: 'pay_demo' });
    default:
      return null;
  }
}
