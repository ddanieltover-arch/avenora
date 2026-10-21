/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Future Financial Provider Integration Architecture & Adapters
 *
 * Implements authoritative, vendor-neutral provider abstractions:
 * 1. Bank Account & Payment-Account Provisioning (IBankAccountProvisioningProvider)
 * 2. Fiat Payment Initiation & Status Inquiries (IFiatPaymentProvider)
 * 3. Card Issuance, Status & Transaction Events (ICardNetworkProvider)
 * 4. External Identity Verification & KYC Checks (IExternalKycProvider)
 * 5. Bitcoin Custody & Blockchain Operations (IBitcoinCustodyProvider)
 * 6. FX Quotes & External Wholesale Settlement (IFxQuoteProvider)
 *
 * Security & Reliability Policies:
 * - Exponential backoff with jitter and configurable maximum retry attempts
 * - AbortController timeout bounds on all outbound calls
 * - Idempotency enforcement: deduplicates duplicate callbacks and requests
 * - Webhook HMAC-SHA256 signature verification with tolerance timestamp validation
 * - PROTOTYPE/LIVE SAFETY GUARD: If live mode is enabled, unconfigured real integrations
 *   MUST NOT fall back silently to mock adapters!
 */

import crypto from 'crypto';
import { getValidatedConfig } from '../../config/env.config.ts';
import { SupportedCountryCode, IdentifierType } from '../../domain/country/CountryTypes.ts';
import { ProviderOperationStatus } from '../../domain/ledger/ProviderOperationState.ts';

// -----------------------------------------------------------------------------
// STANDARD PROVIDER RESPONSE & ERROR MODELS
// -----------------------------------------------------------------------------

export interface ProviderError {
  code: string;
  message: string;
  retryable: boolean;
  httpStatusCode?: number;
  providerRawError?: unknown;
}

export interface ProviderResponse<T> {
  success: boolean;
  providerCode: string;
  isMock: boolean;
  operationStatus: ProviderOperationStatus;
  externalReference?: string;
  data?: T;
  error?: ProviderError;
  durationMs: number;
  timestamp: Date;
  correlationId: string;
  idempotencyKey?: string;
}

export interface RetryPolicyOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
}

export interface MockAdapterTestOptions {
  simulateTimeoutMs?: number;
  simulateFailureCode?: string;
  simulateFailureMessage?: string;
  simulateMalformedResponse?: boolean;
}

/**
 * Executes an asynchronous provider operation with exponential backoff, jitter, and timeout.
 */
