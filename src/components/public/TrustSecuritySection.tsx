/**
 * @license Apache-2.0
 * Avenora — Trust & security (public homepage)
 */

import React from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { ShieldCheck, Lock, Scale, AlertTriangle } from 'lucide-react';

export const TrustSecuritySection: React.FC = () => {
  const { t } = useLocalization();
  const copy = t.home.trust;

  return (
    <section className="py-20 bg-[#f8fbf9] text-[#0f1f1e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#076c64]">
            {copy.sectionKicker}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#003933]">{copy.title}</h2>
          <p className="text-base text-[#5c6f6c]">{copy.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-accent-light text-[#076c64] flex items-center justify-center border border-brand-accent/20">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#003933]">{copy.pillar1Title}</h3>
            <p className="text-xs text-[#5c6f6c] leading-relaxed">{copy.pillar1Body}</p>
            <div className="text-[11px] font-medium text-[#076c64] bg-brand-accent-light/60 p-2.5 rounded-xl border border-brand-accent/20">
              {copy.pillar1Code}
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#003933]">{copy.pillar2Title}</h3>
            <p className="text-xs text-[#5c6f6c] leading-relaxed">{copy.pillar2Body}</p>
            <div className="text-[11px] font-medium text-amber-900 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
              {copy.pillar2Code}
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-800 flex items-center justify-center border border-indigo-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#003933]">{copy.pillar3Title}</h3>
            <p className="text-xs text-[#5c6f6c] leading-relaxed">{copy.pillar3Body}</p>
            <div className="text-[11px] font-medium text-indigo-900 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
              {copy.pillar3Code}
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#003933] text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#C6A568]" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[#f8fbf9]">{copy.disclosureTitle}</h4>
              <p className="text-xs text-emerald-100/80 mt-0.5 max-w-3xl">{copy.disclosureBody}</p>
            </div>
          </div>
          <div className="shrink-0 text-xs font-semibold text-[#C6A568] border border-[#C6A568]/40 px-3 py-1.5 rounded-lg">
            {copy.disclosureBadge}
          </div>
        </div>
      </div>
    </section>
  );
};
