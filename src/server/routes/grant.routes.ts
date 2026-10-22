/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Verified Grant Programs & Applications HTTP Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { defaultGrantService } from '../services/grant.service.ts';
import { authenticate, requireRoles } from '../middleware/auth.ts';
import { requireTransactionEligible } from '../middleware/accountAccess.ts';

export const grantRouter = Router();

// Validation Schemas
const CreateGrantAppSchema = z.object({
  programId: z.string().min(1),
  projectTitle: z.string().min(3).max(200),
  projectSummary: z.string().min(10).max(2000),
  requestedAmountDecimal: z.string().regex(/^\d+(\.\d{1,2})?$/),
  eligibilityAnswers: z.record(z.string(), z.union([z.boolean(), z.string()])),
  documentRefs: z.array(z.string()).optional(),
  autoSubmit: z.boolean().optional().default(false),
});

const ReviewGrantAppSchema = z.object({
  decision: z.enum(['APPROVED_FOR_DEMO', 'DECLINED', 'NEEDS_MORE_INFORMATION', 'UNDER_REVIEW']),
  notes: z.string().optional(),
});

const VerifyProgramSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
});

/**
 * GET /api/v1/grants/programs
 */
grantRouter.get('/programs', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { country, currency, status, verifiedOnly } = req.query;
    const programs = defaultGrantService.getPrograms({
      country: country ? String(country) : undefined,
      currency: currency ? String(currency) : undefined,
      status: status ? (String(status) as any) : undefined,
      verifiedOnly: verifiedOnly === 'true',
    });

    res.json({
      total: programs.length,
      programs,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/grants/programs/:id
 */
grantRouter.get('/programs/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const progId = req.params.id!;
    const prog = defaultGrantService.getProgramById(progId);
    if (!prog) {
      res.status(404).json({
        type: 'https://avenora.com/errors/not-found',
        title: 'Grant Program Not Found',
        status: 404,
        detail: `Grant program "${progId}" does not exist.`,
      });
      return;
    }
    res.json({ program: prog });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/grants/programs/:id/verify
 */
grantRouter.post(
  '/programs/:id/verify',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const reviewer = req.user!;
      const progId = req.params.id!;
      const validated = VerifyProgramSchema.parse(req.body);

      const prog = defaultGrantService.verifyProgram({
        programId: progId,
        reviewerUserId: reviewer.id,
        reviewerRole: reviewer.role,
        newStatus: validated.status,
      });

      res.json({
        status: 'program_verified',
        program: prog,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/grants/applications
 */
grantRouter.get('/applications', authenticate, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const showAll = req.query.all === 'true';

    if (showAll && ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      const allApps = defaultGrantService.getAllApplicationsForReview(user.role);
      res.json({
        total: allApps.length,
        view: 'compliance_officer_queue',
        applications: allApps,
      });
      return;
    }

    const userApps = defaultGrantService.getUserApplications(user.id);
    res.json({
      total: userApps.length,
      view: 'customer_applications',
      applications: userApps,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/grants/applications/:id
 */
grantRouter.get('/applications/:id', authenticate, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const appId = req.params.id!;
    const app = defaultGrantService.getApplicationById(appId);
    if (!app) {
      res.status(404).json({
        type: 'https://avenora.com/errors/not-found',
        title: 'Grant Application Not Found',
        status: 404,
        detail: `Grant application with ID "${appId}" does not exist.`,
      });
      return;
    }

    const isStaff = ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
    if (app.userId !== user.id && !isStaff) {
      res.status(403).json({
        type: 'https://avenora.com/errors/access-denied',
        title: 'Access Denied',
        status: 403,
        detail: 'You do not have permission to view this grant application.',
      });
      return;
    }

    res.json({ application: app });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/grants/applications
 */
grantRouter.post('/applications', authenticate, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const validated = CreateGrantAppSchema.parse(req.body);

    const app = defaultGrantService.createApplication({
      programId: validated.programId,
      userId: user.id,
      applicantName: user.fullName,
      projectTitle: validated.projectTitle,
      projectSummary: validated.projectSummary,
      requestedAmountDecimal: validated.requestedAmountDecimal,
      eligibilityAnswers: validated.eligibilityAnswers,
      documentRefs: validated.documentRefs,
    });

    if (validated.autoSubmit) {
      const submitted = defaultGrantService.submitApplication(app.id, user.id);
      res.status(201).json({
        status: 'submitted',
        application: submitted,
      });
      return;
    }

    res.status(201).json({
      status: 'draft_created',
      application: app,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/grants/applications/:id/submit
 */
grantRouter.post('/applications/:id/submit', authenticate, requireTransactionEligible, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const appId = req.params.id!;
    const submitted = defaultGrantService.submitApplication(appId, user.id);
    res.json({
      status: 'submitted',
      application: submitted,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/grants/applications/:id/review
 */
grantRouter.post(
  '/applications/:id/review',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const reviewer = req.user!;
      const appId = req.params.id!;
      const validated = ReviewGrantAppSchema.parse(req.body);

      const reviewed = defaultGrantService.reviewApplication({
        reviewerRole: reviewer.role,
        reviewerUserId: reviewer.id,
        applicationId: appId,
        decision: validated.decision,
        notes: validated.notes,
      });

      res.json({
        status: 'decision_recorded',
        application: reviewed,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/grants/applications/:id/disburse
 */
grantRouter.post(
  '/applications/:id/disburse',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewer = req.user!;
      const appId = req.params.id!;
      const result = await defaultGrantService.simulateDisbursement({
        applicationId: appId,
        approvedByUserId: reviewer.id,
        approvedByRole: reviewer.role,
        idempotencyKey: req.headers['x-idempotency-key'] as string,
      });

      res.json({
        status: 'grant_disbursed',
        award: result.award,
        application: result.application,
        depositDetails: result.depositResult,
      });
    } catch (err) {
      next(err);
    }
  }
);
