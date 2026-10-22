/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Payment Card Services & POS Simulator HTTP Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { defaultCardService } from '../services/card.service.ts';
import { authenticate } from '../middleware/auth.ts';
import { requireTransactionEligible } from '../middleware/accountAccess.ts';

export const cardRouter = Router();

// Validation Schemas
const RequestCardSchema = z.object({
  currency: z.string().length(3).default('USD'),
  cardholderName: z.string().min(2).max(50),
  type: z.enum(['DEBIT', 'CREDIT']).default('DEBIT'),
  form: z.enum(['VIRTUAL', 'PHYSICAL']).default('VIRTUAL'),
  dailyLimitDecimal: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  singleTxLimitDecimal: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum(['ACTIVE_SIMULATED', 'FROZEN', 'TERMINATED']),
  reason: z.string().optional(),
});

const UpdateLimitsSchema = z.object({
  dailyLimitDecimal: z.string().regex(/^\d+(\.\d{1,2})?$/),
  singleTxLimitDecimal: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

const SimulateAuthSchema = z.object({
  merchantName: z.string().min(2).max(100),
  mcc: z.string().regex(/^\d{4}$/, 'Must be 4-digit Merchant Category Code'),
  amountDecimal: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().length(3),
});

/**
 * GET /api/v1/cards
 */
cardRouter.get('/', authenticate, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const cards = defaultCardService
      .getUserCards(user.id)
      .map((c) => defaultCardService.sanitizeCardForCustomer(c));
    res.json({
      total: cards.length,
      cards,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/cards/:id
 */
cardRouter.get('/:id', authenticate, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const cardId = req.params.id!;
    const card = defaultCardService.getCardById(cardId);
    if (!card) {
      res.status(404).json({
        type: 'https://avenora.com/errors/not-found',
        title: 'Card Not Found',
        status: 404,
        detail: `Card "${cardId}" does not exist.`,
      });
      return;
    }

    const isStaff = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
    if (card.userId !== user.id && !isStaff) {
      res.status(403).json({
        type: 'https://avenora.com/errors/access-denied',
        title: 'Access Denied',
        status: 403,
        detail: 'You do not have permission to view another customer’s card.',
      });
      return;
    }

    const payload =
      card.userId === user.id && !isStaff
        ? defaultCardService.sanitizeCardForCustomer(card)
        : card;
    res.json({ card: payload });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/cards/request
 * Queues a card issuance request for admin approval (not immediately active).
 */
cardRouter.post('/request', authenticate, requireTransactionEligible, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const validated = RequestCardSchema.parse(req.body);

    const card = defaultCardService.requestCard({
      userId: user.id,
      cardholderName: validated.cardholderName || user.fullName,
      currency: validated.currency,
      type: validated.type,
      form: validated.form,
      countryCode: user.countryCode,
      dailyLimitDecimal: validated.dailyLimitDecimal,
      singleTxLimitDecimal: validated.singleTxLimitDecimal,
    });

    res.status(201).json({
      status: 'card_request_pending_review',
      message:
        'Your card request was submitted and is awaiting administrator approval before it can be issued.',
      card: defaultCardService.sanitizeCardForCustomer(card),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/cards/:id/status
 */
cardRouter.patch('/:id/status', authenticate, requireTransactionEligible, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const cardId = req.params.id!;
    const validated = UpdateStatusSchema.parse(req.body);

    const updated = defaultCardService.updateCardStatus({
      cardId,
      actorUserId: user.id,
      actorRole: user.role,
      newStatus: validated.status,
      reason: validated.reason,
    });

    res.json({
      status: 'card_status_updated',
      card: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/cards/:id/limits
 */
cardRouter.patch('/:id/limits', authenticate, requireTransactionEligible, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const cardId = req.params.id!;
    const validated = UpdateLimitsSchema.parse(req.body);

    const updated = defaultCardService.updateLimits({
      cardId,
      userId: user.id,
      dailyLimitDecimal: validated.dailyLimitDecimal,
      singleTxLimitDecimal: validated.singleTxLimitDecimal,
    });

    res.json({
      status: 'limits_updated',
      card: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/cards/:id/simulate-auth
 */
cardRouter.post('/:id/simulate-auth', authenticate, requireTransactionEligible, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const cardId = req.params.id!;
    const validated = SimulateAuthSchema.parse(req.body);

    const result = defaultCardService.simulateAuthorization({
      cardId,
      merchantName: validated.merchantName,
      mcc: validated.mcc,
      amountDecimal: validated.amountDecimal,
      currency: validated.currency,
    });

    res.status(201).json({
      status: 'authorized_pending_hold',
      authorization: result.authorization,
      card: result.card,
      ledgerJournalEntryId: result.ledgerJournalEntryId,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/cards/authorizations/:authId/settle
 */
cardRouter.post('/authorizations/:authId/settle', authenticate, requireTransactionEligible, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const authId = req.params.authId!;
    const result = defaultCardService.simulateSettlement({
      authorizationId: authId,
      actorUserId: user.id,
    });

    res.json({
      status: 'settled_cleared',
      authorization: result.authorization,
      ledgerJournalEntryId: result.ledgerJournalEntryId,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/cards/authorizations/:authId/release
 */
cardRouter.post('/authorizations/:authId/release', authenticate, requireTransactionEligible, (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user!;
    const authId = req.params.authId!;
    const reason = req.body?.reason ? String(req.body.reason) : 'Customer or merchant requested hold release';
    const result = defaultCardService.simulateReleaseOrReversal({
      authorizationId: authId,
      actorUserId: user.id,
      reason,
    });

    res.json({
      status: 'hold_released',
      authorization: result.authorization,
      ledgerJournalEntryId: result.ledgerJournalEntryId,
    });
  } catch (err) {
    next(err);
  }
});
