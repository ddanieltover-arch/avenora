/**
 * @license Apache-2.0
 * ISO 4217 minor-unit exponents for fiat currencies (crypto handled separately).
 */

/** Currencies with no fractional minor unit in common banking use. */
export const ZERO_DECIMAL_CURRENCIES = new Set<string>([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'ISK',
  'JPY',
  'KMF',
  'KRW',
  'PYG',
  'RWF',
  'UGX',
  'UYI',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

/** Currencies using three decimal places. */
export const THREE_DECIMAL_CURRENCIES = new Set<string>([
  'BHD',
  'IQD',
  'JOD',
  'KWD',
  'LYD',
  'OMR',
  'TND',
]);

export function minorUnitsForCurrencyCode(code: string): number {
  const upper = code.toUpperCase();
  if (upper === 'BTC') return 8;
  if (ZERO_DECIMAL_CURRENCIES.has(upper)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(upper)) return 3;
  return 2;
}
