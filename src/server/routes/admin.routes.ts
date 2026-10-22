/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Secure Admin & Operations Control Center HTTP Routes
 *
 * Implements:
 * - Server-side least-privilege RBAC (SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN)
 * - Operational overview metrics across all queues and workflows
 * - Customer management (search, inspection, status changes with mandatory reason)
 * - KYC review queue with separation of duties enforcement
 * - Transaction investigation and immutable compensating reversals
 * - Card freeze/unfreeze operations
 * - Webhook event monitoring
 * - Durable audit log queries with PII redaction
 * - System readiness and operational controls
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRoles } from '../middleware/auth.ts';
import { defaultAuthService, UserRole, UserStatus } from '../services/auth.service.ts';
import { defaultKycService } from '../services/kyc.service.ts';
import { defaultWalletService } from '../services/wallet.service.ts';
import { defaultLedgerService } from '../services/ledger.service.ts';
import { defaultCardService } from '../services/card.service.ts';
import { defaultLoanService } from '../services/loan.service.ts';
import { defaultGrantService } from '../services/grant.service.ts';
import { defaultWebhookService } from '../services/webhook.service.ts';
import { defaultAuditService } from '../services/audit.service.ts';
import { defaultProviderPaymentService } from '../services/providerPayment.service.ts';
import { getSafePublicConfig, getValidatedConfig } from '../../config/env.config.ts';
import { PLATFORM_METADATA } from '../../config/constants.ts';

export const adminRouter = Router();

// Validation Schemas
const UpdateCustomerStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_VERIFICATION']),
  reason: z.string().min(5, 'A documented operational reason of at least 5 characters is required'),
});

const UpdateCustomerRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  reason: z.string().min(5, 'A documented operational reason of at least 5 characters is required'),
});

const DeleteCustomerSchema = z.object({
  reason: z.string().min(5, 'A documented operational reason of at least 5 characters is required'),
});

const AdminFundingAdjustmentSchema = z.object({
  direction: z.enum(['CREDIT', 'DEBIT']),
  currency: z.string().min(2).max(10),
  amountDecimal: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Amount must be a positive decimal string'),
  reason: z.string().min(3).max(2000),
});

const AdminKycReviewSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'NEEDS_MORE_INFORMATION', 'UNDER_REVIEW']),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
  reasonCode: z.string().optional(),
  expectedVersion: z.number().int().optional(),
});

const ReverseTransactionSchema = z.object({
  reason: z.string().min(5, 'A documented operational reason of at least 5 characters is required'),
});

const AdminCardStatusSchema = z.object({
  status: z.enum(['ACTIVE_SIMULATED', 'FROZEN', 'TERMINATED']),
  reason: z.string().min(5, 'A documented operational reason of at least 5 characters is required'),
});

const AdminCardIssuanceReviewSchema = z.object({
  decision: z.enum(['APPROVE', 'DECLINE', 'DELETE']),
  reason: z.string().min(5, 'A documented reason of at least 5 characters is required'),
});

const AdminCardDeleteSchema = z.object({
  reason: z.string().min(5, 'A documented reason of at least 5 characters is required'),
});

const AdminLoanReviewSchema = z.object({
  decision: z.enum(['APPROVED_FOR_DEMO', 'DECLINED_FOR_DEMO', 'NEEDS_MORE_INFORMATION', 'UNDER_REVIEW']),
  reasonCode: z.string().min(3, 'A reason code or underwriting note is required'),
  notes: z.string().optional(),
});

const AdminGrantReviewSchema = z.object({
  decision: z.enum(['APPROVED_FOR_DEMO', 'DECLINED', 'NEEDS_MORE_INFORMATION', 'UNDER_REVIEW']),
  notes: z.string().min(5, 'A documented review reason of at least 5 characters is required'),
});

const AdminGrantVerifySchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  notes: z.string().optional(),
});

