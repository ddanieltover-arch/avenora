/**
 * @license Apache-2.0
 * Avenora — shared transactional email layout (email-safe HTML tables + inline CSS)
 */

import { getValidatedConfig } from '../../config/env.config.ts';
import type { EmailCta, EmailDetailRow } from './types.ts';

/** Brand tokens aligned with the public site / portal. */
export const EMAIL_BRAND = {
  headerFrom: '#003933',
  headerTo: '#076c64',
  cta: '#076c64',
  body: '#0f1f1e',
  muted: '#5c6f6c',
  pageBg: '#f0f4f3',
  cardBg: '#f8fbf9',
  border: '#d8e3e0',
  white: '#ffffff',
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getAppBaseUrl(): string {
  return getValidatedConfig().APP_URL.replace(/\/$/, '');
}

/** Absolute URL for the header logo (white A on teal — email clients need absolute src). */
export function getEmailLogoUrl(): string {
  return `${getAppBaseUrl()}/avenora-header-logo.jpg`;
}

export function getSupportEmail(): string {
  return getValidatedConfig().SUPPORT_EMAIL || 'support@avenorabank.com';
}

export function renderCtaButton(cta: EmailCta): string {
  return `<a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:13px 24px;background:${EMAIL_BRAND.cta};color:${EMAIL_BRAND.white};text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;font-family:system-ui,-apple-system,sans-serif;line-height:1.2;">${escapeHtml(cta.label)}</a>`;
}

export function renderSecondaryLink(cta: EmailCta): string {
  return `<a href="${escapeHtml(cta.href)}" style="color:${EMAIL_BRAND.cta};font-weight:600;text-decoration:underline;font-size:14px;font-family:system-ui,-apple-system,sans-serif;">${escapeHtml(cta.label)}</a>`;
}

export function renderDetailCard(rows: EmailDetailRow[]): string {
  if (rows.length === 0) return '';
  const rowsHtml = rows
    .map(
      (row, index) => `
        <tr>
          <td style="padding:${index === 0 ? '0' : '10px'} 0 ${index === rows.length - 1 ? '0' : '10px'};font-family:system-ui,-apple-system,sans-serif;font-size:12px;color:${EMAIL_BRAND.muted};vertical-align:top;width:38%;">${escapeHtml(row.label)}</td>
          <td style="padding:${index === 0 ? '0' : '10px'} 0 ${index === rows.length - 1 ? '0' : '10px'};font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:${EMAIL_BRAND.body};font-weight:600;text-align:right;vertical-align:top;">${escapeHtml(row.value)}</td>
        </tr>`
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;background:${EMAIL_BRAND.cardBg};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;">
      <tr>
        <td style="padding:16px 18px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rowsHtml}</table>
        </td>
      </tr>
    </table>`;
}

export interface BrandShellParams {
  title: string;
  bodyHtml: string;
  /** Optional note under the legal footer links */
  footerNote?: string;
  preheader?: string;
}

/**
 * Shared Avenora email chrome: logo header, body slot, support + legal footer.
 */
export function brandShell(params: BrandShellParams): string {
  const base = getAppBaseUrl();
  const logoUrl = getEmailLogoUrl();
  const support = getSupportEmail();
  const privacyUrl = `${base}/privacy`;
  const termsUrl = `${base}/terms`;
  const footer =
    params.footerNote ||
    'Avenora Bank — secure digital banking. This message was sent automatically; please do not reply unless instructed.';
  const preheader = params.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${EMAIL_BRAND.pageBg};">${escapeHtml(params.preheader)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.pageBg};font-family:Georgia,'Times New Roman',serif;color:${EMAIL_BRAND.body};">
  ${preheader}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.pageBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:${EMAIL_BRAND.white};border-radius:16px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td style="background:linear-gradient(135deg,${EMAIL_BRAND.headerFrom},${EMAIL_BRAND.headerTo});padding:26px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:14px;">
                    <img src="${escapeHtml(logoUrl)}" width="44" height="44" alt="Avenora" style="display:block;width:44px;height:44px;border-radius:10px;border:0;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.04em;color:${EMAIL_BRAND.white};font-family:Georgia,'Times New Roman',serif;">AVENORA</p>
                    <p style="margin:5px 0 0;font-size:12px;color:#c8ebe4;font-family:system-ui,-apple-system,sans-serif;">Secure digital banking</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.body};">
              ${params.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 28px;font-family:system-ui,-apple-system,sans-serif;font-size:11px;line-height:1.55;color:${EMAIL_BRAND.muted};border-top:1px solid #e8efed;">
              <p style="margin:0 0 10px;">${escapeHtml(footer)}</p>
              <p style="margin:0 0 8px;">
                Need help?
                <a href="mailto:${escapeHtml(support)}" style="color:${EMAIL_BRAND.cta};text-decoration:none;">${escapeHtml(support)}</a>
              </p>
              <p style="margin:0;">
                <a href="${escapeHtml(privacyUrl)}" style="color:${EMAIL_BRAND.muted};text-decoration:underline;">Privacy</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(termsUrl)}" style="color:${EMAIL_BRAND.muted};text-decoration:underline;">Terms</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
