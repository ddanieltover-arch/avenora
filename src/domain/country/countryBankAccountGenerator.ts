/**
 * @license Apache-2.0
 * Country-aware primary domestic bank account generation (synthetic prototype only).
 */

import { CountryIdentifierResult, SupportedCountryCode } from './CountryTypes.ts';
import { CountryRules } from './CountryRules.ts';
import { getCountryBankingRule, getGenerationCountryCode, REGISTRY_VERSION, DomesticSchemeId } from './CountryBankingRegistry.ts';
let sequenceCounter = 500_000;

function nextSequence(): number {
  sequenceCounter += 1;
  return sequenceCounter;
}

function buildAlphanumericBban(prefix: string, targetLength: number, seq: number): string {
  const base = `${prefix}${seq.toString(36).toUpperCase()}`;
  const padded = base.padEnd(targetLength, '0').slice(0, targetLength);
  return padded.replace(/[^A-Z0-9]/g, '0');
}

export function generatePartialSyntheticIban(countryCode: string, ibanTotalLength: number, seq: number): CountryIdentifierResult {
  const bbanLength = ibanTotalLength - 4;
  if (bbanLength < 4) {
    throw new Error(`Invalid IBAN length ${ibanTotalLength} for country ${countryCode}`);
  }
  const bban = buildAlphanumericBban('AVEN', bbanLength, seq);
  const check = CountryRules.computeIbanCheckDigits(countryCode, bban);
  const raw = `${countryCode}${check}${bban}`;
  const formatted = `${countryCode}${check} ${bban.replace(/(.{4})/g, '$1 ').trim()}`;
  const masked = `${countryCode}${check} **** **** **** ${bban.slice(-4)}`;
  const generatedAt = new Date();
  const disclaimer =
    'SIMULATED ACCOUNT — PROTOTYPE ONLY — NOT FOR REAL DEPOSITS, WITHDRAWALS, OR LIVE FINANCIAL SETTLEMENT. IBAN checksum is valid; national BBAN is synthetic and not bank-assigned.';

  return {
    countryCode: countryCode as SupportedCountryCode,
    type: 'IBAN',
    formattedValue: formatted,
    rawValue: raw,
    maskedValue: masked,
    components: { iban: raw, ibanCheckDigits: check, syntheticBban: bban },
    isSimulated: true,
    source: 'SYNTHETIC_GENERATOR',
    disclaimer,
    generatedAt,
  };
}

export function resolvePrimaryGenerationRequest(verifiedCountryCode: string): {
  ruleScheme: DomesticSchemeId;
  ruleVersion: string;
  formatNotImplemented: boolean;
  delegateProviderCountry?: SupportedCountryCode;
  identifierType?: 'BANK_ACCOUNT' | 'IBAN';
  partialIban?: { countryCode: string; ibanTotalLength: number };
} {
  const rule = getCountryBankingRule(verifiedCountryCode);
  if (!rule.syntheticGenerationSupport || rule.scheme === 'FORMAT_NOT_IMPLEMENTED') {
    return {
      ruleScheme: rule.scheme,
      ruleVersion: REGISTRY_VERSION,
      formatNotImplemented: true,
    };
  }

  const generationCountry = getGenerationCountryCode(verifiedCountryCode);
  const fullMap: Partial<Record<DomesticSchemeId, SupportedCountryCode>> = {
    US_ABA_DDA: 'US',
    GB_SORT_ACCOUNT_IBAN: 'GB',
    ES_CCC_IBAN: 'ES',
    DE_BLZ_IBAN: 'DE',
    BR_FEBRABAN: 'BR',
  };
  const delegate = fullMap[rule.scheme];
  if (delegate) {
    return {
      ruleScheme: rule.scheme,
      ruleVersion: REGISTRY_VERSION,
      formatNotImplemented: false,
      delegateProviderCountry: delegate,
      identifierType: rule.primaryIdentifierType,
    };
  }

  if (rule.scheme === 'IBAN_SYNTHETIC_PARTIAL' && rule.ibanTotalLength) {
    return {
      ruleScheme: rule.scheme,
      ruleVersion: REGISTRY_VERSION,
      formatNotImplemented: false,
      partialIban: { countryCode: generationCountry, ibanTotalLength: rule.ibanTotalLength },
      identifierType: 'IBAN',
    };
  }

  return {
    ruleScheme: rule.scheme,
    ruleVersion: REGISTRY_VERSION,
    formatNotImplemented: true,
  };
}

export function generatePartialIbanForCountry(countryCode: string, ibanTotalLength: number): CountryIdentifierResult {
  return generatePartialSyntheticIban(countryCode, ibanTotalLength, nextSequence());
}
