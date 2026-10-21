/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Double-Entry Ledger Invariant Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  verifyDoubleEntryInvariant,
  assertDoubleEntryInvariant,
  LedgerInvariantError,
} from '../../src/domain/ledger/LedgerInvariant.ts';
import { LedgerLineInput } from '../../src/domain/ledger/JournalEntry.ts';

describe('Double-Entry Ledger Invariant Engine', () => {
  it('accepts perfectly balanced journal entries (Sum(Debits) === Sum(Credits))', () => {
    const lines: LedgerLineInput[] = [
      { accountId: 'acc_1', direction: 'DEBIT', amountMinor: 5000n },
      { accountId: 'acc_2', direction: 'CREDIT', amountMinor: 5000n },
    ];

    const result = verifyDoubleEntryInvariant(lines);
    expect(result.isValid).toBe(true);
    expect(result.imbalanceMinor).toBe(0n);
    expect(() => assertDoubleEntryInvariant(lines)).not.toThrow();
  });

  it('rejects unbalanced journal entries and calculates exact imbalance', () => {
    const lines: LedgerLineInput[] = [
      { accountId: 'acc_1', direction: 'DEBIT', amountMinor: 10000n },
      { accountId: 'acc_2', direction: 'CREDIT', amountMinor: 9999n }, // Missing 1 cent
    ];

    const result = verifyDoubleEntryInvariant(lines);
    expect(result.isValid).toBe(false);
    expect(result.imbalanceMinor).toBe(1n);
    expect(() => assertDoubleEntryInvariant(lines)).toThrow(LedgerInvariantError);
  });

  it('rejects entries with non-positive line amounts', () => {
    const lines: LedgerLineInput[] = [
      { accountId: 'acc_1', direction: 'DEBIT', amountMinor: 0n },
      { accountId: 'acc_2', direction: 'CREDIT', amountMinor: 0n },
    ];

    const result = verifyDoubleEntryInvariant(lines);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('non-positive');
  });

  it('rejects entries with fewer than two lines', () => {
    const lines: LedgerLineInput[] = [
      { accountId: 'acc_1', direction: 'DEBIT', amountMinor: 100n },
    ];

    const result = verifyDoubleEntryInvariant(lines);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('at least two lines');
  });

  it('supports multi-leg compound journal entries (e.g. fee split)', () => {
    // Customer sends $100. $98 goes to beneficiary, $2 fee to revenue
    const lines: LedgerLineInput[] = [
      { accountId: 'acc_sender_liability', direction: 'DEBIT', amountMinor: 10000n },
      { accountId: 'acc_receiver_liability', direction: 'CREDIT', amountMinor: 9800n },
      { accountId: 'acc_fee_revenue', direction: 'CREDIT', amountMinor: 200n },
    ];

    const result = verifyDoubleEntryInvariant(lines);
    expect(result.isValid).toBe(true);
    expect(result.totalDebitMinor).toBe(10000n);
    expect(result.totalCreditMinor).toBe(10000n);
  });
});
