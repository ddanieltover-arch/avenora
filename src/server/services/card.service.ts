/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Simulated Card Services & POS Authorization Engine
 *
 * Implements:
 * - Debit and Virtual card lifecycle (REQUESTED -> ACTIVE_SIMULATED <-> FROZEN -> TERMINATED)
 * - Synthetic card credentials (masked PAN, synthetic expiry, tokenized CVV)
 * - Configurable daily spend limits and single transaction limits
 * - Two-step card payment mechanics:
 *   1. POS Pre-Authorization: Creates PENDING_HOLD and executes double-entry ledger hold
 *      (Debits Customer Available Balance, Credits Customer Pending Hold)
 *   2. Settlement: Clears hold and posts immutable journal entry to clearing
 *   3. Reversal / Expiration: Restores reserved funds back to Customer Available Balance
 * - Full audit trail with CardStateEvents
 */

import { Money } from '../../domain/money/Money.ts';
import { getCurrency, isSupportedCurrency } from '../../domain/money/Currency.ts';
import { UserRole } from './auth.service.ts';
import { defaultLedgerService } from './ledger.service.ts';
import { defaultWalletService } from './wallet.service.ts';
import { assertDoubleEntryInvariant } from '../../domain/ledger/LedgerInvariant.ts';
import { defaultAuditService } from './audit.service.ts';

export type CardType = 'DEBIT' | 'CREDIT';
export type CardForm = 'VIRTUAL' | 'PHYSICAL';
export type CardStatus =
  | 'REQUESTED'
  | 'PENDING_REVIEW'
  | 'APPROVED_FOR_DEMO'
  | 'ACTIVE_SIMULATED'
  | 'FROZEN'
  | 'TERMINATED'
  | 'EXPIRED';

export type HoldStatus = 'PENDING_HOLD' | 'SETTLED_SIMULATED' | 'REVERSED' | 'EXPIRED_RELEASED';

export interface CardStateEventRecord {
  id: string;
  cardId: string;
  previousStatus: CardStatus;
  newStatus: CardStatus;
  reason?: string;
  actorUserId: string;
  createdAt: Date;
}

export interface CardAuthorizationRecord {
  id: string;
  cardId: string;
  merchantName: string;
  mcc: string; // Merchant Category Code
  currency: string;
  amountMinor: string;
  formattedAmount: string;
  holdStatus: HoldStatus;
  authCode: string;
  ledgerHoldJournalEntryId?: string;
  ledgerSettleJournalEntryId?: string;
  ledgerReversalJournalEntryId?: string;
  expiresAt: Date;
  createdAt: Date;
  settledAt?: Date;
  reversedAt?: Date;
}

