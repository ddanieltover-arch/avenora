/**
 * @license Apache-2.0
 * Avenora Fintech Platform — System Status & Country-Aware Identifiers API
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PLATFORM_METADATA } from '../../config/constants.ts';
import { SUPPORTED_CURRENCIES } from '../../domain/money/Currency.ts';
import { getSafePublicConfig, getValidatedConfig } from '../../config/env.config.ts';
import { defaultIdentifierProvider } from '../services/identifier.service.ts';
import {
  SUPPORTED_COUNTRIES,
  SUPPORTED_IDENTIFIER_TYPES,
} from '../../domain/country/CountryRules.ts';
import { SupportedCountryCode, IdentifierType } from '../../domain/country/CountryTypes.ts';
import {
  COUNTRY_PROVIDER_CAPABILITY_MATRIX,
  PROVIDER_INTEGRATION_PREREQUISITES,
} from '../../domain/country/ProviderCapabilityMatrix.ts';
import {
  EMAIL_TEMPLATE_IDS,
  PLANNED_EMAIL_TEMPLATE_IDS,
  renderEmailPreview,
} from '../emails/catalog.ts';

export const systemRouter = Router();

function isEmailPreviewAllowed(): boolean {
  const config = getValidatedConfig();
  return config.NODE_ENV !== 'production' || config.PROTOTYPE_MODE === true;
}

const GenerateIdentifierSchema = z.object({
  countryCode: z.enum(['US', 'GB', 'ES', 'DE', 'BR'] as [SupportedCountryCode, ...SupportedCountryCode[]]),
  type: z.enum([
    'BANK_ACCOUNT',
    'IBAN',
    'SORT_CODE',
    'TAX_ID',
    'PAYMENT_CARD',
    'PIX_KEY',
  ] as [IdentifierType, ...IdentifierType[]]),
  accountHolderName: z.string().optional(),
  currency: z.string().optional(),
});

const ValidateIdentifierSchema = z.object({
  countryCode: z.enum(['US', 'GB', 'ES', 'DE', 'BR'] as [SupportedCountryCode, ...SupportedCountryCode[]]),
  type: z.enum([
    'BANK_ACCOUNT',
    'IBAN',
    'SORT_CODE',
    'TAX_ID',
    'PAYMENT_CARD',
    'PIX_KEY',
  ] as [IdentifierType, ...IdentifierType[]]),
  value: z.string().min(1, 'Value is required'),
});

/**
 * GET /api/v1/system/email-preview
 * Lists available (implemented) and planned email template IDs.
 * Gated to non-production or prototype mode.
 */
systemRouter.get('/email-preview', (_req: Request, res: Response) => {
  if (!isEmailPreviewAllowed()) {
    res.status(404).json({
      type: 'https://avenora.com/errors/not-found',
      title: 'Not Found',
      status: 404,
      detail: 'Email preview is unavailable in this environment.',
    });
    return;
  }

  res.json({
    available: EMAIL_TEMPLATE_IDS,
    planned: PLANNED_EMAIL_TEMPLATE_IDS,
    previewPath: '/api/v1/system/email-preview/:id',
  });
});

/**
 * GET /api/v1/system/email-preview/:id
 * Returns full HTML for a sample transactional email (design review).
 * Gated to non-production or prototype mode.
 */
