/**
 * @license Apache-2.0
 * Customer domestic simulated bank account routes (KYC-gated).
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRoles } from '../middleware/auth.ts';
import { defaultDomesticBankAccountService } from '../services/domesticBankAccount.service.ts';
import { defaultKycService } from '../services/kyc.service.ts';
import { getCoverageMatrix } from '../../domain/country/CountryBankingRegistry.ts';

export const domesticBankAccountRouter = Router();

/**
 * GET /api/v1/domestic-accounts/me
 */
domesticBankAccountRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    let record = defaultDomesticBankAccountService.getPrimaryAccountForUser(user.id);
    const kycStatus = user.kycStatus;

    // Backfill: generate country-format account numbers once user KYC is APPROVED
    // (also heals profile/status drift after server restart).
    if ((!record || record.generationStatus === 'NOT_ELIGIBLE' || record.generationStatus === 'PENDING_GENERATION' || record.generationStatus === 'GENERATION_FAILED') && kycStatus === 'APPROVED') {
      const kycProfile = defaultKycService.getOrCreateProfile(user.id);
      record = await defaultDomesticBankAccountService.ensurePrimaryAccountAfterKycApproval({
        userId: user.id,
        kycProfile,
        correlationId: `domestic_me_${user.id}`,
      });
    }

    if (!record) {
      if (kycStatus === 'APPROVED') {
        res.json({
          generationStatus: 'PENDING_GENERATION',
          message: 'Identity verification is approved. Domestic account details are being prepared.',
          disclaimer:
            'SIMULATED ACCOUNT — PROTOTYPE ONLY — NOT FOR REAL DEPOSITS, WITHDRAWALS, OR LIVE FINANCIAL SETTLEMENT.',
        });
        return;
      }

      res.json({
        generationStatus: 'NOT_ELIGIBLE',
        message: 'Complete identity verification to receive your simulated domestic account details.',
        kycStatus,
      });
      return;
    }

    if (record.userId !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    res.json({
      account: defaultDomesticBankAccountService.getCustomerSafeView(record),
      kycStatus,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/domestic-accounts/coverage-matrix
 * Internal diagnostics — admin/compliance only.
 */
domesticBankAccountRouter.get(
  '/coverage-matrix',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (_req: Request, res: Response) => {
    res.json({
      registryVersion: '2026.03.1',
      countries: getCoverageMatrix(),
      disclaimer: 'Coverage reflects synthetic prototype capabilities, not live banking partnerships.',
    });
  }
);

const RetrySchema = z.object({
  userId: z.string().min(1),
  dryRun: z.boolean().optional().default(false),
});

/**
 * POST /api/v1/domestic-accounts/admin/retry
 */
domesticBankAccountRouter.post(
  '/admin/retry',
  authenticate,
  requireRoles(['ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = RetrySchema.parse(req.body);
      const profile = defaultKycService.getOrCreateProfile(validated.userId);
      const outcome = await defaultDomesticBankAccountService.retryGenerationForUser({
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        targetUserId: validated.userId,
        kycProfile: profile,
        dryRun: validated.dryRun,
      });
      res.status(200).json(outcome);
    } catch (err) {
      next(err);
    }
  }
);
