/**
 * @license Apache-2.0
 * Primary simulated domestic bank account lifecycle — KYC-gated, idempotent, auditable.
 */

import {
  generatePartialIbanForCountry,
  resolvePrimaryGenerationRequest,
} from '../../domain/country/countryBankAccountGenerator.ts';
import { resolvePrimaryFiatCurrency } from '../../domain/country/countryPrimaryCurrency.ts';
import { DomesticSchemeId } from '../../domain/country/CountryBankingRegistry.ts';
import { CountryIdentifierResult, IIdentifierProvider } from '../../domain/country/CountryTypes.ts';
import { isKycBypassEnabled } from '../../config/prototypeAccess.ts';
import { AuthService, defaultAuthService } from './auth.service.ts';
import { defaultAuditService } from './audit.service.ts';
import { defaultEmailService, voidEmail } from './email.service.ts';
import { defaultIdentifierProvider } from './identifier.service.ts';
import type { KycProfileRecord } from './kyc.service.ts';

export type DomesticAccountGenerationStatus =
  | 'NOT_ELIGIBLE'
  | 'PENDING_GENERATION'
  | 'GENERATED'
  | 'GENERATION_FAILED'
  | 'FORMAT_NOT_IMPLEMENTED'
  | 'COUNTRY_MISMATCH_REQUIRES_REVIEW';

export interface CustomerDomesticBankAccountRecord {
  id: string;
  userId: string;
  verifiedCountryCode: string;
  schemeId: DomesticSchemeId;
  generationStatus: DomesticAccountGenerationStatus;
  identifierType: 'BANK_ACCOUNT' | 'IBAN';
  formattedValue?: string;
  rawValue?: string;
  maskedValue?: string;
  components: Record<string, string>;
  isSimulated: boolean;
  source: 'SYNTHETIC_GENERATOR';
  disclaimer: string;
  formatVersion: string;
  ruleSourceVersion: string;
  kycProfileId?: string;
  kycApprovalReference?: string;
  generatedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PROTOTYPE_DISCLAIMER =
  'SIMULATED ACCOUNT — PROTOTYPE ONLY — NOT FOR REAL DEPOSITS, WITHDRAWALS, OR LIVE FINANCIAL SETTLEMENT.';

/** Bump when identifier component layout changes so existing in-memory accounts regenerate. */
const DOMESTIC_FORMAT_VERSION = '1.2.1';

export class DomesticBankAccountService {
  private accountsByUserId = new Map<string, CustomerDomesticBankAccountRecord>();
  private rawValueOwner = new Map<string, string>();
  /** Ensures Pix keys are unique across all customer domestic accounts. */
  private pixKeyOwner = new Map<string, string>();
  private userLocks = new Map<string, Promise<void>>();

  constructor(
    private readonly identifierProvider: IIdentifierProvider = defaultIdentifierProvider,
    private readonly authService: AuthService = defaultAuthService
  ) {}

  public getPrimaryAccountForUser(userId: string): CustomerDomesticBankAccountRecord | undefined {
    return this.accountsByUserId.get(userId);
  }

  /** Drop stored domestic identifiers (e.g. when reversing a KYC bypass unlock). */
  public clearPrimaryAccountForUser(userId: string): void {
    const existing = this.accountsByUserId.get(userId);
    if (existing?.rawValue) {
      this.rawValueOwner.delete(existing.rawValue);
    }
    const pixKey = existing?.components?.pixKey;
    if (pixKey) {
      this.pixKeyOwner.delete(pixKey);
    }
    this.accountsByUserId.delete(userId);
  }

  public getCustomerSafeView(record: CustomerDomesticBankAccountRecord) {
    return {
      id: record.id,
      verifiedCountryCode: record.verifiedCountryCode,
      schemeId: record.schemeId,
      generationStatus: record.generationStatus,
      identifierType: record.identifierType,
      formattedValue: record.formattedValue,
      maskedValue: record.maskedValue,
      displayFields: this.buildDisplayFields(record),
      components: record.generationStatus === 'GENERATED' ? record.components : {},
      source: record.source,
      generatedAt: record.generatedAt,
      lastError: record.lastError,
    };
  }

