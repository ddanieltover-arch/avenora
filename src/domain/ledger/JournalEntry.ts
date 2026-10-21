/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Immutable Double-Entry Journal Entry Model
 */

import { Money } from '../money/Money.ts';

export type LedgerEntryDirection = 'DEBIT' | 'CREDIT';

export interface LedgerLineInput {
  accountId: string;
  direction: LedgerEntryDirection;
  amountMinor: bigint;
  description?: string;
}

export interface JournalEntryRecord {
  id: string;
  transactionId: string;
  entrySequence: number;
  currency: string;
  narration: string;
  postedAt: Date;
  lines: LedgerLineInput[];
}

export interface AccountBalanceSummary {
  accountId: string;
  currency: string;
  totalDebitsMinor: bigint;
  totalCreditsMinor: bigint;
  netBalanceMinor: bigint;
}
