/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Authentication Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { defaultAuthService } from '../services/auth.service.ts';
import { authenticate } from '../middleware/auth.ts';
import { isValidIsoCountryCode } from '../../config/countryOptions.ts';

export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z
    .string()
    .min(7, 'Phone number is required')
    .max(32, 'Phone number is too long')
    .refine((value) => {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    }, 'Enter a valid phone number (7–15 digits)'),
  transactionPin: z
    .string()
    .regex(/^\d{4}$/, 'Transaction PIN must be exactly 4 digits'),
  countryCode: z
    .string()
    .length(2, 'Country code must be 2 characters (e.g. US, BR, ES)')
    .transform((code) => code.toUpperCase())
    .refine(isValidIsoCountryCode, 'Select a valid country'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
  recoveryCode: z.string().optional(),
});

const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
});

const PasswordResetConfirmSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8),
});

const MfaConfirmSchema = z.object({
  secret: z.string().min(16),
  code: z.string().length(6),
});

/**
 * POST /api/v1/auth/register
 */
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const result = await defaultAuthService.registerCustomer({
      email: validated.email,
      password: validated.password,
      fullName: validated.fullName,
      phoneNumber: validated.phoneNumber,
      transactionPin: validated.transactionPin,
      countryCode: validated.countryCode,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Generate domestic bank identifiers only when KYC is already approved (or bypass enabled).
    try {
      const { defaultDomesticBankAccountService } = await import('../services/domesticBankAccount.service.ts');
      await defaultDomesticBankAccountService.ensurePrimaryAccountForActiveUser({
        userId: result.user.id,
        correlationId: `register_${result.user.id}`,
      });
    } catch {
      /* Generation failures must not block registration; /me will retry after KYC. */
    }

    // Set secure HttpOnly cookie
    res.cookie('avenora_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: result.expiresAt,
    });

    res.status(201).json({
      status: 'registered',
      user: result.user,
      sessionToken: result.sessionToken,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('already exists')) {
      res.status(409).json({
        type: 'https://avenora.com/errors/account-conflict',
        title: 'Account Already Exists',
        status: 409,
        detail: message,
        instance: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    if (message.includes('Password must be')) {
      res.status(400).json({
        type: 'https://avenora.com/errors/invalid-password',
        title: 'Weak Password',
        status: 400,
        detail: message,
        instance: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(err);
  }
});

/**
 * POST /api/v1/auth/login
 */
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const { requiresMfa, authResult } = await defaultAuthService.login({
      email: validated.email,
      password: validated.password,
      totpCode: validated.totpCode,
      recoveryCode: validated.recoveryCode,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    if (requiresMfa) {
      res.status(200).json({
        status: 'mfa_required',
        message: 'Multi-factor authentication required. Please submit a 6-digit TOTP code or recovery code.',
      });
      return;
    }

    if (!authResult) {
      res.status(401).json({
        type: 'https://avenora.com/errors/invalid-credentials',
        title: 'Authentication Failed',
        status: 401,
        detail: 'Invalid credentials.',
      });
      return;
    }

    // Backfill domestic identifiers when KYC is approved (no-op until then).
    try {
      const { defaultDomesticBankAccountService } = await import('../services/domesticBankAccount.service.ts');
      await defaultDomesticBankAccountService.ensurePrimaryAccountForActiveUser({
        userId: authResult.user.id,
        correlationId: `login_${authResult.user.id}`,
      });
    } catch {
      /* non-blocking */
    }

    const liveUser = defaultAuthService.getUserById(authResult.user.id);

    res.cookie('avenora_session', authResult.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: authResult.expiresAt,
    });

    res.status(200).json({
      status: 'authenticated',
      user: liveUser
        ? {
            ...authResult.user,
            kycStatus: liveUser.kycStatus,
            status: liveUser.status,
            countryCode: liveUser.countryCode,
          }
        : authResult.user,
      sessionToken: authResult.sessionToken,
      expiresAt: authResult.expiresAt.toISOString(),
    });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('Invalid email or password')) {
      res.status(401).json({
        type: 'https://avenora.com/errors/invalid-credentials',
        title: 'Authentication Failed',
        status: 401,
        detail: 'Invalid email or password. Please verify your credentials or register for an account.',
        instance: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (message.includes('temporarily locked')) {
      res.status(423).json({
        type: 'https://avenora.com/errors/account-locked',
        title: 'Account Locked',
        status: 423,
        detail: message,
        instance: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (message.includes('Account is')) {
      res.status(403).json({
        type: 'https://avenora.com/errors/account-suspended',
        title: 'Account Suspended or Inactive',
        status: 403,
        detail: message,
        instance: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (message.includes('MFA') || message.includes('recovery code')) {
      res.status(401).json({
        type: 'https://avenora.com/errors/invalid-mfa',
        title: 'MFA Verification Failed',
        status: 401,
        detail: message,
        instance: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next(err);
  }
});

/**
 * POST /api/v1/auth/logout
 */
authRouter.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.sessionToken) {
      await defaultAuthService.revokeSession(req.sessionToken);
    }
    res.clearCookie('avenora_session');
    res.status(200).json({ status: 'logged_out', message: 'Session successfully revoked.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/me
 */
authRouter.get('/me', authenticate, (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({
    user: defaultAuthService.sanitizeUser(req.user),
  });
});

/**
 * POST /api/v1/auth/password-reset/request
 */
authRouter.post('/password-reset/request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = PasswordResetRequestSchema.parse(req.body);
    const result = await defaultAuthService.requestPasswordReset(validated.email);

    res.status(200).json({
      status: 'success',
      message: 'If the email exists, a password reset link has been dispatched.',
      emailSent: result.emailSent ?? false,
      // Prototype / local DX only — omitted when production email delivery succeeds
      ...(result.token ? { debugToken: result.token } : {}),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/password-reset/confirm
 */
authRouter.post('/password-reset/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = PasswordResetConfirmSchema.parse(req.body);
    await defaultAuthService.resetPassword(validated.token, validated.newPassword);

    res.status(200).json({
      status: 'success',
      message: 'Password successfully updated. All previous sessions have been invalidated.',
    });
  } catch (err) {
    next(err);
  }
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

/**
 * POST /api/v1/auth/change-password
 */
authRouter.post('/change-password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = ChangePasswordSchema.parse(req.body);
    await defaultAuthService.changePassword(req.user!.id, validated.currentPassword, validated.newPassword);
    res.status(200).json({
      status: 'success',
      message: 'Password successfully changed.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/mfa/enroll
 */
authRouter.post('/mfa/enroll', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await defaultAuthService.startMfaEnrollment(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/mfa/confirm
 */
authRouter.post('/mfa/confirm', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = MfaConfirmSchema.parse(req.body);
    const result = await defaultAuthService.confirmMfaEnrollment(
      req.user!.id,
      validated.secret,
      validated.code
    );

    res.json({
      status: 'mfa_enabled',
      recoveryCodes: result.recoveryCodes,
      message: 'MFA enabled. Store recovery codes in a secure location.',
    });
  } catch (err) {
    next(err);
  }
});
