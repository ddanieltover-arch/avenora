/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Security, Governance & Compliance Standards
 */

import React from 'react';
import { ShieldCheck, Lock, AlertTriangle, EyeOff, FileText, CheckCircle2 } from 'lucide-react';

export const SecurityCompliance: React.FC = () => {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-brand-accent-light0/10 border border-emerald-500/20 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">DevSecOps & Compliance Guardrails</h2>
          <p className="text-xs text-slate-400">
            Immutable regulatory boundaries, security principles, and banking disclaimers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Segregated safeguarding & settlement controls</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Customer funds are tracked on a double-entry ledger with safeguarding accounts, hold balances for card authorizations, and audit trails for every movement. Partner banks and payment networks are used according to your region and product entitlements.
          </p>
        </div>

        {/* Guardrail 2: Secret Isolation */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Zero Server-Secrets in Browser</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All database connection strings, direct URLs, signing keys, and provider secrets are validated via server-side Zod schemas (<code className="text-cyan-300">env.config.ts</code>). Vite client variables are strictly restricted to public non-sensitive flags.
          </p>
        </div>

        {/* Guardrail 3: Zero-Float Math */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Zero-Float Minor-Unit Ledger</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            No financial account uses editable floating-point numbers. Balances are derived dynamically from immutable double-entry journal entries represented as integer <code className="text-emerald-300">BigInt</code> minor units (cents, satoshis).
          </p>
        </div>

        {/* Guardrail 4: PII Redaction in Logs */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
            <EyeOff className="w-4 h-4 shrink-0" />
            <span>Automated PII & Credential Redaction</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Structured request loggers intercept all incoming queries and headers, automatically masking credit card PANs, passwords, auth tokens, taxpayer IDs (SSN/CPF), and emails with <code className="text-purple-300">[REDACTED_FINANCIAL_PII]</code>.
          </p>
        </div>
      </div>

      {/* Explicit Legal & Regulatory Disclaimers Box */}
      <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/40 space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
          <FileText className="w-4 h-4" /> Legal and regulatory disclosures
        </span>
        <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
          <li>
            <strong>Depository Status:</strong> Avenora is not a bank. Banking services, deposit accounts, and fund safeguarding will be provided exclusively through licensed, regulated partner depository institutions upon live launch.
          </li>
          <li>
            <strong>Deposit insurance:</strong> Whether your balances are eligible for deposit insurance (for example FDIC or equivalent schemes) depends on the licensed institution holding funds and the product you hold—see your account schedule.
          </li>
          <li>
            <strong>Cryptocurrency:</strong> Bitcoin wallet services are provided through regulated third-party custody and liquidity partners where available in your region.
          </li>
        </ul>
      </div>
    </div>
  );
};
