/**
 * Local fiat deposit rails shown to customers based on signup country.
 */

import { resolvePrimaryFiatCurrency } from './countryPrimaryCurrency.ts';

export interface DepositRailOption {
  code: string;
  label: string;
}

const US_RAILS: DepositRailOption[] = [
  { code: 'US_ACH', label: 'ACH (Automated Clearing House)' },
  { code: 'US_FEDWIRE', label: 'Fedwire bank transfer' },
  { code: 'US_RTP', label: 'RTP / FedNow (real-time)' },
];

const GB_RAILS: DepositRailOption[] = [
  { code: 'GB_FPS', label: 'Faster Payments (FPS)' },
  { code: 'GB_BACS', label: 'BACS bank transfer' },
  { code: 'GB_CHAPS', label: 'CHAPS (same-day sterling)' },
];

const BR_RAILS: DepositRailOption[] = [
  { code: 'BR_PIX', label: 'Pix (SPI instant payment)' },
  { code: 'BR_TED', label: 'TED (same-day transfer)' },
  { code: 'BR_DOC', label: 'DOC (legacy credit transfer)' },
];

const SEPA_RAILS: DepositRailOption[] = [
  { code: 'EU_SEPA_SCT', label: 'SEPA Credit Transfer (SCT)' },
  { code: 'EU_SEPA_INST', label: 'SEPA Instant (SCT Inst)' },
];

const DE_RAILS: DepositRailOption[] = [
  { code: 'DE_SEPA', label: 'SEPA / Bundesbank RPS' },
  { code: 'DE_EBA', label: 'EBA CLEARING (Germany)' },
];

const ES_RAILS: DepositRailOption[] = [
  { code: 'ES_SEPA', label: 'SEPA Credit Transfer' },
  { code: 'ES_IBERPAY', label: 'Iberpay instant transfer' },
];

const XAF_RAILS: DepositRailOption[] = [
  { code: 'CEMAC_BEAC', label: 'BEAC / SYSTAC (CEMAC) bank transfer' },
  { code: 'CEMAC_BRANCH', label: 'Participating local branch deposit' },
];

const XOF_RAILS: DepositRailOption[] = [
  { code: 'WAEMU_BCEAO', label: 'BCEAO / regional bank transfer (UEMOA)' },
  { code: 'WAEMU_BRANCH', label: 'Participating local branch deposit' },
];

const IN_RAILS: DepositRailOption[] = [
  { code: 'IN_UPI', label: 'UPI' },
  { code: 'IN_IMPS', label: 'IMPS' },
  { code: 'IN_NEFT', label: 'NEFT' },
  { code: 'IN_RTGS', label: 'RTGS' },
];

const NG_RAILS: DepositRailOption[] = [
  { code: 'NG_NIP', label: 'NIP (Nigeria Inter-Bank Settlement)' },
  { code: 'NG_BANK', label: 'Local bank transfer' },
];

const AU_RAILS: DepositRailOption[] = [
  { code: 'AU_NPP', label: 'NPP / PayID (real-time)' },
  { code: 'AU_BECS', label: 'BECS direct entry' },
];

const CA_RAILS: DepositRailOption[] = [
  { code: 'CA_EFT', label: 'EFT (Electronic Funds Transfer)' },
  { code: 'CA_INTERAC', label: 'Interac e-Transfer' },
  { code: 'CA_WIRE', label: 'Domestic wire transfer' },
];

const MX_RAILS: DepositRailOption[] = [
  { code: 'MX_SPEI', label: 'SPEI (Banco de México)' },
  { code: 'MX_LOCAL', label: 'Local bank transfer' },
];

const JP_RAILS: DepositRailOption[] = [
  { code: 'JP_ZENGIN', label: 'Zengin System (domestic)' },
  { code: 'JP_FURIKOMI', label: 'Bank furikomi transfer' },
];

const CN_RAILS: DepositRailOption[] = [
  { code: 'CN_CNAPS', label: 'CNAPS / IBPS' },
  { code: 'CN_LOCAL', label: 'Local bank transfer' },
];

const HK_RAILS: DepositRailOption[] = [
  { code: 'HK_FPS', label: 'FPS (Faster Payment System)' },
  { code: 'HK_CHATS', label: 'CHATS (RTGS)' },
];

const SG_RAILS: DepositRailOption[] = [
  { code: 'SG_FAST', label: 'FAST / PayNow' },
  { code: 'SG_GIRO', label: 'GIRO' },
];

const AE_RAILS: DepositRailOption[] = [
  { code: 'AE_UAEFTS', label: 'UAEFTS (UAE Funds Transfer System)' },
  { code: 'AE_LOCAL', label: 'Local bank transfer' },
];

const ZA_RAILS: DepositRailOption[] = [
  { code: 'ZA_EFT', label: 'EFT (electronic funds transfer)' },
  { code: 'ZA_RTC', label: 'RTC (real-time clearing)' },
];

const KE_RAILS: DepositRailOption[] = [
  { code: 'KE_PESALINK', label: 'PesaLink' },
  { code: 'KE_RTGS', label: 'Kenya RTGS' },
];

const KR_RAILS: DepositRailOption[] = [
  { code: 'KR_LOCAL', label: 'Korea Financial Telecommunications transfer' },
];

const TR_RAILS: DepositRailOption[] = [
  { code: 'TR_FAST', label: 'FAST (instant payment)' },
  { code: 'TR_EFT', label: 'EFT / Havale' },
];

