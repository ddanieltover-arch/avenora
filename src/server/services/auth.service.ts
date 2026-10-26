/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Customer Identity & Authentication Service
 *
 * Provides:
 * - Scrypt password verification & registration with duplicate prevention
 * - Session lifecycle: creation, rotation, revocation, expiration
 * - Single-use, short-lived password reset tokens
 * - RFC 6238 TOTP Multi-factor authentication enrollment & verification
 * - Role-Based Access Control (RBAC) & customer tenant data isolation
 * - Brute-force rate limiting and account lockout guards
 */

import { SecurityService } from './security.service.ts';
import { defaultLedgerService } from './ledger.service.ts';
import { defaultAuditService } from './audit.service.ts';
import { defaultEmailService, voidEmail } from './email.service.ts';
import { getValidatedConfig } from '../../config/env.config.ts';
import { isKycBypassEnabled } from '../../config/prototypeAccess.ts';

export type UserRole = 'CUSTOMER' | 'SUPPORT' | 'COMPLIANCE_REVIEWER' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'PENDING_VERIFICATION';
export type KycStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_MORE_INFORMATION';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber: string;
  transactionPinHash: string;
  countryCode: string;
  role: UserRole;
  status: UserStatus;
  kycStatus: KycStatus;
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaRecoveryCodes?: string[]; // hashed recovery codes
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  isRevoked: boolean;
  /** True after post-login PIN unlock (or immediately after registration). */
  transactionPinUnlocked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthSuccessResult {
  user: Omit<UserRecord, 'passwordHash' | 'transactionPinHash' | 'mfaSecret' | 'mfaRecoveryCodes'>;
  sessionToken: string;
  expiresAt: Date;
  transactionPinUnlocked: boolean;
}

export class AuthService {
  private usersByEmail = new Map<string, UserRecord>();
  private usersById = new Map<string, UserRecord>();
  private sessionsByTokenHash = new Map<string, SessionRecord>();
  private resetTokensByHash = new Map<string, PasswordResetTokenRecord>();

  // Rate limiting / Lockout config
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

