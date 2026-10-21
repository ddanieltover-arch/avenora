/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Idempotency Contract & Verification
 */

export interface IdempotencyHeader {
  key: string;
  requestHash: string;
  timestamp: number;
}

export interface CachedIdempotentResponse {
  key: string;
  statusCode: number;
  responseBody: unknown;
  createdAt: Date;
  expiresAt: Date;
}

export function generateSimpleHash(payload: unknown): string {
  const str = JSON.stringify(payload ?? {});
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}
