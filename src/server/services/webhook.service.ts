/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Secure Mock Webhook Gateway Service
 *
 * Implements:
 * - HMAC-SHA256 signature verification over exact raw request bytes
 * - Signed timestamp verification with replay prevention (freshness window)
 * - Constant-time cryptographic comparison (timingSafeEqual)
 * - Idempotent event receipt and durable processing logs
 * - Automated rejection of tampered, expired, or replayed events
 */

import crypto from 'crypto';
import { getValidatedConfig } from '../../config/env.config.ts';
import { defaultAuthService } from './auth.service.ts';
import { defaultEmailService, voidEmail } from './email.service.ts';

export interface WebhookVerificationResult {
  isValid: boolean;
  code: 'VALID' | 'MISSING_SIGNATURE' | 'MALFORMED_HEADER' | 'EXPIRED_TIMESTAMP' | 'INVALID_SIGNATURE';
  error?: string;
  timestamp?: number;
  signature?: string;
}

export interface MockWebhookPayload {
  eventId: string;
  eventType: 'mock.deposit.cleared' | 'mock.wire.inbound' | 'mock.compliance.flag' | 'mock.health.ping';
  timestamp: string;
  data: {
    userId?: string;
    referenceNumber?: string;
    currency?: string;
    amountDecimal?: string;
    reason?: string;
    providerTxId?: string;
  };
}

export interface WebhookEventRecord {
  id: string;
  eventId: string;
  eventType: string;
  payloadHash: string;
  signatureHeader: string;
  status: 'PROCESSED' | 'DUPLICATE' | 'REJECTED';
  processingLog: string;
  receivedAt: Date;
  processedAt?: Date;
}

export class WebhookService {
  private eventStore = new Map<string, WebhookEventRecord>();

  /**
   * Generates a valid HMAC-SHA256 signature header for testing and simulation.
   * Format: `t=${timestamp},v1=${signatureHex}`
   */
  public static generateSignatureHeader(rawBody: string | Buffer, secret?: string, timestampSeconds?: number): string {
    const config = getValidatedConfig();
    const signingSecret = secret || config.MOCK_PROVIDER_WEBHOOK_SECRET;
    const ts = timestampSeconds ?? Math.floor(Date.now() / 1000);

    const bodyBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
    const signedPayload = `${ts}.${bodyBuffer.toString('utf8')}`;

    const signature = crypto
      .createHmac('sha256', signingSecret)
      .update(signedPayload)
      .digest('hex');

    return `t=${ts},v1=${signature}`;
  }

