/**
 * @license Apache-2.0
 * Customer-facing labels for internal operation type codes.
 */

const OPERATION_LABELS: Record<string, string> = {
  SIMULATED_DEPOSIT: 'Deposit',
  SIMULATED_WITHDRAWAL: 'Withdrawal',
  INTERNAL_TRANSFER: 'Internal transfer',
  FX_CONVERSION: 'Currency exchange',
  CARD_HOLD: 'Card authorization hold',
  CARD_SETTLEMENT: 'Card settlement',
  GRANT_DISBURSEMENT: 'Grant disbursement',
  COMPENSATING_REVERSAL: 'Reversal',
};

export function formatOperationTypeLabel(operationType: string): string {
  return OPERATION_LABELS[operationType] ?? operationType.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function formatRateSourceLabel(rateSource: string): string {
  if (rateSource === 'SIMULATED_REFERENCE_RATE') return 'Reference rate';
  return rateSource.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}
