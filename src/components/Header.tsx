/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Header Component
 */

import React, { useState } from 'react';
import { useLocalization } from './LocalizationContext.tsx';
import { useAuth } from './AuthContext.tsx';
import { AlertTriangle, Globe, Lock, User, LogOut, ShieldAlert, ChevronDown } from 'lucide-react';
import { AvenoraLogo } from './branding/AvenoraLogo.tsx';

export const Header: React.FC = () => {
  const { locale, setLocale, t } = useLocalization();
  const { user, logout } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      {/* Top Banner: Regulatory & Security Boundary Notice */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-300 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-medium truncate">{t.bankingDisclaimer}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <AvenoraLogo size="md" className="rounded-xl bg-white/10 p-1 shadow-lg shadow-cyan-950/50 border border-cyan-400/30" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg tracking-tight">AVENORA</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
                {t.phaseBadge}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">{t.appSubtitle}</p>
          </div>
        </div>

        {/* User Session, Persona Switcher & Language Selector */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium truncate max-w-[120px] sm:max-w-[160px]">{user.fullName}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                  {user.role}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-xs">
                  <p className="px-2 py-1.5 border-b border-slate-800 mb-1 text-slate-300 truncate">{user.email}</p>
                  <button
                    onClick={() => {
                      logout();
                      setShowPersonaMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-950/40 text-rose-300 flex items-center gap-1.5"
                  >
                    <LogOut className="w-3 h-3" /> Logout Session
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure session</span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setLocale('en')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                locale === 'en' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale('es')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                locale === 'es' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setLocale('pt-BR')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                locale === 'pt-BR' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              PT
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