  private buildDisplayFields(record: CustomerDomesticBankAccountRecord): Array<{ key: string; label: string; value: string }> {
    if (record.generationStatus !== 'GENERATED') return [];
    const c = record.components;
    const fields: Array<{ key: string; label: string; value: string }> = [];
    if (c.routingNumber) fields.push({ key: 'routingNumber', label: 'Routing number', value: c.routingNumber });
    if (c.accountNumber) fields.push({ key: 'accountNumber', label: 'Account number', value: c.accountNumber });
    if (c.sortCode) fields.push({ key: 'sortCode', label: 'Sort code', value: c.sortCode });
    if (c.iban) fields.push({ key: 'iban', label: 'IBAN', value: c.iban });
    if (c.banco) fields.push({ key: 'banco', label: 'Bank code', value: c.banco });
    if (c.agencia) fields.push({ key: 'agencia', label: 'Branch (Agência)', value: c.agencia });
    if (c.conta) fields.push({ key: 'conta', label: 'Account (Conta)', value: c.conta });
    // Pix is Brazil-only; only present on BR FEBRABAN generations.
    if (c.pixKey && record.verifiedCountryCode === 'BR') {
      fields.push({ key: 'pixKey', label: 'Pix key', value: c.pixKey });
    }
    if (c.blz) fields.push({ key: 'blz', label: 'Bank code (BLZ)', value: c.blz });
    if (c.bank) fields.push({ key: 'bank', label: 'Bank code', value: c.bank });
    if (c.branch) fields.push({ key: 'branch', label: 'Branch code', value: c.branch });
    if (fields.length === 0 && record.formattedValue) {
      fields.push({ key: 'primary', label: 'Account identifier', value: record.formattedValue });
    }
    return fields;
  }

  private async withUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.userLocks.get(userId) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.userLocks.set(userId, prev.then(() => gate));
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  /**
   * Idempotent orchestration after KYC approval (or prototype KYC bypass).
   */
  public async ensurePrimaryAccountAfterKycApproval(params: {
    userId: string;
    kycProfile: KycProfileRecord;
    correlationId?: string;
  }): Promise<CustomerDomesticBankAccountRecord> {
    return this.withUserLock(params.userId, () => this.ensurePrimaryAccountAfterKycApprovalInternal(params));
  }

  /**
   * Generate/backfill domestic identifiers for KYC-approved users (or when bypass is explicitly enabled).
   */
  public async ensurePrimaryAccountForActiveUser(params: {
    userId: string;
    correlationId?: string;
  }): Promise<CustomerDomesticBankAccountRecord | undefined> {
    const user = this.authService.getUserById(params.userId);
    if (!user) return undefined;

    const bypass = isKycBypassEnabled();
    if (!bypass && user.kycStatus !== 'APPROVED') {
      return this.getPrimaryAccountForUser(params.userId);
    }

    const { defaultKycService } = await import('./kyc.service.ts');
    const kycProfile = defaultKycService.getOrCreateProfile(params.userId);

    // Bypass only: force-approve so identifiers can unlock without the KYC workflow.
    if (bypass) {
      kycProfile.status = 'APPROVED';
      kycProfile.verifiedCountryCode = kycProfile.verifiedCountryCode || user.countryCode;
      if (!kycProfile.residentialAddress) {
        kycProfile.residentialAddress = {
          street: 'Prototype address pending KYC submission',
          city: 'N/A',
          postalCode: '00000',
          country: user.countryCode,
        };
      }
      if (user.kycStatus !== 'APPROVED') {
        user.kycStatus = 'APPROVED';
        user.updatedAt = new Date();
      }
    }

    return this.ensurePrimaryAccountAfterKycApproval({
      userId: params.userId,
      kycProfile,
      correlationId: params.correlationId,
    });
  }

