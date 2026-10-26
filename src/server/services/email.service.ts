/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Transactional Email Service (Resend)
 *
 * Centralizes outbound email via Resend. When RESEND_API_KEY is unset,
 * sends are no-ops so local/prototype flows remain usable.
 */

import { Resend } from 'resend';
import { getValidatedConfig } from '../../config/env.config.ts';
import { adminInbox, contactInbox, supportInbox } from '../emails/compose.ts';
import type { EmailPayload } from '../emails/types.ts';
import { buildWelcomeEmail } from '../emails/templates/welcome.ts';
import * as authTpl from '../emails/templates/auth.ts';
import * as kycTpl from '../emails/templates/kyc.ts';
import * as walletTpl from '../emails/templates/wallet.ts';
import * as cardsTpl from '../emails/templates/cards.ts';
import * as loansTpl from '../emails/templates/loans.ts';
import * as supportTpl from '../emails/templates/support.ts';
import * as providerTpl from '../emails/templates/provider.ts';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface SendEmailResult {
  sent: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}

/** Fire-and-forget helper — never throws to callers. */
export function voidEmail(label: string, promise: Promise<SendEmailResult>): void {
  void promise.catch((err) => console.error(`[email] ${label} failed:`, err));
}

export class EmailService {
  private client: Resend | null = null;

  private getConfig() {
    return getValidatedConfig();
  }

  public isConfigured(): boolean {
    const key = this.getConfig().RESEND_API_KEY?.trim();
    return Boolean(key && key !== 're_placeholder' && !key.includes('placeholder'));
  }

  private getClient(): Resend | null {
    if (!this.isConfigured()) return null;
    if (!this.client) {
      this.client = new Resend(this.getConfig().RESEND_API_KEY);
    }
    return this.client;
  }

  private resolveFrom(): string {
    const config = this.getConfig();
    if (config.EMAIL_FROM?.trim()) return config.EMAIL_FROM.trim();
    const name = config.EMAIL_FROM_NAME?.trim() || 'Avenora Bank';
    const address = config.EMAIL_FROM_ADDRESS?.trim() || 'noreply@avenorabank.com';
    return `${name} <${address}>`;
  }

