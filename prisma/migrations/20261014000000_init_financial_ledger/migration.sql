-- Avenora Financial Ledger: Initial Migration
-- Target Engine: PostgreSQL 14+ (Compatible with Neon Serverless Postgres)
-- Description: Creates Chart of Accounts, Financial Transactions, Journal Entries,
--              Ledger Entry Lines (with BigInt minor amounts), Idempotency Registry, and Audit Logs.

-- Enums
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
CREATE TYPE "AccountClassification" AS ENUM (
  'SYSTEM_SAFEGUARDING_ASSET',
  'SYSTEM_FEE_REVENUE',
  'SYSTEM_PROVIDER_CLEARING',
  'CUSTOMER_AVAILABLE_BALANCE',
  'CUSTOMER_PENDING_HOLD',
  'CUSTOMER_RESERVED_BALANCE'
);
CREATE TYPE "TransactionStatus" AS ENUM ('DRAFT', 'PENDING', 'POSTED', 'VOIDED', 'REJECTED', 'REVERSED');
CREATE TYPE "LedgerEntryDirection" AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE "AuditAction" AS ENUM ('USER_LOGIN', 'KYC_SUBMITTED', 'LIMIT_OVERRIDE', 'JOURNAL_POSTED', 'ACCOUNT_FROZEN', 'CONFIG_CHANGED');

-- Supported Currencies Catalog
CREATE TABLE "supported_currencies" (
  "code" VARCHAR(6) PRIMARY KEY,
  "name" TEXT NOT NULL,
  "symbol" VARCHAR(5) NOT NULL,
  "minorUnits" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isCrypto" BOOLEAN NOT NULL DEFAULT false,
  "minDepositMinor" BIGINT NOT NULL DEFAULT 100,
  "maxDailyMinor" BIGINT NOT NULL DEFAULT 5000000
);

-- Chart of Accounts
CREATE TABLE "ledger_accounts" (
  "id" TEXT PRIMARY KEY,
  "accountNumber" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "type" "AccountType" NOT NULL,
  "classification" "AccountClassification" NOT NULL,
  "currency" VARCHAR(6) NOT NULL,
  "userId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isFrozen" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ledger_accounts_userId_idx" ON "ledger_accounts"("userId");
CREATE INDEX "ledger_accounts_currency_idx" ON "ledger_accounts"("currency");
CREATE INDEX "ledger_accounts_type_idx" ON "ledger_accounts"("type");

-- Financial Transactions Header
CREATE TABLE "financial_transactions" (
  "id" TEXT PRIMARY KEY,
  "referenceNumber" TEXT NOT NULL UNIQUE,
  "idempotencyKey" TEXT UNIQUE,
  "description" TEXT NOT NULL,
  "status" "TransactionStatus" NOT NULL DEFAULT 'DRAFT',
  "originCountry" VARCHAR(2) NOT NULL,
  "sourceType" TEXT NOT NULL,
  "providerCode" TEXT,
  "providerTxId" TEXT,
  "settledAt" TIMESTAMP(3),
  "postedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "financial_transactions_status_idx" ON "financial_transactions"("status");
CREATE INDEX "financial_transactions_providerTxId_idx" ON "financial_transactions"("providerTxId");

-- Journal Entries
CREATE TABLE "journal_entries" (
  "id" TEXT PRIMARY KEY,
  "transactionId" TEXT NOT NULL,
  "entrySequence" INTEGER NOT NULL,
  "currency" VARCHAR(6) NOT NULL,
  "narration" TEXT NOT NULL,
  "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "journal_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "financial_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "journal_entries_transactionId_entrySequence_key" UNIQUE ("transactionId", "entrySequence")
);

-- Ledger Entry Lines (Debits and Credits)
CREATE TABLE "ledger_entry_lines" (
  "id" TEXT PRIMARY KEY,
  "journalEntryId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "direction" "LedgerEntryDirection" NOT NULL,
  "amountMinor" BIGINT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ledger_entry_lines_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ledger_entry_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ledger_entry_lines_accountId_idx" ON "ledger_entry_lines"("accountId");
CREATE INDEX "ledger_entry_lines_journalEntryId_idx" ON "ledger_entry_lines"("journalEntryId");

-- Idempotency Records
CREATE TABLE "idempotency_records" (
  "key" TEXT PRIMARY KEY,
  "userId" TEXT,
  "endpoint" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "responseCode" INTEGER NOT NULL,
  "responseBody" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "idempotency_records_expiresAt_idx" ON "idempotency_records"("expiresAt");

-- Audit Logs
CREATE TABLE "audit_logs" (
  "id" TEXT PRIMARY KEY,
  "action" "AuditAction" NOT NULL,
  "actorUserId" TEXT,
  "actorRole" TEXT NOT NULL DEFAULT 'SYSTEM',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "details" TEXT,
  "financialTxId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_financialTxId_fkey" FOREIGN KEY ("financialTxId") REFERENCES "financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- Seed Core Baseline Currencies
INSERT INTO "supported_currencies" ("code", "name", "symbol", "minorUnits", "isActive", "isCrypto", "minDepositMinor", "maxDailyMinor")
VALUES
  ('USD', 'United States Dollar', '$', 2, true, false, 100, 5000000),
  ('EUR', 'Euro', '€', 2, true, false, 100, 5000000),
  ('BRL', 'Brazilian Real', 'R$', 2, true, false, 500, 2000000),
  ('BTC', 'Bitcoin', '₿', 8, true, true, 10000, 500000000);
