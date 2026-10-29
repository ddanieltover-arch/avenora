/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Frontend Authentication Context
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { buildAdminPath, buildPortalPath, navigateToPath } from '../routing/appRoutes.ts';

const STAFF_ROLES = new Set(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']);

async function readApiJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) {
    if (!res.ok) {
      throw new Error(
        `API unavailable (${res.status}). The backend may not be deployed — use local npm run dev, or redeploy with the Express API enabled.`,
      );
    }
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    const snippet = text.replace(/\s+/g, ' ').slice(0, 80);
    throw new Error(
      `API returned a non-JSON response (${res.status}): "${snippet}". The /api routes are not reaching the Express server.`,
    );
  }
}

/** Send the user to the customer dashboard (or admin overview for staff on /admin). */
function redirectToDashboard(role?: AuthUser['role']): void {
  const onAdminPath = window.location.pathname.startsWith('/admin');
  const destination =
    onAdminPath && role && STAFF_ROLES.has(role)
      ? buildAdminPath('overview')
      : buildPortalPath('overview');
  navigateToPath(destination, { replace: true });
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  countryCode: string;
  role: 'CUSTOMER' | 'SUPPORT' | 'COMPLIANCE_REVIEWER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'PENDING_VERIFICATION';
  kycStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_MORE_INFORMATION';
  mfaEnabled: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  /** False until post-login PIN unlock (true immediately after registration). */
  transactionPinUnlocked: boolean;
  login: (email: string, password: string, totpCode?: string) => Promise<{ requiresMfa: boolean }>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string,
    transactionPin: string,
    countryCode: string,
  ) => Promise<void>;
  verifyTransactionPin: (pin: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  startMfa: () => Promise<{ secret: string; otpauthUri: string }>;
  confirmMfa: (secret: string, code: string) => Promise<{ recoveryCodes: string[] }>;
  requestPasswordReset: (email: string) => Promise<{ debugToken?: string; message: string }>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_TOKEN_STORAGE_KEY = 'avenora_session_token';

function persistSessionToken(sessionToken: string | null) {
  if (sessionToken) {
    sessionStorage.setItem(SESSION_TOKEN_STORAGE_KEY, sessionToken);
  } else {
    sessionStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionPinUnlocked, setTransactionPinUnlocked] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = sessionStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
      if (!savedToken) {
        setLoading(false);
        return;
      }

      setToken(savedToken);
      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        const data = await readApiJson(res);
        if (res.ok && data.user) {
          setUser(data.user);
          setTransactionPinUnlocked(data.transactionPinUnlocked === true);
        } else {
          persistSessionToken(null);
          setToken(null);
          setTransactionPinUnlocked(false);
        }
      } catch (err) {
        console.error('Failed to restore session', err);
        persistSessionToken(null);
        setToken(null);
        setTransactionPinUnlocked(false);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string, totpCode?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, totpCode }),
      });
      const data = await readApiJson(res);
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Login failed');
      }
      if (data.status === 'mfa_required') {
        return { requiresMfa: true };
      }
      setUser(data.user);
      setToken(data.sessionToken);
      persistSessionToken(data.sessionToken);
      setTransactionPinUnlocked(data.transactionPinUnlocked === true);
      redirectToDashboard(data.user?.role);
      return { requiresMfa: false };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      setTransactionPinUnlocked(false);
      persistSessionToken(null);
      navigateToPath('/', { replace: true });
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string,
    transactionPin: string,
    countryCode: string,
  ) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phoneNumber,
          transactionPin,
          countryCode,
        }),
      });
      const data = await readApiJson(res);
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Registration failed');
      }
      setUser(data.user);
      setToken(data.sessionToken);
      persistSessionToken(data.sessionToken);
      setTransactionPinUnlocked(data.transactionPinUnlocked !== false);
      redirectToDashboard(data.user?.role);
    } finally {
      setLoading(false);
    }
  };

  const verifyTransactionPin = async (pin: string) => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch('/api/v1/auth/verify-transaction-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ transactionPin: pin }),
    });
    const data = await readApiJson(res);
    if (!res.ok) {
      throw new Error(data.detail || data.title || 'Invalid transaction PIN');
    }
    setTransactionPinUnlocked(true);
  };

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readApiJson(res);
      if (res.ok && data.user) {
        setUser(data.user);
        if (typeof data.transactionPinUnlocked === 'boolean') {
          setTransactionPinUnlocked(data.transactionPinUnlocked);
        }
      }
    } catch (err) {
      console.error('Failed to refresh user profile', err);
    }
  }, [token]);

  const startMfa = async (): Promise<{ secret: string; otpauthUri: string }> => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch('/api/v1/auth/mfa/enroll', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.detail || data.title || 'MFA enrollment initialization failed');
    return { secret: data.secret, otpauthUri: data.otpauthUri };
  };

  const confirmMfa = async (secret: string, code: string): Promise<{ recoveryCodes: string[] }> => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch('/api/v1/auth/mfa/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ secret, code }),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.detail || data.title || 'MFA confirmation failed');
    await refreshUser();
    return { recoveryCodes: data.recoveryCodes || [] };
  };

  const requestPasswordReset = async (email: string): Promise<{ debugToken?: string; message: string }> => {
    const res = await fetch('/api/v1/auth/password-reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.detail || data.title || 'Failed to dispatch password reset request');
    return { debugToken: data.debugToken, message: data.message };
  };

  const confirmPasswordReset = async (tokenStr: string, newPassword: string): Promise<void> => {
    const res = await fetch('/api/v1/auth/password-reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenStr, newPassword }),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.detail || data.title || 'Password reset confirmation failed');
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch('/api/v1/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.detail || data.title || 'Password change failed');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        transactionPinUnlocked,
        login,
        logout,
        register,
        verifyTransactionPin,
        refreshUser,
        startMfa,
        confirmMfa,
        requestPasswordReset,
        confirmPasswordReset,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
