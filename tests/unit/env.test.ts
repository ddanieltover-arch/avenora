/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Environment Configuration Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { getValidatedConfig, getSafePublicConfig } from '../../src/config/env.config.ts';

describe('Environment Configuration & Security Isolation', () => {
  it('parses valid safe default environment without errors', () => {
    const config = getValidatedConfig({
      NODE_ENV: 'test',
      PORT: '3000',
      APP_URL: 'http://localhost:3000',
      PROTOTYPE_MODE: 'true',
      ENABLE_LIVE_SETTLEMENT: 'false',
    });

    expect(config.NODE_ENV).toBe('test');
    expect(config.PORT).toBe(3000);
    expect(config.PROTOTYPE_MODE).toBe(true);
    expect(config.ENABLE_LIVE_SETTLEMENT).toBe(false);
  });

  it('triggers fatal security error if live settlement is enabled in prototype mode', () => {
    expect(() =>
      getValidatedConfig({
        NODE_ENV: 'test',
        PROTOTYPE_MODE: 'true',
        ENABLE_LIVE_SETTLEMENT: 'true', // Invariant breach!
      })
    ).toThrow(/SECURITY VIOLATION/);
  });

  it('safely strips secrets and connection strings in public config presentation', () => {
    const config = getValidatedConfig({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://admin:super_secret_password@postgres.internal:5432/db',
      APP_SECRET: 'super_secret_32_byte_key_string_example',
    });

    const publicConfig = getSafePublicConfig(config);
    expect((publicConfig as Record<string, unknown>).DATABASE_URL).toBeUndefined();
    expect((publicConfig as Record<string, unknown>).APP_SECRET).toBeUndefined();
    expect(publicConfig.prototypeMode).toBe(true);
    expect(publicConfig.databaseConfigured).toBe(true);
  });

  it('prohibits activating production solely by toggling PROTOTYPE_MODE without certified audit sign-off', () => {
    expect(() =>
      getValidatedConfig({
        NODE_ENV: 'production',
        PROTOTYPE_MODE: 'false', // Attempting to turn off prototype mode
        ENABLE_LIVE_SETTLEMENT: 'false',
      })
    ).toThrow(/SECURITY VIOLATION: Production mode cannot be activated solely by toggling PROTOTYPE_MODE/);

    // With certified sign-off, validation passes
    const config = getValidatedConfig({
      NODE_ENV: 'production',
      PROTOTYPE_MODE: 'false',
      ENABLE_LIVE_SETTLEMENT: 'false',
      PRODUCTION_INTEGRATION_AUDIT_PASSED: 'AUDIT_VERIFIED_SIGN_OFF_2026',
    });
    expect(config.PROTOTYPE_MODE).toBe(false);
  });
});
