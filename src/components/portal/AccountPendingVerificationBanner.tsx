/**
 * @license Apache-2.0
 * Notice for inactive accounts awaiting KYC completion / admin approval.
 */

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface AccountPendingVerificationBannerProps {
  kycStatus?: string;
  onOpenKyc?: () => void;
}

export const AccountPendingVerificationBanner: React.FC<AccountPendingVerificationBannerProps> = ({
  kycStatus,
  onOpenKyc,
}) => {
  const awaitingAdmin =
    kycStatus === 'SUBMITTED' || kycStatus === 'UNDER_REVIEW';
  const needsSubmission =
    !kycStatus ||
    kycStatus === 'NOT_STARTED' ||
    kycStatus === 'IN_PROGRESS' ||
    kycStatus === 'REJECTED' ||
    kycStatus === 'NEEDS_MORE_INFORMATION';

  return (
    <div
      className="sticky top-0 z-40 border-b-2 border-[#076c64] bg-gradient-to-r from-[#003933] via-[#076c64] to-[#0a857a] text-white shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="shrink-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30">
            <ShieldAlert className="w-5 h-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-bold tracking-wide uppercase">
              Account inactive — KYC required
            </p>
            <p className="text-xs sm:text-sm text-emerald-50 mt-0.5 leading-relaxed">
              {awaitingAdmin
                ? 'Your verification is with compliance. Deposits, withdrawals, and other transactions stay blocked until an administrator approves your KYC.'
                : needsSubmission
                  ? 'Complete identity verification so compliance can review your application. No transactions can be performed until KYC is approved.'
                  : 'This account cannot perform transactions until identity verification is approved by an administrator.'}
            </p>
          </div>
        </div>
        {onOpenKyc && needsSubmission && (
          <button
            type="button"
            onClick={onOpenKyc}
            className="inline-flex items-center justify-center shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#003933] shadow-md hover:bg-emerald-50 cursor-pointer"
          >
            Open KYC
          </button>
        )}
      </div>
    </div>
  );
};
