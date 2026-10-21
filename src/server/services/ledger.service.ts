/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Reference Financial Ledger Service
 *
 * Implements strict double-entry mechanics, Chart of Accounts,
 * immutable posted journal entries, and invariant verification.
 */

import { SYSTEM_CHART_OF_ACCOUNTS } from '../../config/constants.ts';
import { LedgerAccount } from '../../domain/ledger/LedgerAccount.ts';
import { JournalEntryRecord, LedgerLineInput } from '../../domain/ledger/JournalEntry.ts';
import { assertDoubleEntryInvariant, verifyDoubleEntryInvariant } from '../../domain/ledger/LedgerInvariant.ts';
import { Money } from '../../domain/money/Money.ts';
import { getWalletCurrencyCodesForCountry } from '../../domain/country/countryPrimaryCurrency.ts';

export class LedgerService {
  private accounts: Map<string, LedgerAccount> = new Map();
  private entries: JournalEntryRecord[] = [];

  constructor() {
    this.seedDefaultAccounts();
    this.seedBaselineJournalEntries();
  }

  private seedDefaultAccounts(): void {
    const defaultAccounts = Object.entries(SYSTEM_CHART_OF_ACCOUNTS).map(([key, acc]) => ({
      id: `acc_${key.toLowerCase()}`,
      accountNumber: acc.accountNumber,
      name: acc.name,
      type: acc.type,
      classification: acc.classification,
      currency: acc.currency,
      isActive: true,
      isFrozen: false,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    }));

    for (const acc of defaultAccounts) {
      this.accounts.set(acc.id, acc);
    }

    this.accounts.set('acc_equity_reserve_usd', {
      id: 'acc_equity_reserve_usd',
      accountNumber: '3010-USD-EQUITY-CAPITAL',
      name: 'Tier-1 Capital & Statutory Reserves',
      type: 'EQUITY',
      classification: 'SYSTEM_SAFEGUARDING_ASSET',
      currency: 'USD',
      isActive: true,
      isFrozen: false,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });
  }

  private seedBaselineJournalEntries(): void {
    // 1. Initial Safeguarding Capitalization: $500,000.00 USD
    // DEBIT: Safeguarding Vault Asset ($500,000.00 = 50,000,000 cents)
    // CREDIT: Tier-1 Capital Equity ($500,000.00 = 50,000,000 cents)
    const capEntry: JournalEntryRecord = {
      id: 'je_cap_001',
      transactionId: 'tx_init_capital_2026',
      entrySequence: 1,
      currency: 'USD',
      narration: 'Initial Tier-1 Regulatory Capital Deposit into Partner Safeguarding Vault',
      postedAt: new Date('2026-01-01T00:00:00Z'),
      lines: [
        {
          accountId: 'acc_safeguarding_cash_usd',
          direction: 'DEBIT',
          amountMinor: 50_000_000n, // $500,000.00
          description: 'Funds received in safeguarding treasury account',
        },
        {
          accountId: 'acc_equity_reserve_usd',
          direction: 'CREDIT',
          amountMinor: 50_000_000n, // $500,000.00
          description: 'Capital reserve equity recognition',
        },
      ],
    };
    assertDoubleEntryInvariant(capEntry.lines);
    this.entries.push(capEntry);
  }

  public getAccounts(): LedgerAccount[] {
    return Array.from(this.accounts.values());
  }

  public getAccount(id: string): LedgerAccount | undefined {
    return this.accounts.get(id);
  }

