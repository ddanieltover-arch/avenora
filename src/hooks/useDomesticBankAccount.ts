/**
 * @license Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext.tsx';

export interface DomesticAccountDisplayField {
  key: string;
  label: string;
  value: string;
}

export interface DomesticAccountCustomerView {
  id?: string;
  verifiedCountryCode?: string;
  schemeId?: string;
  generationStatus: string;
  identifierType?: string;
  formattedValue?: string;
  maskedValue?: string;
  displayFields?: DomesticAccountDisplayField[];
  disclaimer?: string;
  generatedAt?: string;
  lastError?: string;
  message?: string;
  kycStatus?: string;
}

export function useDomesticBankAccount() {
  const { user, token } = useAuth();
  const [data, setData] = useState<DomesticAccountCustomerView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token || !user) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/domestic-accounts/me', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load domestic account (${res.status})`);
      }
      const json = await res.json();
      if (json.account) {
        setData({ ...json.account, kycStatus: json.kycStatus });
      } else {
        setData({
          generationStatus: json.generationStatus,
          message: json.message,
          kycStatus: json.kycStatus,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load account details');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    void refresh();
  }, [refresh, user?.kycStatus]);

  return { data, loading, error, refresh };
}
