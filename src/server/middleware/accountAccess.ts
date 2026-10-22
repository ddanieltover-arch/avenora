/**
 * @license Apache-2.0
 * Account status gates: PENDING_VERIFICATION / SUSPENDED / LOCKED freeze financial
 * actions without blocking auth. Customers remain inactive until KYC is admin-approved.
 */

import { Request, Response, NextFunction } from 'express';
import { isKycBypassEnabled } from '../../config/prototypeAccess.ts';

const SUPPORT_EMAIL = 'support@avenorabank.com';

/**
 * Blocks deposits, withdrawals, transfers, FX, cards, loans, grants, and similar
 * mutating operations when the account is inactive (pending KYC), SUSPENDED, or LOCKED.
 * Login, logout, KYC submission, and read-only portfolio views remain available.
 */
export function requireTransactionEligible(req: Request, res: Response, next: NextFunction): void {
  const status = req.user?.status;
  const role = req.user?.role;
  const kycStatus = req.user?.kycStatus;

  if (status === 'SUSPENDED') {
    res.status(403).json({
      type: 'https://avenora.com/errors/account-suspended',
      title: 'Account Suspended',
      status: 403,
      code: 'ACCOUNT_SUSPENDED',
      detail:
        'Your account is under a temporary operational hold. All transactions are frozen. You may still sign in and browse your account. Contact customer service at support@avenorabank.com.',
      supportEmail: SUPPORT_EMAIL,
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (status === 'LOCKED') {
    res.status(403).json({
      type: 'https://avenora.com/errors/account-locked',
      title: 'Account Locked',
      status: 403,
      code: 'ACCOUNT_LOCKED',
      detail:
        'Your account has been locked due to multiple suspensions. All activity is blocked. Contact customer service at support@avenorabank.com.',
      supportEmail: SUPPORT_EMAIL,
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (status === 'PENDING_VERIFICATION') {
    res.status(403).json({
      type: 'https://avenora.com/errors/account-pending-verification',
      title: 'Account Inactive — KYC Required',
      status: 403,
      code: 'ACCOUNT_PENDING_VERIFICATION',
      detail:
        'Your account is inactive until identity verification (KYC) is approved by compliance. You may sign in and complete or update your KYC application, but no transactions can be performed until an administrator approves verification.',
      supportEmail: SUPPORT_EMAIL,
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Defense in depth: customers without admin-approved KYC cannot transact
  // even if account status was manually set to ACTIVE.
  if (
    role === 'CUSTOMER' &&
    kycStatus !== 'APPROVED' &&
    !isKycBypassEnabled()
  ) {
    res.status(403).json({
      type: 'https://avenora.com/errors/account-pending-verification',
      title: 'Account Inactive — KYC Required',
      status: 403,
      code: 'ACCOUNT_PENDING_VERIFICATION',
      detail:
        'Your account is inactive until identity verification (KYC) is approved by compliance. Complete KYC and wait for administrator approval before performing transactions.',
      supportEmail: SUPPORT_EMAIL,
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
}