  private readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = this.seedPrimaryAdminAccount();
  }

  /** Single operational admin for local / prototype control-center access. */
  private async seedPrimaryAdminAccount(): Promise<void> {
    const email = 'support@avenorabank.com';
    if (this.usersByEmail.has(email)) {
      return;
    }
    const passwordHash = await SecurityService.hashPassword('AvenoraPassword2026!');
    const transactionPinHash = await SecurityService.hashPassword('1234');
    this.createUserInternal({
      id: 'usr_staff_support_admin_01',
      email,
      passwordHash,
      fullName: 'Avenora Support Admin',
      phoneNumber: '12025550100',
      transactionPinHash,
      countryCode: 'US',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
    });
  }

  /**
   * Creates staff fixtures for automated tests only. Never called from the app constructor.
   */
  public async seedStaffUsersForAutomatedTests(): Promise<void> {
    await this.readyPromise;
    if (this.usersByEmail.has('admin.super@avenora.internal')) {
      return;
    }
    const defaultPassword = 'AvenoraPassword2026!';
    const hash = await SecurityService.hashPassword(defaultPassword);
    const defaultPinHash = await SecurityService.hashPassword('1234');

    this.createUserInternal({
      id: 'usr_staff_support_01',
      email: 'support.lead@avenora.internal',
      passwordHash: hash,
      fullName: 'Elena Rostova (Support)',
      phoneNumber: '12025550200',
      transactionPinHash: defaultPinHash,
      countryCode: 'US',
      role: 'SUPPORT',
      status: 'ACTIVE',
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
    });

    this.createUserInternal({
      id: 'usr_staff_compliance_01',
      email: 'compliance.lead@avenora.internal',
      passwordHash: hash,
      fullName: 'Maria Chen (Compliance)',
      phoneNumber: '12025550201',
      transactionPinHash: defaultPinHash,
      countryCode: 'US',
      role: 'COMPLIANCE_REVIEWER',
      status: 'ACTIVE',
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
    });

    this.createUserInternal({
      id: 'usr_staff_ops_admin_01',
      email: 'admin.ops@avenora.internal',
      passwordHash: hash,
      fullName: 'Marcus Sterling (Ops Admin)',
      phoneNumber: '12025550202',
      transactionPinHash: defaultPinHash,
      countryCode: 'US',
      role: 'ADMIN',
      status: 'ACTIVE',
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
    });

    this.createUserInternal({
      id: 'usr_staff_admin_01',
      email: 'admin.super@avenora.internal',
      passwordHash: hash,
      fullName: 'David Thorne (Super Admin)',
      phoneNumber: '12025550203',
      transactionPinHash: defaultPinHash,
      countryCode: 'US',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      kycStatus: 'APPROVED',
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
    });
  }

  private createUserInternal(user: Omit<UserRecord, 'failedLoginAttempts' | 'createdAt' | 'updatedAt'>): UserRecord {
    const fullRecord: UserRecord = {
      ...user,
      failedLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.usersByEmail.set(user.email.toLowerCase(), fullRecord);
    this.usersById.set(user.id, fullRecord);
    return fullRecord;
  }

  /**
   * Registers a new customer with duplicate email protection.
   */
  public async registerCustomer(params: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    transactionPin: string;
    countryCode?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuthSuccessResult> {
    await this.readyPromise;
    const emailNorm = params.email.trim().toLowerCase();

    if (this.usersByEmail.has(emailNorm)) {
      throw new Error('An account with this email address already exists.');
    }

    if (params.password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const phoneDigits = params.phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      throw new Error('Enter a valid phone number (7–15 digits).');
    }

    if (!/^\d{4}$/.test(params.transactionPin)) {
      throw new Error('Transaction PIN must be exactly 4 digits.');
    }

    const passwordHash = await SecurityService.hashPassword(params.password);
    const transactionPinHash = await SecurityService.hashPassword(params.transactionPin);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const user = this.createUserInternal({
      id: userId,
      email: emailNorm,
      passwordHash,
      fullName: params.fullName.trim(),
      phoneNumber: phoneDigits,
      transactionPinHash,
      countryCode: params.countryCode?.toUpperCase() || 'US',
      role: 'CUSTOMER', // Customers NEVER self-assign roles
      // Inactive until compliance approves KYC (prototype bypass starts ACTIVE).
      status: isKycBypassEnabled() ? 'ACTIVE' : 'PENDING_VERIFICATION',
      kycStatus: isKycBypassEnabled() ? 'APPROVED' : 'NOT_STARTED',
      mfaEnabled: false,
    });

    // Automatically provision user's personal chart of account liabilities in the ledger
    defaultLedgerService.provisionCustomerAccounts(userId, user.fullName, user.countryCode);

    // Best-effort welcome email — never block registration
    void defaultEmailService
      .sendWelcomeEmail({ to: user.email, fullName: user.fullName })
      .catch((err) => console.error('[auth] welcome email failed:', err));

    // Create session — unlock PIN immediately; user just set it during registration
    return this.createSession(user, params.ipAddress, params.userAgent, {
      transactionPinUnlocked: true,
    });
  }

  /**
   * Authenticates a user with password, lockout protection, and optional MFA validation.
   */
  public async login(params: {
    email: string;
    password: string;
    totpCode?: string;
    recoveryCode?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ requiresMfa: boolean; authResult?: AuthSuccessResult }> {
    await this.readyPromise;
    const emailNorm = params.email.trim().toLowerCase();
    const user = this.usersByEmail.get(emailNorm);

    // Generic error to prevent user enumeration
    const genericAuthError = new Error('Invalid email or password.');

    if (!user) {
      // Execute dummy verify to mitigate timing attacks
      await SecurityService.verifyPassword('dummy', 'scrypt:salt:00');
      throw genericAuthError;
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new Error(`Account temporarily locked due to excessive failed attempts. Please try again in ${waitMinutes} minutes.`);
    }

    // Check password
    const isPasswordValid = await SecurityService.verifyPassword(params.password, user.passwordHash);
    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= this.MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS);
        voidEmail(
          'login-lockout',
          defaultEmailService.sendLoginLockoutEmail({
            to: user.email,
            fullName: user.fullName,
            lockMinutes: Math.ceil(this.LOCKOUT_DURATION_MS / 60000),
          }),
        );
      }
      throw genericAuthError;
    }

    // Password is valid - reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;

    // SUSPENDED / LOCKED users may still authenticate (browse / see notices).
    // Financial operations are blocked separately via requireTransactionEligible.

    // Restore normal KYC when bypass is off: undo auto-approvals that never went through review.
    if (!isKycBypassEnabled() && user.role === 'CUSTOMER' && user.kycStatus === 'APPROVED') {
      try {
        const { defaultKycService } = await import('./kyc.service.ts');
        const profile = defaultKycService.getOrCreateProfile(user.id);
        const bypassOnly =
          !profile.reviewedAt ||
          profile.residentialAddress?.street === 'Prototype address pending KYC submission';
        if (bypassOnly) {
          const restoredStatus = profile.submittedAt ? 'SUBMITTED' : 'NOT_STARTED';
          user.kycStatus = restoredStatus;
          profile.status = restoredStatus;
          profile.updatedAt = new Date();
          const { defaultDomesticBankAccountService } = await import('./domesticBankAccount.service.ts');
          defaultDomesticBankAccountService.clearPrimaryAccountForUser(user.id);
        }
        this.syncCustomerActivationFromKyc(user.id);
      } catch {
        /* non-blocking */
      }
    } else if (!isKycBypassEnabled() && user.role === 'CUSTOMER') {
      this.syncCustomerActivationFromKyc(user.id);
    }

    // MFA Check
    if (user.mfaEnabled && user.mfaSecret) {
      if (!params.totpCode && !params.recoveryCode) {
        return { requiresMfa: true };
      }

      if (params.totpCode) {
        const config = getValidatedConfig();
        const isDemoBypass =
          config.PROTOTYPE_MODE &&
          params.totpCode === '123456' &&
          (user.email.endsWith('@avenora.internal') || user.email === 'support@avenorabank.com');
        const isTotpValid = isDemoBypass || SecurityService.verifyTotpCode(user.mfaSecret, params.totpCode);
        if (!isTotpValid) {
          throw new Error('Invalid MFA verification code.');
        }
      } else if (params.recoveryCode) {
        const hashedAttempt = SecurityService.hashToken(params.recoveryCode.trim().toUpperCase());
        const codeIndex = (user.mfaRecoveryCodes || []).indexOf(hashedAttempt);
        if (codeIndex === -1) {
          throw new Error('Invalid or already used recovery code.');
        }
        // Consume single-use recovery code
        user.mfaRecoveryCodes?.splice(codeIndex, 1);
      }
    }

    // Detect new device before session create (new session would otherwise always match)
    const isNewDevice = !Array.from(this.sessionsByTokenHash.values()).some(
      (s) => s.userId === user.id && s.userAgent === params.userAgent,
    );

    // Create session (with session rotation)
    const authResult = await this.createSession(user, params.ipAddress, params.userAgent);
    const signedInAt = new Date().toISOString();
    voidEmail(
      'login-success',
      defaultEmailService.sendLoginSuccessEmail({
        to: user.email,
        fullName: user.fullName,
        ipAddress: params.ipAddress,
        signedInAt,
      }),
    );
    if (isNewDevice) {
      voidEmail(
        'login-new-device',
        defaultEmailService.sendLoginNewDeviceEmail({
          to: user.email,
          fullName: user.fullName,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          signedInAt,
        }),
      );
    }
    return { requiresMfa: false, authResult };
  }

  /**
   * Validates a session token and returns the authenticated user.
   */
  public async validateSession(sessionToken: string): Promise<UserRecord | null> {
    if (!sessionToken) return null;
    await this.readyPromise;

    const tokenHash = SecurityService.hashToken(sessionToken);
    const session = this.sessionsByTokenHash.get(tokenHash);

    if (!session) return null;

    if (session.isRevoked) return null;

    if (session.expiresAt < new Date()) {
      session.isRevoked = true;
      return null;
    }

    const user = this.usersById.get(session.userId);
    if (!user) {
      return null;
    }

    // Keep sessions valid for PENDING_VERIFICATION / SUSPENDED / LOCKED so
    // customers can sign in, complete KYC, view notices, and sign out.
    // Transactions remain frozen by requireTransactionEligible.
    return user;
  }

  /**
   * Revokes a session (Logout).
   */
  public async revokeSession(sessionToken: string): Promise<boolean> {
    const tokenHash = SecurityService.hashToken(sessionToken);
    const session = this.sessionsByTokenHash.get(tokenHash);
    if (session) {
      session.isRevoked = true;
      return true;
    }
    return false;
  }

  /**
   * Revokes all active sessions for a user (e.g. after password reset).
   */
  public async revokeAllUserSessions(userId: string): Promise<void> {
    for (const session of this.sessionsByTokenHash.values()) {
      if (session.userId === userId) {
        session.isRevoked = true;
      }
    }
  }

  /**
   * Initiates password reset workflow: generates single-use short-lived token
   * and dispatches it via Resend when email is configured.
   */
  public async requestPasswordReset(
    email: string
  ): Promise<{ token?: string; emailSent?: boolean }> {
    const user = this.usersByEmail.get(email.trim().toLowerCase());
    if (!user) {
      // Safe no-op to prevent user enumeration
      return {};
    }

    const rawToken = SecurityService.generateSecureToken(32);
    const tokenHash = SecurityService.hashToken(rawToken);

    const record: PasswordResetTokenRecord = {
      id: `prt_${Date.now()}`,
      userId: user.id,
      tokenHash,
      isUsed: false,
      expiresAt: new Date(Date.now() + this.RESET_TOKEN_TTL_MS),
      createdAt: new Date(),
    };

    this.resetTokensByHash.set(tokenHash, record);

    const emailResult = await defaultEmailService.sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      resetToken: rawToken,
    });

    const config = getValidatedConfig();
    // Only expose the raw token in non-production / when email was skipped (prototype DX)
    const exposeDebugToken =
      !emailResult.sent || config.PROTOTYPE_MODE || config.NODE_ENV !== 'production';

    return {
      token: exposeDebugToken ? rawToken : undefined,
      emailSent: emailResult.sent,
    };
  }

  /**
   * Completes password reset using single-use token.
   */
  public async resetPassword(token: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    const tokenHash = SecurityService.hashToken(token);
    const resetRecord = this.resetTokensByHash.get(tokenHash);

    if (!resetRecord || resetRecord.isUsed || resetRecord.expiresAt < new Date()) {
      throw new Error('Password reset token is invalid or has expired.');
    }

    const user = this.usersById.get(resetRecord.userId);
    if (!user) {
      throw new Error('User not found.');
    }

    // Mark single-use token as used immediately
    resetRecord.isUsed = true;

    // Update password
    user.passwordHash = await SecurityService.hashPassword(newPassword);
    user.updatedAt = new Date();

    // Invalidate all existing sessions to enforce security hygiene
    await this.revokeAllUserSessions(user.id);

    voidEmail(
      'password-reset-completed',
      defaultEmailService.sendPasswordResetCompletedEmail({
        to: user.email,
        fullName: user.fullName,
      }),
    );
  }

  /**
   * Authenticated password change.
   */
  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    const user = this.usersById.get(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const isValid = await SecurityService.verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Current password does not match.');
    }

    user.passwordHash = await SecurityService.hashPassword(newPassword);
    user.updatedAt = new Date();

    voidEmail(
      'password-changed',
      defaultEmailService.sendPasswordChangedEmail({
        to: user.email,
        fullName: user.fullName,
      }),
    );
  }

  /**
   * Initiates TOTP MFA enrollment: returns secret and otpauth URI.
   */
  public async startMfaEnrollment(userId: string): Promise<{ secret: string; otpauthUri: string }> {
    const user = this.usersById.get(userId);
    if (!user) throw new Error('User not found');

    const secret = SecurityService.generateTotpSecret();
    const otpauthUri = SecurityService.generateTotpUri(user.email, secret);

    return { secret, otpauthUri };
  }

  /**
   * Confirms TOTP MFA enrollment by validating initial 6-digit code.
   */
  public async confirmMfaEnrollment(userId: string, secret: string, code: string): Promise<{ recoveryCodes: string[] }> {
    const user = this.usersById.get(userId);
    if (!user) throw new Error('User not found');

    const isValid = SecurityService.verifyTotpCode(secret, code);
    if (!isValid) {
      throw new Error('Invalid verification code. Please check your authenticator clock.');
    }

    const { rawCodes, hashedCodes } = SecurityService.generateRecoveryCodes();

    user.mfaEnabled = true;
    user.mfaSecret = secret;
    user.mfaRecoveryCodes = hashedCodes;
    user.updatedAt = new Date();

    voidEmail(
      'mfa-enrolled',
      defaultEmailService.sendMfaEnrolledEmail({
        to: user.email,
        fullName: user.fullName,
      }),
    );

    return { recoveryCodes: rawCodes };
  }

  public getUserById(id: string): UserRecord | undefined {
    return this.usersById.get(id);
  }

  /**
   * Keeps customer account activation aligned with KYC approval.
   * - APPROVED → ACTIVE (transactions permitted)
   * - Any other KYC state → PENDING_VERIFICATION (inactive; no transactions)
   * Does not override admin SUSPENDED / LOCKED holds.
   */
  public syncCustomerActivationFromKyc(userId: string): UserStatus | undefined {
    const user = this.usersById.get(userId);
    if (!user || user.role !== 'CUSTOMER') return undefined;
    if (user.status === 'SUSPENDED' || user.status === 'LOCKED') {
      return user.status;
    }
    if (isKycBypassEnabled() && user.kycStatus === 'APPROVED') {
      if (user.status !== 'ACTIVE') {
        user.status = 'ACTIVE';
        user.updatedAt = new Date();
      }
      return user.status;
    }
    const prevStatus = user.status;
    const nextStatus: UserStatus =
      user.kycStatus === 'APPROVED' ? 'ACTIVE' : 'PENDING_VERIFICATION';
    if (user.status !== nextStatus) {
      user.status = nextStatus;
      user.updatedAt = new Date();
      if (nextStatus === 'PENDING_VERIFICATION' && prevStatus === 'ACTIVE') {
        voidEmail(
          'pending-verification',
          defaultEmailService.sendPendingVerificationEmail({
            to: user.email,
            fullName: user.fullName,
          }),
        );
      }
    }
    return user.status;
  }

  /** Resolve a customer by email (case-insensitive) or internal user id. */
  public resolveUserByEmailOrId(query: string): UserRecord | undefined {
    const trimmed = query.trim();
    if (!trimmed) return undefined;
    const byEmail = this.usersByEmail.get(trimmed.toLowerCase());
    if (byEmail) return byEmail;
    return this.usersById.get(trimmed);
  }

  public sanitizeUser(
    user: UserRecord,
  ): Omit<UserRecord, 'passwordHash' | 'transactionPinHash' | 'mfaSecret' | 'mfaRecoveryCodes'> {
    const { passwordHash, transactionPinHash, mfaSecret, mfaRecoveryCodes, ...safeUser } = user;
    return safeUser;
  }

  /** Returns whether the current session has completed post-login PIN unlock. */
  public isTransactionPinUnlocked(sessionToken: string): boolean {
    if (!sessionToken) return false;
    const tokenHash = SecurityService.hashToken(sessionToken);
    const session = this.sessionsByTokenHash.get(tokenHash);
    if (!session || session.isRevoked || session.expiresAt < new Date()) return false;
    return session.transactionPinUnlocked === true;
  }

  /**
   * Verifies the 4-digit transaction PIN for the session user and unlocks the session.
   * Uses the same lockout counters as password login.
   */
  public async unlockSessionWithTransactionPin(
    sessionToken: string,
    transactionPin: string,
  ): Promise<{ transactionPinUnlocked: true }> {
    await this.readyPromise;

    if (!/^\d{4}$/.test(transactionPin)) {
      throw new Error('Transaction PIN must be exactly 4 digits.');
    }

    const tokenHash = SecurityService.hashToken(sessionToken);
    const session = this.sessionsByTokenHash.get(tokenHash);
    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new Error('Invalid or expired session.');
    }

    const user = this.usersById.get(session.userId);
    if (!user) {
      throw new Error('Invalid or expired session.');
    }

    await this.assertTransactionPinForUser(user, transactionPin);

    session.transactionPinUnlocked = true;
    session.updatedAt = new Date();
    return { transactionPinUnlocked: true };
  }

  /**
   * Verifies a transaction PIN for a money-moving operation (does not unlock the session).
   */
  public async verifyTransactionPinForUser(userId: string, transactionPin: string): Promise<void> {
    await this.readyPromise;

    if (!/^\d{4}$/.test(transactionPin)) {
      throw new Error('Transaction PIN must be exactly 4 digits.');
    }

    const user = this.usersById.get(userId);
    if (!user) {
      throw new Error('Invalid transaction PIN.');
    }

    await this.assertTransactionPinForUser(user, transactionPin);
  }

  private async assertTransactionPinForUser(user: UserRecord, transactionPin: string): Promise<void> {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new Error(
        `Account temporarily locked due to excessive failed attempts. Please try again in ${waitMinutes} minutes.`,
      );
    }

    const isValid = await SecurityService.verifyPassword(transactionPin, user.transactionPinHash);
    if (!isValid) {
      user.failedLoginAttempts += 1;
      user.updatedAt = new Date();
      if (user.failedLoginAttempts >= this.MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS);
        voidEmail(
          'login-lockout',
          defaultEmailService.sendLoginLockoutEmail({
            to: user.email,
            fullName: user.fullName,
            lockMinutes: Math.ceil(this.LOCKOUT_DURATION_MS / 60000),
          }),
        );
      }
      throw new Error('Invalid transaction PIN.');
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.updatedAt = new Date();
  }

  private async createSession(
    user: UserRecord,
    ipAddress?: string,
    userAgent?: string,
    options?: { transactionPinUnlocked?: boolean },
  ): Promise<AuthSuccessResult> {
    const rawSessionToken = SecurityService.generateSecureToken(32);
    const tokenHash = SecurityService.hashToken(rawSessionToken);
    const expiresAt = new Date(Date.now() + this.SESSION_TTL_MS);
    const transactionPinUnlocked = options?.transactionPinUnlocked === true;

    const session: SessionRecord = {
      id: `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      tokenHash,
      ipAddress,
      userAgent,
      isRevoked: false,
      transactionPinUnlocked,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessionsByTokenHash.set(tokenHash, session);

    return {
      user: this.sanitizeUser(user),
      sessionToken: rawSessionToken,
      expiresAt,
      transactionPinUnlocked,
    };
  }

  /**
   * Retrieves all users for operations management (sanitized only).
   * Restricted to staff roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN.
   */
  public async getAllUsersForAdmin(params: {
    actorRole: UserRole;
    search?: string;
    roleFilter?: string;
    statusFilter?: string;
    kycFilter?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    total: number;
    limit: number;
    offset: number;
    users: Array<Omit<UserRecord, 'passwordHash' | 'transactionPinHash' | 'mfaSecret' | 'mfaRecoveryCodes'>>;
  }> {
    await this.readyPromise;
    const allowed: UserRole[] = ['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(params.actorRole)) {
      throw new Error('Access denied: Staff role required.');
    }

    let list = Array.from(this.usersById.values());

    if (params.roleFilter && params.roleFilter !== 'ALL') {
      list = list.filter((u) => u.role === params.roleFilter);
    }
    if (params.statusFilter && params.statusFilter !== 'ALL') {
      list = list.filter((u) => u.status === params.statusFilter);
    }
    if (params.kycFilter && params.kycFilter !== 'ALL') {
      list = list.filter((u) => u.kycStatus === params.kycFilter);
    }
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.id.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q) ||
          u.countryCode.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const limit = Math.min(Math.max(params.limit || 50, 1), 100);
    const offset = Math.max(params.offset || 0, 0);
    const paginated = list.slice(offset, offset + limit).map((u) => this.sanitizeUser(u));

    return { total, limit, offset, users: paginated };
  }

  /**
   * Updates a user's account status (ACTIVE, SUSPENDED, LOCKED).
   * Audited, requires documented operational reason.
   */
  public async updateUserStatus(params: {
    actorUserId: string;
    actorRole: UserRole;
    targetUserId: string;
    newStatus: UserStatus;
    reason: string;
    correlationId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<Omit<UserRecord, 'passwordHash' | 'transactionPinHash' | 'mfaSecret' | 'mfaRecoveryCodes'>> {
    await this.readyPromise;
    const allowed: UserRole[] = ['SUPPORT', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(params.actorRole)) {
      throw new Error('Access denied: Only Support, Admin, or Super Admin can modify account status.');
    }

    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error('A documented operational reason of at least 5 characters is strictly required.');
    }

    const targetUser = this.usersById.get(params.targetUserId);
    if (!targetUser) {
      throw new Error(`Target user not found: ${params.targetUserId}`);
    }

    // Protection rule: SUPPORT cannot suspend/lock ADMIN or SUPER_ADMIN
    if (params.actorRole === 'SUPPORT' && (targetUser.role === 'ADMIN' || targetUser.role === 'SUPER_ADMIN')) {
      throw new Error('Access denied: Support role cannot alter status of Administrator accounts.');
    }

    // Protection rule: Cannot lock or suspend self
    if (params.actorUserId === params.targetUserId && params.newStatus !== 'ACTIVE') {
      throw new Error('Safety guard: You cannot suspend or lock your own active administrative account.');
    }

    const prevStatus = targetUser.status;
    targetUser.status = params.newStatus;
    targetUser.updatedAt = new Date();

    // LOCKED: force re-authentication so the lockout modal is shown on next login.
    // SUSPENDED: keep sessions so the customer stays signed in with a freeze notice.
    if (params.newStatus === 'LOCKED') {
      for (const session of this.sessionsByTokenHash.values()) {
        if (session.userId === targetUser.id) {
          session.isRevoked = true;
        }
      }
    }

    // Append to durable audit trail
    defaultAuditService.logAction({
      action: 'USER_STATUS_CHANGED',
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      resourceType: 'USER',
      resourceId: targetUser.id,
      previousState: prevStatus,
      newState: params.newStatus,
      reason: params.reason.trim(),
      correlationId: params.correlationId,
      details: {
        targetEmail: targetUser.email,
        targetRole: targetUser.role,
      },
    });

    if (params.newStatus === 'SUSPENDED') {
      voidEmail(
        'account-suspended',
        defaultEmailService.sendAccountSuspendedEmail({
          to: targetUser.email,
          fullName: targetUser.fullName,
          reason: params.reason.trim(),
        }),
      );
    } else if (params.newStatus === 'LOCKED') {
      voidEmail(
        'account-locked',
        defaultEmailService.sendAccountLockedEmail({
          to: targetUser.email,
          fullName: targetUser.fullName,
          reason: params.reason.trim(),
        }),
      );
    } else if (
      params.newStatus === 'ACTIVE' &&
      (prevStatus === 'SUSPENDED' || prevStatus === 'LOCKED')
    ) {
      voidEmail(
        'account-restored',
        defaultEmailService.sendAccountRestoredEmail({
          to: targetUser.email,
          fullName: targetUser.fullName,
        }),
      );
    }

    return this.sanitizeUser(targetUser);
  }

  /**
   * Updates a user's role (CUSTOMER, SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN).
   * Strictly restricted to SUPER_ADMIN. Audited, requires documented operational reason.
   */
  public async updateUserRole(params: {
    actorUserId: string;
    actorRole: UserRole;
    targetUserId: string;
    newRole: UserRole;
    reason: string;
    correlationId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<Omit<UserRecord, 'passwordHash' | 'transactionPinHash' | 'mfaSecret' | 'mfaRecoveryCodes'>> {
    await this.readyPromise;
    if (params.actorRole !== 'SUPER_ADMIN') {
      throw new Error('Access denied: Role modifications are strictly restricted to Super Administrators.');
    }

    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error('A documented reason of at least 5 characters is strictly required for role modifications.');
    }

    const targetUser = this.usersById.get(params.targetUserId);
    if (!targetUser) {
      throw new Error(`Target user not found: ${params.targetUserId}`);
    }

    // Prevent demoting the last SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN' && params.newRole !== 'SUPER_ADMIN') {
      const superAdminCount = Array.from(this.usersById.values()).filter((u) => u.role === 'SUPER_ADMIN').length;
      if (superAdminCount <= 1) {
        throw new Error('Cannot demote the only remaining Super Administrator.');
      }
    }

    const prevRole = targetUser.role;
    targetUser.role = params.newRole;
    targetUser.updatedAt = new Date();

    // Log to durable audit trail
    defaultAuditService.logAction({
      action: 'USER_ROLE_CHANGED',
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      resourceType: 'USER',
      resourceId: targetUser.id,
      previousState: prevRole,
      newState: params.newRole,
      reason: params.reason.trim(),
      correlationId: params.correlationId,
      details: {
        targetEmail: targetUser.email,
      },
    });

    voidEmail(
      'role-changed',
      defaultEmailService.sendRoleChangedEmail({
        to: targetUser.email,
        fullName: targetUser.fullName,
        newRole: params.newRole,
      }),
    );

    return this.sanitizeUser(targetUser);
  }

  /**
   * Permanently deletes a user account (prototype in-memory store).
   * Revokes sessions. Cannot delete self or the last SUPER_ADMIN.
   */
  public async deleteUser(params: {
    actorUserId: string;
    actorRole: UserRole;
    targetUserId: string;
    reason: string;
    correlationId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ deletedUserId: string; email: string }> {
    await this.readyPromise;
    const allowed: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(params.actorRole)) {
      throw new Error('Access denied: Only Admin or Super Admin can delete user accounts.');
    }

    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error('A documented operational reason of at least 5 characters is strictly required.');
    }

    if (params.actorUserId === params.targetUserId) {
      throw new Error('Safety guard: You cannot delete your own administrative account.');
    }

    const targetUser = this.usersById.get(params.targetUserId);
    if (!targetUser) {
      throw new Error(`Target user not found: ${params.targetUserId}`);
    }

    if (params.actorRole === 'ADMIN' && (targetUser.role === 'ADMIN' || targetUser.role === 'SUPER_ADMIN')) {
      throw new Error('Access denied: Admin cannot delete Administrator accounts.');
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      const superAdminCount = Array.from(this.usersById.values()).filter((u) => u.role === 'SUPER_ADMIN').length;
      if (superAdminCount <= 1) {
        throw new Error('Cannot delete the only remaining Super Administrator.');
      }
    }

    const email = targetUser.email;
    const fullName = targetUser.fullName;
    const role = targetUser.role;

    for (const session of this.sessionsByTokenHash.values()) {
      if (session.userId === targetUser.id) {
        session.isRevoked = true;
      }
    }
    for (const [hash, token] of this.resetTokensByHash.entries()) {
      if (token.userId === targetUser.id) {
        this.resetTokensByHash.delete(hash);
      }
    }

    this.usersByEmail.delete(email.toLowerCase());
    this.usersById.delete(targetUser.id);

    defaultAuditService.logAction({
      action: 'USER_DELETED',
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      resourceType: 'USER',
      resourceId: params.targetUserId,
      previousState: role,
      newState: 'DELETED',
      reason: params.reason.trim(),
      correlationId: params.correlationId,
      details: {
        targetEmail: email,
        targetRole: role,
        targetFullName: fullName,
      },
    });

    voidEmail(
      'account-deleted',
      defaultEmailService.sendAccountDeletedEmail({
        to: email,
        fullName,
      }),
    );

    return { deletedUserId: params.targetUserId, email };
  }
}

export const defaultAuthService = new AuthService();
