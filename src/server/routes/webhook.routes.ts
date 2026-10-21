/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Secure Mock Webhook Gateway Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { defaultWebhookService, MockWebhookPayload, WebhookService } from '../services/webhook.service.ts';
import { getValidatedConfig } from '../../config/env.config.ts';

export const webhookRouter = Router();

const MockEventSchema = z.object({
  eventId: z.string().min(5),
  eventType: z.enum(['mock.deposit.cleared', 'mock.wire.inbound', 'mock.compliance.flag', 'mock.health.ping']),
  timestamp: z.string(),
  data: z.record(z.string(), z.any()),
});

/**
 * POST /api/v1/webhooks/mock-provider
 * Secure mock webhook receiver with HMAC-SHA256 signature verification and replay protection.
 */
webhookRouter.post('/mock-provider', (req: Request, res: Response, next: NextFunction) => {
  try {
    const signatureHeader =
      (req.headers['avenora-signature'] as string) ||
      (req.headers['provider-signature'] as string) ||
      (req.headers['x-signature'] as string);

    // 1. Verify cryptographic signature over raw request bytes
    const verification = defaultWebhookService.verifySignature(req.rawBody, signatureHeader);

    if (!verification.isValid) {
      res.status(401).json({
        type: 'https://avenora.com/errors/invalid-webhook-signature',
        title: 'Webhook Signature Verification Failed',
        status: 401,
        detail: verification.error,
        code: verification.code,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 2. Validate event payload schema
    const rawBodyStr = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
    const parsedEvent = MockEventSchema.parse(req.body) as MockWebhookPayload;

    // 3. Process event idempotently
    const processResult = defaultWebhookService.processEvent(
      parsedEvent,
      rawBodyStr,
      signatureHeader!
    );

    res.status(200).json({
      received: true,
      status: processResult.status,
      message: processResult.message,
      recordId: processResult.recordId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/webhooks/events
 * Retrieves recent webhook event audit logs.
 */
webhookRouter.get('/events', (_req: Request, res: Response) => {
  const events = defaultWebhookService.getRecentEvents();
  res.json({
    count: events.length,
    events,
  });
});

/**
 * POST /api/v1/webhooks/generate-test-signature
 * Developer utility to generate signed test payloads for QA, verification, and UI simulator.
 */
webhookRouter.post('/generate-test-signature', (req: Request, res: Response) => {
  const payload = req.body;
  const rawBodyStr = JSON.stringify(payload);
  const config = getValidatedConfig();

  const signatureHeader = WebhookService.generateSignatureHeader(
    rawBodyStr,
    config.MOCK_PROVIDER_WEBHOOK_SECRET
  );

  res.json({
    payload,
    signatureHeader,
    hint: 'Include this signature in the "Avenora-Signature" header when calling /api/v1/webhooks/mock-provider',
  });
});
