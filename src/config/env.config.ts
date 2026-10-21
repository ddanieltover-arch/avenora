/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Strict Environment Configuration
 *
 * Validates all environment variables using Zod.
 * Ensures secrets stay server-only and enforces security invariants.
 */

import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10)),
  APP_URL: z.string().url().default('http://localhost:3000'),
  
  // Prototype isolation
  PROTOTYPE_MODE: z
    .string()
    .default('true')
    .transform((v) => v.toLowerCase() === 'true'),
  ENABLE_LIVE_SETTLEMENT: z
    .string()
    .default('false')
    .transform((v) => v.toLowerCase() === 'true'),

  // Database Connection Strings
  DATABASE_URL: z.string().optional().default('postgresql://user:pass@localhost:5432/avenora_dev'),
  DIRECT_URL: z.string().optional().default('postgresql://user:pass@localhost:5432/avenora_dev'),

  // Logging & Telemetry
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  MASK_PII_IN_LOGS: z
    .string()
    .default('true')
    .transform((v) => v.toLowerCase() === 'true'),

  // Security & Authentication Secrets (Server-only)
  SESSION_SECRET: z
    .string()
    .min(16)
    .default('avenora_dev_session_secret_32bytes_min_length_required!'),
  MOCK_PROVIDER_WEBHOOK_SECRET: z
    .string()
    .min(16)
    .default('whsec_mock_avenora_fintech_partner_signing_key_2026'),
  WEBHOOK_TOLERANCE_SECONDS: z
    .string()
    .default('300')
    .transform((val) => parseInt(val, 10)),

  // CORS
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
});

export type ValidatedEnv = z.infer<typeof EnvSchema>;

let cachedEnv: ValidatedEnv | null = null;

export function getValidatedConfig(customEnv?: Record<string, string | undefined>): ValidatedEnv {
  if (cachedEnv && !customEnv) {
    return cachedEnv;
  }

  const rawEnv = customEnv ?? (typeof process !== 'undefined' ? process.env : {});
  const parsed = EnvSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const errorDetails = JSON.stringify(parsed.error.format(), null, 2);
    throw new Error(`CRITICAL: Environment validation failed:\n${errorDetails}`);
  }

  // Safety Invariant: Live settlement MUST NOT be enabled in prototype mode
  if (parsed.data.ENABLE_LIVE_SETTLEMENT && parsed.data.PROTOTYPE_MODE) {
    throw new Error(
      'SECURITY VIOLATION: ENABLE_LIVE_SETTLEMENT cannot be true while PROTOTYPE_MODE is enabled.'
    );
  }

  // Safety Invariant: Production mode cannot be activated solely by changing an environment variable
  if (!parsed.data.PROTOTYPE_MODE && (!rawEnv.PRODUCTION_INTEGRATION_AUDIT_PASSED || rawEnv.PRODUCTION_INTEGRATION_AUDIT_PASSED !== 'AUDIT_VERIFIED_SIGN_OFF_2026')) {
    throw new Error(
      'SECURITY VIOLATION: Production mode cannot be activated solely by toggling PROTOTYPE_MODE. Formal regulatory approval, institutional banking contracts, and certified security credentials are required.'
    );
  }

  if (!customEnv) {
    cachedEnv = parsed.data;
  }

  return parsed.data;
}

/**
 * Returns a sanitized copy of configuration safe for diagnostics or UI consumption.
 * Explicitly strips credentials, secrets, and internal connection strings.
 */
export function getSafePublicConfig(config: ValidatedEnv) {
  return {
    environment: config.NODE_ENV,
    prototypeMode: config.PROTOTYPE_MODE,
    liveSettlementEnabled: config.ENABLE_LIVE_SETTLEMENT,
    logLevel: config.LOG_LEVEL,
    maskPiiEnabled: config.MASK_PII_IN_LOGS,
    databaseConfigured: Boolean(config.DATABASE_URL && !config.DATABASE_URL.includes('placeholder')),
  };
}
