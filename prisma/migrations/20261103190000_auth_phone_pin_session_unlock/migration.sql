-- Persist registration fields used by AuthService + session PIN unlock flag

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "transactionPinHash" TEXT NOT NULL DEFAULT '';

ALTER TABLE "sessions"
  ADD COLUMN IF NOT EXISTS "transactionPinUnlocked" BOOLEAN NOT NULL DEFAULT false;
