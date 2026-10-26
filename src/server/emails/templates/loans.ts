/**
 * @license Apache-2.0
 * Avenora — loan & grant email templates
 */

import { adminInbox, appUrl, composeTransactionalEmail, portalUrl } from '../compose.ts';
import type { EmailPayload } from '../types.ts';

export function buildLoanSubmittedEmail(params: {
  fullName: string;
  applicationId: string;
  amount?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Loan application received',
    category: 'loan_submitted',
    eyebrow: 'Lending',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'We received your loan application. Our team will review it and notify you of the decision.',
    ],
    details: [
      { label: 'Application', value: params.applicationId },
      ...(params.amount ? [{ label: 'Amount', value: params.amount }] : []),
    ],
    primaryCta: { label: 'Track application', href: portalUrl('loans') },
  });
}

export function buildLoanSubmittedStaffEmail(params: {
  customerName: string;
  applicationId: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `[Loan] Application — ${params.customerName}`,
    category: 'loan_submitted_staff',
    eyebrow: 'Ops queue',
    heading: '',
    greeting: 'New loan application',
    paragraphs: ['A customer submitted a loan application for review.'],
    details: [
      { label: 'Customer', value: params.customerName },
      { label: 'Application', value: params.applicationId },
    ],
    primaryCta: { label: 'Open loans queue', href: `${appUrl()}/admin/loans` },
    footerNote: `Internal notification — ${adminInbox()}`,
  });
}

export function buildLoanDecisionEmail(params: {
  fullName: string;
  applicationId: string;
  decision: string;
  notes?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Loan application update — ${params.decision}`,
    category: 'loan_decision',
    eyebrow: 'Lending',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      `There is an update on your loan application: ${params.decision}.`,
      params.notes || 'Sign in to your portal for full details and next steps.',
    ],
    details: [
      { label: 'Application', value: params.applicationId },
      { label: 'Decision', value: params.decision },
    ],
    primaryCta: { label: 'View decision', href: portalUrl('loans') },
  });
}

export function buildGrantSubmittedEmail(params: {
  fullName: string;
  applicationId: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Grant application received',
    category: 'grant_submitted',
    eyebrow: 'Grants',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'We received your grant application. You will be notified once eligibility and review are complete.',
    ],
    details: [{ label: 'Application', value: params.applicationId }],
    primaryCta: { label: 'Track application', href: portalUrl('grants') },
  });
}

export function buildGrantSubmittedStaffEmail(params: {
  customerName: string;
  applicationId: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `[Grant] Application — ${params.customerName}`,
    category: 'grant_submitted_staff',
    eyebrow: 'Ops queue',
    heading: '',
    greeting: 'New grant application',
    paragraphs: ['A customer submitted a grant application for review.'],
    details: [
      { label: 'Customer', value: params.customerName },
      { label: 'Application', value: params.applicationId },
    ],
    primaryCta: { label: 'Open grants queue', href: `${appUrl()}/admin/loans` },
    footerNote: `Internal notification — ${adminInbox()}`,
  });
}

export function buildGrantIneligibleEmail(params: {
  fullName: string;
  applicationId: string;
  reason?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Grant application eligibility update',
    category: 'grant_ineligible',
    eyebrow: 'Grants',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Based on the information provided, your grant application did not meet eligibility requirements.',
      params.reason || 'Review the program criteria and update your application if applicable.',
    ],
    details: [{ label: 'Application', value: params.applicationId }],
    primaryCta: { label: 'Review eligibility', href: portalUrl('grants') },
  });
}

export function buildGrantReviewedEmail(params: {
  fullName: string;
  applicationId: string;
  decision: string;
  notes?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Grant application update — ${params.decision}`,
    category: 'grant_reviewed',
    eyebrow: 'Grants',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      `There is an update on your grant application: ${params.decision}.`,
      params.notes || 'Sign in to your portal for full details.',
    ],
    details: [
      { label: 'Application', value: params.applicationId },
      { label: 'Decision', value: params.decision },
    ],
    primaryCta: { label: 'View status', href: portalUrl('grants') },
  });
}

export function buildGrantDisbursedEmail(params: {
  fullName: string;
  applicationId: string;
  amount: string;
  currency: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Grant disbursed — ${params.amount} ${params.currency}`,
    category: 'grant_disbursed',
    eyebrow: 'Grants',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your grant has been disbursed and credited to your Avenora wallet.',
    ],
    details: [
      { label: 'Application', value: params.applicationId },
      { label: 'Amount', value: `${params.amount} ${params.currency}` },
    ],
    primaryCta: { label: 'View wallet', href: portalUrl('wallets') },
    secondaryCta: { label: 'View grant', href: portalUrl('grants') },
  });
}
