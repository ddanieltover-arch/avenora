/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Country & Provider Integration Capability Matrix
 *
 * Enforces strict distinction between:
 * 1. Country-format support (mathematical checksum & syntax)
 * 2. Provider technical capability (adapters implemented in software)
 * 3. Provider contractual eligibility (commercial partnership status)
 * 4. Legal permission to offer service (charter/licensing/registration)
 * 5. Production readiness (security audit, operational readiness, SOC2)
 */

import { SupportedCountryCode, IdentifierType } from './CountryTypes.ts';
import { SUPPORTED_COUNTRIES } from './CountryRules.ts';

export type TechnicalAdapterStatus = 'MOCK_ADAPTER_ACTIVE' | 'SANDBOX_READY' | 'LIVE_CONNECTED' | 'UNCONFIGURED';
export type ContractualStatus = 'NO_COMMERCIAL_AGREEMENT' | 'IN_NEGOTIATION' | 'SIGNED_ACTIVE';
export type RegulatoryStatus = 'UNLICENSED_PROTOTYPE' | 'PARTNER_SPONSORED' | 'DIRECTLY_LICENSED';
export type ProductionReadinessStatus = 'BLOCKED_PROTOTYPE_ONLY' | 'READINESS_ASSESSMENT' | 'PRODUCTION_CERTIFIED';

export type FinancialServiceCategory =
  | 'BANK_ACCOUNT_PROVISIONING'
  | 'FIAT_PAYMENT_INITIATION'
  | 'CARD_ISSUANCE'
  | 'IDENTITY_VERIFICATION'
  | 'BITCOIN_CUSTODY'
  | 'FX_SETTLEMENT';

export interface ProviderPrerequisite {
  category: FinancialServiceCategory;
  title: string;
  description: string;
  mandatoryCertifications: string[];
  regulatoryRegistrations: string[];
  operationalRequirements: string[];
  currentStatus: 'UNMET' | 'IN_PROGRESS' | 'SATISFIED';
}

export interface CountryServiceEligibility {
  countryCode: SupportedCountryCode;
  countryName: string;
  currency: string;
  clearingRail: string;
  formatSupported: boolean;
  supportedIdentifierTypes: IdentifierType[];
  serviceCapabilities: Record<
    FinancialServiceCategory,
    {
      technicalStatus: TechnicalAdapterStatus;
      contractualStatus: ContractualStatus;
      regulatoryStatus: RegulatoryStatus;
      productionReadiness: ProductionReadinessStatus;
      notes: string;
    }
  >;
}

