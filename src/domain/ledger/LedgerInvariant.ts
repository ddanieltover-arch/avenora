/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Double-Entry Ledger Invariant Engine
 *
 * Enforces the fundamental accounting equation:
 * Sum(Debits) === Sum(Credits)
 * Every debit must be matched by an equal credit in identical currency.
 */

import { LedgerLineInput } from './JournalEntry.ts';

export interface InvariantVerificationResult {
  isValid: boolean;
  totalDebitMinor: bigint;
  totalCreditMinor: bigint;
  imbalanceMinor: bigint;
  lineCount: number;
  error?: string;
}

export class LedgerInvariantError extends Error {
  constructor(message: string, public readonly details?: InvariantVerificationResult) {
    super(message);
    this.name = 'LedgerInvariantError';
  }
}

/**
 * Validates that an array of entry lines satisfies the double-entry invariant:
 * 1. Has at least 2 lines (at least one debit and one credit).
 * 2. Every line amount > 0.
 * 3. Total Debits strictly equals Total Credits down to the single minor unit (cents/satoshis).
 */
export function verifyDoubleEntryInvariant(lines: readonly LedgerLineInput[]): InvariantVerificationResult {
  if (!lines || lines.length < 2) {
    return {
      isValid: false,
      totalDebitMinor: 0n,
      totalCreditMinor: 0n,
      imbalanceMinor: 0n,
      lineCount: lines ? lines.length : 0,
      error: 'Double-entry journal entry requires at least two lines (minimum one debit and one credit).',
    };
  }

  let totalDebit = 0n;
  let totalCredit = 0n;
  let hasDebit = false;
  let hasCredit = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (line.amountMinor <= 0n) {
      return {
        isValid: false,
        totalDebitMinor: totalDebit,
        totalCreditMinor: totalCredit,
        imbalanceMinor: totalDebit - totalCredit,
        lineCount: lines.length,
        error: `Line ${i + 1} has non-positive amount (${line.amountMinor}). All ledger lines must be strictly positive.`,
      };
    }

    if (line.direction === 'DEBIT') {
      totalDebit += line.amountMinor;
      hasDebit = true;
    } else if (line.direction === 'CREDIT') {
      totalCredit += line.amountMinor;
      hasCredit = true;
    } else {
      return {
        isValid: false,
        totalDebitMinor: totalDebit,
        totalCreditMinor: totalCredit,
        imbalanceMinor: 0n,
        lineCount: lines.length,
        error: `Line ${i + 1} has invalid direction. Must be DEBIT or CREDIT.`,
      };
    }
  }

  if (!hasDebit || !hasCredit) {
    return {
      isValid: false,
      totalDebitMinor: totalDebit,
      totalCreditMinor: totalCredit,
      imbalanceMinor: totalDebit - totalCredit,
      lineCount: lines.length,
      error: 'Journal entry must contain at least one DEBIT and at least one CREDIT line.',
    };
  }

  const imbalance = totalDebit - totalCredit;
  const isValid = imbalance === 0n;

  return {
    isValid,
    totalDebitMinor: totalDebit,
    totalCreditMinor: totalCredit,
    imbalanceMinor: imbalance,
    lineCount: lines.length,
    error: isValid ? undefined : `Ledger imbalance detected: Debits (${totalDebit}) do not match Credits (${totalCredit}). Imbalance: ${imbalance} minor units.`,
  };
}

/**
 * Asserts the invariant; throws LedgerInvariantError if violated.
 */
export function assertDoubleEntryInvariant(lines: readonly LedgerLineInput[]): InvariantVerificationResult {
  const result = verifyDoubleEntryInvariant(lines);
  if (!result.isValid) {
    throw new LedgerInvariantError(result.error ?? 'Ledger invariant violation', result);
  }
  return result;
}
