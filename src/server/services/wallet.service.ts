/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Multicurrency Wallet & Ledger Operations Service
 *
 * Implements:
 * - Persistent wallet accounts linked to the double-entry Chart of Accounts
 * - deposits, withdrawals, and internal transfers with zero-float BigInt math
 * - Overdraft prevention (negative available balances rejected)
 * - Strict double-entry invariant verification: Sum(Debits) === Sum(Credits)
 * - Illustrative FX Quote generation and atomic currency conversions
 * - Cryptographic idempotency key binding, duplicate detection, and concurrency safety
 */

import { Money } from '../../domain/money/Money.ts';
import { getCurrency, isSupportedCurrency } from '../../domain/money/Currency.ts';
import { defaultLedgerService } from './ledger.service.ts';
import { assertDoubleEntryInvariant } from '../../domain/ledger/LedgerInvariant.ts';
import { LedgerLineInput } from '../../domain/ledger/JournalEntry.ts';
import { generateSimpleHash } from '../../domain/common/Idempotency.ts';
import { UserRole } from './auth.service.ts';
import { defaultAuditService } from './audit.service.ts';
import { defaultAuthService } from './auth.service.ts';
import { defaultEmailService, voidEmail } from './email.service.ts';
import { getWalletCurrencyCodesForCountry } from '../../domain/country/countryPrimaryCurrency.ts';
import {
  PLATFORM_BTC_DEPOSIT_ADDRESS,
  PLATFORM_DEPOSIT_SUPPORT_EMAIL,
} from '../../config/constants.ts';
import { isDepositRailAllowedForCountry } from '../../domain/country/countryDepositRails.ts';
import {
  isWithdrawalRailAllowedForCountry,
  validateBtcWithdrawalAddress,
  validateWithdrawalBankingDetails,
} from '../../domain/country/withdrawalRailFields.ts';
import {
  illustrativeLocalUnitsPerUsd,
  illustrativeUsdPerLocalUnit,
} from '../../lib/illustrativeUsdRates.ts';

export interface WalletAccountView {
  id: string;
  currency: string;
  currencyName: string;
  currencySymbol: string;
  minorUnits: number;
  isCrypto: boolean;
  ledgerAccountId: string;
  accountNumber: string;
  availableBalanceMinor: string;
  formattedBalance: string;
  pendingHoldMinor: string;
  formattedHold: string;
  status: 'ACTIVE' | 'FROZEN';
}

export interface WalletOverview {
  walletId: string;
  userId: string;
  name: string;
  accounts: WalletAccountView[];
}

export interface FxQuoteRecord {
  id: string;
  userId: string;
  sourceCurrency: string;
  destinationCurrency: string;
  sourceAmountMinor: string;
  destinationAmountMinor: string;
  exchangeRate: string;
  feeMinor: string;
  rateSource: string;
  expiresAt: Date;
  isExecuted: boolean;
  createdAt: Date;
}

export interface FinancialOperationResult {
  transactionId: string;
  referenceNumber: string;
  operationType:
    | 'SIMULATED_DEPOSIT'
    | 'SIMULATED_WITHDRAWAL'
    | 'INTERNAL_TRANSFER'
    | 'FX_CONVERSION'
    | 'CARD_HOLD'
    | 'CARD_SETTLEMENT'
    | 'GRANT_DISBURSEMENT'
    | 'COMPENSATING_REVERSAL';
  status: 'POSTED' | 'REVERSED' | 'PENDING_REVIEW';
  currency: string;
  amountMinor: string;
  formattedAmount: string;
  journalEntryId: string;
  reversalJournalEntryId?: string;
  reversalReason?: string;
  reversedAt?: string;
  reversedByUserId?: string;
  senderAccountId?: string;
  recipientAccountId?: string;
  idempotencyKey: string;
  isSimulated: true;
  authoritativeBalance: string;
  timestamp: string;
  userId?: string;
  counterparty?: string;
  narration?: string;
  direction?: 'CREDIT' | 'DEBIT';
}

// In-memory persistent stores for demo environment
interface IdempotencyEntry {
  key: string;
  userId: string;
  endpoint: string;
  requestHash: string;
  response: FinancialOperationResult;
  createdAt: Date;
}

export type PendingDepositKind = 'FIAT' | 'BTC';
export type PendingDepositStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
export type PendingFundingOrigin = 'CUSTOMER' | 'ADMIN';

export interface PendingDepositRecord {
  id: string;
  userId: string;
  kind: PendingDepositKind;
  currency: string;
  amountDecimal: string;
  amountMinor: string;
  formattedAmount: string;
  sourceRail?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  storageRef?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedByUserId?: string;
  reviewNotes?: string;
  status: PendingDepositStatus;
  holdJournalEntryId: string;
  referenceNumber: string;
  releaseJournalEntryId?: string;
  origin: PendingFundingOrigin;
  initiatedByUserId?: string;
  initiationReason?: string;
}

export interface BtcDepositProofRecord {
  id: string;
  userId: string;
  amountDecimal: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageRef: string;
  submittedAt: Date;
  status: PendingDepositStatus;
}

export type PendingWithdrawalKind = 'FIAT' | 'BTC';
export type PendingWithdrawalStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface PendingWithdrawalRecord {
  id: string;
  userId: string;
  kind: PendingWithdrawalKind;
  currency: string;
  amountDecimal: string;
  amountMinor: string;
  formattedAmount: string;
  destinationRail?: string;
  bankingDetails: Record<string, string>;
  btcAddress?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedByUserId?: string;
  reviewNotes?: string;
  status: PendingWithdrawalStatus;
  holdJournalEntryId: string;
  referenceNumber: string;
  releaseJournalEntryId?: string;
  origin: PendingFundingOrigin;
  initiatedByUserId?: string;
  initiationReason?: string;
}

export class WalletService {
  private quotes = new Map<string, FxQuoteRecord>();
  private idempotencyStore = new Map<string, IdempotencyEntry>();
  private transactionHistory: FinancialOperationResult[] = [];
  private pendingDeposits: PendingDepositRecord[] = [];
  private pendingWithdrawals: PendingWithdrawalRecord[] = [];


  // Illustrative reference rates (strictly synthetic demo rates)
  /** Illustrative USD value of one unit of currency (prototype triangulation). */
  private illustrativeUsdPerUnit(currency: string): number {
    return illustrativeUsdPerLocalUnit(currency);
  }

  private resolveIllustrativeRate(sourceCurrency: string, destinationCurrency: string): number {
    const source = sourceCurrency.toUpperCase();
    const dest = destinationCurrency.toUpperCase();
    if (source === dest) return 1;

    if (source === 'USD') {
      return illustrativeLocalUnitsPerUsd(dest);
    }
    if (dest === 'USD') {
      return this.illustrativeUsdPerUnit(source);
    }

    const usdPerSource = this.illustrativeUsdPerUnit(source);
    const usdPerDest = this.illustrativeUsdPerUnit(dest);
    if (usdPerDest <= 0) return 1;
    return usdPerSource / usdPerDest;
  }

  private resolveCustomerCountryCode(userId: string, countryCode?: string): string {
    const fromUser = defaultAuthService.getUserById(userId)?.countryCode;
    const resolved = (countryCode?.trim() || fromUser || 'US').toUpperCase();
    return resolved;
  }

  /** Ensures operations use only signup-country fiat + BTC wallets. */
  public assertCurrencyAllowedForCustomer(
    userId: string,
    currency: string,
    countryCode?: string,
  ): void {
    const allowed = getWalletCurrencyCodesForCountry(
      this.resolveCustomerCountryCode(userId, countryCode),
    );
    const code = currency.toUpperCase();
    if (!allowed.includes(code)) {
      throw new Error(
        `Currency ${code} is not enabled for your account. Supported: ${allowed.join(', ')}.`,
      );
    }
  }

  /**
   * Retrieves or provisions the user's wallet (home fiat + BTC).
   */
  public getOrCreateUserWallet(
    userId: string,
    fullName = 'Valued Customer',
    countryCode?: string,
  ): WalletOverview {
    const resolvedCountry = this.resolveCustomerCountryCode(userId, countryCode);
    const currencies = getWalletCurrencyCodesForCountry(resolvedCountry);

    defaultLedgerService.provisionCustomerAccounts(userId, fullName, resolvedCountry);
    const userLedgerAccounts = defaultLedgerService.getUserAccounts(userId);

    const accounts: WalletAccountView[] = [];

    for (const curr of currencies) {
      const currDef = getCurrency(curr);
      const availAcc = userLedgerAccounts.find(
        (a) => a.currency === curr && a.classification === 'CUSTOMER_AVAILABLE_BALANCE'
      );
      const holdAcc = userLedgerAccounts.find(
        (a) => a.currency === curr && a.classification === 'CUSTOMER_PENDING_HOLD'
      );

      if (availAcc) {
        const availBal = defaultLedgerService.getAccountBalance(availAcc.id);
        const holdBal = holdAcc ? defaultLedgerService.getAccountBalance(holdAcc.id) : null;

        accounts.push({
          id: `wacc_${userId}_${curr.toLowerCase()}`,
          currency: curr,
          currencyName: currDef.name,
          currencySymbol: currDef.symbol,
          minorUnits: currDef.minorUnits,
          isCrypto: currDef.isCrypto,
          ledgerAccountId: availAcc.id,
          accountNumber: availAcc.accountNumber,
          availableBalanceMinor: availBal.balanceMinor.toString(),
          formattedBalance: availBal.formatted,
          pendingHoldMinor: holdBal ? holdBal.balanceMinor.toString() : '0',
          formattedHold: holdBal ? holdBal.formatted : `${currDef.symbol}0.00 ${curr}`,
          status: availAcc.isFrozen ? 'FROZEN' : 'ACTIVE',
        });
      }
    }

    return {
      walletId: `wallet_${userId}`,
      userId,
      name: `${fullName}'s Wallet`,
      accounts,
    };
  }

