/**
 * @license Apache-2.0
 * Avenora Fintech Platform — KYC & Compliance Verification Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { defaultKycService } from '../services/kyc.service.ts';
import {
  isTaxIdTypeAllowedForCountry,
  UNSUPPORTED_TAX_ID_COUNTRY_MESSAGE,
  countryHasIndividualTaxId,
} from '../../domain/kyc/taxIdByCountry.ts';
import { authenticate, requireRoles } from '../middleware/auth.ts';
import { getValidatedConfig } from '../../config/env.config.ts';
import { verifyHmacSha256Webhook } from '../services/providerAdapters.ts';

export const kycRouter = Router();

const KycSubmitSchema = z.object({
  tier: z.number().int().min(1).max(2).default(1),
  legalFirstName: z.string().min(1, 'First name is required'),
  legalLastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  taxIdType: z.string().min(1, 'Tax ID type is required'),
  taxIdNumber: z.string().min(4, 'Tax ID is required'),
  residentialAddress: z.object({
    street: z.string().min(3),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().length(2),
  }),
  documents: z
    .array(
      z.object({
        type: z.enum([
          'PASSPORT',
          'DRIVERS_LICENSE',
          'NATIONAL_ID',
          'PASSPORT_PHOTOGRAPH',
          'PROOF_OF_ADDRESS',
        ]),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number().positive(),
        /** Optional staff-review preview (data URL). Capped server-side. */
        previewDataUrl: z
          .string()
          .startsWith('data:')
          .max(1_800_000)
          .optional(),
      })
    )
    .optional(),
}).superRefine((value, ctx) => {
  if (!countryHasIndividualTaxId(value.residentialAddress.country)) {
    ctx.addIssue({
      code: 'custom',
      message: UNSUPPORTED_TAX_ID_COUNTRY_MESSAGE,
      path: ['taxIdType'],
    });
    return;
  }
  if (!isTaxIdTypeAllowedForCountry(value.residentialAddress.country, value.taxIdType)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Tax ID type is not valid for this country.',
      path: ['taxIdType'],
    });
  }
});

const ReviewDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'NEEDS_MORE_INFORMATION', 'UNDER_REVIEW']),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
  reasonCode: z.string().optional(),
  expectedVersion: z.number().int().optional(),
});

/**
 * GET /api/v1/kyc/me
 * Retrieves current authenticated user's verification profile (sanitized).
 */
kycRouter.get('/me', authenticate, (req: Request, res: Response) => {
  const profile = defaultKycService.getOrCreateProfile(req.user!.id);
  res.json({
    profile: defaultKycService.sanitizeForCustomer(profile),
  });
});

/**
 * POST /api/v1/kyc/submit
 * Customer submission for identity verification.
 */
/** KYC submit must remain available while the account is PENDING_VERIFICATION / inactive. */
kycRouter.post('/submit', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = KycSubmitSchema.parse(req.body);
    const updated = defaultKycService.submitVerification({
      userId: req.user!.id,
      tier: validated.tier,
      legalFirstName: validated.legalFirstName,
      legalLastName: validated.legalLastName,
      dateOfBirth: validated.dateOfBirth,
      taxIdType: validated.taxIdType,
      taxIdNumber: validated.taxIdNumber,
      residentialAddress: validated.residentialAddress,
      documents: validated.documents,
    });

    res.status(200).json({
      status: 'submitted',
      message: 'Verification submission received and queued for compliance review.',
      profile: defaultKycService.sanitizeForCustomer(updated),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/kyc/:userId/documents/:documentId
 * Securely accesses document reference for owner or authorized compliance officer.
 */
kycRouter.get('/users/:userId/documents/:documentId', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, documentId } = req.params;
    const result = defaultKycService.getSecureDocumentAccess({
      targetUserId: userId!,
      documentId: documentId!,
      actorUserId: req.user!.id,
      actorRole: req.user!.role,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/kyc/reviews
 * Restricted to COMPLIANCE_REVIEWER / ADMIN / SUPER_ADMIN.
 */
kycRouter.get(
  '/reviews',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response) => {
    const profiles = defaultKycService.getAllProfilesForReview(req.user!.role);
    res.json({
      count: profiles.length,
      profiles,
    });
  }
);

/**
 * POST /api/v1/kyc/reviews/:userId/decision
 * Compliance review decision. Strictly restricted to COMPLIANCE_REVIEWER / ADMIN / SUPER_ADMIN.
 */
kycRouter.post(
  '/reviews/:userId/decision',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const validated = ReviewDecisionSchema.parse(req.body);

      const updated = await defaultKycService.reviewProfile({
        reviewerRole: req.user!.role,
        reviewerUserId: req.user!.id,
        reviewerName: req.user!.fullName,
        targetUserId: userId!,
        decision: validated.decision,
        notes: validated.notes,
        rejectionReason: validated.rejectionReason,
        reasonCode: validated.reasonCode,
        expectedVersion: validated.expectedVersion,
      });

      res.status(200).json({
        status: 'decision_recorded',
        profile: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

const ExternalKycCallbackSchema = z.object({
  userId: z.string().min(1),
  providerCode: z.string().min(1),
  externalCaseId: z.string().min(1),
  status: z.enum(['PENDING', 'VERIFIED', 'FAILED', 'INCONCLUSIVE', 'UNRESOLVED']),
  confidenceScore: z.number().min(0).max(1).optional(),
  checksSummary: z
    .object({
      documentAuthenticity: z.boolean(),
      facialMatch: z.boolean(),
      sanctionsClear: z.boolean(),
      pepClear: z.boolean(),
    })
    .optional(),
});

/**
 * POST /api/v1/kyc/external-callback
 * Inbound webhook for external identity verification results.
 * Validates HMAC signature, records advisory result, and preserves human compliance gate.
 */
kycRouter.post('/external-callback', (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = (req.headers['x-provider-signature'] as string) || '';
    const timestamp = (req.headers['x-provider-timestamp'] as string) || '';
    const correlationId = (req.headers['x-correlation-id'] as string) || `corr_kyc_${Date.now()}`;

    const config = getValidatedConfig();
    const rawPayload = JSON.stringify(req.body);
    const signatureVerified = verifyHmacSha256Webhook({
      payload: rawPayload,
      signatureHeader: signature,
      secret: config.MOCK_PROVIDER_WEBHOOK_SECRET,
      timestampHeader: timestamp,
      toleranceSeconds: config.WEBHOOK_TOLERANCE_SECONDS,
    });

    const validated = ExternalKycCallbackSchema.parse(req.body);

    const updated = defaultKycService.attachExternalVerificationResult({
      userId: validated.userId,
      providerCode: validated.providerCode,
      externalCaseId: validated.externalCaseId,
      status: validated.status,
      confidenceScore: validated.confidenceScore,
      checksSummary: validated.checksSummary,
      signatureVerified,
      correlationId,
    });

    res.status(200).json({
      status: 'callback_processed',
      signatureVerified,
      externalCaseId: validated.externalCaseId,
      customerKycStatus: updated.status,
      advisoryNotice: 'External verification recorded. Internal human review remains required for full approval.',
    });
  } catch (err) {
    next(err);
  }
});

