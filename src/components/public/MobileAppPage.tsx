/**
 * @license Apache-2.0
 * Avenora — Mobile & web banking app
 */

import React from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { PublicPageHero } from './PublicPageHero.tsx';
import { Smartphone, Zap, Bell, ShieldCheck, ArrowRight } from 'lucide-react';

interface MobileAppPageProps {
  onOpenPortal: () => void;
}

const featureIcons = [Smartphone, Zap, Bell, ShieldCheck];

export const MobileAppPage: React.FC<MobileAppPageProps> = ({ onOpenPortal }) => {
  const { t } = useLocalization();
  const p = t.mobilePage;

  return (
    <div className="bg-[#f8fbf9] text-[#0f1f1e]">
      <PublicPageHero kicker={p.kicker} title={p.title} subtitle={p.subtitle} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <ul className="space-y-5">
              {p.features.map((feature, index) => {
                const Icon = featureIcons[index % featureIcons.length];
                return (
                  <li key={feature.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-accent-light text-[#076c64] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-base font-serif font-bold text-[#003933]">{feature.title}</h3>
                      <p className="text-sm text-[#5c6f6c] mt-1 leading-relaxed">{feature.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenPortal}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-gradient text-white text-sm font-semibold shadow-sm transition cursor-pointer"
              >
                {p.bankingCta}
                <ArrowRight className="w-4 h-4" aria-hidden />
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[#076c64]/40 text-[#076c64] text-sm font-semibold hover:bg-white transition"
              >
                {p.installCta}
              </a>
            </div>

            <p className="text-xs text-[#5c6f6c]">{p.browserNote}</p>
          </div>

          <div
            className="rounded-3xl border border-slate-200/80 bg-[#003933] text-white p-8 shadow-xl min-h-[320px] flex flex-col justify-between"
            aria-hidden
          >
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-emerald-200/80">{p.previewLabel}</p>
              <p className="text-2xl font-serif font-bold">{p.previewBalance}</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-emerald-800/50">
                <span className="text-emerald-100/70">{p.previewTransfer}</span>
                <span className="font-medium">—</span>
              </div>
              <div className="flex justify-between py-2 border-b border-emerald-800/50">
                <span className="text-emerald-100/70">{p.previewBills}</span>
                <span className="font-medium">—</span>
              </div>
            </div>
            <p className="text-[11px] text-emerald-200/60">{p.previewDisclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
