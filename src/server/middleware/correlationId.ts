/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Correlation & Request ID Middleware
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-correlation-id'] || req.headers['x-request-id'];
  const correlationId = typeof incomingId === 'string' && incomingId.length > 0 
    ? incomingId 
    : `ave_${crypto.randomUUID()}`;

  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', correlationId);
  next();
}
