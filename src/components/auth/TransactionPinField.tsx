/**
 * @license Apache-2.0
 * Shared 4-digit transaction PIN input (masked, numeric, show/hide).
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Hash } from 'lucide-react';

export interface TransactionPinFieldProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Light surfaces (auth/register) vs dark portal modals */
  tone?: 'light' | 'dark';
  className?: string;
}

export const TransactionPinField: React.FC<TransactionPinFieldProps> = ({
  id = 'transaction-pin',
  label = '4-Digit Transaction PIN',
  value,
  onChange,
  required = true,
  disabled = false,
  autoFocus = false,
  tone = 'light',
  className = '',
}) => {
  const [showPin, setShowPin] = useState(false);
  const isDark = tone === 'dark';

  return (
    <div className={className}>
      {label ? (
        <label
          htmlFor={id}
          className={
            isDark
              ? 'block text-slate-300 mb-1 text-xs font-semibold'
              : 'block text-xs font-semibold text-[#0f1f1e] mb-1'
          }
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <Hash
          className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}
          aria-hidden
        />
        <input
          id={id}
          type={showPin ? 'text' : 'password'}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          autoComplete="one-time-code"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          className={
            isDark
              ? 'w-full pl-9 pr-9 py-2 text-xs font-mono tracking-[0.35em] rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-[#076c64]/40 focus:border-[#076c64]'
              : 'w-full pl-9 pr-9 py-2 text-xs font-mono tracking-[0.35em] rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]'
          }
        />
        <button
          type="button"
          onClick={() => setShowPin((prev) => !prev)}
          disabled={disabled}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${
            isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
          }`}
          aria-label={showPin ? 'Hide transaction PIN' : 'Show transaction PIN'}
        >
          {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
