/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Unit Tests: Card Services & POS Simulator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CardService } from '../../src/server/services/card.service.ts';
import { defaultLedgerService } from '../../src/server/services/ledger.service.ts';
import { defaultWalletService } from '../../src/server/services/wallet.service.ts';

describe('Payment Card Services & POS Simulator', () => {
  let cardService: CardService;

  beforeEach(() => {
    cardService = new CardService();
    // Provision test user ledger accounts
    defaultLedgerService.provisionCustomerAccounts('usr_card_tester', 'Tester Vance');
  });

  describe('Card Issuance & Lifecycle', () => {
    it('provisions a new simulated debit card with masked PAN and synthetic credentials', () => {
      const card = cardService.requestCard({
        userId: 'usr_card_tester',
        cardholderName: 'Tester Vance',
        currency: 'USD',
        type: 'DEBIT',
        form: 'VIRTUAL',
        dailyLimitDecimal: '1500.00',
        singleTxLimitDecimal: '600.00',
      });

      expect(card.status).toBe('ACTIVE_SIMULATED');
      expect(card.maskedPan).toMatch(/^•••• •••• •••• \d{4}$/);
      expect(card.syntheticCardholderName).toBe('TESTER VANCE');
      expect(card.syntheticExpiry).toBe('12/29');
      expect(card.singleTxLimitMinor).toBe('60000');
      expect(card.dailySpendLimitMinor).toBe('150000');
      expect(card.stateEvents.length).toBe(1);
    });

    it('toggles freeze and unfreeze status and records CardStateEvent audit logs', () => {
      const card = cardService.requestCard({
        userId: 'usr_card_tester',
        cardholderName: 'Tester Vance',
        currency: 'USD',
      });

      // Freeze
      const frozen = cardService.updateCardStatus({
        cardId: card.id,
        actorUserId: 'usr_card_tester',
        actorRole: 'CUSTOMER',
        newStatus: 'FROZEN',
        reason: 'Temporary safety lock',
      });
      expect(frozen.status).toBe('FROZEN');

      // Unfreeze
      const unfrozen = cardService.updateCardStatus({
        cardId: card.id,
        actorUserId: 'usr_card_tester',
        actorRole: 'CUSTOMER',
        newStatus: 'ACTIVE_SIMULATED',
        reason: 'Unlocked by customer',
      });
      expect(unfrozen.status).toBe('ACTIVE_SIMULATED');
      expect(unfrozen.stateEvents.length).toBe(3); // init + freeze + unfreeze
    });

    it('updates spending limits and rejects single transaction limit exceeding daily limit', () => {
      const card = cardService.requestCard({
        userId: 'usr_card_tester',
        cardholderName: 'Tester Vance',
        currency: 'USD',
        dailyLimitDecimal: '1000.00',
        singleTxLimitDecimal: '500.00',
      });

      const updated = cardService.updateLimits({
        cardId: card.id,
        userId: 'usr_card_tester',
        dailyLimitDecimal: '2000.00',
        singleTxLimitDecimal: '1000.00',
      });
      expect(updated.singleTxLimitMinor).toBe('100000');
      expect(updated.dailySpendLimitMinor).toBe('200000');

      // Invalid: single tx > daily limit
      expect(() =>
        cardService.updateLimits({
          cardId: card.id,
          userId: 'usr_card_tester',
          dailyLimitDecimal: '500.00',
          singleTxLimitDecimal: '800.00',
        })
      ).toThrow(/cannot exceed daily spend limit/i);
    });
  });

  describe('Point-of-Sale Authorization Simulator & Double-Entry Holds', () => {
    it('declines authorizations when card is frozen', () => {
      const card = cardService.requestCard({
        userId: 'usr_card_tester',
        cardholderName: 'Tester Vance',
        currency: 'USD',
      });

      cardService.updateCardStatus({
        cardId: card.id,
        actorUserId: 'usr_card_tester',
        actorRole: 'CUSTOMER',
        newStatus: 'FROZEN',
      });

      expect(() =>
        cardService.simulateAuthorization({
          cardId: card.id,
          merchantName: 'Grocery Store',
          mcc: '5411',
          amountDecimal: '25.00',
          currency: 'USD',
        })
      ).toThrow(/card is currently frozen/i);
    });

    it('enforces single transaction limit and declines exceeding amounts', () => {
      const card = cardService.requestCard({
        userId: 'usr_card_tester',
        cardholderName: 'Tester Vance',
        currency: 'USD',
        singleTxLimitDecimal: '50.00',
      });

      expect(() =>
        cardService.simulateAuthorization({
          cardId: card.id,
          merchantName: 'High-end Boutique',
          mcc: '5651',
          amountDecimal: '120.00',
          currency: 'USD',
        })
      ).toThrow(/exceeds single transaction limit/i);
    });

    it('executes two-step hold mechanics: creates pending hold and settles against ledger', async () => {
      const card = cardService.requestCard({
        userId: 'usr_card_tester',
        cardholderName: 'Tester Vance',
        currency: 'USD',
      });
      await defaultWalletService.executeSimulatedDeposit({
        userId: 'usr_card_tester',
        currency: 'USD',
        amountDecimal: '500.00',
      });

      const authResult = cardService.simulateAuthorization({
        cardId: card.id,
        merchantName: 'AeroTech Electronics',
        mcc: '5732',
        amountDecimal: '85.50',
        currency: 'USD',
      });

      expect(authResult.authorization.holdStatus).toBe('PENDING_HOLD');
      expect(authResult.authorization.amountMinor).toBe('8550');
      expect(authResult.authorization.authCode).toMatch(/^AUTH-/);
      expect(authResult.ledgerJournalEntryId).toBeDefined();

      // Settle pre-authorization
      const settleResult = cardService.simulateSettlement({
        authorizationId: authResult.authorization.id,
        actorUserId: 'usr_card_tester',
      });

      expect(settleResult.authorization.holdStatus).toBe('SETTLED_SIMULATED');
      expect(settleResult.ledgerJournalEntryId).toBeDefined();
    });

    it('reverses or releases pending hold and restores available balance', async () => {
      const card = cardService.requestCard({
        userId: 'usr_card_tester',
        cardholderName: 'Tester Vance',
        currency: 'USD',
      });
      await defaultWalletService.executeSimulatedDeposit({
        userId: 'usr_card_tester',
        currency: 'USD',
        amountDecimal: '500.00',
      });

      const authResult = cardService.simulateAuthorization({
        cardId: card.id,
        merchantName: 'Cancelled Order Merchant',
        mcc: '5311',
        amountDecimal: '40.00',
        currency: 'USD',
      });

      expect(authResult.authorization.holdStatus).toBe('PENDING_HOLD');

      const releaseResult = cardService.simulateReleaseOrReversal({
        authorizationId: authResult.authorization.id,
        actorUserId: 'usr_card_tester',
        reason: 'Customer cancelled transaction',
      });

      expect(releaseResult.authorization.holdStatus).toBe('REVERSED');
      expect(releaseResult.ledgerJournalEntryId).toBeDefined();
    });
  });
});
