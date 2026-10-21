/**
 * @license Apache-2.0
 * Central registry of domestic banking identifier schemes for every ISO 3166-1 alpha-2
 * country available in signup. Distinct from live provider capability.
 */

import iso3166CountryCodes from '../../config/iso3166CountryCodes.json';
import ibanLengths from './iso13616IbanLengths.json';

export type DomesticSchemeId =
  | 'US_ABA_DDA'
  | 'GB_SORT_ACCOUNT_IBAN'
  | 'ES_CCC_IBAN'
  | 'DE_BLZ_IBAN'
  | 'BR_FEBRABAN'
  | 'IBAN_SYNTHETIC_PARTIAL'
  | 'FORMAT_NOT_IMPLEMENTED';

export type CountrySimulationStatus = 'FULL' | 'PARTIAL' | 'UNSUPPORTED';

export interface CountryBankingRule {
  countryCode: string;
  scheme: DomesticSchemeId;
  simulationStatus: CountrySimulationStatus;
  /** Primary customer-facing identifier type for generation */
  primaryIdentifierType: 'BANK_ACCOUNT' | 'IBAN';
  implementedComponents: string[];
  validationSupport: boolean;
  syntheticGenerationSupport: boolean;
  safeSimulationStatus: 'VERIFIED_TEST_RANGES' | 'PROTOTYPE_ONLY' | 'NOT_SAFE' | 'NOT_APPLICABLE';
  verificationSource: string;
  gaps?: string;
  /** When set, generation delegates to the rule for this ISO code (territories). */
  delegatesTo?: string;
  ibanTotalLength?: number;
}

const IBAN_LENGTHS: Record<string, number> = Object.fromEntries(
  Object.entries(ibanLengths).filter(([k]) => k !== '_source').map(([k, v]) => [k, v as number])
);

const US_TERRITORY_CODES = new Set(['AS', 'GU', 'MP', 'PR', 'VI', 'UM']);
const GB_TERRITORY_CODES = new Set(['IM', 'JE', 'GG']);
const FULL_US: Omit<CountryBankingRule, 'countryCode'> = {
  scheme: 'US_ABA_DDA',
  simulationStatus: 'FULL',
  primaryIdentifierType: 'BANK_ACCOUNT',
  implementedComponents: ['routingNumber', 'accountNumber'],
  validationSupport: true,
  syntheticGenerationSupport: true,
  safeSimulationStatus: 'VERIFIED_TEST_RANGES',
  verificationSource: 'Federal Reserve E-Payments Routing Directory (ABA checksum); prototype uses 021000021 test routing.',
};

const FULL_GB: Omit<CountryBankingRule, 'countryCode'> = {
  scheme: 'GB_SORT_ACCOUNT_IBAN',
  simulationStatus: 'FULL',
  primaryIdentifierType: 'BANK_ACCOUNT',
  implementedComponents: ['sortCode', 'accountNumber', 'iban'],
  validationSupport: true,
  syntheticGenerationSupport: true,
  safeSimulationStatus: 'PROTOTYPE_ONLY',
  verificationSource: 'UK sort code / account conventions; ISO 7064 Mod 97-10 for GB IBAN.',
};

const FULL_ES: Omit<CountryBankingRule, 'countryCode'> = {
  scheme: 'ES_CCC_IBAN',
  simulationStatus: 'FULL',
  primaryIdentifierType: 'IBAN',
  implementedComponents: ['bank', 'branch', 'controlDigits', 'accountNumber', 'iban'],
  validationSupport: true,
  syntheticGenerationSupport: true,
  safeSimulationStatus: 'PROTOTYPE_ONLY',
  verificationSource: 'Banco de España CCC control digits; ISO 7064 Mod 97-10 IBAN.',
};

const FULL_DE: Omit<CountryBankingRule, 'countryCode'> = {
  scheme: 'DE_BLZ_IBAN',
  simulationStatus: 'FULL',
  primaryIdentifierType: 'IBAN',
  implementedComponents: ['blz', 'accountNumber', 'iban'],
  validationSupport: true,
  syntheticGenerationSupport: true,
  safeSimulationStatus: 'PROTOTYPE_ONLY',
  verificationSource: 'German BLZ structure within IBAN; ISO 7064 Mod 97-10 IBAN.',
};