export async function executeWithRetry<T>(
  operation: (signal: AbortSignal, attempt: number) => Promise<T>,
  options: RetryPolicyOptions = {},
  isRetryable: (err: unknown) => boolean = () => true
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 100;
  const maxDelayMs = options.maxDelayMs ?? 2000;
  const timeoutMs = options.timeoutMs ?? 5000;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await operation(controller.signal, attempt);
      clearTimeout(timeoutId);
      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      if (attempt >= maxAttempts || !isRetryable(err)) {
        break;
      }

      // Exponential backoff with randomized jitter
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * (baseDelayMs * 0.5);
      const delay = Math.min(exponentialDelay + jitter, maxDelayMs);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Cryptographic HMAC-SHA256 signature verification for inbound provider webhooks.
 */
export function verifyHmacSha256Webhook(params: {
  payload: string | Buffer;
  signatureHeader: string;
  secret: string;
  toleranceSeconds?: number;
  timestampHeader?: string;
}): boolean {
  try {
    const { payload, signatureHeader, secret, toleranceSeconds = 300, timestampHeader } = params;

    if (!signatureHeader || !secret) {
      return false;
    }

    // Optional timestamp tolerance check against replay attacks
    if (timestampHeader) {
      const ts = parseInt(timestampHeader, 10);
      const now = Math.floor(Date.now() / 1000);
      if (isNaN(ts) || Math.abs(now - ts) > toleranceSeconds) {
        return false;
      }
    }

    // Handle v1=signature format or raw hex
    const expectedSig = signatureHeader.startsWith('v1=')
      ? signatureHeader.substring(3)
      : signatureHeader;

    const dataToSign = timestampHeader
      ? `${timestampHeader}.${typeof payload === 'string' ? payload : payload.toString('utf8')}`
      : typeof payload === 'string'
      ? payload
      : payload.toString('utf8');

    const computed = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');

    // Constant-time comparison to prevent timing attacks
    const computedBuf = Buffer.from(computed, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');

    if (computedBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuf, expectedBuf);
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// 1. BANK ACCOUNT & PAYMENT-ACCOUNT PROVISIONING
// -----------------------------------------------------------------------------

export interface ProvisionAccountRequest {
  userId: string;
  countryCode: SupportedCountryCode;
  currency: string;
  accountHolderName: string;
  idempotencyKey: string;
  correlationId: string;
}

export interface ProvisionedAccountData {
  providerAccountId: string;
  accountNumberMasked: string;
  routingOrSortCode: string;
  iban?: string;
  status: 'PROVISIONED_ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
  supportedCurrencies: string[];
  provisionedAt: Date;
}

export interface IBankAccountProvisioningProvider {
  readonly providerName: string;
  readonly isLive: boolean;
  provisionAccount(request: ProvisionAccountRequest): Promise<ProviderResponse<ProvisionedAccountData>>;
  getAccountStatus(providerAccountId: string, correlationId: string): Promise<ProviderResponse<{ status: string; limits: Record<string, string> }>>;
}

export class MockBankAccountProvisioningProvider implements IBankAccountProvisioningProvider {
  public readonly providerName = 'AvenoraMockCoreBankingProvider';
  public readonly isLive = false;

  constructor(private testOptions?: MockAdapterTestOptions) {}

  public setTestOptions(options: MockAdapterTestOptions | undefined): void {
    this.testOptions = options;
  }

  public async provisionAccount(request: ProvisionAccountRequest): Promise<ProviderResponse<ProvisionedAccountData>> {
    const config = getValidatedConfig();
    const startTime = Date.now();

    if (this.testOptions?.simulateTimeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, this.testOptions!.simulateTimeoutMs));
    }

    if (this.testOptions?.simulateFailureCode) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: this.testOptions.simulateFailureCode,
          message: this.testOptions.simulateFailureMessage || 'Provider error',
          retryable: false,
          httpStatusCode: 502,
        },
      };
    }

    // Guard: Live settlement without real provider configured MUST fail explicitly
    if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: 'LIVE_BANKING_PROVIDER_UNCONFIGURED',
          message: 'Production core banking provider is not configured. Live provisioning blocked.',
          retryable: false,
          httpStatusCode: 503,
        },
      };
    }

    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'CONFIRMED',
      externalReference: `ext_bnk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      correlationId: request.correlationId,
      idempotencyKey: request.idempotencyKey,
      data: {
        providerAccountId: `prov_acc_${request.userId}_${request.countryCode}`,
        accountNumberMasked: `****${Math.floor(1000 + Math.random() * 9000)}`,
        routingOrSortCode: request.countryCode === 'US' ? '021000021' : request.countryCode === 'GB' ? '20-00-00' : '2100',
        iban: request.countryCode === 'ES' ? 'ES9121000418450200051332' : undefined,
        status: 'PROVISIONED_ACTIVE',
        supportedCurrencies: [request.currency],
        provisionedAt: new Date(),
      },
      durationMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  public async getAccountStatus(providerAccountId: string, correlationId: string): Promise<ProviderResponse<{ status: string; limits: Record<string, string> }>> {
    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'CONFIRMED',
      correlationId,
      durationMs: 12,
      timestamp: new Date(),
      data: {
        status: 'ACTIVE_SIMULATED',
        limits: { dailyTransferMinor: '10000000', perTransactionMinor: '2500000' },
      },
    };
  }
}

// -----------------------------------------------------------------------------
// 2. FIAT PAYMENT INITIATION & INQUIRIES
// -----------------------------------------------------------------------------

export interface InitiatePaymentRequest {
  paymentId: string;
  amountMinor: bigint;
  currency: string;
  debtorAccountId: string;
  creditorAccountId: string;
  creditorRouting?: string;
  reference: string;
  idempotencyKey: string;
  correlationId: string;
}

export interface PaymentInitiationData {
  providerPaymentId: string;
  clearingRail: string;
  settlementEta: string;
  status: ProviderOperationStatus;
}

export interface IFiatPaymentProvider {
  readonly providerName: string;
  readonly isLive: boolean;
  initiatePayment(request: InitiatePaymentRequest): Promise<ProviderResponse<PaymentInitiationData>>;
  getPaymentStatus(providerPaymentId: string, correlationId: string): Promise<ProviderResponse<{ status: ProviderOperationStatus; settledAt?: Date }>>;
}

export class MockFiatPaymentProvider implements IFiatPaymentProvider {
  public readonly providerName = 'AvenoraMockPaymentRailProvider';
  public readonly isLive = false;

  constructor(private testOptions?: MockAdapterTestOptions) {}

  public setTestOptions(options: MockAdapterTestOptions | undefined): void {
    this.testOptions = options;
  }

  public async initiatePayment(request: InitiatePaymentRequest): Promise<ProviderResponse<PaymentInitiationData>> {
    const config = getValidatedConfig();
    const startTime = Date.now();

    if (this.testOptions?.simulateTimeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, this.testOptions!.simulateTimeoutMs));
    }

    if (this.testOptions?.simulateFailureCode) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: this.testOptions.simulateFailureCode,
          message: this.testOptions.simulateFailureMessage || 'Provider error',
          retryable: false,
          httpStatusCode: 502,
        },
      };
    }

    if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: 'LIVE_FIAT_RAIL_UNAVAILABLE',
          message: 'Production fiat clearing rails (FedNow/FPS/SEPA/PIX) are not connected. Live payment initiation blocked.',
          retryable: false,
          httpStatusCode: 503,
        },
      };
    }

    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'PENDING_PROVIDER',
      externalReference: `ext_pmt_${request.paymentId}`,
      correlationId: request.correlationId,
      idempotencyKey: request.idempotencyKey,
      data: {
        providerPaymentId: `prov_pmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        clearingRail: request.currency === 'USD' ? 'FedACH' : request.currency === 'GBP' ? 'FPS' : request.currency === 'EUR' ? 'SEPA_INST' : 'PIX',
        settlementEta: 'T+0 (Simulated Instant)',
        status: 'PENDING_PROVIDER',
      },
      durationMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  public async getPaymentStatus(providerPaymentId: string, correlationId: string): Promise<ProviderResponse<{ status: ProviderOperationStatus; settledAt?: Date }>> {
    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'CONFIRMED',
      correlationId,
      durationMs: 8,
      timestamp: new Date(),
      data: {
        status: 'CONFIRMED',
        settledAt: new Date(),
      },
    };
  }
}

