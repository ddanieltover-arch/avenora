/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Country-Aware Identifier Generation & Validation Service
 *
 * Implements:
 * - Deterministic, country-aware synthetic financial identifier generation
 * - Separation of internal database IDs from customer-facing bank/tax/card details
 * - Authoritative checksum algorithms (ISO 7064 Mod 97-10, ABA 9-Digit, Spanish CCC, Brazilian CPF, Luhn)
 * - Safe concurrent allocation with thread-safe atomic reservation store and deduplication
 * - Pluggable IIdentifierProvider interface for future live banking/card adapters
 * - Strict prototype boundary disclaimers and masking
 */

import {
  SupportedCountryCode,
  IdentifierType,
  CountryIdentifierResult,
  IdentifierValidationResult,
  IIdentifierProvider,
} from '../../domain/country/CountryTypes.ts';
import {
  SUPPORTED_COUNTRIES,
  SUPPORTED_IDENTIFIER_TYPES,
  CountryRules,
} from '../../domain/country/CountryRules.ts';
import {
  defaultMockBankingProvider,
  defaultMockCardProvider,
  IBankAccountProvisioningProvider,
  ICardNetworkProvider,
} from './providerAdapters.ts';

export class SyntheticIdentifierProvider implements IIdentifierProvider {
  public readonly name = 'AvenoraSyntheticIdentifierProvider';
  public readonly isLive = false;

  private static instanceCounter = 1000;
  // In-memory atomic allocation registry: key = `${country}:${type}:${rawValue}`
  private allocatedRegistry = new Map<string, CountryIdentifierResult>();
  // Mutex promise chain to guarantee safe concurrent allocation
  private allocationLock: Promise<void> = Promise.resolve();
  // Provider-provisioned identifier cache: key = `${country}:${type}:${idempotencyKey}`
  private providerProvisionRegistry = new Map<string, CountryIdentifierResult>();

