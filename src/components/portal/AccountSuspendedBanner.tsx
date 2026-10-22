/**
 * @license Apache-2.0
 * Highly visible operational-hold notice for SUSPENDED accounts.
 */

import React from 'react';
import { Mail, Snowflake } from 'lucide-react';

const SUPPORT_EMAIL = 'support@avenorabank.com';

export const AccountSuspendedBanner: React.FC = () => {
  return (
    <div
      className="sticky top-0 z-40 border-b-2 border-amber-500 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="shrink-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/40">
            <Snowflake className="w-5 h-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-bold tracking-wide uppercase">
              Account suspended — transactions frozen
            </p>
            <p className="text-xs sm:text-sm text-amber-50 mt-0.5 leading-relaxed">
              Your account is on a temporary operational hold. You can still sign in, browse balances, and sign out,
              but deposits, withdrawals, transfers, FX, cards, loans, and grants are blocked until the hold is lifted.
            </p>
          </div>
        </div>
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=Account%20suspension%20support`}
          className="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-amber-900 shadow-md hover:bg-amber-50"
        >
          <Mail className="w-4 h-4" aria-hidden />
          Email {SUPPORT_EMAIL}
        </a>
      </div>
    </div>
  );
};
