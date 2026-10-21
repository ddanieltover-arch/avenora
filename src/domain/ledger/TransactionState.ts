/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Finite State Machine for Financial Transactions
 *
 * Governs strict state transitions:
 * DRAFT -> PENDING | VOIDED | REJECTED
 * PENDING -> POSTED | REJECTED | VOIDED
 * POSTED -> REVERSED (immutable: original posted state cannot be erased; only compensated)
 * VOIDED / REJECTED -> Terminal states
 */

export type TransactionStatus = 'DRAFT' | 'PENDING' | 'POSTED' | 'VOIDED' | 'REJECTED' | 'REVERSED';

export const ALLOWED_TRANSITIONS: Record<TransactionStatus, readonly TransactionStatus[]> = {
  DRAFT: ['PENDING', 'VOIDED', 'REJECTED'],
  PENDING: ['POSTED', 'REJECTED', 'VOIDED'],
  POSTED: ['REVERSED'],
  VOIDED: [],
  REJECTED: [],
  REVERSED: [],
};

export class InvalidStateTransitionError extends Error {
  constructor(public readonly current: TransactionStatus, public readonly attempted: TransactionStatus) {
    super(`Illegal financial state transition: cannot move from ${current} to ${attempted}`);
    this.name = 'InvalidStateTransitionError';
  }
}

export function canTransition(current: TransactionStatus, next: TransactionStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[current];
  return allowed ? allowed.includes(next) : false;
}

export function assertValidTransition(current: TransactionStatus, next: TransactionStatus): void {
  if (!canTransition(current, next)) {
    throw new InvalidStateTransitionError(current, next);
  }
}

export function isTerminalState(status: TransactionStatus): boolean {
  return ALLOWED_TRANSITIONS[status]?.length === 0;
}
