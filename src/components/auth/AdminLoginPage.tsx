/**
 * @license Apache-2.0
 * Dedicated /admin/login page — staff sign-in, MFA, forgot/reset password.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.tsx';
import { useLocalization } from '../LocalizationContext.tsx';
import {
  Mail,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';
import { AuthPageShell } from './AuthPageShell.tsx';
import {
  buildAdminLoginPath,
  buildAdminPath,
  navigateToPath,
} from '../../routing/appRoutes.ts';
import { AvenoraLogo } from '../branding/AvenoraLogo.tsx';

const STAFF_ROLES = new Set(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']);

type LoginMode = 'login' | 'forgot' | 'reset';

export const AdminLoginPage: React.FC = () => {
  const { user, token, loading: authLoading, login, requestPasswordReset, confirmPasswordReset } =
    useAuth();
  const { t } = useLocalization();

  const [mode, setMode] = useState<LoginMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [debugResetToken, setDebugResetToken] = useState<string | null>(null);

  const isStaff = Boolean(user?.role && STAFF_ROLES.has(user.role));

  useEffect(() => {
    if (authLoading) return;
    if (user && token && isStaff) {
      navigateToPath(buildAdminPath('overview'), { replace: true });
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [authLoading, user, token, isStaff]);

  const goPublic = () => {
    navigateToPath('/', { replace: false });
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const resetFeedback = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setRequiresMfa(false);
    setDebugResetToken(null);
    setTotpCode('');
  };

  const switchMode = (next: LoginMode) => {
    resetFeedback();
    setMode(next);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      // Ensure pathname stays on /admin/login so redirectToDashboard sends staff to /admin
      if (!window.location.pathname.startsWith(buildAdminLoginPath())) {
        navigateToPath(buildAdminLoginPath(), { replace: true });
      }
      const result = await login(email, password, totpCode || undefined);
      if (result.requiresMfa) {
        setRequiresMfa(true);
        setSuccessMessage('MFA Required: Enter your 6-digit TOTP authenticator code.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.');
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
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to dispatch reset instructions.');
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
      setTimeout(() => switchMode('login'), 1500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Password reset confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (user && token && isStaff)) {
    return (
      <div className="app-viewport-shell bg-brand-warm text-brand-dark font-sans flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-brand-muted">
          <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" />
          {user && isStaff ? 'Opening control center…' : 'Checking secure session…'}
        </div>
      </div>
    );
  }

  const title =
    mode === 'login'
      ? 'Admin & Ops sign in'
      : mode === 'forgot'
        ? t.auth.forgotPasswordTitle
        : t.auth.resetPasswordTitle;

  const subtitle =
    mode === 'login'
      ? 'Authenticate with a staff account to open the operations control center.'
      : mode === 'forgot'
        ? 'Receive recovery instructions for your staff profile.'
        : 'Set your new password to regain access.';

  return (
    <div className="app-viewport-shell bg-brand-warm text-brand-dark font-sans">
      <header className="shrink-0 bg-brand-deep border-b border-brand-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AvenoraLogo size="sm" className="rounded-lg bg-white/95 p-0.5 shadow-sm" />
            <div>
              <span className="font-serif font-bold text-sm tracking-tight text-white block">
                AVENORA ADMIN & OPS
              </span>
              <span className="text-[10px] text-emerald-300 font-medium leading-none inline-flex items-center gap-1">
                <Shield className="w-3 h-3" />
                STAFF ACCESS
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={goPublic}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-700/60 hover:bg-emerald-800/50 text-xs font-semibold text-emerald-100 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Public site
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <AuthPageShell title={title} subtitle={subtitle}>
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
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
                      onClick={() => switchMode('reset')}
                      className="mt-1.5 text-[#076c64] font-sans font-bold hover:underline block cursor-pointer"
                    >
                      Click here to proceed to Reset Form →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                    placeholder="admin@avenora.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-[#0f1f1e]">{t.auth.passwordLabel}</label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] text-[#076c64] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
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

              {requiresMfa && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <label className="block text-xs font-semibold text-amber-900">{t.auth.mfaCodeLabel}</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    inputMode="numeric"
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
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                <span>{t.auth.submitSignIn}</span>
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-[#5c6f6c] leading-relaxed">
                Enter your staff email to generate a single-use password reset token.
              </p>
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
                    placeholder="admin@avenora.com"
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
                onClick={() => switchMode('login')}
                className="w-full text-center text-xs text-[#076c64] font-semibold hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">Reset Token</label>
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
                  autoComplete="new-password"
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
                onClick={() => switchMode('login')}
                className="w-full text-center text-xs text-[#076c64] font-semibold hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </AuthPageShell>
      </div>
    </div>
  );
};
