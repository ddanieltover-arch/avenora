/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Structured Request Logger with PII Masking
 *
 * Emits JSON logs with correlation IDs.
 * Automatically masks sensitive customer data (passwords, tokens, PANs, emails, SSNs).
 */

import { Request, Response, NextFunction } from 'express';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'apikey',
  'api_key',
  'cardnumber',
  'pan',
  'cvv',
  'ssn',
  'cpf',
  'taxid',
]);

export function maskSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') {
    if (typeof data === 'string') {
      // Mask email patterns: j***@domain.com
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
        const [user, domain] = data.split('@');
        return `${(user ?? '').slice(0, 1)}***@${domain}`;
      }
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  const maskedObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase().replace(/[-_]/g, '');
    if (SENSITIVE_KEYS.has(normalizedKey)) {
      maskedObj[key] = '[REDACTED_FINANCIAL_PII]';
    } else if (typeof value === 'object' && value !== null) {
      maskedObj[key] = maskSensitiveData(value);
    } else {
      maskedObj[key] = value;
    }
  }

  return maskedObj;
}

export function structuredLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();
  const correlationId = (req.headers['x-correlation-id'] as string) || 'unknown';

  res.on('finish', () => {
    const elapsedNanos = process.hrtime.bigint() - startTime;
    const durationMs = Number(elapsedNanos) / 1_000_000;

    const logEntry = {
      timestamp: new Date().toISOString(),
      correlationId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userAgent: req.get('user-agent') || 'internal',
      query: maskSensitiveData(req.query),
    };

    // Standard JSON output for log aggregators (e.g. Datadog, CloudWatch, GCP Cloud Logging)
    if (res.statusCode >= 500) {
      console.error(JSON.stringify({ level: 'ERROR', ...logEntry }));
    } else if (res.statusCode >= 400) {
      console.warn(JSON.stringify({ level: 'WARN', ...logEntry }));
    } else {
      console.log(JSON.stringify({ level: 'INFO', ...logEntry }));
    }
  });

  next();
}