  /**
   * Executes a simulated deposit.
   * Debits Safeguarding Cash Asset, Credits Customer Available Liability.
   */
  public async executeSimulatedDeposit(params: {
    userId: string;
    currency: string;
    amountDecimal: string;
    idempotencyKey?: string;
    sourceRail?: string;
  }): Promise<FinancialOperationResult> {
    const { userId, currency, amountDecimal } = params;
    const key = params.idempotencyKey || `idem_dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Check Idempotency
    const cached = this.checkIdempotency(key, userId, 'DEPOSIT', params);
    if (cached) return cached;

    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency corridor: ${currency}`);
    }
    this.assertCurrencyAllowedForCustomer(userId, currency);

    const money = Money.fromDecimalString(amountDecimal, currency);
    if (!money.isPositive()) {
      throw new Error('Deposit amount must be strictly greater than zero.');
    }

    const wallet = this.getOrCreateUserWallet(userId);
    const targetAccount = wallet.accounts.find((a) => a.currency === currency);
    if (!targetAccount) {
      throw new Error(`Wallet account not found for currency ${currency}`);
    }

    // Determine corresponding safeguarding asset account
    const safeguardingAccountId = this.getSafeguardingAccountId(currency);
    const txId = `tx_sim_dep_${Date.now()}`;
    const refNum = `DEP-${currency}-${Date.now().toString().slice(-6)}`;

    // Atomic double-entry journal entry:
    // DEBIT: Safeguarding Asset
    // CREDIT: Customer Liability (increases customer available funds)
    const lines: LedgerLineInput[] = [
      {
        accountId: safeguardingAccountId,
        direction: 'DEBIT',
        amountMinor: money.amountMinor,
        description: `${params.sourceRail || 'WIRE'} clearing settlement`,
      },
      {
        accountId: targetAccount.ledgerAccountId,
        direction: 'CREDIT',
        amountMinor: money.amountMinor,
        description: `Customer wallet available credit: ${refNum}`,
      },
    ];

    assertDoubleEntryInvariant(lines);

    const entry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency,
      narration: `Inbound Deposit via ${params.sourceRail || 'WIRE'} [${refNum}]`,
      lines,
    });

    const newBalance = defaultLedgerService.getAccountBalance(targetAccount.ledgerAccountId);

    const result: FinancialOperationResult = {
      transactionId: txId,
      referenceNumber: refNum,
      operationType: 'SIMULATED_DEPOSIT',
      status: 'POSTED',
      currency,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      journalEntryId: entry.id,
      recipientAccountId: targetAccount.ledgerAccountId,
      idempotencyKey: key,
      isSimulated: true,
      authoritativeBalance: newBalance.formatted,
      timestamp: new Date().toISOString(),
      userId,
      direction: 'CREDIT',
      narration: `${currency} Deposit via ${params.sourceRail || 'WIRE'}`,
    };

    this.recordIdempotency(key, userId, 'DEPOSIT', params, result);
    return result;
  }

  /**
   * Executes a simulated withdrawal.
   * Debits Customer Available Liability, Credits Safeguarding Cash Asset.
   * Strictly enforces available balance >= withdrawal amount (No Overdrafts).
   */
  public async executeSimulatedWithdrawal(params: {
    userId: string;
    currency: string;
    amountDecimal: string;
    destinationRef?: string;
    idempotencyKey?: string;
  }): Promise<FinancialOperationResult> {
    const { userId, currency, amountDecimal } = params;
    const key = params.idempotencyKey || `idem_wth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Check Idempotency
    const cached = this.checkIdempotency(key, userId, 'WITHDRAWAL', params);
    if (cached) return cached;

    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency corridor: ${currency}`);
    }
    this.assertCurrencyAllowedForCustomer(userId, currency);

    const money = Money.fromDecimalString(amountDecimal, currency);
    if (!money.isPositive()) {
      throw new Error('Withdrawal amount must be strictly greater than zero.');
    }

    const wallet = this.getOrCreateUserWallet(userId);
    const sourceAccount = wallet.accounts.find((a) => a.currency === currency);
    if (!sourceAccount) {
      throw new Error(`Wallet account not found for currency ${currency}`);
    }

    // Overdraft check: Available balance check
    const currentBalance = defaultLedgerService.getAccountBalance(sourceAccount.ledgerAccountId);
    if (currentBalance.balanceMinor < money.amountMinor) {
      throw new Error(
        `Insufficient available funds. Required: ${money.toDisplayString()}, Available: ${currentBalance.formatted}`
      );
    }

    const safeguardingAccountId = this.getSafeguardingAccountId(currency);
    const txId = `tx_sim_wth_${Date.now()}`;
    const refNum = `WTH-${currency}-${Date.now().toString().slice(-6)}`;

    // Atomic double-entry journal entry:
    // DEBIT: Customer Liability (reduces customer available balance)
    // CREDIT: Safeguarding Asset (reduces safeguarding cash held)
    const lines: LedgerLineInput[] = [
      {
        accountId: sourceAccount.ledgerAccountId,
        direction: 'DEBIT',
        amountMinor: money.amountMinor,
        description: `Customer withdrawal debit: ${refNum}`,
      },
      {
        accountId: safeguardingAccountId,
        direction: 'CREDIT',
        amountMinor: money.amountMinor,
        description: `Disbursement to ${params.destinationRef || 'External account'}`,
      },
    ];

    assertDoubleEntryInvariant(lines);

    const entry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency,
      narration: `Outbound Withdrawal [${refNum}]`,
      lines,
    });

    const newBalance = defaultLedgerService.getAccountBalance(sourceAccount.ledgerAccountId);

    const result: FinancialOperationResult = {
      transactionId: txId,
      referenceNumber: refNum,
      operationType: 'SIMULATED_WITHDRAWAL',
      status: 'POSTED',
      currency,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      journalEntryId: entry.id,
      senderAccountId: sourceAccount.ledgerAccountId,
      idempotencyKey: key,
      isSimulated: true,
      authoritativeBalance: newBalance.formatted,
      timestamp: new Date().toISOString(),
      userId,
      direction: 'DEBIT',
      narration: `${currency} Withdrawal to ${params.destinationRef || 'External Account'}`,
    };

    this.recordIdempotency(key, userId, 'WITHDRAWAL', params, result);
    return result;
  }

  /**
   * Executes a simulated internal transfer between two users in the same currency.
   * Debits Sender Customer Liability, Credits Receiver Customer Liability in ONE balanced entry.
   */
  public async executeInternalTransfer(params: {
    senderUserId: string;
    recipientEmailOrId: string;
    currency: string;
    amountDecimal: string;
    idempotencyKey?: string;
    note?: string;
  }): Promise<FinancialOperationResult> {
    const { senderUserId, recipientEmailOrId, currency, amountDecimal } = params;
    const key = params.idempotencyKey || `idem_trf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Check Idempotency
    const cached = this.checkIdempotency(key, senderUserId, 'TRANSFER', params);
    if (cached) return cached;

    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency corridor: ${currency}`);
    }
    this.assertCurrencyAllowedForCustomer(senderUserId, currency);

    const money = Money.fromDecimalString(amountDecimal, currency);
    if (!money.isPositive()) {
      throw new Error('Transfer amount must be strictly greater than zero.');
    }

    const senderWallet = this.getOrCreateUserWallet(senderUserId);
    const senderAccount = senderWallet.accounts.find((a) => a.currency === currency);
    if (!senderAccount) {
      throw new Error(`Sender does not have an active ${currency} wallet.`);
    }

    // Check Sender Balance
    const senderBalance = defaultLedgerService.getAccountBalance(senderAccount.ledgerAccountId);
    if (senderBalance.balanceMinor < money.amountMinor) {
      throw new Error(
        `Insufficient available balance for transfer. Available: ${senderBalance.formatted}`
      );
    }

    // Resolve Recipient
    const recipientWallet = this.resolveRecipientWallet(recipientEmailOrId);
    if (recipientWallet.userId === senderUserId) {
      throw new Error('Sender and recipient cannot be the same user for an internal transfer.');
    }

    const recipientAccount = recipientWallet.accounts.find((a) => a.currency === currency);
    if (!recipientAccount) {
      throw new Error(`Recipient does not have a ${currency} wallet account.`);
    }

    const txId = `tx_sim_trf_${Date.now()}`;
    const refNum = `TRF-${currency}-${Date.now().toString().slice(-6)}`;

    // Atomic double-entry journal entry:
    // DEBIT: Sender Customer Liability (reduces liability to sender)
    // CREDIT: Recipient Customer Liability (increases liability to recipient)
    const lines: LedgerLineInput[] = [
      {
        accountId: senderAccount.ledgerAccountId,
        direction: 'DEBIT',
        amountMinor: money.amountMinor,
        description: `Transfer to ${recipientWallet.name}: ${params.note || 'No note'}`,
      },
      {
        accountId: recipientAccount.ledgerAccountId,
        direction: 'CREDIT',
        amountMinor: money.amountMinor,
        description: `Transfer from ${senderWallet.name}: ${params.note || 'No note'}`,
      },
    ];

    assertDoubleEntryInvariant(lines);

    const entry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency,
      narration: `Internal P2P Transfer [${refNum}]`,
      lines,
    });

    const newSenderBalance = defaultLedgerService.getAccountBalance(senderAccount.ledgerAccountId);
    const newRecipientBalance = defaultLedgerService.getAccountBalance(recipientAccount.ledgerAccountId);
    const timestamp = new Date().toISOString();

    const result: FinancialOperationResult = {
      transactionId: txId,
      referenceNumber: refNum,
      operationType: 'INTERNAL_TRANSFER',
      status: 'POSTED',
      currency,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      journalEntryId: entry.id,
      senderAccountId: senderAccount.ledgerAccountId,
      recipientAccountId: recipientAccount.ledgerAccountId,
      idempotencyKey: key,
      isSimulated: true,
      authoritativeBalance: newSenderBalance.formatted,
      timestamp,
      userId: senderUserId,
      direction: 'DEBIT',
      counterparty: recipientEmailOrId,
      narration: params.note || `Internal transfer to ${recipientEmailOrId}`,
    };

    this.recordIdempotency(key, senderUserId, 'TRANSFER', params, result);

    // Recipient mirror so the credit appears in their (and admin) transaction history.
    this.recordTransaction({
      transactionId: `${txId}_rcv`,
      referenceNumber: refNum,
      operationType: 'INTERNAL_TRANSFER',
      status: 'POSTED',
      currency,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      journalEntryId: entry.id,
      senderAccountId: senderAccount.ledgerAccountId,
      recipientAccountId: recipientAccount.ledgerAccountId,
      idempotencyKey: `${key}_rcv`,
      isSimulated: true,
      authoritativeBalance: newRecipientBalance.formatted,
      timestamp,
      userId: recipientWallet.userId,
      direction: 'CREDIT',
      counterparty: senderWallet.name || senderUserId,
      narration: params.note || `Internal transfer from ${senderWallet.name || senderUserId}`,
    });

    const amountStr = money.toDecimalString();
    const senderUser = defaultAuthService.getUserById(senderUserId);
    const recipientUser = defaultAuthService.getUserById(recipientWallet.userId);
    if (senderUser) {
      voidEmail(
        'transfer-sent',
        defaultEmailService.sendTransferSentEmail({
          to: senderUser.email,
          fullName: senderUser.fullName,
          amount: amountStr,
          currency,
          recipient: recipientUser?.fullName || recipientUser?.email || recipientEmailOrId,
          reference: refNum,
        }),
      );
    }
    if (recipientUser) {
      voidEmail(
        'transfer-received',
        defaultEmailService.sendTransferReceivedEmail({
          to: recipientUser.email,
          fullName: recipientUser.fullName,
          amount: amountStr,
          currency,
          sender: senderUser?.fullName || senderUser?.email || senderWallet.name || senderUserId,
          reference: refNum,
        }),
      );
    }

    return result;
  }

  /**
   * Generates an illustrative, short-lived FX quote.
   */
  public generateFxQuote(params: {
    userId: string;
    sourceCurrency: string;
    destinationCurrency: string;
    sourceAmountDecimal: string;
  }): FxQuoteRecord {
    const { userId, sourceCurrency, destinationCurrency, sourceAmountDecimal } = params;

    if (sourceCurrency === destinationCurrency) {
      throw new Error('Source and destination currencies must be different.');
    }
    if (!isSupportedCurrency(sourceCurrency) || !isSupportedCurrency(destinationCurrency)) {
      throw new Error('Unsupported currency in conversion pair.');
    }
    this.assertCurrencyAllowedForCustomer(userId, sourceCurrency);
    this.assertCurrencyAllowedForCustomer(userId, destinationCurrency);

    const srcMoney = Money.fromDecimalString(sourceAmountDecimal, sourceCurrency);
    if (!srcMoney.isPositive()) {
      throw new Error('Conversion amount must be strictly greater than zero.');
    }

    const rate = this.resolveIllustrativeRate(sourceCurrency, destinationCurrency);

    const destCurrencyDef = getCurrency(destinationCurrency);
    const srcCurrencyDef = getCurrency(sourceCurrency);

    // Calculate destination amount without float drift:
    // Scale source minor units by rate considering difference in minor units
    // Formula: destMinor = (srcMinor * rate * (10^destMinorUnits)) / (10^srcMinorUnits)
    const rateScaled = BigInt(Math.round(rate * 100000000));
    const factorDest = 10n ** BigInt(destCurrencyDef.minorUnits);
    const factorSrc = 10n ** BigInt(srcCurrencyDef.minorUnits);

    const grossDestMinor = (srcMoney.amountMinor * rateScaled * factorDest) / (factorSrc * 100000000n);

    // 0.5% conversion spread fee
    const feeMinor = grossDestMinor / 200n;
    const netDestMinor = grossDestMinor - feeMinor;

    const quoteRecord: FxQuoteRecord = {
      id: `quote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      sourceCurrency,
      destinationCurrency,
      sourceAmountMinor: srcMoney.amountMinor.toString(),
      destinationAmountMinor: netDestMinor.toString(),
      exchangeRate: rate.toString(),
      feeMinor: feeMinor.toString(),
      rateSource: 'SIMULATED_REFERENCE_RATE',
      expiresAt: new Date(Date.now() + 60 * 1000), // 60 seconds TTL
      isExecuted: false,
      createdAt: new Date(),
    };

    this.quotes.set(quoteRecord.id, quoteRecord);
    return quoteRecord;
  }

  /**
   * Executes an illustrative currency conversion against a valid, unexpired quote.
   */
  public async executeFxConversion(params: {
    userId: string;
    quoteId: string;
    idempotencyKey?: string;
  }): Promise<FinancialOperationResult> {
    const { userId, quoteId } = params;
    const key = params.idempotencyKey || `idem_fx_${quoteId}`;

    const cached = this.checkIdempotency(key, userId, 'FX_CONVERSION', params);
    if (cached) return cached;

    const quote = this.quotes.get(quoteId);
    if (!quote) {
      throw new Error('Quote not found or invalid.');
    }
    if (quote.userId !== userId) {
      throw new Error('Access denied: quote does not belong to this user.');
    }
    if (quote.isExecuted) {
      throw new Error('This FX quote has already been executed.');
    }
    if (quote.expiresAt < new Date()) {
      throw new Error('FX quote has expired. Please request a fresh quote.');
    }

    const wallet = this.getOrCreateUserWallet(userId);
    const srcAccount = wallet.accounts.find((a) => a.currency === quote.sourceCurrency);
    const destAccount = wallet.accounts.find((a) => a.currency === quote.destinationCurrency);

    if (!srcAccount || !destAccount) {
      throw new Error('Required currency wallet account not found.');
    }

    const srcMinor = BigInt(quote.sourceAmountMinor);
    const destMinor = BigInt(quote.destinationAmountMinor);

    // Balance check
    const srcBalance = defaultLedgerService.getAccountBalance(srcAccount.ledgerAccountId);
    if (srcBalance.balanceMinor < srcMinor) {
      throw new Error(
        `Insufficient available ${quote.sourceCurrency} funds for conversion. Available: ${srcBalance.formatted}`
      );
    }

    // Mark quote as executed
    quote.isExecuted = true;

    const txId = `tx_sim_fx_${Date.now()}`;
    const refNum = `FX-${quote.sourceCurrency}${quote.destinationCurrency}-${Date.now().toString().slice(-6)}`;

    // Leg 1: Source Currency Balanced Journal Entry
    // DEBIT: Customer Source Liability (reduces customer source balance)
    // CREDIT: Safeguarding Source Asset
    const leg1Lines: LedgerLineInput[] = [
      {
        accountId: srcAccount.ledgerAccountId,
        direction: 'DEBIT',
        amountMinor: srcMinor,
        description: `FX conversion out: ${refNum}`,
      },
      {
        accountId: this.getSafeguardingAccountId(quote.sourceCurrency),
        direction: 'CREDIT',
        amountMinor: srcMinor,
        description: `FX clearing outbound: ${refNum}`,
      },
    ];
    assertDoubleEntryInvariant(leg1Lines);

    defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency: quote.sourceCurrency,
      narration: `FX Outbound Leg [${refNum}]`,
      lines: leg1Lines,
    });

    // Leg 2: Destination Currency Balanced Journal Entry
    // DEBIT: Safeguarding Dest Asset
    // CREDIT: Customer Dest Liability (increases customer dest balance)
    const leg2Lines: LedgerLineInput[] = [
      {
        accountId: this.getSafeguardingAccountId(quote.destinationCurrency),
        direction: 'DEBIT',
        amountMinor: destMinor,
        description: `FX clearing inbound: ${refNum}`,
      },
      {
        accountId: destAccount.ledgerAccountId,
        direction: 'CREDIT',
        amountMinor: destMinor,
        description: `FX conversion credit: ${refNum}`,
      },
    ];
    assertDoubleEntryInvariant(leg2Lines);

    const entry2 = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency: quote.destinationCurrency,
      narration: `FX Inbound Leg [${refNum}]`,
      lines: leg2Lines,
    });

    const newDestBalance = defaultLedgerService.getAccountBalance(destAccount.ledgerAccountId);
    const destMoney = Money.fromMinor(destMinor, quote.destinationCurrency);

    const result: FinancialOperationResult = {
      transactionId: txId,
      referenceNumber: refNum,
      operationType: 'FX_CONVERSION',
      status: 'POSTED',
      currency: quote.destinationCurrency,
      amountMinor: destMinor.toString(),
      formattedAmount: destMoney.toDisplayString(),
      journalEntryId: entry2.id,
      senderAccountId: srcAccount.ledgerAccountId,
      recipientAccountId: destAccount.ledgerAccountId,
      idempotencyKey: key,
      isSimulated: true,
      authoritativeBalance: newDestBalance.formatted,
      timestamp: new Date().toISOString(),
      userId,
      direction: 'CREDIT',
      counterparty: `${quote.sourceCurrency} -> ${quote.destinationCurrency}`,
      narration: `FX Conversion: ${quote.sourceCurrency} to ${quote.destinationCurrency} @ ${quote.exchangeRate}`,
    };

    this.recordIdempotency(key, userId, 'FX_CONVERSION', params, result);

    const fxUser = defaultAuthService.getUserById(userId);
    if (fxUser) {
      const srcMoney = Money.fromMinor(srcMinor, quote.sourceCurrency);
      voidEmail(
        'fx-converted',
        defaultEmailService.sendFxConvertedEmail({
          to: fxUser.email,
          fullName: fxUser.fullName,
          fromAmount: srcMoney.toDecimalString(),
          fromCurrency: quote.sourceCurrency,
          toAmount: destMoney.toDecimalString(),
          toCurrency: quote.destinationCurrency,
          rate: quote.exchangeRate,
        }),
      );
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------

  private getSafeguardingAccountId(currency: string): string {
    switch (currency) {
      case 'USD':
        return 'acc_safeguarding_cash_usd';
      case 'EUR':
        return 'acc_safeguarding_cash_eur';
      case 'BRL':
        return 'acc_safeguarding_cash_brl';
      case 'BTC':
        return 'acc_safeguarding_crypto_btc';
      default:
        return defaultLedgerService.ensureSafeguardingAssetAccount(currency).id;
    }
  }

  private getCustomerHoldLedgerAccountId(userId: string, currency: string, fullName?: string): string {
    this.getOrCreateUserWallet(userId, fullName);
    const holdAcc = defaultLedgerService.getUserAccounts(userId).find(
      (a) => a.currency === currency && a.classification === 'CUSTOMER_PENDING_HOLD',
    );
    if (!holdAcc) {
      throw new Error(`Pending hold account not provisioned for ${currency}.`);
    }
    return holdAcc.id;
  }

  private getCustomerAvailableLedgerAccountId(userId: string, currency: string, fullName?: string): string {
    const wallet = this.getOrCreateUserWallet(userId, fullName);
    const target = wallet.accounts.find((a) => a.currency === currency);
    if (!target) {
      throw new Error(`Wallet account not found for currency ${currency}`);
    }
    return target.ledgerAccountId;
  }

  /**
   * Records an inbound deposit on the customer's pending-hold liability until operations approves it.
   * DEBIT safeguarding asset, CREDIT customer pending hold (not available balance).
   */
  public async requestPendingDeposit(params: {
    userId: string;
    currency: string;
    amountDecimal: string;
    kind: PendingDepositKind;
    sourceRail?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
  }): Promise<PendingDepositRecord> {
    const currency = params.currency.toUpperCase();
    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency corridor: ${currency}`);
    }
    this.assertCurrencyAllowedForCustomer(params.userId, currency);

    const money = Money.fromDecimalString(params.amountDecimal, currency);
    if (!money.isPositive()) {
      throw new Error('Deposit amount must be strictly greater than zero.');
    }

    if (params.kind === 'BTC') {
      if (!params.fileName || !params.mimeType || params.fileSize === undefined) {
        throw new Error('Bitcoin deposit proof metadata is required.');
      }
      if (!params.mimeType.startsWith('image/')) {
        throw new Error('Payment proof must be an image (JPEG, PNG, or WebP).');
      }
      if (params.fileSize > 10 * 1024 * 1024) {
        throw new Error('Payment proof image must be 10 MB or smaller.');
      }
    }

    if (params.kind === 'FIAT' && params.sourceRail) {
      this.assertFiatDepositRailAllowed(params.userId, params.sourceRail);
    }

    const safeguardingAccountId = this.getSafeguardingAccountId(currency);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(params.userId, currency);
    const txId = `tx_dep_hold_${Date.now()}`;
    const refNum = `DEP-HOLD-${currency}-${Date.now().toString().slice(-6)}`;

    const lines: LedgerLineInput[] = [
      {
        accountId: safeguardingAccountId,
        direction: 'DEBIT',
        amountMinor: money.amountMinor,
        description: `${params.kind === 'BTC' ? 'BTC' : params.sourceRail || 'WIRE'} inbound pending clearance`,
      },
      {
        accountId: holdAccountId,
        direction: 'CREDIT',
        amountMinor: money.amountMinor,
        description: `Customer deposit pending review: ${refNum}`,
      },
    ];
    assertDoubleEntryInvariant(lines);

    const entry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency,
      narration: `Pending deposit hold (${params.kind}) [${refNum}]`,
      lines,
    });

    const record: PendingDepositRecord = {
      id: `dep_pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: params.userId,
      kind: params.kind,
      currency,
      amountDecimal: params.amountDecimal,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      sourceRail: params.sourceRail,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      storageRef:
        params.kind === 'BTC'
          ? `vault://deposits/btc/${params.userId}/${Date.now()}.enc`
          : undefined,
      submittedAt: new Date(),
      status: 'PENDING_REVIEW',
      holdJournalEntryId: entry.id,
      referenceNumber: refNum,
      origin: 'CUSTOMER',
    };
    this.pendingDeposits.push(record);
    this.recordPendingDepositHistory(record, entry.id, txId);

    defaultAuditService.logAction({
      action: params.kind === 'BTC' ? 'BTC_DEPOSIT_PROOF_SUBMITTED' : 'FIAT_DEPOSIT_REQUESTED',
      actorUserId: params.userId,
      actorRole: 'CUSTOMER',
      resourceType: 'WALLET_DEPOSIT',
      resourceId: record.id,
      details: {
        currency,
        amountDecimal: params.amountDecimal,
        referenceNumber: refNum,
        sourceRail: params.sourceRail,
        fileName: params.fileName,
      },
    });

    const depositUser = defaultAuthService.getUserById(params.userId);
    if (depositUser) {
      const amountStr = money.toDecimalString();
      voidEmail(
        'deposit-requested',
        defaultEmailService.sendDepositRequestedEmail({
          to: depositUser.email,
          fullName: depositUser.fullName,
          amount: amountStr,
          currency,
          reference: refNum,
        }),
      );
      voidEmail(
        'deposit-staff',
        defaultEmailService.sendDepositStaffEmail({
          customerName: depositUser.fullName,
          amount: amountStr,
          currency,
          depositId: record.id,
        }),
      );
    }

    return record;
  }

  public getPendingDepositsForAdmin(params: {
    actorRole: UserRole;
    status?: PendingDepositStatus;
  }): PendingDepositRecord[] {
    const allowed: UserRole[] = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(params.actorRole)) {
      throw new Error('Access denied: Staff role required.');
    }
    const status = params.status ?? 'PENDING_REVIEW';
    return this.pendingDeposits
      .filter((d) => d.status === status)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  public approvePendingDeposit(params: {
    depositId: string;
    actorUserId: string;
    actorRole: UserRole;
    notes?: string;
  }): PendingDepositRecord {
    const allowed: UserRole[] = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(params.actorRole)) {
      throw new Error('Access denied: Staff role required.');
    }

    const record = this.pendingDeposits.find((d) => d.id === params.depositId);
    if (!record) {
      throw new Error('Pending deposit not found.');
    }
    if (record.status !== 'PENDING_REVIEW') {
      throw new Error(`Deposit is already ${record.status}.`);
    }

    const amountMinor = BigInt(record.amountMinor);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(record.userId, record.currency);
    const availAccountId = this.getCustomerAvailableLedgerAccountId(record.userId, record.currency);
    const txId = `tx_dep_release_${Date.now()}`;
    const refNum = `DEP-APPR-${record.currency}-${Date.now().toString().slice(-6)}`;

    const lines: LedgerLineInput[] = [
      {
        accountId: holdAccountId,
        direction: 'DEBIT',
        amountMinor,
        description: `Release pending deposit to available: ${record.referenceNumber}`,
      },
      {
        accountId: availAccountId,
        direction: 'CREDIT',
        amountMinor,
        description: `Approved deposit credit: ${refNum}`,
      },
    ];
    assertDoubleEntryInvariant(lines);

    const releaseEntry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency: record.currency,
      narration: `Deposit approved — hold released to available [${refNum}]`,
      lines,
    });

    record.status = 'APPROVED';
    record.reviewedAt = new Date();
    record.reviewedByUserId = params.actorUserId;
    record.reviewNotes = params.notes;
    record.releaseJournalEntryId = releaseEntry.id;

    const availBalance = defaultLedgerService.getAccountBalance(availAccountId);
    this.updateHistoryByReference(
      record.userId,
      record.referenceNumber,
      {
        status: 'POSTED',
        journalEntryId: releaseEntry.id,
        transactionId: txId,
        authoritativeBalance: availBalance.formatted,
        narration: `${record.currency} deposit approved via ${record.sourceRail || record.kind}`,
        timestamp: new Date().toISOString(),
      },
      {
        transactionId: txId,
        operationType: 'SIMULATED_DEPOSIT',
        status: 'POSTED',
        currency: record.currency,
        amountMinor: record.amountMinor,
        formattedAmount: record.formattedAmount,
        journalEntryId: releaseEntry.id,
        idempotencyKey: `idem_${record.id}`,
        isSimulated: true,
        authoritativeBalance: availBalance.formatted,
        timestamp: new Date().toISOString(),
        direction: 'CREDIT',
        narration: `${record.currency} deposit approved via ${record.sourceRail || record.kind}`,
      },
    );

    defaultAuditService.logAction({
      action: 'DEPOSIT_APPROVED',
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: 'WALLET_DEPOSIT',
      resourceId: record.id,
      details: {
        referenceNumber: record.referenceNumber,
        releaseJournalEntryId: releaseEntry.id,
        notes: params.notes,
      },
    });

    const approvedUser = defaultAuthService.getUserById(record.userId);
    if (approvedUser) {
      voidEmail(
        'deposit-approved',
        defaultEmailService.sendDepositApprovedEmail({
          to: approvedUser.email,
          fullName: approvedUser.fullName,
          amount: record.amountDecimal,
          currency: record.currency,
          reference: record.referenceNumber,
        }),
      );
    }

    return record;
  }

  public rejectPendingDeposit(params: {
    depositId: string;
    actorUserId: string;
    actorRole: UserRole;
    reason: string;
  }): PendingDepositRecord {
    const allowed: UserRole[] = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(params.actorRole)) {
      throw new Error('Access denied: Staff role required.');
    }
    if (!params.reason.trim()) {
      throw new Error('Rejection reason is required.');
    }

    const record = this.pendingDeposits.find((d) => d.id === params.depositId);
    if (!record) {
      throw new Error('Pending deposit not found.');
    }
    if (record.status !== 'PENDING_REVIEW') {
      throw new Error(`Deposit is already ${record.status}.`);
    }

    const amountMinor = BigInt(record.amountMinor);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(record.userId, record.currency);
    const safeguardingAccountId = this.getSafeguardingAccountId(record.currency);
    const txId = `tx_dep_reject_${Date.now()}`;
    const refNum = `DEP-REJ-${record.currency}-${Date.now().toString().slice(-6)}`;

    const lines: LedgerLineInput[] = [
      {
        accountId: holdAccountId,
        direction: 'DEBIT',
        amountMinor,
        description: `Reverse pending deposit hold: ${record.referenceNumber}`,
      },
      {
        accountId: safeguardingAccountId,
        direction: 'CREDIT',
        amountMinor,
        description: `Reject inbound deposit clearance: ${refNum}`,
      },
    ];
    assertDoubleEntryInvariant(lines);

    const releaseEntry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency: record.currency,
      narration: `Deposit rejected — hold reversed [${refNum}]`,
      lines,
    });

    record.status = 'REJECTED';
    record.reviewedAt = new Date();
    record.reviewedByUserId = params.actorUserId;
    record.reviewNotes = params.reason.trim();
    record.releaseJournalEntryId = releaseEntry.id;

    this.updateHistoryByReference(
      record.userId,
      record.referenceNumber,
      {
        status: 'REVERSED',
        journalEntryId: releaseEntry.id,
        transactionId: txId,
        narration: `${record.currency} deposit rejected — ${params.reason.trim()}`,
        timestamp: new Date().toISOString(),
      },
      {
        transactionId: txId,
        operationType: 'SIMULATED_DEPOSIT',
        status: 'REVERSED',
        currency: record.currency,
        amountMinor: record.amountMinor,
        formattedAmount: record.formattedAmount,
        journalEntryId: releaseEntry.id,
        idempotencyKey: `idem_${record.id}`,
        isSimulated: true,
        authoritativeBalance: '—',
        timestamp: new Date().toISOString(),
        direction: 'CREDIT',
        narration: `${record.currency} deposit rejected — ${params.reason.trim()}`,
      },
    );

    defaultAuditService.logAction({
      action: 'DEPOSIT_REJECTED',
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: 'WALLET_DEPOSIT',
      resourceId: record.id,
      details: {
        referenceNumber: record.referenceNumber,
        reason: params.reason.trim(),
        releaseJournalEntryId: releaseEntry.id,
      },
    });

    const rejectedUser = defaultAuthService.getUserById(record.userId);
    if (rejectedUser) {
      voidEmail(
        'deposit-rejected',
        defaultEmailService.sendDepositRejectedEmail({
          to: rejectedUser.email,
          fullName: rejectedUser.fullName,
          amount: record.amountDecimal,
          currency: record.currency,
          reason: params.reason.trim(),
        }),
      );
    }

    return record;
  }

  /**
   * Reserves withdrawal amount from available balance onto pending hold until operations approves payout.
   * DEBIT customer available, CREDIT customer pending hold.
   */
  public async requestPendingWithdrawal(params: {
    userId: string;
    currency: string;
    amountDecimal: string;
    kind: PendingWithdrawalKind;
    destinationRail?: string;
    bankingDetails?: Record<string, string>;
    btcAddress?: string;
  }): Promise<PendingWithdrawalRecord> {
    const currency = params.currency.toUpperCase();
    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency corridor: ${currency}`);
    }
    this.assertCurrencyAllowedForCustomer(params.userId, currency);

    const money = Money.fromDecimalString(params.amountDecimal, currency);
    if (!money.isPositive()) {
      throw new Error('Withdrawal amount must be strictly greater than zero.');
    }

    const bankingDetails = { ...(params.bankingDetails ?? {}) };

    if (params.kind === 'BTC') {
      if (!params.btcAddress?.trim()) {
        throw new Error('Bitcoin withdrawal address is required.');
      }
      validateBtcWithdrawalAddress(params.btcAddress);
    } else {
      if (!params.destinationRail?.trim()) {
        throw new Error('Select a local withdrawal method.');
      }
      this.assertFiatWithdrawalRailAllowed(params.userId, params.destinationRail);
      validateWithdrawalBankingDetails(params.destinationRail, bankingDetails);
    }

    const availAccountId = this.getCustomerAvailableLedgerAccountId(params.userId, currency);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(params.userId, currency);

    const currentBalance = defaultLedgerService.getAccountBalance(availAccountId);
    if (currentBalance.balanceMinor < money.amountMinor) {
      throw new Error(
        `Insufficient available funds. Required: ${money.toDisplayString()}, Available: ${currentBalance.formatted}`,
      );
    }

    const txId = `tx_wth_hold_${Date.now()}`;
    const refNum = `WTH-HOLD-${currency}-${Date.now().toString().slice(-6)}`;

    const lines: LedgerLineInput[] = [
      {
        accountId: availAccountId,
        direction: 'DEBIT',
        amountMinor: money.amountMinor,
        description: `Withdrawal reservation from available: ${refNum}`,
      },
      {
        accountId: holdAccountId,
        direction: 'CREDIT',
        amountMinor: money.amountMinor,
        description: `Outbound withdrawal pending review: ${refNum}`,
      },
    ];
    assertDoubleEntryInvariant(lines);

    const entry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency,
      narration: `Pending withdrawal hold (${params.kind}) [${refNum}]`,
      lines,
    });

    const record: PendingWithdrawalRecord = {
      id: `wth_pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: params.userId,
      kind: params.kind,
      currency,
      amountDecimal: params.amountDecimal,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      destinationRail: params.destinationRail?.trim().toUpperCase(),
      bankingDetails,
      btcAddress: params.btcAddress?.trim(),
      submittedAt: new Date(),
      status: 'PENDING_REVIEW',
      holdJournalEntryId: entry.id,
      referenceNumber: refNum,
      origin: 'CUSTOMER',
    };
    this.pendingWithdrawals.push(record);
    this.recordPendingWithdrawalHistory(record, entry.id, txId);

    defaultAuditService.logAction({
      action: params.kind === 'BTC' ? 'BTC_WITHDRAWAL_REQUESTED' : 'FIAT_WITHDRAWAL_REQUESTED',
      actorUserId: params.userId,
      actorRole: 'CUSTOMER',
      resourceType: 'WALLET_WITHDRAWAL',
      resourceId: record.id,
      details: {
        currency,
        amountDecimal: params.amountDecimal,
        referenceNumber: refNum,
        destinationRail: record.destinationRail,
        btcAddress: record.btcAddress,
        bankingDetails,
      },
    });

    const withdrawalUser = defaultAuthService.getUserById(params.userId);
    if (withdrawalUser) {
      const amountStr = money.toDecimalString();
      voidEmail(
        'withdrawal-requested',
        defaultEmailService.sendWithdrawalRequestedEmail({
          to: withdrawalUser.email,
          fullName: withdrawalUser.fullName,
          amount: amountStr,
          currency,
          reference: refNum,
        }),
      );
      voidEmail(
        'withdrawal-staff',
        defaultEmailService.sendWithdrawalStaffEmail({
          customerName: withdrawalUser.fullName,
          amount: amountStr,
          currency,
          withdrawalId: record.id,
        }),
      );
    }

    return record;
  }

  public getPendingWithdrawalsForAdmin(params: {
    actorRole: UserRole;
    status?: PendingWithdrawalStatus;
  }): PendingWithdrawalRecord[] {
    const allowed: UserRole[] = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(params.actorRole)) {
      throw new Error('Access denied: Staff role required.');
    }
    const status = params.status ?? 'PENDING_REVIEW';
    return this.pendingWithdrawals
      .filter((w) => w.status === status)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  public approvePendingWithdrawal(params: {
    withdrawalId: string;
    actorUserId: string;
    actorRole: UserRole;
    notes?: string;
  }): PendingWithdrawalRecord {
    const allowed: UserRole[] = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(params.actorRole)) {
      throw new Error('Access denied: Staff role required.');
    }

    const record = this.pendingWithdrawals.find((w) => w.id === params.withdrawalId);
    if (!record) {
      throw new Error('Pending withdrawal not found.');
    }
    if (record.status !== 'PENDING_REVIEW') {
      throw new Error(`Withdrawal is already ${record.status}.`);
    }

    const amountMinor = BigInt(record.amountMinor);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(record.userId, record.currency);
    const safeguardingAccountId = this.getSafeguardingAccountId(record.currency);
    const txId = `tx_wth_release_${Date.now()}`;
    const refNum = `WTH-APPR-${record.currency}-${Date.now().toString().slice(-6)}`;
    const payoutRef =
      record.kind === 'BTC'
        ? record.btcAddress
        : Object.entries(record.bankingDetails)
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');

    const lines: LedgerLineInput[] = [
      {
        accountId: holdAccountId,
        direction: 'DEBIT',
        amountMinor,
        description: `Release withdrawal hold for payout: ${record.referenceNumber}`,
      },
      {
        accountId: safeguardingAccountId,
        direction: 'CREDIT',
        amountMinor,
        description: `Disbursement to ${payoutRef || 'external account'}`,
      },
    ];
    assertDoubleEntryInvariant(lines);

    const releaseEntry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency: record.currency,
      narration: `Withdrawal approved — payout from hold [${refNum}]`,
      lines,
    });

    record.status = 'APPROVED';
    record.reviewedAt = new Date();
    record.reviewedByUserId = params.actorUserId;
    record.reviewNotes = params.notes;
    record.releaseJournalEntryId = releaseEntry.id;

    const availBalance = defaultLedgerService.getAccountBalance(
      this.getCustomerAvailableLedgerAccountId(record.userId, record.currency),
    );
    this.updateHistoryByReference(
      record.userId,
      record.referenceNumber,
      {
        status: 'POSTED',
        journalEntryId: releaseEntry.id,
        transactionId: txId,
        authoritativeBalance: availBalance.formatted,
        narration: `${record.currency} withdrawal paid out via ${record.destinationRail || record.kind}`,
        timestamp: new Date().toISOString(),
      },
      {
        transactionId: txId,
        operationType: 'SIMULATED_WITHDRAWAL',
        status: 'POSTED',
        currency: record.currency,
        amountMinor: record.amountMinor,
        formattedAmount: record.formattedAmount,
        journalEntryId: releaseEntry.id,
        idempotencyKey: `idem_${record.id}`,
        isSimulated: true,
        authoritativeBalance: availBalance.formatted,
        timestamp: new Date().toISOString(),
        direction: 'DEBIT',
        narration: `${record.currency} withdrawal paid out via ${record.destinationRail || record.kind}`,
      },
    );

    defaultAuditService.logAction({
      action: 'WITHDRAWAL_APPROVED',
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: 'WALLET_WITHDRAWAL',
      resourceId: record.id,
      details: {
        referenceNumber: record.referenceNumber,
        releaseJournalEntryId: releaseEntry.id,
        notes: params.notes,
      },
    });

    const approvedWthUser = defaultAuthService.getUserById(record.userId);
    if (approvedWthUser) {
      voidEmail(
        'withdrawal-approved',
        defaultEmailService.sendWithdrawalApprovedEmail({
          to: approvedWthUser.email,
          fullName: approvedWthUser.fullName,
          amount: record.amountDecimal,
          currency: record.currency,
        }),
      );
    }

    return record;
  }

  public rejectPendingWithdrawal(params: {
    withdrawalId: string;
    actorUserId: string;
    actorRole: UserRole;
    reason: string;
  }): PendingWithdrawalRecord {
    const allowed: UserRole[] = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(params.actorRole)) {
      throw new Error('Access denied: Staff role required.');
    }
    if (!params.reason.trim()) {
      throw new Error('Rejection reason is required.');
    }

    const record = this.pendingWithdrawals.find((w) => w.id === params.withdrawalId);
    if (!record) {
      throw new Error('Pending withdrawal not found.');
    }
    if (record.status !== 'PENDING_REVIEW') {
      throw new Error(`Withdrawal is already ${record.status}.`);
    }

    const amountMinor = BigInt(record.amountMinor);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(record.userId, record.currency);
    const availAccountId = this.getCustomerAvailableLedgerAccountId(record.userId, record.currency);
    const txId = `tx_wth_reject_${Date.now()}`;
    const refNum = `WTH-REJ-${record.currency}-${Date.now().toString().slice(-6)}`;

    const lines: LedgerLineInput[] = [
      {
        accountId: holdAccountId,
        direction: 'DEBIT',
        amountMinor,
        description: `Cancel pending withdrawal hold: ${record.referenceNumber}`,
      },
      {
        accountId: availAccountId,
        direction: 'CREDIT',
        amountMinor,
        description: `Return funds to available: ${refNum}`,
      },
    ];
    assertDoubleEntryInvariant(lines);

    const releaseEntry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency: record.currency,
      narration: `Withdrawal rejected — hold returned to available [${refNum}]`,
      lines,
    });

    record.status = 'REJECTED';
    record.reviewedAt = new Date();
    record.reviewedByUserId = params.actorUserId;
    record.reviewNotes = params.reason.trim();
    record.releaseJournalEntryId = releaseEntry.id;

    const availBalance = defaultLedgerService.getAccountBalance(availAccountId);
    this.updateHistoryByReference(
      record.userId,
      record.referenceNumber,
      {
        status: 'REVERSED',
        journalEntryId: releaseEntry.id,
        transactionId: txId,
        authoritativeBalance: availBalance.formatted,
        narration: `${record.currency} withdrawal cancelled — funds returned`,
        timestamp: new Date().toISOString(),
      },
      {
        transactionId: txId,
        operationType: 'SIMULATED_WITHDRAWAL',
        status: 'REVERSED',
        currency: record.currency,
        amountMinor: record.amountMinor,
        formattedAmount: record.formattedAmount,
        journalEntryId: releaseEntry.id,
        idempotencyKey: `idem_${record.id}`,
        isSimulated: true,
        authoritativeBalance: availBalance.formatted,
        timestamp: new Date().toISOString(),
        direction: 'DEBIT',
        narration: `${record.currency} withdrawal cancelled — funds returned`,
      },
    );

    defaultAuditService.logAction({
      action: 'WITHDRAWAL_REJECTED',
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: 'WALLET_WITHDRAWAL',
      resourceId: record.id,
      details: {
        referenceNumber: record.referenceNumber,
        reason: params.reason.trim(),
        releaseJournalEntryId: releaseEntry.id,
      },
    });

    const rejectedWthUser = defaultAuthService.getUserById(record.userId);
    if (rejectedWthUser) {
      voidEmail(
        'withdrawal-rejected',
        defaultEmailService.sendWithdrawalRejectedEmail({
          to: rejectedWthUser.email,
          fullName: rejectedWthUser.fullName,
          amount: record.amountDecimal,
          currency: record.currency,
          reason: params.reason.trim(),
        }),
      );
    }

    return record;
  }

  /**
   * Admin-initiated funding adjustment: CREDIT queues a pending deposit hold;
   * DEBIT queues a pending withdrawal hold. Both require a documented reason and
   * still need approve/reject via the existing ops queues.
   */
  public async adminRequestFundingAdjustment(params: {
    targetUserId: string;
    direction: 'CREDIT' | 'DEBIT';
    currency: string;
    amountDecimal: string;
    reason: string;
    actorUserId: string;
    actorRole: UserRole;
  }): Promise<
    | { direction: 'CREDIT'; deposit: PendingDepositRecord }
    | { direction: 'DEBIT'; withdrawal: PendingWithdrawalRecord }
  > {
    const allowed: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(params.actorRole)) {
      throw new Error('Access denied: ADMIN or SUPER_ADMIN role required.');
    }

    const reason = params.reason.trim();
    if (reason.length < 3) {
      throw new Error('A documented reason of at least 3 characters is required.');
    }

    const target = defaultAuthService.getUserById(params.targetUserId);
    if (!target) {
      throw new Error('Customer not found.');
    }
    if (target.role !== 'CUSTOMER') {
      throw new Error('Funding adjustments are only allowed for customer accounts.');
    }

    const currency = params.currency.toUpperCase();
    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency corridor: ${currency}`);
    }
    this.assertCurrencyAllowedForCustomer(params.targetUserId, currency);

    const money = Money.fromDecimalString(params.amountDecimal, currency);
    if (!money.isPositive()) {
      throw new Error('Amount must be strictly greater than zero.');
    }

    if (params.direction === 'CREDIT') {
      const safeguardingAccountId = this.getSafeguardingAccountId(currency);
      const holdAccountId = this.getCustomerHoldLedgerAccountId(params.targetUserId, currency);
      const txId = `tx_dep_hold_${Date.now()}`;
      const refNum = `DEP-HOLD-${currency}-${Date.now().toString().slice(-6)}`;

      const lines: LedgerLineInput[] = [
        {
          accountId: safeguardingAccountId,
          direction: 'DEBIT',
          amountMinor: money.amountMinor,
          description: 'ADMIN_FUNDING inbound pending clearance',
        },
        {
          accountId: holdAccountId,
          direction: 'CREDIT',
          amountMinor: money.amountMinor,
          description: `Admin funding pending review: ${refNum}`,
        },
      ];
      assertDoubleEntryInvariant(lines);

      const entry = defaultLedgerService.postJournalEntry({
        transactionId: txId,
        currency,
        narration: `Pending admin funding credit hold [${refNum}]`,
        lines,
      });

      const deposit: PendingDepositRecord = {
        id: `dep_pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId: params.targetUserId,
        kind: 'FIAT',
        currency,
        amountDecimal: params.amountDecimal,
        amountMinor: money.amountMinor.toString(),
        formattedAmount: money.toDisplayString(),
        sourceRail: 'ADMIN_FUNDING',
        submittedAt: new Date(),
        status: 'PENDING_REVIEW',
        holdJournalEntryId: entry.id,
        referenceNumber: refNum,
        origin: 'ADMIN',
        initiatedByUserId: params.actorUserId,
        initiationReason: reason,
      };
      this.pendingDeposits.push(deposit);
      this.recordPendingDepositHistory(deposit, entry.id, txId);

      defaultAuditService.logAction({
        action: 'ADMIN_WALLET_CREDIT_REQUESTED',
        actorUserId: params.actorUserId,
        actorRole: params.actorRole,
        resourceType: 'WALLET_DEPOSIT',
        resourceId: deposit.id,
        reason,
        details: {
          targetUserId: params.targetUserId,
          currency,
          amountDecimal: params.amountDecimal,
          referenceNumber: refNum,
          sourceRail: 'ADMIN_FUNDING',
        },
      });

      voidEmail(
        'admin-adjustment-queued',
        defaultEmailService.sendAdminAdjustmentQueuedEmail({
          to: target.email,
          fullName: target.fullName,
          direction: 'CREDIT',
          amount: money.toDecimalString(),
          currency,
        }),
      );

      return { direction: 'CREDIT', deposit };
    }

    const availAccountId = this.getCustomerAvailableLedgerAccountId(params.targetUserId, currency);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(params.targetUserId, currency);

    const currentBalance = defaultLedgerService.getAccountBalance(availAccountId);
    if (currentBalance.balanceMinor < money.amountMinor) {
      throw new Error(
        `Insufficient available funds. Required: ${money.toDisplayString()}, Available: ${currentBalance.formatted}`
      );
    }

    const txId = `tx_wth_hold_${Date.now()}`;
    const refNum = `WTH-HOLD-${currency}-${Date.now().toString().slice(-6)}`;

    const lines: LedgerLineInput[] = [
      {
        accountId: availAccountId,
        direction: 'DEBIT',
        amountMinor: money.amountMinor,
        description: `Admin debit reservation from available: ${refNum}`,
      },
      {
        accountId: holdAccountId,
        direction: 'CREDIT',
        amountMinor: money.amountMinor,
        description: `Admin debit pending review: ${refNum}`,
      },
    ];
    assertDoubleEntryInvariant(lines);

    const entry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency,
      narration: `Pending admin funding debit hold [${refNum}]`,
      lines,
    });

    const withdrawal: PendingWithdrawalRecord = {
      id: `wth_pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: params.targetUserId,
      kind: 'FIAT',
      currency,
      amountDecimal: params.amountDecimal,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      destinationRail: 'ADMIN_ADJUSTMENT',
      bankingDetails: {},
      submittedAt: new Date(),
      status: 'PENDING_REVIEW',
      holdJournalEntryId: entry.id,
      referenceNumber: refNum,
      origin: 'ADMIN',
      initiatedByUserId: params.actorUserId,
      initiationReason: reason,
    };
    this.pendingWithdrawals.push(withdrawal);
    this.recordPendingWithdrawalHistory(withdrawal, entry.id, txId);

    defaultAuditService.logAction({
      action: 'ADMIN_WALLET_DEBIT_REQUESTED',
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: 'WALLET_WITHDRAWAL',
      resourceId: withdrawal.id,
      reason,
      details: {
        targetUserId: params.targetUserId,
        currency,
        amountDecimal: params.amountDecimal,
        referenceNumber: refNum,
        destinationRail: 'ADMIN_ADJUSTMENT',
      },
    });

    voidEmail(
      'admin-adjustment-queued',
      defaultEmailService.sendAdminAdjustmentQueuedEmail({
        to: target.email,
        fullName: target.fullName,
        direction: 'DEBIT',
        amount: money.toDecimalString(),
        currency,
      }),
    );

    return { direction: 'DEBIT', withdrawal };
  }

  private resolveRecipientWallet(query: string): WalletOverview {
    const user = defaultAuthService.resolveUserByEmailOrId(query);
    if (!user) {
      throw new Error('Recipient not found. Use a registered customer email or user ID.');
    }
    if (user.role !== 'CUSTOMER') {
      throw new Error('Internal transfers are only supported between customer accounts.');
    }
    return this.getOrCreateUserWallet(user.id, user.fullName, user.countryCode);
  }

  private checkIdempotency(
    key: string,
    userId: string,
    endpoint: string,
    payload: unknown
  ): FinancialOperationResult | null {
    const existing = this.idempotencyStore.get(key);
    if (!existing) return null;

    if (existing.userId !== userId) {
      throw new Error('Idempotency key collision: key belongs to another user.');
    }

    const requestHash = generateSimpleHash(payload);
    if (existing.requestHash !== requestHash) {
      throw new Error(
        'Idempotency key reused with different request payload parameters (HTTP 409 Conflict).'
      );
    }

    // Genuine retry: return cached authoritative response!
    return existing.response;
  }

  private recordIdempotency(
    key: string,
    userId: string,
    endpoint: string,
    payload: unknown,
    response: FinancialOperationResult
  ): void {
    this.idempotencyStore.set(key, {
      key,
      userId,
      endpoint,
      requestHash: generateSimpleHash(payload),
      response,
      createdAt: new Date(),
    });
    // Record into transaction history (avoid duplicates if retry)
    const exists = this.transactionHistory.some((t) => t.transactionId === response.transactionId);
    if (!exists) {
      this.transactionHistory.unshift(response);
    }
  }

  public recordTransaction(tx: FinancialOperationResult): void {
    const exists = this.transactionHistory.some((t) => t.transactionId === tx.transactionId);
    if (!exists) {
      this.transactionHistory.unshift(tx);
    }
  }

  private recordPendingDepositHistory(
    record: PendingDepositRecord,
    journalEntryId: string,
    transactionId: string,
  ): void {
    this.recordTransaction({
      transactionId,
      referenceNumber: record.referenceNumber,
      operationType: 'SIMULATED_DEPOSIT',
      status: 'PENDING_REVIEW',
      currency: record.currency,
      amountMinor: record.amountMinor,
      formattedAmount: record.formattedAmount,
      journalEntryId,
      idempotencyKey: `idem_${record.id}`,
      isSimulated: true,
      authoritativeBalance: 'Pending review',
      timestamp: record.submittedAt.toISOString(),
      userId: record.userId,
      direction: 'CREDIT',
      narration: `${record.currency} deposit pending review (${record.sourceRail || record.kind})`,
      counterparty: record.origin === 'ADMIN' ? 'Admin funding' : undefined,
    });
  }

  private recordPendingWithdrawalHistory(
    record: PendingWithdrawalRecord,
    journalEntryId: string,
    transactionId: string,
  ): void {
    let availFormatted = '—';
    try {
      availFormatted = defaultLedgerService.getAccountBalance(
        this.getCustomerAvailableLedgerAccountId(record.userId, record.currency),
      ).formatted;
    } catch {
      /* wallet may still be provisioning */
    }

    this.recordTransaction({
      transactionId,
      referenceNumber: record.referenceNumber,
      operationType: 'SIMULATED_WITHDRAWAL',
      status: 'PENDING_REVIEW',
      currency: record.currency,
      amountMinor: record.amountMinor,
      formattedAmount: record.formattedAmount,
      journalEntryId,
      idempotencyKey: `idem_${record.id}`,
      isSimulated: true,
      authoritativeBalance: availFormatted,
      timestamp: record.submittedAt.toISOString(),
      userId: record.userId,
      direction: 'DEBIT',
      narration: `${record.currency} withdrawal pending review (${record.destinationRail || record.kind})`,
      counterparty: record.origin === 'ADMIN' ? 'Admin adjustment' : undefined,
    });
  }

  private updateHistoryByReference(
    userId: string,
    referenceNumber: string,
    patch: Partial<FinancialOperationResult>,
    seed?: Omit<FinancialOperationResult, 'referenceNumber' | 'userId'> &
      Partial<Pick<FinancialOperationResult, 'referenceNumber' | 'userId'>>,
  ): void {
    const tx = this.transactionHistory.find(
      (t) => t.userId === userId && t.referenceNumber === referenceNumber,
    );
    if (tx) {
      Object.assign(tx, patch);
      return;
    }
    if (!seed) return;
    this.recordTransaction({
      ...seed,
      ...patch,
      referenceNumber,
      userId,
      transactionId: patch.transactionId || seed.transactionId,
      status: patch.status || seed.status,
      journalEntryId: patch.journalEntryId || seed.journalEntryId,
      timestamp: patch.timestamp || seed.timestamp,
      narration: patch.narration || seed.narration,
      authoritativeBalance: patch.authoritativeBalance || seed.authoritativeBalance,
    });
  }

  /**
   * Build customer-visible history rows from ledger journal entries that touch
   * the customer's available/hold accounts. Fills gaps when in-memory history
   * missed a write (or after partial code paths).
   */
  private buildLedgerBackedHistory(userId: string): FinancialOperationResult[] {
    const userAccounts = defaultLedgerService.getUserAccounts(userId);
    if (userAccounts.length === 0) return [];

    const accountIds = new Set(userAccounts.map((a) => a.id));
    const availByCurrency = new Map(
      userAccounts
        .filter((a) => a.id.endsWith('_avail'))
        .map((a) => [a.currency.toUpperCase(), a.id] as const),
    );

    const results: FinancialOperationResult[] = [];

    for (const entry of defaultLedgerService.getEntries()) {
      const userLines = entry.lines.filter((l) => accountIds.has(l.accountId));
      if (userLines.length === 0) continue;

      const txId = entry.transactionId;
      // Ignore unrelated system capitalization noise if it somehow touches a user account.
      if (txId.startsWith('tx_init_')) continue;

      const availId = availByCurrency.get(entry.currency.toUpperCase());
      const availLine = availId ? userLines.find((l) => l.accountId === availId) : undefined;
      const primaryLine = availLine || userLines[0]!;
      const amountMinor = primaryLine.amountMinor;
      const money = Money.fromMinor(amountMinor, entry.currency);

      let operationType: FinancialOperationResult['operationType'] = 'SIMULATED_DEPOSIT';
      let status: FinancialOperationResult['status'] = 'POSTED';
      let direction: 'CREDIT' | 'DEBIT' =
        primaryLine.direction === 'CREDIT' ? 'CREDIT' : 'DEBIT';

      const n = (entry.narration || '').toLowerCase();
      if (txId.startsWith('tx_wth_') || n.includes('withdrawal')) {
        operationType = 'SIMULATED_WITHDRAWAL';
        direction = 'DEBIT';
        if (txId.includes('_hold') || n.includes('pending')) status = 'PENDING_REVIEW';
        if (n.includes('rejected') || n.includes('cancel')) status = 'REVERSED';
      } else if (txId.startsWith('tx_dep_') || n.includes('deposit') || n.includes('funding')) {
        operationType = 'SIMULATED_DEPOSIT';
        direction = 'CREDIT';
        if (txId.includes('_hold') || n.includes('pending')) status = 'PENDING_REVIEW';
        if (n.includes('rejected')) status = 'REVERSED';
        if (n.includes('approved') || txId.includes('_release')) status = 'POSTED';
      } else if (txId.startsWith('tx_sim_trf') || n.includes('transfer')) {
        operationType = 'INTERNAL_TRANSFER';
        direction = primaryLine.direction === 'CREDIT' ? 'CREDIT' : 'DEBIT';
      } else if (txId.includes('fx') || n.includes('fx') || n.includes('conversion')) {
        operationType = 'FX_CONVERSION';
        direction = primaryLine.direction === 'CREDIT' ? 'CREDIT' : 'DEBIT';
      } else if (n.includes('grant')) {
        operationType = 'GRANT_DISBURSEMENT';
        direction = 'CREDIT';
      } else if (n.includes('card') || n.includes('hold')) {
        operationType = 'CARD_HOLD';
        direction = 'DEBIT';
      } else if (n.includes('reversal') || n.includes('compensat')) {
        operationType = 'COMPENSATING_REVERSAL';
      } else {
        // Fallback: liability CREDIT = inflow, DEBIT = outflow
        operationType = direction === 'CREDIT' ? 'SIMULATED_DEPOSIT' : 'SIMULATED_WITHDRAWAL';
      }

      let balanceFormatted = '—';
      if (availId) {
        try {
          balanceFormatted = defaultLedgerService.getAccountBalance(availId).formatted;
        } catch {
          /* ignore */
        }
      }

      const refMatch = entry.narration.match(/\[([A-Z0-9-]+)\]/);
      const referenceNumber = refMatch?.[1] || txId;

      results.push({
        transactionId: txId,
        referenceNumber,
        operationType,
        status,
        currency: entry.currency,
        amountMinor: amountMinor.toString(),
        formattedAmount: money.toDisplayString(),
        journalEntryId: entry.id,
        idempotencyKey: `ledger_${entry.id}`,
        isSimulated: true,
        authoritativeBalance: balanceFormatted,
        timestamp: entry.postedAt.toISOString(),
        userId,
        direction,
        narration: entry.narration,
      });
    }

    return results;
  }

  private mergeUserTransactionHistory(userId: string): FinancialOperationResult[] {
    this.syncPendingQueuesIntoHistory();
    const fromHistory = this.transactionHistory.filter((t) => t.userId === userId);
    const seenTx = new Set(fromHistory.map((t) => t.transactionId));
    const seenJournal = new Set(fromHistory.map((t) => t.journalEntryId).filter(Boolean));
    const seenRefs = new Set(fromHistory.map((t) => `${t.referenceNumber}|${t.operationType}`));

    for (const ledgerTx of this.buildLedgerBackedHistory(userId)) {
      if (seenTx.has(ledgerTx.transactionId)) continue;
      if (ledgerTx.journalEntryId && seenJournal.has(ledgerTx.journalEntryId)) continue;
      const refKey = `${ledgerTx.referenceNumber}|${ledgerTx.operationType}`;
      if (seenRefs.has(refKey)) continue;
      fromHistory.push(ledgerTx);
      seenTx.add(ledgerTx.transactionId);
      if (ledgerTx.journalEntryId) seenJournal.add(ledgerTx.journalEntryId);
      seenRefs.add(refKey);
    }

    fromHistory.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return fromHistory;
  }

  /** Backfill history rows for queue items that predate history recording. */
  private syncPendingQueuesIntoHistory(): void {
    for (const deposit of this.pendingDeposits) {
      const existing = this.transactionHistory.find(
        (t) => t.userId === deposit.userId && t.referenceNumber === deposit.referenceNumber,
      );
      if (!existing) {
        this.recordPendingDepositHistory(
          deposit,
          deposit.releaseJournalEntryId || deposit.holdJournalEntryId,
          `tx_hist_${deposit.id}`,
        );
      }
      if (deposit.status === 'APPROVED') {
        this.updateHistoryByReference(deposit.userId, deposit.referenceNumber, {
          status: 'POSTED',
          journalEntryId: deposit.releaseJournalEntryId || deposit.holdJournalEntryId,
        });
      } else if (deposit.status === 'REJECTED') {
        this.updateHistoryByReference(deposit.userId, deposit.referenceNumber, {
          status: 'REVERSED',
          journalEntryId: deposit.releaseJournalEntryId || deposit.holdJournalEntryId,
        });
      }
    }

    for (const withdrawal of this.pendingWithdrawals) {
      const existing = this.transactionHistory.find(
        (t) => t.userId === withdrawal.userId && t.referenceNumber === withdrawal.referenceNumber,
      );
      if (!existing) {
        this.recordPendingWithdrawalHistory(
          withdrawal,
          withdrawal.releaseJournalEntryId || withdrawal.holdJournalEntryId,
          `tx_hist_${withdrawal.id}`,
        );
      }
      if (withdrawal.status === 'APPROVED') {
        this.updateHistoryByReference(withdrawal.userId, withdrawal.referenceNumber, {
          status: 'POSTED',
          journalEntryId: withdrawal.releaseJournalEntryId || withdrawal.holdJournalEntryId,
        });
      } else if (withdrawal.status === 'REJECTED') {
        this.updateHistoryByReference(withdrawal.userId, withdrawal.referenceNumber, {
          status: 'REVERSED',
          journalEntryId: withdrawal.releaseJournalEntryId || withdrawal.holdJournalEntryId,
        });
      }
    }
  }

  public getUserTransactions(
    userId: string,
    filter?: { currency?: string; type?: string; search?: string }
  ): FinancialOperationResult[] {
    let txs = this.mergeUserTransactionHistory(userId);

    if (filter?.currency && filter.currency !== 'ALL') {
      txs = txs.filter((t) => t.currency.toUpperCase() === filter.currency!.toUpperCase());
    }
    if (filter?.type && filter.type !== 'ALL') {
      txs = txs.filter((t) => t.operationType === filter.type);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.referenceNumber.toLowerCase().includes(q) ||
          t.transactionId.toLowerCase().includes(q) ||
          (t.narration && t.narration.toLowerCase().includes(q)) ||
          (t.counterparty && t.counterparty.toLowerCase().includes(q))
      );
    }
    return txs;
  }

  public getTransactionById(transactionId: string, userId: string): FinancialOperationResult | null {
    const tx = this.transactionHistory.find(
      (t) => t.transactionId === transactionId && t.userId === userId,
    );
    return tx || null;
  }

  /**
   * Retrieves all transactions for investigation and audit.
   * Restricted to staff roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN.
   */
  public getAllTransactionsForAdmin(params: {
    actorRole: UserRole;
    search?: string;
    status?: string;
    currency?: string;
    type?: string;
    idempotencyKey?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): { total: number; limit: number; offset: number; transactions: FinancialOperationResult[] } {
    const allowed: UserRole[] = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(params.actorRole)) {
      throw new Error('Access denied: Staff role required.');
    }

    this.syncPendingQueuesIntoHistory();
    // Merge ledger-backed rows for every distinct customer present in history or ledger.
    const userIds = new Set<string>();
    for (const t of this.transactionHistory) {
      if (t.userId) userIds.add(t.userId);
    }
    for (const acc of defaultLedgerService.getAccounts()) {
      if (acc.userId) userIds.add(acc.userId);
    }
    const merged: FinancialOperationResult[] = [];
    const seen = new Set<string>();
    for (const uid of userIds) {
      for (const tx of this.mergeUserTransactionHistory(uid)) {
        const key = `${tx.transactionId}|${tx.userId}|${tx.journalEntryId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(tx);
      }
    }
    let list = merged.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    if (params.status && params.status !== 'ALL') {
      list = list.filter((t) => t.status === params.status);
    }
    if (params.currency && params.currency !== 'ALL') {
      list = list.filter((t) => t.currency.toUpperCase() === params.currency!.toUpperCase());
    }
    if (params.type && params.type !== 'ALL') {
      list = list.filter((t) => t.operationType === params.type);
    }
    if (params.idempotencyKey) {
      list = list.filter((t) => t.idempotencyKey === params.idempotencyKey);
    }
    if (params.startDate) {
      const start = new Date(params.startDate).getTime();
      list = list.filter((t) => new Date(t.timestamp).getTime() >= start);
    }
    if (params.endDate) {
      const end = new Date(params.endDate).getTime();
      list = list.filter((t) => new Date(t.timestamp).getTime() <= end);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.transactionId.toLowerCase().includes(q) ||
          t.referenceNumber.toLowerCase().includes(q) ||
          (t.userId && t.userId.toLowerCase().includes(q)) ||
          (t.narration && t.narration.toLowerCase().includes(q)) ||
          (t.counterparty && t.counterparty.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const limit = Math.min(Math.max(params.limit || 50, 1), 100);
    const offset = Math.max(params.offset || 0, 0);
    const paginated = list.slice(offset, offset + limit);

    return { total, limit, offset, transactions: paginated };
  }

  /**
   * Reverses an erroneous or disputed transaction via a double-entry compensating reversal.
   * Strictly preserves immutability: DOES NOT mutate or delete the original posted entry.
   * Restricted to ADMIN and SUPER_ADMIN. Requires documented reason.
   */
  public reverseTransaction(params: {
    transactionId: string;
    actorUserId: string;
    actorRole: UserRole;
    reason: string;
    correlationId?: string;
  }): { originalTransaction: FinancialOperationResult; compensatingTransaction: FinancialOperationResult; reversalJournalEntryId: string } {
    const allowed: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(params.actorRole)) {
      throw new Error('Access denied: Only Administrators can authorize ledger transaction reversals.');
    }

    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error('A documented reason of at least 5 characters is strictly required for reversing a transaction.');
    }

    const tx = this.transactionHistory.find((t) => t.transactionId === params.transactionId);
    if (!tx) {
      throw new Error(`Transaction not found: ${params.transactionId}`);
    }

    if (tx.status === 'REVERSED') {
      throw new Error(`Transaction ${tx.referenceNumber} has already been reversed on ${tx.reversedAt}.`);
    }

    // Locate the original double-entry journal entry
    const entries = defaultLedgerService.getEntries();
    const origEntry = entries.find((e) => e.transactionId === tx.transactionId || e.id === tx.journalEntryId);

    if (!origEntry || origEntry.lines.length < 2) {
      throw new Error(`Original double-entry journal entry not found for transaction: ${params.transactionId}`);
    }

    // Build compensating reversal lines: flip DEBIT <-> CREDIT
    const reversalLines: LedgerLineInput[] = origEntry.lines.map((l) => ({
      accountId: l.accountId,
      direction: l.direction === 'DEBIT' ? 'CREDIT' : 'DEBIT',
      amountMinor: l.amountMinor,
      description: `Compensating reversal: ${l.description || origEntry.narration}`,
    }));

    // Verify invariant before posting
    assertDoubleEntryInvariant(reversalLines);

    // Post the balanced compensating reversal to the ledger
    const reversalEntryId = `tx_rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const reversalJournal = defaultLedgerService.postJournalEntry({
      transactionId: reversalEntryId,
      currency: origEntry.currency,
      narration: `Compensating reversal for ${tx.referenceNumber}: ${params.reason.trim()}`,
      lines: reversalLines,
    });

    // Mark original transaction as REVERSED
    tx.status = 'REVERSED';
    tx.reversalJournalEntryId = reversalJournal.id;
    tx.reversalReason = params.reason.trim();
    tx.reversedAt = new Date().toISOString();
    tx.reversedByUserId = params.actorUserId;

    // Record the compensating transaction in history
    const compensatingTx: FinancialOperationResult = {
      transactionId: reversalEntryId,
      referenceNumber: `REV-${tx.referenceNumber}`,
      operationType: 'COMPENSATING_REVERSAL',
      status: 'POSTED',
      currency: tx.currency,
      amountMinor: tx.amountMinor,
      formattedAmount: tx.formattedAmount,
      journalEntryId: reversalJournal.id,
      idempotencyKey: `idem_rev_${tx.transactionId}`,
      isSimulated: true,
      authoritativeBalance: 'Compensating Reversal Posted',
      timestamp: new Date().toISOString(),
      userId: tx.userId,
      counterparty: 'Avenora Ledger Clearing Reversal',
      narration: `Compensating reversal for tx ${tx.referenceNumber}: ${params.reason.trim()}`,
      direction: tx.direction === 'CREDIT' ? 'DEBIT' : 'CREDIT',
    };
    this.transactionHistory.unshift(compensatingTx);

    // Log to durable audit trail
    defaultAuditService.logAction({
      action: 'TRANSACTION_REVERSED',
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: 'FINANCIAL_TRANSACTION',
      resourceId: tx.transactionId,
      previousState: 'POSTED',
      newState: 'REVERSED',
      reason: params.reason.trim(),
      correlationId: params.correlationId,
      financialTxId: tx.transactionId,
      details: {
        originalReference: tx.referenceNumber,
        compensatingTransactionId: reversalEntryId,
        reversalJournalEntryId: reversalJournal.id,
        currency: tx.currency,
        amountMinor: tx.amountMinor,
      },
    });

    if (tx.userId) {
      const affectedUser = defaultAuthService.getUserById(tx.userId);
      if (affectedUser) {
        const amountStr = Money.fromMinor(tx.amountMinor, tx.currency).toDecimalString();
        voidEmail(
          'transaction-reversed',
          defaultEmailService.sendTransactionReversedEmail({
            to: affectedUser.email,
            fullName: affectedUser.fullName,
            amount: amountStr,
            currency: tx.currency,
            transactionId: tx.transactionId,
          }),
        );
      }
    }

    return {
      originalTransaction: tx,
      compensatingTransaction: compensatingTx,
      reversalJournalEntryId: reversalJournal.id,
    };
  }

  public getMonthlyStatement(userId: string, currency = 'USD', year?: number, month?: number) {
    const now = new Date();
    const stYear = year || now.getFullYear();
    const stMonth = month || now.getMonth() + 1;

    const txs = this.getUserTransactions(userId, { currency });
    const monthTxs = txs.filter((t) => {
      const d = new Date(t.timestamp);
      return d.getFullYear() === stYear && d.getMonth() + 1 === stMonth;
    });

    const totalCreditsMinor = monthTxs
      .filter((t) => t.direction === 'CREDIT' || t.operationType === 'SIMULATED_DEPOSIT')
      .reduce((acc, t) => acc + BigInt(t.amountMinor), 0n);

    const totalDebitsMinor = monthTxs
      .filter((t) => t.direction === 'DEBIT' || t.operationType === 'SIMULATED_WITHDRAWAL' || t.operationType === 'CARD_HOLD')
      .reduce((acc, t) => acc + BigInt(t.amountMinor), 0n);

    const wallet = this.getOrCreateUserWallet(userId);
    const currAccount = wallet.accounts.find((a) => a.currency === currency);
    const endingBalanceMinor = currAccount ? BigInt(currAccount.availableBalanceMinor) : 0n;
    const startingBalanceMinor = endingBalanceMinor - totalCreditsMinor + totalDebitsMinor;

    const statement = {
      statementId: `STMT-${currency}-${stYear}${String(stMonth).padStart(2, '0')}-${userId.slice(-6).toUpperCase()}`,
      period: `${stYear}-${String(stMonth).padStart(2, '0')}`,
      currency,
      generatedAt: new Date().toISOString(),
      accountNumber: currAccount?.accountNumber || `2100-${currency}-ACCOUNT`,
      startingBalanceMinor: startingBalanceMinor.toString(),
      formattedStartingBalance: Money.fromMinor(startingBalanceMinor >= 0n ? startingBalanceMinor : 0n, currency).toDisplayString(),
      totalCreditsMinor: totalCreditsMinor.toString(),
      formattedTotalCredits: Money.fromMinor(totalCreditsMinor, currency).toDisplayString(),
      totalDebitsMinor: totalDebitsMinor.toString(),
      formattedTotalDebits: Money.fromMinor(totalDebitsMinor, currency).toDisplayString(),
      endingBalanceMinor: endingBalanceMinor.toString(),
      formattedEndingBalance: Money.fromMinor(endingBalanceMinor, currency).toDisplayString(),
      transactionsCount: monthTxs.length,
      transactions: monthTxs,
      isSimulated: true,
      legalNotice:
        'This statement is provided for your records. Retain it with your tax and accounting documents as required in your jurisdiction.',
    };

    const statementUser = defaultAuthService.getUserById(userId);
    if (statementUser) {
      const periodLabel = new Date(stYear, stMonth - 1, 1).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      voidEmail(
        'statement-ready',
        defaultEmailService.sendStatementReadyEmail({
          to: statementUser.email,
          fullName: statementUser.fullName,
          periodLabel,
        }),
      );
    }

    return statement;
  }

  public getBtcDepositInstructions() {
    return {
      network: 'Bitcoin',
      address: PLATFORM_BTC_DEPOSIT_ADDRESS,
      supportEmail: PLATFORM_DEPOSIT_SUPPORT_EMAIL,
    };
  }

  public async submitBtcDepositProof(params: {
    userId: string;
    amountDecimal: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
  }): Promise<BtcDepositProofRecord> {
    const pending = await this.requestPendingDeposit({
      userId: params.userId,
      currency: 'BTC',
      amountDecimal: params.amountDecimal,
      kind: 'BTC',
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
    });

    const btcUser = defaultAuthService.getUserById(params.userId);
    if (btcUser) {
      voidEmail(
        'btc-deposit-proof',
        defaultEmailService.sendBtcDepositProofEmail({
          to: btcUser.email,
          fullName: btcUser.fullName,
          amount: pending.amountDecimal,
        }),
      );
    }

    return {
      id: pending.id,
      userId: pending.userId,
      amountDecimal: pending.amountDecimal,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      storageRef: pending.storageRef ?? '',
      submittedAt: pending.submittedAt,
      status: pending.status,
    };
  }

  public assertFiatDepositRailAllowed(userId: string, railCode: string): void {
    const country = defaultAuthService.getUserById(userId)?.countryCode ?? 'US';
    if (!isDepositRailAllowedForCountry(country, railCode)) {
      throw new Error('Deposit method is not available for your signup country.');
    }
  }

  public assertFiatWithdrawalRailAllowed(userId: string, railCode: string): void {
    const country = defaultAuthService.getUserById(userId)?.countryCode ?? 'US';
    if (!isWithdrawalRailAllowedForCountry(country, railCode)) {
      throw new Error('Withdrawal method is not available for your signup country.');
    }
  }
}

export const defaultWalletService = new WalletService();
