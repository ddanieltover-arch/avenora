-- Avenora Phase 05 Migration: Secure Admin & Operations Control Center
-- Target Engine: PostgreSQL 14+ (Compatible with Neon Serverless Postgres)
-- Description: Adds Phase 05 AuditAction enum values, enhanced audit log state tracking,
--              administrative reason codes, and operational control indexes.

-- Add new AuditAction values for Phase 05
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'USER_STATUS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'USER_ROLE_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TRANSACTION_REVERSED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADMIN_ACCESS_DENIED';

-- Add enhanced audit tracking columns
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "previousState" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "newState" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "correlationId" TEXT;

-- Create administrative indexing for operational queries
CREATE INDEX IF NOT EXISTS "audit_logs_actorRole_idx" ON "audit_logs"("actorRole");
CREATE INDEX IF NOT EXISTS "audit_logs_resourceType_idx" ON "audit_logs"("resourceType");
