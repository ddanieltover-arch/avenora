/**
 * @license Apache-2.0
 * Avenora — KYC & domestic account email templates
 */

import { adminInbox, appUrl, composeTransactionalEmail, portalUrl } from '../compose.ts';
import type { EmailPayload } from '../types.ts';

export function buildKycSubmittedEmail(params: {
  fullName: string;
  reference?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'We received your Avenora identity verification',
    category: 'kyc_submitted',
    eyebrow: 'Verification',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Thanks — your identity verification documents were submitted successfully. Our compliance team will review them shortly.',
    ],
    details: params.reference ? [{ label: 'Reference', value: params.reference }] : undefined,
    primaryCta: { label: 'Track status', href: portalUrl('kyc') },
  });
}

export function buildKycSubmittedStaffEmail(params: {
  customerName: string;
  customerEmail: string;
  userId: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `[KYC] New submission — ${params.customerName}`,
    category: 'kyc_submitted_staff',
    eyebrow: 'Ops queue',
    heading: '',
    greeting: 'New KYC submission',
    paragraphs: ['A customer submitted identity verification for review.'],
    details: [
      { label: 'Customer', value: params.customerName },
      { label: 'Email', value: params.customerEmail },
      { label: 'User ID', value: params.userId },
    ],
    primaryCta: { label: 'Open admin KYC queue', href: `${appUrl()}/admin/kyc` },
    footerNote: `Internal notification — ${adminInbox()}`,
  });
}

export function buildKycUnderReviewEmail(params: { fullName: string }): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora verification is under review',
    category: 'kyc_under_review',
    eyebrow: 'Verification',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your identity verification is now under review by our compliance team. We will email you when a decision is ready.',
    ],
    primaryCta: { label: 'Track status', href: portalUrl('kyc') },
  });
}

export function buildKycNeedsMoreInfoEmail(params: {
  fullName: string;
  notes?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'More information needed for Avenora verification',
    category: 'kyc_needs_more_info',
    eyebrow: 'Action required',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'We need a bit more information to complete your identity verification.',
      params.notes || 'Please return to the verification flow and upload the requested documents.',
    ],
    primaryCta: { label: 'Continue verification', href: portalUrl('kyc') },
  });
}

export function buildKycApprovedEmail(params: { fullName: string }): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora identity verification is approved',
    category: 'kyc_approved',
    eyebrow: 'Verified',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Congratulations — your identity has been verified. Your account is now active for deposits, withdrawals, and transfers.',
    ],
    primaryCta: { label: 'Open wallet', href: portalUrl('wallets') },
    secondaryCta: { label: 'View account details', href: portalUrl('kyc') },
  });
}

export function buildKycRejectedEmail(params: {
  fullName: string;
  notes?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Update on your Avenora identity verification',
    category: 'kyc_rejected',
    eyebrow: 'Verification',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Unfortunately we could not approve your identity verification at this time.',
      params.notes || 'You may resubmit with updated documents or contact support for help.',
    ],
    primaryCta: { label: 'Resubmit documents', href: portalUrl('kyc') },
    secondaryCta: { label: 'Contact support', href: appUrl('contact') },
  });
}

export function buildDomesticAccountIssuedEmail(params: {
  fullName: string;
  accountSummary: string;
  currency?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora domestic account details are ready',
    category: 'domestic_account_issued',
    eyebrow: 'Account details',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your domestic bank account details have been generated and are ready to use for local transfers.',
    ],
    details: [
      { label: 'Account', value: params.accountSummary },
      ...(params.currency ? [{ label: 'Currency', value: params.currency }] : []),
    ],
    primaryCta: { label: 'View account details', href: portalUrl('wallets') },
  });
}

export function buildDomesticAccountFailedEmail(params: {
  fullName: string;
  reason?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'We could not generate your Avenora account details',
    category: 'domestic_account_failed',
    eyebrow: 'Account details',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'We ran into an issue generating your domestic account details.',
      params.reason || 'Our team has been notified. You can retry from your portal or contact support.',
    ],
    primaryCta: { label: 'Open portal', href: portalUrl('wallets') },
    secondaryCta: { label: 'Contact support', href: appUrl('contact') },
  });
}
