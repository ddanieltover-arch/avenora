/**
 * @license Apache-2.0
 * Avenora — wallet, transfer, FX & statement email templates
 */

import { adminInbox, appUrl, composeTransactionalEmail, portalUrl } from '../compose.ts';
import type { EmailPayload } from '../types.ts';

export function buildDepositRequestedEmail(params: {
  fullName: string;
  amount: string;
  currency: string;
  reference?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Deposit request received — ${params.amount} ${params.currency}`,
    category: 'deposit_requested',
    eyebrow: 'Deposit',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'We received your deposit request. Funds are held pending review and will appear in your available balance once approved.',
    ],
    details: [
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      ...(params.reference ? [{ label: 'Reference', value: params.reference }] : []),
      { label: 'Status', value: 'Pending review' },
    ],
    primaryCta: { label: 'Track deposit', href: portalUrl('transactions') },
  });
}

export function buildDepositStaffEmail(params: {
  customerName: string;
  amount: string;
  currency: string;
  depositId: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `[Deposit] ${params.amount} ${params.currency} — ${params.customerName}`,
    category: 'deposit_requested_staff',
    eyebrow: 'Ops queue',
    heading: '',
    greeting: 'Deposit awaiting approval',
    paragraphs: ['A customer deposit is pending review.'],
    details: [
      { label: 'Customer', value: params.customerName },
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      { label: 'Deposit ID', value: params.depositId },
    ],
    primaryCta: { label: 'Open transactions', href: `${appUrl()}/admin/transactions` },
    footerNote: `Internal notification — ${adminInbox()}`,
  });
}

export function buildDepositApprovedEmail(params: {
  fullName: string;
  amount: string;
  currency: string;
  reference?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Deposit approved — ${params.amount} ${params.currency}`,
    category: 'deposit_approved',
    eyebrow: 'Deposit',
    heading: '',
    fullName: params.fullName,
    paragraphs: ['Your deposit has been approved and is now available in your wallet balance.'],
    details: [
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      ...(params.reference ? [{ label: 'Reference', value: params.reference }] : []),
      { label: 'Status', value: 'Approved' },
    ],
    primaryCta: { label: 'View balance', href: portalUrl('wallets') },
    secondaryCta: { label: 'View transactions', href: portalUrl('transactions') },
  });
}

export function buildDepositRejectedEmail(params: {
  fullName: string;
  amount: string;
  currency: string;
  reason?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Deposit not approved — ${params.amount} ${params.currency}`,
    category: 'deposit_rejected',
    eyebrow: 'Deposit',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your deposit request was not approved. Any held amount has been released according to our review outcome.',
      params.reason || 'You may submit a new deposit or contact support for details.',
    ],
    details: [
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      { label: 'Status', value: 'Rejected' },
    ],
    primaryCta: { label: 'View details', href: portalUrl('transactions') },
    secondaryCta: { label: 'Contact support', href: appUrl('contact') },
  });
}

export function buildBtcDepositProofEmail(params: {
  fullName: string;
  amount: string;
  txHash?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'BTC deposit proof received',
    category: 'btc_deposit_proof',
    eyebrow: 'Bitcoin deposit',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'We received your Bitcoin deposit proof. Our team will review the transaction and credit your wallet once confirmed.',
    ],
    details: [
      { label: 'Amount', value: params.amount },
      ...(params.txHash ? [{ label: 'Tx hash', value: params.txHash }] : []),
      { label: 'Status', value: 'Pending review' },
    ],
    primaryCta: { label: 'Track deposit', href: portalUrl('transactions') },
  });
}

export function buildWithdrawalRequestedEmail(params: {
  fullName: string;
  amount: string;
  currency: string;
  reference?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Withdrawal request received — ${params.amount} ${params.currency}`,
    category: 'withdrawal_requested',
    eyebrow: 'Withdrawal',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'We received your withdrawal request. Funds are held pending review before payout.',
    ],
    details: [
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      ...(params.reference ? [{ label: 'Reference', value: params.reference }] : []),
      { label: 'Status', value: 'Pending review' },
    ],
    primaryCta: { label: 'Track withdrawal', href: portalUrl('transactions') },
  });
}

export function buildWithdrawalStaffEmail(params: {
  customerName: string;
  amount: string;
  currency: string;
  withdrawalId: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `[Withdrawal] ${params.amount} ${params.currency} — ${params.customerName}`,
    category: 'withdrawal_requested_staff',
    eyebrow: 'Ops queue',
    heading: '',
    greeting: 'Withdrawal awaiting approval',
    paragraphs: ['A customer withdrawal is pending review.'],
    details: [
      { label: 'Customer', value: params.customerName },
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      { label: 'Withdrawal ID', value: params.withdrawalId },
    ],
    primaryCta: { label: 'Open transactions', href: `${appUrl()}/admin/transactions` },
    footerNote: `Internal notification — ${adminInbox()}`,
  });
}

