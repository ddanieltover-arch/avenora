/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Simulated Multicurrency Wallet & Idempotency Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WalletService } from '../../src/server/services/wallet.service.ts';
import { defaultLedgerService } from '../../src/server/services/ledger.service.ts';

describe('Multicurrency Wallets & Double-Entry Ledger Operations', () => {
  let walletService: WalletService;
  const testUserId = 'usr_wallet_tester_01';
  const recipientUserId = 'usr_wallet_tester_02';

  beforeEach(() => {
    walletService = new WalletService();
    walletService.getOrCreateUserWallet(testUserId, 'Wallet Tester');
    walletService.getOrCreateUserWallet(recipientUserId, 'Recipient Tester');
  });

  it('executes simulated deposit, increases available balance, and preserves ledger invariant', async () => {
    const depositResult = await walletService.executeSimulatedDeposit({
      userId: testUserId,
      currency: 'USD',
      amountDecimal: '150.00',
      idempotencyKey: 'idem_test_dep_01',
    });

    expect(depositResult.status).toBe('POSTED');
    expect(depositResult.amountMinor).toBe('15000');
    expect(depositResult.isSimulated).toBe(true);

    // Verify overall ledger remains perfectly balanced
    const summary = defaultLedgerService.getLedgerSummary();
    expect(summary.isBalanced).toBe(true);
    expect(summary.imbalanceMinor).toBe('0');
  });

  it('rejects withdrawal when requested amount exceeds available balance (Overdraft Prevention)', async () => {
    // Initial balance is 0 for EUR
    await expect(
      walletService.executeSimulatedWithdrawal({
        userId: testUserId,
        currency: 'EUR',
        amountDecimal: '500.00', // Exceeds balance
      })
    ).rejects.toThrow(/Insufficient available funds/);
  });

  it('executes successful withdrawal after deposit, reducing available balance', async () => {
    // 1. Deposit $200.00
    await walletService.executeSimulatedDeposit({
      userId: testUserId,
      currency: 'USD',
      amountDecimal: '200.00',
    });

    // 2. Withdraw $75.00
    const wthResult = await walletService.executeSimulatedWithdrawal({
      userId: testUserId,
      currency: 'USD',
      amountDecimal: '75.00',
    });

    expect(wthResult.status).toBe('POSTED');
    expect(wthResult.amountMinor).toBe('7500');

    // Verify ledger balance invariant
    const summary = defaultLedgerService.getLedgerSummary();
    expect(summary.isBalanced).toBe(true);
  });

  it('executes internal transfer between customer wallets atomically in a single journal entry', async () => {
    // Fund sender with $300.00
    await walletService.executeSimulatedDeposit({
      userId: testUserId,
      currency: 'USD',
      amountDecimal: '300.00',
    });

    const trfResult = await walletService.executeInternalTransfer({
      senderUserId: testUserId,
      recipientEmailOrId: recipientUserId,
      currency: 'USD',
      amountDecimal: '100.00',
      note: 'Dinner split',
    });

    expect(trfResult.status).toBe('POSTED');
    expect(trfResult.amountMinor).toBe('10000');

    // Check recipient wallet has $100.00
    const recipientWallet = walletService.getOrCreateUserWallet(recipientUserId);
    const recipientUsd = recipientWallet.accounts.find((a) => a.currency === 'USD');
    expect(recipientUsd?.availableBalanceMinor).toBe('10000');

    // Invariant check
    const summary = defaultLedgerService.getLedgerSummary();
    expect(summary.isBalanced).toBe(true);
  });

  it('enforces idempotency: genuine retries return cached result without double posting', async () => {
    const fixedKey = 'idem_fixed_key_abc_123';

    // First call
    const firstResult = await walletService.executeSimulatedDeposit({
      userId: testUserId,
      currency: 'USD',
      amountDecimal: '50.00',
      idempotencyKey: fixedKey,
    });

    // Second call with identical payload: returns cached response
    const secondResult = await walletService.executeSimulatedDeposit({
      userId: testUserId,
      currency: 'USD',
      amountDecimal: '50.00',
      idempotencyKey: fixedKey,
    });

    expect(firstResult.transactionId).toBe(secondResult.transactionId);
    expect(firstResult.journalEntryId).toBe(secondResult.journalEntryId);

    // Reusing the same key with altered payload must be rejected with 409 Conflict!
    await expect(
      walletService.executeSimulatedDeposit({
        userId: testUserId,
        currency: 'USD',
        amountDecimal: '999.00', // Altered payload!
        idempotencyKey: fixedKey,
      })
    ).rejects.toThrow(/reused with different request payload/);
  });

  it('generates illustrative FX quotes and executes multi-currency balanced conversions', async () => {
    // Fund with $500.00 USD
    await walletService.executeSimulatedDeposit({
      userId: testUserId,
      currency: 'USD',
      amountDecimal: '500.00',
    });

    // Request quote: 100 USD -> EUR
    const quote = walletService.generateFxQuote({
      userId: testUserId,
      sourceCurrency: 'USD',
      destinationCurrency: 'EUR',
      sourceAmountDecimal: '100.00',
    });

    expect(quote.exchangeRate).toBe('0.92');
    expect(quote.isExecuted).toBe(false);

    // Execute conversion against quote
    const convResult = await walletService.executeFxConversion({
      userId: testUserId,
      quoteId: quote.id,
    });

    expect(convResult.status).toBe('POSTED');
    expect(convResult.currency).toBe('EUR');

    // Global ledger remains balanced across currencies
    const summary = defaultLedgerService.getLedgerSummary();
    expect(summary.isBalanced).toBe(true);

    // Re-executing already executed quote with a new command key must throw
    await expect(
      walletService.executeFxConversion({
        userId: testUserId,
        quoteId: quote.id,
        idempotencyKey: 'idem_fx_new_attempt',
      })
    ).rejects.toThrow(/already been executed/);
  });
});