  /**
   * Thread-safe atomic generation with concurrency collision avoidance.
   */
  public async generateIdentifier(params: {
    countryCode: SupportedCountryCode;
    type: IdentifierType;
    accountHolderName?: string;
    currency?: string;
  }): Promise<CountryIdentifierResult> {
    const { countryCode, type } = params;

    // Validate country support
    if (!SUPPORTED_COUNTRIES.includes(countryCode)) {
      throw new Error(
        `Unsupported country code: "${countryCode}". Supported countries are: [${SUPPORTED_COUNTRIES.join(', ')}].`
      );
    }

    // Validate type for country
    const allowedTypes = SUPPORTED_IDENTIFIER_TYPES[countryCode] || [];
    if (!allowedTypes.includes(type)) {
      throw new Error(
        `Identifier type "${type}" is not supported for country "${countryCode}". Supported types for ${countryCode} are: [${allowedTypes.join(', ')}].`
      );
    }

    // Acquire concurrency lock
    let releaseLock: () => void;
    const lockWait = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    const previousLock = this.allocationLock;
    this.allocationLock = this.allocationLock.then(() => lockWait);
    await previousLock;

    try {
      let attempts = 0;
      const MAX_ATTEMPTS = 50;

      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        SyntheticIdentifierProvider.instanceCounter++;
        const seq = SyntheticIdentifierProvider.instanceCounter;
        const rawCandidate = this.buildCandidate(countryCode, type, seq, params.currency);
        const candidate: CountryIdentifierResult = {
          ...rawCandidate,
          source: 'SYNTHETIC_GENERATOR',
        };
        const regKey = `${countryCode}:${type}:${candidate.rawValue}`;

        if (!this.allocatedRegistry.has(regKey)) {
          this.allocatedRegistry.set(regKey, candidate);
          return candidate;
        }
      }

      throw new Error(`Failed to allocate a unique ${type} identifier for ${countryCode} after ${MAX_ATTEMPTS} attempts.`);
    } finally {
      releaseLock!();
    }
  }

  /**
   * Requests an account or card identifier from an authorized external provider adapter.
   * If the external provider fails or is unconfigured, this throws an error and NEVER silently falls back!
   */
  public async provisionFromProvider(params: {
    countryCode: SupportedCountryCode;
    type: IdentifierType;
    accountHolderName: string;
    currency: string;
    idempotencyKey: string;
    correlationId: string;
    bankingProvider?: IBankAccountProvisioningProvider;
    cardProvider?: ICardNetworkProvider;
  }): Promise<CountryIdentifierResult> {
    const { countryCode, type, accountHolderName, currency, idempotencyKey, correlationId } = params;

    if (!SUPPORTED_COUNTRIES.includes(countryCode)) {
      throw new Error(`Unsupported country code: "${countryCode}".`);
    }

    const cacheKey = `${countryCode}:${type}:${idempotencyKey}`;
    const cached = this.providerProvisionRegistry.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (type === 'BANK_ACCOUNT' || type === 'IBAN') {
      const provider = params.bankingProvider || defaultMockBankingProvider;
      const res = await provider.provisionAccount({
        userId: `usr_prov_${idempotencyKey}`,
        countryCode,
        currency,
        accountHolderName,
        idempotencyKey,
        correlationId,
      });

      if (!res.success || !res.data) {
        throw new Error(
          `Provider account provisioning failed: [${res.error?.code || 'UNKNOWN_ERROR'}] ${res.error?.message || 'External provider error'}`
        );
      }

      const isLive = Boolean(provider.isLive);
      const result: CountryIdentifierResult = {
        countryCode,
        type,
        formattedValue: res.data.iban || `${res.data.routingOrSortCode} / ${res.data.accountNumberMasked}`,
        rawValue: res.data.providerAccountId,
        maskedValue: res.data.accountNumberMasked,
        components: {
          providerAccountId: res.data.providerAccountId,
          routingOrSortCode: res.data.routingOrSortCode,
          iban: res.data.iban || '',
        },
        isSimulated: !isLive,
        source: isLive ? 'AUTHORIZED_PROVIDER' : 'MOCK_PROVIDER',
        providerReference: {
          providerCode: provider.providerName,
          externalId: res.data.providerAccountId,
          provisionedAt: res.data.provisionedAt,
        },
        disclaimer: isLive
          ? 'OFFICIALLY ISSUED BY AUTHORIZED BANKING PARTNER'
          : 'PROVISIONED VIA SANDBOX/MOCK PROVIDER ADAPTER (INTEGRATION TEST ONLY)',
        generatedAt: new Date(),
      };

      this.providerProvisionRegistry.set(cacheKey, result);
      return result;
    }

    if (type === 'PAYMENT_CARD') {
      const provider = params.cardProvider || defaultMockCardProvider;
      const res = await provider.issueVirtualCard({
        userId: `usr_prov_${idempotencyKey}`,
        walletAccountId: `acc_${idempotencyKey}`,
        currency,
        idempotencyKey,
        correlationId,
      });

      if (!res.success || !res.data) {
        throw new Error(
          `Provider card provisioning failed: [${res.error?.code || 'UNKNOWN_ERROR'}] ${res.error?.message || 'External card processor error'}`
        );
      }

      const isLive = Boolean(provider.isLive);
      const result: CountryIdentifierResult = {
        countryCode,
        type,
        formattedValue: `${res.data.cardNetwork}: ${res.data.maskedPan} (Exp: ${res.data.syntheticExpiry})`,
        rawValue: res.data.providerCardToken,
        maskedValue: res.data.maskedPan,
        components: {
          providerCardToken: res.data.providerCardToken,
          cardNetwork: res.data.cardNetwork,
          syntheticExpiry: res.data.syntheticExpiry,
        },
        isSimulated: !isLive,
        source: isLive ? 'AUTHORIZED_PROVIDER' : 'MOCK_PROVIDER',
        providerReference: {
          providerCode: provider.providerName,
          externalId: res.data.providerCardToken,
          provisionedAt: new Date(),
        },
        disclaimer: isLive
          ? 'OFFICIALLY ISSUED BY AUTHORIZED CARD NETWORK'
          : 'PROVISIONED VIA SANDBOX/MOCK CARD PROCESSOR (INTEGRATION TEST ONLY)',
        generatedAt: new Date(),
      };

      this.providerProvisionRegistry.set(cacheKey, result);
      return result;
    }

    throw new Error(`Provider provisioning is not supported for identifier type "${type}".`);
  }

  /**
   * Validates a given identifier against country rules and checksums.
   */
  public validateIdentifier(params: {
    countryCode: SupportedCountryCode;
    type: IdentifierType;
    value: string;
  }): IdentifierValidationResult {
    const { countryCode, type, value } = params;
    const clean = value.trim();

    if (!SUPPORTED_COUNTRIES.includes(countryCode)) {
      return {
        isValid: false,
        countryCode,
        type,
        error: `Country "${countryCode}" is not supported. Supported: [${SUPPORTED_COUNTRIES.join(', ')}].`,
      };
    }

    const allowed = SUPPORTED_IDENTIFIER_TYPES[countryCode] || [];
    if (!allowed.includes(type)) {
      return {
        isValid: false,
        countryCode,
        type,
        error: `Identifier type "${type}" is not supported for country "${countryCode}".`,
      };
    }

    switch (countryCode) {
      case 'US': {
        if (type === 'BANK_ACCOUNT') {
          // Expecting Account (8-14 digits) or Routing/Account pair (ABA 9 digits + 8-14 digits)
          const parts = clean.split('/');
          const routing = parts.length > 1 ? (parts[0]?.trim() || '') : '';
          const account = parts.length > 1 ? (parts[1]?.trim() || '') : clean;
          const isAbaValid = routing ? CountryRules.validateAbaRouting(routing) : true;
          const isAccValid = /^\d{8,14}$/.test(account.replace(/[\s-]/g, ''));
          return {
            isValid: isAbaValid && isAccValid,
            countryCode,
            type,
            error: !isAbaValid ? 'Invalid US ABA 9-digit routing checksum' : !isAccValid ? 'Invalid US account length' : undefined,
          };
        }
        if (type === 'TAX_ID') {
          const raw = clean.replace(/[\s-]/g, '');
          const isSsn = /^\d{9}$/.test(raw) && !raw.startsWith('000') && !raw.startsWith('666') && !raw.startsWith('9');
          const isEin = /^\d{9}$/.test(raw);
          return {
            isValid: isSsn || isEin,
            countryCode,
            type,
            error: isSsn || isEin ? undefined : 'Invalid US SSN/EIN format (expected 9 digits)',
          };
        }
        if (type === 'PAYMENT_CARD') {
          const isLuhn = CountryRules.validateLuhn(clean);
          return {
            isValid: isLuhn,
            countryCode,
            type,
            error: isLuhn ? undefined : 'Invalid card number Luhn checksum',
          };
        }
        break;
      }

      case 'GB': {
        if (type === 'SORT_CODE') {
          const raw = clean.replace(/[\s-]/g, '');
          const isValid = /^\d{6}$/.test(raw);
          return { isValid, countryCode, type, error: isValid ? undefined : 'UK Sort code must be 6 digits' };
        }
        if (type === 'BANK_ACCOUNT') {
          const raw = clean.replace(/[\s-]/g, '');
          const isValid = /^\d{8}$/.test(raw);
          return { isValid, countryCode, type, error: isValid ? undefined : 'UK Bank Account must be 8 digits' };
        }
        if (type === 'IBAN') {
          const isValid = clean.startsWith('GB') && CountryRules.validateIban(clean);
          return { isValid, countryCode, type, error: isValid ? undefined : 'Invalid UK IBAN Mod 97-10 checksum' };
        }
        if (type === 'TAX_ID') {
          const raw = clean.replace(/[\s-]/g, '').toUpperCase();
          const isUtr = /^\d{10}$/.test(raw);
          const isNino = /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/.test(raw);
          return { isValid: isUtr || isNino, countryCode, type, error: isUtr || isNino ? undefined : 'Invalid UK Tax ID (UTR/NINO)' };
        }
        if (type === 'PAYMENT_CARD') {
          const isValid = CountryRules.validateLuhn(clean);
          return { isValid, countryCode, type, error: isValid ? undefined : 'Invalid card Luhn checksum' };
        }
        break;
      }

      case 'ES': {
        if (type === 'BANK_ACCOUNT' || type === 'IBAN') {
          const isValid = clean.startsWith('ES') && CountryRules.validateIban(clean);
          return { isValid, countryCode, type, error: isValid ? undefined : 'Invalid Spanish IBAN Mod 97-10 checksum' };
        }
        if (type === 'TAX_ID') {
          const isValid = CountryRules.validateSpanishDni(clean);
          return { isValid, countryCode, type, error: isValid ? undefined : 'Invalid Spanish DNI/NIE modulo 23 letter' };
        }
        if (type === 'PAYMENT_CARD') {
          const isValid = CountryRules.validateLuhn(clean);
          return { isValid, countryCode, type, error: isValid ? undefined : 'Invalid card Luhn checksum' };
        }
        break;
      }

      case 'DE': {
        if (type === 'BANK_ACCOUNT' || type === 'IBAN') {
          const isValid = clean.startsWith('DE') && CountryRules.validateIban(clean);
          return { isValid, countryCode, type, error: isValid ? undefined : 'Invalid German IBAN Mod 97-10 checksum' };
        }
        if (type === 'TAX_ID') {
          const raw = clean.replace(/[\s-]/g, '');
          const isValid = /^\d{11}$/.test(raw);
          return { isValid, countryCode, type, error: isValid ? undefined : 'German Steuer-ID must be 11 digits' };
        }
        if (type === 'PAYMENT_CARD') {
          const isValid = CountryRules.validateLuhn(clean);
          return { isValid, countryCode, type, error: isValid ? undefined : 'Invalid card Luhn checksum' };
        }
        break;
      }

      case 'BR': {
        if (type === 'BANK_ACCOUNT') {
          const raw = clean.replace(/[\s.-]/g, '');
          const isValid = raw.length >= 8 && raw.length <= 16;
          return { isValid, countryCode, type, error: isValid ? undefined : 'Invalid Brazilian account structure' };
        }
        if (type === 'TAX_ID') {
          const isValid = CountryRules.validateBrazilianCpf(clean);
          return { isValid, countryCode, type, error: isValid ? undefined : 'Invalid Brazilian CPF modulo 11 check digits' };
        }
        if (type === 'PIX_KEY') {
          const isValid = clean.length >= 5 && clean.length <= 100;
          return { isValid, countryCode, type, error: isValid ? undefined : 'Invalid Pix key format' };
        }
        if (type === 'PAYMENT_CARD') {
          const isValid = CountryRules.validateLuhn(clean);
          return { isValid, countryCode, type, error: isValid ? undefined : 'Invalid card Luhn checksum' };
        }
        break;
      }
    }

    return { isValid: false, countryCode, type, error: 'Unsupported verification specification' };
  }

  /**
   * Internal generator building authoritative formatted candidates.
   */
  private buildCandidate(
    countryCode: SupportedCountryCode,
    type: IdentifierType,
    seq: number,
    currency?: string
  ): CountryIdentifierResult {
    const generatedAt = new Date();
    const disclaimer = 'SIMULATED / PROTOTYPE DEMO ONLY - NOT FOR LIVE FINANCIAL SETTLEMENT';

    switch (countryCode) {
      case 'US': {
        if (type === 'BANK_ACCOUNT') {
          // Use verified Federal Reserve test routing number 021000021 (valid check digits: 3*0 + 7*2 + 1*1 + 3*0 + 7*0 + 1*0 + 3*0 + 7*2 + 1*1 = 14 + 1 + 14 + 1 = 30 % 10 === 0)
          const routing = '021000021';
          const accNumber = `8900${seq.toString().padStart(6, '0')}`;
          const formatted = `ABA ${routing} / ACCT ${accNumber}`;
          const raw = `${routing}${accNumber}`;
          const masked = `ABA ***021 / ACCT *****${accNumber.slice(-4)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: {
              routingNumber: routing,
              accountNumber: accNumber,
              bankName: 'Federal Reserve Bank of New York (Prototype Vault)',
            },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }

        if (type === 'TAX_ID') {
          // Synthetic demo SSN using reserved group 00 (not issued to real persons by SSA)
          const area = (100 + (seq % 800)).toString();
          const group = '00';
          const serial = (1000 + (seq % 8999)).toString();
          const formatted = `${area}-${group}-${serial}`;
          const raw = `${area}${group}${serial}`;
          const masked = `***-**-${serial}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { area, group, serial, taxScheme: 'US-SSN-SYNTHETIC' },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }

        if (type === 'PAYMENT_CARD') {
          const bin = '4821'; // Visa BIN
          const accountSeq = seq.toString().padStart(11, '0').slice(-11);
          const partial = bin + accountSeq;
          const check = CountryRules.computeLuhnCheckDigit(partial);
          const raw = partial + check;
          const formatted = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 16)}`;
          const masked = `************${raw.slice(-4)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { bin, last4: raw.slice(-4), cardBrand: 'VISA_SIMULATED' },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }
        break;
      }

      case 'GB': {
        if (type === 'SORT_CODE' || type === 'BANK_ACCOUNT') {
          const sortCode = '20-00-00'; // Standard Barclays clearing test sort code
          const accNumber = `70${seq.toString().padStart(6, '0')}`;
          const formatted = `Sort Code: ${sortCode} · Account: ${accNumber}`;
          const raw = `200000${accNumber}`;
          const masked = `Sort Code: **-**-00 · Account: *****${accNumber.slice(-3)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { sortCode, accountNumber: accNumber, bankName: 'Barclays Clearing UK (Prototype)' },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }

        if (type === 'IBAN') {
          // GB IBAN: GB + 2 check + 4 letter bank (AVEN) + 6 sort + 8 account = 22 chars
          const bankCode = 'AVEN';
          const sortCode = '200000';
          const acc = `70${seq.toString().padStart(6, '0')}`;
          const bban = `${bankCode}${sortCode}${acc}`;
          const check = CountryRules.computeIbanCheckDigits('GB', bban);
          const raw = `GB${check}${bban}`;
          const formatted = `GB${check} ${bankCode} ${sortCode.slice(0, 4)} ${sortCode.slice(4)}${acc.slice(0, 2)} ${acc.slice(2, 6)} ${acc.slice(6)}`;
          const masked = `GB${check} **** **** **** **** ${acc.slice(-4)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { ibanCheckDigits: check, bankCode, sortCode, accountNumber: acc },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }

        if (type === 'TAX_ID') {
          // UK UTR (10 digits)
          const raw = `99${seq.toString().padStart(8, '0')}`;
          const formatted = `${raw.slice(0, 5)} ${raw.slice(5)}`;
          const masked = `***** ${raw.slice(-5)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { taxScheme: 'HMRC-UTR-SYNTHETIC' },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }

        if (type === 'PAYMENT_CARD') {
          const bin = '5241'; // Mastercard BIN
          const accountSeq = seq.toString().padStart(11, '0').slice(-11);
          const partial = bin + accountSeq;
          const check = CountryRules.computeLuhnCheckDigit(partial);
          const raw = partial + check;
          const formatted = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 16)}`;
          const masked = `************${raw.slice(-4)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { bin, last4: raw.slice(-4), cardBrand: 'MASTERCARD_SIMULATED' },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }
        break;
      }

      case 'ES': {
        if (type === 'BANK_ACCOUNT' || type === 'IBAN') {
          // Spanish CCC: 4 bank (2100 Caixa), 4 branch (0418), 2 control, 10 account
          const bank = '2100';
          const branch = '0418';
          const acc = `02${seq.toString().padStart(8, '0')}`;
          const cccControl = CountryRules.computeSpanishCccControlDigits(bank, branch, acc);
          const bban = `${bank}${branch}${cccControl}${acc}`;
          const check = CountryRules.computeIbanCheckDigits('ES', bban);
          const raw = `ES${check}${bban}`;
          const formatted = `ES${check} ${bank} ${branch} ${cccControl}${acc.slice(0, 2)} ${acc.slice(2, 6)} ${acc.slice(6)}`;
          const masked = `ES${check} ${bank} **** ** ** **** ${acc.slice(-4)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { bank, branch, controlDigits: cccControl, accountNumber: acc },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }

        if (type === 'TAX_ID') {
          // Spanish DNI with verified modulo 23 check letter
          const num = 50000000 + (seq % 39999999);
          const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
          const letter = letters[num % 23];
          const raw = `${num}${letter}`;
          const formatted = `${raw.slice(0, 8)}-${letter}`;
          const masked = `****${raw.slice(4, 8)}-${letter}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { dniNumber: num.toString(), checkLetter: letter!, taxScheme: 'ES-DNI-SYNTHETIC' },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }

        if (type === 'PAYMENT_CARD') {
          const bin = '4821';
          const accountSeq = seq.toString().padStart(11, '0').slice(-11);
          const partial = bin + accountSeq;
          const check = CountryRules.computeLuhnCheckDigit(partial);
          const raw = partial + check;
          const formatted = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 16)}`;
          const masked = `************${raw.slice(-4)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { bin, last4: raw.slice(-4), cardBrand: 'VISA_SIMULATED' },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }
        break;
      }

      case 'DE': {
        if (type === 'BANK_ACCOUNT' || type === 'IBAN') {
          // German IBAN: DE + 2 check + 8 BLZ + 10 Account = 22 chars
          const blz = '37040044'; // Commerzbank Köln BLZ test
          const acc = `05${seq.toString().padStart(8, '0')}`;
          const bban = `${blz}${acc}`;
          const check = CountryRules.computeIbanCheckDigits('DE', bban);
          const raw = `DE${check}${bban}`;
          const formatted = `DE${check} ${blz.slice(0, 4)} ${blz.slice(4)} ${acc.slice(0, 4)} ${acc.slice(4, 8)} ${acc.slice(8)}`;
          const masked = `DE${check} ${blz.slice(0, 4)} **** **** **** ${acc.slice(-4)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { blz, accountNumber: acc, bankName: 'Commerzbank AG (Prototype)' },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }

        if (type === 'TAX_ID') {
          // German Steuer-ID (11 digits)
          const raw = `04${seq.toString().padStart(9, '0')}`;
          const formatted = `${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5, 8)} ${raw.slice(8)}`;
          const masked = `** *** *** ${raw.slice(-3)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { taxScheme: 'DE-STEUER-ID-SYNTHETIC' },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }

        if (type === 'PAYMENT_CARD') {
          const bin = '5241';
          const accountSeq = seq.toString().padStart(11, '0').slice(-11);
          const partial = bin + accountSeq;
          const check = CountryRules.computeLuhnCheckDigit(partial);
          const raw = partial + check;
          const formatted = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 16)}`;
          const masked = `************${raw.slice(-4)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { bin, last4: raw.slice(-4), cardBrand: 'MASTERCARD_SIMULATED' },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }
        break;
      }

      case 'BR': {
        if (type === 'BANK_ACCOUNT') {
          // FEBRABAN-style: unique COMPE bank code, 4-digit branch, account + mod-11 check digit.
          const banco = ((seq % 899) + 1).toString().padStart(3, '0');
          const agencia = (((seq * 17) % 9000) + 1000).toString().padStart(4, '0');
          const contaSeq = (10000 + (seq % 89999)).toString();
          let sum = 0;
          for (let i = 0; i < contaSeq.length; i++) {
            sum += parseInt(contaSeq[i] ?? '0', 10) * (contaSeq.length + 1 - i);
          }
          const cd = sum % 11 === 10 ? 'X' : (sum % 11).toString();
          const contaFormatted = `${contaSeq}-${cd}`;
          // Unique phone-style Pix key (DDD + 9-digit mobile), e.g. 51999157858
          const ddd = (11 + (seq % 79)).toString().padStart(2, '0');
          const mobile = (900_000_000 + ((seq * 13) % 100_000_000)).toString().padStart(9, '0');
          const pixKey = `${ddd}${mobile}`;
          const formatted = `Banco: ${banco} · Agência: ${agencia} · Conta: ${contaFormatted} · Pix: ${pixKey}`;
          const raw = `${banco}${agencia}${contaSeq}${cd}|pix:${pixKey}`;
          const masked = `Banco: ${banco} · Ag: **** · Conta: *****-${cd} · Pix: ****${pixKey.slice(-4)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { banco, agencia, conta: contaFormatted, pixKey },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }

        if (type === 'TAX_ID') {
          // Brazilian CPF with valid modulo 11 check digits
          const nineDigits = (100000000 + (seq % 899999999)).toString();
          const checkDigits = CountryRules.generateCpfCheckDigits(nineDigits);
          const raw = `${nineDigits}${checkDigits}`;
          const formatted = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${checkDigits}`;
          const masked = `***.***.${raw.slice(6, 9)}-${checkDigits}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { checkDigits, taxScheme: 'BR-CPF-SYNTHETIC' },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }

        if (type === 'PIX_KEY') {
          const ddd = (11 + (seq % 79)).toString().padStart(2, '0');
          const mobile = (900_000_000 + ((seq * 31) % 100_000_000)).toString().padStart(9, '0');
          const pixKey = `${ddd}${mobile}`;
          const formatted = pixKey;
          const raw = `pix:${pixKey}`;
          const masked = `****${pixKey.slice(-4)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { pixKey, pixType: 'PHONE' },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }

        if (type === 'PAYMENT_CARD') {
          const bin = '4821';
          const accountSeq = seq.toString().padStart(11, '0').slice(-11);
          const partial = bin + accountSeq;
          const check = CountryRules.computeLuhnCheckDigit(partial);
          const raw = partial + check;
          const formatted = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 16)}`;
          const masked = `************${raw.slice(-4)}`;

          return {
            countryCode,
            type,
            formattedValue: formatted,
            rawValue: raw,
            maskedValue: masked,
            components: { bin, last4: raw.slice(-4), cardBrand: 'ELO_VISA_SIMULATED' },
            isSimulated: true,
            disclaimer,
            generatedAt,
          };
        }
        break;
      }
    }

    throw new Error(`Unsupported generation request: ${countryCode} / ${type}`);
  }
}

export const defaultIdentifierProvider = new SyntheticIdentifierProvider();
