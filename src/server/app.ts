/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Express Application Factory
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { correlationIdMiddleware } from './middleware/correlationId.ts';
import { structuredLoggerMiddleware } from './middleware/requestLogger.ts';
import { centralErrorHandler } from './middleware/errorHandler.ts';
import { healthRouter } from './routes/health.routes.ts';
import { ledgerRouter } from './routes/ledger.routes.ts';
import { systemRouter } from './routes/system.routes.ts';
import { authRouter } from './routes/auth.routes.ts';
import { kycRouter } from './routes/kyc.routes.ts';
import { walletRouter } from './routes/wallet.routes.ts';
import { webhookRouter } from './routes/webhook.routes.ts';
import { loanRouter } from './routes/loan.routes.ts';
import { grantRouter } from './routes/grant.routes.ts';
import { cardRouter } from './routes/card.routes.ts';
import { adminRouter } from './routes/admin.routes.ts';
import { domesticBankAccountRouter } from './routes/domesticBankAccount.routes.ts';
import { contactRouter } from './routes/contact.routes.ts';

export function createExpressApp(): Express {
  const app = express();

  // Basic security and parsing
  app.disable('x-powered-by');
  app.use(cors());
  app.use(cookieParser());

  // Capture pristine raw bytes for HMAC webhook signature verification
  app.use(
    express.json({
      limit: '1mb',
      verify: (req: Request, _res: Response, buf: Buffer) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Tracing & Logging Middleware
  app.use(correlationIdMiddleware);
  app.use(structuredLoggerMiddleware);

  // API v1 Routing
  app.use('/api/v1', healthRouter);
  app.use('/api/v1/system', systemRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/kyc', kycRouter);
  app.use('/api/v1/wallets', walletRouter);
  app.use('/api/v1/ledger', ledgerRouter);
  app.use('/api/v1/webhooks', webhookRouter);
  app.use('/api/v1/loans', loanRouter);
  app.use('/api/v1/grants', grantRouter);
  app.use('/api/v1/cards', cardRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/domestic-accounts', domesticBankAccountRouter);
  app.use('/api/v1/contact', contactRouter);

  // Unmatched API routes must return JSON (Vite SPA middleware may otherwise yield an empty body).
  app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({
      type: 'https://avenora.com/errors/not-found',
      title: 'Not Found',
      status: 404,
      detail: `No API route matches ${req.method} ${req.originalUrl}.`,
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  });

  // Centralized Error Handler (must be last)
  app.use(centralErrorHandler);

  return app;
}
