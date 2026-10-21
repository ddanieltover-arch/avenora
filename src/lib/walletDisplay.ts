/**
 * @license Apache-2.0
 * Shared wallet balance formatting for customer portal views.
 */

import { getCurrency } from '../domain/money/Currency.ts';

export function formatWalletAccountHold(account: {
  currency?: string;
  currencyCode?: string;
  formattedHold?: string;
  pendingHoldMinor?: string;
}): string {
  if (account.formattedHold) return account.formattedHold;
  const code = (account.currency || account.currencyCode || 'USD').toUpperCase();
  try {
    const def = getCurrency(code);
    const minor = Number(account.pendingHoldMinor || 0);
    const major = minor / 10 ** def.minorUnits;
    const fractionDigits = def.minorUnits === 0 ? 0 : def.isCrypto ? 8 : 2;
    return `${def.symbol}${major.toLocaleString(undefined, {
      minimumFractionDigits: def.isCrypto ? 8 : fractionDigits,
      maximumFractionDigits: def.isCrypto ? 8 : fractionDigits,
    })}`;
  } catch {
    return `${code} 0`;
  }
}

export function walletHoldMinorPositive(account: { pendingHoldMinor?: string }): boolean {
  if (account.pendingHoldMinor === undefined || account.pendingHoldMinor === '') return false;
  try {
    return BigInt(account.pendingHoldMinor) > 0n;
  } catch {
    return false;
  }
}

export function formatWalletAccountBalance(account: {
  currency?: string;
  currencyCode?: string;
  formattedBalance?: string;
  availableBalanceMinor?: string;
  balanceMinor?: string;
}): string {
  if (account.formattedBalance) return account.formattedBalance;
  const code = (account.currency || account.currencyCode || 'USD').toUpperCase();
  try {
    const def = getCurrency(code);
    const minor = Number(account.availableBalanceMinor || account.balanceMinor || 0);
    const major = minor / 10 ** def.minorUnits;
    const fractionDigits = def.minorUnits === 0 ? 0 : 2;
    return `${def.symbol}${major.toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  } catch {
    return `${code} 0`;
  }
}

export function customerInitials(fullName?: string | null): string {
  if (!fullName?.trim()) return '?';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return (parts[0] ?? '?').slice(0, 2).toUpperCase();
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

/** First name for greeting; if only one name on file, use that. */
export function customerGreetingName(fullName?: string | null): string {
  if (!fullName?.trim()) return 'there';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts[0] ?? 'there';
}

export function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
