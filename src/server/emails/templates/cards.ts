/**
 * @license Apache-2.0
 * Avenora — card lifecycle email templates
 */

import { adminInbox, appUrl, composeTransactionalEmail, portalUrl } from '../compose.ts';
import type { EmailPayload } from '../types.ts';

export function buildCardRequestedEmail(params: {
  fullName: string;
  cardLabel?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Card request received',
    category: 'card_requested',
    eyebrow: 'Cards',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'We received your card request. It is pending review and you will be notified once a decision is made.',
    ],
    details: params.cardLabel ? [{ label: 'Card', value: params.cardLabel }] : undefined,
    primaryCta: { label: 'Track request', href: portalUrl('cards') },
  });
}

export function buildCardRequestedStaffEmail(params: {
  customerName: string;
  cardId: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `[Card] Issuance request — ${params.customerName}`,
    category: 'card_requested_staff',
    eyebrow: 'Ops queue',
    heading: '',
    greeting: 'Card issuance pending review',
    paragraphs: ['A customer requested a new card.'],
    details: [
      { label: 'Customer', value: params.customerName },
      { label: 'Card ID', value: params.cardId },
    ],
    primaryCta: { label: 'Open cards queue', href: `${appUrl()}/admin/cards` },
    footerNote: `Internal notification — ${adminInbox()}`,
  });
}

export function buildCardIssuanceApprovedEmail(params: {
  fullName: string;
  last4?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora card is approved',
    category: 'card_issuance_approved',
    eyebrow: 'Cards',
    heading: '',
    fullName: params.fullName,
    paragraphs: ['Great news — your card request was approved and the card is ready to manage in your portal.'],
    details: params.last4 ? [{ label: 'Card', value: `•••• ${params.last4}` }] : undefined,
    primaryCta: { label: 'Manage cards', href: portalUrl('cards') },
  });
}

export function buildCardIssuanceDeclinedEmail(params: {
  fullName: string;
  reason?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Update on your Avenora card request',
    category: 'card_issuance_declined',
    eyebrow: 'Cards',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your card request was not approved at this time.',
      params.reason || 'Contact support if you would like more information.',
    ],
    primaryCta: { label: 'Contact support', href: appUrl('contact') },
    secondaryCta: { label: 'View cards', href: portalUrl('cards') },
  });
}

export function buildCardFrozenEmail(params: {
  fullName: string;
  last4?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora card was frozen',
    category: 'card_frozen',
    eyebrow: 'Cards',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your card has been frozen. New authorizations will be declined until it is unfrozen.',
    ],
    details: params.last4 ? [{ label: 'Card', value: `•••• ${params.last4}` }] : undefined,
    primaryCta: { label: 'Manage card', href: portalUrl('cards') },
    secondaryCta: { label: 'Contact support', href: appUrl('contact') },
  });
}

export function buildCardUnfrozenEmail(params: {
  fullName: string;
  last4?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora card was unfrozen',
    category: 'card_unfrozen',
    eyebrow: 'Cards',
    heading: '',
    fullName: params.fullName,
    paragraphs: ['Your card is active again and can be used for new purchases.'],
    details: params.last4 ? [{ label: 'Card', value: `•••• ${params.last4}` }] : undefined,
    primaryCta: { label: 'Manage cards', href: portalUrl('cards') },
  });
}

export function buildCardTerminatedEmail(params: {
  fullName: string;
  last4?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora card was terminated',
    category: 'card_terminated',
    eyebrow: 'Cards',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your card has been terminated and can no longer be used. You may request a replacement from your portal.',
    ],
    details: params.last4 ? [{ label: 'Card', value: `•••• ${params.last4}` }] : undefined,
    primaryCta: { label: 'Request replacement', href: portalUrl('cards') },
  });
}

export function buildCardLimitsChangedEmail(params: {
  fullName: string;
  last4?: string;
  dailyLimit?: string;
  monthlyLimit?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora card limits were updated',
    category: 'card_limits_changed',
    eyebrow: 'Cards',
    heading: '',
    fullName: params.fullName,
    paragraphs: ['Spending limits on your card have been updated.'],
    details: [
      ...(params.last4 ? [{ label: 'Card', value: `•••• ${params.last4}` }] : []),
      ...(params.dailyLimit ? [{ label: 'Daily limit', value: params.dailyLimit }] : []),
      ...(params.monthlyLimit ? [{ label: 'Monthly limit', value: params.monthlyLimit }] : []),
    ],
    primaryCta: { label: 'View limits', href: portalUrl('cards') },
  });
}

export function buildCardAuthHoldEmail(params: {
  fullName: string;
  amount: string;
  currency: string;
  merchant?: string;
  last4?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Card authorization hold — ${params.amount} ${params.currency}`,
    category: 'card_auth_hold',
    eyebrow: 'Card activity',
    heading: '',
    fullName: params.fullName,
    paragraphs: ['A temporary authorization hold was placed on your card.'],
    details: [
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      ...(params.merchant ? [{ label: 'Merchant', value: params.merchant }] : []),
      ...(params.last4 ? [{ label: 'Card', value: `•••• ${params.last4}` }] : []),
      { label: 'Status', value: 'Pending hold' },
    ],
    primaryCta: { label: 'Review hold', href: portalUrl('cards') },
  });
}

export function buildCardHoldSettledEmail(params: {
  fullName: string;
  amount: string;
  currency: string;
  outcome: 'settled' | 'released';
  merchant?: string;
}): EmailPayload {
  const settled = params.outcome === 'settled';
  return composeTransactionalEmail({
    subject: settled
      ? `Card charge settled — ${params.amount} ${params.currency}`
      : `Card hold released — ${params.amount} ${params.currency}`,
    category: 'card_hold_settled',
    eyebrow: 'Card activity',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      settled
        ? 'A pending card authorization was settled and posted to your account.'
        : 'A pending card authorization hold was released. The reserved amount is available again.',
    ],
    details: [
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
      ...(params.merchant ? [{ label: 'Merchant', value: params.merchant }] : []),
      { label: 'Status', value: settled ? 'Settled' : 'Released' },
    ],
    primaryCta: { label: 'View transactions', href: portalUrl('transactions') },
  });
}
