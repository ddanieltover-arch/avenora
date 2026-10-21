/**
 * @license Apache-2.0
 * Customer portal wallet scope: signup-country fiat + BTC only.
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '../components/AuthContext.tsx';
import {
  getWalletCurrencyCodesForCountry,
  resolvePrimaryFiatCurrency,
} from '../domain/country/countryPrimaryCurrency.ts';
import { getCurrency } from '../domain/money/Currency.ts';
import type { CurrencyDefinition } from '../domain/money/Currency.ts';

export interface WalletAccountLike {
  currency?: string;
  currencyCode?: string;
  currencyName?: string;
  accountNumber?: string;
  formattedBalance?: string;
  formattedHold?: string;
  availableBalanceMinor?: string;
  pendingHoldMinor?: string;
  balanceMinor?: string;
  status?: 'ACTIVE' | 'FROZEN';
  isCrypto?: boolean;
}

export function useCustomerWalletScope() {
  const { user } = useAuth();
  const countryCode = (user?.countryCode ?? 'US').toUpperCase();

  const primaryFiat = useMemo(() => resolvePrimaryFiatCurrency(countryCode), [countryCode]);
  const walletCurrencyCodes = useMemo(
    () => getWalletCurrencyCodesForCountry(countryCode),
    [countryCode],
  );
  const allowedCurrencySet = useMemo(() => new Set(walletCurrencyCodes), [walletCurrencyCodes]);

  const primaryFiatMeta: CurrencyDefinition = useMemo(() => getCurrency(primaryFiat), [primaryFiat]);

  /** Lending, cards, and grants use home fiat only (not BTC). */
  const fiatCurrencyCodes = useMemo(() => [primaryFiat], [primaryFiat]);

  const accountCurrencyCode = useCallback((account: WalletAccountLike): string => {
    return (account.currency || account.currencyCode || '').toUpperCase();
  }, []);

  const filterAccounts = useCallback(
    <T extends WalletAccountLike>(accounts: T[]): T[] => {
      return accounts.filter((a) => allowedCurrencySet.has(accountCurrencyCode(a)));
    },
    [allowedCurrencySet, accountCurrencyCode],
  );

  function isAllowedCurrency(code: string): boolean {
    return allowedCurrencySet.has(code.toUpperCase());
  }

  function currencySelectLabel(code: string): string {
    const def = getCurrency(code);
    return `${code} (${def.symbol}) — ${def.name}`;
  }

  function currencyFilterShortLabel(code: string): string {
    const def = getCurrency(code);
    return `${code} (${def.symbol})`;
  }

  return {
    countryCode,
    primaryFiat,
    primaryFiatMeta,
    walletCurrencyCodes,
    fiatCurrencyCodes,
    allowedCurrencySet,
    filterAccounts,
    isAllowedCurrency,
    currencySelectLabel,
    currencyFilterShortLabel,
  };
}