export const PROVIDER_INTEGRATION_PREREQUISITES: ProviderPrerequisite[] = [
  {
    category: 'BANK_ACCOUNT_PROVISIONING',
    title: 'Core Depository & Clearing Sponsor Bank Partnership',
    description: 'Direct clearinghouse access or commercial partnership with an authorized depository institution with FBO (For Benefit Of) account structure.',
    mandatoryCertifications: ['SOC 1 Type II (SSAE 18)', 'SOC 2 Type II', 'ISO 27001'],
    regulatoryRegistrations: ['FinCEN MSB (US)', 'FCA Payment Institution / EMI (UK)', 'BaFin ZAG License (DE/EU)', 'BACEN Authorized IP (BR)'],
    operationalRequirements: ['24/7 Liquidity Monitoring', 'Daily Automated Ledger Reconciliation', 'Negative Balance Prevention Safeguards'],
    currentStatus: 'UNMET',
  },
  {
    category: 'FIAT_PAYMENT_INITIATION',
    title: 'Real-Time Clearing Network Direct/Indirect Connectivity',
    description: 'Technical and operational gateway to FedNow/ACH (US), Faster Payments / BACS (UK), SEPA SCT Inst (EU), and PIX SPI (Brazil).',
    mandatoryCertifications: ['FedLine Direct / FedLine Advantage Security Validation', 'ISO 20022 Schema Conformance'],
    regulatoryRegistrations: ['Authorized Payment Initiation Service Provider (PISP)', 'OFAC / Sanctions Screening Automation'],
    operationalRequirements: ['Real-Time Fraud Scoring & AML Velocity Throttles', 'Sub-second Idempotency Registry'],
    currentStatus: 'UNMET',
  },
  {
    category: 'CARD_ISSUANCE',
    title: 'Card Network Principal Membership / Sponsor BIN Agreement',
    description: 'Formal card program agreement with Visa or Mastercard, BIN range assignment, and Certified Card Management System (CMS).',
    mandatoryCertifications: ['PCI-DSS Level 1 Service Provider Certification', 'EMVCo 3-D Secure (3DS 2.2) ACS Certification', 'Visa VTS / Mastercard MDES Tokenization'],
    regulatoryRegistrations: ['Prepaid / Debit Card Program Manager Filing'],
    operationalRequirements: ['HSM (Hardware Security Module) Pin & Key Cryptography', 'Real-time 150ms Authorization Engine SLA'],
    currentStatus: 'UNMET',
  },
  {
    category: 'IDENTITY_VERIFICATION',
    title: 'Certified Identity Service Provider (IDSP) Integration',
    description: 'Regulated biometric and document verification gateway with access to authoritative government registers.',
    mandatoryCertifications: ['eIDAS High / Substantial Conformance (EU)', 'NIST SP 800-63-3 IAL2 / AAL2', 'SOC 2 Type II'],
    regulatoryRegistrations: ['GDPR Article 28 Data Processing Agreement', 'State Biometric Information Privacy Act (BIPA) Compliance'],
    operationalRequirements: ['Secure Document Vault with Client-Side Encryption', 'Mandatory 4-Eyes Compliance Review Queue'],
    currentStatus: 'UNMET',
  },
  {
    category: 'BITCOIN_CUSTODY',
    title: 'Institutional Qualified Custodian Designation',
    description: 'Segregated cold storage vault, Multi-Party Computation (MPC), and hot-wallet liquidity provider.',
    mandatoryCertifications: ['Cryptocurrency Security Standard (CCSS) Level 3', 'SOC 2 Type II with Custody Controls Addendum'],
    regulatoryRegistrations: ['NYDFS BitLicense or Limited Purpose Trust Charter', 'FinCEN Money Services Business (MSB) Convertible Virtual Currency'],
    operationalRequirements: ['Quorum-Governed Multi-Sig Timelock Withdrawals', 'Comprehensive Specie / Crime Insurance Policy ($50M+ Coverage)'],
    currentStatus: 'UNMET',
  },
  {
    category: 'FX_SETTLEMENT',
    title: 'Institutional Wholesale FX Liquidity & ISDA Master Agreement',
    description: 'Credit facility and multi-currency settlement clearing accounts with Tier 1 liquidity providers.',
    mandatoryCertifications: ['FX Global Code of Conduct Signatory', 'ISO 20022 Real-Time Settlement Engine'],
    regulatoryRegistrations: ['Commodity Futures Trading Commission (CFTC) / NFA Registration (US)', 'MiFID II Investment Firm / MTF (EU)'],
    operationalRequirements: ['Real-Time Slippage Monitoring & Maximum Spread Caps', 'Dual-Leg Settlement Risk Mitigation (PvP via CLS)'],
    currentStatus: 'UNMET',
  },
];

