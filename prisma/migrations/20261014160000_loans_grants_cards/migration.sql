-- Avenora Phase 03 Migration: Loans, Verified Grants & Card Services
-- Target Engine: PostgreSQL 14+ (Compatible with Neon Serverless Postgres)
-- Description: Adds Loan Applications, Assessments, Grant Programs, Grant Applications,
--              Grant Awards, Payment Cards, Card State Events, and Card Authorizations.

-- Enums
CREATE TYPE "LoanApplicationType" AS ENUM ('PERSONAL', 'SMALL_BUSINESS');
CREATE TYPE "LoanApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_MORE_INFORMATION', 'APPROVED_FOR_DEMO', 'DECLINED_FOR_DEMO', 'CANCELLED');
CREATE TYPE "LoanRiskCategory" AS ENUM ('LOW_RISK_DEMO', 'MODERATE_RISK_DEMO', 'ELEVATED_RISK_DEMO');
CREATE TYPE "LoanRecommendation" AS ENUM ('RECOMMEND_DEMO_APPROVAL', 'REQUIRES_MANUAL_REVIEW', 'DECLINE_DEMO');

CREATE TYPE "GrantProgramStatus" AS ENUM ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED');
CREATE TYPE "GrantApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_MORE_INFORMATION', 'ELIGIBLE_FOR_REVIEW', 'INELIGIBLE', 'APPROVED_FOR_DEMO', 'DECLINED', 'CANCELLED');
CREATE TYPE "DisbursementStatus" AS ENUM ('PENDING_SIMULATION', 'DISBURSED_SIMULATED', 'FAILED');

CREATE TYPE "CardType" AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE "CardForm" AS ENUM ('VIRTUAL', 'PHYSICAL');
CREATE TYPE "CardStatus" AS ENUM ('REQUESTED', 'PENDING_REVIEW', 'APPROVED_FOR_DEMO', 'ACTIVE_SIMULATED', 'FROZEN', 'TERMINATED', 'EXPIRED');
CREATE TYPE "HoldStatus" AS ENUM ('PENDING_HOLD', 'SETTLED_SIMULATED', 'REVERSED', 'EXPIRED_RELEASED');

-- Add new AuditAction values for Phase 03
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'LOAN_APPLICATION_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'LOAN_APPLICATION_REVIEWED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'GRANT_PROGRAM_VERIFIED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'GRANT_APPLICATION_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'GRANT_AWARD_DISBURSED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CARD_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CARD_STATUS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CARD_HOLD_AUTHORIZED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CARD_HOLD_RELEASED';

-- Loan Applications Table
CREATE TABLE "loan_applications" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" "LoanApplicationType" NOT NULL DEFAULT 'PERSONAL',
  "currency" VARCHAR(6) NOT NULL,
  "requestedAmountMinor" BIGINT NOT NULL,
  "termMonths" INTEGER NOT NULL,
  "purpose" TEXT NOT NULL,
  "applicantIncomeAnnualMinor" BIGINT NOT NULL,
  "applicantExpensesMonthlyMinor" BIGINT NOT NULL,
  "businessName" TEXT,
  "businessRevenueAnnualMinor" BIGINT,
  "status" "LoanApplicationStatus" NOT NULL DEFAULT 'DRAFT',
  "consentAcknowledged" BOOLEAN NOT NULL DEFAULT false,
  "reviewerUserId" TEXT,
  "reviewerNotes" TEXT,
  "reasonCode" TEXT,
  "reviewHistory" TEXT NOT NULL DEFAULT '[]',
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "loan_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "loan_applications_userId_idx" ON "loan_applications"("userId");
CREATE INDEX "loan_applications_status_idx" ON "loan_applications"("status");

