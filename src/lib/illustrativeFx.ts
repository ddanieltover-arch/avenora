/**
 * @license Apache-2.0
 * Client-side illustrative FX (matches wallet.service demo triangulation).
 */

import { getCurrency } from '../domain/money/Currency.ts';

const DEMO_RATES: Record<string, number> = {
  USD_EUR: 0.92,
  EUR_USD: 1.087,
  USD_BRL: 5.45,
  BRL_USD: 0.183,
  EUR_BRL: 5.92,
  BRL_EUR: 0.169,
  BTC_USD: 68500.0,
  USD_BTC: 0.0000146,
  BTC_EUR: 63000.0,
  EUR_BTC: 0.0000158,
  BTC_BRL: 373000.0,
  BRL_BTC: 0.00000268,
  USD_GBP: 0.79,
  GBP_USD: 1.265,
  EUR_GBP: 0.86,
  GBP_EUR: 1.163,
  GBP_BRL: 6.85,
  BRL_GBP: 0.146,
  BTC_GBP: 54000.0,
  GBP_BTC: 0.0000185,
};

function illustrativeUsdPerUnit(currency: string): number {
  const code = currency.toUpperCase();
  if (code === 'USD') return 1;
  if (code === 'BTC') return 68_500;

  const directToUsd = DEMO_RATES[`${code}_USD`];
  if (directToUsd) return directToUsd;

  const usdToCode = DEMO_RATES[`USD_${code}`];
  if (usdToCode && usdToCode > 0) return 1 / usdToCode;

  return 1;
}

export function resolveIllustrativeRate(sourceCurrency: string, destinationCurrency: string): number {
  const source = sourceCurrency.toUpperCase();
  const dest = destinationCurrency.toUpperCase();
  if (source === dest) return 1;

  const direct = DEMO_RATES[`${source}_${dest}`];
  if (direct) return direct;

  const inverse = DEMO_RATES[`${dest}_${source}`];
  if (inverse && inverse > 0) return 1 / inverse;

  const usdPerSource = illustrativeUsdPerUnit(source);
  const usdPerDest = illustrativeUsdPerUnit(dest);
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
