/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Privacy Policy (Draft)
 */

import React from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { ShieldCheck, Lock, FileText, AlertTriangle, EyeOff, Server, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onOpenPortal: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onOpenPortal }) => {
  const { t } = useLocalization();

  return (
    <div className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-[#0f1f1e]">
      {/* Header */}
      <div className="space-y-3 border-b border-slate-200 pb-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#003933]">{t.legal.privacyTitle}</h1>
        <p className="text-xs text-[#5c6f6c]">Effective Date: October 14, 2026 · Last updated: October 2026</p>
      </div>

      {/* Regulatory Draft Disclaimer */}
      <div className="p-5 rounded-2xl bg-[#f8fbf9] border border-amber-200/80 text-xs text-[#5c6f6c] space-y-2 leading-relaxed">
        <p className="font-semibold text-[#003933]">Your privacy matters</p>
        <p>
          This policy explains how Avenora collects, uses, and protects personal information when you use our website,
          mobile experiences, and banking services. {t.legal.draftNotice}
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-8 text-xs leading-relaxed text-[#0f1f1e]">
        <section className="space-y-3">
          <h2 className="text-lg font-serif font-bold text-[#003933] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#076c64]" />
            1. Data Minimization Principles
          </h2>
          <p>
            Avenora is built around data minimization. We collect only the information needed to provide banking services, meet legal obligations, and protect your account.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5c6f6c]">
            <li>We do not sell, rent, monetize, or broker personal data under any circumstances.</li>
            <li>No behavioral advertising trackers or third-party marketing pixels are embedded in client bundles.</li>
            <li>Authentication passwords are protected via salted Scrypt key derivation with timing-safe comparisons.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif font-bold text-[#003933] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#076c64]" />
            2. Customer Information & Verification (KYC)
          </h2>
          <p>
            For identity verification and regulatory compliance, Avenora processes KYC information as follows:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5c6f6c]">
            <li>Verification data is stored securely and retained according to applicable law and your consent.</li>
            <li>No biometric scans, national identity documents, or credit bureau reports are transmitted to external verification bureaus.</li>
            <li>Identity assessment states (<code className="text-[#076c64] font-mono">APPROVED</code>, <code className="text-[#076c64] font-mono">UNDER_REVIEW</code>) are purely illustrative compliance workflows.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif font-bold text-[#003933] flex items-center gap-2">
            <Server className="w-4 h-4 text-[#076c64]" />
            3. Double-Entry Ledger Privacy & Audit Trails
          </h2>
          <p>
            The immutable financial ledger maintains zero-float journal entries for transactions across currency corridors. To preserve customer financial privacy:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5c6f6c]">
            <li>Customers may only query journal entries linked to accounts owned by their authenticated identity.</li>
            <li>Internal ledger account numbers, tier-1 capital reserves, and multi-tenant balances are masked from standard customer views.</li>
            <li>Partner integrations use authenticated, encrypted channels with access controls.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif font-bold text-[#003933] flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-[#076c64]" />
            4. Payment Card Credentials (PCI-DSS Demarcation)
          </h2>
          <p>
            Card numbers and sensitive authentication data are protected using industry-standard tokenization and encryption. We do not display full card numbers or CVV in the customer portal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif font-bold text-[#003933] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#076c64]" />
            5. User Rights & Data Subject Access
          </h2>
          <p>
            Under applicable privacy laws (including GDPR and CCPA where they apply), you may have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5c6f6c]">
            <li>Inspect all stored session data and active profile attributes.</li>
            <li>Request instantaneous revocation of active sessions and password reset tokens.</li>
            <li>Request deletion of personal data where legally permitted.</li>
          </ul>
        </section>
      </div>

      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-[#5c6f6c]">
          Have questions regarding privacy architecture? Contact Avenora Compliance.
        </span>
        <button
          onClick={onOpenPortal}
          className="bg-[#076c64] hover:bg-[#003933] text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
        >
          Open Customer Portal
        </button>
      </div>
    </div>
  );
};
