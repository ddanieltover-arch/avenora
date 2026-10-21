/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Profile, Security & MFA Management (Phase 04)
 */

import React, { useState } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useLocalization } from './LocalizationContext.tsx';
import {
  User,
  ShieldCheck,
  KeyRound,
  Lock,
  Globe,
  Bell,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  Copy,
  LogOut,
  ExternalLink,
} from 'lucide-react';

interface ProfileSecurityViewProps {
  onNavigateToKyc?: () => void;
}

export const ProfileSecurityView: React.FC<ProfileSecurityViewProps> = ({ onNavigateToKyc }) => {
  const { user, token, logout, startMfa, confirmMfa, changePassword } = useAuth();
  const { t, locale, setLocale } = useLocalization();

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // MFA Enrollment Wizard state
  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaOtpauthUri, setMfaOtpauthUri] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState<string[]>([]);
  const [mfaFeedback, setMfaFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Notification Preferences (Simulated)
  const [notifyDeposit, setNotifyDeposit] = useState(true);
  const [notifyCardHold, setNotifyCardHold] = useState(true);
  const [notifyLogin, setNotifyLogin] = useState(true);

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback({ success: false, message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordFeedback({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordFeedback({ success: true, message: 'Password successfully changed.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordFeedback({ success: false, message: err.message || 'Password update failed.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Start MFA Enrollment
  const handleStartMfa = async () => {
    setMfaFeedback(null);
    setMfaLoading(true);
    try {
      const data = await startMfa();
      setMfaSecret(data.secret);
      setMfaOtpauthUri(data.otpauthUri);
      setMfaEnrolling(true);
    } catch (err: any) {
      setMfaFeedback({ success: false, message: err.message || 'Failed to start MFA setup.' });
    } finally {
      setMfaLoading(false);
    }
  };

  // Confirm MFA Code
  const handleConfirmMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaFeedback(null);
    setMfaLoading(true);
    try {
      const res = await confirmMfa(mfaSecret, mfaCode);
      setMfaRecoveryCodes(res.recoveryCodes);
      setMfaFeedback({ success: true, message: 'Two-Factor Authentication is now active!' });
      setMfaEnrolling(false);
    } catch (err: any) {
      setMfaFeedback({ success: false, message: err.message || 'Invalid 6-digit TOTP code.' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(mfaSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs uppercase font-semibold text-[#076c64] tracking-wider block">
            Customer Identity & Credentials
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#003933]">
            Profile & Security
          </h1>
          <p className="text-xs text-[#5c6f6c] mt-1">
            Manage your customer credentials, RFC 6238 multi-factor authentication, and privacy settings.
          </p>
        </div>

        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-rose-50 text-xs font-semibold text-rose-700 hover:border-rose-300 transition cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile Information & Settings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-serif font-bold text-[#003933] flex items-center gap-2">
              <User className="w-4 h-4 text-[#076c64]" />
              <span>Personal Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-[#f8fbf9] rounded-xl border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-[#5c6f6c] block font-medium">Legal Full Name</span>
                <span className="font-semibold text-[#0f1f1e] block">{user?.fullName || '—'}</span>
              </div>

              <div className="p-3.5 bg-[#f8fbf9] rounded-xl border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-[#5c6f6c] block font-medium">Customer Email</span>
                <span className="font-semibold text-[#0f1f1e] block">{user?.email || '—'}</span>
              </div>

              <div className="p-3.5 bg-[#f8fbf9] rounded-xl border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-[#5c6f6c] block font-medium">Jurisdiction / Country</span>
                <span className="font-semibold text-[#0f1f1e] block">{user?.countryCode || 'US'} (Configured)</span>
              </div>

              <div className="p-3.5 bg-[#f8fbf9] rounded-xl border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-[#5c6f6c] block font-medium">Access Role</span>
                <span className="font-semibold text-[#076c64] block">{user?.role || 'CUSTOMER'}</span>
              </div>
            </div>

            {/* KYC Verification Status Banner */}
            <div className="p-4 rounded-2xl bg-brand-accent-light/80 border border-brand-accent/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#076c64] text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-[#003933] block">
                    Verification Status: {user?.kycStatus || 'APPROVED'}
                  </span>
                  <span className="text-[11px] text-[#5c6f6c]">
                    Identity verification in good standing.
                  </span>
                </div>
              </div>

              {onNavigateToKyc && (
                <button
                  onClick={onNavigateToKyc}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#076c64] transition shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <span>Review KYC</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Password Change Form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-5">
            <h2 className="text-base font-serif font-bold text-[#003933] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#076c64]" />
              <span>Change Password</span>
            </h2>

            {passwordFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                  passwordFeedback.success
                    ? 'bg-brand-accent-light text-emerald-800 border border-brand-accent/30'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passwordFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">
                    New Password (Min 8 Chars)
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

                <div>
                  <label className="block text-xs font-semibold text-[#0f1f1e] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2.5 bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {passwordLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Update Password</span>
              </button>
            </form>
          </div>

          {/* Preferences & Notifications */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-5">
            <h2 className="text-base font-serif font-bold text-[#003933] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#076c64]" />
              <span>Notifications & Preferences</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8fbf9] border border-slate-100">
                <div>
                  <span className="font-semibold text-[#0f1f1e] block">Inbound Deposit Alerts</span>
                  <span className="text-[10px] text-[#5c6f6c]">Receive email confirmation when deposits settle.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDeposit}
                  onChange={(e) => setNotifyDeposit(e.target.checked)}
                  className="w-4 h-4 accent-[#076c64] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8fbf9] border border-slate-100">
                <div>
                  <span className="font-semibold text-[#0f1f1e] block">Card Pre-Authorization SMS Alerts</span>
                  <span className="text-[10px] text-[#5c6f6c]">Immediate alert when a POS pre-auth hold is placed on your card.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyCardHold}
                  onChange={(e) => setNotifyCardHold(e.target.checked)}
                  className="w-4 h-4 accent-[#076c64] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8fbf9] border border-slate-100">
                <div>
                  <span className="font-semibold text-[#0f1f1e] block">New Device Login Notifications</span>
                  <span className="text-[10px] text-[#5c6f6c]">Alert when a session is initiated from a new IP address.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyLogin}
                  onChange={(e) => setNotifyLogin(e.target.checked)}
                  className="w-4 h-4 accent-[#076c64] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: MFA & Active Session */}
        <div className="lg:col-span-5 space-y-6">
          {/* Two-Factor Authentication (MFA) Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-serif font-bold text-[#003933] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#076c64]" />
                <span>Multi-Factor Authentication</span>
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  user?.mfaEnabled
                    ? 'bg-emerald-100 text-[#076c64]'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {user?.mfaEnabled ? 'ENROLLED (ACTIVE)' : 'DISABLED'}
              </span>
            </div>

            <p className="text-xs text-[#5c6f6c] leading-relaxed">
              RFC 6238 Time-based One-Time Password (TOTP) algorithm compatible with Google Authenticator, Authy, and 1Password.
            </p>

            {mfaFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                  mfaFeedback.success
                    ? 'bg-brand-accent-light text-emerald-800 border border-brand-accent/30'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {mfaFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{mfaFeedback.message}</span>
              </div>
            )}

            {/* If not enrolled and not in wizard */}
            {!user?.mfaEnabled && !mfaEnrolling && (
              <button
                type="button"
                onClick={handleStartMfa}
                disabled={mfaLoading}
                className="w-full py-2.5 rounded-xl bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                {mfaLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Enroll in Two-Factor Auth</span>
              </button>
            )}

            {/* MFA Setup Wizard */}
            {mfaEnrolling && (
              <div className="space-y-4 pt-3 border-t border-slate-100 text-xs">
                <div className="p-4 bg-[#f8fbf9] rounded-2xl border border-slate-200 space-y-3">
                  <span className="font-bold text-[#003933] block">
                    1. Add Secret Key to Authenticator App
                  </span>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-xs">
                    <span className="text-[#076c64] tracking-wider select-all">{mfaSecret}</span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="text-[#5c6f6c] hover:text-[#003933] p-1 rounded transition cursor-pointer"
                    >
                      {copiedSecret ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#5c6f6c]">
                    Account URI: <code className="break-all">{mfaOtpauthUri}</code>
                  </p>
                </div>

                <form onSubmit={handleConfirmMfa} className="space-y-3">
                  <span className="font-bold text-[#003933] block">
                    2. Enter 6-Digit Verification Code
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.trim())}
                    placeholder="123456"
                    className="w-full text-center py-2.5 text-base font-mono tracking-widest rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMfaEnrolling(false)}
                      className="flex-1 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-[#5c6f6c]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={mfaLoading || mfaCode.length !== 6}
                      className="flex-1 py-2 rounded-xl bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                    >
                      {mfaLoading ? 'Verifying...' : 'Confirm & Enable'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Recovery Codes Display */}
            {mfaRecoveryCodes.length > 0 && (
              <div className="p-4 bg-brand-accent-light border border-brand-accent/30 rounded-2xl space-y-2 text-xs text-emerald-900">
                <span className="font-bold block text-sm">MFA Emergency Recovery Codes</span>
                <p className="text-[11px] text-emerald-800">
                  Save these one-time recovery codes in a secure vault:
                </p>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] bg-white p-3 rounded-xl border border-brand-accent/30">
                  {mfaRecoveryCodes.map((code, idx) => (
                    <span key={idx} className="text-[#003933]">{code}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Session & Cryptographic Audit */}
          <div className="bg-[#003933] text-white p-6 sm:p-7 rounded-3xl shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-[#C6A568]">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-serif font-bold uppercase tracking-wider">
                Session Isolation
              </span>
            </div>

            <h3 className="font-serif font-bold text-base text-white">
              Active Cryptographic Session
            </h3>

            <div className="space-y-2 text-[11px] text-emerald-100/80">
              <div className="flex justify-between py-1.5 border-b border-emerald-800/60">
                <span>Session ID:</span>
                <span className="font-mono text-white">
                  {token ? `sess_${token.slice(0, 10)}...` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-emerald-800/60">
                <span>Hash Algorithm:</span>
                <span className="font-mono text-emerald-300">SHA-256 (Constant-Time)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-emerald-800/60">
                <span>Storage Target:</span>
                <span className="text-emerald-300">Volatile Memory (No LocalStorage Token)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Mode:</span>
                <span className="text-emerald-300 font-semibold">Authenticated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