export interface PaymentCardRecord {
  id: string;
  userId: string;
  walletAccountId: string;
  type: CardType;
  form: CardForm;
  status: CardStatus;
  currency: string;
  maskedPan: string;
  lastFour: string;
  syntheticPanFormatted: string; // for previewing in demo mode with caution
  syntheticExpiry: string;
  syntheticCvv: string;
  syntheticCardholderName: string;
  dailySpendLimitMinor: string;
  singleTxLimitMinor: string;
  formattedDailyLimit: string;
  formattedSingleTxLimit: string;
  dailySpentMinor: string;
  providerRef: string;
  authorizations: CardAuthorizationRecord[];
  stateEvents: CardStateEventRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export class CardService {
  private cards = new Map<string, PaymentCardRecord>();
  private authorizations = new Map<string, CardAuthorizationRecord>();

  /**
   * Generates a realistic synthetic test card number with valid Luhn checksum.
   */
  private generateSyntheticPan(): { full: string; masked: string; lastFour: string } {
    // Visa demo test prefix 4532 + 8 random digits + Luhn check digit
    const base = '4532' + Math.floor(10000000 + Math.random() * 90000000).toString();
    // Compute Luhn checksum
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      let digit = parseInt(base.charAt(i), 10);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const full = base + checkDigit.toString();
    const formatted = full.replace(/(\d{4})/g, '$1 ').trim();
    const lastFour = full.slice(-4);
    const masked = `•••• •••• •••• ${lastFour}`;
    return { full: formatted, masked, lastFour };
  }

  /**
   * Requests and provisions a new simulated card.
   */
  public requestCard(params: {
    userId: string;
    cardholderName: string;
    currency: string;
    type?: CardType;
    form?: CardForm;
    dailyLimitDecimal?: string;
    singleTxLimitDecimal?: string;
  }): PaymentCardRecord {
    const currency = (params.currency || 'USD').toUpperCase();
    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported card currency: ${currency}`);
    }

    const { full, masked, lastFour } = this.generateSyntheticPan();
    const type = params.type || 'DEBIT';
    const form = params.form || 'VIRTUAL';

    const dailyLimit = params.dailyLimitDecimal
      ? Money.fromDecimalString(params.dailyLimitDecimal, currency)
      : Money.fromMinor(100000n, currency); // $1,000.00 default

    const singleLimit = params.singleTxLimitDecimal
      ? Money.fromDecimalString(params.singleTxLimitDecimal, currency)
      : Money.fromMinor(50000n, currency); // $500.00 default

    const id = `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const card: PaymentCardRecord = {
      id,
      userId: params.userId,
      walletAccountId: `wacc_${params.userId}_${currency.toLowerCase()}`,
      type,
      form,
      status: 'ACTIVE_SIMULATED',
      currency,
      maskedPan: masked,
      lastFour,
      syntheticPanFormatted: full,
      syntheticExpiry: '12/29',
      syntheticCvv: Math.floor(100 + Math.random() * 900).toString(),
      syntheticCardholderName: params.cardholderName.toUpperCase(),
      dailySpendLimitMinor: dailyLimit.amountMinor.toString(),
      singleTxLimitMinor: singleLimit.amountMinor.toString(),
      formattedDailyLimit: dailyLimit.toDisplayString(),
      formattedSingleTxLimit: singleLimit.toDisplayString(),
      dailySpentMinor: '0',
      providerRef: `SIM-ISSUER-${Date.now().toString(36).toUpperCase()}`,
      authorizations: [],
      stateEvents: [
        {
          id: `cevent_${Date.now()}`,
          cardId: id,
          previousStatus: 'REQUESTED',
          newStatus: 'ACTIVE_SIMULATED',
          reason: 'Card issued',
          actorUserId: params.userId,
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cards.set(id, card);
    return card;
  }

  /**
   * Updates card lifecycle status (Freeze, Unfreeze, Terminate).
   */
  public updateCardStatus(params: {
    cardId: string;
    actorUserId: string;
    actorRole: UserRole;
    newStatus: 'ACTIVE_SIMULATED' | 'FROZEN' | 'TERMINATED';
    reason?: string;
  }): PaymentCardRecord {
    const card = this.cards.get(params.cardId);
    if (!card) throw new Error('Card not found.');

    const isStaff = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(params.actorRole);
    if (card.userId !== params.actorUserId && !isStaff) {
      throw new Error('Access denied: you can only update your own cards.');
    }

    if (card.status === 'TERMINATED') {
      throw new Error('Cannot change status of a card that has been permanently TERMINATED.');
    }

    const prevStatus = card.status;
    card.status = params.newStatus;
    card.updatedAt = new Date();

    const eventRecord: CardStateEventRecord = {
      id: `cevent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cardId: card.id,
      previousStatus: prevStatus,
      newStatus: params.newStatus,
      reason: params.reason || `Status updated to ${params.newStatus}`,
      actorUserId: params.actorUserId,
      createdAt: new Date(),
    };

    card.stateEvents.push(eventRecord);

    // Durable audit logging
    defaultAuditService.logAction({
      action: 'CARD_STATUS_CHANGED',
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: 'PAYMENT_CARD',
      resourceId: card.id,
      previousState: prevStatus,
      newState: params.newStatus,
      reason: params.reason || `Status updated to ${params.newStatus}`,
      details: {
        cardLastFour: card.lastFour,
        currency: card.currency,
        userId: card.userId,
      },
    });

    return card;
  }

  /**
   * Updates card spending limits.
   */
  public updateLimits(params: {
    cardId: string;
    userId: string;
    dailyLimitDecimal: string;
    singleTxLimitDecimal: string;
  }): PaymentCardRecord {
    const card = this.cards.get(params.cardId);
    if (!card) throw new Error('Card not found.');
    if (card.userId !== params.userId) {
      throw new Error('Access denied.');
    }

    const dailyLimit = Money.fromDecimalString(params.dailyLimitDecimal, card.currency);
    const singleLimit = Money.fromDecimalString(params.singleTxLimitDecimal, card.currency);

    if (singleLimit.greaterThan(dailyLimit)) {
      throw new Error('Single transaction limit cannot exceed daily spend limit.');
    }

    card.dailySpendLimitMinor = dailyLimit.amountMinor.toString();
    card.singleTxLimitMinor = singleLimit.amountMinor.toString();
    card.formattedDailyLimit = dailyLimit.toDisplayString();
    card.formattedSingleTxLimit = singleLimit.toDisplayString();
    card.updatedAt = new Date();

    return card;
  }

  /**
   * Step 1: Point-of-Sale / Merchant Authorization Simulator.
   * Performs authorization checks and creates a PENDING_HOLD backed by the double-entry ledger.
   */
  public simulateAuthorization(params: {
    cardId: string;
    merchantName: string;
    mcc: string;
    amountDecimal: string;
    currency: string;
  }): { authorization: CardAuthorizationRecord; card: PaymentCardRecord; ledgerJournalEntryId: string } {
    const card = this.cards.get(params.cardId);
    if (!card) throw new Error('Card not found.');

    // 1. Status Guard
    if (card.status === 'FROZEN') {
      throw new Error('Card Declination: Card is currently FROZEN. Please unfreeze card to authorize purchases.');
    }
    if (card.status === 'TERMINATED') {
      throw new Error('Card Declination: Card has been permanently TERMINATED.');
    }
    if (card.status !== 'ACTIVE_SIMULATED') {
      throw new Error(`Card Declination: Card status is ${card.status}. Cannot authorize.`);
    }

    // 2. Currency Guard
    if (params.currency.toUpperCase() !== card.currency) {
      throw new Error(
        `Card Declination: Transaction currency (${params.currency}) does not match card currency (${card.currency}).`
      );
    }

    const txMoney = Money.fromDecimalString(params.amountDecimal, card.currency);
    if (!txMoney.isPositive()) {
      throw new Error('Card authorization amount must be strictly positive.');
    }

    // 3. Single Transaction Limit Check
    const singleLimitMinor = BigInt(card.singleTxLimitMinor);
    if (txMoney.amountMinor > singleLimitMinor) {
      throw new Error(
        `Card Declination: Amount ${txMoney.toDisplayString()} exceeds single transaction limit (${card.formattedSingleTxLimit}).`
      );
    }

    // 4. Daily Spend Limit Check
    const dailySpent = BigInt(card.dailySpentMinor);
    const dailyLimit = BigInt(card.dailySpendLimitMinor);
    if (dailySpent + txMoney.amountMinor > dailyLimit) {
      throw new Error(
        `Card Declination: Transaction would exceed daily limit (${card.formattedDailyLimit}). Daily spent so far: ${Money.fromMinor(dailySpent, card.currency).toDisplayString()}.`
      );
    }

    // 5. Balance Check & Double-Entry Ledger Hold
    const userLedgerAccounts = defaultLedgerService.getUserAccounts(card.userId);
    const availableAccount = userLedgerAccounts.find(
      (a) => a.currency === card.currency && a.classification === 'CUSTOMER_AVAILABLE_BALANCE'
    );
    const holdAccount = userLedgerAccounts.find(
      (a) => a.currency === card.currency && a.classification === 'CUSTOMER_PENDING_HOLD'
    );

    if (!availableAccount || !holdAccount) {
      throw new Error('User ledger accounts not provisioned for card currency.');
    }

    const availableBal = defaultLedgerService.getAccountBalance(availableAccount.id);
    if (availableBal.balanceMinor < txMoney.amountMinor) {
      throw new Error(
        `Card Declination: Insufficient available funds. Available: ${availableBal.formatted}, Required: ${txMoney.toDisplayString()}`
      );
    }

    // Post double-entry hold entry to ledger:
    // Debit Available (decreases liability to customer for immediate spending)
    // Credit Hold (increases pending hold liability)
    const holdLines = [
      {
        accountId: availableAccount.id,
        direction: 'DEBIT' as const,
        amountMinor: txMoney.amountMinor,
        description: `Pre-auth reservation hold: ${params.merchantName}`,
      },
      {
        accountId: holdAccount.id,
        direction: 'CREDIT' as const,
        amountMinor: txMoney.amountMinor,
        description: `Pending card pre-auth liability: ${params.merchantName}`,
      },
    ];
    assertDoubleEntryInvariant(holdLines);

    const journalEntry = defaultLedgerService.postJournalEntry({
      transactionId: `tx_card_auth_${Date.now()}`,
      currency: card.currency,
      narration: `Pre-authorization hold for ${params.merchantName} (MCC: ${params.mcc})`,
      lines: holdLines,
    });

    const authId = `auth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const authCode = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;

    const authorization: CardAuthorizationRecord = {
      id: authId,
      cardId: card.id,
      merchantName: params.merchantName,
      mcc: params.mcc,
      currency: card.currency,
      amountMinor: txMoney.amountMinor.toString(),
      formattedAmount: txMoney.toDisplayString(),
      holdStatus: 'PENDING_HOLD',
      authCode,
      ledgerHoldJournalEntryId: journalEntry.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day hold
      createdAt: new Date(),
    };

    // Update card daily usage
    card.dailySpentMinor = (dailySpent + txMoney.amountMinor).toString();
    card.authorizations.unshift(authorization);
    card.updatedAt = new Date();

    this.authorizations.set(authId, authorization);

    return {
      authorization,
      card,
      ledgerJournalEntryId: journalEntry.id,
    };
  }

  /**
   * Step 2: Settle Pre-Authorization.
   * Clears the pending hold liability and completes settlement against provider clearing.
   */
  public simulateSettlement(params: {
    authorizationId: string;
    actorUserId: string;
  }): { authorization: CardAuthorizationRecord; ledgerJournalEntryId: string } {
    const auth = this.authorizations.get(params.authorizationId);
    if (!auth) throw new Error('Authorization record not found.');

    if (auth.holdStatus !== 'PENDING_HOLD') {
      throw new Error(`Cannot settle authorization in status: ${auth.holdStatus}`);
    }

    const card = this.cards.get(auth.cardId);
    if (!card) throw new Error('Associated card not found.');

    const userLedgerAccounts = defaultLedgerService.getUserAccounts(card.userId);
    const holdAccount = userLedgerAccounts.find(
      (a) => a.currency === card.currency && a.classification === 'CUSTOMER_PENDING_HOLD'
    );
    const clearingAccount = defaultLedgerService
      .getAccounts()
      .find((a) => a.currency === card.currency && a.classification === 'SYSTEM_PROVIDER_CLEARING');

    if (!holdAccount || !clearingAccount) {
      throw new Error('Required ledger settlement accounts not found.');
    }

    const amountMinor = BigInt(auth.amountMinor);

    // Double-entry settlement:
    // Debit Customer Hold (clears hold liability)
    // Credit Provider Clearing (satisfies merchant settlement clearing obligation)
    const settleLines = [
      {
        accountId: holdAccount.id,
        direction: 'DEBIT' as const,
        amountMinor,
        description: `Settlement clear hold: ${auth.merchantName} (${auth.authCode})`,
      },
      {
        accountId: clearingAccount.id,
        direction: 'CREDIT' as const,
        amountMinor,
        description: `Merchant network interchange clearing: ${auth.merchantName}`,
      },
    ];
    assertDoubleEntryInvariant(settleLines);

    const journalEntry = defaultLedgerService.postJournalEntry({
      transactionId: `tx_card_settle_${auth.authCode}_${Date.now()}`,
      currency: card.currency,
      narration: `Card settlement: ${auth.merchantName} (${auth.authCode})`,
      lines: settleLines,
    });

    auth.holdStatus = 'SETTLED_SIMULATED';
    auth.ledgerSettleJournalEntryId = journalEntry.id;
    auth.settledAt = new Date();

    return {
      authorization: auth,
      ledgerJournalEntryId: journalEntry.id,
    };
  }

  /**
   * Step 3: Release or Reverse Hold.
   * Restores held funds back to customer available balance (e.g. cancelled order, expired pre-auth).
   */
  public simulateReleaseOrReversal(params: {
    authorizationId: string;
    actorUserId: string;
    reason?: string;
  }): { authorization: CardAuthorizationRecord; ledgerJournalEntryId: string } {
    const auth = this.authorizations.get(params.authorizationId);
    if (!auth) throw new Error('Authorization record not found.');

    if (auth.holdStatus !== 'PENDING_HOLD') {
      throw new Error(`Cannot reverse authorization in status: ${auth.holdStatus}`);
    }

    const card = this.cards.get(auth.cardId);
    if (!card) throw new Error('Associated card not found.');

    const userLedgerAccounts = defaultLedgerService.getUserAccounts(card.userId);
    const holdAccount = userLedgerAccounts.find(
      (a) => a.currency === card.currency && a.classification === 'CUSTOMER_PENDING_HOLD'
    );
    const availableAccount = userLedgerAccounts.find(
      (a) => a.currency === card.currency && a.classification === 'CUSTOMER_AVAILABLE_BALANCE'
    );

    if (!holdAccount || !availableAccount) {
      throw new Error('Required ledger reversal accounts not found.');
    }

    const amountMinor = BigInt(auth.amountMinor);

    // Double-entry reversal:
    // Debit Customer Hold (removes hold)
    // Credit Customer Available (restores available funds to user)
    const reversalLines = [
      {
        accountId: holdAccount.id,
        direction: 'DEBIT' as const,
        amountMinor,
        description: `Pre-auth hold release: ${auth.merchantName} (${auth.authCode})`,
      },
      {
        accountId: availableAccount.id,
        direction: 'CREDIT' as const,
        amountMinor,
        description: `Funds restored to available balance: ${auth.merchantName}`,
      },
    ];
    assertDoubleEntryInvariant(reversalLines);

    const journalEntry = defaultLedgerService.postJournalEntry({
      transactionId: `tx_card_rev_${auth.authCode}_${Date.now()}`,
      currency: card.currency,
      narration: `Hold release/reversal: ${auth.merchantName} (${auth.authCode})`,
      lines: reversalLines,
    });

    auth.holdStatus = 'REVERSED';
    auth.ledgerReversalJournalEntryId = journalEntry.id;
    auth.reversedAt = new Date();

    // Deduct from card daily spent
    const dailySpent = BigInt(card.dailySpentMinor);
    const updatedSpent = dailySpent >= amountMinor ? dailySpent - amountMinor : 0n;
    card.dailySpentMinor = updatedSpent.toString();
    card.updatedAt = new Date();

    return {
      authorization: auth,
      ledgerJournalEntryId: journalEntry.id,
    };
  }

  public getUserCards(userId: string): PaymentCardRecord[] {
    return Array.from(this.cards.values()).filter((c) => c.userId === userId);
  }

  public getCardById(id: string): PaymentCardRecord | undefined {
    return this.cards.get(id);
  }

  /**
   * Retrieves all payment cards for administrative operations.
   * Credentials (CVV, full synthetic PAN) are redacted to prevent data leakage.
   */
  public getAllCardsForAdmin(params: {
    actorRole: UserRole;
    search?: string;
    statusFilter?: string;
    currencyFilter?: string;
    typeFilter?: string;
    limit?: number;
    offset?: number;
  }): { total: number; limit: number; offset: number; cards: Array<Omit<PaymentCardRecord, 'syntheticPanFormatted' | 'syntheticCvv'>> } {
    const allowed: UserRole[] = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(params.actorRole)) {
      throw new Error('Access denied: Staff role required.');
    }

    let list = Array.from(this.cards.values());

    if (params.statusFilter && params.statusFilter !== 'ALL') {
      list = list.filter((c) => c.status === params.statusFilter);
    }
    if (params.currencyFilter && params.currencyFilter !== 'ALL') {
      list = list.filter((c) => c.currency.toUpperCase() === params.currencyFilter!.toUpperCase());
    }
    if (params.typeFilter && params.typeFilter !== 'ALL') {
      list = list.filter((c) => c.type === params.typeFilter);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.userId.toLowerCase().includes(q) ||
          c.maskedPan.toLowerCase().includes(q) ||
          c.syntheticCardholderName.toLowerCase().includes(q) ||
          c.providerRef.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const limit = Math.min(Math.max(params.limit || 50, 1), 100);
    const offset = Math.max(params.offset || 0, 0);
    const paginated = list.slice(offset, offset + limit).map((c) => {
      const { syntheticPanFormatted, syntheticCvv, ...safeCard } = c;
      return safeCard;
    });

    return { total, limit, offset, cards: paginated };
  }
}

export const defaultCardService = new CardService();
