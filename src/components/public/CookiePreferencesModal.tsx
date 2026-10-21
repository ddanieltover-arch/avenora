/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Cookie Preferences Management (Phase 04)
 */

import React, { useState, useEffect } from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { Cookie, ShieldCheck, CheckCircle2, X, Lock } from 'lucide-react';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CookiePreferencesModal: React.FC<CookiePreferencesModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLocalization();

  const [functionalEnabled, setFunctionalEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('avenora_cookie_prefs');
      if (stored) {
        const parsed = JSON.parse(stored);
        setFunctionalEnabled(parsed.functional ?? true);
        setAnalyticsEnabled(parsed.analytics ?? false);
      }
    } catch {
      // Ignore in restricted storage environments
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      localStorage.setItem(
        'avenora_cookie_prefs',
        JSON.stringify({
          essential: true,
          functional: functionalEnabled,
          analytics: analyticsEnabled,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Ignore
    }
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  const handleAcceptAll = () => {
    setFunctionalEnabled(true);
    setAnalyticsEnabled(true);
    try {
      localStorage.setItem(
        'avenora_cookie_prefs',
        JSON.stringify({
          essential: true,
          functional: true,
          analytics: true,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Ignore
    }
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-preferences-title"
      className="fixed inset-0 z-50 flex modal-overlay-scroll justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="modal-panel-scroll bg-white rounded-3xl max-w-lg border border-slate-200 shadow-2xl text-[#0f1f1e] my-auto sm:my-0">
        {/* Header */}
        <div className="shrink-0 bg-[#003933] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Close cookie preferences modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Cookie className="w-5 h-5 text-[#C6A568]" />
            <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#C6A568]">
              Privacy & Consent
            </span>
          </div>
          <h2 id="cookie-preferences-title" className="text-xl font-serif font-bold">
            {t.legal.cookiesTitle}
          </h2>
          <p className="text-xs text-emerald-100/70 mt-1">
            Control which cookies and client storage mechanisms are active during your session.
          </p>
        </div>

        {/* Categories */}
        <div className="modal-panel-body p-6 space-y-5 text-xs">
          {savedNotice && (
            <div className="p-3 bg-brand-accent-light border border-brand-accent/30 rounded-xl flex items-center gap-2 text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Preferences saved successfully.</span>
            </div>
          )}

          {/* 1. Strictly Essential */}
          <div className="p-4 rounded-2xl bg-[#f8fbf9] border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-[#003933]">
                <Lock className="w-3.5 h-3.5 text-[#076c64]" />
                <span>Strictly Essential (Always Required)</span>
              </div>
              <span className="text-[10px] font-bold uppercase bg-emerald-100 text-[#076c64] px-2 py-0.5 rounded">
                Always Active
              </span>
            </div>
            <p className="text-[11px] text-[#5c6f6c] leading-relaxed">
              {t.legal.cookieEssential}. These cookies maintain your signed-in session and security tokens. They cannot be disabled.
            </p>
          </div>

          {/* 2. Functional Preferences */}
          <div className="p-4 rounded-2xl bg-[#f8fbf9] border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-[#003933]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#076c64]" />
                <span>Functional Preferences</span>
              </div>
              <input
                type="checkbox"
                checked={functionalEnabled}
                onChange={(e) => setFunctionalEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#076c64] rounded cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-[#5c6f6c] leading-relaxed">
              {t.legal.cookieFunctional}. Remembers your language preference and optional UI settings for a smoother experience.
            </p>
          </div>

          {/* 3. Performance & Telemetry */}
          <div className="p-4 rounded-2xl bg-[#f8fbf9] border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-[#003933]">
                <Cookie className="w-3.5 h-3.5 text-[#076c64]" />
                <span>Analytics & Performance</span>
              </div>
              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#076c64] rounded cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-[#5c6f6c] leading-relaxed">
              {t.legal.cookieAnalytics}. Avenora contains zero third-party advertising cookies or behavioural tracking scripts.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 bg-[#f8fbf9] p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 font-semibold text-[#003933] transition cursor-pointer"
          >
            {t.legal.savePreferences}
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#076c64] hover:bg-[#003933] text-white font-semibold transition cursor-pointer"
          >
            {t.legal.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
};
