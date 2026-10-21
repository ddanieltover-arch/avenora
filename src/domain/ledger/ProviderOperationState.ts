/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Provider Operation Lifecycle & Ledger Safety States
 *
 * Governs strict lifecycle states for external financial provider operations:
 * REQUESTED -> PENDING_PROVIDER -> CONFIRMED | FAILED | RECONCILIATION_REQUIRED
 * CONFIRMED -> REVERSED (via compensating double-entry journal entry only)
 *
 * Invariants:
 * 1. An HTTP 200 response alone NEVER constitutes final settlement.
 * 2. Funds are only confirmed when settled or verified by verified provider webhook/reconciliation.
 * 3. Posted ledger entries are immutable. No double-posting on retry or out-of-order callbacks.
 * 4. Inconclusive or conflicting states transition to RECONCILIATION_REQUIRED.
 */

import { TransactionStatus } from './TransactionState.ts';

export type ProviderOperationStatus =
  | 'REQUESTED'
  | 'PENDING_PROVIDER'
  | 'CONFIRMED'
  | 'FAILED'
  | 'RECONCILIATION_REQUIRED'
  | 'REVERSED';

export const ALLOWED_PROVIDER_TRANSITIONS: Record<
  ProviderOperationStatus,
  readonly ProviderOperationStatus[]
> = {
  REQUESTED: ['PENDING_PROVIDER', 'FAILED', 'RECONCILIATION_REQUIRED'],
  PENDING_PROVIDER: ['CONFIRMED', 'FAILED', 'RECONCILIATION_REQUIRED'],
  CONFIRMED: ['REVERSED', 'RECONCILIATION_REQUIRED'],
  FAILED: ['RECONCILIATION_REQUIRED'], // In case of late contradictory settlement notice
  RECONCILIATION_REQUIRED: ['CONFIRMED', 'FAILED', 'REVERSED'], // Resolved only by audited compliance review
  REVERSED: [], // Terminal compensating state
};

export class InvalidProviderStateTransitionError extends Error {
  constructor(
    public readonly current: ProviderOperationStatus,
    public readonly attempted: ProviderOperationStatus,
    public readonly operationId?: string
  ) {
    super(
      `Illegal provider lifecycle state transition for operation "${operationId || 'unknown'}": cannot transition from ${current} to ${attempted}`
    );
    this.name = 'InvalidProviderStateTransitionError';
  }
}

export function canTransitionProviderState(
  current: ProviderOperationStatus,
  next: ProviderOperationStatus
): boolean {
  if (current === next) return true; // Idempotent same-state replay
  const allowed = ALLOWED_PROVIDER_TRANSITIONS[current];
  return allowed ? allowed.includes(next) : false;
}

export function assertValidProviderTransition(
  current: ProviderOperationStatus,
  next: ProviderOperationStatus,
  operationId?: string
): void {
  if (!canTransitionProviderState(current, next)) {
    throw new InvalidProviderStateTransitionError(current, next, operationId);
  }
}

/**
 * Maps provider operation state to internal double-entry ledger state.
 * Guarantees zero ledger imbalance during asynchronous provider settlement.
 */
export function mapProviderStatusToLedgerStatus(
  status: ProviderOperationStatus
): TransactionStatus {
  switch (status) {
    case 'REQUESTED':
      return 'DRAFT';
    case 'PENDING_PROVIDER':
      return 'PENDING';
    case 'CONFIRMED':
      return 'POSTED';
    case 'FAILED':
      return 'REJECTED';
    case 'REVERSED':
      return 'REVERSED';
    case 'RECONCILIATION_REQUIRED':
      return 'PENDING'; // Kept in pending/holding until audited reconciliation
  }
}
