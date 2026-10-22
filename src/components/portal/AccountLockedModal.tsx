/**
 * @license Apache-2.0
 * Full-screen lockout modal for LOCKED accounts (multiple suspensions).
 */

import React, { useEffect } from 'react';
import { Lock, Mail, LogOut, ShieldAlert } from 'lucide-react';

const SUPPORT_EMAIL = 'support@avenorabank.com';

interface AccountLockedModalProps {
  onLogout: () => void | Promise<void>;
}

export const AccountLockedModal: React.FC<AccountLockedModalProps> = ({ onLogout }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="account-locked-title"
      aria-describedby="account-locked-desc"
    >
      <div
        className="absolute inset-0 bg-[#0a1210]/90 backdrop-blur-md"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 20%, rgba(220,38,38,0.35), transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(127,29,29,0.4), transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-red-500/40 bg-gradient-to-b from-[#1a0a0a] via-[#120808] to-[#0c0606] shadow-[0_0_80px_rgba(220,38,38,0.35)] animate-[lockedPulse_2.4s_ease-in-out_infinite]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" aria-hidden />

        <div className="px-6 sm:px-8 pt-8 pb-7 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-600/20 ring-4 ring-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.45)]">
            <Lock className="w-10 h-10 text-red-400" aria-hidden />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/50 bg-red-950/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300 mb-3">
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden />
            Security lockout
          </div>

          <h2 id="account-locked-title" className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Your account has been locked
          </h2>
          <p id="account-locked-desc" className="mt-3 text-sm sm:text-base text-red-100/85 leading-relaxed">
            This lockout was applied after <strong className="text-white">multiple account suspensions</strong>.
            All banking activity is blocked. Sign-in remains available only so you can review this notice and contact
            support.
          </p>

          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-left">
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-300/90">What you can do</p>
            <ul className="mt-2 space-y-1.5 text-xs text-red-100/80 list-disc list-inside">
              <li>Contact customer service to appeal or resolve the hold</li>
              <li>Sign out of this device securely</li>
              <li>Deposits, withdrawals, and transfers cannot proceed while locked</li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Account%20lockout%20-%20multiple%20suspensions`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/40"
            >
              <Mail className="w-4 h-4" aria-hidden />
              Email {SUPPORT_EMAIL}
            </a>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-5 py-3 text-sm font-bold text-white cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lockedPulse {
          0%, 100% { box-shadow: 0 0 60px rgba(220, 38, 38, 0.28); transform: scale(1); }
          50% { box-shadow: 0 0 90px rgba(239, 68, 68, 0.45); transform: scale(1.01); }
        }
      `}</style>
    </div>
  );
};