const FULL_BR: Omit<CountryBankingRule, 'countryCode'> = {
  scheme: 'BR_FEBRABAN',
  simulationStatus: 'FULL',
  primaryIdentifierType: 'BANK_ACCOUNT',
  implementedComponents: ['banco', 'agencia', 'conta'],
  validationSupport: true,
  syntheticGenerationSupport: true,
  safeSimulationStatus: 'PROTOTYPE_ONLY',
  verificationSource: 'FEBRABAN bank/branch/account layout; modulo-11 style account check digit (prototype).',
};

const NOT_IMPLEMENTED: Omit<CountryBankingRule, 'countryCode'> = {
  scheme: 'FORMAT_NOT_IMPLEMENTED',
  simulationStatus: 'UNSUPPORTED',
  primaryIdentifierType: 'BANK_ACCOUNT',
  implementedComponents: [],
  validationSupport: false,
  syntheticGenerationSupport: false,
  safeSimulationStatus: 'NOT_APPLICABLE',
  verificationSource: 'No verified domestic format rule loaded for this jurisdiction.',
  gaps: 'Domestic account identifier simulation not implemented; requires registry extension.',
};

function partialIbanRule(countryCode: string, totalLength: number): CountryBankingRule {
  return {
    countryCode,
    scheme: 'IBAN_SYNTHETIC_PARTIAL',
    simulationStatus: 'PARTIAL',
    primaryIdentifierType: 'IBAN',
    implementedComponents: ['iban'],
    validationSupport: true,
    syntheticGenerationSupport: true,
    safeSimulationStatus: 'PROTOTYPE_ONLY',
    verificationSource: 'ISO 13616 IBAN length and ISO 7064 Mod 97-10 checksum only.',
    gaps:
      'National BBAN structure and bank assignment are not modeled; synthetic AVEN-prefix BBAN for prototype display only.',
    ibanTotalLength: totalLength,
  };
}

function resolveRule(countryCode: string): CountryBankingRule {
  const code = countryCode.trim().toUpperCase();
  if (code === 'US' || US_TERRITORY_CODES.has(code)) {
    return { countryCode: code, ...FULL_US, ...(code !== 'US' ? { delegatesTo: 'US' } : {}) };
  }
  if (code === 'GB' || code === 'UK' || GB_TERRITORY_CODES.has(code)) {
    return { countryCode: code === 'UK' ? 'GB' : code, ...FULL_GB, ...(code !== 'GB' && code !== 'UK' ? { delegatesTo: 'GB' } : {}) };
  }
  if (code === 'ES') return { countryCode: code, ...FULL_ES };
  if (code === 'DE') return { countryCode: code, ...FULL_DE };
  if (code === 'BR') return { countryCode: code, ...FULL_BR };

  const ibanLen = IBAN_LENGTHS[code];
  if (ibanLen) {
    return partialIbanRule(code, ibanLen);
  }

  return { countryCode: code, ...NOT_IMPLEMENTED };
}

const REGISTRY: Map<string, CountryBankingRule> = new Map();

for (const code of iso3166CountryCodes as string[]) {
  REGISTRY.set(code, resolveRule(code));
}

export function getCountryBankingRule(countryCode: string): CountryBankingRule {
  const code = countryCode.trim().toUpperCase();
  if (code === 'UK') return getCountryBankingRule('GB');
  return REGISTRY.get(code) ?? { countryCode: code, ...NOT_IMPLEMENTED };
}

export function getGenerationCountryCode(countryCode: string): string {
  const rule = getCountryBankingRule(countryCode);
  return rule.delegatesTo ?? rule.countryCode;
}

export function listAllCountryBankingRules(): CountryBankingRule[] {
  return Array.from(REGISTRY.values());
}

export function getCoverageMatrix(): Array<{
  countryCode: string;
  scheme: DomesticSchemeId;
  simulationStatus: CountrySimulationStatus;
  components: string[];
  validationSupport: boolean;
  syntheticGenerationSupport: boolean;
  safeSimulationStatus: CountryBankingRule['safeSimulationStatus'];
  verificationSource: string;
  gaps: string;
}> {
  return listAllCountryBankingRules().map((r) => ({
    countryCode: r.countryCode,
    scheme: r.scheme,
    simulationStatus: r.simulationStatus,
    components: r.implementedComponents,
    validationSupport: r.validationSupport,
    syntheticGenerationSupport: r.syntheticGenerationSupport,
    safeSimulationStatus: r.safeSimulationStatus,
    verificationSource: r.verificationSource,
    gaps: r.gaps ?? '',
  }));
}

export const REGISTRY_VERSION = '2026.03.1';
