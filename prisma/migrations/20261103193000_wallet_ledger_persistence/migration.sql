-- Durable wallet operations + pending funding queues

CREATE TABLE IF NOT EXISTS "wallet_operations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_operations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "wallet_operations_userId_idx" ON "wallet_operations"("userId");
CREATE INDEX IF NOT EXISTS "wallet_operations_status_idx" ON "wallet_operations"("status");
CREATE INDEX IF NOT EXISTS "wallet_operations_createdAt_idx" ON "wallet_operations"("createdAt");

ALTER TABLE "wallet_operations"
  ADD CONSTRAINT "wallet_operations_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "pending_deposits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "currency" VARCHAR(6) NOT NULL,
    "amountDecimal" TEXT NOT NULL,
    "amountMinor" TEXT NOT NULL,
    "formattedAmount" TEXT NOT NULL,
    "sourceRail" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "storageRef" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewNotes" TEXT,
    "status" TEXT NOT NULL,
    "holdJournalEntryId" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "releaseJournalEntryId" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "initiatedByUserId" TEXT,
    "initiationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_deposits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pending_deposits_referenceNumber_key" ON "pending_deposits"("referenceNumber");
CREATE INDEX IF NOT EXISTS "pending_deposits_userId_idx" ON "pending_deposits"("userId");
CREATE INDEX IF NOT EXISTS "pending_deposits_status_idx" ON "pending_deposits"("status");
CREATE INDEX IF NOT EXISTS "pending_deposits_submittedAt_idx" ON "pending_deposits"("submittedAt");

ALTER TABLE "pending_deposits"
  ADD CONSTRAINT "pending_deposits_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "pending_withdrawals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "currency" VARCHAR(6) NOT NULL,
    "amountDecimal" TEXT NOT NULL,
    "amountMinor" TEXT NOT NULL,
    "formattedAmount" TEXT NOT NULL,
    "destinationRail" TEXT,
    "bankingDetails" TEXT NOT NULL DEFAULT '{}',
    "btcAddress" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewNotes" TEXT,
    "status" TEXT NOT NULL,
    "holdJournalEntryId" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "releaseJournalEntryId" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "initiatedByUserId" TEXT,
    "initiationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_withdrawals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pending_withdrawals_referenceNumber_key" ON "pending_withdrawals"("referenceNumber");
CREATE INDEX IF NOT EXISTS "pending_withdrawals_userId_idx" ON "pending_withdrawals"("userId");
CREATE INDEX IF NOT EXISTS "pending_withdrawals_status_idx" ON "pending_withdrawals"("status");
CREATE INDEX IF NOT EXISTS "pending_withdrawals_submittedAt_idx" ON "pending_withdrawals"("submittedAt");

ALTER TABLE "pending_withdrawals"
  ADD CONSTRAINT "pending_withdrawals_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