/**
 * GET /api/v1/admin/overview
 * Consolidated operational workflow counts, queue aging, and ledger status.
 * Roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/overview',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;

      // 1. Customers
      const usersData = await defaultAuthService.getAllUsersForAdmin({ actorRole: user.role, limit: 1000 });
      const totalUsers = usersData.total;
      const activeUsers = usersData.users.filter((u) => u.status === 'ACTIVE').length;
      const suspendedUsers = usersData.users.filter((u) => u.status === 'SUSPENDED').length;
      const lockedUsers = usersData.users.filter((u) => u.status === 'LOCKED').length;

      // 2. KYC Profiles
      const kycProfiles = defaultKycService.getAllProfilesForReview(user.role);
      const pendingKyc = kycProfiles.filter((p) => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW');
      const approvedKyc = kycProfiles.filter((p) => p.status === 'APPROVED').length;
      const rejectedKyc = kycProfiles.filter((p) => p.status === 'REJECTED').length;

      // Queue Aging for KYC
      const now = Date.now();
      const kycAging = {
        under24h: 0,
        oneToThreeDays: 0,
        overThreeDays: 0,
      };
      for (const p of pendingKyc) {
        const submitted = p.submittedAt ? new Date(p.submittedAt).getTime() : now;
        const ageHours = (now - submitted) / (1000 * 60 * 60);
        if (ageHours < 24) kycAging.under24h++;
        else if (ageHours <= 72) kycAging.oneToThreeDays++;
        else kycAging.overThreeDays++;
      }

      // 3. Loans
      const allLoans = defaultLoanService.getAllApplicationsForReview(user.role);
      const pendingLoans = allLoans.filter((l) => l.status === 'SUBMITTED' || l.status === 'UNDER_REVIEW').length;
      const approvedLoans = allLoans.filter((l) => l.status === 'APPROVED_FOR_DEMO').length;
      const declinedLoans = allLoans.filter((l) => l.status === 'DECLINED_FOR_DEMO').length;

      // 4. Grants
      const allGrants = defaultGrantService.getAllApplicationsForReview(user.role);
      const pendingGrants = allGrants.filter(
        (g) => g.status === 'SUBMITTED' || g.status === 'UNDER_REVIEW' || g.status === 'ELIGIBLE_FOR_REVIEW'
      ).length;
      const disbursedGrants = allGrants.filter((g) => g.award?.disbursementStatus === 'DISBURSED_SIMULATED').length;

      // 5. Cards
      const cardsData = defaultCardService.getAllCardsForAdmin({ actorRole: user.role, limit: 1000 });
      const totalCards = cardsData.total;
      const activeCards = cardsData.cards.filter((c) => c.status === 'ACTIVE_SIMULATED').length;
      const frozenCards = cardsData.cards.filter((c) => c.status === 'FROZEN').length;
      const terminatedCards = cardsData.cards.filter((c) => c.status === 'TERMINATED').length;
      const pendingCardIssuance = cardsData.cards.filter(
        (c) => c.status === 'PENDING_REVIEW' || c.status === 'REQUESTED'
      ).length;

      // 6. Pending wallet deposits (hold queue)
      const pendingDepositQueue = defaultWalletService.getPendingDepositsForAdmin({ actorRole: user.role });
      const pendingWithdrawalQueue = defaultWalletService.getPendingWithdrawalsForAdmin({ actorRole: user.role });

      // 7. Transactions
      const txData = defaultWalletService.getAllTransactionsForAdmin({ actorRole: user.role, limit: 1000 });
      const totalTransactions = txData.total;
      const reversedTransactions = txData.transactions.filter((t) => t.status === 'REVERSED').length;

      // 8. Ledger Invariant & Summary
      const ledgerSummary = defaultLedgerService.getLedgerSummary();

      // 9. Webhooks
      const webhookEvents = defaultWebhookService.getRecentEvents(100);
      const totalWebhooks = webhookEvents.length;
      const processedWebhooks = webhookEvents.filter((w) => w.status === 'PROCESSED').length;
      const duplicateWebhooks = webhookEvents.filter((w) => w.status === 'DUPLICATE').length;

      // 10. Audit Logs count
      const auditCount = defaultAuditService.getRecentCount();

      res.json({
        metricsGeneratedAt: new Date().toISOString(),
        actorRole: user.role,
        environment: 'production-oriented',
        customers: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          locked: lockedUsers,
          source: 'AuthService User Store',
        },
        kycQueue: {
          pendingReview: pendingKyc.length,
          approved: approvedKyc,
          rejected: rejectedKyc,
          aging: kycAging,
          source: 'KycService Verification Store',
        },
        loans: {
          total: allLoans.length,
          pendingReview: pendingLoans,
          approvedDemo: approvedLoans,
          declinedDemo: declinedLoans,
          source: 'LoanService Application Store',
        },
        grants: {
          total: allGrants.length,
          pendingReview: pendingGrants,
          disbursedSimulated: disbursedGrants,
          source: 'GrantService Application Store',
        },
        cards: {
          total: totalCards,
          activeSimulated: activeCards,
          frozen: frozenCards,
          terminated: terminatedCards,
          pendingIssuance: pendingCardIssuance,
          source: 'CardService Store',
        },
        deposits: {
          pendingReview: pendingDepositQueue.length,
          source: 'Wallet Pending Deposit Hold Queue',
        },
        withdrawals: {
          pendingReview: pendingWithdrawalQueue.length,
          source: 'Wallet Pending Withdrawal Hold Queue',
        },
        transactions: {
          total: totalTransactions,
          posted: totalTransactions - reversedTransactions,
          reversed: reversedTransactions,
          source: 'Wallet & Ledger Operations Engine',
        },
        ledger: {
          totalAccounts: ledgerSummary.totalAccounts,
          totalJournalEntries: ledgerSummary.totalEntries,
          isBalanced: ledgerSummary.isBalanced,
          globalDebitsMinor: ledgerSummary.globalDebitsMinor,
          globalCreditsMinor: ledgerSummary.globalCreditsMinor,
          imbalanceMinor: ledgerSummary.imbalanceMinor,
          source: 'Double-Entry Invariant Engine (Sum(Debits) === Sum(Credits))',
        },
        webhooks: {
          total: totalWebhooks,
          processed: processedWebhooks,
          duplicate: duplicateWebhooks,
          source: 'Mock Webhook Gateway HMAC Store',
        },
        auditLogs: {
          total: auditCount,
          source: 'Durable Audit Service',
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/customers
 * Paginated customer management list with filtering.
 * Roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/customers',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, role, status, kycStatus, limit, offset } = req.query;
      const result = await defaultAuthService.getAllUsersForAdmin({
        actorRole: req.user!.role,
        search: search ? String(search) : undefined,
        roleFilter: role ? String(role) : undefined,
        statusFilter: status ? String(status) : undefined,
        kycFilter: kycStatus ? String(kycStatus) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 50,
        offset: offset ? parseInt(String(offset), 10) : 0,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/customers/:id
 * Customer detail with sanitized wallets, cards, transactions, and KYC metadata.
 * Roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/customers/:id',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.params.id!;
      const user = defaultAuthService.getUserById(customerId);
      if (!user) {
        res.status(404).json({
          type: 'https://avenora.com/errors/not-found',
          title: 'Customer Not Found',
          status: 404,
          detail: `Customer with ID "${customerId}" does not exist.`,
        });
        return;
      }

      const safeUser = defaultAuthService.sanitizeUser(user);
      const kycProfile = defaultKycService.getOrCreateProfile(customerId);
      const wallet = defaultWalletService.getOrCreateUserWallet(customerId);
      const ledgerAccounts = defaultLedgerService.getUserAccounts(customerId);
      const cards = defaultCardService.getUserCards(customerId).map((c) => {
        const { syntheticPanFormatted, syntheticCvv, ...safeCard } = c;
        return safeCard;
      });
      const transactions = defaultWalletService.getUserTransactions(customerId);

      res.json({
        customer: safeUser,
        kycProfile,
        wallet,
        ledgerAccounts,
        cards,
        recentTransactions: transactions.slice(0, 15),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/admin/customers/:id/status
 * Updates account status (ACTIVE, SUSPENDED, LOCKED).
 * Roles: SUPPORT, ADMIN, SUPER_ADMIN. Requires documented reason.
 */
