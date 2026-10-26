/**
 * @license Apache-2.0
 * Avenora — Welcome / registration transactional email
 */

import {
  brandShell,
  EMAIL_BRAND,
  escapeHtml,
  getAppBaseUrl,
  getSupportEmail,
  renderCtaButton,
  renderSecondaryLink,
} from '../layout.ts';
import type { EmailPayload } from '../types.ts';

export interface WelcomeEmailParams {
  fullName: string;
}

export function buildWelcomeEmail(params: WelcomeEmailParams): EmailPayload {
  const base = getAppBaseUrl();
  const support = getSupportEmail();
  const firstName = params.fullName.trim().split(/\s+/)[0] || 'there';
  const portalUrl = base;
  const verifyUrl = `${base}/portal/kyc`;

  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.cta};">Welcome</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:700;color:${EMAIL_BRAND.body};font-family:Georgia,'Times New Roman',serif;">Hello, ${escapeHtml(firstName)}.</h1>
    <p style="margin:0 0 14px;">Your Avenora account is ready. Sign in to explore multicurrency wallets, transfers, and secure digital banking built around you.</p>
    <p style="margin:0 0 8px;">Next step: complete identity verification so we can unlock deposits, withdrawals, and full account features.</p>
    <p style="margin:28px 0 12px;">
      ${renderCtaButton({ label: 'Open your portal', href: portalUrl })}
    </p>
    <p style="margin:0 0 24px;">
      ${renderSecondaryLink({ label: 'Complete verification', href: verifyUrl })}
    </p>
    <p style="margin:0;font-size:13px;color:${EMAIL_BRAND.muted};">Questions? We are here at <a href="mailto:${escapeHtml(support)}" style="color:${EMAIL_BRAND.cta};text-decoration:none;">${escapeHtml(support)}</a>.</p>
  `;

  const html = brandShell({
    title: 'Welcome to Avenora',
    preheader: 'Your Avenora account is ready — open your portal and complete verification.',
    bodyHtml,
  });

  const text = [
    `Welcome, ${firstName}.`,
    '',
    'Your Avenora account is ready. Sign in to explore multicurrency wallets, transfers, and secure digital banking.',
    '',
    `Open your portal: ${portalUrl}`,
    `Complete verification: ${verifyUrl}`,
    '',
    `Need help? ${support}`,
  ].join('\n');

  return {
    subject: 'Welcome to Avenora Bank',
    html,
    text,
    tags: [{ name: 'category', value: 'welcome' }],
  };
}
