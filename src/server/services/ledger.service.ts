/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Reference Financial Ledger Service
 *
 * Implements strict double-entry mechanics, Chart of Accounts,
 * immutable posted journal entries, and invariant verification.
 * Neon is the source of truth; in-memory Maps are a write-through cache.
 */

import type {
  AccountClassification as PrismaAccountClassification,
  AccountType as PrismaAccountType,
  LedgerEntryDirection as PrismaLedgerEntryDirection,
} from '@prisma/client';
import { SYSTEM_CHART_OF_ACCOUNTS } from '../../config/constants.ts';
import { LedgerAccount } from '../../domain/ledger/LedgerAccount.ts';
import { JournalEntryRecord, LedgerLineInput } from '../../domain/ledger/JournalEntry.ts';
import { assertDoubleEntryInvariant } from '../../domain/ledger/LedgerInvariant.ts';
import { Money } from '../../domain/money/Money.ts';
import { getWalletCurrencyCodesForCountry } from '../../domain/country/countryPrimaryCurrency.ts';
import { prisma, prismaDelegate } from '../db/prisma.ts';

export class LedgerService {
  private accounts: Map<string, LedgerAccount> = new Map();
  private entries: JournalEntryRecord[] = [];
  private readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = this.bootstrap();
  }

  public whenReady(): Promise<void> {
    return this.readyPromise;
  }

  private async bootstrap(): Promise<void> {
    try {
      await this.hydrateFromDatabase();
    } catch (err) {
      console.error('[ledger] hydrateFromDatabase failed; continuing with in-memory seed:', err);
    }
    try {
      await this.ensureSystemSeedPersisted();
    } catch (err) {
      console.error('[ledger] ensureSystemSeedPersisted failed:', err);
    }
  }

  private async hydrateFromDatabase(): Promise<void> {
    const dbAccounts = await prismaDelegate('ledgerAccount', prisma.ledgerAccount).findMany();
    for (const row of dbAccounts) {
      this.accounts.set(row.id, {
        id: row.id,
        accountNumber: row.accountNumber,
        name: row.name,
        type: row.type as LedgerAccount['type'],
        classification: row.classification as LedgerAccount['classification'],
        currency: row.currency,
        userId: row.userId ?? undefined,
        isActive: row.isActive,
        isFrozen: row.isFrozen,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }

    const journals = await prismaDelegate('journalEntry', prisma.journalEntry).findMany({
      include: { lines: true },
      orderBy: [{ postedAt: 'asc' }, { entrySequence: 'asc' }],
    });
    this.entries = journals.map((j) => ({
      id: j.id,
      transactionId: j.transactionId,
      entrySequence: j.entrySequence,
      currency: j.currency,
      narration: j.narration,
      postedAt: j.postedAt,
      lines: j.lines.map((l) => ({
        accountId: l.accountId,
        direction: l.direction as LedgerLineInput['direction'],
        // Prisma BigInt — normalize so Money/history never see unexpected shapes.
        amountMinor: typeof l.amountMinor === 'bigint' ? l.amountMinor : BigInt(String(l.amountMinor)),
        description: l.description ?? undefined,
      })),
    }));
  }

  private buildDefaultAccounts(): LedgerAccount[] {
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

    defaultAccounts.push({
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

    return defaultAccounts;
  }

  private baselineCapitalEntry(): JournalEntryRecord {
    return {
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
          amountMinor: 50_000_000n,
          description: 'Funds received in safeguarding treasury account',
        },
        {
          accountId: 'acc_equity_reserve_usd',
          direction: 'CREDIT',
          amountMinor: 50_000_000n,
          description: 'Capital reserve equity recognition',
        },
      ],
    };
  }

  private async ensureSystemSeedPersisted(): Promise<void> {
    const defaults = this.buildDefaultAccounts();
    for (const acc of defaults) {
      if (!this.accounts.has(acc.id)) {
        this.accounts.set(acc.id, acc);
        await this.persistAccount(acc);
      }
    }

    if (!this.entries.some((e) => e.id === 'je_cap_001')) {
      const cap = this.baselineCapitalEntry();
      assertDoubleEntryInvariant(cap.lines);
      this.entries.push(cap);
      await this.persistJournalEntry(cap);
    }
  }

  public async persistAccount(account: LedgerAccount): Promise<void> {
    const existingByNumber = await prisma.ledgerAccount.findUnique({
      where: { accountNumber: account.accountNumber },
    });
    if (existingByNumber && existingByNumber.id !== account.id) {
      // Reuse durable row if account number was allocated under a different id historically.
      this.accounts.set(existingByNumber.id, {
        ...account,
        id: existingByNumber.id,
        createdAt: existingByNumber.createdAt,
        updatedAt: existingByNumber.updatedAt,
      });
      return;
    }
    await prisma.ledgerAccount.upsert({
      where: { id: account.id },
      create: {
        id: account.id,
        accountNumber: account.accountNumber,
        name: account.name,
        type: account.type as PrismaAccountType,
        classification: account.classification as PrismaAccountClassification,
        currency: account.currency,
        userId: account.userId ?? null,
        isActive: account.isActive,
        isFrozen: account.isFrozen,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
      update: {
        name: account.name,
        type: account.type as PrismaAccountType,
        classification: account.classification as PrismaAccountClassification,
        currency: account.currency,
        userId: account.userId ?? null,
        isActive: account.isActive,
        isFrozen: account.isFrozen,
        updatedAt: account.updatedAt,
      },
    });
  }

  public async persistJournalEntry(entry: JournalEntryRecord): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.financialTransaction.upsert({
        where: { id: entry.transactionId },
        create: {
          id: entry.transactionId,
          referenceNumber: entry.transactionId,
          description: entry.narration,
          status: 'POSTED',
          originCountry: 'US',
          sourceType: 'LEDGER_JOURNAL',
          postedAt: entry.postedAt,
        },
        update: {
          description: entry.narration,
          status: 'POSTED',
          postedAt: entry.postedAt,
        },
      });

      await tx.journalEntry.upsert({
        where: { id: entry.id },
        create: {
          id: entry.id,
          transactionId: entry.transactionId,
          entrySequence: entry.entrySequence,
          currency: entry.currency,
          narration: entry.narration,
          postedAt: entry.postedAt,
          lines: {
            create: entry.lines.map((line) => ({
              id: `${entry.id}_${line.accountId}_${line.direction}`,
              accountId: line.accountId,
              direction: line.direction as PrismaLedgerEntryDirection,
              amountMinor: line.amountMinor,
              description: line.description ?? null,
            })),
          },
        },
        update: {
          narration: entry.narration,
          postedAt: entry.postedAt,
        },
      });
    });
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
    void this.persistAccount(account).catch((err) =>
      console.error('[ledger] failed to persist safeguarding account:', err),
    );
    return account;
  }

  public async ensureSafeguardingAssetAccountDurable(currency: string): Promise<LedgerAccount> {
    const account = this.ensureSafeguardingAssetAccount(currency);
    await this.persistAccount(account);
    return account;
  }

  public getEntries(): JournalEntryRecord[] {
    return [...this.entries];
  }

  /**
   * Posts an immutable balanced journal entry to the in-memory cache.
   * Callers that need durability must await persistJournalEntry(entry).
   */
  public postJournalEntry(input: {
    transactionId: string;
    currency: string;
    narration: string;
    lines: LedgerLineInput[];
  }): JournalEntryRecord {
    assertDoubleEntryInvariant(input.lines);

    for (const line of input.lines) {
      const account = this.accounts.get(line.accountId);
      if (!account) {
        throw new Error(`Account not found: ${line.accountId}`);
      }
      if (account.currency !== input.currency) {
        throw new Error(
          `Account currency mismatch: Account ${account.accountNumber} is ${account.currency}, but entry is ${input.currency}`,
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

  public async postJournalEntryDurable(input: {
    transactionId: string;
    currency: string;
    narration: string;
    lines: LedgerLineInput[];
  }): Promise<JournalEntryRecord> {
    await this.readyPromise;
    const entry = this.postJournalEntry(input);
    await this.persistJournalEntry(entry);
    return entry;
  }

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

  public provisionCustomerAccounts(
    userId: string,
    fullName: string,
    countryCode = 'US',
  ): LedgerAccount[] {
    const currencies = getWalletCurrencyCodesForCountry(countryCode);
    const created: LedgerAccount[] = [];

    const userToken = userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-16);
    for (const curr of currencies) {
      const availId = `acc_${userId}_${curr.toLowerCase()}_avail`;
      if (!this.accounts.has(availId)) {
        const availAcc: LedgerAccount = {
          id: availId,
          accountNumber: `2100-${curr}-${userToken}-AVAIL`,
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
          accountNumber: `2200-${curr}-${userToken}-HOLD`,
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

  public async provisionCustomerAccountsDurable(
    userId: string,
    fullName: string,
    countryCode = 'US',
  ): Promise<LedgerAccount[]> {
    await this.readyPromise;
    const created = this.provisionCustomerAccounts(userId, fullName, countryCode);
    for (const acc of created) {
      await this.persistAccount(acc);
    }
    // Also persist any already-cached accounts for this user that may pre-exist in memory only.
    for (const acc of this.getUserAccounts(userId)) {
      await this.persistAccount(acc);
    }
    return created;
  }

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

  public getUserAccounts(userId: string): LedgerAccount[] {
    return Array.from(this.accounts.values()).filter((acc) => acc.userId === userId);
  }
}

export const defaultLedgerService = new LedgerService();
