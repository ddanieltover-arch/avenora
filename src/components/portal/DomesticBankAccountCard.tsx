/**
 * @license Apache-2.0
 * Customer-facing country-format domestic bank account details (auto-generated post-KYC).
 * Used on mobile overview; desktop embeds equivalent UI in the portfolio hero.
 */

import React, { useState } from 'react';
import { Building2, Check, Copy, Siren } from 'lucide-react';
import { useAuth } from '../AuthContext.tsx';
import { useDomesticBankAccount } from '../../hooks/useDomesticBankAccount.ts';

interface DomesticBankAccountCardProps {
  onNavigateToKyc?: () => void;
}

export const DomesticBankAccountCard: React.FC<DomesticBankAccountCardProps> = ({
  onNavigateToKyc,
}) => {
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
  const country = data?.verifiedCountryCode || user?.countryCode || '—';
  const fields = status === 'GENERATED' ? data?.displayFields ?? [] : [];
  const kycAlertNeeded =
    fields.length === 0 &&
    user?.kycStatus !== 'APPROVED' &&
    status !== 'PENDING_GENERATION';

  if (kycAlertNeeded) {
    return (
      <article
        className="rounded-[20px] border p-5 space-y-3 animate-kyc-siren text-white shadow-sm"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Siren className="w-4 h-4 text-red-100 shrink-0 animate-kyc-siren-icon" aria-hidden />
            <h3 className="font-serif font-bold text-white truncate">Verification required</h3>
          </div>
          <span className="text-[10px] font-bold text-red-100 uppercase tracking-wide shrink-0">
            {country}
          </span>
        </div>
        <p className="text-[11px] text-red-50 leading-relaxed font-medium">
          Complete identity verification to unlock your domestic account numbers.
        </p>
        <button
          type="button"
          onClick={() => onNavigateToKyc?.()}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-red-950/40 hover:bg-red-950/55 border border-red-100/40 rounded-lg px-3 py-1.5 cursor-pointer"
        >
          <Siren className="w-3.5 h-3.5 animate-kyc-siren-icon" aria-hidden />
          Open verification now
        </button>
      </article>
    );
  }

  return (
    <article className="bg-white rounded-[20px] border border-[#E2E8E4]/80 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#075B46]" aria-hidden />
          <h3 className="font-serif font-bold text-[#17231F]">Domestic account details</h3>
        </div>
        <span className="text-[10px] font-bold text-[#68746E] uppercase tracking-wide">{country}</span>
      </div>

      {fields.length > 0 ? (
        <ul className="space-y-2">
          {fields.map((field) => (
            <li
              key={field.key}
              className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#F1F4F1]/60 text-xs"
            >
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
            {status === 'PENDING_GENERATION'
              ? data?.message || 'Generating your country-format account numbers…'
              : status === 'FORMAT_NOT_IMPLEMENTED'
                ? 'Domestic account numbers are not yet available for your signup country.'
                : status === 'GENERATION_FAILED'
                  ? `Account generation is temporarily unavailable. ${data?.lastError ?? ''}`
                  : data?.message ??
                    'Refreshing account details… If this persists, reload the page.'}
          </p>
        </div>
      )}
    </article>
  );
};