  /**
   * Verifies an incoming webhook request signature over exact raw bytes.
   */
  public verifySignature(
    rawBody: Buffer | string | undefined,
    signatureHeader: string | undefined
  ): WebhookVerificationResult {
    const config = getValidatedConfig();
    const secret = config.MOCK_PROVIDER_WEBHOOK_SECRET;
    const toleranceSeconds = config.WEBHOOK_TOLERANCE_SECONDS || 300;

    if (!signatureHeader || typeof signatureHeader !== 'string') {
      return {
        isValid: false,
        code: 'MISSING_SIGNATURE',
        error: 'Missing required Avenora-Signature or Provider-Signature header.',
      };
    }

    if (!rawBody) {
      return {
        isValid: false,
        code: 'MALFORMED_HEADER',
        error: 'Raw request body buffer unavailable for signature verification.',
      };
    }

    // Parse header: t=1728900000,v1=abc123...
    const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, item) => {
      const [k, v] = item.split('=');
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});

    const tsStr = parts['t'];
    const v1 = parts['v1'];

    if (!tsStr || !v1) {
      return {
        isValid: false,
        code: 'MALFORMED_HEADER',
        error: 'Signature header must contain "t" (timestamp) and "v1" (HMAC hex) keys.',
      };
    }

    const timestamp = parseInt(tsStr, 10);
    if (isNaN(timestamp)) {
      return {
        isValid: false,
        code: 'MALFORMED_HEADER',
        error: 'Invalid timestamp value in signature header.',
      };
    }

    // Freshness check: Reject expired or future-skewed requests (Replay Protection)
    const currentSeconds = Math.floor(Date.now() / 1000);
    const ageSeconds = currentSeconds - timestamp;

    if (Math.abs(ageSeconds) > toleranceSeconds) {
      return {
        isValid: false,
        code: 'EXPIRED_TIMESTAMP',
        error: `Timestamp out of tolerance window (${Math.abs(ageSeconds)}s > ${toleranceSeconds}s). Replay attack blocked.`,
        timestamp,
      };
    }

    // Compute expected HMAC-SHA256
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const signedPayload = `${timestamp}.${bodyStr}`;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const actualBuf = Buffer.from(v1, 'utf8');

    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return {
        isValid: false,
        code: 'INVALID_SIGNATURE',
        error: 'HMAC signature verification failed. Secret or payload mismatch.',
        timestamp,
        signature: `${v1.substring(0, 6)}...[REDACTED]`,
      };
    }

    return {
      isValid: true,
      code: 'VALID',
      timestamp,
      signature: `${v1.substring(0, 6)}...[REDACTED]`,
    };
  }

  /**
   * Processes a verified mock webhook event with idempotency and duplicate detection.
   */
  public processEvent(
    event: MockWebhookPayload,
    rawBodyStr: string,
    signatureHeader: string
  ): {
    status: 'PROCESSED' | 'DUPLICATE' | 'REJECTED';
    message: string;
    recordId: string;
  } {
    if (!event.eventId || !event.eventType) {
      throw new Error('Webhook payload must specify "eventId" and "eventType".');
    }

    const payloadHash = crypto.createHash('sha256').update(rawBodyStr).digest('hex');

    // Duplicate event check (Idempotent delivery)
    const existing = this.eventStore.get(event.eventId);
    if (existing) {
      existing.status = 'DUPLICATE';
      existing.processingLog += ` | Duplicate delivery received at ${new Date().toISOString()}`;
      return {
        status: 'DUPLICATE',
        message: `Event #${event.eventId} was already received and processed. Retaining original state.`,
        recordId: existing.id,
      };
    }

    let processingMessage = '';

    // Dispatch permitted mock event types
    switch (event.eventType) {
      case 'mock.deposit.cleared': {
        processingMessage = `Mock clearing acknowledged for tx ref: ${event.data.referenceNumber || 'N/A'}`;
        const depositUser = event.data.userId
          ? defaultAuthService.getUserById(event.data.userId)
          : undefined;
        if (depositUser?.email) {
          voidEmail(
            'provider-deposit-cleared',
            defaultEmailService.sendProviderDepositClearedEmail({
              to: depositUser.email,
              fullName: depositUser.fullName,
              amount: event.data.amountDecimal,
              currency: event.data.currency,
              reference: event.data.referenceNumber,
            }),
          );
        }
        break;
      }
      case 'mock.wire.inbound': {
        processingMessage = `Inbound wire notification captured for user: ${event.data.userId || 'N/A'}`;
        voidEmail(
          'provider-wire-inbound-staff',
          defaultEmailService.sendProviderWireInboundStaffEmail({
            reference: event.data.referenceNumber,
            amount: event.data.amountDecimal,
            currency: event.data.currency,
          }),
        );
        const wireUser = event.data.userId
          ? defaultAuthService.getUserById(event.data.userId)
          : undefined;
        if (wireUser?.email) {
          voidEmail(
            'provider-wire-inbound',
            defaultEmailService.sendProviderWireInboundEmail({
              to: wireUser.email,
              fullName: wireUser.fullName,
              amount: event.data.amountDecimal,
              currency: event.data.currency,
              reference: event.data.referenceNumber,
            }),
          );
        }
        break;
      }
      case 'mock.compliance.flag': {
        processingMessage = `Simulated risk flag recorded for evaluation: ${event.data.reason || 'None'}`;
        voidEmail(
          'compliance-flag',
          defaultEmailService.sendComplianceFlagEmail({
            flagType: event.eventType,
            reference: event.data.referenceNumber || event.data.providerTxId,
            detail: event.data.reason,
          }),
        );
        break;
      }
      case 'mock.health.ping':
        processingMessage = 'Provider webhook heartbeat successfully acknowledged.';
        break;
      default:
        processingMessage = `Unrecognized mock event type: ${event.eventType}. No action taken.`;
    }

    const record: WebhookEventRecord = {
      id: `whevt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventId: event.eventId,
      eventType: event.eventType,
      payloadHash,
      signatureHeader: signatureHeader.split(',')[0] || 't=[REDACTED]', // Never store full signature
      status: 'PROCESSED',
      processingLog: processingMessage,
      receivedAt: new Date(),
      processedAt: new Date(),
    };

    this.eventStore.set(event.eventId, record);

    return {
      status: 'PROCESSED',
      message: processingMessage,
      recordId: record.id,
    };
  }

  public getRecentEvents(limit = 20): WebhookEventRecord[] {
    return Array.from(this.eventStore.values())
      .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
      .slice(0, limit);
  }
}

export const defaultWebhookService = new WebhookService();
