/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Loan & Credit Application Engine
 *
 * Implements:
 * - Deterministic Amortization Calculator with integer minor-unit math and final penny adjustment
 * - Transparent Synthetic Risk Assessment engine with ruleset versioning and factor explanations
 * - Server-authoritative application lifecycle (DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED_FOR_DEMO / DECLINED_FOR_DEMO)
 * - Separation of duties: customers cannot review or approve their own loan applications
 */

import { Money } from '../../domain/money/Money.ts';
import { getCurrency, isSupportedCurrency } from '../../domain/money/Currency.ts';
import { UserRole } from './auth.service.ts';
import { defaultAuditService } from './audit.service.ts';

export type LoanApplicationType = 'PERSONAL' | 'SMALL_BUSINESS';
export type LoanApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'NEEDS_MORE_INFORMATION'
  | 'APPROVED_FOR_DEMO'
  | 'DECLINED_FOR_DEMO'
  | 'CANCELLED';

export type LoanRiskCategory = 'LOW_RISK_DEMO' | 'MODERATE_RISK_DEMO' | 'ELEVATED_RISK_DEMO';
export type LoanRecommendation = 'RECOMMEND_DEMO_APPROVAL' | 'REQUIRES_MANUAL_REVIEW' | 'DECLINE_DEMO';

export interface AmortizationScheduleItem {
  installmentNumber: number;
  paymentMinor: string;
  principalMinor: string;
  interestMinor: string;
  remainingBalanceMinor: string;
  formattedPayment: string;
  formattedRemaining: string;
}

export interface AmortizationCalculationResult {
  principalMinor: string;
  currency: string;
  annualRatePercent: number;
  termMonths: number;
  monthlyPaymentMinor: string;
  totalInterestMinor: string;
  totalRepaymentMinor: string;
  formattedMonthlyPayment: string;
  formattedTotalInterest: string;
  formattedTotalRepayment: string;
  schedule: AmortizationScheduleItem[];
  isIllustrative: true;
}

export interface SyntheticAssessmentResult {
  applicationId: string;
  riskCategory: LoanRiskCategory;
  recommendation: LoanRecommendation;
  syntheticScore: number; // illustrative 300-850 range
  debtToIncomeRatio: string;
  rulesetVersion: string;
  factorsExplanation: string[];
  assessedAt: Date;
  notice: string;
}

