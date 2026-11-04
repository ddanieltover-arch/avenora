/**
 * @license Apache-2.0
 * Avenora — Prisma client singleton (Neon PostgreSQL)
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { __avenoraPrisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.__avenoraPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Reuse across hot reload and serverless isolates.
globalForPrisma.__avenoraPrisma = prisma;

/** Guard against stale/partial Prisma Client builds on serverless (missing model delegates). */
export function prismaDelegate<T>(name: string, delegate: T | undefined | null): T {
  if (!delegate || typeof (delegate as { findMany?: unknown }).findMany !== 'function') {
    const available = Object.keys(prisma as object)
      .filter((k) => !k.startsWith('$') && !k.startsWith('_'))
      .sort()
      .join(',');
    throw new Error(
      `Prisma delegate "${name}" is unavailable (stale generated client). Available: [${available}]. Run prisma generate and redeploy.`,
    );
  }
  return delegate;
}
