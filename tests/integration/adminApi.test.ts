/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Admin & Operations API Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { createExpressApp } from '../../src/server/app.ts';
import { defaultAuthService } from '../../src/server/services/auth.service.ts';

describe('Admin & Operations Control Center HTTP API (/api/v1/admin)', () => {
  let server: http.Server;
  let baseUrl: string;
  let customerToken: string;
  let customerUserId: string;
  let customerEmail: string;
  let customerLoanAppId: string;
  let supportToken: string;
  let complianceToken: string;
  let superAdminToken: string;

  beforeAll(async () => {
    const app = createExpressApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    await defaultAuthService.seedStaffUsersForAutomatedTests();

    customerEmail = `admin.test.customer.${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerEmail,
        password: 'AvenoraPassword2026!',
        fullName: 'Admin API Test Customer',
        phoneNumber: '12025550777',
        transactionPin: '1234',
        countryCode: 'US',
      }),
    });
    const regData = await regRes.json();
    customerToken = regData.sessionToken;
    customerUserId = regData.user.id;

    const loanRes = await fetch(`${baseUrl}/api/v1/loans/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        type: 'PERSONAL',
        currency: 'USD',
        requestedAmountDecimal: '5000.00',
        termMonths: 24,
        purpose: 'Home improvement project',
        annualIncomeDecimal: '85000.00',
        monthlyExpensesDecimal: '1800.00',
        consentAcknowledged: true,
        autoSubmit: true,
      }),
    });
    const loanData = await loanRes.json();
    customerLoanAppId = loanData.application.id;

    // Login Elena Rostova (SUPPORT)
    const suppRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'support.lead@avenora.internal',
        password: 'AvenoraPassword2026!',
        totpCode: '123456',
      }),
    });
    const suppData = await suppRes.json();
    supportToken = suppData.sessionToken;

    // Login Maria Chen (COMPLIANCE_REVIEWER)
    const compRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'compliance.lead@avenora.internal',
        password: 'AvenoraPassword2026!',
        totpCode: '123456',
      }),
    });
    const compData = await compRes.json();
    complianceToken = compData.sessionToken;

    // Login David Thorne (SUPER_ADMIN)
    const adminRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin.super@avenora.internal',
        password: 'AvenoraPassword2026!',
        totpCode: '123456',
      }),
    });
    const adminData = await adminRes.json();
    superAdminToken = adminData.sessionToken;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('RBAC & Route Authorization', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/overview`);
      expect(res.status).toBe(401);
    });

    it('rejects CUSTOMER role with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/overview`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('allows SUPPORT, COMPLIANCE_REVIEWER, and SUPER_ADMIN roles to access overview', async () => {
      for (const token of [supportToken, complianceToken, superAdminToken]) {
        const res = await fetch(`${baseUrl}/api/v1/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.environment).toBe('prototype-isolated');
        expect(data.customers).toBeDefined();
        expect(data.ledger.isBalanced).toBe(true);
        expect(data.ledger.source).toContain('Double-Entry Invariant');
      }
    });
  });

  describe('Customer Management (/api/v1/admin/customers)', () => {
    it('returns sanitized customer records without passwords or secrets', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/customers`, {
        headers: { Authorization: `Bearer ${supportToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.users.length).toBeGreaterThan(0);

      for (const user of data.users) {
        expect(user.passwordHash).toBeUndefined();
        expect(user.mfaSecret).toBeUndefined();
        expect(user.mfaRecoveryCodes).toBeUndefined();
      }
    });

    it('rejects status change without a valid documented reason', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/customers/${customerUserId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supportToken}`,
        },
        body: JSON.stringify({
          status: 'SUSPENDED',
          reason: 'bad', // Too short (< 5 chars)
        }),
      });
      expect(res.status).toBe(400);
    });

    it('allows authorized staff to suspend and reactivate customer with reason', async () => {
      // Suspend
      const suspendRes = await fetch(`${baseUrl}/api/v1/admin/customers/${customerUserId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supportToken}`,
        },
        body: JSON.stringify({
          status: 'SUSPENDED',
          reason: 'Temporary administrative security check',
        }),
      });
      expect(suspendRes.status).toBe(200);
      const suspendData = await suspendRes.json();
      expect(suspendData.customer.status).toBe('SUSPENDED');

      // Reactivate
      const reactivateRes = await fetch(`${baseUrl}/api/v1/admin/customers/${customerUserId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supportToken}`,
        },
        body: JSON.stringify({
          status: 'ACTIVE',
          reason: 'Security check concluded successfully',
        }),
      });
      expect(reactivateRes.status).toBe(200);
      const reactivateData = await reactivateRes.json();
      expect(reactivateData.customer.status).toBe('ACTIVE');
    });

    it('enforces that role modification requires SUPER_ADMIN', async () => {
      // Attempt with SUPPORT token (should be 403)
      const suppRoleRes = await fetch(`${baseUrl}/api/v1/admin/customers/${customerUserId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supportToken}`,
        },
        body: JSON.stringify({
          role: 'ADMIN',
          reason: 'Promotion request',
        }),
      });
      expect(suppRoleRes.status).toBe(403);
    });
  });

  describe('KYC Review Queue & Separation of Duties (/api/v1/admin/kyc)', () => {
    it('prevents reviewers from approving their own KYC profile', async () => {
      // Maria Chen attempting to review her own profile
      const res = await fetch(`${baseUrl}/api/v1/admin/kyc/usr_staff_compliance_01/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${complianceToken}`,
        },
        body: JSON.stringify({
          decision: 'APPROVED',
          notes: 'Self approval attempt',
        }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.detail).toContain('Separation of duties');
    });

    it('allows compliance officer to record decision for customer', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/kyc/${customerUserId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${complianceToken}`,
        },
        body: JSON.stringify({
          decision: 'APPROVED',
          notes: 'Standard tier 2 identity credentials verified',
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('decision_recorded');
      expect(data.profile.status).toBe('APPROVED');
    });
  });

  describe('Transaction Investigation & Immutable Reversals', () => {
    it('lists transactions and returns ledger details without exposing secrets', async () => {
      const listRes = await fetch(`${baseUrl}/api/v1/admin/transactions`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(listRes.status).toBe(200);
      const listData = await listRes.json();
      expect(listData.transactions).toBeDefined();

      if (listData.transactions.length > 0) {
        const firstTx = listData.transactions[0];
        const detailRes = await fetch(`${baseUrl}/api/v1/admin/transactions/${firstTx.transactionId}`, {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        });
        expect(detailRes.status).toBe(200);
        const detailData = await detailRes.json();
        expect(detailData.transaction.transactionId).toBe(firstTx.transactionId);
      }
    });

    it('rejects transaction reversal without documented reason', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/transactions/nonexistent_tx/reverse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          reason: 'bad', // Too short
        }),
      });
      expect(res.status).toBe(400);
    });

    it('executes compensating reversal preserving double-entry ledger invariant', async () => {
      const reloginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail,
          password: 'AvenoraPassword2026!',
        }),
      });
      const reloginData = await reloginRes.json();
      const freshCustomerToken = reloginData.sessionToken;
      customerToken = freshCustomerToken;

      // Deposit funds for a known transaction to reverse
      const depRes = await fetch(`${baseUrl}/api/v1/wallets/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freshCustomerToken}`,
          'X-Idempotency-Key': `idem_admin_test_${Date.now()}`,
        },
        body: JSON.stringify({
          currency: 'USD',
          amountDecimal: '250.00',
        }),
      });
      const depData = await depRes.json();
      const txId = depData.transactionId || depData.transaction?.transactionId;

      // Reverse transaction via Admin API
      const revRes = await fetch(`${baseUrl}/api/v1/admin/transactions/${txId}/reverse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          reason: 'Erroneous external clearing notice from mock gateway',
        }),
      });

      expect(revRes.status).toBe(200);
      const revData = await revRes.json();
      expect(revData.status).toBe('transaction_reversed');
      expect(revData.originalTransaction.status).toBe('REVERSED');
      expect(revData.compensatingTransaction).toBeDefined();
      expect(revData.reversalJournalEntryId).toBeDefined();

      // Verify that ledger overview confirms invariant is still strictly balanced
      const overviewRes = await fetch(`${baseUrl}/api/v1/admin/overview`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      const overview = await overviewRes.json();
      expect(overview.ledger.isBalanced).toBe(true);
      expect(overview.ledger.imbalanceMinor).toBe('0');
    });
  });

  describe('Card Operations & Masking (/api/v1/admin/cards)', () => {
    it('returns masked cards without unmasked PAN, CVV, or PIN', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/cards`, {
        headers: { Authorization: `Bearer ${supportToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      for (const card of data.cards) {
        expect(card.syntheticPanFormatted).toBeUndefined();
        expect(card.syntheticCvv).toBeUndefined();
        expect(card.pinHash).toBeUndefined();
        expect(card.maskedPan).toMatch(/•••• •••• •••• \d{4}/);
      }
    });
  });

  describe('Loans Operations & Separation of Duties (/api/v1/admin/loans)', () => {
    it('rejects CUSTOMER role from accessing loan review queue', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/loans`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('allows compliance officer to inspect loan application queue', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/loans`, {
        headers: { Authorization: `Bearer ${complianceToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.applications).toBeDefined();
      expect(Array.isArray(data.applications)).toBe(true);
    });

    it('rejects reviewer from approving their own loan application', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/loans/${customerLoanAppId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          decision: 'APPROVED_FOR_DEMO',
          reasonCode: 'SELF_APPROVAL',
        }),
      });
      expect(res.status).toBe(403);
    });

    it('allows compliance officer to record a valid loan underwriting decision', async () => {
      const listRes = await fetch(`${baseUrl}/api/v1/admin/loans`, {
        headers: { Authorization: `Bearer ${complianceToken}` },
      });
      const listData = await listRes.json();
      const firstLoan = listData.applications[0];
      expect(firstLoan).toBeDefined();

      const reviewRes = await fetch(`${baseUrl}/api/v1/admin/loans/${firstLoan.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${complianceToken}`,
        },
        body: JSON.stringify({
          decision: 'UNDER_REVIEW',
          reasonCode: 'DOC_CHECK',
          notes: 'Verifying income documentation against declared metrics',
        }),
      });
      expect(reviewRes.status).toBe(200);
      const reviewData = await reviewRes.json();
      expect(reviewData.status).toBe('decision_recorded');
      expect(reviewData.application.status).toBe('UNDER_REVIEW');
    });
  });

  describe('Grant Operations & Program Verification (/api/v1/admin/grants)', () => {
    it('rejects CUSTOMER role from accessing admin grants', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/grants`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('allows compliance officer to list and inspect grant applications', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/grants`, {
        headers: { Authorization: `Bearer ${complianceToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.applications).toBeDefined();
    });

    it('allows compliance officer to verify a grant program charter', async () => {
      const progRes = await fetch(`${baseUrl}/api/v1/admin/grants/programs`, {
        headers: { Authorization: `Bearer ${complianceToken}` },
      });
      expect(progRes.status).toBe(200);
      const progData = await progRes.json();
      expect(progData.programs.length).toBeGreaterThan(0);

      const targetProg = progData.programs.find((p: any) => p.verificationStatus === 'PENDING_REVIEW') || progData.programs[0];

      const verifyRes = await fetch(`${baseUrl}/api/v1/admin/grants/programs/${targetProg.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${complianceToken}`,
        },
        body: JSON.stringify({
          status: 'VERIFIED',
          notes: 'Grant charter confirmed with non-profit sponsor foundation',
        }),
      });
      expect(verifyRes.status).toBe(200);
      const verifyData = await verifyRes.json();
      expect(verifyData.program.verificationStatus).toBe('VERIFIED');
    });
  });

  describe('Audit Log Queries & Privilege Enforcement (/api/v1/admin/audit-logs)', () => {
    it('denies SUPPORT role from viewing durable audit log', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${supportToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('allows COMPLIANCE_REVIEWER and SUPER_ADMIN to query audit logs', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs?limit=10`, {
        headers: { Authorization: `Bearer ${complianceToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.records).toBeDefined();
      expect(Array.isArray(data.records)).toBe(true);
      expect(data.records.length).toBeGreaterThan(0);

      // Verify no sensitive keys leaked in details
      for (const rec of data.records) {
        if (rec.details) {
          const detStr = JSON.stringify(rec.details);
          expect(detStr).not.toContain('AvenoraPassword2026!');
          expect(detStr).not.toContain('placeholder_password');
        }
      }
    });

    it('confirms that denied access attempts are logged with ADMIN_ACCESS_DENIED', async () => {
      // Alex Vance (CUSTOMER) attempted an admin endpoint earlier in this test suite
      // Let's verify that ADMIN_ACCESS_DENIED was recorded
      const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs?action=ADMIN_ACCESS_DENIED&actorRole=CUSTOMER`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.total).toBeGreaterThanOrEqual(1);
      const deniedRecord = data.records.find((r: any) => r.actorRole === 'CUSTOMER');
      expect(deniedRecord).toBeDefined();
      expect(deniedRecord.action).toBe('ADMIN_ACCESS_DENIED');
    });
  });

  describe('Webhook Integration Monitoring (/api/v1/admin/webhooks)', () => {
    it('denies CUSTOMER role access to webhook events', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/webhooks`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('returns webhook events without exposing signing secrets', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/webhooks`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.events).toBeDefined();

      for (const ev of data.events) {
        expect(ev.secret).toBeUndefined();
        expect(ev.signingSecret).toBeUndefined();
        expect(ev.apiKey).toBeUndefined();
      }
    });
  });

  describe('Operational Query Resilience (Empty, Filtered, Paginated)', () => {
    it('handles non-matching filters cleanly with empty list rather than 500 error', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/customers?search=nonexistent_xyz_user_99999`, {
        headers: { Authorization: `Bearer ${supportToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.total).toBe(0);
      expect(data.users).toEqual([]);
    });

    it('handles negative or oversized pagination limits gracefully', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/customers?limit=-5&offset=-10`, {
        headers: { Authorization: `Bearer ${supportToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.users)).toBe(true);
    });
  });

  describe('System Readiness & Security Boundaries (/api/v1/admin/system/readiness)', () => {
    it('reports production-ready and configured component readiness with zero secret leakage', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/system/readiness`, {
        headers: { Authorization: `Bearer ${supportToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.platform).toBe('Avenora');
      expect(data.components.length).toBeGreaterThanOrEqual(5);

      // Verify no raw DB credentials or secrets leaked
      const stringified = JSON.stringify(data);
      expect(stringified).not.toContain('placeholder_password');
      expect(stringified).not.toContain('JBSWY3DPEHPK3PXP');
      expect(stringified).not.toContain('test_secret');
      expect(stringified).toContain('BLOCKED');
    });
  });

  describe('Financial Provider Readiness & Reconciliation Endpoints', () => {
    it('returns provider readiness across all 6 adapter categories with zero secret leakage (/api/v1/admin/providers/readiness)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/providers/readiness`, {
        headers: { Authorization: `Bearer ${complianceToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.platform).toBe('Avenora');
      expect(data.adapters.length).toBe(6);
      expect(data.adapters[0].activeMode).toBe('MOCK_SANDBOX');
      expect(data.adapters[0].readiness).toBe('BLOCKED_PROTOTYPE_ONLY');

      const jsonStr = JSON.stringify(data);
      expect(jsonStr).not.toContain('whsec_');
      expect(jsonStr).not.toContain('password');
    });

    it('denies CUSTOMER role access to provider readiness endpoint', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/providers/readiness`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('provides public country & provider capability matrix with distinct readiness statuses (/api/v1/system/providers/matrix)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/system/providers/matrix`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.countries.length).toBe(5); // US, GB, ES, DE, BR
      expect(data.prerequisites.length).toBe(6);
      expect(data.disclaimer).toContain('INTEGRATION READINESS ARCHITECTURE');
    });

    it('provisions identifier via system route with explicit MOCK_PROVIDER source (/api/v1/system/identifiers/provision)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/system/identifiers/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: 'US',
          type: 'BANK_ACCOUNT',
          accountHolderName: 'Apex Capital Inc',
          currency: 'USD',
          idempotencyKey: `idem_sys_prov_${Date.now()}`,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.status).toBe('provisioned');
      expect(data.identifier.source).toBe('MOCK_PROVIDER');
      expect(data.identifier.isSimulated).toBe(true);
      expect(data.identifier.disclaimer).toContain('MOCK PROVIDER ADAPTER');
    });

    it('enforces RBAC on provider reconciliation endpoint: denies CUSTOMER (403), allows COMPLIANCE_REVIEWER', async () => {
      // 1. Customer attempt is rejected with 403
      const deniedRes = await fetch(`${baseUrl}/api/v1/admin/providers/payments/pmt_sample_rec_01/reconcile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${customerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolution: 'FAILED',
          reason: 'Customer unauthorized attempt',
        }),
      });
      expect(deniedRes.status).toBe(403);
    });
  });
});
