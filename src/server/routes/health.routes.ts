/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Health & Readiness HTTP Routes
 */

import { Router, Request, Response } from 'express';
import { HealthService } from '../services/health.service.ts';

export const healthRouter = Router();

/**
 * GET /api/v1/health
 * Liveness probe: verifies server process is actively responding.
 */
healthRouter.get('/health', (_req: Request, res: Response) => {
  const health = HealthService.getLiveness();
  res.status(200).json(health);
});

/**
 * GET /api/v1/ready
 * Readiness probe: verifies subsystem readiness without exposing credentials.
 */
healthRouter.get('/ready', (_req: Request, res: Response) => {
  const readiness = HealthService.getReadiness();
  res.status(200).json(readiness);
});
