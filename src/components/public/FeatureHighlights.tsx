/**
 * @license Apache-2.0
 * Avenora — Product feature highlights (homepage)
 */

import React from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { Wallet, CreditCard, FileText, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

interface FeatureHighlightsProps {
  onNavigate: (view: string) => void;
  onOpenPortal: () => void;
}

export const FeatureHighlights: React.FC<FeatureHighlightsProps> = ({ onNavigate, onOpenPortal }) => {
  const { t } = useLocalization();

  const features = [
    {
      id: 'personal',
      title: t.features.walletsTitle,
      description: t.features.walletsDesc,
      icon: Wallet,
      ...t.home.featureCards.personal,
    },
    {
      id: 'cards',
      title: t.features.cardsTitle,
      description: t.features.cardsDesc,
      icon: CreditCard,
      ...t.home.featureCards.cards,
    },
    {
      id: 'loans',
      title: t.features.loansTitle,
      description: t.features.loansDesc,
      icon: FileText,
      ...t.home.featureCards.loans,
    },
    {
      id: 'grants',
      title: t.features.grantsTitle,
      description: t.features.grantsDesc,
      icon: Award,
      ...t.home.featureCards.grants,
    },
  ];

  return (
    <section className="py-20 bg-[#eef4f2] border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#076c64]">
            {t.home.featuresSectionKicker}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#003933]">{t.features.title}</h2>
          <p className="text-base text-[#5c6f6c]">{t.features.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-brand-accent-light text-[#076c64] flex items-center justify-center border border-brand-accent/20 group-hover:bg-[#076c64] group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-[#C6A568] tracking-wide">{feat.highlight}</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#003933] mb-2">{feat.title}</h3>
                    <p className="text-sm text-[#5c6f6c] leading-relaxed">{feat.description}</p>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-slate-100">
                    {feat.bullets.map((sub) => (
                      <li key={sub} className="flex items-center gap-2 text-xs text-[#0f1f1e]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#159d79] shrink-0" />
                        <span>{sub}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onNavigate(feat.id)}
                    className="text-xs font-semibold text-[#076c64] hover:text-[#003933] flex items-center gap-1.5 cursor-pointer group-hover:underline"
                  >
                    <span>{feat.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenPortal}
                    className="text-[11px] font-medium text-[#5c6f6c] hover:text-[#076c64] cursor-pointer"
                  >
                    {t.nav.onlineBanking}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
