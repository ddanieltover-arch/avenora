/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Public Website Footer
 */

import React from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { Lock } from 'lucide-react';
import { AvenoraLogo } from '../branding/AvenoraLogo.tsx';

interface PublicFooterProps {
  onNavigate: (view: string) => void;
  onOpenPortal: () => void;
  onOpenCookies?: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onNavigate, onOpenPortal, onOpenCookies }) => {
  const { t } = useLocalization();
  const f = t.home.footer;

  const linkClass = 'hover:text-white transition cursor-pointer text-left';

  return (
    <footer className="bg-[#003933] text-slate-300 pt-16 pb-12 border-t border-[#076c64]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <AvenoraLogo size="sm" className="rounded-xl bg-white/95 p-0.5" />
              <span className="font-serif font-bold text-xl tracking-tight text-white">AVENORA</span>
            </div>
            <p className="text-xs text-emerald-100/70 max-w-sm leading-relaxed">{f.brandBlurb}</p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-300/80">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{f.statusLine}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C6A568]">{f.financialServices}</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => onNavigate('personal')} className={linkClass}>
                  {t.nav.personal}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('business')} className={linkClass}>
                  {t.nav.business}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('cards')} className={linkClass}>
                  {t.nav.cards}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('loans')} className={linkClass}>
                  {t.nav.loans}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('grants')} className={linkClass}>
                  {t.nav.grants}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('rates')} className={linkClass}>
                  {t.nav.rates}
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C6A568]">{f.memberServices}</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={onOpenPortal} className={linkClass}>
                  {f.onlineBanking}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('mobile')} className={linkClass}>
                  {f.mobileApp}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('security')} className={linkClass}>
                  {f.securityCenter}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('help')} className={linkClass}>
                  {t.nav.help}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('contact')} className={linkClass}>
                  {t.nav.contact}
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C6A568]">{f.aboutUs}</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => onNavigate('about')} className={linkClass}>
                  {t.nav.about}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('privacy')} className={linkClass}>
                  {t.legal.privacyTitle.replace(' (Draft)', '').replace(' (Borrador)', '')}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('terms')} className={linkClass}>
                  {f.termsLink}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-emerald-900/50 space-y-3 text-[11px] text-emerald-100/60">
          <p>{t.bankingDisclaimer}</p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-emerald-900/30 text-emerald-100/40">
            <p>{f.copyright}</p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <button type="button" onClick={() => onNavigate('privacy')} className="hover:text-emerald-300 transition cursor-pointer">
                Privacy Policy
              </button>
              <span>·</span>
              <button type="button" onClick={() => onNavigate('terms')} className="hover:text-emerald-300 transition cursor-pointer">
                {f.termsLink}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={onOpenCookies}
                className="hover:text-emerald-300 transition cursor-pointer"
              >
                Cookie Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
