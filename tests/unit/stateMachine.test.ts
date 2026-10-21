/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Transaction State Machine Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  canTransition,
  assertValidTransition,
  InvalidStateTransitionError,
  isTerminalState,
} from '../../src/domain/ledger/TransactionState.ts';

describe('Transaction Finite State Machine Guards', () => {
  it('allows valid progression: DRAFT -> PENDING -> POSTED -> REVERSED', () => {
    expect(canTransition('DRAFT', 'PENDING')).toBe(true);
    expect(canTransition('PENDING', 'POSTED')).toBe(true);
    expect(canTransition('POSTED', 'REVERSED')).toBe(true);
    expect(() => assertValidTransition('DRAFT', 'PENDING')).not.toThrow();
  });

  it('rejects illegal jumps (e.g. DRAFT straight to POSTED without pending settlement)', () => {
    expect(canTransition('DRAFT', 'POSTED')).toBe(false);
    expect(() => assertValidTransition('DRAFT', 'POSTED')).toThrow(InvalidStateTransitionError);
  });

  it('prohibits state transition out of terminal states (VOIDED, REJECTED, REVERSED)', () => {
    expect(isTerminalState('VOIDED')).toBe(true);
    expect(isTerminalState('REJECTED')).toBe(true);
    expect(isTerminalState('REVERSED')).toBe(true);

    expect(canTransition('VOIDED', 'POSTED')).toBe(false);
    expect(canTransition('REJECTED', 'PENDING')).toBe(false);
    expect(canTransition('REVERSED', 'POSTED')).toBe(false);
  });
});
