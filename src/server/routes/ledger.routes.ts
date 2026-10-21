/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Financial Ledger Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { defaultLedgerService } from '../services/ledger.service.ts';
import { verifyDoubleEntryInvariant } from '../../domain/ledger/LedgerInvariant.ts';

export const ledgerRouter = Router();

const PostEntrySchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  currency: z.string().length(3, 'Currency code must be 3 characters'),
  narration: z.string().min(3, 'Narration must be at least 3 characters'),
  lines: z
    .array(
      z.object({
        accountId: z.string().min(1),
        direction: z.enum(['DEBIT', 'CREDIT']),
        amountMinor: z.string().or(z.number()).transform((val) => BigInt(val)),
        description: z.string().optional(),
      })
    )
    .min(2, 'Journal entry requires at least 2 lines'),
});

/**
 * GET /api/v1/ledger/accounts
 */
ledgerRouter.get('/accounts', (_req: Request, res: Response) => {
  const accounts = defaultLedgerService.getAccounts();
  res.json({
    count: accounts.length,
    accounts,
  });
});

/**
 * GET /api/v1/ledger/entries
 */
ledgerRouter.get('/entries', (_req: Request, res: Response) => {
  const entries = defaultLedgerService.getEntries().map((e) => ({
    ...e,
    lines: e.lines.map((l) => ({
      ...l,
      amountMinor: l.amountMinor.toString(),
    })),
  }));
  res.json({
    count: entries.length,
    entries,
  });
});

/**
 * GET /api/v1/ledger/summary
 */
ledgerRouter.get('/summary', (_req: Request, res: Response) => {
  const summary = defaultLedgerService.getLedgerSummary();
  res.json(summary);
});

/**
 * GET /api/v1/ledger/verify-invariant
 */
ledgerRouter.get('/verify-invariant', (_req: Request, res: Response) => {
  const summary = defaultLedgerService.getLedgerSummary();
  res.json({
    invariantSatisfied: summary.isBalanced,
    globalDebitsMinor: summary.globalDebitsMinor,
    globalCreditsMinor: summary.globalCreditsMinor,
    imbalanceMinor: summary.imbalanceMinor,
    checkedAt: new Date().toISOString(),
    rule: 'Sum(Debits) === Sum(Credits) across all posted journal entries',
  });
});

/**
 * POST /api/v1/ledger/entries
 */
ledgerRouter.post('/entries', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = PostEntrySchema.parse(req.body);

    // Verify invariant before posting
    const invariant = verifyDoubleEntryInvariant(validated.lines);
    if (!invariant.isValid) {
      res.status(422).json({
        type: 'https://avenora.com/errors/unbalanced-entry',
        title: 'Unbalanced Journal Entry',
        status: 422,
        detail: invariant.error,
        totalDebitMinor: invariant.totalDebitMinor.toString(),
        totalCreditMinor: invariant.totalCreditMinor.toString(),
        imbalanceMinor: invariant.imbalanceMinor.toString(),
      });
      return;
    }

    const created = defaultLedgerService.postJournalEntry({
      transactionId: validated.transactionId,
      currency: validated.currency,
      narration: validated.narration,
      lines: validated.lines,
    });

    res.status(201).json({
      status: 'posted',
      entry: {
        ...created,
        lines: created.lines.map((l) => ({
          ...l,
          amountMinor: l.amountMinor.toString(),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});
