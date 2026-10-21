/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Unit Tests: Loan & Credit Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LoanService } from '../../src/server/services/loan.service.ts';

describe('Loan & Credit Application Engine', () => {
  let loanService: LoanService;

  beforeEach(() => {
    loanService = new LoanService();
  });

  describe('Deterministic Amortization Calculator', () => {
    it('calculates zero-interest loan with exact integer installment division', () => {
      const result = loanService.calculateAmortization({
        principalDecimal: '1200.00',
        currency: 'USD',
        annualRatePercent: 0,
        termMonths: 12,
      });

      expect(result.schedule.length).toBe(12);
      expect(result.totalInterestMinor).toBe('0');
      expect(result.totalRepaymentMinor).toBe(result.principalMinor);

      // Verify each installment is exactly $100.00
      for (const inst of result.schedule) {
        expect(inst.paymentMinor).toBe('10000'); // 10000 cents
        expect(inst.interestMinor).toBe('0');
      }

      // Final remaining balance must be exactly zero
      expect(result.schedule[result.schedule.length - 1]!.remainingBalanceMinor).toBe('0');
    });

    it('performs exact penny balancing on repeating decimals (e.g. $1,000 across 3 months at 0% APR)', () => {
      const result = loanService.calculateAmortization({
        principalDecimal: '1000.00',
        currency: 'USD',
        annualRatePercent: 0,
        termMonths: 3,
      });

      // 1000.00 / 3 = 333.333333...
      // Installments must be balanced so total principal paid equals exactly 100000 cents
      let totalPrincipalPaid = 0n;
      for (const inst of result.schedule) {
        totalPrincipalPaid += BigInt(inst.principalMinor);
      }

      expect(totalPrincipalPaid).toBe(100000n);
      expect(result.schedule[result.schedule.length - 1]!.remainingBalanceMinor).toBe('0');
    });

    it('computes positive interest amortization schedule and validates final remaining balance is zero', () => {
      const result = loanService.calculateAmortization({
        principalDecimal: '10000.00',
        currency: 'USD',
        annualRatePercent: 7.5,
        termMonths: 24,
      });

      expect(result.schedule.length).toBe(24);
      expect(BigInt(result.totalInterestMinor)).toBeGreaterThan(0n);
      expect(BigInt(result.totalRepaymentMinor)).toBe(
        BigInt(result.principalMinor) + BigInt(result.totalInterestMinor)
      );

      // Verify final installment zeroes out balance
      const last = result.schedule[result.schedule.length - 1]!;
      expect(last.remainingBalanceMinor).toBe('0');
      expect(result.isIllustrative).toBe(true);
    });

    it('rejects invalid inputs such as negative rates, 0 term months, or unsupported currency', () => {
      expect(() =>
        loanService.calculateAmortization({
          principalDecimal: '5000.00',
          currency: 'INVALID',
          annualRatePercent: 5,
          termMonths: 12,
        })
      ).toThrow(/unsupported currency/i);

      expect(() =>
        loanService.calculateAmortization({
          principalDecimal: '5000.00',
          currency: 'USD',
          annualRatePercent: -2,
          termMonths: 12,
        })
      ).toThrow(/between 0 and 100/i);

      expect(() =>
        loanService.calculateAmortization({
          principalDecimal: '0.00',
          currency: 'USD',
          annualRatePercent: 5,
          termMonths: 12,
        })
      ).toThrow(/greater than zero/i);
    });
  });

  describe('Synthetic Risk Assessment', () => {
    it('evaluates low DTI (<= 35%) and produces prime demo score band with transparent notice', () => {
      const app = loanService.createDraftApplication({
        userId: 'usr_applicant_1',
        applicantName: 'Applicant One',
        type: 'PERSONAL',
        currency: 'USD',
        requestedAmountDecimal: '5000.00',
        termMonths: 12,
        purpose: 'Debt Consolidation',
        annualIncomeDecimal: '120000.00', // $10,000 / month
        monthlyExpensesDecimal: '2500.00', // DTI = 25%
        consentAcknowledged: true,
      });

      const assessment = loanService.performSyntheticAssessment(app);
      expect(assessment.riskCategory).toBe('LOW_RISK_DEMO');
      expect(assessment.recommendation).toBe('RECOMMEND_DEMO_APPROVAL');
      expect(assessment.syntheticScore).toBe(780);
      expect(Number(assessment.debtToIncomeRatio)).toBeLessThanOrEqual(0.35);
      expect(assessment.notice).toContain('DEMONSTRATION ASSESSMENT ONLY');
      expect(assessment.rulesetVersion).toBe('v1.2.0-demo');
    });

    it('evaluates elevated DTI (> 50%) and returns adverse demo recommendation', () => {
      const app = loanService.createDraftApplication({
        userId: 'usr_applicant_2',
        applicantName: 'Applicant Two',
        type: 'PERSONAL',
        currency: 'USD',
        requestedAmountDecimal: '20000.00',
        termMonths: 36,
        purpose: 'Unspecified',
        annualIncomeDecimal: '40000.00', // $3,333 / month
        monthlyExpensesDecimal: '2500.00', // DTI = 75%
        consentAcknowledged: true,
      });

      const assessment = loanService.performSyntheticAssessment(app);
      expect(assessment.riskCategory).toBe('ELEVATED_RISK_DEMO');
      expect(assessment.recommendation).toBe('DECLINE_DEMO');
      expect(assessment.syntheticScore).toBe(610);
    });
  });

  describe('Separation of Duties & Application Lifecycle', () => {
    it('prohibits applicant from reviewing or approving their own loan application', () => {
      const app = loanService.createDraftApplication({
        userId: 'usr_compliance_officer',
        applicantName: 'Compliance Officer Testing',
        type: 'PERSONAL',
        currency: 'USD',
        requestedAmountDecimal: '3000.00',
        termMonths: 12,
        purpose: 'Study Expenses',
        annualIncomeDecimal: '90000.00',
        monthlyExpensesDecimal: '1500.00',
        consentAcknowledged: true,
      });

      loanService.submitApplication(app.id, 'usr_compliance_officer');

      expect(() =>
        loanService.reviewApplication({
          reviewerRole: 'COMPLIANCE_REVIEWER',
          reviewerUserId: 'usr_compliance_officer', // Same user!
          applicationId: app.id,
          decision: 'APPROVED_FOR_DEMO',
        })
      ).toThrow(/separation of duties/i);
    });

    it('allows an authorized independent compliance officer to record underwriting decisions', () => {
      const app = loanService.createDraftApplication({
        userId: 'usr_regular_customer',
        applicantName: 'Customer Vance',
        type: 'PERSONAL',
        currency: 'USD',
        requestedAmountDecimal: '4000.00',
        termMonths: 24,
        purpose: 'Energy equipment',
        annualIncomeDecimal: '75000.00',
        monthlyExpensesDecimal: '1200.00',
        consentAcknowledged: true,
      });

      loanService.submitApplication(app.id, 'usr_regular_customer');

      const reviewed = loanService.reviewApplication({
        reviewerRole: 'COMPLIANCE_REVIEWER',
        reviewerUserId: 'usr_independent_officer',
        applicationId: app.id,
        decision: 'APPROVED_FOR_DEMO',
        notes: 'Income verified via synthetic docs.',
      });

      expect(reviewed.status).toBe('APPROVED_FOR_DEMO');
      expect(reviewed.reviewerUserId).toBe('usr_independent_officer');
      expect(reviewed.reviewHistory.length).toBe(1);
    });

    it('permits customer to cancel draft or submitted application', () => {
      const app = loanService.createDraftApplication({
        userId: 'usr_cancel_test',
        applicantName: 'Cancel Test',
        type: 'PERSONAL',
        currency: 'USD',
        requestedAmountDecimal: '1000.00',
        termMonths: 6,
        purpose: 'Test',
        annualIncomeDecimal: '50000.00',
        monthlyExpensesDecimal: '1000.00',
        consentAcknowledged: true,
      });

      const cancelled = loanService.cancelApplication(app.id, 'usr_cancel_test');
      expect(cancelled.status).toBe('CANCELLED');
    });
  });
});