  public async send(params: SendEmailParams): Promise<SendEmailResult> {
    const client = this.getClient();
    if (!client) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[email] RESEND_API_KEY not configured — skipping send:', params.subject);
      }
      return { sent: false, skipped: true };
    }

    const config = this.getConfig();
    const to = Array.isArray(params.to) ? params.to : [params.to];

    try {
      const { data, error } = await client.emails.send({
        from: this.resolveFrom(),
        to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo || config.EMAIL_REPLY_TO || undefined,
        tags: params.tags,
      });

      if (error) {
        console.error('[email] Resend API error:', error.message);
        return { sent: false, error: error.message };
      }

      return { sent: true, id: data?.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[email] Failed to send:', message);
      return { sent: false, error: message };
    }
  }

  private async sendPayload(
    to: string | string[],
    payload: EmailPayload,
    replyTo?: string
  ): Promise<SendEmailResult> {
    return this.send({
      to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      tags: payload.tags,
      replyTo,
    });
  }

  // ── Welcome ──────────────────────────────────────────────────────────────

  public async sendWelcomeEmail(params: { to: string; fullName: string }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, buildWelcomeEmail({ fullName: params.fullName }));
  }

  // ── Auth & account ───────────────────────────────────────────────────────

  public async sendPasswordResetEmail(params: {
    to: string;
    fullName: string;
    resetToken: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildPasswordResetRequestEmail(params));
  }

  public async sendPasswordResetCompletedEmail(params: {
    to: string;
    fullName: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildPasswordResetCompletedEmail(params));
  }

  public async sendPasswordChangedEmail(params: {
    to: string;
    fullName: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildPasswordChangedEmail(params));
  }

  public async sendLoginLockoutEmail(params: {
    to: string;
    fullName: string;
    lockMinutes: number;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildLoginLockoutEmail(params));
  }

  public async sendLoginNewDeviceEmail(params: {
    to: string;
    fullName: string;
    ipAddress?: string;
    userAgent?: string;
    signedInAt: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildLoginNewDeviceEmail(params));
  }

  public async sendLoginSuccessEmail(params: {
    to: string;
    fullName: string;
    ipAddress?: string;
    signedInAt: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildLoginSuccessEmail(params));
  }

  public async sendMfaEnrolledEmail(params: {
    to: string;
    fullName: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildMfaEnrolledEmail(params));
  }

  public async sendMfaDisabledEmail(params: {
    to: string;
    fullName: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildMfaDisabledEmail(params));
  }

  public async sendAccountSuspendedEmail(params: {
    to: string;
    fullName: string;
    reason?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildAccountSuspendedEmail(params));
  }

  public async sendAccountLockedEmail(params: {
    to: string;
    fullName: string;
    reason?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildAccountLockedEmail(params));
  }

  public async sendAccountRestoredEmail(params: {
    to: string;
    fullName: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildAccountRestoredEmail(params));
  }

  public async sendPendingVerificationEmail(params: {
    to: string;
    fullName: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildPendingVerificationEmail(params));
  }

  public async sendRoleChangedEmail(params: {
    to: string;
    fullName: string;
    newRole: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildRoleChangedEmail(params));
  }

  public async sendAccountDeletedEmail(params: {
    to: string;
    fullName: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, authTpl.buildAccountDeletedEmail(params));
  }

  // ── KYC ──────────────────────────────────────────────────────────────────

  public async sendKycSubmittedEmail(params: {
    to: string;
    fullName: string;
    reference?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, kycTpl.buildKycSubmittedEmail(params));
  }

  public async sendKycSubmittedStaffEmail(params: {
    customerName: string;
    customerEmail: string;
    userId: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(adminInbox(), kycTpl.buildKycSubmittedStaffEmail(params));
  }

  public async sendKycUnderReviewEmail(params: {
    to: string;
    fullName: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, kycTpl.buildKycUnderReviewEmail(params));
  }

  public async sendKycNeedsMoreInfoEmail(params: {
    to: string;
    fullName: string;
    notes?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, kycTpl.buildKycNeedsMoreInfoEmail(params));
  }

  public async sendKycApprovedEmail(params: {
    to: string;
    fullName: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, kycTpl.buildKycApprovedEmail(params));
  }

  public async sendKycRejectedEmail(params: {
    to: string;
    fullName: string;
    notes?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, kycTpl.buildKycRejectedEmail(params));
  }

  public async sendDomesticAccountIssuedEmail(params: {
    to: string;
    fullName: string;
    accountSummary: string;
    currency?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, kycTpl.buildDomesticAccountIssuedEmail(params));
  }

  public async sendDomesticAccountFailedEmail(params: {
    to: string;
    fullName: string;
    reason?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, kycTpl.buildDomesticAccountFailedEmail(params));
  }

  // ── Wallet ───────────────────────────────────────────────────────────────

  public async sendDepositRequestedEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    currency: string;
    reference?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, walletTpl.buildDepositRequestedEmail(params));
  }

  public async sendDepositStaffEmail(params: {
    customerName: string;
    amount: string;
    currency: string;
    depositId: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(adminInbox(), walletTpl.buildDepositStaffEmail(params));
  }

  public async sendDepositApprovedEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    currency: string;
    reference?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, walletTpl.buildDepositApprovedEmail(params));
  }

  public async sendDepositRejectedEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    currency: string;
    reason?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, walletTpl.buildDepositRejectedEmail(params));
  }

  public async sendBtcDepositProofEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    txHash?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, walletTpl.buildBtcDepositProofEmail(params));
  }

  public async sendWithdrawalRequestedEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    currency: string;
    reference?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, walletTpl.buildWithdrawalRequestedEmail(params));
  }

  public async sendWithdrawalStaffEmail(params: {
    customerName: string;
    amount: string;
    currency: string;
    withdrawalId: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(adminInbox(), walletTpl.buildWithdrawalStaffEmail(params));
  }

  public async sendWithdrawalApprovedEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    currency: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, walletTpl.buildWithdrawalApprovedEmail(params));
  }

  public async sendWithdrawalRejectedEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    currency: string;
    reason?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, walletTpl.buildWithdrawalRejectedEmail(params));
  }

  public async sendTransferSentEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    currency: string;
    recipient: string;
    reference?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, walletTpl.buildTransferSentEmail(params));
  }

  public async sendTransferReceivedEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    currency: string;
    sender: string;
    reference?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, walletTpl.buildTransferReceivedEmail(params));
  }

  public async sendFxConvertedEmail(params: {
    to: string;
    fullName: string;
    fromAmount: string;
    fromCurrency: string;
    toAmount: string;
    toCurrency: string;
    rate?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, walletTpl.buildFxConvertedEmail(params));
  }

  public async sendAdminAdjustmentQueuedEmail(params: {
    to: string;
    fullName: string;
    direction: string;
    amount: string;
    currency: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, walletTpl.buildAdminAdjustmentQueuedEmail(params));
  }

  public async sendTransactionReversedEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    currency: string;
    transactionId: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, walletTpl.buildTransactionReversedEmail(params));
  }

  public async sendStatementReadyEmail(params: {
    to: string;
    fullName: string;
    periodLabel: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, walletTpl.buildStatementReadyEmail(params));
  }

  // ── Cards ────────────────────────────────────────────────────────────────

  public async sendCardRequestedEmail(params: {
    to: string;
    fullName: string;
    cardLabel?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, cardsTpl.buildCardRequestedEmail(params));
  }

  public async sendCardRequestedStaffEmail(params: {
    customerName: string;
    cardId: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(adminInbox(), cardsTpl.buildCardRequestedStaffEmail(params));
  }

  public async sendCardIssuanceApprovedEmail(params: {
    to: string;
    fullName: string;
    last4?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, cardsTpl.buildCardIssuanceApprovedEmail(params));
  }

  public async sendCardIssuanceDeclinedEmail(params: {
    to: string;
    fullName: string;
    reason?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, cardsTpl.buildCardIssuanceDeclinedEmail(params));
  }

  public async sendCardFrozenEmail(params: {
    to: string;
    fullName: string;
    last4?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, cardsTpl.buildCardFrozenEmail(params));
  }

  public async sendCardUnfrozenEmail(params: {
    to: string;
    fullName: string;
    last4?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, cardsTpl.buildCardUnfrozenEmail(params));
  }

  public async sendCardTerminatedEmail(params: {
    to: string;
    fullName: string;
    last4?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, cardsTpl.buildCardTerminatedEmail(params));
  }

  public async sendCardLimitsChangedEmail(params: {
    to: string;
    fullName: string;
    last4?: string;
    dailyLimit?: string;
    monthlyLimit?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, cardsTpl.buildCardLimitsChangedEmail(params));
  }

  public async sendCardAuthHoldEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    currency: string;
    merchant?: string;
    last4?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, cardsTpl.buildCardAuthHoldEmail(params));
  }

  public async sendCardHoldSettledEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    currency: string;
    outcome: 'settled' | 'released';
    merchant?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, cardsTpl.buildCardHoldSettledEmail(params));
  }

  // ── Loans & grants ───────────────────────────────────────────────────────

  public async sendLoanSubmittedEmail(params: {
    to: string;
    fullName: string;
    applicationId: string;
    amount?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, loansTpl.buildLoanSubmittedEmail(params));
  }

  public async sendLoanSubmittedStaffEmail(params: {
    customerName: string;
    applicationId: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(adminInbox(), loansTpl.buildLoanSubmittedStaffEmail(params));
  }

  public async sendLoanDecisionEmail(params: {
    to: string;
    fullName: string;
    applicationId: string;
    decision: string;
    notes?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, loansTpl.buildLoanDecisionEmail(params));
  }

  public async sendGrantSubmittedEmail(params: {
    to: string;
    fullName: string;
    applicationId: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, loansTpl.buildGrantSubmittedEmail(params));
  }

  public async sendGrantSubmittedStaffEmail(params: {
    customerName: string;
    applicationId: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(adminInbox(), loansTpl.buildGrantSubmittedStaffEmail(params));
  }

  public async sendGrantIneligibleEmail(params: {
    to: string;
    fullName: string;
    applicationId: string;
    reason?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, loansTpl.buildGrantIneligibleEmail(params));
  }

  public async sendGrantReviewedEmail(params: {
    to: string;
    fullName: string;
    applicationId: string;
    decision: string;
    notes?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, loansTpl.buildGrantReviewedEmail(params));
  }

  public async sendGrantDisbursedEmail(params: {
    to: string;
    fullName: string;
    applicationId: string;
    amount: string;
    currency: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, loansTpl.buildGrantDisbursedEmail(params));
  }

  // ── Contact & support ────────────────────────────────────────────────────

  public async sendContactInquiry(params: {
    name: string;
    email: string;
    subject: string;
    message: string;
    category?: string;
    reference: string;
  }): Promise<SendEmailResult> {
    const staffResult = await this.sendPayload(
      contactInbox(),
      supportTpl.buildContactStaffEmail(params),
      params.email
    );
    await this.sendPayload(params.email, supportTpl.buildContactAckEmail(params));
    return staffResult;
  }

  public async sendSupportTicket(params: {
    customerEmail: string;
    customerName: string;
    subject: string;
    message: string;
    priority?: string;
    ticketId: string;
  }): Promise<SendEmailResult> {
    const staffResult = await this.sendPayload(
      supportInbox(),
      supportTpl.buildSupportTicketStaffEmail(params),
      params.customerEmail
    );
    await this.sendPayload(
      params.customerEmail,
      supportTpl.buildSupportTicketAckEmail({
        fullName: params.customerName,
        ticketId: params.ticketId,
        subject: params.subject,
      })
    );
    return staffResult;
  }

  public async sendSupportTicketResolvedEmail(params: {
    to: string;
    fullName: string;
    ticketId: string;
    subject: string;
    resolutionNote?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, supportTpl.buildSupportTicketResolvedEmail(params));
  }

  // ── Provider / webhooks ──────────────────────────────────────────────────

  public async sendProviderDepositClearedEmail(params: {
    to: string;
    fullName: string;
    amount?: string;
    currency?: string;
    reference?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, providerTpl.buildProviderDepositClearedEmail(params));
  }

  public async sendProviderWireInboundEmail(params: {
    to: string;
    fullName: string;
    amount?: string;
    currency?: string;
    reference?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, providerTpl.buildProviderWireInboundEmail(params));
  }

  public async sendProviderWireInboundStaffEmail(params: {
    reference?: string;
    amount?: string;
    currency?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(adminInbox(), providerTpl.buildProviderWireInboundStaffEmail(params));
  }

  public async sendComplianceFlagEmail(params: {
    flagType?: string;
    reference?: string;
    detail?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(adminInbox(), providerTpl.buildComplianceFlagEmail(params));
  }

  public async sendProviderPaymentConfirmedEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    currency: string;
    paymentId: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, providerTpl.buildProviderPaymentConfirmedEmail(params));
  }

  public async sendProviderPaymentFailedEmail(params: {
    to: string;
    fullName: string;
    amount: string;
    currency: string;
    paymentId: string;
    reason?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(params.to, providerTpl.buildProviderPaymentFailedEmail(params));
  }

  public async sendReconciliationRequiredEmail(params: {
    paymentId: string;
    detail?: string;
  }): Promise<SendEmailResult> {
    return this.sendPayload(adminInbox(), providerTpl.buildReconciliationRequiredEmail(params));
  }
}

export const defaultEmailService = new EmailService();
