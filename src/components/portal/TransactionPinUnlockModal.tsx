/**
 * @license Apache-2.0
 * Blocking post-login modal: enter 4-digit transaction PIN before using the portal.
 */

import React, { useEffect, useState } from 'react';
import { KeyRound, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { TransactionPinField } from '../auth/TransactionPinField.tsx';
import { useAuth } from '../AuthContext.tsx';

export const TransactionPinUnlockModal: React.FC = () => {
  const { verifyTransactionPin, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage('Enter your 4-digit transaction PIN.');
      return;
    }
    setLoading(true);
    try {
      await verifyTransactionPin(pin);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'PIN verification failed.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-pin-unlock-title"
      aria-describedby="transaction-pin-unlock-desc"
    >
      <div
        className="absolute inset-0 bg-[#0a1210]/85 backdrop-blur-md"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 25% 15%, rgba(7,108,100,0.35), transparent 45%), radial-gradient(ellipse at 80% 85%, rgba(6,61,50,0.45), transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#076c64]/40 bg-gradient-to-b from-[#0f1f1e] via-[#0c1816] to-[#081210] shadow-[0_0_80px_rgba(7,108,100,0.28)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#19A77A] to-transparent" aria-hidden />

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 pt-8 pb-7">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#076c64]/20 ring-4 ring-[#076c64]/35">
            <KeyRound className="w-8 h-8 text-[#19A77A]" aria-hidden />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#076c64]/50 bg-[#063D32]/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#19A77A] mb-3">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
            Security check
          </div>

          <h2
            id="transaction-pin-unlock-title"
            className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight"
          >
            Enter your transaction PIN
          </h2>
          <p id="transaction-pin-unlock-desc" className="mt-2 text-sm text-emerald-100/80 leading-relaxed">
            For your security, confirm your 4-digit transaction PIN before accessing your account.
          </p>

          <div className="mt-6 text-left">
            <TransactionPinField
              tone="dark"
              value={pin}
              onChange={setPin}
              disabled={loading}
              autoFocus
              label="4-Digit Transaction PIN"
            />
          </div>

          {errorMessage && (
            <p className="mt-3 text-xs font-medium text-red-300" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#076c64] hover:bg-[#0a857c] disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#063D32]/40 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden /> : null}
              {loading ? 'Verifying…' : 'Unlock account'}
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-3 text-sm font-bold text-white cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden />
              Sign out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
