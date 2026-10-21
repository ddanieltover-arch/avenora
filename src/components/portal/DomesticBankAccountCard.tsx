/**
 * @license Apache-2.0
 * Customer-facing simulated domestic bank account details (post-KYC).
 * Numbers use each country's banking format; prototype-only (not live settlement).
 */

import React, { useState } from 'react';
import { Building2, Check, Copy } from 'lucide-react';
import { useAuth } from '../AuthContext.tsx';
import { useDomesticBankAccount } from '../../hooks/useDomesticBankAccount.ts';

const PROTOTYPE_BANNER =
  'SIMULATED ACCOUNT — PROTOTYPE ONLY — NOT FOR REAL DEPOSITS, WITHDRAWALS, OR LIVE FINANCIAL SETTLEMENT.';

interface DomesticBankAccountCardProps {
  onNavigateToKyc?: () => void;
}

export const DomesticBankAccountCard: React.FC<DomesticBankAccountCardProps> = ({ onNavigateToKyc }) => {
  const { user } = useAuth();
  const { data, loading, error } = useDomesticBankAccount();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyValue = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (loading && !data) {
    return (
      <article className="bg-white rounded-[20px] border border-[#E2E8E4]/80 shadow-sm p-5">
        <p className="text-xs text-[#68746E]">Loading domestic account details…</p>
      </article>
    );
  }

  if (error) {
    return (
      <article className="bg-white rounded-[20px] border border-red-200 shadow-sm p-5">
        <p className="text-xs text-red-700">{error}</p>
      </article>
    );
  }

  const status = data?.generationStatus ?? 'NOT_ELIGIBLE';
  const kycStatus = data?.kycStatus || user?.kycStatus || 'NOT_STARTED';
  const country = data?.verifiedCountryCode || user?.countryCode || '—';

  return (
    <article className="bg-white rounded-[20px] border border-[#E2E8E4]/80 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#075B46]" aria-hidden />
          <h3 className="font-serif font-bold text-[#17231F]">Domestic account details</h3>
        </div>
        <span className="text-[10px] font-bold text-[#68746E] uppercase tracking-wide">{country}</span>
      </div>

      <p className="text-[11px] leading-relaxed font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        {data?.disclaimer || PROTOTYPE_BANNER}
      </p>

      {status === 'GENERATED' && data?.displayFields && data.displayFields.length > 0 ? (
        <ul className="space-y-2">
          {data.displayFields.map((field) => (
            <li key={field.key} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#F1F4F1]/60 text-xs">
              <div>
                <p className="text-[#68746E]">{field.label}</p>
                <p className="font-mono font-semibold text-[#17231F] mt-0.5 break-all">{field.value}</p>
              </div>
              <button
                type="button"
                onClick={() => copyValue(field.key, field.value)}
                className="shrink-0 p-2 rounded-lg hover:bg-white border border-transparent hover:border-[#E2E8E4] cursor-pointer"
                aria-label={`Copy ${field.label}`}
              >
                {copiedKey === field.key ? (
                  <Check className="w-4 h-4 text-[#075B46]" aria-hidden />
                ) : (
                  <Copy className="w-4 h-4 text-[#68746E]" aria-hidden />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[#68746E] leading-relaxed">
            {status === 'NOT_ELIGIBLE'
              ? 'After identity verification is approved, Avenora automatically generates domestic account numbers in your country’s banking format (for example US routing + account, UK sort code + account, or IBAN).'
              : status === 'PENDING_GENERATION'
                ? data?.message || 'Your verification is approved. Generating your country-format account numbers…'
                : status === 'COUNTRY_MISMATCH_REQUIRES_REVIEW'
                  ? 'Your verified country differs from signup country. Our compliance team must resolve this before account details can be issued.'
                  : status === 'FORMAT_NOT_IMPLEMENTED'
                    ? 'Domestic account simulation is not yet available for your verified country. No placeholder bank details are shown.'
                    : status === 'GENERATION_FAILED'
                      ? `Account generation is temporarily unavailable. ${data?.lastError ?? ''}`
                      : data?.message ?? 'Account details are not available yet.'}
          </p>
          {status === 'NOT_ELIGIBLE' && (
            <p className="text-[11px] text-[#17231F]">
              Current KYC status: <strong>{String(kycStatus).replace(/_/g, ' ')}</strong>
            </p>
          )}
          {status === 'NOT_ELIGIBLE' && onNavigateToKyc && (
            <button
              type="button"
              onClick={onNavigateToKyc}
              className="text-xs font-semibold text-[#075B46] hover:underline cursor-pointer"
            >
              Open identity verification
            </button>
          )}
        </div>
      )}
    </article>
  );
};