systemRouter.get('/email-preview/:id', (req: Request, res: Response) => {
  if (!isEmailPreviewAllowed()) {
    res.status(404).json({
      type: 'https://avenora.com/errors/not-found',
      title: 'Not Found',
      status: 404,
      detail: 'Email preview is unavailable in this environment.',
    });
    return;
  }

  const id = String(req.params.id || '').trim().toLowerCase();
  const payload = renderEmailPreview(id);
  if (!payload) {
    res.status(404).json({
      type: 'https://avenora.com/errors/not-found',
      title: 'Email Template Not Found',
      status: 404,
      detail: `No preview is available for template "${id}". Available: ${EMAIL_TEMPLATE_IDS.join(', ')}.`,
      available: EMAIL_TEMPLATE_IDS,
    });
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Avenora-Email-Subject', payload.subject);
  res.send(payload.html);
});

/**
 * GET /api/v1/system/status
 * Returns safe capability flags, prototype mode boundaries, and compliance notices.
 */
systemRouter.get('/status', (_req: Request, res: Response) => {
  const config = getValidatedConfig();
  const safeConfig = getSafePublicConfig(config);

  res.json({
    platform: PLATFORM_METADATA.NAME,
    version: PLATFORM_METADATA.VERSION,
    releaseCodename: PLATFORM_METADATA.RELEASE_CODENAME,
    environment: safeConfig.environment,
    prototypeMode: safeConfig.prototypeMode,
    liveSettlementEnabled: safeConfig.liveSettlementEnabled,
    disclaimers: {
      bankingLicense:
        'Avenora provides digital banking and financial technology services subject to applicable licenses and regulations in your jurisdiction.',
      fundMovement:
        'Product availability, settlement timing, and partner networks vary by region and account type.',
      insurance:
        'Deposit insurance and investor protection schemes depend on your country and product—see your account disclosures.',
    },
    corridors: SUPPORTED_COUNTRIES,
    currencies: Object.values(SUPPORTED_CURRENCIES),
    standards: [
      'Strict Double-Entry Ledger (Sum(Debits) === Sum(Credits))',
      'Zero-Float Monetary Math (BigInt Minor Units)',
      'Immutable Journal Entries & Append-Only Audit Trail',
      'RFC 7807 Problem Details Error Responses',
      'Strict PII Redaction in Logs',
      'Country-Aware Autogenerated Financial Identifiers (US ABA, GB Sort Code, ES/DE IBAN, BR CPF/Pix)',
    ],
  });
});

/**
 * GET /api/v1/system/identifiers/supported-matrix
 * Returns supported country codes and their respective identifier formats.
 */
systemRouter.get('/identifiers/supported-matrix', (_req: Request, res: Response) => {
  res.json({
    supportedCountries: SUPPORTED_COUNTRIES,
    matrix: SUPPORTED_IDENTIFIER_TYPES,
    standards: {
      US: 'Federal Reserve 9-Digit ABA Routing Checksum + SSA Non-Issued Synthetic SSN',
      GB: 'APACS Sort Code 6-Digit + HMRC UTR / NINO + GB IBAN ISO 7064 Mod 97-10',
      ES: 'Banco de España CCC 2-Digit Mod 11 + Spanish DNI Mod 23 + ES IBAN Mod 97-10',
      DE: 'Bundesbank BLZ 8-Digit + Steuer-ID 11-Digit + DE IBAN Mod 97-10',
      BR: 'Receita Federal CPF Dual Check Digits Mod 11 + Banco/Agência/Conta + Pix EVP Key',
      CARDS: 'ISO/IEC 7812 Luhn Checksum + Country/Network Specific BIN Allocation',
    },
    disclaimer: 'Generated identifiers are for account setup and validation within the Avenora platform.',
  });
});

/**
 * POST /api/v1/system/identifiers/generate
 * Generates a country-aware identifier with checksum verification and atomic reservation.
 */
systemRouter.post('/identifiers/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = GenerateIdentifierSchema.parse(req.body);
    const result = await defaultIdentifierProvider.generateIdentifier(validated);
    res.status(201).json({
      status: 'generated',
      identifier: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/system/identifiers/validate
 * Validates a formatted or raw identifier against mathematical country rules.
 */
systemRouter.post('/identifiers/validate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = ValidateIdentifierSchema.parse(req.body);
    const result = defaultIdentifierProvider.validateIdentifier(validated);
    res.json({
      status: result.isValid ? 'valid' : 'invalid',
      result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/system/providers/matrix
 * Returns authoritative country & provider integration readiness matrix,
 * technical adapter statuses, and unconfigured commercial/regulatory prerequisites.
 * Zero secret leakage.
 */
systemRouter.get('/providers/matrix', (_req: Request, res: Response) => {
  const config = getValidatedConfig();
  const safeConfig = getSafePublicConfig(config);

  res.json({
    platform: PLATFORM_METADATA.NAME,
    environment: safeConfig.environment,
    prototypeMode: safeConfig.prototypeMode,
    liveSettlementEnabled: safeConfig.liveSettlementEnabled,
    countries: COUNTRY_PROVIDER_CAPABILITY_MATRIX,
    prerequisites: PROVIDER_INTEGRATION_PREREQUISITES,
    disclaimer: 'Provider integration status reflects regional readiness and partner configuration.',
  });
});

const ProvisionIdentifierSchema = z.object({
  countryCode: z.enum(['US', 'GB', 'ES', 'DE', 'BR'] as [SupportedCountryCode, ...SupportedCountryCode[]]),
  type: z.enum(['BANK_ACCOUNT', 'IBAN', 'PAYMENT_CARD'] as [IdentifierType, ...IdentifierType[]]),
  accountHolderName: z.string().min(2, 'Account holder name is required'),
  currency: z.string().length(3),
  idempotencyKey: z.string().min(4),
});

/**
 * POST /api/v1/system/identifiers/provision
 * Provisions a financial identifier via an authorized banking/card adapter.
 * Explicitly surfaces provider errors; NEVER silently falls back to synthetic generator on failure!
 */
systemRouter.post('/identifiers/provision', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = ProvisionIdentifierSchema.parse(req.body);
    const correlationId = (req.headers['x-correlation-id'] as string) || `corr_prov_${Date.now()}`;

    if (!defaultIdentifierProvider.provisionFromProvider) {
      res.status(501).json({
        type: 'https://avenora.com/errors/not-implemented',
        title: 'Provider Provisioning Unsupported',
        status: 501,
        detail: 'The current identifier provider does not support external adapter provisioning.',
      });
      return;
    }

    const result = await defaultIdentifierProvider.provisionFromProvider({
      countryCode: validated.countryCode,
      type: validated.type,
      accountHolderName: validated.accountHolderName,
      currency: validated.currency,
      idempotencyKey: validated.idempotencyKey,
      correlationId,
    });

    res.status(201).json({
      status: 'provisioned',
      identifier: result,
    });
  } catch (err: any) {
    next(err);
  }
});

