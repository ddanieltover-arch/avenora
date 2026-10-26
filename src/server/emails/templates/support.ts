/**
 * @license Apache-2.0
 * Avenora — contact & support email templates
 */

import { appUrl, composeTransactionalEmail, contactInbox, portalUrl, supportInbox } from '../compose.ts';
import { brandShell, EMAIL_BRAND, escapeHtml } from '../layout.ts';
import type { EmailPayload } from '../types.ts';

export function buildContactStaffEmail(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
  reference: string;
}): EmailPayload {
  const categoryLine = params.category
    ? `<p style="margin:0 0 8px;"><strong>Category:</strong> ${escapeHtml(params.category)}</p>`
    : '';

  const html = brandShell({
    title: `Contact inquiry ${params.reference}`,
    preheader: `New website inquiry ${params.reference}`,
    bodyHtml: `
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.cta};">Contact</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:${EMAIL_BRAND.body};font-family:Georgia,'Times New Roman',serif;">New website inquiry</h1>
      <p style="margin:0 0 8px;"><strong>Reference:</strong> ${escapeHtml(params.reference)}</p>
      <p style="margin:0 0 8px;"><strong>From:</strong> ${escapeHtml(params.name)} &lt;${escapeHtml(params.email)}&gt;</p>
      ${categoryLine}
      <p style="margin:0 0 8px;"><strong>Subject:</strong> ${escapeHtml(params.subject)}</p>
      <div style="margin-top:16px;padding:16px;background:${EMAIL_BRAND.cardBg};border-radius:12px;border:1px solid ${EMAIL_BRAND.border};white-space:pre-wrap;">${escapeHtml(params.message)}</div>
    `,
    footerNote: `Internal notification — reply to the customer. Inbox: ${contactInbox()}`,
  });

  return {
    subject: `[Avenora Contact] ${params.reference}: ${params.subject}`,
    html,
    text: `Inquiry ${params.reference}\nFrom: ${params.name} <${params.email}>\nSubject: ${params.subject}\n\n${params.message}`,
    tags: [{ name: 'category', value: 'contact_staff' }],
  };
}

export function buildContactAckEmail(params: {
  name: string;
  reference: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `We received your message (${params.reference})`,
    category: 'contact_ack',
    eyebrow: 'Support',
    heading: '',
    fullName: params.name,
    paragraphs: [
      'Thanks for contacting Avenora. We received your message and will respond using this email address.',
    ],
    details: [{ label: 'Reference', value: params.reference }],
    primaryCta: { label: 'Visit help center', href: appUrl('help') },
  });
}

export function buildSupportTicketStaffEmail(params: {
  customerEmail: string;
  customerName: string;
  subject: string;
  message: string;
  priority?: string;
  ticketId: string;
}): EmailPayload {
  const html = brandShell({
    title: `Support ticket ${params.ticketId}`,
    preheader: `Support ticket ${params.ticketId}`,
    bodyHtml: `
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.cta};">Support</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:${EMAIL_BRAND.body};font-family:Georgia,'Times New Roman',serif;">Support ticket</h1>
      <p style="margin:0 0 8px;"><strong>Ticket:</strong> ${escapeHtml(params.ticketId)}</p>
      <p style="margin:0 0 8px;"><strong>Customer:</strong> ${escapeHtml(params.customerName)} &lt;${escapeHtml(params.customerEmail)}&gt;</p>
      <p style="margin:0 0 8px;"><strong>Priority:</strong> ${escapeHtml(params.priority || 'STANDARD')}</p>
      <p style="margin:0 0 8px;"><strong>Subject:</strong> ${escapeHtml(params.subject)}</p>
      <div style="margin-top:16px;padding:16px;background:${EMAIL_BRAND.cardBg};border-radius:12px;border:1px solid ${EMAIL_BRAND.border};white-space:pre-wrap;">${escapeHtml(params.message)}</div>
    `,
    footerNote: `Internal support notification — ${supportInbox()}`,
  });

  return {
    subject: `[Avenora Support ${params.priority || 'STANDARD'}] ${params.ticketId}: ${params.subject}`,
    html,
    text: `Ticket ${params.ticketId}\nFrom: ${params.customerName} <${params.customerEmail}>\nPriority: ${params.priority || 'STANDARD'}\nSubject: ${params.subject}\n\n${params.message}`,
    tags: [{ name: 'category', value: 'support_ticket_staff' }],
  };
}

export function buildSupportTicketAckEmail(params: {
  fullName: string;
  ticketId: string;
  subject: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `We received your support request (${params.ticketId})`,
    category: 'support_ticket_ack',
    eyebrow: 'Support',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Thanks for reaching out. Our support team received your ticket and will follow up by email.',
    ],
    details: [
      { label: 'Ticket', value: params.ticketId },
      { label: 'Subject', value: params.subject },
    ],
    primaryCta: { label: 'Open help & support', href: portalUrl('support') },
  });
}

export function buildSupportTicketResolvedEmail(params: {
  fullName: string;
  ticketId: string;
  subject: string;
  resolutionNote?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: `Support ticket resolved (${params.ticketId})`,
    category: 'support_ticket_resolved',
    eyebrow: 'Support',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your support ticket has been marked as resolved.',
      params.resolutionNote || 'If you still need help, reply to this email or open a new ticket from your portal.',
    ],
    details: [
      { label: 'Ticket', value: params.ticketId },
      { label: 'Subject', value: params.subject },
    ],
    primaryCta: { label: 'Open help & support', href: portalUrl('support') },
  });
}
