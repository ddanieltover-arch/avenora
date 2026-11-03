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

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__avenoraPrisma = prisma;
}
