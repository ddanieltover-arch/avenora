/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Webhook Signature & Replay Protection Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookService, MockWebhookPayload } from '../../src/server/services/webhook.service.ts';

describe('Secure Mock Webhook Gateway', () => {
  let webhookService: WebhookService;
  const mockSecret = 'whsec_mock_avenora_fintech_partner_signing_key_2026';

  beforeEach(() => {
    webhookService = new WebhookService();
  });

  it('accepts valid HMAC-SHA256 signature calculated over raw payload bytes', () => {
    const rawPayload = JSON.stringify({
      eventId: 'evt_test_valid_01',
      eventType: 'mock.deposit.cleared',
      timestamp: new Date().toISOString(),
      data: { referenceNumber: 'DEP-USD-123456' },
    });

    const signatureHeader = WebhookService.generateSignatureHeader(rawPayload, mockSecret);
    const verification = webhookService.verifySignature(rawPayload, signatureHeader);

    expect(verification.isValid).toBe(true);
    expect(verification.code).toBe('VALID');
  });

  it('rejects tampered or modified payload bytes (Integrity Protection)', () => {
    const originalPayload = JSON.stringify({ eventId: 'evt_orig', amount: '100.00' });
    const signatureHeader = WebhookService.generateSignatureHeader(originalPayload, mockSecret);

    // Tampered payload
    const tamperedPayload = JSON.stringify({ eventId: 'evt_orig', amount: '9999.00' });
    const verification = webhookService.verifySignature(tamperedPayload, signatureHeader);

    expect(verification.isValid).toBe(false);
    expect(verification.code).toBe('INVALID_SIGNATURE');
  });

  it('rejects expired timestamp beyond tolerance window (Replay Attack Prevention)', () => {
    const rawPayload = JSON.stringify({ eventId: 'evt_old', action: 'ping' });
    // Signature created 1 hour ago (3600s > 300s tolerance)
    const oldTimestamp = Math.floor(Date.now() / 1000) - 3600;

    const signatureHeader = WebhookService.generateSignatureHeader(rawPayload, mockSecret, oldTimestamp);
    const verification = webhookService.verifySignature(rawPayload, signatureHeader);

    expect(verification.isValid).toBe(false);
    expect(verification.code).toBe('EXPIRED_TIMESTAMP');
    expect(verification.error).toContain('Replay attack blocked');
  });

  it('rejects missing or malformed signature headers', () => {
    const rawPayload = JSON.stringify({ eventId: 'evt_missing' });

    const res1 = webhookService.verifySignature(rawPayload, undefined);
    expect(res1.isValid).toBe(false);
    expect(res1.code).toBe('MISSING_SIGNATURE');

    const res2 = webhookService.verifySignature(rawPayload, 'malformed_header_without_keys');
    expect(res2.isValid).toBe(false);
    expect(res2.code).toBe('MALFORMED_HEADER');
  });

  it('handles duplicate event deliveries idempotently without re-triggering actions', () => {
    const eventPayload: MockWebhookPayload = {
      eventId: 'evt_unique_12345',
      eventType: 'mock.deposit.cleared',
      timestamp: new Date().toISOString(),
      data: { referenceNumber: 'DEP-EUR-998877' },
    };
    const rawStr = JSON.stringify(eventPayload);
    const sigHeader = WebhookService.generateSignatureHeader(rawStr, mockSecret);

    // First delivery
    const result1 = webhookService.processEvent(eventPayload, rawStr, sigHeader);
    expect(result1.status).toBe('PROCESSED');

    // Duplicate delivery with identical eventId
    const result2 = webhookService.processEvent(eventPayload, rawStr, sigHeader);
    expect(result2.status).toBe('DUPLICATE');
    expect(result2.message).toContain('already received');
  });
});
