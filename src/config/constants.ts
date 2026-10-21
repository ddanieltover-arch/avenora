/**
 * @license Apache-2.0
 * Avenora Fintech Platform — System Constants & Corridors
 */

export const PLATFORM_METADATA = {
  NAME: 'Avenora',
  VERSION: '0.1.0-phase01',
  RELEASE_CODENAME: 'FOUNDATION_CORE',
  PROTOTYPE_MODE: true,
  LIVE_MONEY_ENABLED: false,
} as const;

/** Custodial BTC deposit address shown to customers (admin-operated). */
export const PLATFORM_BTC_DEPOSIT_ADDRESS =
  'bc1qavenora0platformcustodydepositaddress000000000000000';

export const PLATFORM_DEPOSIT_SUPPORT_EMAIL = 'support@avenorabank.com';

export const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States', defaultCurrency: 'USD', status: 'SANDBOX_PROTOTYPE' },
  { code: 'BR', name: 'Brazil', defaultCurrency: 'BRL', status: 'SANDBOX_PROTOTYPE' },
  { code: 'EU', name: 'European Union Corridor', defaultCurrency: 'EUR', status: 'SANDBOX_PROTOTYPE' },
] as const;

export const SYSTEM_CHART_OF_ACCOUNTS = {
  // Asset Accounts (1000s)
  SAFEGUARDING_CASH_USD: {
    accountNumber: '1010-USD-SAFEGUARD',
    name: 'Safeguarding Vault - USD Treasury',
    type: 'ASSET' as const,
    classification: 'SYSTEM_SAFEGUARDING_ASSET' as const,
    currency: 'USD',
  },
  SAFEGUARDING_CASH_EUR: {
    accountNumber: '1010-EUR-SAFEGUARD',
    name: 'Safeguarding Vault - EUR Treasury',
    type: 'ASSET' as const,
    classification: 'SYSTEM_SAFEGUARDING_ASSET' as const,
    currency: 'EUR',
  },
  SAFEGUARDING_CASH_BRL: {
    accountNumber: '1010-BRL-SAFEGUARD',
    name: 'Safeguarding Vault - BRL Reserve',
    type: 'ASSET' as const,
    classification: 'SYSTEM_SAFEGUARDING_ASSET' as const,
    currency: 'BRL',
  },
  SAFEGUARDING_CRYPTO_BTC: {
    accountNumber: '1050-BTC-COLD-VAULT',
    name: 'Bitcoin Multi-Sig Cold Storage Vault',
    type: 'ASSET' as const,
    classification: 'SYSTEM_SAFEGUARDING_ASSET' as const,
    currency: 'BTC',
  },

  // Clearing / In-flight (1500s)
  PROVIDER_CLEARING_USD: {
    accountNumber: '1510-USD-CLEARING',
    name: 'ACH / FedNow Provider Clearing',
    type: 'ASSET' as const,
    classification: 'SYSTEM_PROVIDER_CLEARING' as const,
    currency: 'USD',
  },

  // Customer Liabilities (2000s)
  CUSTOMER_LIABILITY_USD: {
    accountNumber: '2010-USD-CUSTOMER-DEPOSITS',
    name: 'Customer Wallets - Available USD',
    type: 'LIABILITY' as const,
    classification: 'CUSTOMER_AVAILABLE_BALANCE' as const,
    currency: 'USD',
  },
  CUSTOMER_LIABILITY_EUR: {
    accountNumber: '2010-EUR-CUSTOMER-DEPOSITS',
    name: 'Customer Wallets - Available EUR',
    type: 'LIABILITY' as const,
    classification: 'CUSTOMER_AVAILABLE_BALANCE' as const,
    currency: 'EUR',
  },
  CUSTOMER_LIABILITY_BRL: {
    accountNumber: '2010-BRL-CUSTOMER-DEPOSITS',
    name: 'Customer Wallets - Available BRL',
    type: 'LIABILITY' as const,
    classification: 'CUSTOMER_AVAILABLE_BALANCE' as const,
    currency: 'BRL',
  },
  CUSTOMER_LIABILITY_BTC: {
    accountNumber: '2050-BTC-CUSTOMER-BALANCES',
    name: 'Customer Wallets - Custodied Bitcoin',
    type: 'LIABILITY' as const,
    classification: 'CUSTOMER_AVAILABLE_BALANCE' as const,
    currency: 'BTC',
  },

  // Revenue Accounts (4000s)
  FEE_REVENUE_FX: {
    accountNumber: '4010-FX-SPREAD-REVENUE',
    name: 'Platform FX Spread & Conversion Fees',
    type: 'REVENUE' as const,
    classification: 'SYSTEM_FEE_REVENUE' as const,
    currency: 'USD',
  },
} as const;
