-- CreateEnum
CREATE TYPE "DomesticAccountGenerationStatus" AS ENUM ('NOT_ELIGIBLE', 'PENDING_GENERATION', 'GENERATED', 'GENERATION_FAILED', 'FORMAT_NOT_IMPLEMENTED', 'COUNTRY_MISMATCH_REQUIRES_REVIEW');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'DOMESTIC_ACCOUNT_GENERATED';

-- CreateTable
CREATE TABLE "customer_domestic_bank_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verifiedCountryCode" VARCHAR(2) NOT NULL,
    "schemeId" VARCHAR(64) NOT NULL,
    "generationStatus" "DomesticAccountGenerationStatus" NOT NULL DEFAULT 'NOT_ELIGIBLE',
    "identifierType" VARCHAR(32) NOT NULL DEFAULT 'BANK_ACCOUNT',
    "formattedValue" TEXT,
    "rawValue" TEXT,
    "maskedValue" TEXT,
    "componentsJson" TEXT NOT NULL DEFAULT '{}',
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,
    "generationSource" VARCHAR(32) NOT NULL DEFAULT 'SYNTHETIC_GENERATOR',
    "disclaimer" TEXT NOT NULL,
    "formatVersion" VARCHAR(16) NOT NULL DEFAULT '1.0.0',
    "ruleSourceVersion" VARCHAR(32) NOT NULL,
    "kycProfileId" TEXT,
    "kycApprovalReference" TEXT,
    "generatedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_domestic_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_domestic_bank_accounts_userId_key" ON "customer_domestic_bank_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_domestic_bank_accounts_rawValue_key" ON "customer_domestic_bank_accounts"("rawValue");

-- CreateIndex
CREATE INDEX "customer_domestic_bank_accounts_verifiedCountryCode_idx" ON "customer_domestic_bank_accounts"("verifiedCountryCode");

-- CreateIndex
CREATE INDEX "customer_domestic_bank_accounts_generationStatus_idx" ON "customer_domestic_bank_accounts"("generationStatus");

-- AddForeignKey
ALTER TABLE "customer_domestic_bank_accounts" ADD CONSTRAINT "customer_domestic_bank_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
