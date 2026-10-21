/**
 * @license Apache-2.0
 * Avenora — Business Banking
 */

import React from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { PublicPageHero } from './PublicPageHero.tsx';
import { Building2, Globe2, Users, LineChart, ArrowRight } from 'lucide-react';

interface BusinessBankingPageProps {
  onOpenPortal: () => void;
}

const pillarIcons = [Building2, Globe2, Users, LineChart];

export const BusinessBankingPage: React.FC<BusinessBankingPageProps> = ({ onOpenPortal }) => {
  const { t } = useLocalization();
  const p = t.businessPage;

  return (
    <div className="bg-[#f8fbf9] text-[#0f1f1e]">
      <PublicPageHero kicker={p.kicker} title={p.title} subtitle={p.subtitle} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#003933]">{p.pillarsTitle}</h2>
          <p className="text-sm text-[#5c6f6c] leading-relaxed">{p.pillarsIntro}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {p.pillars.map((pillar, index) => {
            const Icon = pillarIcons[index % pillarIcons.length];
            return (
              <article
                key={pillar.title}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-3"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-accent-light text-[#076c64] flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#003933]">{pillar.title}</h3>
                <p className="text-sm text-[#5c6f6c] leading-relaxed">{pillar.desc}</p>
              </article>
            );
          })}
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={onOpenPortal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#076c64] hover:bg-[#003933] text-white text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            {p.cta}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
};
