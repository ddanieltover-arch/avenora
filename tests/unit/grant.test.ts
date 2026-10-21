/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Unit Tests: Verified Grant Programs & Disbursements
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GrantService } from '../../src/server/services/grant.service.ts';

describe('Verified Grant Programs & Applications Engine', () => {
  let grantService: GrantService;

  beforeEach(() => {
    grantService = new GrantService();
  });

  describe('Directory & Program Verification', () => {
    it('retrieves pre-seeded programs filtered by eligible country and currency', () => {
      const usPrograms = grantService.getPrograms({ country: 'US' });
      expect(usPrograms.length).toBeGreaterThan(0);
      for (const p of usPrograms) {
        expect(p.eligibleCountries).toContain('US');
      }

      const brPrograms = grantService.getPrograms({ country: 'BR', currency: 'BRL' });
      expect(brPrograms.length).toBeGreaterThan(0);
      for (const p of brPrograms) {
        expect(p.currency).toBe('BRL');
        expect(p.eligibleCountries).toContain('BR');
      }
    });

    it('allows compliance officers to verify pending grant programs', () => {
      const pendingProg = grantService.getPrograms({ status: 'PENDING_REVIEW' })[0]!;
      expect(pendingProg).toBeDefined();

      const verified = grantService.verifyProgram({
        programId: pendingProg.id,
        reviewerUserId: 'usr_compliance_lead',
        reviewerRole: 'COMPLIANCE_REVIEWER',
        newStatus: 'VERIFIED',
      });

      expect(verified.verificationStatus).toBe('VERIFIED');
      expect(verified.verifiedByUserId).toBe('usr_compliance_lead');
    });

    it('rejects verification attempts by non-staff roles', () => {
      const prog = grantService.getPrograms()[0]!;
      expect(() =>
        grantService.verifyProgram({
          programId: prog.id,
          reviewerUserId: 'usr_customer',
          reviewerRole: 'CUSTOMER',
          newStatus: 'VERIFIED',
        })
      ).toThrow(/access denied/i);
    });
  });

  describe('Grant Applications & Eligibility Checks', () => {
    it('enforces requested amount boundaries (within published min and max)', () => {
      const verifiedProg = grantService.getPrograms({ verifiedOnly: true })[0]!;

      // Exceeds max funding
      expect(() =>
        grantService.createApplication({
          programId: verifiedProg.id,
          userId: 'usr_test_applicant',
          applicantName: 'Test Applicant',
          projectTitle: 'Massive Overbudget Project',
          projectSummary: 'Requesting unrealistic capital',
          requestedAmountDecimal: '9999999.00',
          eligibilityAnswers: {},
        })
      ).toThrow(/within the published program range/i);
    });

    it('marks application as SUBMITTED when all eligibility questions are verified true', () => {
      const prog = grantService.getPrograms({ verifiedOnly: true })[0]!;

      const answers: Record<string, boolean> = {};
      for (const criterion of prog.eligibilityCriteria) {
        answers[criterion] = true;
      }

      const draft = grantService.createApplication({
        programId: prog.id,
        userId: 'usr_eligible_applicant',
        applicantName: 'Eligible Founder',
        projectTitle: 'Micro-hydro Prototype',
        projectSummary: 'Detailed engineering proposal for modular stream generation.',
        requestedAmountDecimal: '15000.00',
        eligibilityAnswers: answers,
      });

      const submitted = grantService.submitApplication(draft.id, 'usr_eligible_applicant');
      expect(submitted.status).toBe('SUBMITTED');
    });

    it('marks application as INELIGIBLE if required criteria are unsatisfied', () => {
      const prog = grantService.getPrograms({ verifiedOnly: true })[0]!;
      const firstCriterion = prog.eligibilityCriteria[0] || 'Default criterion';

      const draft = grantService.createApplication({
        programId: prog.id,
        userId: 'usr_ineligible_applicant',
        applicantName: 'Ineligible Founder',
        projectTitle: 'Incomplete Criteria',
        projectSummary: 'Missing mandatory criteria',
        requestedAmountDecimal: '12000.00',
        eligibilityAnswers: {
          [firstCriterion]: false, // Failed requirement
        },
      });

      const submitted = grantService.submitApplication(draft.id, 'usr_ineligible_applicant');
      expect(submitted.status).toBe('INELIGIBLE');
    });
  });

  describe('Separation of Duties & Simulated Disbursement', () => {
    it('prevents applicant from approving their own grant application', () => {
      const prog = grantService.getPrograms({ verifiedOnly: true })[0]!;
      const draft = grantService.createApplication({
        programId: prog.id,
        userId: 'usr_officer_applicant',
        applicantName: 'Officer Applicant',
        projectTitle: 'Solar Lab',
        projectSummary: 'Project',
        requestedAmountDecimal: '10000.00',
        eligibilityAnswers: {},
      });

      expect(() =>
        grantService.reviewApplication({
          reviewerRole: 'COMPLIANCE_REVIEWER',
          reviewerUserId: 'usr_officer_applicant', // same as applicant!
          applicationId: draft.id,
          decision: 'APPROVED_FOR_DEMO',
        })
      ).toThrow(/separation of duties/i);
    });

    it('disburses simulated grant award and updates wallet balance with reconciliation reference', async () => {
      const prog = grantService.getPrograms({ verifiedOnly: true })[0]!;
      const draft = grantService.createApplication({
        programId: prog.id,
        userId: 'usr_award_recipient',
        applicantName: 'Award Recipient',
        projectTitle: 'Wind Power Station',
        projectSummary: 'Clean wind turbine cluster',
        requestedAmountDecimal: '10000.00',
        eligibilityAnswers: {},
      });

      // Officer approves for demo
      grantService.reviewApplication({
        reviewerRole: 'COMPLIANCE_REVIEWER',
        reviewerUserId: 'usr_independent_officer',
        applicationId: draft.id,
        decision: 'APPROVED_FOR_DEMO',
      });

      // Disburse demo award
      const disburseResult = await grantService.simulateDisbursement({
        applicationId: draft.id,
        approvedByUserId: 'usr_independent_officer',
        approvedByRole: 'COMPLIANCE_REVIEWER',
      });

      expect(disburseResult.award.disbursementStatus).toBe('DISBURSED_SIMULATED');
      expect(disburseResult.award.reconciliationRef).toMatch(/^RECON-GRANT-/);
      expect(disburseResult.depositResult.status).toBe('POSTED');
      expect(disburseResult.depositResult.isSimulated).toBe(true);
    });
  });
});
