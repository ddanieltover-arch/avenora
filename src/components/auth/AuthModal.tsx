/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Customer Authentication & Onboarding Modal (Phase 04)
 */

import React, { useMemo, useState } from 'react';
import { getCountrySelectOptions } from '../../config/countryOptions.ts';
import { useAuth } from '../AuthContext.tsx';
import { useLocalization } from '../LocalizationContext.tsx';
import { AvenoraLogo } from '../branding/AvenoraLogo.tsx';
import {
  Mail,
  KeyRound,
  User,
  Globe,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Phone,
  Hash,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    requestPasswordReset,
    confirmPasswordReset,
  } = useAuth();
  const { t, locale } = useLocalization();

  const countryOptions = useMemo(() => getCountrySelectOptions(locale), [locale]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [showTransactionPin, setShowTransactionPin] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Flow & error states
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [debugResetToken, setDebugResetToken] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const resetFormState = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setRequiresMfa(false);
    setDebugResetToken(null);
    setTotpCode('');
  };

  const handleTabChange = (tab: 'login' | 'register' | 'forgot' | 'reset') => {
    resetFormState();
    openAuthModal(tab);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const result = await login(email, password, totpCode || undefined);
      if (result.requiresMfa) {
        setRequiresMfa(true);
        setSuccessMessage('MFA Required: Enter your 6-digit TOTP authenticator code.');
      } else {
        closeAuthModal();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
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
      closeAuthModal();
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await requestPasswordReset(email);
      setSuccessMessage(res.message);
      if (res.debugToken) {
        setDebugResetToken(res.debugToken);
        setResetToken(res.debugToken);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      await confirmPasswordReset(resetToken, newPassword);
      setSuccessMessage('Password successfully updated! You can now sign in.');
      setTimeout(() => {
        handleTabChange('login');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex modal-overlay-scroll justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="modal-panel-scroll bg-white rounded-3xl max-w-md border border-slate-200 shadow-2xl relative my-auto sm:my-0">
        {/* Header Bar */}
        <div className="shrink-0 bg-[#003933] text-white p-6 relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <AvenoraLogo size="sm" className="rounded-lg bg-white p-0.5" />
            <span className="font-serif font-bold text-lg tracking-tight">AVENORA</span>
          </div>

          <h2 id="auth-modal-title" className="text-xl font-serif font-bold">
            {authModalTab === 'login' && t.auth.signInTitle}
            {authModalTab === 'register' && t.auth.registerTitle}
            {authModalTab === 'forgot' && t.auth.forgotPasswordTitle}
            {authModalTab === 'reset' && t.auth.resetPasswordTitle}
          </h2>
          <p className="text-xs text-emerald-100/70 mt-1">
            {authModalTab === 'login' && 'Access your multicurrency wallets, cards, and applications.'}
            {authModalTab === 'register' && 'Open your Avenora customer account.'}
            {authModalTab === 'forgot' && 'Receive recovery instructions for your profile.'}
            {authModalTab === 'reset' && 'Set your new password to regain access.'}
          </p>
        </div>

        {/* Tab Selector (for login/register) */}
        {(authModalTab === 'login' || authModalTab === 'register') && (
          <div className="shrink-0 flex border-b border-slate-200 bg-[#f8fbf9] text-xs font-semibold">
            <button
              onClick={() => handleTabChange('login')}
              className={`flex-1 py-3 text-center transition cursor-pointer ${
                authModalTab === 'login'
                  ? 'border-b-2 border-[#076c64] text-[#076c64] bg-white'
                  : 'text-[#5c6f6c] hover:text-[#003933]'
              }`}
            >
              {t.nav.signIn}
            </button>
            <button
              onClick={() => handleTabChange('register')}
              className={`flex-1 py-3 text-center transition cursor-pointer ${
                authModalTab === 'register'
                  ? 'border-b-2 border-[#076c64] text-[#076c64] bg-white'
                  : 'text-[#5c6f6c] hover:text-[#003933]'
              }`}
            >
              {t.nav.openAccount}
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-panel-body p-6 space-y-4">
          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-800">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              {authModalTab === 'login' && errorMessage.toLowerCase().includes('invalid') && (
                <div className="pl-6 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleTabChange('register')}
                    className="text-[#076c64] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Don't have an account? Open an account with this email →
                  </button>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-brand-accent-light border border-brand-accent/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span>{successMessage}</span>
                {debugResetToken && (
                  <div className="mt-2 p-2 bg-white rounded border border-emerald-300 font-mono text-[11px] break-all">
                    <span className="block text-[#5c6f6c] text-[10px] font-sans">Password reset token:</span>
                    {debugResetToken}
                    <button
                      type="button"
                      onClick={() => handleTabChange('reset')}
                      className="mt-1.5 text-[#076c64] font-sans font-bold hover:underline block"
                    >
                      Click here to proceed to Reset Form →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 1. Login Form */}
          {authModalTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">
                  {t.auth.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-[#0f1f1e]">
                    {t.auth.passwordLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTabChange('forgot')}
                    className="text-[11px] text-[#076c64] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* MFA Code if challenged */}
              {requiresMfa && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <label className="block text-xs font-semibold text-amber-900">
                    {t.auth.mfaCodeLabel}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.trim())}
                    placeholder="123456"
                    className="w-full px-3 py-2 text-center text-sm font-mono tracking-widest rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{t.auth.submitSignIn}</span>
              </button>
            </form>
          )}

          {/* 2. Registration Form */}
          {authModalTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">
                  {t.auth.fullNameLabel}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jordan Hayes"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">
                  {t.auth.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
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
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">
                  {t.auth.phoneLabel}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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

              <div>
                <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">
                  {t.auth.transactionPinLabel}
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showTransactionPin ? 'text' : 'password'}
                    required
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    value={transactionPin}
                    onChange={(e) => setTransactionPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full pl-9 pr-9 py-2 text-xs font-mono tracking-[0.35em] rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTransactionPin(!showTransactionPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showTransactionPin ? 'Hide transaction PIN' : 'Show transaction PIN'}
                  >
                    {showTransactionPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">
                  {t.auth.countryLabel}
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
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

              {/* Registration notice */}
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
            </form>
          )}

          {/* 3. Forgot Password Form */}
          {authModalTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-[#5c6f6c] leading-relaxed">
                Enter your registered customer email to generate a single-use password reset token.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">
                  {t.auth.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Request Reset Token</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className="w-full text-center text-xs text-[#076c64] font-semibold hover:underline"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* 4. Reset Password Confirm Form */}
          {authModalTab === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste 64-character token"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">
                  New Password (Min 8 Characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Confirm New Password</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className="w-full text-center text-xs text-[#076c64] font-semibold hover:underline"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
