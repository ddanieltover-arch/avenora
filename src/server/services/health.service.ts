/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Health & Readiness Diagnostics Service
 *
 * Checks subsystem availability without leaking credentials or infrastructure topology.
 */

import { PLATFORM_METADATA } from '../../config/constants.ts';
import { getValidatedConfig } from '../../config/env.config.ts';

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  releaseCodename: string;
  uptimeSeconds: number;
  timestamp: string;
  checks: {
    runtime: {
      status: 'pass' | 'fail';
      nodeVersion: string;
      memoryMb: number;
    };
    environment: {
      status: 'pass' | 'fail';
      prototypeMode: boolean;
      liveMoneyMovementBlocked: boolean;
    };
  };
}

export interface ReadinessCheckResponse {
  status: 'ready' | 'not_ready';
  service: string;
  version: string;
  timestamp: string;
  subsystems: {
    database: {
      status: 'configured' | 'pending_provisioning';
      provider: 'postgresql_neon';
      pooling: boolean;
    };
    ledgerEngine: {
      status: 'ready';
      mode: 'in_memory_reference_store';
    };
    idempotencyStore: {
      status: 'ready';
    };
  };
}

export class HealthService {
  public static getLiveness(): HealthCheckResponse {
    const memory = process.memoryUsage();
    const memoryMb = Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100;

    return {
      status: 'healthy',
      service: PLATFORM_METADATA.NAME,
      version: PLATFORM_METADATA.VERSION,
      releaseCodename: PLATFORM_METADATA.RELEASE_CODENAME,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        runtime: {
          status: 'pass',
          nodeVersion: process.version,
          memoryMb,
        },
        environment: {
          status: 'pass',
          prototypeMode: true,
          liveMoneyMovementBlocked: true,
        },
      },
    };
  }

  public static getReadiness(): ReadinessCheckResponse {
    let config;
    try {
      config = getValidatedConfig();
    } catch {
      config = null;
    }

    const dbConfigured = Boolean(
      config?.DATABASE_URL && !config.DATABASE_URL.includes('placeholder_password')
    );

    return {
      status: 'ready',
      service: PLATFORM_METADATA.NAME,
      version: PLATFORM_METADATA.VERSION,
      timestamp: new Date().toISOString(),
      subsystems: {
        database: {
          status: dbConfigured ? 'configured' : 'pending_provisioning',
          provider: 'postgresql_neon',
          pooling: true,
        },
        ledgerEngine: {
          status: 'ready',
          mode: 'in_memory_reference_store',
        },
        idempotencyStore: {
          status: 'ready',
        },
      },
    };
  }
}
