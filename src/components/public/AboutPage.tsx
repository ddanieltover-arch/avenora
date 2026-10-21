/**
 * @license Apache-2.0
 * Avenora Fintech Platform — About Page
 */

import React from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  BookOpen,
  Cpu,
} from 'lucide-react';

interface AboutPageProps {
  onOpenPortal: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onOpenPortal }) => {
  const { t } = useLocalization();

  return (
    <div className="py-16 bg-[#f8fbf9] text-[#0f1f1e]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#076c64]">
            Who we are
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif font-extrabold text-[#003933] tracking-tight">
            {t.about.title}
          </h1>
          <p className="text-lg text-[#5c6f6c] leading-relaxed">
            {t.about.subtitle}
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-accent-light text-[#076c64] flex items-center justify-center border border-brand-accent/20">
              <Scale className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#003933]">
              {t.about.missionTitle}
            </h2>
            <p className="text-sm text-[#5c6f6c] leading-relaxed">
              {t.about.missionDesc}
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#003933]">
              {t.about.safetyTitle}
            </h2>
            <p className="text-sm text-[#5c6f6c] leading-relaxed">
              {t.about.safetyDesc}
            </p>
          </div>
        </div>

        {/* Deep Dive: Double Entry Ledger Architecture */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#003933] text-white space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C6A568] tracking-wider uppercase">
            <Cpu className="w-4 h-4" />
            <span>How we safeguard your money</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#f8fbf9]">
            {t.about.ledgerTitle}
          </h2>

          <p className="text-sm text-emerald-100/80 leading-relaxed max-w-3xl">
            {t.about.ledgerDesc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-emerald-800/60 font-mono text-xs">
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/40">
              <span className="text-[#C6A568] block font-bold mb-1">Precise balances</span>
              <span className="text-emerald-100/70 text-[11px]">
                Amounts are tracked in minor currency units so statements match your available balance.
              </span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/40">
              <span className="text-[#C6A568] block font-bold mb-1">Balanced records</span>
              <span className="text-emerald-100/70 text-[11px]">
                Each payment posts matching debit and credit entries for a complete audit trail.
              </span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/40">
              <span className="text-[#C6A568] block font-bold mb-1">Cryptographic Webhooks</span>
              <span className="text-emerald-100/70 text-[11px]">
                HMAC-SHA256 signature verification with guaranteed idempotency.
              </span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <span className="text-xs text-emerald-200">
              Ready to manage your accounts online?
            </span>
            <button
              onClick={onOpenPortal}
              className="bg-[#C6A568] hover:bg-amber-600 text-[#003933] font-semibold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open Customer Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
