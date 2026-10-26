/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Verified Grant Programs & Applications Engine
 *
 * Implements:
 * - Verified public/institutional grant opportunities catalog
 * - Verification status workflow (UNVERIFIED -> PENDING_REVIEW -> VERIFIED / REJECTED)
 * - Grant application lifecycle with eligibility verification
 * - Separation of duties: staff reviewers cannot review their own grant applications
 * - Simulated grant award & disbursement into user's multicurrency wallet with ledger entry
 */

import { Money } from '../../domain/money/Money.ts';
import { getCurrency, isSupportedCurrency } from '../../domain/money/Currency.ts';
import { UserRole, defaultAuthService } from './auth.service.ts';
import { defaultWalletService } from './wallet.service.ts';
import { defaultAuditService } from './audit.service.ts';
import { defaultEmailService, voidEmail } from './email.service.ts';

export type GrantProgramStatus = 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export type GrantApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'NEEDS_MORE_INFORMATION'
  | 'ELIGIBLE_FOR_REVIEW'
  | 'INELIGIBLE'
  | 'APPROVED_FOR_DEMO'
  | 'DECLINED'
  | 'CANCELLED';

export type DisbursementStatus = 'PENDING_SIMULATION' | 'DISBURSED_SIMULATED' | 'FAILED';

