/**
 * @license Apache-2.0
 * Final confirmation popup: enter 4-digit PIN before executing a money movement.
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, X } from 'lucide-react';
import { TransactionPinField } from './TransactionPinField.tsx';

export interface TransactionPinConfirmModalProps {
  title?: string;
  description?: string;
  confirmLabel?: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onConfirm: (pin: string) => void | Promise<void>;
  onCancel: () => void;
}

export const TransactionPinConfirmModal: React.FC<TransactionPinConfirmModalProps> = ({
  title = 'Confirm with transaction PIN',
  description = 'Enter your 4-digit transaction PIN to authorize this transaction.',
  confirmLabel = 'Confirm transaction',
  submitting = false,
  errorMessage = null,
  onConfirm,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    setLocalError(null);
  }, [errorMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!/^\d{4}$/.test(pin)) {
      setLocalError('Enter your 4-digit transaction PIN.');
      return;
    }
    await onConfirm(pin);
  };

  const displayError = localError || errorMessage;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-pin-confirm-title"
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0c1816] shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h3
            id="tx-pin-confirm-title"
            className="text-sm font-bold text-white flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#19A77A]" aria-hidden />
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="text-slate-400 hover:text-white cursor-pointer"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">{description}</p>

          <TransactionPinField
            tone="dark"
            value={pin}
            onChange={setPin}
            disabled={submitting}
            autoFocus
          />

          {displayError && (
            <p className="text-xs font-medium text-red-300" role="alert">
              {displayError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || pin.length !== 4}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#076c64] hover:bg-[#0a857c] disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
            >
              {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden /> : null}
              {submitting ? 'Authorizing…' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