-- Synthetic Loan Risk Assessments Table
CREATE TABLE "loan_assessments" (
  "id" TEXT PRIMARY KEY,
  "applicationId" TEXT NOT NULL UNIQUE,
  "riskCategory" "LoanRiskCategory" NOT NULL,
  "recommendation" "LoanRecommendation" NOT NULL,
  "syntheticScore" INTEGER NOT NULL,
  "debtToIncomeRatio" TEXT NOT NULL,
  "rulesetVersion" TEXT NOT NULL DEFAULT 'v1.2.0-demo',
  "factorsExplanation" TEXT NOT NULL DEFAULT '[]',
  "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "loan_assessments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Grant Programs Catalog Table
CREATE TABLE "grant_programs" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "organizationName" TEXT NOT NULL,
  "fundingSourceRef" TEXT NOT NULL,
  "verificationStatus" "GrantProgramStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "eligibleCountries" TEXT NOT NULL DEFAULT '["US"]',
  "fundingMinMinor" BIGINT NOT NULL,
  "fundingMaxMinor" BIGINT NOT NULL,
  "currency" VARCHAR(6) NOT NULL,
  "openingDate" TIMESTAMP(3) NOT NULL,
  "closingDate" TIMESTAMP(3) NOT NULL,
  "eligibilityCriteria" TEXT NOT NULL DEFAULT '[]',
  "verifiedByUserId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "grant_programs_verificationStatus_idx" ON "grant_programs"("verificationStatus");

-- Grant Applications Table
CREATE TABLE "grant_applications" (
  "id" TEXT PRIMARY KEY,
  "programId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectTitle" TEXT NOT NULL,
  "projectSummary" TEXT NOT NULL,
  "requestedAmountMinor" BIGINT NOT NULL,
  "currency" VARCHAR(6) NOT NULL,
  "status" "GrantApplicationStatus" NOT NULL DEFAULT 'DRAFT',
  "eligibilityAnswers" TEXT NOT NULL DEFAULT '{}',
  "documentRefs" TEXT NOT NULL DEFAULT '[]',
  "reviewerUserId" TEXT,
  "reviewerNotes" TEXT,
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "grant_applications_programId_fkey" FOREIGN KEY ("programId") REFERENCES "grant_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "grant_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "grant_applications_programId_idx" ON "grant_applications"("programId");
CREATE INDEX "grant_applications_userId_idx" ON "grant_applications"("userId");
CREATE INDEX "grant_applications_status_idx" ON "grant_applications"("status");

-- Grant Awards & Simulated Disbursements Table
CREATE TABLE "grant_awards" (
  "id" TEXT PRIMARY KEY,
  "applicationId" TEXT NOT NULL UNIQUE,
  "awardedAmountMinor" BIGINT NOT NULL,
  "currency" VARCHAR(6) NOT NULL,
  "reconciliationRef" TEXT NOT NULL UNIQUE,
  "approvedByUserId" TEXT NOT NULL,
  "disbursementStatus" "DisbursementStatus" NOT NULL DEFAULT 'PENDING_SIMULATION',
  "disbursedAt" TIMESTAMP(3),
  "idempotencyKey" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "grant_awards_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "grant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Payment Cards Table
CREATE TABLE "payment_cards" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "walletAccountId" TEXT NOT NULL,
  "type" "CardType" NOT NULL DEFAULT 'DEBIT',
  "form" "CardForm" NOT NULL DEFAULT 'VIRTUAL',
  "status" "CardStatus" NOT NULL DEFAULT 'ACTIVE_SIMULATED',
  "currency" VARCHAR(6) NOT NULL,
  "maskedPan" TEXT NOT NULL,
  "syntheticCardholderName" TEXT NOT NULL,
  "syntheticExpiry" TEXT NOT NULL,
  "dailySpendLimitMinor" BIGINT NOT NULL DEFAULT 100000,
  "singleTxLimitMinor" BIGINT NOT NULL DEFAULT 50000,
  "providerRef" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "payment_cards_walletAccountId_fkey" FOREIGN KEY ("walletAccountId") REFERENCES "wallet_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "payment_cards_userId_idx" ON "payment_cards"("userId");
CREATE INDEX "payment_cards_status_idx" ON "payment_cards"("status");

-- Card State Audit Events Table
CREATE TABLE "card_state_events" (
  "id" TEXT PRIMARY KEY,
  "cardId" TEXT NOT NULL,
  "previousStatus" "CardStatus" NOT NULL,
  "newStatus" "CardStatus" NOT NULL,
  "reason" TEXT,
  "actorUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "card_state_events_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "payment_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "card_state_events_cardId_idx" ON "card_state_events"("cardId");

-- Card Authorizations & Simulated Holds Table
CREATE TABLE "card_authorizations" (
  "id" TEXT PRIMARY KEY,
  "cardId" TEXT NOT NULL,
  "merchantName" TEXT NOT NULL,
  "mcc" VARCHAR(4) NOT NULL DEFAULT '5411',
  "currency" VARCHAR(6) NOT NULL,
  "amountMinor" BIGINT NOT NULL,
  "holdStatus" "HoldStatus" NOT NULL DEFAULT 'PENDING_HOLD',
  "authCode" TEXT NOT NULL,
  "ledgerJournalEntryId" TEXT,
  "reversalJournalEntryId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "card_authorizations_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "payment_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "card_authorizations_cardId_idx" ON "card_authorizations"("cardId");
CREATE INDEX "card_authorizations_holdStatus_idx" ON "card_authorizations"("holdStatus");