export interface GrantProgramRecord {
  id: string;
  name: string;
  description: string;
  organizationName: string;
  fundingSourceRef: string;
  verificationStatus: GrantProgramStatus;
  eligibleCountries: string[];
  fundingMinMinor: string;
  fundingMaxMinor: string;
  formattedFundingRange: string;
  currency: string;
  openingDate: Date;
  closingDate: Date;
  eligibilityCriteria: string[];
  verifiedByUserId?: string;
  verifiedAt?: Date;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrantAwardRecord {
  id: string;
  applicationId: string;
  awardedAmountMinor: string;
  formattedAwardedAmount: string;
  currency: string;
  reconciliationRef: string;
  approvedByUserId: string;
  disbursementStatus: DisbursementStatus;
  disbursedAt?: Date;
  idempotencyKey: string;
  createdAt: Date;
}

export interface GrantApplicationRecord {
  id: string;
  programId: string;
  programName: string;
  userId: string;
  applicantName: string;
  projectTitle: string;
  projectSummary: string;
  requestedAmountMinor: string;
  formattedRequestedAmount: string;
  currency: string;
  status: GrantApplicationStatus;
  eligibilityAnswers: Record<string, boolean | string>;
  documentRefs: string[];
  reviewerUserId?: string;
  reviewerNotes?: string;
  award?: GrantAwardRecord;
  reviewHistory: Array<{
    actorUserId: string;
    previousStatus: GrantApplicationStatus;
    newStatus: GrantApplicationStatus;
    notes?: string;
    timestamp: Date;
  }>;
  submittedAt?: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class GrantService {
  private programs = new Map<string, GrantProgramRecord>();
  private applications = new Map<string, GrantApplicationRecord>();

  constructor() {
    this.seedPrograms();
  }

  private seedPrograms(): void {
    const p1: GrantProgramRecord = {
      id: 'grp_cleantech_2026',
      name: 'Clean Tech & Renewable Innovation Accelerator',
      description:
        'Non-dilutive grant funding for individuals and early research initiatives focused on solar energy optimization, microgrid resilience, and residential decarbonization.',
      organizationName: 'Global Sustainable Energy Foundation',
      fundingSourceRef: 'GSEF-GRANT-FY26-A1',
      verificationStatus: 'VERIFIED',
      eligibleCountries: ['US', 'BR', 'ES', 'DE', 'GB'],
      fundingMinMinor: '1000000', // $10,000.00
      fundingMaxMinor: '5000000', // $50,000.00
      formattedFundingRange: '$10,000.00 – $50,000.00 USD',
      currency: 'USD',
      openingDate: new Date('2026-01-01T00:00:00Z'),
      closingDate: new Date('2026-12-31T23:59:59Z'),
      eligibilityCriteria: [
        'Must demonstrate measurable carbon or energy reduction metrics',
        'Applicant must maintain verified identity and valid residential address',
        'Project plan must be deliverable within 12 months of disbursement',
      ],
      verifiedByUserId: 'usr_compliance_lead',
      verifiedAt: new Date('2026-01-02T10:00:00Z'),
      isPublished: true,
      createdAt: new Date('2026-01-01T09:00:00Z'),
      updatedAt: new Date('2026-01-02T10:00:00Z'),
    };

    const p2: GrantProgramRecord = {
      id: 'grp_microenterprise_2026',
      name: 'European Microenterprise Resilience Grant',
      description:
        'Targeted financial assistance program supporting independent craftspeople, digital freelancers, and rural microenterprises across the European Economic Area.',
      organizationName: 'Pan-European Innovation Alliance',
      fundingSourceRef: 'PEIA-ME-EUR-2026',
      verificationStatus: 'VERIFIED',
      eligibleCountries: ['ES', 'DE', 'FR', 'IT', 'PT'],
      fundingMinMinor: '500000', // €5,000.00
      fundingMaxMinor: '2500000', // €25,000.00
      formattedFundingRange: '€5,000.00 – €25,000.00 EUR',
      currency: 'EUR',
      openingDate: new Date('2026-02-01T00:00:00Z'),
      closingDate: new Date('2026-11-30T23:59:59Z'),
      eligibilityCriteria: [
        'Registered sole proprietor or independent operator in eligible jurisdiction',
        'Must submit 6-month projected operational budget',
        'Compliance with local fiscal requirements',
      ],
      verifiedByUserId: 'usr_compliance_lead',
      verifiedAt: new Date('2026-02-01T14:30:00Z'),
      isPublished: true,
      createdAt: new Date('2026-02-01T09:00:00Z'),
      updatedAt: new Date('2026-02-01T14:30:00Z'),
    };

    const p3: GrantProgramRecord = {
      id: 'grp_digital_latam_2026',
      name: 'Iniciativa de Inclusão Digital e Educação Tecnológica',
      description:
        'Fundo de fomento social destinado a projetos comunitários de capacitação em tecnologia, conectividade escolar e inclusão bancária em áreas vulneráveis.',
      organizationName: 'Instituto Latino-Americano de Desenvolvimento',
      fundingSourceRef: 'ILAD-BR-2026-INCLUSAO',
      verificationStatus: 'VERIFIED',
      eligibleCountries: ['BR'],
      fundingMinMinor: '1500000', // R$ 15.000,00
      fundingMaxMinor: '7500000', // R$ 75.000,00
      formattedFundingRange: 'R$ 15.000,00 – R$ 75.000,00 BRL',
      currency: 'BRL',
      openingDate: new Date('2026-01-15T00:00:00Z'),
      closingDate: new Date('2026-10-15T23:59:59Z'),
      eligibilityCriteria: [
        'Projeto sem fins lucrativos ou de impacto comunitário comprovado no Brasil',
        'Relatório trimestral de prestação de contas com métricas de alunos formados',
        'Conta de liquidação vinculada em moeda BRL',
      ],
      verifiedByUserId: 'usr_compliance_lead',
      verifiedAt: new Date('2026-01-16T11:00:00Z'),
      isPublished: true,
      createdAt: new Date('2026-01-15T09:00:00Z'),
      updatedAt: new Date('2026-01-16T11:00:00Z'),
    };

    const p4: GrantProgramRecord = {
      id: 'grp_open_source_fellowship',
      name: 'Open Source Financial Cryptography Fellowship',
      description:
        'Fellowship grants for independent researchers contributing to reproducible zero-knowledge systems, formal verification of smart contracts, and open banking protocol security.',
      organizationName: 'Decentralized Systems Research Council',
      fundingSourceRef: 'DSRC-OSF-2026',
      verificationStatus: 'PENDING_REVIEW',
      eligibleCountries: ['US', 'ES', 'BR', 'DE', 'GB'],
      fundingMinMinor: '2000000', // $20,000.00
      fundingMaxMinor: '6000000', // $60,000.00
      formattedFundingRange: '$20,000.00 – $60,000.00 USD',
      currency: 'USD',
      openingDate: new Date('2026-04-01T00:00:00Z'),
      closingDate: new Date('2026-12-15T23:59:59Z'),
      eligibilityCriteria: [
        'Code and findings must be published under an OSI-approved permissive open source license',
        'Demonstrated history of contributions to cryptographic or systems software',
      ],
      isPublished: true,
      createdAt: new Date('2026-03-01T10:00:00Z'),
      updatedAt: new Date('2026-03-01T10:00:00Z'),
    };

    this.programs.set(p1.id, p1);
    this.programs.set(p2.id, p2);
    this.programs.set(p3.id, p3);
    this.programs.set(p4.id, p4);
  }

  /**
   * Retrieves all grant programs, optionally filtered.
   */
  public getPrograms(filters?: {
    country?: string;
    currency?: string;
    status?: GrantProgramStatus;
    verifiedOnly?: boolean;
  }): GrantProgramRecord[] {
    let list = Array.from(this.programs.values());

    if (filters?.verifiedOnly) {
      list = list.filter((p) => p.verificationStatus === 'VERIFIED');
    }
    if (filters?.status) {
      list = list.filter((p) => p.verificationStatus === filters.status);
    }
    if (filters?.currency) {
      list = list.filter((p) => p.currency === filters.currency!.toUpperCase());
    }
    if (filters?.country) {
      list = list.filter((p) => p.eligibleCountries.includes(filters.country!.toUpperCase()));
    }

    return list;
  }

  public getProgramById(id: string): GrantProgramRecord | undefined {
    return this.programs.get(id);
  }

  /**
   * Compliance officer verifies or rejects a grant program.
   */
  public verifyProgram(params: {
    programId: string;
    reviewerUserId: string;
    reviewerRole: UserRole;
    newStatus: 'VERIFIED' | 'REJECTED';
  }): GrantProgramRecord {
    const allowedRoles: UserRole[] = ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(params.reviewerRole)) {
      throw new Error('Access denied: only compliance officers or administrators can verify grant programs.');
    }

    const prog = this.programs.get(params.programId);
    if (!prog) throw new Error('Grant program not found.');

    const prevStatus = prog.verificationStatus;
    prog.verificationStatus = params.newStatus;
    prog.verifiedByUserId = params.reviewerUserId;
    prog.verifiedAt = new Date();
    prog.updatedAt = new Date();

    // Durable audit logging
    defaultAuditService.logAction({
      action: 'GRANT_PROGRAM_VERIFIED',
      actorUserId: params.reviewerUserId,
      actorRole: params.reviewerRole,
      resourceType: 'GRANT_PROGRAM',
      resourceId: prog.id,
      previousState: prevStatus,
      newState: params.newStatus,
      reason: `Grant program verification status set to ${params.newStatus}`,
      details: {
        programName: prog.name,
        organizationName: prog.organizationName,
        currency: prog.currency,
      },
    });

    return prog;
  }