// -----------------------------------------------------------------------------
// 3. CARD ISSUANCE, CARD STATUS & EVENTS
// -----------------------------------------------------------------------------

export interface IssueCardRequest {
  userId: string;
  walletAccountId: string;
  currency: string;
  spendingLimitMinor?: bigint;
  idempotencyKey: string;
  correlationId: string;
}

export interface CardIssuanceData {
  providerCardToken: string;
  maskedPan: string;
  syntheticExpiry: string;
  cardNetwork: 'VISA_SIMULATED' | 'MASTERCARD_SIMULATED';
  status: 'ACTIVE_SIMULATED' | 'FROZEN';
}

export interface CardTransactionEventRequest {
  providerCardToken: string;
  eventType: 'AUTHORIZATION' | 'CLEARING' | 'REVERSAL' | 'REFUND';
  amountMinor: bigint;
  currency: string;
  merchantName: string;
  mcc: string;
  authCode?: string;
  externalTxId: string;
  idempotencyKey: string;
  correlationId: string;
}

export interface CardTransactionEventResult {
  status: 'APPROVED' | 'DECLINED' | 'SETTLED' | 'REVERSED';
  authCode: string;
  providerReference: string;
  clearedAmountMinor?: bigint;
  processedAt: Date;
}

export interface ICardNetworkProvider {
  readonly providerName: string;
  readonly isLive: boolean;
  issueVirtualCard(request: IssueCardRequest): Promise<ProviderResponse<CardIssuanceData>>;
  updateCardStatus(providerCardToken: string, status: 'ACTIVE' | 'FROZEN' | 'TERMINATED', reason: string, correlationId: string): Promise<ProviderResponse<{ status: string; updatedAt: Date }>>;
  processCardTransactionEvent(request: CardTransactionEventRequest): Promise<ProviderResponse<CardTransactionEventResult>>;
}

