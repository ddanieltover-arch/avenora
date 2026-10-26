/**
 * @license Apache-2.0
 * Avenora — standard transactional email composer
 */

import { getValidatedConfig } from '../../config/env.config.ts';
import {
  brandShell,
  EMAIL_BRAND,
  escapeHtml,
  getAppBaseUrl,
  getSupportEmail,
  renderCtaButton,
  renderDetailCard,
  renderSecondaryLink,
} from './layout.ts';
import type { EmailCta, EmailDetailRow, EmailPayload } from './types.ts';

export interface ComposeEmailParams {
  subject: string;
  category: string;
  eyebrow?: string;
  heading: string;
  fullName?: string;
  paragraphs: string[];
  details?: EmailDetailRow[];
  primaryCta?: EmailCta;
  secondaryCta?: EmailCta;
  preheader?: string;
  footerNote?: string;
  /** When set, greeting uses this instead of deriving from fullName */
  greeting?: string;
}

function firstNameFrom(fullName?: string): string {
  if (!fullName?.trim()) return 'there';
  return fullName.trim().split(/\s+/)[0] || 'there';
}

/**
 * Builds a branded EmailPayload from structured content.
 */
export function composeTransactionalEmail(params: ComposeEmailParams): EmailPayload {
  const greeting =
    params.greeting ?? `Hello, ${escapeHtml(firstNameFrom(params.fullName))}.`;
  const eyebrow = params.eyebrow
    ? `<p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.cta};">${escapeHtml(params.eyebrow)}</p>`
    : '';

  const paragraphsHtml = params.paragraphs
    .map(
      (p, i) =>
        `<p style="margin:0 0 ${i === params.paragraphs.length - 1 && !params.details?.length ? '8px' : '14px'};">${escapeHtml(p)}</p>`
    )
    .join('');

  const detailsHtml = params.details?.length ? renderDetailCard(params.details) : '';

  let ctaHtml = '';
  if (params.primaryCta) {
    ctaHtml += `<p style="margin:28px 0 12px;">${renderCtaButton(params.primaryCta)}</p>`;
  }
  if (params.secondaryCta) {
    ctaHtml += `<p style="margin:0 0 16px;">${renderSecondaryLink(params.secondaryCta)}</p>`;
  }

  const bodyHtml = `
    ${eyebrow}
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:${EMAIL_BRAND.body};font-family:Georgia,'Times New Roman',serif;">${greeting}</h1>
    ${paragraphsHtml}
    ${detailsHtml}
    ${ctaHtml}
  `;

  const html = brandShell({
    title: params.subject,
    preheader: params.preheader || params.paragraphs[0],
    bodyHtml,
    footerNote: params.footerNote,
  });

  const textParts = [
    params.greeting
      ? params.greeting.replace(/<[^>]+>/g, '')
      : `Hello, ${firstNameFrom(params.fullName)}.`,
    '',
    ...params.paragraphs,
  ];
  if (params.details?.length) {
    textParts.push('');
    for (const row of params.details) {
      textParts.push(`${row.label}: ${row.value}`);
    }
  }
  if (params.primaryCta) {
    textParts.push('', `${params.primaryCta.label}: ${params.primaryCta.href}`);
  }
  if (params.secondaryCta) {
    textParts.push(`${params.secondaryCta.label}: ${params.secondaryCta.href}`);
  }
  textParts.push('', `Support: ${getSupportEmail()}`);

  return {
    subject: params.subject,
    html,
    text: textParts.join('\n'),
    tags: [{ name: 'category', value: params.category }],
  };
}

export function portalUrl(path = ''): string {
  const base = getAppBaseUrl();
  if (!path) return `${base}/portal`;
  return `${base}/portal/${path.replace(/^\//, '')}`;
}

export function appUrl(path = ''): string {
  const base = getAppBaseUrl();
  if (!path) return base;
  return `${base}/${path.replace(/^\//, '')}`;
}

export function adminInbox(): string {
  const config = getValidatedConfig();
  return config.ADMIN_EMAIL || config.SUPPORT_EMAIL || 'support@avenorabank.com';
}

export function contactInbox(): string {
  const config = getValidatedConfig();
  return config.CONTACT_EMAIL || config.SUPPORT_EMAIL || config.ADMIN_EMAIL || 'support@avenorabank.com';
}

export function supportInbox(): string {
  const config = getValidatedConfig();
  return config.SUPPORT_EMAIL || config.ADMIN_EMAIL || 'support@avenorabank.com';
}