  /**
   * Creates a draft or submitted grant application.
   */
  public createApplication(params: {
    programId: string;
    userId: string;
    applicantName: string;
    projectTitle: string;
    projectSummary: string;
    requestedAmountDecimal: string;
    eligibilityAnswers: Record<string, boolean | string>;
    documentRefs?: string[];
  }): GrantApplicationRecord {
    const prog = this.programs.get(params.programId);
    if (!prog) throw new Error('Grant program not found.');
    if (prog.verificationStatus !== 'VERIFIED') {
      throw new Error('Applications can only be submitted to programs that are officially VERIFIED.');
    }

    const money = Money.fromDecimalString(params.requestedAmountDecimal, prog.currency);
    const minMoney = Money.fromMinor(BigInt(prog.fundingMinMinor), prog.currency);
    const maxMoney = Money.fromMinor(BigInt(prog.fundingMaxMinor), prog.currency);

    if (money.lessThan(minMoney) || money.greaterThan(maxMoney)) {
      throw new Error(
        `Requested grant amount (${money.toDisplayString()}) must be within the published program range (${prog.formattedFundingRange}).`
      );
    }

    const id = `gapp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: GrantApplicationRecord = {
      id,
      programId: prog.id,
      programName: prog.name,
      userId: params.userId,
      applicantName: params.applicantName,
      projectTitle: params.projectTitle,
      projectSummary: params.projectSummary,
      requestedAmountMinor: money.amountMinor.toString(),
      formattedRequestedAmount: money.toDisplayString(),
      currency: prog.currency,
      status: 'DRAFT',
      eligibilityAnswers: params.eligibilityAnswers,
      documentRefs: params.documentRefs || [],
      reviewHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.applications.set(id, record);
    return record;
  }

  /**
   * Submits a draft grant application.
   */
  public submitApplication(applicationId: string, userId: string): GrantApplicationRecord {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error('Grant application not found.');
    if (app.userId !== userId) throw new Error('Access denied: application belongs to another customer.');
    if (app.status !== 'DRAFT' && app.status !== 'NEEDS_MORE_INFORMATION') {
      throw new Error(`Cannot submit grant application in status: ${app.status}`);
    }

    // Verify eligibility checklist
    const prog = this.programs.get(app.programId);
    let allEligible = true;
    if (prog) {
      for (const criterion of prog.eligibilityCriteria) {
        if (!app.eligibilityAnswers[criterion]) {
          allEligible = false;
        }
      }
    }

    const prevStatus = app.status;
    app.status = allEligible ? 'SUBMITTED' : 'INELIGIBLE';
    app.submittedAt = new Date();
    app.updatedAt = new Date();

    app.reviewHistory.push({
      actorUserId: userId,
      previousStatus: prevStatus,
      newStatus: app.status,
      notes: allEligible
        ? 'Application passed automated initial eligibility checklist.'
        : 'Application failed one or more mandatory eligibility requirements.',
      timestamp: new Date(),
    });

    const customer = defaultAuthService.getUserById(userId);
    const customerName = customer?.fullName || app.applicantName;
    if (!allEligible) {
      if (customer?.email) {
        voidEmail(
          'grant-ineligible',
          defaultEmailService.sendGrantIneligibleEmail({
            to: customer.email,
            fullName: customerName,
            applicationId: app.id,
            reason: 'Application failed one or more mandatory eligibility requirements.',
          }),
        );
      }
    } else {
      if (customer?.email) {
        voidEmail(
          'grant-submitted',
          defaultEmailService.sendGrantSubmittedEmail({
            to: customer.email,
            fullName: customerName,
            applicationId: app.id,
          }),
        );
      }
      voidEmail(
        'grant-submitted-staff',
        defaultEmailService.sendGrantSubmittedStaffEmail({
          customerName,
          applicationId: app.id,
        }),
      );
    }

    return app;
  }

  /**
   * Compliance review for grant applications with separation of duties enforcement.
   */
  public reviewApplication(params: {
    reviewerRole: UserRole;
    reviewerUserId: string;
    applicationId: string;
    decision: 'APPROVED_FOR_DEMO' | 'DECLINED' | 'NEEDS_MORE_INFORMATION' | 'UNDER_REVIEW';
    notes?: string;
  }): GrantApplicationRecord {
    const allowedRoles: UserRole[] = ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(params.reviewerRole)) {
      throw new Error('Access denied: only compliance officers or administrators can review grant applications.');
    }

    const app = this.applications.get(params.applicationId);
    if (!app) throw new Error('Grant application not found.');

    // Separation of duties: Reviewer cannot approve their own application
    if (app.userId === params.reviewerUserId) {
      throw new Error('Separation of duties violation: you cannot review or approve your own grant application.');
    }

    const prevStatus = app.status;
    app.status = params.decision;
    app.reviewerUserId = params.reviewerUserId;
    app.reviewerNotes = params.notes;
    app.reviewedAt = new Date();
    app.updatedAt = new Date();

    app.reviewHistory.push({
      actorUserId: params.reviewerUserId,
      previousStatus: prevStatus,
      newStatus: params.decision,
      notes: params.notes,
      timestamp: new Date(),
    });

    // Durable audit logging
    defaultAuditService.logAction({
      action: 'GRANT_APPLICATION_REVIEWED' as any,
      actorUserId: params.reviewerUserId,
      actorRole: params.reviewerRole,
      resourceType: 'GRANT_APPLICATION',
      resourceId: app.id,
      previousState: prevStatus,
      newState: params.decision,
      reason: params.notes || `Decision recorded as ${params.decision}`,
      details: {
        applicantUserId: app.userId,
        programId: app.programId,
        programName: app.programName,
        requestedAmountMinor: app.requestedAmountMinor,
        currency: app.currency,
      },
    });

    const customer = defaultAuthService.getUserById(app.userId);
    if (customer?.email) {
      voidEmail(
        'grant-reviewed',
        defaultEmailService.sendGrantReviewedEmail({
          to: customer.email,
          fullName: customer.fullName || app.applicantName,
          applicationId: app.id,
          decision: params.decision,
          notes: params.notes,
        }),
      );
    }

    return app;
  }

  /**
   * Simulates non-dilutive grant award disbursement into the customer's multicurrency wallet.
   * Connects to the double-entry ledger via defaultWalletService.
   */
  public async simulateDisbursement(params: {
    applicationId: string;
    approvedByUserId: string;
    approvedByRole: UserRole;
    idempotencyKey?: string;
  }): Promise<{ application: GrantApplicationRecord; award: GrantAwardRecord; depositResult: any }> {
    const allowedRoles: UserRole[] = ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(params.approvedByRole)) {
      throw new Error('Access denied: only compliance officers or administrators can disburse grant funds.');
    }

    const app = this.applications.get(params.applicationId);
    if (!app) throw new Error('Grant application not found.');

    if (app.status !== 'APPROVED_FOR_DEMO') {
      throw new Error(`Cannot disburse grant award for application with status: ${app.status}. Must be APPROVED_FOR_DEMO.`);
    }

    // Separation of duties check
    if (app.userId === params.approvedByUserId) {
      throw new Error('Separation of duties violation: reviewer cannot authorize disbursement to their own account.');
    }

    if (app.award && app.award.disbursementStatus === 'DISBURSED_SIMULATED') {
      throw new Error('Grant award has already been disbursed.');
    }

    const idemKey =
      params.idempotencyKey || `idem_grant_disb_${app.id}_${Date.now()}`;
    const reconRef = `RECON-GRANT-${app.programId.toUpperCase().slice(-8)}-${Date.now().toString(36).toUpperCase()}`;

    const awardAmountMoney = Money.fromMinor(BigInt(app.requestedAmountMinor), app.currency);

    // Execute simulated deposit to recipient's wallet
    const depositResult = await defaultWalletService.executeSimulatedDeposit({
      userId: app.userId,
      currency: app.currency,
      amountDecimal: awardAmountMoney.toDecimalString(),
      idempotencyKey: idemKey,
      sourceRail: 'WIRE',
    });

    const award: GrantAwardRecord = {
      id: `gaward_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      applicationId: app.id,
      awardedAmountMinor: app.requestedAmountMinor,
      formattedAwardedAmount: awardAmountMoney.toDisplayString(),
      currency: app.currency,
      reconciliationRef: reconRef,
      approvedByUserId: params.approvedByUserId,
      disbursementStatus: 'DISBURSED_SIMULATED',
      disbursedAt: new Date(),
      idempotencyKey: idemKey,
      createdAt: new Date(),
    };

