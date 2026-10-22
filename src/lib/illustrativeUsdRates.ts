/**
 * @license Apache-2.0
 * Approximate units of local currency per 1 USD (illustrative / prototype FX).
 * Used to convert USD-anchored policy amounts into account currencies.
 */

/** Local major units received for 1 USD. */
export const LOCAL_UNITS_PER_USD: Record<string, number> = {
  AED: 3.67,
  AFN: 70,
  ALL: 93,
  AMD: 390,
  ANG: 1.79,
  AOA: 830,
  ARS: 870,
  AUD: 1.53,
  AWG: 1.79,
  AZN: 1.7,
  BAM: 1.8,
  BBD: 2,
  BDT: 110,
  BGN: 1.8,
  BHD: 0.377,
  BIF: 2870,
  BMD: 1,
  BND: 1.34,
  BOB: 6.9,
  BRL: 5.45,
  BSD: 1,
  BWP: 13.5,
  BYR: 3.2, // legacy code; treat like BYN scale for prototype
  BYN: 3.2,
  BZD: 2,
  CAD: 1.36,
  CDF: 2800,
  CHF: 0.88,
  CLP: 940,
  CNY: 7.24,
  COP: 3950,
  CRC: 520,
  CUP: 24,
  CVE: 101,
  CZK: 23,
  DJF: 178,
  DKK: 6.9,
  DOP: 59,
  DZD: 134,
  EGP: 48,
  ERN: 15,
  ETB: 57,
  EUR: 0.92,
  FJD: 2.25,
  FKP: 0.79,
  GBP: 0.79,
  GEL: 2.7,
  GHS: 15.5,
  GIP: 0.79,
  GMD: 68,
  GNF: 8600,
  GTQ: 7.75,
  GYD: 209,
  HKD: 7.82,
  HNL: 24.7,
  HRK: 6.9,
  HTG: 132,
  HUF: 360,
  IDR: 15800,
  ILS: 3.7,
  INR: 83.5,
  IQD: 1310,
  IRR: 42000,
  ISK: 138,
  JMD: 156,
  JOD: 0.709,
  JPY: 149,
  KES: 129,
  KGS: 89,
  KHR: 4100,
  KMF: 450,
  KPW: 900,
  KRW: 1350,
  KWD: 0.308,
  KYD: 0.82,
  KZT: 450,
  LAK: 21500,
  LBP: 89500,
  LKR: 300,
  LRD: 193,
  LSL: 18.5,
  LYD: 4.8,
  MAD: 9.9,
  MDL: 17.7,
  MGA: 4500,
  MKD: 56.5,
  MMK: 2100,
  MNT: 3400,
  MOP: 8.05,
  MRO: 39, // legacy
  MRU: 39.5,
  MUR: 46,
  MVR: 15.4,
  MWK: 1730,
  MXN: 17.1,
  MYR: 4.7,
  MZN: 63.5,
  NAD: 18.5,
  NGN: 1550,
  NIO: 36.7,
  NOK: 10.7,
  NPR: 133,
  NZD: 1.66,
  OMR: 0.385,
  PAB: 1,
  PEN: 3.75,
  PGK: 3.9,
  PHP: 58,
  PKR: 278,
  PLN: 3.95,
  PYG: 7500,
  QAR: 3.64,
  RON: 4.57,
  RSD: 108,
  RUB: 92,
  RWF: 1300,
  SAR: 3.75,
  SBD: 8.4,
  SCR: 13.5,
  SDG: 600,
  SEK: 10.5,
  SGD: 1.34,
  SHP: 0.79,
  SLL: 21000, // legacy Leone
  SLE: 22.5,
  SOS: 570,
  SRD: 35,
  SSP: 1300,
  STD: 22200, // legacy
  STN: 22.5,
  SYP: 13000,
  SZL: 18.5,
  THB: 35.5,
  TJS: 10.9,
  TMT: 3.5,
  TND: 3.1,
  TOP: 2.35,
  TRY: 32.5,
  TTD: 6.78,
  TWD: 32,
  TZS: 2650,
  UAH: 41,
  UGX: 3750,
  USD: 1,
  UYU: 39,
  UZS: 12600,
  VEF: 36, // treat as VES-scale for prototype
  VES: 36,
  VND: 25400,
  VUV: 120,
  WST: 2.75,
  XAF: 600,
  XCD: 2.7,
  XOF: 600,
  XPF: 110,
  YER: 250,
  ZAR: 18.5,
  ZMW: 26.5,
  ZWL: 13,
};

/** USD value of one major unit of the given currency. */
export function illustrativeUsdPerLocalUnit(currency: string): number {
  const code = currency.trim().toUpperCase();
  if (!code || code === 'USD') return 1;
  if (code === 'BTC') return 68_500;

  const localPerUsd = LOCAL_UNITS_PER_USD[code];
  if (localPerUsd && localPerUsd > 0) {
    return 1 / localPerUsd;
  }

  // Unknown fiat: leave at USD parity only as last resort.
  return 1;
}

/** Local major units for 1 USD (inverse of usd-per-unit). */
export function illustrativeLocalUnitsPerUsd(currency: string): number {
  const code = currency.trim().toUpperCase();
  if (!code || code === 'USD') return 1;
  if (code === 'BTC') return 1 / 68_500;

  const localPerUsd = LOCAL_UNITS_PER_USD[code];
  if (localPerUsd && localPerUsd > 0) return localPerUsd;

  return 1;
}