const PL_RAILS: DepositRailOption[] = [
  { code: 'PL_ELIXIR', label: 'Elixir (domestic clearing)' },
  { code: 'PL_SEPA', label: 'SEPA transfer' },
];

const CH_RAILS: DepositRailOption[] = [
  { code: 'CH_SIC', label: 'SIC (Swiss Interbank Clearing)' },
  { code: 'CH_SEPA', label: 'SEPA transfer' },
];

const NO_RAILS: DepositRailOption[] = [
  { code: 'NO_NICS', label: 'NICS (Norwegian clearing)' },
];

const SE_RAILS: DepositRailOption[] = [
  { code: 'SE_BANKGIRO', label: 'Bankgiro' },
  { code: 'SE_PLUSGIRO', label: 'Plusgiro' },
];

const DK_RAILS: DepositRailOption[] = [
  { code: 'DK_INTRADAG', label: 'Intradag clearing' },
];

const COUNTRY_DEPOSIT_RAILS: Partial<Record<string, readonly DepositRailOption[]>> = {
  US: US_RAILS,
  AS: US_RAILS,
  GU: US_RAILS,
  MP: US_RAILS,
  PR: US_RAILS,
  VI: US_RAILS,
  UM: US_RAILS,
  GB: GB_RAILS,
  UK: GB_RAILS,
  IM: GB_RAILS,
  JE: GB_RAILS,
  GG: GB_RAILS,
  BR: BR_RAILS,
  DE: DE_RAILS,
  ES: ES_RAILS,
  IN: IN_RAILS,
  NG: NG_RAILS,
  AU: AU_RAILS,
  CC: AU_RAILS,
  CX: AU_RAILS,
  NF: AU_RAILS,
  CA: CA_RAILS,
  MX: MX_RAILS,
  JP: JP_RAILS,
  CN: CN_RAILS,
  HK: HK_RAILS,
  SG: SG_RAILS,
  AE: AE_RAILS,
  ZA: ZA_RAILS,
  KE: KE_RAILS,
  KR: KR_RAILS,
  TR: TR_RAILS,
  PL: PL_RAILS,
  CH: CH_RAILS,
  NO: NO_RAILS,
  SJ: NO_RAILS,
  SE: SE_RAILS,
  DK: DK_RAILS,
  FO: DK_RAILS,
  GL: DK_RAILS,
  CM: XAF_RAILS,
  CF: XAF_RAILS,
  CG: XAF_RAILS,
  TD: XAF_RAILS,
  GQ: XAF_RAILS,
  GA: XAF_RAILS,
  SN: XOF_RAILS,
  CI: XOF_RAILS,
  BF: XOF_RAILS,
  ML: XOF_RAILS,
  NE: XOF_RAILS,
  TG: XOF_RAILS,
  BJ: XOF_RAILS,
  GW: XOF_RAILS,
};

const CURRENCY_DEPOSIT_RAILS: Record<string, readonly DepositRailOption[]> = {
  USD: US_RAILS,
  EUR: SEPA_RAILS,
  GBP: GB_RAILS,
  BRL: BR_RAILS,
  XAF: XAF_RAILS,
  XOF: XOF_RAILS,
  INR: IN_RAILS,
  NGN: NG_RAILS,
  AUD: AU_RAILS,
  CAD: CA_RAILS,
  MXN: MX_RAILS,
  JPY: JP_RAILS,
  CNY: CN_RAILS,
  HKD: HK_RAILS,
  SGD: SG_RAILS,
  AED: AE_RAILS,
  ZAR: ZA_RAILS,
  KES: KE_RAILS,
  KRW: KR_RAILS,
  TRY: TR_RAILS,
  PLN: PL_RAILS,
  CHF: CH_RAILS,
  NOK: NO_RAILS,
  SEK: SE_RAILS,
  DKK: DK_RAILS,
};

const EUROZONE_AND_SEPA_STYLE = new Set([
  'AT',
  'BE',
  'CY',
  'EE',
  'FI',
  'FR',
  'GR',
  'HR',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PT',
  'SI',
  'SK',
  'AD',
  'MC',
  'SM',
  'VA',
  'XK',
  'BL',
  'GF',
  'GP',
  'MF',
  'MQ',
  'PM',
  'RE',
  'YT',
  'EA',
  'IC',
]);

export function resolveDepositCountryCode(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (code === 'UK') return 'GB';
  return code;
}

export function getDepositRailsForCountry(countryCode: string): DepositRailOption[] {
  const code = resolveDepositCountryCode(countryCode);
  const explicit = COUNTRY_DEPOSIT_RAILS[code];
  if (explicit?.length) {
    return [...explicit];
  }
  if (EUROZONE_AND_SEPA_STYLE.has(code)) {
    return [...SEPA_RAILS];
  }
  const fiat = resolvePrimaryFiatCurrency(code);
  const byCurrency = CURRENCY_DEPOSIT_RAILS[fiat];
  if (byCurrency?.length) {
    return [...byCurrency];
  }
  return [
    {
      code: 'LOCAL_BANK',
      label: `Local bank transfer (${fiat})`,
    },
  ];
}

export function isDepositRailAllowedForCountry(countryCode: string, railCode: string): boolean {
  const normalized = railCode.trim().toUpperCase();
  return getDepositRailsForCountry(countryCode).some((rail) => rail.code === normalized);
}
