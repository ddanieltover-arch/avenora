/**
 * @license Apache-2.0
 * Avenora — auth & account status email templates
 */

import { composeTransactionalEmail, portalUrl, appUrl } from '../compose.ts';
import { brandShell, escapeHtml, getAppBaseUrl, renderCtaButton } from '../layout.ts';
import type { EmailPayload } from '../types.ts';

export function buildPasswordResetRequestEmail(params: {
  fullName: string;
  resetToken: string;
}): EmailPayload {
  const resetUrl = `${getAppBaseUrl()}/?view=auth&reset=1&token=${encodeURIComponent(params.resetToken)}`;
  const firstName = params.fullName.trim().split(/\s+/)[0] || 'there';

  const html = brandShell({
    title: 'Reset your Avenora password',
    preheader: 'Reset your password within 30 minutes.',
    bodyHtml: `
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#076c64;">Security</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:#0f1f1e;font-family:Georgia,'Times New Roman',serif;">Hello, ${escapeHtml(firstName)}.</h1>
      <p style="margin:0 0 14px;">We received a request to reset the password for your Avenora account. Use the button below within <strong>30 minutes</strong>.</p>
      <p style="margin:0 0 8px;">If you did not request this, you can safely ignore this email.</p>
      <p style="margin:28px 0 12px;">${renderCtaButton({ label: 'Reset password', href: resetUrl })}</p>
      <p style="margin:0 0 8px;font-size:12px;color:#5c6f6c;">Or paste this link into your browser:</p>
      <p style="margin:0;font-size:12px;word-break:break-all;color:#076c64;">${escapeHtml(resetUrl)}</p>
    `,
  });

  return {
    subject: 'Reset your Avenora password',
    html,
    text: `Hello, ${firstName}.\n\nReset your Avenora password (expires in 30 minutes):\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    tags: [{ name: 'category', value: 'password_reset_request' }],
  };
}

export function buildPasswordResetCompletedEmail(params: { fullName: string }): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora password was reset',
    category: 'password_reset_completed',
    eyebrow: 'Security',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your password was successfully reset. All previous sessions have been signed out for your security.',
      'If you did not make this change, contact support immediately.',
    ],
    primaryCta: { label: 'Sign in', href: appUrl() },
    secondaryCta: { label: 'Contact support', href: appUrl('contact') },
  });
}

export function buildPasswordChangedEmail(params: { fullName: string }): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora password was changed',
    category: 'password_changed',
    eyebrow: 'Security',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'The password for your Avenora account was just changed.',
      'If this was not you, secure your account and contact support right away.',
    ],
    primaryCta: { label: 'Review security settings', href: portalUrl('profile') },
    secondaryCta: { label: 'Contact support', href: appUrl('contact') },
  });
}

export function buildLoginLockoutEmail(params: {
  fullName: string;
  lockMinutes: number;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Avenora account temporarily locked',
    category: 'login_lockout',
    eyebrow: 'Security alert',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      `We temporarily locked your account after too many failed sign-in attempts. Please wait about ${params.lockMinutes} minutes before trying again.`,
      'If this was not you, reset your password and contact support.',
    ],
    details: [{ label: 'Lock duration', value: `About ${params.lockMinutes} minutes` }],
    primaryCta: { label: 'Reset password', href: `${appUrl()}?view=auth&reset=1` },
    secondaryCta: { label: 'Contact support', href: appUrl('contact') },
  });
}

export function buildLoginNewDeviceEmail(params: {
  fullName: string;
  ipAddress?: string;
  userAgent?: string;
  signedInAt: string;
}): EmailPayload {
  const details = [
    { label: 'Time', value: params.signedInAt },
    ...(params.ipAddress ? [{ label: 'IP address', value: params.ipAddress }] : []),
    ...(params.userAgent ? [{ label: 'Device', value: params.userAgent.slice(0, 120) }] : []),
  ];
  return composeTransactionalEmail({
    subject: 'New sign-in to your Avenora account',
    category: 'login_new_device',
    eyebrow: 'Security alert',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'We noticed a sign-in to your Avenora account from a new device or location.',
      'If this was you, no action is needed. If not, change your password and contact support.',
    ],
    details,
    primaryCta: { label: 'Secure my account', href: portalUrl('profile') },
    secondaryCta: { label: 'Contact support', href: appUrl('contact') },
  });
}

export function buildLoginSuccessEmail(params: {
  fullName: string;
  ipAddress?: string;
  signedInAt: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Successful sign-in to Avenora',
    category: 'login_success',
    eyebrow: 'Security',
    heading: '',
    fullName: params.fullName,
    paragraphs: ['You successfully signed in to your Avenora account.'],
    details: [
      { label: 'Time', value: params.signedInAt },
      ...(params.ipAddress ? [{ label: 'IP address', value: params.ipAddress }] : []),
    ],
    primaryCta: { label: 'Open portal', href: portalUrl() },
    secondaryCta: { label: 'Review activity', href: portalUrl('profile') },
  });
}

export function buildMfaEnrolledEmail(params: { fullName: string }): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Authenticator app enabled on Avenora',
    category: 'mfa_enrolled',
    eyebrow: 'Security',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Two-factor authentication is now enabled on your Avenora account. Store your recovery codes in a safe place.',
    ],
    primaryCta: { label: 'View security settings', href: portalUrl('profile') },
  });
}

export function buildMfaDisabledEmail(params: { fullName: string }): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Authenticator app disabled on Avenora',
    category: 'mfa_disabled',
    eyebrow: 'Security alert',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Two-factor authentication was disabled on your Avenora account.',
      'If you did not make this change, secure your account immediately.',
    ],
    primaryCta: { label: 'Secure my account', href: portalUrl('profile') },
    secondaryCta: { label: 'Contact support', href: appUrl('contact') },
  });
}

export function buildAccountSuspendedEmail(params: {
  fullName: string;
  reason?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora account has been suspended',
    category: 'account_suspended',
    eyebrow: 'Account notice',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your Avenora account has been suspended. You can still sign in to view notices, but financial activity is restricted.',
      params.reason ? `Reason provided: ${params.reason}` : 'Please contact support for assistance.',
    ],
    primaryCta: { label: 'Contact support', href: appUrl('contact') },
    secondaryCta: { label: 'Open portal', href: portalUrl() },
  });
}

export function buildAccountLockedEmail(params: {
  fullName: string;
  reason?: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora account has been locked',
    category: 'account_locked',
    eyebrow: 'Account notice',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your Avenora account has been locked by our operations team. Access to the portal is restricted until the lock is lifted.',
      params.reason ? `Reason provided: ${params.reason}` : 'Please contact support for next steps.',
    ],
    primaryCta: { label: 'Contact support', href: appUrl('contact') },
  });
}

export function buildAccountRestoredEmail(params: { fullName: string }): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora account has been restored',
    category: 'account_restored',
    eyebrow: 'Account notice',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Good news — your Avenora account access has been restored. You can sign in and continue using your portal.',
    ],
    primaryCta: { label: 'Sign in to portal', href: portalUrl() },
  });
}

export function buildPendingVerificationEmail(params: { fullName: string }): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Complete verification to activate Avenora',
    category: 'pending_verification',
    eyebrow: 'Verification',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your account is pending identity verification. Complete KYC to unlock deposits, withdrawals, and full banking features.',
    ],
    primaryCta: { label: 'Complete verification', href: portalUrl('kyc') },
  });
}

export function buildRoleChangedEmail(params: {
  fullName: string;
  newRole: string;
}): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora access role was updated',
    category: 'role_changed',
    eyebrow: 'Account notice',
    heading: '',
    fullName: params.fullName,
    paragraphs: ['Your Avenora platform role has been updated.'],
    details: [{ label: 'New role', value: params.newRole }],
    primaryCta: { label: 'Open portal', href: portalUrl() },
  });
}

export function buildAccountDeletedEmail(params: { fullName: string }): EmailPayload {
  return composeTransactionalEmail({
    subject: 'Your Avenora account has been deleted',
    category: 'account_deleted',
    eyebrow: 'Account notice',
    heading: '',
    fullName: params.fullName,
    paragraphs: [
      'Your Avenora account has been permanently deleted as requested by our operations team.',
      'If you believe this was a mistake, contact support as soon as possible.',
    ],
    primaryCta: { label: 'Contact support', href: appUrl('contact') },
  });
}
