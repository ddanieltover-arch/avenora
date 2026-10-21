/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Country-Aware Identifiers Domain Types
 */

export type SupportedCountryCode = 'US' | 'GB' | 'ES' | 'DE' | 'BR';

export type IdentifierType =
  | 'BANK_ACCOUNT'
  | 'IBAN'
  | 'SORT_CODE'
  | 'TAX_ID'
  | 'PAYMENT_CARD'
  | 'PIX_KEY';

export interface CountryIdentifierResult {
  countryCode: SupportedCountryCode;
  type: IdentifierType;
  /**
   * Fully formatted customer-facing representation (e.g. ES91 2100 ..., 123-45-6789, 021000021).
   */
  formattedValue: string;
  /**
   * Normalized raw unspaced value for validation and storage index.
   */
  rawValue: string;
  /**
   * Masked value for display where sensitive access control is required.
   */
  maskedValue: string;
  /**
   * Country-specific sub-components (e.g. routing number, sort code, branch, control digits).
   */
  components: Record<string, string>;
  /**
   * Prototype boundary flag.
   */
  isSimulated: boolean;
  /**
   * Source attribution: generated internally by deterministic synthetic rules,
   * provisioned via a mock/sandbox provider adapter, or issued by an authorized live partner.
   */
  source?: 'SYNTHETIC_GENERATOR' | 'MOCK_PROVIDER' | 'AUTHORIZED_PROVIDER';
  /**
   * External provider reference if provisioned through an authorized live/sandbox banking partner.
   */
  providerReference?: {
    providerCode: string;
    externalId: string;
    contractRef?: string;
    provisionedAt: Date;
  };
  /**
   * Explicit notice for UI, APIs, and exports.
   */
  disclaimer: string;
  /**
   * Timestamp of generation.
   */
  generatedAt: Date;
}

export interface IdentifierValidationResult {
  isValid: boolean;
  countryCode?: SupportedCountryCode;
  type: IdentifierType;
  error?: string;
  details?: Record<string, any>;
}

export interface IIdentifierProvider {
  name: string;
  isLive: boolean;
  generateIdentifier(params: {
    countryCode: SupportedCountryCode;
    type: IdentifierType;
    accountHolderName?: string;
    currency?: string;
  }): Promise<CountryIdentifierResult>;
  validateIdentifier(params: {
    countryCode: SupportedCountryCode;
    type: IdentifierType;
    value: string;
  }): IdentifierValidationResult;
  /**
   * Requests an identifier from an authorized external provider adapter.
   * If the external provider fails or is unconfigured, this MUST NOT silently fall back to synthetic generator!
   */
  provisionFromProvider?(params: {
    countryCode: SupportedCountryCode;
    type: IdentifierType;
    accountHolderName: string;
    currency: string;
    idempotencyKey: string;
    correlationId: string;
  }): Promise<CountryIdentifierResult>;
}
