/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Centralized Error Handler (RFC 7807 Problem Details)
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { LedgerInvariantError } from '../../domain/ledger/LedgerInvariant.ts';
import { InvalidStateTransitionError } from '../../domain/ledger/TransactionState.ts';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  correlationId?: string;
  invalidParams?: Array<{ field: string; message: string }>;
  timestamp: string;
}

export function centralErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = (req.headers['x-correlation-id'] as string) || undefined;
  const instance = req.originalUrl || req.url;
  const timestamp = new Date().toISOString();

  // 1. Validation Errors (Zod)
  if (err instanceof ZodError) {
    const invalidParams = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    const response: ProblemDetails = {
      type: 'https://avenora.com/errors/validation-failed',
      title: 'Bad Request / Invalid Parameters',
      status: 400,
      detail: 'The submitted request payload failed strict schema validation.',
      instance,
      correlationId,
      invalidParams,
      timestamp,
    };
    res.status(400).json(response);
    return;
  }

  // 2. Ledger Invariant Violations (Double-entry balance check failure)
  if (err instanceof LedgerInvariantError) {
    const response: ProblemDetails = {
      type: 'https://avenora.com/errors/ledger-invariant-violation',
      title: 'Financial Ledger Invariant Violation',
      status: 422,
      detail: err.message,
      instance,
      correlationId,
      timestamp,
    };
    res.status(422).json(response);
    return;
  }

  // 3. State Machine Transition Violations
  if (err instanceof InvalidStateTransitionError) {
    const response: ProblemDetails = {
      type: 'https://avenora.com/errors/illegal-state-transition',
      title: 'Illegal Transaction State Transition',
      status: 409,
      detail: err.message,
      instance,
      correlationId,
      timestamp,
    };
    res.status(409).json(response);
    return;
  }

  // 4. Domain & Client-side Error Classification (prevents standard 4xx errors from bubbling as 500)
  const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';

  // 4a. Authentication failures (401)
  if (
    errorMessage.includes('Invalid email or password') ||
    errorMessage.includes('Authentication Failed') ||
    errorMessage.includes('Invalid credentials') ||
    errorMessage.includes('Invalid MFA') ||
    errorMessage.includes('recovery code') ||
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('unauthorized')
  ) {
    const response: ProblemDetails = {
      type: 'https://avenora.com/errors/unauthorized',
      title: 'Authentication Failed',
      status: 401,
      detail: errorMessage,
      instance,
      correlationId,
      timestamp,
    };
    res.status(401).json(response);
    return;
  }

  // 4b. Account Lockout (423)
  if (errorMessage.includes('temporarily locked')) {
    const response: ProblemDetails = {
      type: 'https://avenora.com/errors/account-locked',
      title: 'Account Locked',
      status: 423,
      detail: errorMessage,
      instance,
      correlationId,
      timestamp,
    };
    res.status(423).json(response);
    return;
  }

  // 4c. Permissions / Forbidden (403)
  if (
    errorMessage.includes('Access denied') ||
    errorMessage.includes('Account is suspended') ||
    errorMessage.includes('Account is locked') ||
    errorMessage.includes('Separation of duties') ||
    errorMessage.includes('Forbidden')
  ) {
    const response: ProblemDetails = {
      type: 'https://avenora.com/errors/forbidden',
      title: 'Forbidden',
      status: 403,
      detail: errorMessage,
      instance,
      correlationId,
      timestamp,
    };
    res.status(403).json(response);
    return;
  }

  // 4d. Resource Conflict (409)
  if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
    const response: ProblemDetails = {
      type: 'https://avenora.com/errors/conflict',
      title: 'Resource Conflict',
      status: 409,
      detail: errorMessage,
      instance,
      correlationId,
      timestamp,
    };
    res.status(409).json(response);
    return;
  }

  // 4e. Resource Not Found (404)
  if (errorMessage.includes('not found') || errorMessage.includes('User not found')) {
    const response: ProblemDetails = {
      type: 'https://avenora.com/errors/not-found',
      title: 'Resource Not Found',
      status: 404,
      detail: errorMessage,
      instance,
      correlationId,
      timestamp,
    };
    res.status(404).json(response);
    return;
  }

  // 4f. Bad Request / Client Validation (400)
  if (
    errorMessage.includes('Password must be') ||
    errorMessage.includes('Invalid or expired') ||
    errorMessage.includes('Current password is incorrect') ||
    errorMessage.includes('Invalid verification code')
  ) {
    const response: ProblemDetails = {
      type: 'https://avenora.com/errors/bad-request',
      title: 'Bad Request',
      status: 400,
      detail: errorMessage,
      instance,
      correlationId,
      timestamp,
    };
    res.status(400).json(response);
    return;
  }

  // 5. Unforeseen Internal System Errors (500)
  const isProduction = process.env.NODE_ENV === 'production';

  const response: ProblemDetails = {
    type: 'https://avenora.com/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: isProduction ? 'An unexpected internal system error occurred. Please reference correlation ID.' : errorMessage,
    instance,
    correlationId,
    timestamp,
  };

  res.status(500).json(response);
}
