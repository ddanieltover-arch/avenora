/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Loan & Credit Application HTTP Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { defaultLoanService } from '../services/loan.service.ts';
import { authenticate, requireRoles } from '../middleware/auth.ts';

export const loanRouter = Router();

// Validation Schemas
const AmortizationSchema = z.object({
  principalDecimal: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be valid positive monetary string'),
  currency: z.string().length(3),
  annualRatePercent: z.number().min(0).max(100),
  termMonths: z.number().int().min(1).max(360),
});

const CreateLoanSchema = z.object({
  type: z.enum(['PERSONAL', 'SMALL_BUSINESS']).default('PERSONAL'),
  currency: z.string().length(3).default('USD'),
  requestedAmountDecimal: z.string().regex(/^\d+(\.\d{1,2})?$/),
  termMonths: z.number().int().min(1).max(360),
  purpose: z.string().min(5).max(500),
  annualIncomeDecimal: z.string().regex(/^\d+(\.\d{1,2})?$/),
  monthlyExpensesDecimal: z.string().regex(/^\d+(\.\d{1,2})?$/),
  businessName: z.string().optional(),
  businessRevenueDecimal: z.string().optional(),
  consentAcknowledged: z.boolean().refine((val) => val === true, {
    message: 'Must acknowledge credit demonstration consent and synthetic assessment terms',
  }),
  autoSubmit: z.boolean().optional().default(false),
});

const ReviewLoanSchema = z.object({
  decision: z.enum(['APPROVED_FOR_DEMO', 'DECLINED_FOR_DEMO', 'NEEDS_MORE_INFORMATION', 'UNDER_REVIEW']),
  reasonCode: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/v1/loans/amortization-calculator
 */
loanRouter.post('/amortization-calculator', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const validated = AmortizationSchema.parse(req.body);
    const result = defaultLoanService.calculateAmortization(validated);
    res.json({
      status: 'calculated',
      data: result,
      notice: 'DEMO ESTIMATE ONLY: Subject to underwriting and regulatory approval.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/loans/applications
 */
loanRouter.get('/applications', authenticate, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const showAll = req.query.all === 'true';

    if (showAll && ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      const allApps = defaultLoanService.getAllApplicationsForReview(user.role);
      res.json({
        total: allApps.length,
        view: 'compliance_officer_queue',
        applications: allApps,
      });
      return;
    }

    const userApps = defaultLoanService.getUserApplications(user.id);
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
 * GET /api/v1/loans/applications/:id
 */
loanRouter.get('/applications/:id', authenticate, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const appId = req.params.id!;
    const app = defaultLoanService.getApplicationById(appId);
    if (!app) {
      res.status(404).json({
        type: 'https://avenora.com/errors/not-found',
        title: 'Application Not Found',
        status: 404,
        detail: `Loan application with ID "${appId}" was not found.`,
      });
      return;
    }

    const isStaff = ['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
    if (app.userId !== user.id && !isStaff) {
      res.status(403).json({
        type: 'https://avenora.com/errors/access-denied',
        title: 'Access Denied',
        status: 403,
        detail: 'You do not have permission to view another customer’s loan application.',
      });
      return;
    }

    res.json({ application: app });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/loans/applications
 */
loanRouter.post('/applications', authenticate, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const validated = CreateLoanSchema.parse(req.body);

    const app = defaultLoanService.createDraftApplication({
      userId: user.id,
      applicantName: user.fullName,
      type: validated.type,
      currency: validated.currency,
      requestedAmountDecimal: validated.requestedAmountDecimal,
      termMonths: validated.termMonths,
      purpose: validated.purpose,
      annualIncomeDecimal: validated.annualIncomeDecimal,
      monthlyExpensesDecimal: validated.monthlyExpensesDecimal,
      businessName: validated.businessName,
      businessRevenueDecimal: validated.businessRevenueDecimal,
      consentAcknowledged: validated.consentAcknowledged,
    });

    if (validated.autoSubmit) {
      const submitted = defaultLoanService.submitApplication(app.id, user.id);
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
 * POST /api/v1/loans/applications/:id/submit
 */
loanRouter.post('/applications/:id/submit', authenticate, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const appId = req.params.id!;
    const submitted = defaultLoanService.submitApplication(appId, user.id);
    res.json({
      status: 'submitted',
      application: submitted,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/loans/applications/:id/cancel
 */
loanRouter.post('/applications/:id/cancel', authenticate, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const appId = req.params.id!;
    const cancelled = defaultLoanService.cancelApplication(appId, user.id);
    res.json({
      status: 'cancelled',
      application: cancelled,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/loans/applications/:id/review
 */
loanRouter.post(
  '/applications/:id/review',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const reviewer = req.user!;
      const appId = req.params.id!;
      const validated = ReviewLoanSchema.parse(req.body);

      const updated = defaultLoanService.reviewApplication({
        reviewerRole: reviewer.role,
        reviewerUserId: reviewer.id,
        applicationId: appId,
        decision: validated.decision,
        reasonCode: validated.reasonCode,
        notes: validated.notes,
      });

      res.json({
        status: 'decision_recorded',
        application: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);
