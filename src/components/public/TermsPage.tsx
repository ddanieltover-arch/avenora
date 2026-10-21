/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Terms of Service
 */

import React from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { Scale, AlertTriangle, ShieldAlert, Cpu, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TermsPageProps {
  onOpenPortal: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onOpenPortal }) => {
  const { t } = useLocalization();

  return (
    <div className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-[#0f1f1e]">
      {/* Header */}
      <div className="space-y-3 border-b border-slate-200 pb-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#003933]">{t.legal.termsTitle}</h1>
        <p className="text-xs text-[#5c6f6c]">Effective Date: October 14, 2026 · Last updated: October 2026</p>
      </div>

      {/* Regulatory Draft Notice */}
      <div className="p-5 rounded-2xl bg-[#f8fbf9] border border-amber-200/80 text-xs text-[#5c6f6c] space-y-2 leading-relaxed">
        <p className="font-semibold text-[#003933]">Please read carefully</p>
        <p>{t.legal.draftNotice}</p>
      </div>

      {/* Terms Sections */}
      <div className="space-y-8 text-xs leading-relaxed text-[#0f1f1e]">
        <section className="space-y-3">
          <h2 className="text-lg font-serif font-bold text-[#003933] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#076c64]" />
            1. Accounts & banking services
          </h2>
          <p>
            These terms govern your use of Avenora accounts, cards, transfers, FX, lending, and grant services. Product features and fees are described in your account schedule and regional disclosures.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5c6f6c]">
            <li>You must provide accurate information and keep your credentials secure.</li>
            <li>We may suspend or close accounts that violate law, these terms, or our risk policies.</li>
            <li>Transaction limits and holds may apply for security and compliance.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif font-bold text-[#003933] flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#076c64]" />
            2. Lending & Amortization Disclaimers
          </h2>
          <p>
            Loan calculators and pre-qualification tools provide estimates only. A formal offer requires completed application, verification, and acceptance of loan documents.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5c6f6c]">
            <li>Rates and approvals depend on creditworthiness, income, and applicable law.</li>
            <li>Your amortization schedule is provided before you sign.</li>
            <li>Lending products may not be available in all regions.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif font-bold text-[#003933] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#076c64]" />
            3. Grant Discovery & Non-Dilutive Funding Directory
          </h2>
          <p>
            The grant opportunities listed in the Avenora catalog represent curated public and philanthropic program models:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5c6f6c]">
            <li>Inclusion in the catalog does not guarantee applicant eligibility, approval, or disbursement.</li>
            <li>Approved grant disbursements are credited per program rules after compliance review.</li>
            <li>All grant criteria and submission requirements must be verified with primary funding bodies.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif font-bold text-[#003933] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#076c64]" />
            4. Acceptable use & security
          </h2>
          <p>
            Users agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5c6f6c]">
            <li>Submit genuine unencrypted payment card PANs or CVVs into test input forms.</li>
            <li>Attempt to bypass authentication, abuse APIs, or interfere with platform integrity.</li>
            <li>Conduct automated denial-of-service, penetration attacks, or unauthorized data scraping against platform APIs.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif font-bold text-[#003933] flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#076c64]" />
            5. Intellectual Property & Framework Architecture
          </h2>
          <p>
            Avenora software, branding, and content are protected by intellectual property laws. You receive a limited license to use the services as described in your agreements.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-[#5c6f6c]">
          Ready to experience the interactive banking platform?
        </span>
        <button
          onClick={onOpenPortal}
          className="bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
        >
          <span>Enter Customer Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