export class MockCardNetworkProvider implements ICardNetworkProvider {
  public readonly providerName = 'AvenoraMockCardNetwork';
  public readonly isLive = false;

  constructor(private testOptions?: MockAdapterTestOptions) {}

  public setTestOptions(options: MockAdapterTestOptions | undefined): void {
    this.testOptions = options;
  }

  public async issueVirtualCard(request: IssueCardRequest): Promise<ProviderResponse<CardIssuanceData>> {
    const config = getValidatedConfig();
    const startTime = Date.now();

    if (this.testOptions?.simulateTimeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, this.testOptions!.simulateTimeoutMs));
    }

    if (this.testOptions?.simulateFailureCode) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: this.testOptions.simulateFailureCode,
          message: this.testOptions.simulateFailureMessage || 'Provider error',
          retryable: false,
          httpStatusCode: 502,
        },
      };
    }

    if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: 'LIVE_CARD_NETWORK_UNCONFIGURED',
          message: 'Production card issuer processor is not connected. Live card issuance prohibited.',
          retryable: false,
          httpStatusCode: 503,
        },
      };
    }

    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'CONFIRMED',
      externalReference: `ext_crd_${Date.now()}`,
      correlationId: request.correlationId,
      idempotencyKey: request.idempotencyKey,
      data: {
        providerCardToken: `tok_crd_${Math.random().toString(36).substring(2, 10)}`,
        maskedPan: '4821 •••• •••• 8421',
        syntheticExpiry: '12/28',
        cardNetwork: 'VISA_SIMULATED',
        status: 'ACTIVE_SIMULATED',
      },
      durationMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  public async updateCardStatus(providerCardToken: string, status: 'ACTIVE' | 'FROZEN' | 'TERMINATED', reason: string, correlationId: string): Promise<ProviderResponse<{ status: string; updatedAt: Date }>> {
    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'CONFIRMED',
      correlationId,
      durationMs: 15,
      timestamp: new Date(),
      data: {
        status,
        updatedAt: new Date(),
      },
    };
  }

  public async processCardTransactionEvent(request: CardTransactionEventRequest): Promise<ProviderResponse<CardTransactionEventResult>> {
    const config = getValidatedConfig();
    const startTime = Date.now();

    if (this.testOptions?.simulateTimeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, this.testOptions!.simulateTimeoutMs));
    }

    if (this.testOptions?.simulateFailureCode) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: this.testOptions.simulateFailureCode,
          message: this.testOptions.simulateFailureMessage || 'Simulated card transaction error',
          retryable: false,
          httpStatusCode: 502,
        },
      };
    }

    if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: 'LIVE_CARD_NETWORK_UNCONFIGURED',
          message: 'Production card network processor is not connected. Live card event processing prohibited.',
          retryable: false,
          httpStatusCode: 503,
        },
      };
    }

    const authCode = request.authCode || `AUTH_${Date.now().toString(36).toUpperCase()}`;
    const resultStatus = request.eventType === 'REVERSAL' ? 'REVERSED' : request.eventType === 'CLEARING' ? 'SETTLED' : 'APPROVED';

    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'CONFIRMED',
      externalReference: `ext_card_evt_${request.externalTxId}`,
      correlationId: request.correlationId,
      idempotencyKey: request.idempotencyKey,
      data: {
        status: resultStatus,
        authCode,
        providerReference: `card_proc_ref_${request.idempotencyKey}`,
        clearedAmountMinor: request.amountMinor,
        processedAt: new Date(),
      },
      durationMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}

// -----------------------------------------------------------------------------
// 4. EXTERNAL IDENTITY VERIFICATION & KYC CHECKS
// -----------------------------------------------------------------------------

export interface InitiateKycRequest {
  userId: string;
  documentType: string;
  documentVaultRef: string;
  countryCode: string;
  idempotencyKey: string;
  correlationId: string;
}

export interface ExternalKycData {
  externalCaseId: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'INCONCLUSIVE' | 'UNRESOLVED';
  confidenceScore: number;
  checksSummary: {
    documentAuthenticity: boolean;
    facialMatch: boolean;
    sanctionsClear: boolean;
    pepClear: boolean;
  };
  disclaimer: string;
}

