/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Currency Metadata & Registry
 */

import { buildCurrencyDefinition, isRegisteredCurrencyCode } from './currencyRegistry.ts';

export interface CurrencyDefinition {
  code: string;
  name: string;
  symbol: string;
  minorUnits: number; // Exponent for minor currency unit (e.g. 2 for cents, 8 for satoshis)
  isCrypto: boolean;
  defaultLocale: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyDefinition> = {
  USD: {
    code: 'USD',
    name: 'United States Dollar',
    symbol: '$',
    minorUnits: 2,
    isCrypto: false,
    defaultLocale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    minorUnits: 2,
    isCrypto: false,
    defaultLocale: 'de-DE',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    minorUnits: 2,
    isCrypto: false,
    defaultLocale: 'en-GB',
  },
  BRL: {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    minorUnits: 2,
    isCrypto: false,
    defaultLocale: 'pt-BR',
  },
  BTC: {
    code: 'BTC',
    name: 'Bitcoin',
    symbol: '₿',
    minorUnits: 8,
    isCrypto: true,
    defaultLocale: 'en-US',
  },
};

export function getCurrency(code: string): CurrencyDefinition {
  const upper = code.toUpperCase();
  const preset = SUPPORTED_CURRENCIES[upper];
  if (preset) return preset;
  return buildCurrencyDefinition(upper);
}

export function isSupportedCurrency(code: string): boolean {
  const upper = code.toUpperCase();
  return upper in SUPPORTED_CURRENCIES || isRegisteredCurrencyCode(upper);
}