export function buildWithdrawalApprovedEmail(params: {
  fullName: string;
  amount: string;
  currency: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Withdrawal approved — ${params.amount} ${params.currency}`,
    category: 'withdrawal_approved',
    eyebrow: 'Withdrawal',
    heading: '',
    fullName: params.fullName,
    paragraphs: ['Your withdrawal has been approved and is being processed for payout.'],
    details: [
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      { label: 'Status', value: 'Approved' },
    ],
    primaryCta: { label: 'View payout status', href: portalUrl('transactions') },
  });
}

export function buildWithdrawalRejectedEmail(params: {
  fullName: string;
  amount: string;
  currency: string;
  reason?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Withdrawal not approved — ${params.amount} ${params.currency}`,
    category: 'withdrawal_rejected',
    eyebrow: 'Withdrawal',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your withdrawal request was not approved. Held funds have been returned to your available balance.',
      params.reason || 'Please update your payout details or contact support.',
    ],
    details: [
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      { label: 'Status', value: 'Rejected' },
    ],
    primaryCta: { label: 'View wallet', href: portalUrl('wallets') },
    secondaryCta: { label: 'Contact support', href: appUrl('contact') },
  });
}

export function buildTransferSentEmail(params: {
  fullName: string;
  amount: string;
  currency: string;
  recipient: string;
  reference?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Transfer sent — ${params.amount} ${params.currency}`,
    category: 'transfer_sent',
    eyebrow: 'Transfer',
    heading: '',
    fullName: params.fullName,
    paragraphs: ['Your internal transfer was completed successfully.'],
    details: [
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      { label: 'To', value: params.recipient },
      ...(params.reference ? [{ label: 'Reference', value: params.reference }] : []),
    ],
    primaryCta: { label: 'View receipt', href: portalUrl('transactions') },
  });
}

export function buildTransferReceivedEmail(params: {
  fullName: string;
  amount: string;
  currency: string;
  sender: string;
  reference?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Transfer received — ${params.amount} ${params.currency}`,
    category: 'transfer_received',
    eyebrow: 'Transfer',
    heading: '',
    fullName: params.fullName,
    paragraphs: ['You received an internal transfer into your Avenora wallet.'],
    details: [
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      { label: 'From', value: params.sender },
      ...(params.reference ? [{ label: 'Reference', value: params.reference }] : []),
    ],
    primaryCta: { label: 'View balance', href: portalUrl('wallets') },
  });
}

export function buildFxConvertedEmail(params: {
  fullName: string;
  fromAmount: string;
  fromCurrency: string;
  toAmount: string;
  toCurrency: string;
  rate?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `FX conversion complete — ${params.fromCurrency} → ${params.toCurrency}`,
    category: 'fx_converted',
    eyebrow: 'Currency exchange',
    heading: '',
    fullName: params.fullName,
    paragraphs: ['Your currency conversion completed successfully.'],
    details: [
      { label: 'Sold', value: `${params.fromAmount} ${params.fromCurrency}` },
      { label: 'Bought', value: `${params.toAmount} ${params.toCurrency}` },
      ...(params.rate ? [{ label: 'Rate', value: params.rate }] : []),
    ],
    primaryCta: { label: 'View balances', href: portalUrl('wallets') },
  });
}

export function buildAdminAdjustmentQueuedEmail(params: {
  fullName: string;
  direction: string;
  amount: string;
  currency: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Account adjustment pending — ${params.amount} ${params.currency}`,
    category: 'admin_adjustment_queued',
    eyebrow: 'Account adjustment',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      `An administrative ${params.direction.toLowerCase()} has been queued on your account and is pending review.`,
    ],
    details: [
      { label: 'Type', value: params.direction },
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      { label: 'Status', value: 'Pending' },
    ],
    primaryCta: { label: 'View transactions', href: portalUrl('transactions') },
  });
}

export function buildTransactionReversedEmail(params: {
  fullName: string;
  amount: string;
  currency: string;
  transactionId: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Transaction reversed — ${params.amount} ${params.currency}`,
    category: 'transaction_reversed',
    eyebrow: 'Ledger',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'A transaction on your account was reversed by our operations team. Your balances have been updated accordingly.',
    ],
    details: [
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      { label: 'Transaction', value: params.transactionId },
    ],
    primaryCta: { label: 'View statement', href: portalUrl('transactions') },
  });
}

export function buildStatementReadyEmail(params: {
  fullName: string;
  periodLabel: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Your Avenora statement is ready — ${params.periodLabel}`,
    category: 'statement_ready',
    eyebrow: 'Statements',
    heading: '',
    fullName: params.fullName,
    paragraphs: [`Your account statement for ${params.periodLabel} is ready to download.`],
    primaryCta: { label: 'Download statement', href: portalUrl('statements') },
  });
}
