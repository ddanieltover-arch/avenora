/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Unit Tests: Provider Payment Lifecycle & Ledger Safety
 *
 * Verifies:
 * - REQUESTED -> PENDING_PROVIDER -> CONFIRMED | FAILED | RECONCILIATION_REQUIRED
 * - Immutable double-entry ledger posting on CONFIRMED
 * - Compensating reversals: CONFIRMED -> REVERSED (swapping debit and credit lines)
 * - Zero float / double-entry balance invariants (Sum(Debits) === Sum(Credits))
 * - Idempotency: duplicate webhooks / retries do NOT double-post entries
 * - Out-of-order callback safety: late failure or contradictory callbacks trigger RECONCILIATION_REQUIRED
 * - Administrative resolution of RECONCILIATION_REQUIRED
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProviderPaymentService,
} from '../../src/server/services/providerPayment.service.ts';
import { defaultLedgerService } from '../../src/server/services/ledger.service.ts';
import { defaultMockPaymentProvider, MockFiatPaymentProvider } from '../../src/server/services/providerAdapters.ts';

describe('Provider Payment Lifecycle & Double-Entry Ledger Safety', () => {
  let service: ProviderPaymentService;
  let debtorAccount: any;
  let creditorAccount: any;

  beforeEach(() => {
    service = new ProviderPaymentService(new MockFiatPaymentProvider());

    // Provision clean customer accounts
    defaultLedgerService.provisionCustomerAccounts('usr_deb_lifecycle', 'Debtor Vance');
    defaultLedgerService.provisionCustomerAccounts('usr_cred_lifecycle', 'Creditor Vance');

    const debtorAccounts = defaultLedgerService.getUserAccounts('usr_deb_lifecycle');
    const creditorAccounts = defaultLedgerService.getUserAccounts('usr_cred_lifecycle');

    debtorAccount = debtorAccounts.find((a) => a.currency === 'USD')!;
    creditorAccount = creditorAccounts.find((a) => a.currency === 'USD')!;
  });

  it('progresses safely through standard lifecycle: REQUESTED -> PENDING_PROVIDER -> CONFIRMED', async () => {
    // 1. Create request (REQUESTED)
    const pmt = service.createPaymentRequest({
      idempotencyKey: 'pmt_idem_std_01',
      debtorWalletId: debtorAccount.id,
      creditorWalletId: creditorAccount.id,
      currency: 'USD',
      amountMinor: 25000n, // $250.00
      correlationId: 'corr_std_01',
    });

    expect(pmt.status).toBe('REQUESTED');
    expect(pmt.ledgerJournalEntryId).toBeUndefined();

    // 2. Dispatch to provider (PENDING_PROVIDER)
    const dispatched = await service.dispatchToProvider(pmt.id, 'corr_std_02');
    expect(dispatched.status).toBe('PENDING_PROVIDER');
    expect(dispatched.providerPaymentId).toBeDefined();

    // 3. Provider confirms settlement (CONFIRMED)
    const confirmed = service.processProviderConfirmation({
      paymentId: pmt.id,
      externalReference: 'ext_clearing_ach_9921',
      correlationId: 'corr_std_03',
      debtorAccount,
      creditorAccount,
    });

    expect(confirmed.status).toBe('CONFIRMED');
    expect(confirmed.ledgerJournalEntryId).toBeDefined();

    // Verify double-entry ledger balance invariant
    const summary = defaultLedgerService.getLedgerSummary();
    expect(summary.isBalanced).toBe(true);
    expect(summary.imbalanceMinor).toBe('0');
  });

  it('prevents duplicate postings on duplicate webhook delivery (Idempotency Guard)', async () => {
    const pmt = service.createPaymentRequest({
      idempotencyKey: 'pmt_idem_dup_01',
      debtorWalletId: debtorAccount.id,
      creditorWalletId: creditorAccount.id,
      currency: 'USD',
      amountMinor: 15000n,
      correlationId: 'corr_dup_01',
    });

    await service.dispatchToProvider(pmt.id, 'corr_dup_02');

    // First confirmation webhook
    const firstConfirm = service.processProviderConfirmation({
      paymentId: pmt.id,
      externalReference: 'ext_ref_dup_01',
      correlationId: 'corr_dup_03',
      debtorAccount,
      creditorAccount,
    });

    const journalId1 = firstConfirm.ledgerJournalEntryId;
    const entriesCountBefore = defaultLedgerService.getEntries().length;

    // Duplicate delivery of identical confirmation webhook
    const secondConfirm = service.processProviderConfirmation({
      paymentId: pmt.id,
      externalReference: 'ext_ref_dup_01',
      correlationId: 'corr_dup_04',
      debtorAccount,
      creditorAccount,
    });

    const entriesCountAfter = defaultLedgerService.getEntries().length;

    // Zero extra ledger entries posted!
    expect(secondConfirm.ledgerJournalEntryId).toBe(journalId1);
    expect(entriesCountAfter).toBe(entriesCountBefore);
  });

  it('handles out-of-order failure arriving after confirmation: flags RECONCILIATION_REQUIRED rather than deleting ledger entries', async () => {
    const pmt = service.createPaymentRequest({
      idempotencyKey: 'pmt_idem_ooo_01',
      debtorWalletId: debtorAccount.id,
      creditorWalletId: creditorAccount.id,
      currency: 'USD',
      amountMinor: 30000n,
      correlationId: 'corr_ooo_01',
    });

    await service.dispatchToProvider(pmt.id, 'corr_ooo_02');

    // Settled first
    service.processProviderConfirmation({
      paymentId: pmt.id,
      externalReference: 'ext_ref_ooo_01',
      correlationId: 'corr_ooo_03',
      debtorAccount,
      creditorAccount,
    });

    // Out-of-order late failure callback arrives: MUST NOT delete posted journal entry!
    const reconciled = service.processProviderFailure({
      paymentId: pmt.id,
      errorCode: 'LATE_CLEARING_RETURN_R01',
      errorMessage: 'Insufficient funds reported after initial ACH acceptance',
      correlationId: 'corr_ooo_04',
    });

    expect(reconciled.status).toBe('RECONCILIATION_REQUIRED');
    expect(reconciled.reconciliationNotes).toContain('LATE_CLEARING_RETURN_R01');
    expect(reconciled.ledgerJournalEntryId).toBeDefined(); // Original journal entry remains immutable!
  });

  it('handles contradictory confirmation arriving for previously failed payment: flags RECONCILIATION_REQUIRED', async () => {
    const pmt = service.createPaymentRequest({
      idempotencyKey: 'pmt_idem_ooo_02',
      debtorWalletId: debtorAccount.id,
      creditorWalletId: creditorAccount.id,
      currency: 'USD',
      amountMinor: 10000n,
      correlationId: 'corr_ooo_05',
    });

    // Failed during initial dispatch/settlement
    service.processProviderFailure({
      paymentId: pmt.id,
      errorCode: 'ROUTING_TIMEOUT',
      errorMessage: 'Clearing network unreachable',
      correlationId: 'corr_ooo_06',
    });

    // Unexpected late confirmation arrives
    const oooResult = service.processProviderConfirmation({
      paymentId: pmt.id,
      externalReference: 'ext_late_settle_01',
      correlationId: 'corr_ooo_07',
      debtorAccount,
      creditorAccount,
    });

    expect(oooResult.status).toBe('RECONCILIATION_REQUIRED');
    expect(oooResult.reconciliationNotes).toContain('Received confirmation for previously failed payment');
  });

  it('executes compensating reversal for CONFIRMED payment without mutating original journal entry', async () => {
    const pmt = service.createPaymentRequest({
      idempotencyKey: 'pmt_idem_rev_01',
      debtorWalletId: debtorAccount.id,
      creditorWalletId: creditorAccount.id,
      currency: 'USD',
      amountMinor: 45000n,
      correlationId: 'corr_rev_01',
    });

    await service.dispatchToProvider(pmt.id, 'corr_rev_02');

    service.processProviderConfirmation({
      paymentId: pmt.id,
      externalReference: 'ext_ref_rev_01',
      correlationId: 'corr_rev_03',
      debtorAccount,
      creditorAccount,
    });

    // Execute compensating reversal
    const reversed = service.reversePayment({
      paymentId: pmt.id,
      reason: 'Court order / customer cancellation',
      actorUserId: 'usr_staff_admin_01',
      correlationId: 'corr_rev_04',
      debtorAccount,
      creditorAccount,
    });

    expect(reversed.status).toBe('REVERSED');
    expect(reversed.reversalJournalEntryId).toBeDefined();
    expect(reversed.reversalJournalEntryId).not.toBe(reversed.ledgerJournalEntryId);

    // Ledger balance invariant strictly holds
    const summary = defaultLedgerService.getLedgerSummary();
    expect(summary.isBalanced).toBe(true);
    expect(summary.imbalanceMinor).toBe('0');
  });

  it('resolves RECONCILIATION_REQUIRED cases through audited compliance action', async () => {
    const pmt = service.createPaymentRequest({
      idempotencyKey: 'pmt_idem_rec_resolve_01',
      debtorWalletId: debtorAccount.id,
      creditorWalletId: creditorAccount.id,
      currency: 'USD',
      amountMinor: 20000n,
      correlationId: 'corr_rec_01',
    });

    await service.dispatchToProvider(pmt.id, 'corr_rec_02');

    // Step to confirmation then trigger contradiction
    service.processProviderConfirmation({
      paymentId: pmt.id,
      externalReference: 'ext_ref_rec_01',
      correlationId: 'corr_rec_03',
      debtorAccount,
      creditorAccount,
    });

    service.processProviderFailure({
      paymentId: pmt.id,
      errorCode: 'DISPUTE_OPENED',
      errorMessage: 'Customer disputed charge',
      correlationId: 'corr_rec_04',
    });

    expect(pmt.status).toBe('RECONCILIATION_REQUIRED');

    // Compliance officer reviews and resolves by reversing
    const resolved = service.resolveReconciliation({
      paymentId: pmt.id,
      resolution: 'REVERSED',
      reason: 'Dispute validated after receiving documentation',
      actorUserId: 'usr_staff_compliance_01',
      actorRole: 'COMPLIANCE_REVIEWER',
      correlationId: 'corr_rec_05',
      debtorAccount,
      creditorAccount,
    });

    expect(resolved.status).toBe('REVERSED');
    expect(resolved.reconciliationNotes).toContain('Resolved to REVERSED by usr_staff_compliance_01');
    expect(defaultLedgerService.getLedgerSummary().isBalanced).toBe(true);
  });
});