  private async ensurePrimaryAccountAfterKycApprovalInternal(params: {
    userId: string;
    kycProfile: KycProfileRecord;
    correlationId?: string;
  }): Promise<CustomerDomesticBankAccountRecord> {
    const existing = this.accountsByUserId.get(params.userId);
    if (
      existing?.generationStatus === 'GENERATED' &&
      existing.formatVersion === DOMESTIC_FORMAT_VERSION
    ) {
      return existing;
    }
    if (existing?.generationStatus === 'FORMAT_NOT_IMPLEMENTED') {
      return existing;
    }
    if (existing?.generationStatus === 'COUNTRY_MISMATCH_REQUIRES_REVIEW' && !isKycBypassEnabled()) {
      return existing;
    }
    // Outdated format version: free the old identifier so we can regenerate country-format numbers.
    if (existing?.generationStatus === 'GENERATED') {
      if (existing.rawValue) {
        this.rawValueOwner.delete(existing.rawValue);
      }
      if (existing.components?.pixKey) {
        this.pixKeyOwner.delete(existing.components.pixKey);
      }
      this.accountsByUserId.delete(params.userId);
    }

    const user = this.authService.getUserById(params.userId);
    const bypass = isKycBypassEnabled();
    if (!user || (!bypass && user.kycStatus !== 'APPROVED')) {
      return this.upsertPlaceholder(params.userId, {
        generationStatus: 'NOT_ELIGIBLE',
        verifiedCountryCode: user?.countryCode ?? 'US',
        schemeId: 'FORMAT_NOT_IMPLEMENTED',
        lastError: 'KYC approval required before domestic account generation.',
      });
    }

    // Heal in-memory KYC profile if user is APPROVED / bypassed but profile was recreated after restart.
    if (params.kycProfile.status !== 'APPROVED') {
      params.kycProfile.status = 'APPROVED';
      params.kycProfile.verifiedCountryCode =
        params.kycProfile.verifiedCountryCode ||
        params.kycProfile.residentialAddress?.country ||
        user.countryCode;
    }

    const signupCountry = user.countryCode.trim().toUpperCase();
    let verifiedCountry = (
      params.kycProfile.verifiedCountryCode ||
      params.kycProfile.residentialAddress?.country ||
      signupCountry
    )
      .trim()
      .toUpperCase();

    // Prototype bypass: always use signup country so accounts unlock immediately.
    if (bypass) {
      verifiedCountry = signupCountry;
    }

    params.kycProfile.verifiedCountryCode = verifiedCountry;

    if (!bypass && verifiedCountry !== signupCountry) {
      const mismatch = this.upsertPlaceholder(params.userId, {
        generationStatus: 'COUNTRY_MISMATCH_REQUIRES_REVIEW',
        verifiedCountryCode: verifiedCountry,
        schemeId: 'FORMAT_NOT_IMPLEMENTED',
        lastError: `Signup country (${signupCountry}) differs from KYC-verified country (${verifiedCountry}). Administrative resolution required.`,
        kycProfileId: params.kycProfile.id,
      });
      defaultAuditService.logAction({
        action: 'KYC_REVIEWED',
        actorUserId: 'system_domestic_account',
        actorRole: 'SYSTEM',
        resourceType: 'DOMESTIC_BANK_ACCOUNT',
        resourceId: mismatch.id,
        reason: 'Country mismatch blocks automated domestic account generation',
        details: {
          userId: params.userId,
          signupCountry,
          verifiedCountry,
          correlationId: params.correlationId,
        },
      });
      return mismatch;
    }

    const pending = this.upsertPlaceholder(params.userId, {
      generationStatus: 'PENDING_GENERATION',
      verifiedCountryCode: verifiedCountry,
      schemeId: 'FORMAT_NOT_IMPLEMENTED',
      kycProfileId: params.kycProfile.id,
      kycApprovalReference: params.kycProfile.id,
    });

    try {
      const userName = `${params.kycProfile.legalFirstName ?? ''} ${params.kycProfile.legalLastName ?? ''}`.trim();
      const currency = resolvePrimaryFiatCurrency(verifiedCountry);
      const plan = resolvePrimaryGenerationRequest(verifiedCountry);

      if (plan.formatNotImplemented) {
        const done = this.finalizeRecord(pending, {
          generationStatus: 'FORMAT_NOT_IMPLEMENTED',
          schemeId: plan.ruleScheme,
          identifierType: 'BANK_ACCOUNT',
          ruleSourceVersion: plan.ruleVersion,
          lastError: 'No verified domestic banking format is available for this country.',
        });
        this.auditGeneration(params.userId, done, params.correlationId);
        return done;
      }

      let identifier: CountryIdentifierResult;
      if (plan.delegateProviderCountry && plan.identifierType) {
        identifier = await this.identifierProvider.generateIdentifier({
          countryCode: plan.delegateProviderCountry,
          type: plan.identifierType,
          accountHolderName: userName || user.fullName,
          currency,
        });
        identifier = {
          ...identifier,
          countryCode: verifiedCountry as CountryIdentifierResult['countryCode'],
          disclaimer: PROTOTYPE_DISCLAIMER,
          source: 'SYNTHETIC_GENERATOR',
        };
      } else if (plan.partialIban) {
        identifier = generatePartialIbanForCountry(plan.partialIban.countryCode, plan.partialIban.ibanTotalLength);
      } else {
        throw new Error('Generation plan missing delegate and partial IBAN instructions.');
      }

      const rawOwner = this.rawValueOwner.get(identifier.rawValue);
      if (rawOwner && rawOwner !== params.userId) {
        throw new Error('Unique domestic identifier collision; retry required.');
      }

      const pixKey = identifier.components?.pixKey;
      if (pixKey) {
        const pixOwner = this.pixKeyOwner.get(pixKey);
        if (pixOwner && pixOwner !== params.userId) {
          throw new Error('Unique Pix key collision; retry required.');
        }
      }

      const generated = this.finalizeRecord(pending, {
        generationStatus: 'GENERATED',
        schemeId: plan.ruleScheme,
        identifierType: identifier.type === 'IBAN' ? 'IBAN' : 'BANK_ACCOUNT',
        formattedValue: identifier.formattedValue,
        rawValue: identifier.rawValue,
        maskedValue: identifier.maskedValue,
        components: {
          ...identifier.components,
          ...(identifier.type === 'IBAN' ? { iban: identifier.rawValue } : {}),
        },
        isSimulated: true,
        source: 'SYNTHETIC_GENERATOR',
        disclaimer: identifier.disclaimer || PROTOTYPE_DISCLAIMER,
        formatVersion: DOMESTIC_FORMAT_VERSION,
        ruleSourceVersion: plan.ruleVersion,
        generatedAt: identifier.generatedAt ?? new Date(),
        lastError: undefined,
      });

      this.rawValueOwner.set(identifier.rawValue, params.userId);
      if (pixKey) {
        this.pixKeyOwner.set(pixKey, params.userId);
      }
      this.auditGeneration(params.userId, generated, params.correlationId);

      if (user) {
        const accountSummary =
          generated.formattedValue || generated.maskedValue || generated.rawValue || generated.id;
        voidEmail(
          'domestic-account-issued',
          defaultEmailService.sendDomesticAccountIssuedEmail({
            to: user.email,
            fullName: user.fullName,
            accountSummary,
            currency,
          }),
        );
      }

      return generated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown generation error';
      const failed = this.finalizeRecord(pending, {
        generationStatus: 'GENERATION_FAILED',
        lastError: message,
      });
      defaultAuditService.logAction({
        action: 'CONFIG_CHANGED',
        actorUserId: 'system_domestic_account',
        actorRole: 'SYSTEM',
        resourceType: 'DOMESTIC_BANK_ACCOUNT',
        resourceId: failed.id,
        reason: 'Domestic account generation failed',
        details: { userId: params.userId, error: message, correlationId: params.correlationId },
      });

      const notifyUser = user ?? this.authService.getUserById(params.userId);
      if (notifyUser) {
        voidEmail(
          'domestic-account-failed',
          defaultEmailService.sendDomesticAccountFailedEmail({
            to: notifyUser.email,
            fullName: notifyUser.fullName,
            reason: message,
          }),
        );
      }

      return failed;
    }
  }

