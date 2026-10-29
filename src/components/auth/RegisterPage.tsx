/**
 * @license Apache-2.0
 * Dedicated /register page — open a new Avenora customer account.
 */

import React, { useMemo, useState } from 'react';
import { getCountrySelectOptions } from '../../config/countryOptions.ts';
import { useAuth } from '../AuthContext.tsx';
import { useLocalization } from '../LocalizationContext.tsx';
import {
  Mail,
  KeyRound,
  User,
  Globe,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Phone,
} from 'lucide-react';
import { TransactionPinField } from './TransactionPinField.tsx';
import { AuthPageShell } from './AuthPageShell.tsx';

interface RegisterPageProps {
  onNavigate: (view: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const { t, locale } = useLocalization();
  const countryOptions = useMemo(() => getCountrySelectOptions(locale), [locale]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      setErrorMessage('Enter a valid phone number (7–15 digits).');
      setLoading(false);
      return;
    }

    if (!/^\d{4}$/.test(transactionPin)) {
      setErrorMessage('Transaction PIN must be exactly 4 digits.');
      setLoading(false);
      return;
    }

    try {
      await register(email, password, fullName, phoneNumber, transactionPin, countryCode);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      title={t.auth.registerTitle}
      subtitle="Open your Avenora customer account."
    >
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">{t.auth.fullNameLabel}</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
            <input
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jordan Hayes"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">{t.auth.emailLabel}</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan.hayes@example.com"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">
            {t.auth.passwordLabel} (Min 8 Characters)
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">{t.auth.phoneLabel}</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
            <input
              type="tel"
              required
              inputMode="tel"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (202) 555-0100"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
            />
          </div>
        </div>

        <TransactionPinField
          label={t.auth.transactionPinLabel}
          value={transactionPin}
          onChange={setTransactionPin}
          tone="light"
        />

        <div>
          <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">{t.auth.countryLabel}</label>
          <div className="relative">
            <Globe
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
              aria-hidden
            />
            <select
              required
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
            >
              {countryOptions.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-[11px] text-[#5c6f6c] leading-relaxed bg-[#f8fbf9] p-2.5 rounded-xl border border-slate-200">
          {t.auth.prototypeDisclaimer}
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{t.auth.submitRegister}</span>
        </button>

        <p className="text-center text-xs text-[#5c6f6c]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-[#076c64] font-semibold hover:underline cursor-pointer"
          >
            {t.nav.signIn}
          </button>
        </p>
      </form>
    </AuthPageShell>
  );
};
