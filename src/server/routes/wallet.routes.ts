/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Multicurrency Wallet & Financial Operations Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { defaultWalletService } from '../services/wallet.service.ts';
import { defaultAuthService } from '../services/auth.service.ts';
import { authenticate } from '../middleware/auth.ts';
import { requireTransactionEligible } from '../middleware/accountAccess.ts';
import { isDepositRailAllowedForCountry } from '../../domain/country/countryDepositRails.ts';
import { isWithdrawalRailAllowedForCountry } from '../../domain/country/withdrawalRailFields.ts';

export const walletRouter = Router();

const TransactionPinSchema = z
  .string()
  .regex(/^\d{4}$/, 'Transaction PIN must be exactly 4 digits');

const DepositSchema = z.object({
  currency: z.string().length(3),
  amountDecimal: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a valid positive decimal'),
  sourceRail: z.string().min(2).optional(),
});

const BtcDepositProofSchema = z.object({
  amountDecimal: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a valid positive decimal'),
  fileName: z.string().min(1),
  mimeType: z.string().min(3),
  fileSize: z.number().int().positive(),
});

const WithdrawalSchema = z.object({
  currency: z.string().min(3).max(4),
  amountDecimal: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a valid positive decimal'),
  destinationRail: z.string().min(2).optional(),
  bankingDetails: z.record(z.string(), z.string()).optional(),
  btcAddress: z.string().min(14).max(90).optional(),
  transactionPin: TransactionPinSchema,
});

const TransferSchema = z.object({
  recipientEmailOrId: z.string().min(3),
  currency: z.string().length(3),
  amountDecimal: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a valid positive decimal'),
  note: z.string().optional(),
  transactionPin: TransactionPinSchema,
});

