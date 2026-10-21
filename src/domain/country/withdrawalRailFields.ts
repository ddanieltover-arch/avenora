/**
 * Withdrawal payout fields by local rail (mirrors deposit rails for country/method selection).
 */

import {
  getDepositRailsForCountry,
  isDepositRailAllowedForCountry,
  type DepositRailOption,
} from './countryDepositRails.ts';

export type WithdrawalFieldType = 'text' | 'select';

export interface WithdrawalFieldDefinition {
  key: string;
  label: string;
  placeholder?: string;
  type?: WithdrawalFieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export function getWithdrawalRailsForCountry(countryCode: string): DepositRailOption[] {
  return getDepositRailsForCountry(countryCode);
}

export function isWithdrawalRailAllowedForCountry(countryCode: string, railCode: string): boolean {
  return isDepositRailAllowedForCountry(countryCode, railCode);
}

const ACCOUNT_HOLDER: WithdrawalFieldDefinition = {
  key: 'accountHolderName',
  label: 'Account holder name',
  placeholder: 'Full legal name',
  required: true,
};

const US_BANK_FIELDS: WithdrawalFieldDefinition[] = [
  ACCOUNT_HOLDER,
  { key: 'bankName', label: 'Bank name', placeholder: 'Receiving bank', required: true },
  { key: 'routingNumber', label: 'Routing number (ABA)', placeholder: '9 digits', required: true },
  { key: 'accountNumber', label: 'Account number', placeholder: 'Account number', required: true },
  {
    key: 'accountType',
    label: 'Account type',
    type: 'select',
    required: true,
    options: [
      { value: 'CHECKING', label: 'Checking' },
      { value: 'SAVINGS', label: 'Savings' },
    ],
  },
];

const SEPA_FIELDS: WithdrawalFieldDefinition[] = [
  { key: 'beneficiaryName', label: 'Beneficiary name', placeholder: 'Full legal name', required: true },
  { key: 'iban', label: 'IBAN', placeholder: 'DE89 3704 0044 0532 0130 00', required: true },
  { key: 'bic', label: 'BIC / SWIFT', placeholder: 'COBADEFFXXX', required: true },
];

const GB_FIELDS: WithdrawalFieldDefinition[] = [
  ACCOUNT_HOLDER,
  { key: 'sortCode', label: 'Sort code', placeholder: '00-00-00', required: true },
  { key: 'accountNumber', label: 'Account number', placeholder: '8 digits', required: true },
];

const BR_PIX_FIELDS: WithdrawalFieldDefinition[] = [
  ACCOUNT_HOLDER,
  {
    key: 'pixKeyType',
    label: 'Pix key type',
    type: 'select',
    required: true,
    options: [
      { value: 'CPF', label: 'CPF' },
      { value: 'CNPJ', label: 'CNPJ' },
      { value: 'EMAIL', label: 'Email' },
      { value: 'PHONE', label: 'Phone' },
      { value: 'RANDOM', label: 'Random key' },
    ],
  },
  { key: 'pixKey', label: 'Pix key', placeholder: 'Your Pix key', required: true },
];

const BR_BANK_FIELDS: WithdrawalFieldDefinition[] = [
  ACCOUNT_HOLDER,
  { key: 'bankName', label: 'Bank name', required: true },
  { key: 'branchCode', label: 'Branch (agência)', required: true },
  { key: 'accountNumber', label: 'Account number', required: true },
  { key: 'cpfCnpj', label: 'CPF or CNPJ', required: true },
];

const IN_UPI_FIELDS: WithdrawalFieldDefinition[] = [
  ACCOUNT_HOLDER,
  { key: 'upiId', label: 'UPI ID', placeholder: 'name@bank', required: true },
];

const IN_BANK_FIELDS: WithdrawalFieldDefinition[] = [
  ACCOUNT_HOLDER,
  { key: 'accountNumber', label: 'Account number', required: true },
  { key: 'ifsc', label: 'IFSC code', placeholder: 'SBIN0001234', required: true },
];

const GENERIC_BANK_FIELDS: WithdrawalFieldDefinition[] = [
  ACCOUNT_HOLDER,
  { key: 'bankName', label: 'Bank name', required: true },
  { key: 'accountNumber', label: 'Account number', required: true },
  { key: 'swiftOrRouting', label: 'SWIFT / BIC / routing reference', required: true },
];

export function getWithdrawalFieldsForRail(railCode: string): WithdrawalFieldDefinition[] {
  const code = railCode.trim().toUpperCase();

  if (code === 'BR_PIX') return BR_PIX_FIELDS;
  if (code.startsWith('BR_')) return BR_BANK_FIELDS;
  if (code.startsWith('US_')) return US_BANK_FIELDS;
  if (code.startsWith('GB_')) return GB_FIELDS;
  if (
    code.startsWith('EU_') ||
    code.startsWith('DE_') ||
    code.startsWith('ES_') ||
    code === 'PL_SEPA' ||
    code === 'CH_SEPA'
  ) {
    return SEPA_FIELDS;
  }
  if (code === 'IN_UPI') return IN_UPI_FIELDS;
  if (code.startsWith('IN_')) return IN_BANK_FIELDS;
  if (code.startsWith('AU_')) {
    return [
      ACCOUNT_HOLDER,
      { key: 'bsb', label: 'BSB', placeholder: '000-000', required: true },
      { key: 'accountNumber', label: 'Account number', required: true },
      { key: 'payId', label: 'PayID (optional)', required: false },
    ];
  }
  if (code.startsWith('CA_')) {
    return [
      ACCOUNT_HOLDER,
      { key: 'institutionNumber', label: 'Institution number', required: true },
      { key: 'transitNumber', label: 'Transit number', required: true },
      { key: 'accountNumber', label: 'Account number', required: true },
    ];
  }

  return GENERIC_BANK_FIELDS;
}

export function validateWithdrawalBankingDetails(
  railCode: string,
  details: Record<string, string>,
): void {
  const fields = getWithdrawalFieldsForRail(railCode);
  for (const field of fields) {
    if (!field.required) continue;
    const value = (details[field.key] ?? '').trim();
    if (!value) {
      throw new Error(`${field.label} is required for this withdrawal method.`);
    }
  }
}

const BTC_ADDRESS_MIN = 14;
const BTC_ADDRESS_MAX = 90;

export function validateBtcWithdrawalAddress(address: string): void {
  const trimmed = address.trim();
  if (trimmed.length < BTC_ADDRESS_MIN || trimmed.length > BTC_ADDRESS_MAX) {
    throw new Error('Enter a valid Bitcoin withdrawal address.');
  }
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    throw new Error('Bitcoin address must contain only letters and numbers.');
  }
}
