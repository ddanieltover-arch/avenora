-- Avenora Phase 02 Migration: Customer Identity, Multi-Currency Wallets & Secure Webhooks
-- Target Engine: PostgreSQL 14+ (Compatible with Neon Serverless Postgres)
-- Description: Adds Users, Roles, Sessions, Password Resets, KYC Profiles, Wallets, FX Quotes, and Mock Webhook Events.

-- Enums
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_VERIFICATION');
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_MORE_INFORMATION');

-- Add new AuditAction values
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'USER_REGISTERED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'USER_LOGOUT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MFA_ENROLLED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MFA_VERIFIED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'KYC_REVIEWED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WALLET_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SIMULATED_DEPOSIT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SIMULATED_WITHDRAWAL';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'INTERNAL_TRANSFER';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'FX_CONVERTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WEBHOOK_PROCESSED';

-- Users Table
CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "countryCode" VARCHAR(2) NOT NULL DEFAULT 'US',
  "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "kycStatus" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  "mfaSecret" TEXT,
  "mfaRecoveryCodes" TEXT, -- JSON array of hashed recovery codes
  "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_kycStatus_idx" ON "users"("kycStatus");

-- Durable Sessions Table
CREATE TABLE "sessions" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "isRevoked" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX "sessions_tokenHash_idx" ON "sessions"("tokenHash");
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- Password Reset Tokens Table (Single-use, short-lived)
CREATE TABLE "password_reset_tokens" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "isUsed" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");
CREATE INDEX "password_reset_tokens_tokenHash_idx" ON "password_reset_tokens"("tokenHash");

-- Tiered KYC Profiles & Review History Table
CREATE TABLE "kyc_profiles" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "tier" INTEGER NOT NULL DEFAULT 1,
  "status" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "legalFirstName" TEXT,
  "legalLastName" TEXT,
  "dateOfBirth" TEXT,
  "taxIdType" TEXT,
  "taxIdMasked" TEXT,
  "residentialAddress" TEXT, -- JSON text
  "documentRefs" TEXT NOT NULL DEFAULT '[]', -- JSON array of document references
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewerUserId" TEXT,
  "reviewerNotes" TEXT,
  "rejectionReason" TEXT,
  "reviewHistory" TEXT NOT NULL DEFAULT '[]', -- JSON array of review history items
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kyc_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "kyc_profiles_status_idx" ON "kyc_profiles"("status");

-- Wallets Table
CREATE TABLE "wallets" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "wallets_userId_idx" ON "wallets"("userId");

-- Currency-Specific Wallet Accounts (linking wallets to Chart of Accounts)
CREATE TABLE "wallet_accounts" (
  "id" TEXT PRIMARY KEY,
  "walletId" TEXT NOT NULL,
  "currency" VARCHAR(6) NOT NULL,
  "ledgerAccountId" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_accounts_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "wallet_accounts_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "wallet_accounts_walletId_currency_key" UNIQUE ("walletId", "currency")
);

CREATE INDEX "wallet_accounts_walletId_idx" ON "wallet_accounts"("walletId");
CREATE INDEX "wallet_accounts_currency_idx" ON "wallet_accounts"("currency");

-- Illustrative FX Quotes Table
CREATE TABLE "fx_quotes" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "sourceCurrency" VARCHAR(6) NOT NULL,
  "destinationCurrency" VARCHAR(6) NOT NULL,
  "sourceAmountMinor" BIGINT NOT NULL,
  "destinationAmountMinor" BIGINT NOT NULL,
  "exchangeRate" TEXT NOT NULL,
  "feeMinor" BIGINT NOT NULL DEFAULT 0,
  "rateSource" TEXT NOT NULL DEFAULT 'SIMULATED_REFERENCE_RATE',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "isExecuted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fx_quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "fx_quotes_userId_idx" ON "fx_quotes"("userId");
CREATE INDEX "fx_quotes_expiresAt_idx" ON "fx_quotes"("expiresAt");

-- Secure Mock Webhook Events Registry
CREATE TABLE "mock_webhook_events" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL UNIQUE,
  "eventType" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "signatureHeader" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "processingLog" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3)
);

CREATE INDEX "mock_webhook_events_eventId_idx" ON "mock_webhook_events"("eventId");
CREATE INDEX "mock_webhook_events_eventType_idx" ON "mock_webhook_events"("eventType");
CREATE INDEX "mock_webhook_events_receivedAt_idx" ON "mock_webhook_events"("receivedAt");
