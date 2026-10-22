/**
 * @license Apache-2.0
 * Customer domestic simulated bank account routes (KYC-gated).
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRoles } from '../middleware/auth.ts';
import { defaultAuthService } from '../services/auth.service.ts';
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

    // Backfill / refresh country-format account numbers (KYC bypass generates immediately in prototype mode).
    record = await defaultDomesticBankAccountService.ensurePrimaryAccountForActiveUser({
      userId: user.id,
      correlationId: `domestic_me_${user.id}`,
    });

    const kycStatus = defaultAuthService.getUserById(user.id)?.kycStatus ?? user.kycStatus;

    if (!record) {
      res.json({
        generationStatus: 'NOT_ELIGIBLE',
        message: 'Domestic account details are not available yet.',
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
