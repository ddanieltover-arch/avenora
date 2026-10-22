/**
 * @license Apache-2.0
 * Client-side illustrative FX (matches wallet.service demo triangulation).
 */

import { getCurrency } from '../domain/money/Currency.ts';
import {
  illustrativeLocalUnitsPerUsd,
  illustrativeUsdPerLocalUnit,
  LOCAL_UNITS_PER_USD,
} from './illustrativeUsdRates.ts';

const DEMO_PAIR_OVERRIDES: Record<string, number> = {
  USD_EUR: LOCAL_UNITS_PER_USD.EUR,
  EUR_USD: 1 / LOCAL_UNITS_PER_USD.EUR,
  USD_BRL: LOCAL_UNITS_PER_USD.BRL,
  BRL_USD: 1 / LOCAL_UNITS_PER_USD.BRL,
  USD_GBP: LOCAL_UNITS_PER_USD.GBP,
  GBP_USD: 1 / LOCAL_UNITS_PER_USD.GBP,
  BTC_USD: 68500.0,
  USD_BTC: 1 / 68500.0,
};

function illustrativeUsdPerUnit(currency: string): number {
  return illustrativeUsdPerLocalUnit(currency);
}

export function resolveIllustrativeRate(sourceCurrency: string, destinationCurrency: string): number {
  const source = sourceCurrency.toUpperCase();
  const dest = destinationCurrency.toUpperCase();
  if (source === dest) return 1;

  const direct = DEMO_PAIR_OVERRIDES[`${source}_${dest}`];
  if (direct) return direct;

  const inverse = DEMO_PAIR_OVERRIDES[`${dest}_${source}`];
  if (inverse && inverse > 0) return 1 / inverse;

  // Prefer USD→local table when converting from USD.
  if (source === 'USD') {
    return illustrativeLocalUnitsPerUsd(dest);
  }
  if (dest === 'USD') {
    return illustrativeUsdPerUnit(source);
  }

  const usdPerSource = illustrativeUsdPerUnit(source);
  const usdPerDest = illustrativeUsdPerUnit(dest);
  if (usdPerDest <= 0) return 1;
  return usdPerSource / usdPerDest;
}

export function walletAvailableMajor(account: {
  currency?: string;
  currencyCode?: string;
  availableBalanceMinor?: string;
  balanceMinor?: string;
}): number {
  const code = (account.currency || account.currencyCode || 'USD').toUpperCase();
  const def = getCurrency(code);
  const minor = Number(account.availableBalanceMinor || account.balanceMinor || 0);
  if (!Number.isFinite(minor)) return 0;
  return minor / 10 ** def.minorUnits;
}

export function walletHoldMajor(account: {
  currency?: string;
  currencyCode?: string;
  pendingHoldMinor?: string;
}): number {
  const code = (account.currency || account.currencyCode || 'USD').toUpperCase();
  const def = getCurrency(code);
  const minor = Number(account.pendingHoldMinor || 0);
  if (!Number.isFinite(minor)) return 0;
  return minor / 10 ** def.minorUnits;
}

/** Sum wallet balances converted into a single display currency. */
export function portfolioValueMajor(
  accounts: Array<{
    currency?: string;
    currencyCode?: string;
    availableBalanceMinor?: string;
    balanceMinor?: string;
  }>,
  targetCurrency: string,
): number {
  const target = targetCurrency.toUpperCase();
  return accounts.reduce((sum, account) => {
    const code = (account.currency || account.currencyCode || '').toUpperCase();
    if (!code) return sum;
    const major = walletAvailableMajor(account);
    return sum + major * resolveIllustrativeRate(code, target);
  }, 0);
}

/** Sum pending holds converted into a single display currency. */
export function portfolioHoldMajor(
  accounts: Array<{
    currency?: string;
    currencyCode?: string;
    pendingHoldMinor?: string;
  }>,
  targetCurrency: string,
): number {
  const target = targetCurrency.toUpperCase();
  return accounts.reduce((sum, account) => {
    const code = (account.currency || account.currencyCode || '').toUpperCase();
    if (!code) return sum;
    const major = walletHoldMajor(account);
    return sum + major * resolveIllustrativeRate(code, target);
  }, 0);
}

export function formatMajorBalance(major: number, currencyCode: string): string {
  const code = currencyCode.toUpperCase();
  const def = getCurrency(code);
  const fractionDigits = def.minorUnits === 0 ? 0 : def.isCrypto ? 8 : 2;
  const formatted = major.toLocaleString(undefined, {
    minimumFractionDigits: def.isCrypto ? 8 : fractionDigits,
    maximumFractionDigits: def.isCrypto ? 8 : fractionDigits,
  });
  return `${def.symbol}${formatted} ${code}`;
}

export function formatIllustrativeEquivalent(
  amountMajor: number,
  fromCurrency: string,
  toCurrency: string,
): string {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (from === to) return formatMajorBalance(amountMajor, to);
  const converted = amountMajor * resolveIllustrativeRate(from, to);
  return formatMajorBalance(converted, to);
}

/** Convert a major-unit fiat amount into a BTC decimal string (8 places) for ledger/API use. */
export function fiatMajorToBtcDecimal(amountMajor: number, fromCurrency: string): string {
  if (!Number.isFinite(amountMajor) || amountMajor <= 0) {
    throw new Error('Amount must be a positive number.');
  }
  const btcMajor = amountMajor * resolveIllustrativeRate(fromCurrency, 'BTC');
  if (!Number.isFinite(btcMajor) || btcMajor <= 0) {
    throw new Error('Could not convert amount to Bitcoin.');
  }
  // Floor to 8 decimals so we never overstate the BTC to send.
  const sats = Math.floor(btcMajor * 1e8 + 1e-9);
  if (sats <= 0) {
    throw new Error('Converted Bitcoin amount is too small. Increase the fiat amount.');
  }
  const fixed = (sats / 1e8).toFixed(8);
  return fixed.replace(/\.?0+$/, '');
}

/** Parse a user amount string; returns null if invalid/non-positive. */
export function parsePositiveMajorAmount(amountDecimal: string): number | null {
  const trimmed = amountDecimal.trim().replace(/,/g, '');
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function customerFiatBtcPair(primaryFiat: string): { fiat: string; btc: 'BTC' } {
  return { fiat: primaryFiat.toUpperCase(), btc: 'BTC' };
}
