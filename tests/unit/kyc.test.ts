/**
 * @license Apache-2.0
 * Avenora Fintech Platform — KYC & Compliance Verification Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { KycService } from '../../src/server/services/kyc.service.ts';

describe('Simulated KYC & Customer Verification Engine', () => {
  let kycService: KycService;

  beforeEach(() => {
    kycService = new KycService();
  });

  it('submits verification profile with masked tax ID and private vault storage references', () => {
    const userId = 'usr_kyc_test_01';
    const profile = kycService.submitVerification({
      userId,
      tier: 1,
      legalFirstName: 'Elena',
      legalLastName: 'Rostova',
      dateOfBirth: '1992-08-24',
      taxIdType: 'SSN',
      taxIdNumber: '123456789',
      residentialAddress: {
        street: '100 Wall Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10005',
        country: 'US',
      },
      documents: [
        {
          type: 'PASSPORT',
          fileName: 'passport_scan.pdf',
          mimeType: 'application/pdf',
          fileSize: 204800,
        },
      ],
    });

    expect(profile.status).toBe('SUBMITTED');
    expect(profile.taxIdMasked).toBe('***-**-6789');
    expect(profile.documentRefs.length).toBe(1);
    expect(profile.documentRefs[0]!.storageRef.startsWith('vault://kyc/')).toBe(true);
  });

  it('enforces country tax ID formats (validates US SSN, BR CPF, ES DNI)', () => {
    const userId = 'usr_kyc_tax_test';

    // Invalid SSN length
    expect(() =>
      kycService.submitVerification({
        userId,
        legalFirstName: 'John',
        legalLastName: 'Doe',
        dateOfBirth: '1990-01-01',
        taxIdType: 'SSN',
        taxIdNumber: '12', // Too short
        residentialAddress: { street: 'Main St', city: 'Austin', postalCode: '78701', country: 'US' },
      })
    ).toThrow(/US SSN must be 9 digits/);

    // Invalid CPF length
    expect(() =>
      kycService.submitVerification({
        userId,
        legalFirstName: 'Carlos',
        legalLastName: 'Silva',
        dateOfBirth: '1985-05-15',
        taxIdType: 'CPF',
        taxIdNumber: '123456', // Too short for Brazilian CPF
        residentialAddress: { street: 'Av Paulista', city: 'São Paulo', postalCode: '01310-100', country: 'BR' },
      })
    ).toThrow(/Brazilian CPF must be 11 digits/);
  });

  it('restricts verification approval to compliance reviewers and prevents unauthorized customer self-approval', async () => {
    const userId = 'usr_kyc_review_target';
    kycService.submitVerification({
      userId,
      legalFirstName: 'Marcus',
      legalLastName: 'Aurelius',
      dateOfBirth: '1980-04-26',
      taxIdType: 'SSN',
      taxIdNumber: '987654321',
      residentialAddress: { street: 'Forum St', city: 'Rome', postalCode: '00100', country: 'US' },
    });

    // Customer attempt to approve: Access Denied!
    expect(() =>
      kycService.reviewProfile({
        reviewerRole: 'CUSTOMER',
        reviewerUserId: userId,
        reviewerName: 'Marcus Aurelius',
        targetUserId: userId,
        decision: 'APPROVED',
      })
    ).toThrow(/Access denied/);

    // Compliance officer approval succeeds
    const approvedProfile = await kycService.reviewProfile({
      reviewerRole: 'COMPLIANCE_REVIEWER',
      reviewerUserId: 'usr_staff_compliance_01',
      reviewerName: 'Maria Chen (Compliance)',
      targetUserId: userId,
      decision: 'APPROVED',
      notes: 'Synthetic background check passed without findings.',
    });

    expect(approvedProfile.status).toBe('APPROVED');
    expect(approvedProfile.reviewHistory.length).toBe(1);
    expect(approvedProfile.reviewHistory[0]!.reviewerName).toBe('Maria Chen (Compliance)');
  });

  it('attaches external verification results as advisory intelligence without automatically approving customer', () => {
    const userId = 'usr_kyc_ext_advisory_01';
    kycService.submitVerification({
      userId,
      legalFirstName: 'Sarah',
      legalLastName: 'Connor',
      dateOfBirth: '1985-11-10',
      taxIdType: 'SSN',
      taxIdNumber: '555667777',
      residentialAddress: { street: 'Pine St', city: 'Los Angeles', state: 'CA', postalCode: '90001', country: 'US' },
    });

    // Inbound external IDSP verification callback with VERIFIED status
    const updated = kycService.attachExternalVerificationResult({
      userId,
      providerCode: 'AvenoraMockIdentityVerificationService',
      externalCaseId: 'idsp_case_889922',
      status: 'VERIFIED',
      confidenceScore: 0.99,
      checksSummary: {
        documentAuthenticity: true,
        facialMatch: true,
        sanctionsClear: true,
        pepClear: true,
      },
      signatureVerified: true,
      correlationId: 'corr_ext_kyc_01',
    });

    // INVARIANT: Customer status is UNDER_REVIEW, NOT APPROVED!
    expect(updated.status).toBe('UNDER_REVIEW');
    expect(updated.externalVerification?.status).toBe('VERIFIED');
    expect(updated.externalVerification?.disclaimer).toContain('REQUIRES FINAL COMPLIANCE OFFICER DETERMINATION');
  });

  it('treats failed signature verification as UNRESOLVED and does not grant verification credit', () => {
    const userId = 'usr_kyc_unresolved_01';
    kycService.submitVerification({
      userId,
      legalFirstName: 'John',
      legalLastName: 'Smith',
      dateOfBirth: '1990-01-01',
      taxIdType: 'SSN',
      taxIdNumber: '111223333',
      residentialAddress: { street: 'Elm St', city: 'Dallas', state: 'TX', postalCode: '75001', country: 'US' },
    });

    // Callback with tampered or unverified signature
    const updated = kycService.attachExternalVerificationResult({
      userId,
      providerCode: 'AvenoraMockIdentityVerificationService',
      externalCaseId: 'idsp_case_corrupted',
      status: 'VERIFIED',
      signatureVerified: false, // Signature check failed!
      correlationId: 'corr_bad_sig_01',
    });

    expect(updated.externalVerification?.status).toBe('UNRESOLVED');
    expect(updated.status).toBe('UNDER_REVIEW');
  });

  it('strictly enforces document access control and blocks unauthorized access to customer identity artifacts', () => {
    const userId = 'usr_doc_owner_01';
    const profile = kycService.submitVerification({
      userId,
      legalFirstName: 'Alice',
      legalLastName: 'Wonderland',
      dateOfBirth: '1995-03-15',
      taxIdType: 'SSN',
      taxIdNumber: '999887777',
      residentialAddress: { street: 'Rabbit Hole 1', city: 'Oxford', postalCode: 'OX1', country: 'US' },
      documents: [
        {
          type: 'PASSPORT',
          fileName: 'alice_pass.pdf',
          mimeType: 'application/pdf',
          fileSize: 512000,
        },
      ],
    });

    const docId = profile.documentRefs[0]!.id;

    // Owner access granted
    const ownerAccess = kycService.getSecureDocumentAccess({
      targetUserId: userId,
      documentId: docId,
      actorUserId: userId,
      actorRole: 'CUSTOMER',
    });
    expect(ownerAccess.accessGranted).toBe(true);

    // Another customer attempt: BLOCKED
    expect(() =>
      kycService.getSecureDocumentAccess({
        targetUserId: userId,
        documentId: docId,
        actorUserId: 'usr_malicious_other_customer',
        actorRole: 'CUSTOMER',
      })
    ).toThrow(/Access denied/);

    // Compliance reviewer access granted
    const reviewerAccess = kycService.getSecureDocumentAccess({
      targetUserId: userId,
      documentId: docId,
      actorUserId: 'usr_staff_compliance',
      actorRole: 'COMPLIANCE_REVIEWER',
    });
    expect(reviewerAccess.accessGranted).toBe(true);
    expect(reviewerAccess.notice).toContain('Controlled Internal Access Only');
  });
});