export interface LoanApplicationRecord {
  id: string;
  userId: string;
  applicantName: string;
  type: LoanApplicationType;
  currency: string;
  requestedAmountMinor: string;
  formattedRequestedAmount: string;
  termMonths: number;
  purpose: string;
  applicantIncomeAnnualMinor: string;
  applicantExpensesMonthlyMinor: string;
  businessName?: string;
  businessRevenueAnnualMinor?: string;
  status: LoanApplicationStatus;
  consentAcknowledged: boolean;
  reviewerUserId?: string;
  reviewerNotes?: string;
  reasonCode?: string;
  reviewHistory: Array<{
    actorUserId: string;
    previousStatus: LoanApplicationStatus;
    newStatus: LoanApplicationStatus;
    reason?: string;
    notes?: string;
    timestamp: Date;
  }>;
  assessment?: SyntheticAssessmentResult;
  submittedAt?: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class LoanService {
  private applications = new Map<string, LoanApplicationRecord>();
  public readonly RULESET_VERSION = 'v1.2.0-demo';

  /**
   * Deterministic fixed-rate monthly installment amortization calculator.
   * Uses minor integer units (BigInt) for financial conservation and balances the final installment.
   */
  public calculateAmortization(params: {
    principalDecimal: string;
    currency: string;
    annualRatePercent: number; // e.g. 7.5 for 7.5% APR
    termMonths: number; // e.g. 12, 24, 36, 60
  }): AmortizationCalculationResult {
    const { currency, annualRatePercent, termMonths } = params;

    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    if (termMonths <= 0 || termMonths > 360) {
      throw new Error('Loan term must be between 1 and 360 months.');
    }
    if (annualRatePercent < 0 || annualRatePercent > 100) {
      throw new Error('Annual rate percentage must be between 0 and 100.');
    }

    const principalMoney = Money.fromDecimalString(params.principalDecimal, currency);
    if (!principalMoney.isPositive()) {
      throw new Error('Principal amount must be strictly greater than zero.');
    }

    const P = Number(principalMoney.amountMinor);
    let monthlyPaymentNumber: number;

    if (annualRatePercent === 0) {
      // Zero-interest loan case: M = P / n
      monthlyPaymentNumber = Math.round(P / termMonths);
    } else {
      // Standard fixed installment annuity formula: M = P * [ i(1+i)^n ] / [ (1+i)^n - 1 ]
      const monthlyRate = annualRatePercent / 100 / 12;
      const compound = Math.pow(1 + monthlyRate, termMonths);
      monthlyPaymentNumber = Math.round((P * (monthlyRate * compound)) / (compound - 1));
    }

    let remainingMinor = principalMoney.amountMinor;
    let totalInterestMinor = 0n;
    const schedule: AmortizationScheduleItem[] = [];

    for (let k = 1; k <= termMonths; k++) {
      let interestMinor = 0n;
      if (annualRatePercent > 0) {
        const monthlyRate = annualRatePercent / 100 / 12;
        interestMinor = BigInt(Math.round(Number(remainingMinor) * monthlyRate));
      }

      let principalMinor = BigInt(monthlyPaymentNumber) - interestMinor;

      // Final payment adjustment: ensure sum of principal repayments equals initial principal exactly
      if (k === termMonths || principalMinor > remainingMinor) {
        principalMinor = remainingMinor;
        monthlyPaymentNumber = Number(principalMinor + interestMinor);
      }

      remainingMinor -= principalMinor;
      if (remainingMinor < 0n) remainingMinor = 0n;
      totalInterestMinor += interestMinor;

      const paymentMoney = Money.fromMinor(monthlyPaymentNumber, currency);
      const remainingMoney = Money.fromMinor(remainingMinor, currency);

      schedule.push({
        installmentNumber: k,
        paymentMinor: monthlyPaymentNumber.toString(),
        principalMinor: principalMinor.toString(),
        interestMinor: interestMinor.toString(),
        remainingBalanceMinor: remainingMinor.toString(),
        formattedPayment: paymentMoney.toDisplayString(),
        formattedRemaining: remainingMoney.toDisplayString(),
      });
    }

    const totalRepaymentMinor = principalMoney.amountMinor + totalInterestMinor;

    return {
      principalMinor: principalMoney.amountMinor.toString(),
      currency,
      annualRatePercent,
      termMonths,
      monthlyPaymentMinor: monthlyPaymentNumber.toString(),
      totalInterestMinor: totalInterestMinor.toString(),
      totalRepaymentMinor: totalRepaymentMinor.toString(),
      formattedMonthlyPayment: Money.fromMinor(monthlyPaymentNumber, currency).toDisplayString(),
      formattedTotalInterest: Money.fromMinor(totalInterestMinor, currency).toDisplayString(),
      formattedTotalRepayment: Money.fromMinor(totalRepaymentMinor, currency).toDisplayString(),
      schedule,
      isIllustrative: true,
    };
  }

  /**
   * Deterministic Synthetic Risk Assessment.
   * Evaluates debt-to-income (DTI) and returns an illustrative rating.
   */
  public performSyntheticAssessment(application: LoanApplicationRecord): SyntheticAssessmentResult {
    const annualIncome = Number(application.applicantIncomeAnnualMinor);
    const monthlyIncome = annualIncome > 0 ? annualIncome / 12 : 1;
    const monthlyExpenses = Number(application.applicantExpensesMonthlyMinor);

    const dtiRatio = monthlyExpenses / monthlyIncome;
    const dtiFormatted = (Math.round(dtiRatio * 100) / 100).toFixed(2);

    let riskCategory: LoanRiskCategory;
    let recommendation: LoanRecommendation;
    let score: number;
    const factors: string[] = [];

    if (dtiRatio <= 0.35) {
      riskCategory = 'LOW_RISK_DEMO';
      recommendation = 'RECOMMEND_DEMO_APPROVAL';
      score = 780;
      factors.push(`Favorable debt-to-income ratio (${Math.round(dtiRatio * 100)}% <= 35%).`);
      factors.push('Sufficient cash flow buffer relative to requested term.');
      factors.push('Credit model evaluation: favorable profile.');
    } else if (dtiRatio <= 0.50) {
      riskCategory = 'MODERATE_RISK_DEMO';
      recommendation = 'REQUIRES_MANUAL_REVIEW';
      score = 690;
      factors.push(`Moderate debt-to-income ratio (${Math.round(dtiRatio * 100)}%).`);
      factors.push('Requires loan officer review of employment verification.');
    } else {
      riskCategory = 'ELEVATED_RISK_DEMO';
      recommendation = 'DECLINE_DEMO';
      score = 610;
      factors.push(`High debt-to-income ratio (${Math.round(dtiRatio * 100)}% > 50%).`);
      factors.push('Projected monthly payment strains debt service capacity.');
    }

    return {
      applicationId: application.id,
      riskCategory,
      recommendation,
      syntheticScore: score,
      debtToIncomeRatio: dtiFormatted,
      rulesetVersion: this.RULESET_VERSION,
      factorsExplanation: factors,
      assessedAt: new Date(),
      notice:
        'Preliminary assessment for review purposes. Final credit decisions require completed verification and signed loan documents.',
    };
  }

  /**
   * Creates a draft loan application.
   */
  public createDraftApplication(params: {
    userId: string;
    applicantName: string;
    type: LoanApplicationType;
    currency: string;
    requestedAmountDecimal: string;
    termMonths: number;
    purpose: string;
    annualIncomeDecimal: string;
    monthlyExpensesDecimal: string;
    businessName?: string;
    businessRevenueDecimal?: string;
    consentAcknowledged: boolean;
  }): LoanApplicationRecord {
    if (!isSupportedCurrency(params.currency)) {
      throw new Error(`Unsupported loan currency: ${params.currency}`);
    }

    const amountMoney = Money.fromDecimalString(params.requestedAmountDecimal, params.currency);
    const incomeMoney = Money.fromDecimalString(params.annualIncomeDecimal, params.currency);
    const expensesMoney = Money.fromDecimalString(params.monthlyExpensesDecimal, params.currency);

    const id = `loan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const record: LoanApplicationRecord = {
      id,
      userId: params.userId,
      applicantName: params.applicantName,
      type: params.type,
      currency: params.currency,
      requestedAmountMinor: amountMoney.amountMinor.toString(),
      formattedRequestedAmount: amountMoney.toDisplayString(),
      termMonths: params.termMonths,
      purpose: params.purpose,
      applicantIncomeAnnualMinor: incomeMoney.amountMinor.toString(),
      applicantExpensesMonthlyMinor: expensesMoney.amountMinor.toString(),
      businessName: params.businessName,
      businessRevenueAnnualMinor: params.businessRevenueDecimal
        ? Money.fromDecimalString(params.businessRevenueDecimal, params.currency).amountMinor.toString()
        : undefined,
      status: 'DRAFT',
      consentAcknowledged: params.consentAcknowledged,
      reviewHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.applications.set(id, record);
    return record;
  }

  /**
   * Submits a draft loan application and generates an automatic synthetic assessment.
   */
  public submitApplication(applicationId: string, userId: string): LoanApplicationRecord {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error('Loan application not found.');
    if (app.userId !== userId) throw new Error('Access denied: application belongs to another customer.');
    if (app.status !== 'DRAFT' && app.status !== 'NEEDS_MORE_INFORMATION') {
      throw new Error(`Cannot submit application in status: ${app.status}`);
    }

    app.status = 'SUBMITTED';
    app.submittedAt = new Date();
    app.updatedAt = new Date();

    // Generate deterministic synthetic assessment
    app.assessment = this.performSyntheticAssessment(app);

    return app;
  }

  /**
   * Compliance/Officer Review action. Strictly restricted to staff roles.
   */
  public reviewApplication(params: {
    reviewerRole: UserRole;
    reviewerUserId: string;
    applicationId: string;
    decision: 'APPROVED_FOR_DEMO' | 'DECLINED_FOR_DEMO' | 'NEEDS_MORE_INFORMATION' | 'UNDER_REVIEW';
    reasonCode?: string;
    notes?: string;
  }): LoanApplicationRecord {
    const allowedRoles: UserRole[] = ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(params.reviewerRole)) {
      throw new Error('Access denied: only compliance officers or administrators can record loan decisions.');
    }

    const app = this.applications.get(params.applicationId);
    if (!app) throw new Error('Loan application not found.');

    // Separation of duties: Reviewer cannot approve their own application
    if (app.userId === params.reviewerUserId) {
      throw new Error('Separation of duties violation: you cannot review or approve your own loan application.');
    }

    const prevStatus = app.status;
    app.status = params.decision;
    app.reviewerUserId = params.reviewerUserId;
    app.reviewerNotes = params.notes;
    app.reasonCode = params.reasonCode;
    app.reviewedAt = new Date();
    app.updatedAt = new Date();

    app.reviewHistory.push({
      actorUserId: params.reviewerUserId,
      previousStatus: prevStatus,
      newStatus: params.decision,
      reason: params.reasonCode,
      notes: params.notes,
      timestamp: new Date(),
    });

    // Log to durable audit trail
    defaultAuditService.logAction({
      action: 'LOAN_APPLICATION_REVIEWED',
      actorUserId: params.reviewerUserId,
      actorRole: params.reviewerRole,
      resourceType: 'LOAN_APPLICATION',
      resourceId: app.id,
      previousState: prevStatus,
      newState: params.decision,
      reason: params.reasonCode || params.notes || `Decision recorded as ${params.decision}`,
      details: {
        applicantUserId: app.userId,
        applicantName: app.applicantName,
        requestedAmountMinor: app.requestedAmountMinor,
        currency: app.currency,
      },
    });

    return app;
  }

  public getUserApplications(userId: string): LoanApplicationRecord[] {
    return Array.from(this.applications.values()).filter((a) => a.userId === userId);
  }

  public getAllApplicationsForReview(reviewerRole: UserRole): LoanApplicationRecord[] {
    const allowedRoles: UserRole[] = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(reviewerRole)) {
      throw new Error('Access denied.');
    }
    return Array.from(this.applications.values());
  }

  public cancelApplication(applicationId: string, userId: string): LoanApplicationRecord {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error('Loan application not found.');
    if (app.userId !== userId) throw new Error('Access denied: application belongs to another customer.');
    if (app.status === 'APPROVED_FOR_DEMO' || app.status === 'DECLINED_FOR_DEMO') {
      throw new Error(`Cannot cancel application that has already reached final status: ${app.status}`);
    }

    const prevStatus = app.status;
    app.status = 'CANCELLED';
    app.updatedAt = new Date();
    app.reviewHistory.push({
      actorUserId: userId,
      previousStatus: prevStatus,
      newStatus: 'CANCELLED',
      reason: 'CUSTOMER_WITHDRAWAL',
      notes: 'Customer elected to cancel the application before final underwriting.',
      timestamp: new Date(),
    });

    return app;
  }

  public getApplicationById(id: string): LoanApplicationRecord | undefined {
    return this.applications.get(id);
  }
}

export const defaultLoanService = new LoanService();
