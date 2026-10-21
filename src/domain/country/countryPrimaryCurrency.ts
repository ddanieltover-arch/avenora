/**
 * @license Apache-2.0
 * Maps signup country (ISO 3166-1 alpha-2) to primary fiat ISO 4217 code.
 */

import countryToCurrency from '../../config/countryToCurrency.json';
import iso3166CountryCodes from '../../config/iso3166CountryCodes.json';

const COUNTRY_CURRENCY_MAP: Readonly<Record<string, string>> = countryToCurrency;

/** Territories / legacy codes not present in reference datasets. */
const MANUAL_COUNTRY_CURRENCY: Record<string, string> = {
  XK: 'EUR',
  AQ: 'USD',
  BV: 'NOK',
  HM: 'AUD',
  TF: 'EUR',
  UM: 'USD',
  IO: 'USD',
  PN: 'NZD',
  GS: 'GBP',
  CC: 'AUD',
  CX: 'AUD',
  AN: 'USD',
};

const KNOWN_COUNTRIES = new Set<string>(iso3166CountryCodes as string[]);

export function resolvePrimaryFiatCurrency(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (!code) return 'USD';
  return MANUAL_COUNTRY_CURRENCY[code] ?? COUNTRY_CURRENCY_MAP[code] ?? 'USD';
}

/** Primary fiat from signup country plus Bitcoin wallet. */
export function getWalletCurrencyCodesForCountry(countryCode: string): string[] {
  return [resolvePrimaryFiatCurrency(countryCode), 'BTC'];
}

export function isKnownCountryCode(countryCode: string): boolean {
  return KNOWN_COUNTRIES.has(countryCode.trim().toUpperCase());
}
