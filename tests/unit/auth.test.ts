/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Customer Identity & Auth Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityService } from '../../src/server/services/security.service.ts';
import { AuthService } from '../../src/server/services/auth.service.ts';

const registrationExtras = {
  phoneNumber: '+12025550199',
  transactionPin: '4321',
  countryCode: 'US',
};

describe('Customer Identity, Sessions & MFA Services', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('correctly hashes and verifies passwords using Scrypt with constant-time equality', async () => {
    const rawPassword = 'AvenoraPassword2026!';
    const hash = await SecurityService.hashPassword(rawPassword);

    expect(hash.startsWith('scrypt:')).toBe(true);
    const isValid = await SecurityService.verifyPassword(rawPassword, hash);
    expect(isValid).toBe(true);

    const isWrong = await SecurityService.verifyPassword('WrongPassword123', hash);
    expect(isWrong).toBe(false);
  });

  it('registers a new customer and prevents duplicate accounts', async () => {
    const email = 'customer.test@example.com';
    const regResult = await authService.registerCustomer({
      email,
      password: 'SecurePassword2026!',
      fullName: 'Jane Doe',
      ...registrationExtras,
    });

    expect(regResult.user.id).toBeDefined();
    expect(regResult.user.email).toBe(email);
    expect(regResult.user.role).toBe('CUSTOMER');
    expect(regResult.sessionToken).toBeDefined();

    // Duplicate registration must fail
    await expect(
      authService.registerCustomer({
        email,
        password: 'AnotherPassword2026!',
        fullName: 'Jane Duplicate',
        ...registrationExtras,
      })
    ).rejects.toThrow(/already exists/);
  });

  it('validates active sessions and rejects revoked sessions upon logout', async () => {
    const { sessionToken, user } = await authService.registerCustomer({
      email: 'session.user@example.com',
      password: 'SecurePassword2026!',
      fullName: 'Session User',
      ...registrationExtras,
    });

    const activeUser = await authService.validateSession(sessionToken);
    expect(activeUser).not.toBeNull();
    expect(activeUser?.id).toBe(user.id);

    // Logout / revoke
    const revoked = await authService.revokeSession(sessionToken);
    expect(revoked).toBe(true);

    const postLogoutUser = await authService.validateSession(sessionToken);
    expect(postLogoutUser).toBeNull();
  });

  it('enforces account lockout after 5 consecutive failed login attempts', async () => {
    const email = 'lockout.test@example.com';
    await authService.registerCustomer({
      email,
      password: 'CorrectPassword2026!',
      fullName: 'Lockout Target',
      ...registrationExtras,
    });

    // 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      await expect(
        authService.login({
          email,
          password: 'WrongPassword',
        })
      ).rejects.toThrow(/Invalid email or password/);
    }

    // 6th attempt must report account locked
    await expect(
      authService.login({
        email,
        password: 'CorrectPassword2026!',
      })
    ).rejects.toThrow(/temporarily locked/);
  });

  it('handles single-use password reset tokens and invalidates existing sessions', async () => {
    const email = 'reset.user@example.com';
    const { sessionToken, user } = await authService.registerCustomer({
      email,
      password: 'OldPassword2026!',
      fullName: 'Reset User',
      ...registrationExtras,
    });

    // Request reset
    const { token } = await authService.requestPasswordReset(email);
    expect(token).toBeDefined();

    // Complete reset
    await authService.resetPassword(token!, 'BrandNewPassword2026!');

    // Old session must now be invalidated
    const oldSessionValid = await authService.validateSession(sessionToken);
    expect(oldSessionValid).toBeNull();

    // Token cannot be reused (single-use enforcement)
    await expect(
      authService.resetPassword(token!, 'ThirdPassword2026!')
    ).rejects.toThrow(/invalid or has expired/);

    // New password allows login
    const loginResult = await authService.login({
      email,
      password: 'BrandNewPassword2026!',
    });
    expect(loginResult.authResult?.user.id).toBe(user.id);
  });

  it('unlocks session with transaction PIN after login and rejects wrong PIN', async () => {
    const email = 'pin.unlock@example.com';
    const pin = '4321';
    await authService.registerCustomer({
      email,
      password: 'SecurePassword2026!',
      fullName: 'PIN Unlock User',
      phoneNumber: '+12025550199',
      transactionPin: pin,
      countryCode: 'US',
    });

    const loginResult = await authService.login({
      email,
      password: 'SecurePassword2026!',
    });
    expect(loginResult.requiresMfa).toBe(false);
    expect(loginResult.authResult?.transactionPinUnlocked).toBe(false);
    const sessionToken = loginResult.authResult!.sessionToken;
    expect(authService.isTransactionPinUnlocked(sessionToken)).toBe(false);

    await expect(
      authService.unlockSessionWithTransactionPin(sessionToken, '9999'),
    ).rejects.toThrow(/Invalid transaction PIN/);
    expect(authService.isTransactionPinUnlocked(sessionToken)).toBe(false);

    const unlocked = await authService.unlockSessionWithTransactionPin(sessionToken, pin);
    expect(unlocked.transactionPinUnlocked).toBe(true);
    expect(authService.isTransactionPinUnlocked(sessionToken)).toBe(true);
  });

  it('auto-unlocks transaction PIN on registration session', async () => {
    const result = await authService.registerCustomer({
      email: 'pin.register@example.com',
      password: 'SecurePassword2026!',
      fullName: 'PIN Register User',
      ...registrationExtras,
    });
    expect(result.transactionPinUnlocked).toBe(true);
    expect(authService.isTransactionPinUnlocked(result.sessionToken)).toBe(true);
  });

  it('verifies transaction PIN for money-move checks without changing unlock state', async () => {
    const { user, sessionToken } = await authService.registerCustomer({
      email: 'pin.verify@example.com',
      password: 'SecurePassword2026!',
      fullName: 'PIN Verify User',
      phoneNumber: '+12025550188',
      transactionPin: '2468',
      countryCode: 'US',
    });

    // Simulate a fresh login-locked session by creating unlock=false via login
    await authService.revokeSession(sessionToken);
    const login = await authService.login({
      email: 'pin.verify@example.com',
      password: 'SecurePassword2026!',
    });
    const lockedToken = login.authResult!.sessionToken;
    expect(authService.isTransactionPinUnlocked(lockedToken)).toBe(false);

    await authService.verifyTransactionPinForUser(user.id, '2468');
    expect(authService.isTransactionPinUnlocked(lockedToken)).toBe(false);

    await expect(authService.verifyTransactionPinForUser(user.id, '0000')).rejects.toThrow(
      /Invalid transaction PIN/,
    );
  });

  it('enrolls and verifies TOTP MFA codes and recovery codes', async () => {
    const { user } = await authService.registerCustomer({
      email: 'mfa.user@example.com',
      password: 'SecurePassword2026!',
      fullName: 'MFA User',
      ...registrationExtras,
    });

    const { secret, otpauthUri } = await authService.startMfaEnrollment(user.id);
    expect(secret.length).toBeGreaterThanOrEqual(16);
    expect(otpauthUri).toContain('otpauth://totp/');

    // Generate valid TOTP code
    const validCode = SecurityService.generateTotpCode(secret);
    const { recoveryCodes } = await authService.confirmMfaEnrollment(user.id, secret, validCode);

    expect(recoveryCodes.length).toBe(8);

    // Login now requires MFA
    const loginStep1 = await authService.login({
      email: 'mfa.user@example.com',
      password: 'SecurePassword2026!',
    });
    expect(loginStep1.requiresMfa).toBe(true);

    // Login with recovery code
    const recoveryCode = recoveryCodes[0]!;
    const loginStep2 = await authService.login({
      email: 'mfa.user@example.com',
      password: 'SecurePassword2026!',
      recoveryCode,
    });
    expect(loginStep2.requiresMfa).toBe(false);
    expect(loginStep2.authResult?.user.id).toBe(user.id);

    // Reusing the same recovery code must fail
    await expect(
      authService.login({
        email: 'mfa.user@example.com',
        password: 'SecurePassword2026!',
        recoveryCode,
      })
    ).rejects.toThrow(/already used/);
  });
});