  /** Prototype safeguarding asset for regional fiat not in the static chart. */
  public ensureSafeguardingAssetAccount(currency: string): LedgerAccount {
    const code = currency.toUpperCase();
    const existingId = `acc_safeguarding_cash_${code.toLowerCase()}`;
    const existing = this.accounts.get(existingId);
    if (existing) return existing;

    const account: LedgerAccount = {
      id: existingId,
      accountNumber: `1100-${code}-SAFEGUARD-PROTO`,
      name: `${code} Safeguarding Treasury (prototype)`,
      type: 'ASSET',
      classification: 'SYSTEM_SAFEGUARDING_ASSET',
      currency: code,
      isActive: true,
      isFrozen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.accounts.set(existingId, account);
    return account;
  }

  public getEntries(): JournalEntryRecord[] {
    return [...this.entries];
  }

  /**
   * Posts an immutable balanced journal entry.
   */
  public postJournalEntry(input: {
    transactionId: string;
    currency: string;
    narration: string;
    lines: LedgerLineInput[];
  }): JournalEntryRecord {
    // 1. Verify double entry invariant
    assertDoubleEntryInvariant(input.lines);

    // 2. Validate all accounts exist and match currency
    for (const line of input.lines) {
      const account = this.accounts.get(line.accountId);
      if (!account) {
        throw new Error(`Account not found: ${line.accountId}`);
      }
      if (account.currency !== input.currency) {
        throw new Error(
          `Account currency mismatch: Account ${account.accountNumber} is ${account.currency}, but entry is ${input.currency}`
        );
      }
      if (account.isFrozen) {
        throw new Error(`Account ${account.accountNumber} is frozen and cannot accept postings.`);
      }
    }

    const newRecord: JournalEntryRecord = {
      id: `je_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      transactionId: input.transactionId,
      entrySequence: this.entries.length + 1,
      currency: input.currency,
      narration: input.narration,
      postedAt: new Date(),
      lines: input.lines,
    };

    this.entries.push(newRecord);
    return newRecord;
  }

  /**
   * Calculates net balance for every account and checks global ledger invariant.
   */
  public getLedgerSummary(): {
    totalAccounts: number;
    totalEntries: number;
    globalDebitsMinor: string;
    globalCreditsMinor: string;
    isBalanced: boolean;
    imbalanceMinor: string;
    accountBalances: Array<{
      account: LedgerAccount;
      debitMinor: string;
      creditMinor: string;
      netBalanceMinor: string;
      formattedBalance: string;
    }>;
  } {
    const debitMap = new Map<string, bigint>();
    const creditMap = new Map<string, bigint>();

    let globalDebits = 0n;
    let globalCredits = 0n;

    for (const entry of this.entries) {
      for (const line of entry.lines) {
        if (line.direction === 'DEBIT') {
          debitMap.set(line.accountId, (debitMap.get(line.accountId) ?? 0n) + line.amountMinor);
          globalDebits += line.amountMinor;
        } else {
          creditMap.set(line.accountId, (creditMap.get(line.accountId) ?? 0n) + line.amountMinor);
          globalCredits += line.amountMinor;
        }
      }
    }

    const accountBalances = Array.from(this.accounts.values()).map((acc) => {
      const debitMinor = debitMap.get(acc.id) ?? 0n;
      const creditMinor = creditMap.get(acc.id) ?? 0n;

      // Net balance depends on account normal direction:
      // Asset / Expense: Normal = Debit (Debit - Credit)
      // Liability / Equity / Revenue: Normal = Credit (Credit - Debit)
      let netMinor = 0n;
      if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
        netMinor = debitMinor - creditMinor;
      } else {
        netMinor = creditMinor - debitMinor;
      }

      const money = Money.fromMinor(netMinor, acc.currency);

      return {
        account: acc,
        debitMinor: debitMinor.toString(),
        creditMinor: creditMinor.toString(),
        netBalanceMinor: netMinor.toString(),
        formattedBalance: money.toDisplayString(),
      };
    });

    const isBalanced = globalDebits === globalCredits;

    return {
      totalAccounts: this.accounts.size,
      totalEntries: this.entries.length,
      globalDebitsMinor: globalDebits.toString(),
      globalCreditsMinor: globalCredits.toString(),
      isBalanced,
      imbalanceMinor: (globalDebits - globalCredits).toString(),
      accountBalances,
    };
  }

  /**
   * Provisions customer liability accounts for the signup-country fiat corridor and Bitcoin.
   */
  public provisionCustomerAccounts(
    userId: string,
    fullName: string,
    countryCode = 'US',
  ): LedgerAccount[] {
    const currencies = getWalletCurrencyCodesForCountry(countryCode);
    const created: LedgerAccount[] = [];

    for (const curr of currencies) {
      const availId = `acc_${userId}_${curr.toLowerCase()}_avail`;
      if (!this.accounts.has(availId)) {
        const availAcc: LedgerAccount = {
          id: availId,
          accountNumber: `2100-${curr}-${userId.substring(0, 8).toUpperCase()}-AVAIL`,
          name: `${fullName} (${curr} Available Wallet)`,
          type: 'LIABILITY',
          classification: 'CUSTOMER_AVAILABLE_BALANCE',
          currency: curr,
          userId,
          isActive: true,
          isFrozen: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.accounts.set(availId, availAcc);
        created.push(availAcc);
      }

      const holdId = `acc_${userId}_${curr.toLowerCase()}_hold`;
      if (!this.accounts.has(holdId)) {
        const holdAcc: LedgerAccount = {
          id: holdId,
          accountNumber: `2200-${curr}-${userId.substring(0, 8).toUpperCase()}-HOLD`,
          name: `${fullName} (${curr} Pending Hold)`,
          type: 'LIABILITY',
          classification: 'CUSTOMER_PENDING_HOLD',
          currency: curr,
          userId,
          isActive: true,
          isFrozen: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.accounts.set(holdId, holdAcc);
        created.push(holdAcc);
      }
    }

    return created;
  }

  /**
   * Computes available minor units for a specific account by summing debits & credits.
   */
  public getAccountBalance(accountId: string): {
    account: LedgerAccount;
    balanceMinor: bigint;
    formatted: string;
  } {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    let debits = 0n;
    let credits = 0n;

    for (const entry of this.entries) {
      for (const line of entry.lines) {
        if (line.accountId === accountId) {
          if (line.direction === 'DEBIT') {
            debits += line.amountMinor;
          } else {
            credits += line.amountMinor;
          }
        }
      }
    }

    // For Liability accounts (Customer Available Balance):
    // Balance = Credits - Debits
    // For Asset accounts (Safeguarding Vault):
    // Balance = Debits - Credits
    let balanceMinor = 0n;
    if (account.type === 'ASSET' || account.type === 'EXPENSE') {
      balanceMinor = debits - credits;
    } else {
      balanceMinor = credits - debits;
    }

    const money = Money.fromMinor(balanceMinor, account.currency);
    return {
      account,
      balanceMinor,
      formatted: money.toDisplayString(),
    };
  }

  /**
   * Returns all ledger accounts owned by a specific customer.
   */
  public getUserAccounts(userId: string): LedgerAccount[] {
    return Array.from(this.accounts.values()).filter((acc) => acc.userId === userId);
  }
}

export const defaultLedgerService = new LedgerService();

