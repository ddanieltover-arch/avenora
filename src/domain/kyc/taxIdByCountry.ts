/**
 * Tax identifier types offered during KYC, scoped to signup country.
 */

import {
  findTaxIdCatalogOption,
  getTaxIdCatalogOptions,
  isUnsupportedTaxIdCountry,
  type TaxIdOption,
} from './taxIdCatalog.ts';

export type KycTaxIdType = string;

export interface KycTaxIdOption {
  value: KycTaxIdType;
  label: string;
  placeholder: string;
}

const LEGACY_TAX_ID_CODES: Readonly<Record<string, string>> = {
  SSN: 'US_SSN',
  CPF: 'BR_CPF',
  DNI: 'ES_DNI',
};

export const UNSUPPORTED_TAX_ID_COUNTRY_MESSAGE =
  'Individual tax identifiers are not issued for this account country, so verification cannot be submitted.';

export function getTaxIdOptionsForCountry(countryCode: string): KycTaxIdOption[] {
  return getTaxIdCatalogOptions(countryCode).map((option) => ({
    value: option.code,
    label: option.label,
    placeholder: option.placeholder,
  }));
}

export function resolveDefaultTaxIdType(countryCode: string): KycTaxIdType {
  return getTaxIdOptionsForCountry(countryCode)[0]?.value ?? '';
}

export function isTaxIdTypeAllowedForCountry(countryCode: string, taxIdType: string): boolean {
  return findTaxIdCatalogOption(countryCode, taxIdType) !== undefined;
}

export function canonicalizeTaxIdType(countryCode: string, taxIdType: string): KycTaxIdType | null {
  const raw = taxIdType.trim().toUpperCase();
  const candidate = LEGACY_TAX_ID_CODES[raw] ?? raw;
  return isTaxIdTypeAllowedForCountry(countryCode, candidate) ? candidate : null;
}

export function findTaxIdOption(countryCode: string, taxIdType: string): TaxIdOption | undefined {
  const canonical = canonicalizeTaxIdType(countryCode, taxIdType);
  if (!canonical) return undefined;
  return findTaxIdCatalogOption(countryCode, canonical);
}

export function countryHasIndividualTaxId(countryCode: string): boolean {
  return getTaxIdCatalogOptions(countryCode).length > 0 && !isUnsupportedTaxIdCountry(countryCode);
}
