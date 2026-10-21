/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Chart of Accounts Domain Definitions
 */

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export type AccountClassification =
  | 'SYSTEM_SAFEGUARDING_ASSET'
  | 'SYSTEM_FEE_REVENUE'
  | 'SYSTEM_PROVIDER_CLEARING'
  | 'CUSTOMER_AVAILABLE_BALANCE'
  | 'CUSTOMER_PENDING_HOLD'
  | 'CUSTOMER_RESERVED_BALANCE';

export interface LedgerAccount {
  id: string;
  accountNumber: string;
  name: string;
  type: AccountType;
  classification: AccountClassification;
  currency: string;
  userId?: string | null;
  isActive: boolean;
  isFrozen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns the normal balance direction according to classical double-entry accounting.
 * ASSET & EXPENSE accounts increase with DEBIT.
 * LIABILITY, EQUITY & REVENUE accounts increase with CREDIT.
 */
export function getNormalBalanceDirection(type: AccountType): 'DEBIT' | 'CREDIT' {
  switch (type) {
    case 'ASSET':
    case 'EXPENSE':
      return 'DEBIT';
    case 'LIABILITY':
    case 'EQUITY':
    case 'REVENUE':
      return 'CREDIT';
  }
}
