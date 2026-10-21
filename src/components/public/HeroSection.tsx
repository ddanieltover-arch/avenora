/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Hero Section
 */

import React from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { WalletPreviewInteractive } from './WalletPreviewInteractive.tsx';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface HeroSectionProps {
  onOpenPortal: () => void;
  onNavigate: (view: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenPortal, onNavigate }) => {
  const { t } = useLocalization();

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 bg-[#f8fbf9]">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#159d79]/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            {/* Architectural Kicker (No Pill Badges) */}
            <div className="text-xs font-semibold uppercase tracking-wider text-[#076c64] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#159d79]" />
              <span>{t.hero.badge}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-extrabold text-[#003933] tracking-tight leading-[1.15]">
              {t.hero.headline}
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-[#5c6f6c] leading-relaxed max-w-2xl font-normal">
              {t.hero.subheadline}
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={onOpenPortal}
                className="bg-brand-gradient hover:brightness-95 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.hero.ctaPrimary}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('loans')}
                className="bg-white hover:bg-[#eef4f2] text-[#003933] border border-slate-300 font-semibold text-sm px-6 py-3.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.hero.ctaSecondary}</span>
              </button>
            </div>

            {/* Trust Metrics Bar */}
            <div className="pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="block font-serif text-2xl font-bold text-[#003933]">100%</span>
                <span className="text-xs font-medium text-[#0f1f1e] block">{t.hero.stats.zeroFloat}</span>
                <span className="text-[11px] text-[#5c6f6c] block">{t.hero.stats.zeroFloatSub}</span>
              </div>
              <div>
                <span className="block font-serif text-2xl font-bold text-[#003933]">4 Global</span>
                <span className="text-xs font-medium text-[#0f1f1e] block">{t.hero.stats.currencies}</span>
                <span className="text-[11px] text-[#5c6f6c] block">{t.hero.stats.currenciesSub}</span>
              </div>
              <div>
                <span className="block font-serif text-2xl font-bold text-[#003933]">2-Step</span>
                <span className="text-xs font-medium text-[#0f1f1e] block">{t.hero.stats.holds}</span>
                <span className="text-[11px] text-[#5c6f6c] block">{t.hero.stats.holdsSub}</span>
              </div>
              <div>
                <span className="block font-serif text-2xl font-bold text-[#003933]">Balanced</span>
                <span className="text-xs font-medium text-[#0f1f1e] block">{t.hero.stats.ledger}</span>
                <span className="text-[11px] text-[#5c6f6c] block">{t.hero.stats.ledgerSub}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Financial Cockpit Preview */}
          <div className="lg:col-span-5">
            <WalletPreviewInteractive />
          </div>
        </div>
      </div>
    </section>
  );
};
