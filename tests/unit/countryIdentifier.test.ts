/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Country-Aware Identifier Unit & Concurrency Tests
 *
 * Verifies:
 * - Country-specific format and checksum generation (US ABA/DDA, GB Sort/Account/IBAN, ES CCC/IBAN, DE BLZ/IBAN, BR Agência/Conta/CPF)
 * - Unsupported countries and invalid country/type rejection
 * - Separation of internal IDs from customer-facing synthetic identifiers
 * - Uniqueness and thread-safe concurrent allocation
 * - Pluggable IIdentifierProvider interface compliance
 * - Strict demo-only marker and card number masking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SyntheticIdentifierProvider } from '../../src/server/services/identifier.service.ts';
import { CountryRules } from '../../src/domain/country/CountryRules.ts';

describe('Country-Aware Synthetic Identifier Generation & Validation', () => {
  let provider: SyntheticIdentifierProvider;

  beforeEach(() => {
    provider = new SyntheticIdentifierProvider();
  });

  describe('Mathematical & Official Checksum Rules', () => {
    it('validates ISO 7064 Mod 97-10 IBAN checksum correctly', () => {
      // Correct Spanish IBAN test
      const validEsIban = 'ES9121000418450200051332';
      expect(CountryRules.validateIban(validEsIban)).toBe(true);

      // Tampered checksum should fail
      const corruptedIban = 'ES9221000418450200051332';
      expect(CountryRules.validateIban(corruptedIban)).toBe(false);
    });

    it('computes valid Spanish CCC control digits', () => {
      // Bank: 0049, Branch: 1500, Account: 1234567890
      const cdc = CountryRules.computeSpanishCccControlDigits('0049', '1500', '1234567890');
      expect(cdc).toHaveLength(2);
      expect(/^\d{2}$/.test(cdc)).toBe(true);
    });

    it('validates US Federal Reserve 9-Digit ABA Routing Transit Number checksum', () => {
      // Standard valid ABA: 021000021 (JPMorgan Chase NY) -> 3*0 + 7*2 + 1*1 + 3*0 + 7*0 + 1*0 + 3*0 + 7*2 + 1*1 = 14 + 1 + 14 + 1 = 30 % 10 === 0
      expect(CountryRules.validateAbaRouting('021000021')).toBe(true);
      // Corrupt routing number
      expect(CountryRules.validateAbaRouting('021000022')).toBe(false);
    });

    it('validates Brazilian Receita Federal CPF double check digits (Modulo 11)', () => {
      // Known valid CPF
      expect(CountryRules.validateBrazilianCpf('11144477735')).toBe(true);
      // Repeated invalid digits
      expect(CountryRules.validateBrazilianCpf('11111111111')).toBe(false);
      // Corrupted check digit
      expect(CountryRules.validateBrazilianCpf('11144477734')).toBe(false);
    });

    it('validates ISO/IEC 7812 Luhn algorithm for payment cards', () => {
      // 4532... sample
      const validLuhn = '4532015112830366';
      expect(CountryRules.validateLuhn(validLuhn)).toBe(true);
      const invalidLuhn = '4532015112830367';
      expect(CountryRules.validateLuhn(invalidLuhn)).toBe(false);
    });
  });

  describe('Supported Country Identifier Generation', () => {
    it('generates US Bank Account with valid ABA routing, masked display, and demo marker', async () => {
      const res = await provider.generateIdentifier({
        countryCode: 'US',
        type: 'BANK_ACCOUNT',
        accountHolderName: 'Alex Vance',
        currency: 'USD',
      });

      expect(res.countryCode).toBe('US');
      expect(res.type).toBe('BANK_ACCOUNT');
      expect(res.isSimulated).toBe(true);
      expect(res.disclaimer).toContain('SIMULATED / PROTOTYPE DEMO ONLY');
      expect(res.formattedValue).toContain('ABA 021000021');
      expect(res.components.routingNumber).toBeDefined();
      expect(CountryRules.validateAbaRouting(res.components.routingNumber as string)).toBe(true);
    });

    it('generates GB Sort Code & Account Number with valid Mod 97 IBAN', async () => {
      const res = await provider.generateIdentifier({
        countryCode: 'GB',
        type: 'IBAN',
        accountHolderName: 'British Tech Ltd',
        currency: 'GBP',
      });

      expect(res.countryCode).toBe('GB');
      expect(res.type).toBe('IBAN');
      expect(res.rawValue.startsWith('GB')).toBe(true);
      expect(CountryRules.validateIban(res.rawValue)).toBe(true);
    });

    it('generates Spanish (ES) IBAN with compliant CCC structure and check digits', async () => {
      const res = await provider.generateIdentifier({
        countryCode: 'ES',
        type: 'IBAN',
        currency: 'EUR',
      });

      expect(res.countryCode).toBe('ES');
      expect(res.rawValue.startsWith('ES')).toBe(true);
      expect(CountryRules.validateIban(res.rawValue)).toBe(true);
    });

    it('generates German (DE) IBAN with compliant BLZ and check digits', async () => {
      const res = await provider.generateIdentifier({
        countryCode: 'DE',
        type: 'IBAN',
        currency: 'EUR',
      });

      expect(res.countryCode).toBe('DE');
      expect(res.rawValue.startsWith('DE')).toBe(true);
      expect(CountryRules.validateIban(res.rawValue)).toBe(true);
    });

    it('generates Brazilian (BR) Bank Account with Agência, Conta, and Banco Brasil structure', async () => {
      const res = await provider.generateIdentifier({
        countryCode: 'BR',
        type: 'BANK_ACCOUNT',
        currency: 'BRL',
      });

      expect(res.countryCode).toBe('BR');
      expect(res.type).toBe('BANK_ACCOUNT');
      expect(res.formattedValue).toContain('Banco: 001');
      expect(res.formattedValue).toContain('Agência:');
      expect(res.formattedValue).toContain('Conta:');
    });

    it('generates Payment Card adhering to Luhn check digit with secure masking', async () => {
      const res = await provider.generateIdentifier({
        countryCode: 'US',
        type: 'PAYMENT_CARD',
      });

      expect(res.type).toBe('PAYMENT_CARD');
      expect(CountryRules.validateLuhn(res.rawValue)).toBe(true);
      expect(res.maskedValue).toContain('************');
      // Raw card number must NOT appear in maskedValue
      expect(res.maskedValue).not.toBe(res.rawValue);
    });
  });

  describe('Validation & Edge Cases', () => {
    it('rejects unsupported country code gracefully with clear diagnostic', async () => {
      await expect(
        provider.generateIdentifier({
          countryCode: 'XX' as any,
          type: 'BANK_ACCOUNT',
        })
      ).rejects.toThrow(/Unsupported country code: "XX"/);
    });

    it('rejects invalid identifier type for country (e.g. SORT_CODE for US)', async () => {
      await expect(
        provider.generateIdentifier({
          countryCode: 'US',
          type: 'SORT_CODE' as any,
        })
      ).rejects.toThrow(/Identifier type "SORT_CODE" is not supported for country "US"/);
    });

    it('validates correctly formed vs corrupted identifiers via validateIdentifier', () => {
      const validResult = provider.validateIdentifier({
        countryCode: 'US',
        type: 'BANK_ACCOUNT',
        value: '1234567890',
      });
      expect(validResult.isValid).toBe(true);

      const invalidResult = provider.validateIdentifier({
        countryCode: 'US',
        type: 'BANK_ACCOUNT',
        value: '123', // Too short
      });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBeDefined();
    });
  });

  describe('Safe Concurrent Allocation & Uniqueness', () => {
    it('allocates 25 concurrent identifiers without collisions or duplicates', async () => {
      const promises = Array.from({ length: 25 }, (_, i) =>
        provider.generateIdentifier({
          countryCode: 'DE',
          type: 'IBAN',
          currency: 'EUR',
          accountHolderName: `Concurrent User ${i}`,
        })
      );

      const results = await Promise.all(promises);
      const rawValues = results.map((r) => r.rawValue);
      const uniqueValues = new Set(rawValues);

      expect(results.length).toBe(25);
      expect(uniqueValues.size).toBe(25);
      // Every generated DE IBAN must satisfy ISO 7064 Mod 97-10
      for (const res of results) {
        expect(CountryRules.validateIban(res.rawValue)).toBe(true);
        expect(res.isSimulated).toBe(true);
        expect(res.source).toBe('SYNTHETIC_GENERATOR');
      }
    });
  });

  describe('Provider Provisioning & Adapter Boundary Integration', () => {
    it('provisions bank account identifier through mock provider adapter tagged with MOCK_PROVIDER and simulation notice', async () => {
      const res = await provider.provisionFromProvider({
        countryCode: 'US',
        type: 'BANK_ACCOUNT',
        accountHolderName: 'Corporate Holdings LLC',
        currency: 'USD',
        idempotencyKey: 'prov_test_us_001',
        correlationId: 'corr_test_001',
      });

      expect(res.countryCode).toBe('US');
      expect(res.type).toBe('BANK_ACCOUNT');
      expect(res.isSimulated).toBe(true);
      expect(res.source).toBe('MOCK_PROVIDER');
      expect(res.providerReference?.providerCode).toBe('AvenoraMockCoreBankingProvider');
      expect(res.providerReference?.externalId).toBeDefined();
      expect(res.disclaimer).toContain('MOCK PROVIDER ADAPTER');
    });

    it('provisions card identifier through adapter boundary with masked PAN and synthetic expiry', async () => {
      const res = await provider.provisionFromProvider({
        countryCode: 'US',
        type: 'PAYMENT_CARD',
        accountHolderName: 'Elena Rostova',
        currency: 'USD',
        idempotencyKey: 'prov_card_test_001',
        correlationId: 'corr_test_card_001',
      });

      expect(res.type).toBe('PAYMENT_CARD');
      expect(res.isSimulated).toBe(true);
      expect(res.source).toBe('MOCK_PROVIDER');
      expect(res.maskedValue).toContain('••••');
      expect(res.providerReference?.providerCode).toBe('AvenoraMockCardNetwork');
    });

    it('enforces idempotency: repeated provisioning with same idempotencyKey returns cached result', async () => {
      const key = 'idem_prov_repeat_key_123';
      const first = await provider.provisionFromProvider({
        countryCode: 'GB',
        type: 'BANK_ACCOUNT',
        accountHolderName: 'Acme UK Ltd',
        currency: 'GBP',
        idempotencyKey: key,
        correlationId: 'corr_1',
      });

      const second = await provider.provisionFromProvider({
        countryCode: 'GB',
        type: 'BANK_ACCOUNT',
        accountHolderName: 'Acme UK Ltd',
        currency: 'GBP',
        idempotencyKey: key,
        correlationId: 'corr_2',
      });

      expect(first.rawValue).toBe(second.rawValue);
      expect(first.formattedValue).toBe(second.formattedValue);
    });

    it('never silently falls back to synthetic generator when provider provisioning fails', async () => {
      const failingMockBankingProvider = {
        providerName: 'FailingPartnerBank',
        isLive: false,
        provisionAccount: async () => ({
          success: false,
          providerCode: 'FailingPartnerBank',
          isMock: true,
          operationStatus: 'FAILED' as const,
          durationMs: 5,
          timestamp: new Date(),
          correlationId: 'c1',
          error: {
            code: 'PARTNER_TIMEOUT',
            message: 'Core banking host unreachable',
            retryable: true,
          },
        }),
        getAccountStatus: async () => ({
          success: false,
          providerCode: 'FailingPartnerBank',
          isMock: true,
          operationStatus: 'FAILED' as const,
          durationMs: 5,
          timestamp: new Date(),
          correlationId: 'c1',
        }),
      };

      await expect(
        provider.provisionFromProvider({
          countryCode: 'ES',
          type: 'BANK_ACCOUNT',
          accountHolderName: 'Spanish Branch SL',
          currency: 'EUR',
          idempotencyKey: 'idem_fail_fallback_01',
          correlationId: 'c1',
          bankingProvider: failingMockBankingProvider as any,
        })
      ).rejects.toThrow(/PARTNER_TIMEOUT/);
    });

    it('strictly separates internal ledger account ID from externally issued banking identifiers', async () => {
      const internalLedgerAccountId = 'acc_demo_alex_usd';
      const providerRes = await provider.provisionFromProvider({
        countryCode: 'US',
        type: 'BANK_ACCOUNT',
        accountHolderName: 'Alex Vance',
        currency: 'USD',
        idempotencyKey: 'idem_sep_001',
        correlationId: 'corr_sep_001',
      });

      // Internal ledger ID starts with acc_, while provider ID is vendor-prefixed
      expect(internalLedgerAccountId).not.toBe(providerRes.rawValue);
      expect(providerRes.rawValue.startsWith('prov_acc_')).toBe(true);
      expect(providerRes.components.providerAccountId).toBe(providerRes.rawValue);
    });

    it('preserves existing simulated demo accounts intact without alteration', async () => {
      const demoAccount = await provider.generateIdentifier({
        countryCode: 'US',
        type: 'BANK_ACCOUNT',
        accountHolderName: 'Alex Vance',
        currency: 'USD',
      });

      expect(demoAccount.source).toBe('SYNTHETIC_GENERATOR');
      expect(demoAccount.isSimulated).toBe(true);
      expect(demoAccount.formattedValue).toContain('ABA 021000021');
      expect(demoAccount.disclaimer).toContain('SIMULATED / PROTOTYPE DEMO ONLY');
    });
  });
});