async function requireValidTransactionPin(
  req: Request,
  res: Response,
  transactionPin: string,
): Promise<boolean> {
  try {
    await defaultAuthService.verifyTransactionPinForUser(req.user!.id, transactionPin);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('temporarily locked')) {
      res.status(429).json({
        type: 'https://avenora.com/errors/account-locked',
        title: 'Account Temporarily Locked',
        status: 429,
        detail: message,
        instance: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return false;
    }
    res.status(401).json({
      type: 'https://avenora.com/errors/invalid-transaction-pin',
      title: 'Invalid Transaction PIN',
      status: 401,
      detail: message.includes('must be exactly 4 digits')
        ? message
        : 'The transaction PIN is incorrect.',
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    return false;
  }
}

const FxQuoteSchema = z.object({
  sourceCurrency: z.string().min(3).max(4),
  destinationCurrency: z.string().min(3).max(4),
  sourceAmountDecimal: z.string().regex(/^\d+(\.\d+)?$/),
});

const FxConvertSchema = z.object({
  quoteId: z.string().min(5),
});

/**
 * GET /api/v1/wallets/me
 * Retrieves current customer's multicurrency wallet with live derived ledger balances.
 */
walletRouter.get('/me', authenticate, (req: Request, res: Response) => {
  const wallet = defaultWalletService.getOrCreateUserWallet(
    req.user!.id,
    req.user!.fullName,
    req.user!.countryCode,
  );
  res.json({
    wallet,
  });
});

/**
 * GET /api/v1/wallets/transactions
 * Retrieves authoritative ledger transaction history for the authenticated customer.
 */
walletRouter.get('/transactions', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const currency = typeof req.query.currency === 'string' ? req.query.currency : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const transactions = defaultWalletService.getUserTransactions(req.user!.id, {
      currency,
      type,
      search,
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.json({
      total: transactions.length,
      transactions,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/wallets/transactions/:id
 * Retrieves a single transaction record with full ledger details.
 */
walletRouter.get('/transactions/:id', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const tx = defaultWalletService.getTransactionById(req.params.id!, req.user!.id);
    if (!tx) {
      res.status(404).json({
        type: 'https://avenora.com/errors/not-found',
        title: 'Transaction Not Found',
        status: 404,
        detail: `No transaction with ID "${req.params.id}" exists for this customer account.`,
      });
      return;
    }
    res.json({ transaction: tx });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/wallets/statements
 * Generates an itemized simulated monthly statement for a given currency and period.
 */
walletRouter.get('/statements', authenticate, (req: Request, res: Response, next: NextFunction) => {
  try {
    const currency = typeof req.query.currency === 'string' ? req.query.currency.toUpperCase() : 'USD';
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;

    const statement = defaultWalletService.getMonthlyStatement(req.user!.id, currency, year, month);
    res.json({ statement });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/wallets/deposit
 * Executes an authorized simulated deposit.
 */
walletRouter.get('/deposit/btc-instructions', authenticate, (_req: Request, res: Response) => {
  res.json(defaultWalletService.getBtcDepositInstructions());
});

walletRouter.post('/deposit/btc-proof', authenticate, requireTransactionEligible, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = BtcDepositProofSchema.parse(req.body);
    const record = await defaultWalletService.submitBtcDepositProof({
      userId: req.user!.id,
      amountDecimal: validated.amountDecimal,
      fileName: validated.fileName,
      mimeType: validated.mimeType,
      fileSize: validated.fileSize,
    });
    res.status(201).json({
      status: 'pending_review',
      message:
        'Payment proof received. The requested amount is on hold in your BTC wallet until our team verifies and approves the deposit.',
      proof: {
        id: record.id,
        submittedAt: record.submittedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

walletRouter.post('/deposit', authenticate, requireTransactionEligible, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = DepositSchema.parse(req.body);
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;

    if (validated.currency.toUpperCase() === 'BTC') {
      res.status(400).json({
        title: 'Use Bitcoin deposit flow',
        detail: 'Submit your BTC transfer using the on-screen Bitcoin deposit instructions.',
      });
      return;
    }

    if (validated.sourceRail) {
      const country = req.user!.countryCode ?? 'US';
      if (!isDepositRailAllowedForCountry(country, validated.sourceRail)) {
        res.status(400).json({
          title: 'Invalid deposit method',
          detail: 'The selected deposit method is not available for your country.',
        });
        return;
      }
    }

    const record = await defaultWalletService.requestPendingDeposit({
      userId: req.user!.id,
      currency: validated.currency.toUpperCase(),
      amountDecimal: validated.amountDecimal,
      kind: 'FIAT',
      sourceRail: validated.sourceRail,
    });

    res.status(201).json({
      status: 'pending_review',
      message:
        'Deposit request recorded. The amount appears on hold in your wallet until operations approves it, then it moves to your available balance.',
      deposit: {
        id: record.id,
        referenceNumber: record.referenceNumber,
        formattedAmount: record.formattedAmount,
        currency: record.currency,
        submittedAt: record.submittedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/wallets/withdraw
 * Executes an authorized simulated withdrawal with available balance verification.
 */
walletRouter.post('/withdraw', authenticate, requireTransactionEligible, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = WithdrawalSchema.parse(req.body);
    const pinOk = await requireValidTransactionPin(req, res, validated.transactionPin);
    if (!pinOk) return;

    const currency = validated.currency.toUpperCase();
    const isBtc = currency === 'BTC';

    if (isBtc) {
      if (!validated.btcAddress) {
        res.status(400).json({
          title: 'Bitcoin address required',
          detail: 'Provide the BTC address where funds should be sent.',
        });
        return;
      }
    } else if (validated.destinationRail) {
      const country = req.user!.countryCode ?? 'US';
      if (!isWithdrawalRailAllowedForCountry(country, validated.destinationRail)) {
        res.status(400).json({
          title: 'Invalid withdrawal method',
          detail: 'The selected withdrawal method is not available for your country.',
        });
        return;
      }
    }

    const record = await defaultWalletService.requestPendingWithdrawal({
      userId: req.user!.id,
      currency,
      amountDecimal: validated.amountDecimal,
      kind: isBtc ? 'BTC' : 'FIAT',
      destinationRail: validated.destinationRail,
      bankingDetails: validated.bankingDetails,
      btcAddress: validated.btcAddress,
    });

    res.status(201).json({
      status: 'pending_review',
      message:
        'Withdrawal request submitted. The amount is reserved from your available balance and shown under Hold until operations approves the payout.',
      withdrawal: {
        id: record.id,
        referenceNumber: record.referenceNumber,
        formattedAmount: record.formattedAmount,
        currency: record.currency,
        submittedAt: record.submittedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/wallets/transfer
 * Executes an atomic simulated internal transfer between customer wallets.
 */
walletRouter.post('/transfer', authenticate, requireTransactionEligible, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = TransferSchema.parse(req.body);
    const pinOk = await requireValidTransactionPin(req, res, validated.transactionPin);
    if (!pinOk) return;

    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;

    const result = await defaultWalletService.executeInternalTransfer({
      senderUserId: req.user!.id,
      recipientEmailOrId: validated.recipientEmailOrId,
      currency: validated.currency.toUpperCase(),
      amountDecimal: validated.amountDecimal,
      idempotencyKey,
      note: validated.note,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/wallets/fx/quote
 * Requests an illustrative short-lived FX quote.
 */
walletRouter.post('/fx/quote', authenticate, requireTransactionEligible, (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = FxQuoteSchema.parse(req.body);

    const quote = defaultWalletService.generateFxQuote({
      userId: req.user!.id,
      sourceCurrency: validated.sourceCurrency.toUpperCase(),
      destinationCurrency: validated.destinationCurrency.toUpperCase(),
      sourceAmountDecimal: validated.sourceAmountDecimal,
    });

    res.status(200).json({
      quote,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/wallets/fx/convert
 * Executes conversion against a valid quote with atomic multi-currency balanced postings.
 */
walletRouter.post('/fx/convert', authenticate, requireTransactionEligible, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = FxConvertSchema.parse(req.body);
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;

    const result = await defaultWalletService.executeFxConversion({
      userId: req.user!.id,
      quoteId: validated.quoteId,
      idempotencyKey,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
