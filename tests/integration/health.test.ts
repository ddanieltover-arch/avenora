/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Health & Readiness Integration Tests
 */

import { describe, it, expect } from 'vitest';
import { HealthService } from '../../src/server/services/health.service.ts';

describe('Health & Readiness Subsystem Diagnostics', () => {
  it('returns valid liveness payload with node runtime and prototype safety flags', () => {
    const liveness = HealthService.getLiveness();

    expect(liveness.status).toBe('healthy');
    expect(liveness.service).toBe('Avenora');
    expect(liveness.checks.environment.prototypeMode).toBe(true);
    expect(liveness.checks.environment.liveMoneyMovementBlocked).toBe(true);
    expect(liveness.checks.runtime.nodeVersion).toBeDefined();
    expect(liveness.checks.runtime.memoryMb).toBeGreaterThan(0);
  });

  it('returns readiness payload without leaking database credentials or hostnames', () => {
    const readiness = HealthService.getReadiness();

    expect(readiness.status).toBe('ready');
    expect(readiness.subsystems.ledgerEngine.status).toBe('ready');
    expect(readiness.subsystems.database.provider).toBe('postgresql_neon');

    const jsonStr = JSON.stringify(readiness);
    expect(jsonStr).not.toContain('password');
    expect(jsonStr).not.toContain('postgresql://');
  });
});
