/**
 * @license Apache-2.0
 * Fixed card spend-limit policy (USD-anchored, Brazil overrides).
 */

import { getCurrency } from '../money/Currency.ts';
import { resolveIllustrativeRate } from '../../lib/illustrativeFx.ts';

/** Standard single-transaction ceiling in USD (converted per currency). */
export const CARD_SINGLE_LIMIT_USD = 20;
/** Standard monthly spend ceiling in USD (converted per currency). */
export const CARD_MONTHLY_LIMIT_USD = 2000;

/** Brazil (BR / BRL) fixed local amounts — not USD-converted. */
export const CARD_BR_SINGLE_LIMIT = 1000;
export const CARD_BR_MONTHLY_LIMIT = 10_000;

/**
 * Round UP to the nearest 10, 100, 1_000, or 10_000 based on magnitude.
 * - < 100 → nearest 10
 * - < 1_000 → nearest 100
 * - < 10_000 → nearest 1_000
 * - else → nearest 10_000
 */
export function ceilToPolicyStep(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 10;
  let step: number;
  if (amount < 100) step = 10;
  else if (amount < 1000) step = 100;
  else if (amount < 10_000) step = 1000;
  else step = 10_000;
  return Math.ceil(amount / step) * step;
}

function formatMajorLimit(amount: number, currency: string): string {
  const def = getCurrency(currency);
  const digits = def.minorUnits <= 0 ? 0 : Math.min(def.minorUnits, 2);
  const whole = Math.round(amount);
  if (digits === 0) return String(whole);
  return whole.toFixed(digits);
}

export function isBrazilCardAccount(params: {
  currency: string;
  countryCode?: string;
}): boolean {
  const currency = params.currency.trim().toUpperCase();
  const country = (params.countryCode || '').trim().toUpperCase();
  return country === 'BR' || currency === 'BRL';
}

/**
 * Resolve fixed single-tx and monthly limits for a card currency / account country.
 * - Brazil: 1,000 / 10,000 local (no FX, no step rounding)
 * - Others: 20 USD / 2,000 USD → local FX, then round UP to 10 / 100 / 1_000 / 10_000
 */
export function resolveFixedCardSpendLimits(params: {
  currency: string;
  countryCode?: string;
}): { singleTxLimitDecimal: string; monthlyLimitDecimal: string } {
  const currency = params.currency.trim().toUpperCase() || 'USD';

  if (isBrazilCardAccount(params)) {
    return {
      singleTxLimitDecimal: formatMajorLimit(CARD_BR_SINGLE_LIMIT, currency === 'BRL' ? 'BRL' : currency),
      monthlyLimitDecimal: formatMajorLimit(CARD_BR_MONTHLY_LIMIT, currency === 'BRL' ? 'BRL' : currency),
    };
  }

  const localPerUsd = resolveIllustrativeRate('USD', currency);
  if (!Number.isFinite(localPerUsd) || localPerUsd <= 0) {
    throw new Error(`Unable to convert card limits into ${currency}.`);
  }

  const singleRaw = CARD_SINGLE_LIMIT_USD * localPerUsd;
  const monthlyRaw = CARD_MONTHLY_LIMIT_USD * localPerUsd;

  const single = ceilToPolicyStep(singleRaw);
  const monthly = ceilToPolicyStep(monthlyRaw);

  // Ensure monthly is never below single after rounding.
  const monthlyFinal = Math.max(monthly, single);

  return {
    singleTxLimitDecimal: formatMajorLimit(single, currency),
    monthlyLimitDecimal: formatMajorLimit(monthlyFinal, currency),
  };
}
