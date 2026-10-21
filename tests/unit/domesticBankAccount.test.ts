/**
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ISO3166_COUNTRY_CODES } from '../../src/config/countryOptions.ts';
import { getCountryBankingRule, listAllCountryBankingRules } from '../../src/domain/country/CountryBankingRegistry.ts';
import { CountryRules } from '../../src/domain/country/CountryRules.ts';
import { DomesticBankAccountService } from '../../src/server/services/domesticBankAccount.service.ts';
import { SyntheticIdentifierProvider } from '../../src/server/services/identifier.service.ts';
import { KycService } from '../../src/server/services/kyc.service.ts';
import { AuthService } from '../../src/server/services/auth.service.ts';

describe('Country banking registry coverage', () => {
  it('has an explicit registry entry for every signup ISO country', () => {
    expect(listAllCountryBankingRules().length).toBe(ISO3166_COUNTRY_CODES.length);
    for (const code of ISO3166_COUNTRY_CODES) {
      const rule = getCountryBankingRule(code);
      expect(rule.countryCode).toBe(code);
      expect(rule.scheme).toBeTruthy();
    }
  });

  it('does not silently fall back US generator for unsupported countries', () => {
    const rule = getCountryBankingRule('JP');
    expect(rule.scheme).toBe('FORMAT_NOT_IMPLEMENTED');
    expect(rule.syntheticGenerationSupport).toBe(false);
  });
});

describe('KYC-gated domestic account generation', () => {
  let auth: AuthService;
  let kyc: KycService;
  let domestic: DomesticBankAccountService;
  let provider: SyntheticIdentifierProvider;

  beforeEach(() => {
    auth = new AuthService();
    kyc = new KycService();
    provider = new SyntheticIdentifierProvider();
    domestic = new DomesticBankAccountService(provider, auth);
  });

  async function registerCustomer(country: string, emailSuffix: string) {
    const reg = await auth.registerCustomer({
      email: `domestic-${emailSuffix}@example.test`,
      password: 'AvenoraPassword2026!',
      fullName: 'Test Customer',
      phoneNumber: '12025550111',
      transactionPin: '1234',
      countryCode: country,
    });
    return reg.user;
  }

  function submitKycUs(userId: string, country: string) {
    kyc.submitVerification({
      userId,
      legalFirstName: 'Test',
      legalLastName: 'User',
      dateOfBirth: '1990-01-01',
      taxIdType: country === 'BR' ? 'CPF' : country === 'ES' ? 'DNI' : 'SSN',
      taxIdNumber: country === 'BR' ? '11144477735' : country === 'ES' ? '12345678Z' : '123456789',
      residentialAddress: {
        street: '1 Main',
        city: 'City',
        postalCode: '00000',
        country,
      },
    });
  }

  it('does not generate before KYC approval', async () => {
    const user = await registerCustomer('US', 'pre');
    submitKycUs(user.id, 'US');
    const profile = kyc.getOrCreateProfile(user.id);
    const record = await domestic.ensurePrimaryAccountAfterKycApproval({ userId: user.id, kycProfile: profile });
    expect(record.generationStatus).toBe('NOT_ELIGIBLE');
    expect(record.rawValue).toBeUndefined();
  });

  it('generates US routing/account after compliance approval', async () => {
    const user = await registerCustomer('US', 'us');
    submitKycUs(user.id, 'US');
    const authUser = auth.getUserById(user.id)!;
    authUser.kycStatus = 'APPROVED';
    const profile = kyc.getOrCreateProfile(user.id);
    profile.status = 'APPROVED';
    profile.verifiedCountryCode = 'US';
    profile.residentialAddress = { street: '1', city: 'NYC', postalCode: '10001', country: 'US' };

    const record = await domestic.ensurePrimaryAccountAfterKycApproval({ userId: user.id, kycProfile: profile });
    expect(record.generationStatus).toBe('GENERATED');
    expect(record.components.routingNumber).toBeDefined();
    expect(CountryRules.validateAbaRouting(record.components.routingNumber as string)).toBe(true);
    expect(record.source).toBe('SYNTHETIC_GENERATOR');

    const again = await domestic.ensurePrimaryAccountAfterKycApproval({ userId: user.id, kycProfile: profile });
    expect(again.id).toBe(record.id);
    expect(again.rawValue).toBe(record.rawValue);
  });

  it('blocks generation when signup and KYC countries conflict', async () => {
    const user = await registerCustomer('US', 'mismatch');
    submitKycUs(user.id, 'US');
    auth.getUserById(user.id)!.kycStatus = 'APPROVED';
    const profile = kyc.getOrCreateProfile(user.id);
    profile.status = 'APPROVED';
    profile.verifiedCountryCode = 'GB';
    profile.residentialAddress = { street: '1', city: 'London', postalCode: 'SW1', country: 'GB' };

    const record = await domestic.ensurePrimaryAccountAfterKycApproval({ userId: user.id, kycProfile: profile });
    expect(record.generationStatus).toBe('COUNTRY_MISMATCH_REQUIRES_REVIEW');
    expect(record.rawValue).toBeUndefined();
  });

  it('generates valid partial IBAN for FR (registry partial scheme)', async () => {
    const user = await registerCustomer('FR', 'fr');
    const authUser = auth.getUserById(user.id)!;
    authUser.kycStatus = 'APPROVED';
    const profile = kyc.getOrCreateProfile(user.id);
    profile.status = 'APPROVED';
    profile.verifiedCountryCode = 'FR';
    profile.residentialAddress = { street: '1', city: 'Paris', postalCode: '75001', country: 'FR' };

    const record = await domestic.ensurePrimaryAccountAfterKycApproval({ userId: user.id, kycProfile: profile });
    expect(record.generationStatus).toBe('GENERATED');
    expect(record.rawValue?.startsWith('FR')).toBe(true);
    expect(CountryRules.validateIban(record.rawValue!)).toBe(true);
  });

  it('marks FORMAT_NOT_IMPLEMENTED for Japan without fabricating details', async () => {
    const user = await registerCustomer('JP', 'jp');
    const authUser = auth.getUserById(user.id)!;
    authUser.kycStatus = 'APPROVED';
    const profile = kyc.getOrCreateProfile(user.id);
    profile.status = 'APPROVED';
    profile.verifiedCountryCode = 'JP';
    profile.residentialAddress = { street: '1', city: 'Tokyo', postalCode: '100', country: 'JP' };

    const record = await domestic.ensurePrimaryAccountAfterKycApproval({ userId: user.id, kycProfile: profile });
    expect(record.generationStatus).toBe('FORMAT_NOT_IMPLEMENTED');
    expect(record.rawValue).toBeUndefined();
  });
});
