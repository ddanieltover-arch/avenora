/**
 * @license Apache-2.0
 * Avenora — Security Center
 */

import React from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { PublicPageHero } from './PublicPageHero.tsx';
import { ShieldCheck, KeyRound, Fingerprint, AlertTriangle, Lock } from 'lucide-react';

interface SecurityCenterPageProps {
  onNavigateContact: () => void;
}

const topicIcons = [ShieldCheck, KeyRound, Fingerprint, Lock, AlertTriangle];

export const SecurityCenterPage: React.FC<SecurityCenterPageProps> = ({ onNavigateContact }) => {
  const { t } = useLocalization();
  const p = t.securityPage;

  return (
    <div className="bg-[#f8fbf9] text-[#0f1f1e]">
      <PublicPageHero kicker={p.kicker} title={p.title} subtitle={p.subtitle} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {p.topics.map((topic, index) => {
            const Icon = topicIcons[index % topicIcons.length];
            return (
              <article
                key={topic.title}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-accent-light text-[#076c64] flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#003933]">{topic.title}</h3>
                <p className="text-sm text-[#5c6f6c] leading-relaxed">{topic.desc}</p>
              </article>
            );
          })}
        </div>

        <div className="rounded-3xl border border-amber-200/80 bg-amber-50/80 p-6 sm:p-8 text-center space-y-3">
          <h2 className="text-lg font-serif font-bold text-amber-950">{p.reportTitle}</h2>
          <p className="text-sm text-amber-900/80 max-w-xl mx-auto leading-relaxed">{p.reportDesc}</p>
          <button
            type="button"
            onClick={onNavigateContact}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#076c64] hover:bg-[#003933] text-white text-sm font-semibold transition cursor-pointer"
          >
            {p.reportCta}
          </button>
        </div>
      </div>
    </div>
  );
};