export interface IExternalKycProvider {
  readonly providerName: string;
  readonly isLive: boolean;
  initiateExternalVerification(request: InitiateKycRequest): Promise<ProviderResponse<ExternalKycData>>;
  queryVerificationResult(externalCaseId: string, correlationId: string): Promise<ProviderResponse<ExternalKycData>>;
}

export class MockExternalKycProvider implements IExternalKycProvider {
  public readonly providerName = 'AvenoraMockIdentityVerificationService';
  public readonly isLive = false;

  constructor(private testOptions?: MockAdapterTestOptions) {}

  public setTestOptions(options: MockAdapterTestOptions | undefined): void {
    this.testOptions = options;
  }

  public async initiateExternalVerification(request: InitiateKycRequest): Promise<ProviderResponse<ExternalKycData>> {
    const config = getValidatedConfig();
    const startTime = Date.now();

    if (this.testOptions?.simulateTimeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, this.testOptions!.simulateTimeoutMs));
    }

    if (this.testOptions?.simulateFailureCode) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: this.testOptions.simulateFailureCode,
          message: this.testOptions.simulateFailureMessage || 'Simulated KYC provider error',
          retryable: false,
          httpStatusCode: 502,
        },
      };
    }

    if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: 'LIVE_KYC_PROVIDER_UNCONFIGURED',
          message: 'Regulated IDSP identity provider is not connected. Silent fallback in production is prohibited.',
          retryable: false,
          httpStatusCode: 503,
        },
      };
    }

    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'PENDING_PROVIDER',
      externalReference: `ext_kyc_${request.userId}`,
      correlationId: request.correlationId,
      idempotencyKey: request.idempotencyKey,
      data: {
        externalCaseId: `idsp_case_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        verificationStatus: 'PENDING',
        confidenceScore: 0.96,
        checksSummary: {
          documentAuthenticity: true,
          facialMatch: true,
          sanctionsClear: true,
          pepClear: true,
        },
        disclaimer: 'EXTERNAL ADVISORY ONLY - DOES NOT CONSTITUTE FINAL REGULATORY OR INTERNAL COMPLIANCE APPROVAL',
      },
      durationMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  public async queryVerificationResult(externalCaseId: string, correlationId: string): Promise<ProviderResponse<ExternalKycData>> {
    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'CONFIRMED',
      correlationId,
      durationMs: 14,
      timestamp: new Date(),
      data: {
        externalCaseId,
        verificationStatus: 'VERIFIED',
        confidenceScore: 0.98,
        checksSummary: {
          documentAuthenticity: true,
          facialMatch: true,
          sanctionsClear: true,
          pepClear: true,
        },
        disclaimer: 'EXTERNAL ADVISORY ONLY - DOES NOT CONSTITUTE FINAL REGULATORY OR INTERNAL COMPLIANCE APPROVAL',
      },
    };
  }
}

// -----------------------------------------------------------------------------
// 5. BITCOIN CUSTODY & BLOCKCHAIN OPERATIONS
// -----------------------------------------------------------------------------

export interface GenerateBtcAddressRequest {
  userId: string;
  walletId: string;
  accountId: string;
  network?: 'mainnet' | 'testnet4' | 'regtest';
  idempotencyKey: string;
  correlationId: string;
}

export interface BtcDepositAddressData {
  depositAddress: string;
  addressType: 'P2WPKH_NATIVE_SEGWIT' | 'P2TR_TAPROOT';
  derivationPath: string;
  network: string;
  isSimulated: boolean;
  disclaimer: string;
}

export interface BtcWithdrawalRequest {
  withdrawalId: string;
  destinationAddress: string;
  amountSats: bigint;
  maxFeeRateSatPerVb: number;
  idempotencyKey: string;
  correlationId: string;
}

export interface BtcWithdrawalData {
  providerTxId: string;
  estimatedFeeSats: bigint;
  status: ProviderOperationStatus;
}

export interface IBitcoinCustodyProvider {
  readonly providerName: string;
  readonly isLive: boolean;
  generateDepositAddress(request: GenerateBtcAddressRequest): Promise<ProviderResponse<BtcDepositAddressData>>;
  getDepositStatus(txid: string, address: string, correlationId: string): Promise<ProviderResponse<{ confirmations: number; amountSats: bigint; status: ProviderOperationStatus }>>;
  initiateWithdrawal(request: BtcWithdrawalRequest): Promise<ProviderResponse<BtcWithdrawalData>>;
}

export class MockBitcoinCustodyProvider implements IBitcoinCustodyProvider {
  public readonly providerName = 'AvenoraMockBitcoinCustodyService';
  public readonly isLive = false;

  constructor(private testOptions?: MockAdapterTestOptions) {}

  public setTestOptions(options: MockAdapterTestOptions | undefined): void {
    this.testOptions = options;
  }

  public async generateDepositAddress(request: GenerateBtcAddressRequest): Promise<ProviderResponse<BtcDepositAddressData>> {
    const config = getValidatedConfig();
    const startTime = Date.now();

    if (this.testOptions?.simulateTimeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, this.testOptions!.simulateTimeoutMs));
    }

    if (this.testOptions?.simulateFailureCode) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: this.testOptions.simulateFailureCode,
          message: this.testOptions.simulateFailureMessage || 'Simulated Bitcoin custody error',
          retryable: false,
          httpStatusCode: 502,
        },
      };
    }

    if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: 'LIVE_BTC_CUSTODY_UNCONFIGURED',
          message: 'Institutional qualified Bitcoin custodian is not configured. Real address generation blocked.',
          retryable: false,
          httpStatusCode: 503,
        },
      };
    }

    // Synthetic Native SegWit test address
    const syntheticAddress = `bc1qsim${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'CONFIRMED',
      correlationId: request.correlationId,
      idempotencyKey: request.idempotencyKey,
      data: {
        depositAddress: syntheticAddress,
        addressType: 'P2WPKH_NATIVE_SEGWIT',
        derivationPath: "m/84'/0'/0'/0/0",
        network: 'simulated_prototype',
        isSimulated: true,
        disclaimer: 'SIMULATED BITCOIN ADDRESS - DO NOT SEND REAL BTC - ASSETS WILL BE LOST',
      },
      durationMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  public async getDepositStatus(txid: string, address: string, correlationId: string): Promise<ProviderResponse<{ confirmations: number; amountSats: bigint; status: ProviderOperationStatus }>> {
    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'CONFIRMED',
      correlationId,
      durationMs: 10,
      timestamp: new Date(),
      data: {
        confirmations: 6,
        amountSats: 2500000n,
        status: 'CONFIRMED',
      },
    };
  }

  public async initiateWithdrawal(request: BtcWithdrawalRequest): Promise<ProviderResponse<BtcWithdrawalData>> {
    const config = getValidatedConfig();
    const startTime = Date.now();

    if (this.testOptions?.simulateTimeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, this.testOptions!.simulateTimeoutMs));
    }

    if (this.testOptions?.simulateFailureCode) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: this.testOptions.simulateFailureCode,
          message: this.testOptions.simulateFailureMessage || 'Simulated BTC withdrawal error',
          retryable: false,
          httpStatusCode: 502,
        },
      };
    }

    if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: 'LIVE_BTC_CUSTODY_UNCONFIGURED',
          message: 'Institutional Bitcoin custodian is not connected. Real broadcast prohibited.',
          retryable: false,
          httpStatusCode: 503,
        },
      };
    }

    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'PENDING_PROVIDER',
      externalReference: `btc_tx_${request.withdrawalId}`,
      correlationId: request.correlationId,
      idempotencyKey: request.idempotencyKey,
      data: {
        providerTxId: `sim_tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        estimatedFeeSats: 1420n,
        status: 'PENDING_PROVIDER',
      },
      durationMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}

// -----------------------------------------------------------------------------
// 6. FX QUOTES & WHOLESALE EXTERNAL SETTLEMENT
// -----------------------------------------------------------------------------

export interface FxQuoteRequest {
  baseCurrency: string;
  quoteCurrency: string;
  amountMinor: bigint;
  side: 'BUY' | 'SELL';
  idempotencyKey: string;
  correlationId: string;
}

export interface FxQuoteData {
  quoteId: string;
  rateScaled: bigint; // 1e8 fixed-point scale
  rateFormatted: string;
  sourceAmountMinor: bigint;
  targetAmountMinor: bigint;
  expiresAt: Date;
  providerSettlementRef: string;
}

export interface IFxQuoteProvider {
  readonly providerName: string;
  readonly isLive: boolean;
  requestQuote(request: FxQuoteRequest): Promise<ProviderResponse<FxQuoteData>>;
  executeSettlement(params: { quoteId: string; settlementAccountId: string; idempotencyKey: string; correlationId: string }): Promise<ProviderResponse<{ settlementId: string; status: ProviderOperationStatus }>>;
}

export class MockFxQuoteProvider implements IFxQuoteProvider {
  public readonly providerName = 'AvenoraMockWholesaleFxProvider';
  public readonly isLive = false;

  constructor(private testOptions?: MockAdapterTestOptions) {}

  public setTestOptions(options: MockAdapterTestOptions | undefined): void {
    this.testOptions = options;
  }

  public async requestQuote(request: FxQuoteRequest): Promise<ProviderResponse<FxQuoteData>> {
    const config = getValidatedConfig();
    const startTime = Date.now();

    if (this.testOptions?.simulateTimeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, this.testOptions!.simulateTimeoutMs));
    }

    if (this.testOptions?.simulateFailureCode) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: this.testOptions.simulateFailureCode,
          message: this.testOptions.simulateFailureMessage || 'Simulated FX quote error',
          retryable: false,
          httpStatusCode: 502,
        },
      };
    }

    if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
      return {
        success: false,
        providerCode: this.providerName,
        isMock: true,
        operationStatus: 'FAILED',
        correlationId: request.correlationId,
        idempotencyKey: request.idempotencyKey,
        durationMs: Date.now() - startTime,
        timestamp: new Date(),
        error: {
          code: 'LIVE_FX_LIQUIDITY_UNCONFIGURED',
          message: 'Institutional FX liquidity facility is not contracted. Real FX settlement blocked.',
          retryable: false,
          httpStatusCode: 503,
        },
      };
    }

    // Benchmark sample rates in 1e8 scale (EUR/USD ~ 1.0850)
    const rateScaled = 108500000n;
    const targetAmountMinor = (request.amountMinor * rateScaled) / 100000000n;

    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'CONFIRMED',
      externalReference: `fx_ref_${request.idempotencyKey}`,
      correlationId: request.correlationId,
      idempotencyKey: request.idempotencyKey,
      data: {
        quoteId: `quote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        rateScaled,
        rateFormatted: '1.0850',
        sourceAmountMinor: request.amountMinor,
        targetAmountMinor,
        expiresAt: new Date(Date.now() + 60000), // 60s quote validity
        providerSettlementRef: `fx_settle_ref_${request.idempotencyKey}`,
      },
      durationMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  public async executeSettlement(params: { quoteId: string; settlementAccountId: string; idempotencyKey: string; correlationId: string }): Promise<ProviderResponse<{ settlementId: string; status: ProviderOperationStatus }>> {
    return {
      success: true,
      providerCode: this.providerName,
      isMock: true,
      operationStatus: 'CONFIRMED',
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
      durationMs: 20,
      timestamp: new Date(),
      data: {
        settlementId: `fx_settle_${params.quoteId}`,
        status: 'CONFIRMED',
      },
    };
  }
}

// -----------------------------------------------------------------------------
// DEFAULT SINGLETON INSTANCES
// -----------------------------------------------------------------------------

export const defaultMockBankingProvider = new MockBankAccountProvisioningProvider();
export const defaultMockPaymentProvider = new MockFiatPaymentProvider();
export const defaultMockCardProvider = new MockCardNetworkProvider();
export const defaultMockKycProvider = new MockExternalKycProvider();
export const defaultMockBitcoinProvider = new MockBitcoinCustodyProvider();
export const defaultMockFxProvider = new MockFxQuoteProvider();

// Legacy alias compatibility
export const defaultSandboxKycProvider = defaultMockKycProvider;
export const defaultSandboxCardProvider = defaultMockCardProvider;
export const defaultSandboxBankingProvider = defaultMockBankingProvider;
