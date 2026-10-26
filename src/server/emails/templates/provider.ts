/**
 * @license Apache-2.0
 * Avenora — provider / webhook email templates
 */

import { adminInbox, appUrl, composeTransactionalEmail, portalUrl } from '../compose.ts';
import type { EmailPayload } from '../types.ts';

export function buildProviderDepositClearedEmail(params: {
  fullName: string;
  amount?: string;
  currency?: string;
  reference?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Deposit cleared with our payment partner',
    category: 'provider_deposit_cleared',
    eyebrow: 'Payments',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'A deposit linked to your account was marked cleared by our payment partner.',
    ],
    details: [
      ...(params.amount && params.currency
        ? [{ label: 'Amount', value: `${params.amount} ${params.currency}` }]
        : []),
      ...(params.reference ? [{ label: 'Reference', value: params.reference }] : []),
    ],
    primaryCta: { label: 'View deposit', href: portalUrl('transactions') },
  });
}

export function buildProviderWireInboundEmail(params: {
  fullName: string;
  amount?: string;
  currency?: string;
  reference?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Inbound wire received',
    category: 'provider_wire_inbound',
    eyebrow: 'Payments',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'An inbound wire related to your account was reported by our payment partner. Confirm details in your portal.',
    ],
    details: [
      ...(params.amount && params.currency
        ? [{ label: 'Amount', value: `${params.amount} ${params.currency}` }]
        : []),
      ...(params.reference ? [{ label: 'Reference', value: params.reference }] : []),
    ],
    primaryCta: { label: 'View funds', href: portalUrl('wallets') },
  });
}

export function buildProviderWireInboundStaffEmail(params: {
  reference?: string;
  amount?: string;
  currency?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: '[Wire] Inbound wire reported',
    category: 'provider_wire_inbound_staff',
    eyebrow: 'Ops',
    heading: '',
    greeting: 'Inbound wire alert',
    paragraphs: ['A mock/provider inbound wire event was received and needs ops attention.'],
    details: [
      ...(params.amount && params.currency
        ? [{ label: 'Amount', value: `${params.amount} ${params.currency}` }]
        : []),
      ...(params.reference ? [{ label: 'Reference', value: params.reference }] : []),
    ],
    primaryCta: { label: 'Open admin', href: `${appUrl()}/admin/transactions` },
    footerNote: `Internal notification — ${adminInbox()}`,
  });
}

export function buildComplianceFlagEmail(params: {
  flagType?: string;
  reference?: string;
  detail?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: '[Compliance] Flag raised',
    category: 'compliance_flag',
    eyebrow: 'Compliance',
    heading: '',
    greeting: 'Compliance flag',
    paragraphs: [
      'A compliance flag was raised by the payment partner webhook and requires review.',
      params.detail || 'Open the admin console to investigate.',
    ],
    details: [
      ...(params.flagType ? [{ label: 'Flag', value: params.flagType }] : []),
      ...(params.reference ? [{ label: 'Reference', value: params.reference }] : []),
    ],
    primaryCta: { label: 'Review flag', href: `${appUrl()}/admin/audit` },
    footerNote: `Internal compliance notification — ${adminInbox()}`,
  });
}

export function buildProviderPaymentConfirmedEmail(params: {
  fullName: string;
  amount: string;
  currency: string;
  paymentId: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Payment confirmed — ${params.amount} ${params.currency}`,
    category: 'provider_payment_confirmed',
    eyebrow: 'Payments',
    heading: '',
    fullName: params.fullName,
    paragraphs: ['Your payment was confirmed by our payment partner.'],
    details: [
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      { label: 'Payment ID', value: params.paymentId },
    ],
    primaryCta: { label: 'View payment', href: portalUrl('transactions') },
  });
}

export function buildProviderPaymentFailedEmail(params: {
  fullName: string;
  amount: string;
  currency: string;
  paymentId: string;
  reason?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Payment failed — ${params.amount} ${params.currency}`,
    category: 'provider_payment_failed',
    eyebrow: 'Payments',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'A payment linked to your account failed or was reversed by our payment partner.',
      params.reason || 'Contact support if you need help resolving this.',
    ],
    details: [
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      { label: 'Payment ID', value: params.paymentId },
    ],
    primaryCta: { label: 'Contact support', href: appUrl('contact') },
    secondaryCta: { label: 'View transactions', href: portalUrl('transactions') },
  });
}

export function buildReconciliationRequiredEmail(params: {
  paymentId: string;
  detail?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `[Reconciliation] Required — ${params.paymentId}`,
    category: 'reconciliation_required',
    eyebrow: 'Ops',
    heading: '',
    greeting: 'Reconciliation required',
    paragraphs: [
      'A provider payment requires manual reconciliation.',
      params.detail || 'Review the payment in the admin console.',
    ],
    details: [{ label: 'Payment ID', value: params.paymentId }],
    primaryCta: { label: 'Reconcile payment', href: `${appUrl()}/admin/transactions` },
    footerNote: `Internal ops notification — ${adminInbox()}`,
  });
}