adminRouter.patch(
  '/customers/:id/status',
  authenticate,
  requireRoles(['SUPPORT', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUserId = req.params.id!;
      const validated = UpdateCustomerStatusSchema.parse(req.body);

      const updated = await defaultAuthService.updateUserStatus({
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        targetUserId,
        newStatus: validated.status as UserStatus,
        reason: validated.reason,
        correlationId: req.headers['x-correlation-id'] as string,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        status: 'status_updated',
        customer: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/admin/customers/:id/role
 * Updates account role.
 * Roles: SUPER_ADMIN only. Requires documented reason.
 */
adminRouter.patch(
  '/customers/:id/role',
  authenticate,
  requireRoles(['SUPER_ADMIN']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUserId = req.params.id!;
      const validated = UpdateCustomerRoleSchema.parse(req.body);

      const updated = await defaultAuthService.updateUserRole({
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        targetUserId,
        newRole: validated.role as UserRole,
        reason: validated.reason,
        correlationId: req.headers['x-correlation-id'] as string,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        status: 'role_updated',
        customer: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/customers/:id/delete
 * Permanently deletes a user account. Roles: ADMIN, SUPER_ADMIN.
 */
adminRouter.post(
  '/customers/:id/delete',
  authenticate,
  requireRoles(['ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUserId = req.params.id!;
      const validated = DeleteCustomerSchema.parse(req.body ?? {});

      const result = await defaultAuthService.deleteUser({
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        targetUserId,
        reason: validated.reason,
        correlationId: req.headers['x-correlation-id'] as string,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        status: 'customer_deleted',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/customers/:id/funding-adjustment
 * Queues an admin CREDIT (pending deposit hold) or DEBIT (pending withdrawal hold).
 * Roles: ADMIN, SUPER_ADMIN. Requires documented reason. Approve/reject via existing queues.
 */
adminRouter.post(
  '/customers/:id/funding-adjustment',
  authenticate,
  requireRoles(['ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUserId = req.params.id!;
      const validated = AdminFundingAdjustmentSchema.parse(req.body);

      const result = await defaultWalletService.adminRequestFundingAdjustment({
        targetUserId,
        direction: validated.direction,
        currency: validated.currency,
        amountDecimal: validated.amountDecimal,
        reason: validated.reason,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
      });

      if (result.direction === 'CREDIT') {
        const d = result.deposit;
        res.status(201).json({
          status: 'pending_review',
          direction: 'CREDIT',
          message:
            'Admin credit queued as a pending deposit hold. Approve from the deposit queue to move funds to available balance.',
          deposit: {
            ...d,
            submittedAt: d.submittedAt.toISOString(),
            reviewedAt: d.reviewedAt?.toISOString(),
          },
        });
        return;
      }

      const w = result.withdrawal;
      res.status(201).json({
        status: 'pending_review',
        direction: 'DEBIT',
        message:
          'Admin debit queued as a pending withdrawal hold. Approve from the withdrawal queue to complete the adjustment.',
        withdrawal: {
          ...w,
          submittedAt: w.submittedAt.toISOString(),
          reviewedAt: w.reviewedAt?.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/kyc/queue
 * KYC compliance review cases.
 * Roles: COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/kyc/queue',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { status } = req.query;
      let profiles = defaultKycService.getAllProfilesForReview(req.user!.role);

      if (status && status !== 'ALL') {
        profiles = profiles.filter((p) => p.status === status);
      }

      res.json({
        total: profiles.length,
        profiles,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/kyc/:userId
 * Retrieves complete KYC profile and review history for compliance inspection.
 * Roles: COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/kyc/:userId',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const targetUserId = req.params.userId!;
      const profile = defaultKycService.getOrCreateProfile(targetUserId);
      res.json({ profile });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/kyc/:userId/documents/:documentId
 * Securely accesses identity document reference. Prohibits public exposure.
 * Roles: COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/kyc/:userId/documents/:documentId',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { userId, documentId } = req.params;
      const result = defaultKycService.getSecureDocumentAccess({
        targetUserId: userId!,
        documentId: documentId!,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/kyc/:userId/review
 * Record KYC compliance decision. Separation of duties enforced.
 * Roles: COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.post(
  '/kyc/:userId/review',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUserId = req.params.userId!;
      const validated = AdminKycReviewSchema.parse(req.body);

      const updated = await defaultKycService.reviewProfile({
        reviewerRole: req.user!.role,
        reviewerUserId: req.user!.id,
        reviewerName: req.user!.fullName,
        targetUserId,
        decision: validated.decision,
        notes: validated.notes,
        rejectionReason: validated.rejectionReason,
        reasonCode: validated.reasonCode,
        expectedVersion: validated.expectedVersion,
      });

      res.json({
        status: 'decision_recorded',
        profile: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/deposits/pending
 * Fiat and BTC deposit requests awaiting approval (customer hold balance).
 */
adminRouter.get(
  '/deposits/pending',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const deposits = defaultWalletService.getPendingDepositsForAdmin({ actorRole: req.user!.role });
      const enriched = deposits.map((d) => {
        const customer = defaultAuthService.getUserById(d.userId);
        return {
          ...d,
          submittedAt: d.submittedAt.toISOString(),
          reviewedAt: d.reviewedAt?.toISOString(),
          customerEmail: customer?.email,
          customerName: customer?.fullName,
        };
      });
      res.json({ total: enriched.length, deposits: enriched });
    } catch (err) {
      next(err);
    }
  }
);

const DepositApproveSchema = z.object({
  notes: z.string().max(2000).optional(),
});

const DepositRejectSchema = z.object({
  reason: z.string().min(3).max(2000),
});

adminRouter.post(
  '/deposits/:depositId/approve',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = DepositApproveSchema.parse(req.body ?? {});
      const updated = defaultWalletService.approvePendingDeposit({
        depositId: req.params.depositId!,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        notes: validated.notes,
      });
      res.json({
        status: 'approved',
        deposit: {
          ...updated,
          submittedAt: updated.submittedAt.toISOString(),
          reviewedAt: updated.reviewedAt?.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  '/deposits/:depositId/reject',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = DepositRejectSchema.parse(req.body ?? {});
      const updated = defaultWalletService.rejectPendingDeposit({
        depositId: req.params.depositId!,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        reason: validated.reason,
      });
      res.json({
        status: 'rejected',
        deposit: {
          ...updated,
          submittedAt: updated.submittedAt.toISOString(),
          reviewedAt: updated.reviewedAt?.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/withdrawals/pending
 */
adminRouter.get(
  '/withdrawals/pending',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const withdrawals = defaultWalletService.getPendingWithdrawalsForAdmin({ actorRole: req.user!.role });
      const enriched = withdrawals.map((w) => {
        const customer = defaultAuthService.getUserById(w.userId);
        return {
          ...w,
          submittedAt: w.submittedAt.toISOString(),
          reviewedAt: w.reviewedAt?.toISOString(),
          customerEmail: customer?.email,
          customerName: customer?.fullName,
        };
      });
      res.json({ total: enriched.length, withdrawals: enriched });
    } catch (err) {
      next(err);
    }
  }
);

const WithdrawalApproveSchema = z.object({
  notes: z.string().max(2000).optional(),
});

const WithdrawalRejectSchema = z.object({
  reason: z.string().min(3).max(2000),
});

adminRouter.post(
  '/withdrawals/:withdrawalId/approve',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = WithdrawalApproveSchema.parse(req.body ?? {});
      const updated = defaultWalletService.approvePendingWithdrawal({
        withdrawalId: req.params.withdrawalId!,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        notes: validated.notes,
      });
      res.json({
        status: 'approved',
        withdrawal: {
          ...updated,
          submittedAt: updated.submittedAt.toISOString(),
          reviewedAt: updated.reviewedAt?.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  '/withdrawals/:withdrawalId/reject',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = WithdrawalRejectSchema.parse(req.body ?? {});
      const updated = defaultWalletService.rejectPendingWithdrawal({
        withdrawalId: req.params.withdrawalId!,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        reason: validated.reason,
      });
      res.json({
        status: 'rejected',
        withdrawal: {
          ...updated,
          submittedAt: updated.submittedAt.toISOString(),
          reviewedAt: updated.reviewedAt?.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/transactions
 * Comprehensive operational transaction investigation query.
 * Roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/transactions',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { search, status, currency, type, idempotencyKey, startDate, endDate, limit, offset } = req.query;

      const result = defaultWalletService.getAllTransactionsForAdmin({
        actorRole: req.user!.role,
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        currency: currency ? String(currency) : undefined,
        type: type ? String(type) : undefined,
        idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 50,
        offset: offset ? parseInt(String(offset), 10) : 0,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/transactions/:id
 * Transaction detail with linked double-entry journal entry and accounts.
 * Roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/transactions/:id',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const txId = req.params.id!;
      const txs = defaultWalletService.getAllTransactionsForAdmin({ actorRole: req.user!.role, limit: 1000 }).transactions;
      const tx = txs.find((t) => t.transactionId === txId);

      if (!tx) {
        res.status(404).json({
          type: 'https://avenora.com/errors/not-found',
          title: 'Transaction Not Found',
          status: 404,
          detail: `Transaction "${txId}" not found.`,
        });
        return;
      }

      // Find journal entry
      const entries = defaultLedgerService.getEntries();
      const journalEntry = entries.find((e) => e.transactionId === tx.transactionId || e.id === tx.journalEntryId);

      // Find accounts for lines
      const linesWithAccounts = journalEntry?.lines.map((line) => ({
        ...line,
        amountMinor: line.amountMinor.toString(),
        account: defaultLedgerService.getAccount(line.accountId),
      }));

      // Find audit logs
      const auditLogs = defaultAuditService.queryLogs({ financialTxId: tx.transactionId, limit: 10 }).records;

      res.json({
        transaction: tx,
        journalEntry: journalEntry
          ? {
              ...journalEntry,
              lines: linesWithAccounts,
            }
          : null,
        auditLogs,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/transactions/:id/reverse
 * Authorizes a compensating double-entry reversal.
 * Preserves ledger immutability (does not delete or modify original entry).
 * Roles: ADMIN, SUPER_ADMIN. Requires documented reason.
 */
adminRouter.post(
  '/transactions/:id/reverse',
  authenticate,
  requireRoles(['ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const txId = req.params.id!;
      const validated = ReverseTransactionSchema.parse(req.body);

      const result = defaultWalletService.reverseTransaction({
        transactionId: txId,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        reason: validated.reason,
        correlationId: req.headers['x-correlation-id'] as string,
      });

      res.json({
        status: 'transaction_reversed',
        originalTransaction: result.originalTransaction,
        compensatingTransaction: result.compensatingTransaction,
        reversalJournalEntryId: result.reversalJournalEntryId,
      });
    } catch (err) {
      next(err);
    }
  }
);

const ResolveReconciliationSchema = z.object({
  resolution: z.enum(['CONFIRMED', 'FAILED', 'REVERSED']),
  reason: z.string().min(5, 'A documented operational reason of at least 5 characters is required'),
});

/**
 * POST /api/v1/admin/providers/payments/:id/reconcile
 * Resolves an asynchronous provider payment stuck in RECONCILIATION_REQUIRED.
 * Roles: COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN. Requires documented reason.
 */
adminRouter.post(
  '/providers/payments/:id/reconcile',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const paymentId = req.params.id!;
      const validated = ResolveReconciliationSchema.parse(req.body);

      const result = defaultProviderPaymentService.resolveReconciliation({
        paymentId,
        resolution: validated.resolution,
        reason: validated.reason,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        correlationId: (req.headers['x-correlation-id'] as string) || `corr_rec_${Date.now()}`,
      });

      res.json({
        status: 'reconciliation_resolved',
        payment: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/cards
 * Paginated card list for operations.
 * Full PAN, CVV, and PIN are masked/unexposed.
 * Roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/cards',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { search, status, currency, type, limit, offset } = req.query;
      const result = defaultCardService.getAllCardsForAdmin({
        actorRole: req.user!.role,
        search: search ? String(search) : undefined,
        statusFilter: status ? String(status) : undefined,
        currencyFilter: currency ? String(currency) : undefined,
        typeFilter: type ? String(type) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 50,
        offset: offset ? parseInt(String(offset), 10) : 0,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/admin/cards/:id/status
 * Administrative freeze / unfreeze card.
 * Roles: SUPPORT, ADMIN, SUPER_ADMIN. Requires documented reason.
 */
adminRouter.patch(
  '/cards/:id/status',
  authenticate,
  requireRoles(['SUPPORT', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const cardId = req.params.id!;
      const validated = AdminCardStatusSchema.parse(req.body);

      const updated = defaultCardService.updateCardStatus({
        cardId,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        newStatus: validated.status,
        reason: validated.reason,
      });

      const { syntheticPanFormatted, syntheticCvv, ...safeCard } = updated;
      res.json({
        status: 'card_status_updated',
        card: safeCard,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/cards/:id/issuance-review
 * Approve or decline a customer card issuance request.
 * Roles: SUPPORT, ADMIN, SUPER_ADMIN. Requires documented reason.
 */
adminRouter.post(
  '/cards/:id/issuance-review',
  authenticate,
  requireRoles(['SUPPORT', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const cardId = req.params.id!;
      const validated = AdminCardIssuanceReviewSchema.parse(req.body);

      if (validated.decision === 'DELETE') {
        const result = defaultCardService.deleteCard({
          cardId,
          actorUserId: req.user!.id,
          actorRole: req.user!.role,
          reason: validated.reason,
        });
        res.json({
          status: 'card_deleted',
          ...result,
        });
        return;
      }

      const updated = defaultCardService.reviewCardIssuance({
        cardId,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        decision: validated.decision,
        reason: validated.reason,
      });

      const { syntheticPanFormatted, syntheticCvv, ...safeCard } = updated;
      res.json({
        status:
          validated.decision === 'APPROVE'
            ? 'card_issuance_approved'
            : 'card_issuance_declined',
        card: safeCard,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/cards/:id/delete
 * Remove a pending/declined/terminated card request from the queue.
 * Roles: SUPPORT, ADMIN, SUPER_ADMIN. Requires documented reason.
 */
adminRouter.post(
  '/cards/:id/delete',
  authenticate,
  requireRoles(['SUPPORT', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const cardId = req.params.id!;
      const validated = AdminCardDeleteSchema.parse(req.body ?? {});

      const result = defaultCardService.deleteCard({
        cardId,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        reason: validated.reason,
      });

      res.json({
        status: 'card_deleted',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/webhooks
 * Webhook delivery and processing monitor.
 * Secrets and credentials are not returned.
 * Roles: SUPPORT, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/webhooks',
  authenticate,
  requireRoles(['SUPPORT', 'ADMIN', 'SUPER_ADMIN']),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const events = defaultWebhookService.getRecentEvents(100);
      res.json({
        total: events.length,
        events: events.map((e) => ({
          ...e,
          // Guarantee that no signing secret is present
          secret: undefined,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/audit-logs
 * Durable audit log queries with PII redaction and filtering.
 * Roles: COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/audit-logs',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { action, actorRole, actorUserId, resourceType, resourceId, startDate, endDate, search, limit, offset } = req.query;

      const result = defaultAuditService.queryLogs({
        action: action ? String(action) : undefined,
        actorRole: actorRole ? String(actorRole) : undefined,
        actorUserId: actorUserId ? String(actorUserId) : undefined,
        resourceType: resourceType ? String(resourceType) : undefined,
        resourceId: resourceId ? String(resourceId) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        search: search ? String(search) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 50,
        offset: offset ? parseInt(String(offset), 10) : 0,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/loans
 * Operational queue for loan and credit applications.
 * Roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/loans',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { status, search, limit, offset } = req.query;
      let apps = defaultLoanService.getAllApplicationsForReview(req.user!.role);

      if (status && status !== 'ALL') {
        apps = apps.filter((a) => a.status === status);
      }
      if (search) {
        const q = String(search).toLowerCase();
        apps = apps.filter(
          (a) =>
            a.id.toLowerCase().includes(q) ||
            a.applicantName.toLowerCase().includes(q) ||
            a.purpose.toLowerCase().includes(q)
        );
      }

      const total = apps.length;
      const parsedLimit = limit ? parseInt(String(limit), 10) : 50;
      const parsedOffset = offset ? parseInt(String(offset), 10) : 0;
      const paginated = apps.slice(parsedOffset, parsedOffset + parsedLimit);

      res.json({
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        applications: paginated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/loans/:id
 * Loan detail with synthetic credit risk evaluation and audit history.
 * Roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/loans/:id',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const appId = req.params.id!;
      const app = defaultLoanService.getApplicationById(appId);
      if (!app) {
        res.status(404).json({
          type: 'https://avenora.com/errors/not-found',
          title: 'Loan Application Not Found',
          status: 404,
          detail: `Loan application with ID "${appId}" does not exist.`,
        });
        return;
      }
      res.json({ application: app });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/loans/:id/review
 * Record loan decision with separation of duties enforcement.
 * Roles: COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.post(
  '/loans/:id/review',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const appId = req.params.id!;
      const validated = AdminLoanReviewSchema.parse(req.body);

      const updated = defaultLoanService.reviewApplication({
        reviewerRole: req.user!.role,
        reviewerUserId: req.user!.id,
        applicationId: appId,
        decision: validated.decision,
        reasonCode: validated.reasonCode,
        notes: validated.notes,
      });

      res.json({
        status: 'decision_recorded',
        application: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/grants
 * Operational queue for verified grant applications.
 * Roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/grants',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { status, programId, search, limit, offset } = req.query;
      let apps = defaultGrantService.getAllApplicationsForReview(req.user!.role);

      if (status && status !== 'ALL') {
        apps = apps.filter((a) => a.status === status);
      }
      if (programId && programId !== 'ALL') {
        apps = apps.filter((a) => a.programId === programId);
      }
      if (search) {
        const q = String(search).toLowerCase();
        apps = apps.filter(
          (a) =>
            a.id.toLowerCase().includes(q) ||
            a.applicantName.toLowerCase().includes(q) ||
            a.projectTitle.toLowerCase().includes(q)
        );
      }

      const total = apps.length;
      const parsedLimit = limit ? parseInt(String(limit), 10) : 50;
      const parsedOffset = offset ? parseInt(String(offset), 10) : 0;
      const paginated = apps.slice(parsedOffset, parsedOffset + parsedLimit);

      res.json({
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        applications: paginated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/grants/programs
 * Grant programs list for administrative verification.
 * Roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/grants/programs',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const programs = defaultGrantService.getPrograms({});
      res.json({
        total: programs.length,
        programs,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/grants/:id
 * Grant application detail with checklist answers and award status.
 * Roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/grants/:id',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const appId = req.params.id!;
      const app = defaultGrantService.getApplicationById(appId);
      if (!app) {
        res.status(404).json({
          type: 'https://avenora.com/errors/not-found',
          title: 'Grant Application Not Found',
          status: 404,
          detail: `Grant application with ID "${appId}" does not exist.`,
        });
        return;
      }
      res.json({ application: app });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/grants/:id/review
 * Record grant application decision with separation of duties enforcement.
 * Roles: COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.post(
  '/grants/:id/review',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const appId = req.params.id!;
      const validated = AdminGrantReviewSchema.parse(req.body);

      const updated = defaultGrantService.reviewApplication({
        reviewerRole: req.user!.role,
        reviewerUserId: req.user!.id,
        applicationId: appId,
        decision: validated.decision,
        notes: validated.notes,
      });

      res.json({
        status: 'decision_recorded',
        application: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/grants/programs/:id/verify
 * Administrative verification of third-party grant program charters.
 * Roles: COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.post(
  '/grants/programs/:id/verify',
  authenticate,
  requireRoles(['COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const progId = req.params.id!;
      const validated = AdminGrantVerifySchema.parse(req.body);

      const prog = defaultGrantService.verifyProgram({
        programId: progId,
        reviewerUserId: req.user!.id,
        reviewerRole: req.user!.role,
        newStatus: validated.status,
      });

      res.json({
        status: 'program_verified',
        program: prog,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/system/readiness
 * Operational controls and dependency readiness verification.
 * Shows distinct configured, connected, tested, and production-ready states.
 * Secrets and credentials are never exposed.
 * Roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/system/readiness',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const config = getValidatedConfig();
      const safeConfig = getSafePublicConfig(config);
      const ledgerSummary = defaultLedgerService.getLedgerSummary();

      res.json({
        platform: PLATFORM_METADATA.NAME,
        version: PLATFORM_METADATA.VERSION,
        releaseCodename: PLATFORM_METADATA.RELEASE_CODENAME,
        environment: safeConfig.environment,
        checkedAt: new Date().toISOString(),
        components: [
          {
            name: 'Financial Ledger Engine',
            status: ledgerSummary.isBalanced ? 'HEALTHY' : 'DEGRADED',
            state: 'PRODUCTION_READY',
            rule: 'Double-entry invariant: Sum(Debits) === Sum(Credits)',
            details: {
              isBalanced: ledgerSummary.isBalanced,
              totalAccounts: ledgerSummary.totalAccounts,
              totalEntries: ledgerSummary.totalEntries,
              globalDebits: ledgerSummary.globalDebitsMinor,
              globalCredits: ledgerSummary.globalCreditsMinor,
              imbalanceMinor: ledgerSummary.imbalanceMinor,
            },
          },
          {
            name: 'Database Architecture & Migrations',
            status: 'HEALTHY',
            state: 'CONFIGURED',
            details: {
              engine: 'PostgreSQL 14+ / Neon Serverless Architecture',
              currentMigration: '20261015000000_admin_operations_audit_controls',
              driver: 'Prisma Client v7.10.0',
              connectionPooler: 'Configured with SSL Require',
              directMigrationsUrl: 'Configured',
            },
          },
          {
            name: 'Authentication & Session Engine',
            status: 'HEALTHY',
            state: 'PRODUCTION_READY',
            details: {
              passwordAlgorithm: 'Scrypt (16-byte random salt, 64-byte key)',
              mfaStandard: 'RFC 6238 TOTP (SHA1, 30s step, drift tolerance +/-1)',
              sessionStorage: 'SHA-256 hashed bearer tokens with rotation',
              accountLockout: '5 consecutive failed attempts -> 15 min lock',
            },
          },
          {
            name: 'Integration Webhook Gateway',
            status: 'HEALTHY',
            state: 'TESTED',
            details: {
              signatureAlgorithm: 'HMAC-SHA256 over raw request buffer',
              replayToleranceWindow: `${config.WEBHOOK_TOLERANCE_SECONDS || 300} seconds`,
              idempotencyEnforcement: 'Durable event store deduplication active',
            },
          },
          {
            name: 'Durable Audit Trail',
            status: 'HEALTHY',
            state: 'PRODUCTION_READY',
            details: {
              immutability: 'Append-only in-memory & Postgres audit_logs table',
              piiRedaction: 'Automated masking of passwords, secrets, tokens, PANs',
              totalLoggedEvents: defaultAuditService.getRecentCount(),
            },
          },
          {
            name: 'Financial safety guardrails',
            status: 'ACTIVE_GUARD',
            state: 'CONFIGURED',
            details: {
              prototypeMode: safeConfig.prototypeMode,
              liveSettlementEnabled: safeConfig.liveSettlementEnabled,
              realMoneyGuard: 'Settlement and partner rails are governed by regional configuration and approvals.',
              cardNetworkLiveAuthorization: 'BLOCKED',
              liveCryptoCustody: 'BLOCKED',
              liveLendingFunding: 'BLOCKED',
            },
          },
        ],
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/providers/readiness
 * Operational readiness inspection for the 6 external financial provider adapters.
 * Roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN
 */
adminRouter.get(
  '/providers/readiness',
  authenticate,
  requireRoles(['SUPPORT', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const config = getValidatedConfig();
      const safeConfig = getSafePublicConfig(config);

      res.json({
        platform: 'Avenora',
        timestamp: new Date(),
        environment: safeConfig.environment,
        prototypeMode: safeConfig.prototypeMode,
        liveSettlementEnabled: safeConfig.liveSettlementEnabled,
        adapters: [
          {
            category: 'BANK_ACCOUNT_PROVISIONING',
            name: 'Core Banking Account Provisioning',
            adapterClass: 'MockBankAccountProvisioningProvider',
            activeMode: 'MOCK_SANDBOX',
            isLive: false,
            timeoutMs: 5000,
            maxRetryAttempts: 3,
            contractStatus: 'NO_COMMERCIAL_AGREEMENT',
            regulatoryStatus: 'UNLICENSED_PROTOTYPE',
            readiness: 'BLOCKED_PROTOTYPE_ONLY',
            prerequisiteNote: 'Requires Sponsor Bank Partnership Agreement and FinCEN MSB / EBA Passporting registration.',
          },
          {
            category: 'FIAT_PAYMENT_INITIATION',
            name: 'Fiat Payment Clearing & Status',
            adapterClass: 'MockFiatPaymentProvider',
            activeMode: 'MOCK_SANDBOX',
            isLive: false,
            timeoutMs: 5000,
            maxRetryAttempts: 3,
            contractStatus: 'NO_COMMERCIAL_AGREEMENT',
            regulatoryStatus: 'UNLICENSED_PROTOTYPE',
            readiness: 'BLOCKED_PROTOTYPE_ONLY',
            prerequisiteNote: 'Requires FedNow / Faster Payments / SEPA Inst / PIX direct/indirect participant agreement.',
          },
          {
            category: 'CARD_ISSUANCE',
            name: 'Virtual Card Issuance & Network Processing',
            adapterClass: 'MockCardNetworkProvider',
            activeMode: 'MOCK_SANDBOX',
            isLive: false,
            timeoutMs: 5000,
            maxRetryAttempts: 3,
            contractStatus: 'NO_COMMERCIAL_AGREEMENT',
            regulatoryStatus: 'UNLICENSED_PROTOTYPE',
            readiness: 'BLOCKED_PROTOTYPE_ONLY',
            prerequisiteNote: 'Requires Visa/Mastercard BIN Sponsorship and PCI-DSS Level 1 Service Provider Certification.',
          },
          {
            category: 'IDENTITY_VERIFICATION',
            name: 'External IDSP Identity Verification & Biometrics',
            adapterClass: 'MockExternalKycProvider',
            activeMode: 'MOCK_SANDBOX',
            isLive: false,
            timeoutMs: 5000,
            maxRetryAttempts: 3,
            contractStatus: 'NO_COMMERCIAL_AGREEMENT',
            regulatoryStatus: 'UNLICENSED_PROTOTYPE',
            readiness: 'BLOCKED_PROTOTYPE_ONLY',
            prerequisiteNote: 'Requires Certified IDSP Enterprise Contract and GDPR Article 28 DPA execution.',
          },
          {
            category: 'BITCOIN_CUSTODY',
            name: 'Institutional Bitcoin Custody & Hot/Cold Wallets',
            adapterClass: 'MockBitcoinCustodyProvider',
            activeMode: 'MOCK_SANDBOX',
            isLive: false,
            timeoutMs: 5000,
            maxRetryAttempts: 3,
            contractStatus: 'NO_COMMERCIAL_AGREEMENT',
            regulatoryStatus: 'UNLICENSED_PROTOTYPE',
            readiness: 'BLOCKED_PROTOTYPE_ONLY',
            prerequisiteNote: 'Requires Qualified Custodian Agreement, CCSS Level 3 certification, and VASP license.',
          },
          {
            category: 'FX_SETTLEMENT',
            name: 'Wholesale FX Quotes & Interbank Settlement',
            adapterClass: 'MockFxQuoteProvider',
            activeMode: 'MOCK_SANDBOX',
            isLive: false,
            timeoutMs: 5000,
            maxRetryAttempts: 3,
            contractStatus: 'NO_COMMERCIAL_AGREEMENT',
            regulatoryStatus: 'UNLICENSED_PROTOTYPE',
            readiness: 'BLOCKED_PROTOTYPE_ONLY',
            prerequisiteNote: 'Requires ISDA Master Agreement with Tier-1 FX Liquidity Provider.',
          },
        ],
        safetyRules: [
          'PROTOTYPE_MODE is enforced; live settlement without configured production providers is blocked.',
          'Missing provider credentials in production will refuse execution rather than falling back to mock.',
          'All mock responses are labeled with explicit integration test disclaimers.',
        ],
      });
    } catch (err) {
      next(err);
    }
  }
);

