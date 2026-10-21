/**
 * @license Apache-2.0
 * ISO 3166-1 alpha-2 country options for registration and profile forms.
 */

import type { SupportedLocale } from '../components/LocalizationContext.tsx';
import iso3166CountryCodes from './iso3166CountryCodes.json';

export const ISO3166_COUNTRY_CODES: readonly string[] = iso3166CountryCodes;

const ISO_COUNTRY_CODE_SET = new Set<string>(ISO3166_COUNTRY_CODES);

const LOCALE_FOR_DISPLAY: Record<SupportedLocale, string> = {
  en: 'en',
  es: 'es',
  'pt-BR': 'pt',
};

export interface CountrySelectOption {
  code: string;
  label: string;
}

export function isValidIsoCountryCode(code: string): boolean {
  return ISO_COUNTRY_CODE_SET.has(code.trim().toUpperCase());
}

export function getCountrySelectOptions(locale: SupportedLocale = 'en'): CountrySelectOption[] {
  const intlLocale = LOCALE_FOR_DISPLAY[locale] ?? 'en';
  const display = new Intl.DisplayNames([intlLocale], { type: 'region' });

  return ISO3166_COUNTRY_CODES.map((code) => {
    const name = display.of(code) ?? code;
    return {
      code,
      label: `${name} (${code})`,
    };
  }).sort((a, b) => a.label.localeCompare(b.label, intlLocale));
}