    app.award = award;
    app.updatedAt = new Date();

    // Durable audit logging
    defaultAuditService.logAction({
      action: 'GRANT_AWARD_DISBURSED',
      actorUserId: params.approvedByUserId,
      actorRole: params.approvedByRole,
      resourceType: 'GRANT_AWARD',
      resourceId: award.id,
      newState: 'DISBURSED_SIMULATED',
      reason: 'Grant award disbursement credited to customer wallet',
      financialTxId: depositResult.transactionId,
      details: {
        applicationId: app.id,
        recipientUserId: app.userId,
        awardedAmountMinor: award.awardedAmountMinor,
        currency: award.currency,
        reconciliationRef: reconRef,
      },
    });

    const customer = defaultAuthService.getUserById(app.userId);
    if (customer?.email) {
      voidEmail(
        'grant-disbursed',
        defaultEmailService.sendGrantDisbursedEmail({
          to: customer.email,
          fullName: customer.fullName || app.applicantName,
          applicationId: app.id,
          amount: awardAmountMoney.toDecimalString(),
          currency: award.currency,
        }),
      );
    }

    return {
      application: app,
      award,
      depositResult,
    };
  }

  public getUserApplications(userId: string): GrantApplicationRecord[] {
    return Array.from(this.applications.values()).filter((a) => a.userId === userId);
  }

  public getAllApplicationsForReview(reviewerRole: UserRole): GrantApplicationRecord[] {
    const allowedRoles: UserRole[] = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(reviewerRole)) {
      throw new Error('Access denied.');
    }
    return Array.from(this.applications.values());
  }

  public getApplicationById(id: string): GrantApplicationRecord | undefined {
    return this.applications.get(id);
  }
}

export const defaultGrantService = new GrantService();