  public async retryGenerationForUser(params: {
    actorUserId: string;
    actorRole: string;
    targetUserId: string;
    kycProfile: KycProfileRecord;
    dryRun?: boolean;
  }): Promise<{ dryRun: boolean; preview?: CustomerDomesticBankAccountRecord; result?: CustomerDomesticBankAccountRecord }> {
    if (params.kycProfile.status !== 'APPROVED' && !isKycBypassEnabled()) {
      throw new Error('Cannot retry domestic account generation: KYC is not approved.');
    }
    if (params.dryRun) {
      const plan = resolvePrimaryGenerationRequest(
        params.kycProfile.verifiedCountryCode || params.kycProfile.residentialAddress?.country || 'US'
      );
      return {
        dryRun: true,
        preview: {
          id: 'dry_run',
          userId: params.targetUserId,
          verifiedCountryCode: params.kycProfile.residentialAddress?.country ?? 'US',
          schemeId: plan.ruleScheme,
          generationStatus: plan.formatNotImplemented ? 'FORMAT_NOT_IMPLEMENTED' : 'PENDING_GENERATION',
          identifierType: plan.identifierType ?? 'BANK_ACCOUNT',
          components: {},
          isSimulated: true,
          source: 'SYNTHETIC_GENERATOR',
          disclaimer: PROTOTYPE_DISCLAIMER,
          formatVersion: DOMESTIC_FORMAT_VERSION,
          ruleSourceVersion: plan.ruleVersion,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    }
    const result = await this.ensurePrimaryAccountAfterKycApproval({
      userId: params.targetUserId,
      kycProfile: params.kycProfile,
      correlationId: `admin_retry_${params.actorUserId}`,
    });
    defaultAuditService.logAction({
      action: 'CONFIG_CHANGED',
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: 'DOMESTIC_BANK_ACCOUNT',
      resourceId: result.id,
      reason: 'Manual domestic account generation retry',
      details: { targetUserId: params.targetUserId, status: result.generationStatus },
    });
    return { dryRun: false, result };
  }

  private auditGeneration(userId: string, record: CustomerDomesticBankAccountRecord, correlationId?: string) {
    defaultAuditService.logAction({
      action: 'DOMESTIC_ACCOUNT_GENERATED',
      actorUserId: 'system_domestic_account',
      actorRole: 'SYSTEM',
      resourceType: 'DOMESTIC_BANK_ACCOUNT',
      resourceId: record.id,
      newState: record.generationStatus,
      details: {
        userId,
        schemeId: record.schemeId,
        verifiedCountryCode: record.verifiedCountryCode,
        source: record.source,
        isSimulated: record.isSimulated,
        correlationId,
        maskedPreview: record.maskedValue,
      },
    });
  }

  private upsertPlaceholder(
    userId: string,
    patch: Partial<CustomerDomesticBankAccountRecord> & {
      generationStatus: DomesticAccountGenerationStatus;
      verifiedCountryCode: string;
      schemeId: DomesticSchemeId;
    }
  ): CustomerDomesticBankAccountRecord {
    const now = new Date();
    const existing = this.accountsByUserId.get(userId);
    const record: CustomerDomesticBankAccountRecord = {
      id: existing?.id ?? `dba_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      verifiedCountryCode: patch.verifiedCountryCode,
      schemeId: patch.schemeId,
      generationStatus: patch.generationStatus,
      identifierType: patch.identifierType ?? existing?.identifierType ?? 'BANK_ACCOUNT',
      formattedValue: patch.formattedValue ?? existing?.formattedValue,
      rawValue: patch.rawValue ?? existing?.rawValue,
      maskedValue: patch.maskedValue ?? existing?.maskedValue,
      components: patch.components ?? existing?.components ?? {},
      isSimulated: true,
      source: 'SYNTHETIC_GENERATOR',
      disclaimer: patch.disclaimer ?? existing?.disclaimer ?? PROTOTYPE_DISCLAIMER,
      formatVersion: patch.formatVersion ?? existing?.formatVersion ?? '1.0.0',
      ruleSourceVersion: patch.ruleSourceVersion ?? existing?.ruleSourceVersion ?? 'unknown',
      kycProfileId: patch.kycProfileId ?? existing?.kycProfileId,
      kycApprovalReference: patch.kycApprovalReference ?? existing?.kycApprovalReference,
      generatedAt: patch.generatedAt ?? existing?.generatedAt,
      lastError: patch.lastError ?? existing?.lastError,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.accountsByUserId.set(userId, record);
    return record;
  }

  private finalizeRecord(
    base: CustomerDomesticBankAccountRecord,
    patch: Partial<CustomerDomesticBankAccountRecord>
  ): CustomerDomesticBankAccountRecord {
    const record = this.upsertPlaceholder(base.userId, {
      ...base,
      ...patch,
      verifiedCountryCode: patch.verifiedCountryCode ?? base.verifiedCountryCode,
      schemeId: patch.schemeId ?? base.schemeId,
      generationStatus: patch.generationStatus ?? base.generationStatus,
    });
    return record;
  }
}

export const defaultDomesticBankAccountService = new DomesticBankAccountService();
