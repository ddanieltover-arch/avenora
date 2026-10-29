/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Public Website Navigation (banking-standard layout)
 */

import React, { useEffect, useRef, useState } from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { useAuth } from '../AuthContext.tsx';
import {
  Globe,
  User,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { buildPortalPath, buildPublicPath, isPublicViewId } from '../../routing/appRoutes.ts';
import { AvenoraHeaderLogo } from '../branding/AvenoraLogo.tsx';
import { NewsBroadcastTicker } from './NewsBroadcastTicker.tsx';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenPortal: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenPortal, onOpenAdmin }) => {
  const { locale, setLocale, t } = useLocalization();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const primaryNavLinks = [
    { id: 'personal', label: t.nav.personal },
    { id: 'business', label: t.nav.business },
    { id: 'cards', label: t.nav.cards },
    { id: 'loans', label: t.nav.loans },
    { id: 'grants', label: t.nav.grants },
    { id: 'about', label: t.nav.about },
    { id: 'contact', label: t.nav.contact },
  ];

  const navigate = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const openOnlineBanking = () => {
    setMobileMenuOpen(false);
    setShowAccountMenu(false);
    if (user) {
      onOpenPortal();
      return;
    }
    navigate('login');
  };

  const publicHref = (view: string) =>
    isPublicViewId(view) ? buildPublicPath(view) : '/';

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const localeButtons = (
    <>
      {(['en', 'es', 'pt-BR'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`px-2 py-0.5 rounded font-medium transition ${
            locale === code ? 'bg-[#076c64] text-white' : 'text-[#5c6f6c] hover:text-[#0f1f1e]'
          }`}
        >
          {code === 'pt-BR' ? 'PT' : code.toUpperCase()}
        </button>
      ))}
    </>
  );

  return (
    <header ref={navRef} className="sticky top-0 z-50 bg-white border-b border-slate-200/90 text-[#0f1f1e] shadow-sm">
      <NewsBroadcastTicker />

      {/* Utility bar */}
      <div className="hidden md:block border-b border-slate-100 bg-[#f8fbf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between text-xs text-[#5c6f6c]">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => navigate('help')}
              className="inline-flex items-center gap-1.5 hover:text-[#076c64] transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {t.nav.help}
            </button>
            <button
              type="button"
              onClick={() => navigate('contact')}
              className="hover:text-[#076c64] transition"
            >
              {t.nav.contact}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" aria-hidden />
            <div className="flex items-center gap-0.5">{localeButtons}</div>
          </div>
        </div>
      </div>

      {/* Primary bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[4.25rem] flex items-center justify-between gap-4">
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              navigate('home');
            }}
            className="flex items-center gap-3 text-left group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#076c64]/40 rounded-lg"
          >
            <AvenoraHeaderLogo />
            <span className="hidden sm:block font-serif font-bold text-lg tracking-tight text-[#003933] leading-tight">
              AVENORA
            </span>
          </a>

          {/* Desktop primary navigation */}
          <nav
            className="hidden xl:flex items-center gap-1 flex-1 justify-center"
            aria-label="Primary"
          >
            {primaryNavLinks.map((link) => (
              <a
                key={link.id}
                href={publicHref(link.id)}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(link.id);
                }}
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md transition ${
                  currentView === link.id
                    ? 'text-[#076c64] bg-[#076c64]/8'
                    : 'text-[#0f1f1e] hover:text-[#076c64] hover:bg-[#eef4f2]/80'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {!user && (
              <>
                <a
                  href={buildPublicPath('login')}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate('login');
                  }}
                  className="px-3 py-2 text-sm font-semibold text-[#003933] hover:bg-slate-100 rounded-lg transition"
                >
                  {t.nav.signIn}
                </a>
                <a
                  href={buildPublicPath('register')}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate('register');
                  }}
                  className="px-3 py-2 text-sm font-semibold text-[#003933] bg-[#C6A568] hover:bg-[#b89558] rounded-lg transition shadow-xs"
                >
                  {t.nav.openAccount}
                </a>
              </>
            )}
            <a
              href={user ? buildPortalPath('overview') : buildPublicPath('login')}
              onClick={(event) => {
                event.preventDefault();
                openOnlineBanking();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-gradient hover:brightness-95 rounded-lg transition shadow-sm"
            >
              {t.nav.onlineBanking}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </a>

            {user && (
              <div className="relative ml-1 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#eef4f2] text-xs transition"
                  aria-expanded={showAccountMenu}
                >
                  <User className="w-4 h-4 text-[#076c64]" />
                  <span className="font-medium max-w-[7rem] truncate hidden xl:inline">
                    {user.fullName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5c6f6c]" />
                </button>
                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 text-xs">
                    <p className="px-2 py-1.5 border-b border-slate-100 mb-1">
                      <span className="font-semibold text-[#003933] block truncate">{user.fullName}</span>
                      <span className="text-[10px] text-[#5c6f6c] truncate block">{user.email}</span>
                    </p>
                    {onOpenAdmin &&
                      ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenAdmin();
                            setShowAccountMenu(false);
                          }}
                          className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#003933] text-[#C6A568] font-semibold"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Admin & Ops
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowAccountMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-50 text-rose-700 font-semibold mt-1"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={openOnlineBanking}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#076c64] rounded-lg"
            >
              {t.nav.onlineBanking}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#0f1f1e] hover:bg-[#eef4f2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#076c64]/40"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 max-h-[calc(100dvh-8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto overscroll-y-contain">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c6f6c] mb-2">
            {t.nav.explore}
          </p>
          <div className="space-y-1">
            {primaryNavLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => navigate(link.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentView === link.id
                    ? 'bg-[#076c64]/10 text-[#076c64]'
                    : 'text-[#0f1f1e] hover:bg-[#eef4f2]'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate('help')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                currentView === 'help'
                  ? 'bg-[#076c64]/10 text-[#076c64]'
                  : 'text-[#0f1f1e] hover:bg-[#eef4f2]'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              {t.nav.help}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#5c6f6c] font-medium">Language</span>
              <div className="flex items-center gap-0.5 bg-[#eef4f2] p-1 rounded-lg text-xs">
                {localeButtons}
              </div>
            </div>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-lg border border-rose-200 text-sm font-semibold text-rose-700"
              >
                Sign out ({user.fullName})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={buildPublicPath('login')}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate('login');
                  }}
                  className="py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-[#003933] text-center"
                >
                  {t.nav.signIn}
                </a>
                <a
                  href={buildPublicPath('register')}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate('register');
                  }}
                  className="py-2.5 rounded-lg bg-[#C6A568] text-sm font-semibold text-[#003933] text-center"
                >
                  {t.nav.openAccount}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