export const COUNTRY_PROVIDER_CAPABILITY_MATRIX: CountryServiceEligibility[] = [
  {
    countryCode: 'US',
    countryName: 'United States',
    currency: 'USD',
    clearingRail: 'FedACH / FedNow / RTP',
    formatSupported: true,
    supportedIdentifierTypes: ['BANK_ACCOUNT', 'TAX_ID', 'PAYMENT_CARD'],
    serviceCapabilities: {
      BANK_ACCOUNT_PROVISIONING: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Simulated Federal Reserve 021000021 routing supported. Production requires Sponsor Bank FBO agreement and FinCEN MSB registration.',
      },
      FIAT_PAYMENT_INITIATION: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Mock ACH clearance implemented. Live FedACH/FedNow settlement disabled by environment guard.',
      },
      CARD_ISSUANCE: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Simulated Visa/Mastercard BIN generation with Luhn check. Requires PCI-DSS Level 1 and Issuer Processor contract.',
      },
      IDENTITY_VERIFICATION: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Synthetic SSN validation and admin approval workflow active. Live KYC provider adapter not connected.',
      },
      BITCOIN_CUSTODY: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Prototype address allocation and ledger tracking active. Production requires institutional qualified custodian.',
      },
      FX_SETTLEMENT: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Algorithmic zero-float FX quoting active. Live interbank FX delivery unconfigured.',
      },
    },
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    currency: 'GBP',
    clearingRail: 'Faster Payments (FPS) / BACS / CHAPS',
    formatSupported: true,
    supportedIdentifierTypes: ['BANK_ACCOUNT', 'IBAN', 'SORT_CODE', 'TAX_ID', 'PAYMENT_CARD'],
    serviceCapabilities: {
      BANK_ACCOUNT_PROVISIONING: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'UK Sort Code and Account Number generation with GB IBAN active. Requires FCA Authorised Payment Institution (API) license.',
      },
      FIAT_PAYMENT_INITIATION: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Faster Payments simulation active. Live Pay.UK settlement disabled.',
      },
      CARD_ISSUANCE: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Virtual card issuance simulated. Requires UK BIN sponsorship.',
      },
      IDENTITY_VERIFICATION: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Manual compliance review queue active. UK IDSP integration unconfigured.',
      },
      BITCOIN_CUSTODY: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Segregated ledger balance simulation active. Requires FCA MLR crypto registration.',
      },
      FX_SETTLEMENT: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'GBP/USD and GBP/EUR cross-rate quoting active in prototype mode.',
      },
    },
  },
  {
    countryCode: 'ES',
    countryName: 'Spain (Eurozone)',
    currency: 'EUR',
    clearingRail: 'SEPA Credit Transfer (SCT) / SCT Inst / Iberpay',
    formatSupported: true,
    supportedIdentifierTypes: ['BANK_ACCOUNT', 'IBAN', 'TAX_ID', 'PAYMENT_CARD'],
    serviceCapabilities: {
      BANK_ACCOUNT_PROVISIONING: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Banco de España CCC and ES IBAN active. Requires Banco de España EDE / Payment Institution passport.',
      },
      FIAT_PAYMENT_INITIATION: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'SEPA instant transfer simulation active. Live TARGET2/TIPS clearing unconfigured.',
      },
      CARD_ISSUANCE: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Spanish virtual card simulation active. Requires EU BIN sponsor.',
      },
      IDENTITY_VERIFICATION: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Spanish DNI modulo 23 format validation active. Sepblac video-identification partner not connected.',
      },
      BITCOIN_CUSTODY: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Prototype ledger balances only. Requires MiCA CASP (Crypto-Asset Service Provider) authorization.',
      },
      FX_SETTLEMENT: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'EUR exchange simulation active.',
      },
    },
  },
  {
    countryCode: 'DE',
    countryName: 'Germany (Eurozone)',
    currency: 'EUR',
    clearingRail: 'SEPA / Bundesbank RPS / EBA CLEARING',
    formatSupported: true,
    supportedIdentifierTypes: ['BANK_ACCOUNT', 'IBAN', 'TAX_ID', 'PAYMENT_CARD'],
    serviceCapabilities: {
      BANK_ACCOUNT_PROVISIONING: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Bundesbank BLZ and DE IBAN active. Requires BaFin ZAG license or German partner bank.',
      },
      FIAT_PAYMENT_INITIATION: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'SEPA clearing simulation active.',
      },
      CARD_ISSUANCE: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Virtual Mastercard simulation active with German country code.',
      },
      IDENTITY_VERIFICATION: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Steuer-ID 11-digit syntax validation active. BaFin-compliant GwG Video-Ident unconfigured.',
      },
      BITCOIN_CUSTODY: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Simulated Bitcoin custody active. Requires BaFin Kryptoverwahrgeschäft license in Germany.',
      },
      FX_SETTLEMENT: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Internal fixed-point FX calculations active in prototype mode.',
      },
    },
  },
  {
    countryCode: 'BR',
    countryName: 'Brazil',
    currency: 'BRL',
    clearingRail: 'PIX (SPI) / TED / STR (Banco Central do Brasil)',
    formatSupported: true,
    supportedIdentifierTypes: ['BANK_ACCOUNT', 'TAX_ID', 'PIX_KEY', 'PAYMENT_CARD'],
    serviceCapabilities: {
      BANK_ACCOUNT_PROVISIONING: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Banco do Brasil Agência/Conta formatting active. Requires BACEN Instituição de Pagamento authorization.',
      },
      FIAT_PAYMENT_INITIATION: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Pix instant payment simulation active. Direct participant SPI gateway unconfigured.',
      },
      CARD_ISSUANCE: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Simulated virtual card issuance with BRL settlement currency.',
      },
      IDENTITY_VERIFICATION: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'Receita Federal CPF modulo 11 algorithm active. Receita Federal official API bridge unconfigured.',
      },
      BITCOIN_CUSTODY: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'BTC simulated custody active. Requires BACEN Lei nº 14.478/2022 VASP registration in Brazil.',
      },
      FX_SETTLEMENT: {
        technicalStatus: 'MOCK_ADAPTER_ACTIVE',
        contractualStatus: 'NO_COMMERCIAL_AGREEMENT',
        regulatoryStatus: 'UNLICENSED_PROTOTYPE',
        productionReadiness: 'BLOCKED_PROTOTYPE_ONLY',
        notes: 'BRL cross-currency simulated rates active. Câmbio commercial license unconfigured.',
      },
    },
  },
];
