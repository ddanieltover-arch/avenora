/**
 * @license Apache-2.0
 * Dynamic ISO 4217 currency registry (all fiat codes used in country mapping + BTC).
 */

import iso4217CurrencyCodes from '../../config/iso4217CurrencyCodes.json';
import { minorUnitsForCurrencyCode } from './currencyMinorUnits.ts';
import type { CurrencyDefinition } from './Currency.ts';

const FIAT_CODES = new Set<string>([
  ...(iso4217CurrencyCodes as string[]),
  'BTC',
]);

const KNOWN_OVERRIDES: Record<string, Partial<CurrencyDefinition>> = {
  USD: { name: 'United States Dollar', symbol: '$', defaultLocale: 'en-US' },
  EUR: { name: 'Euro', symbol: '€', defaultLocale: 'de-DE' },
  GBP: { name: 'British Pound', symbol: '£', defaultLocale: 'en-GB' },
  BRL: { name: 'Brazilian Real', symbol: 'R$', defaultLocale: 'pt-BR' },
  JPY: { name: 'Japanese Yen', symbol: '¥', defaultLocale: 'ja-JP' },
  BTC: { name: 'Bitcoin', symbol: '₿', defaultLocale: 'en-US', isCrypto: true },
};

function currencyDisplayName(code: string): string {
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'currency' }).of(code);
    if (name && name !== code) return name;
  } catch {
    // ignore
  }
  return code;
}

function currencyDisplaySymbol(code: string): string {
  try {
    const parts = new Intl.NumberFormat('en', { style: 'currency', currency: code }).formatToParts(1);
    const sym = parts.find((p) => p.type === 'currency')?.value;
    if (sym && sym !== code) return sym;
  } catch {
    // ignore
  }
  return code;
}

export function isRegisteredCurrencyCode(code: string): boolean {
  const upper = code.toUpperCase();
  return upper === 'BTC' || FIAT_CODES.has(upper);
}

export function buildCurrencyDefinition(code: string): CurrencyDefinition {
  const upper = code.toUpperCase();
  if (!isRegisteredCurrencyCode(upper)) {
    throw new Error(`Unsupported or unverified currency code: ${code}`);
  }

  const override = KNOWN_OVERRIDES[upper];
  const isCrypto = upper === 'BTC' || override?.isCrypto === true;

  return {
    code: upper,
    name: override?.name ?? currencyDisplayName(upper),
    symbol: override?.symbol ?? currencyDisplaySymbol(upper),
    minorUnits: minorUnitsForCurrencyCode(upper),
    isCrypto,
    defaultLocale: override?.defaultLocale ?? 'en-US',
  };
}
