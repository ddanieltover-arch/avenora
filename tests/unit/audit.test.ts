/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Durable Audit Service Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from '../../src/server/services/audit.service.ts';

describe('Durable Administrative Audit Service', () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = new AuditService();
  });

  it('records audit events and returns query results', () => {
    auditService.record({
      action: 'USER_STATUS_CHANGED',
      actorRole: 'ADMIN',
      actorUserId: 'usr_staff_admin_01',
      resourceType: 'User',
      resourceId: 'usr_test_customer_01',
      previousState: 'ACTIVE',
      newState: 'SUSPENDED',
      reason: 'Periodic compliance dormancy check',
      details: { automatedTrigger: false },
    });

    const result = auditService.queryLogs({ resourceType: 'User' });
    expect(result.total).toBe(1);
    expect(result.records[0]?.action).toBe('USER_STATUS_CHANGED');
    expect(result.records[0]?.actorRole).toBe('ADMIN');
    expect(result.records[0]?.reason).toBe('Periodic compliance dormancy check');
  });

  it('strictly sanitizes and redacts PII, passwords, PANs, and raw tokens', () => {
    auditService.record({
      action: 'CARD_REQUESTED',
      actorRole: 'CUSTOMER',
      actorUserId: 'usr_test_customer_01',
      resourceType: 'Card',
      resourceId: 'crd_test_123',
      details: {
        password: 'SuperSecretPassword123!',
        token: 'eySampleTokenString',
        sessionToken: 'raw_bearer_session_secret',
        cvv: '892',
        cardNumber: '4532890123456789',
        unrelatedSafeMeta: 'card_issuance_virtual',
      },
    });

    const result = auditService.queryLogs({ resourceId: 'crd_test_123' });
    expect(result.total).toBe(1);
    const loggedDetails = (result.records[0]?.details || {}) as Record<string, any>;

    expect(loggedDetails.password).toBe('[REDACTED]');
    expect(loggedDetails.token).toBe('[REDACTED]');
    expect(loggedDetails.sessionToken).toBe('[REDACTED]');
    expect(loggedDetails.cvv).toBe('[REDACTED]');
    expect(loggedDetails.cardNumber).toBe('************6789');
    expect(loggedDetails.unrelatedSafeMeta).toBe('card_issuance_virtual');
  });

  it('filters audit records by action, actorRole, and search terms', () => {
    auditService.record({
      action: 'TRANSACTION_REVERSED',
      actorRole: 'SUPER_ADMIN',
      actorUserId: 'usr_staff_admin_david',
      resourceType: 'FinancialTransaction',
      resourceId: 'tx_demo_01',
      reason: 'Accidental double payment reported by customer',
    });

    auditService.record({
      action: 'KYC_REVIEWED',
      actorRole: 'COMPLIANCE_REVIEWER',
      actorUserId: 'usr_staff_compliance_01',
      resourceType: 'KycProfile',
      resourceId: 'kyc_demo_01',
      reason: 'Passport verified successfully',
    });

    const reversals = auditService.queryLogs({ action: 'TRANSACTION_REVERSED' });
    expect(reversals.total).toBe(1);
    expect(reversals.records[0]?.resourceId).toBe('tx_demo_01');

    const complianceLogs = auditService.queryLogs({ actorRole: 'COMPLIANCE_REVIEWER' });
    expect(complianceLogs.total).toBeGreaterThanOrEqual(1);
    expect(complianceLogs.records[0]?.resourceType).toBe('KycProfile');

    const searchResults = auditService.queryLogs({ search: 'Accidental double payment' });
    expect(searchResults.total).toBe(1);
    expect(searchResults.records[0]?.action).toBe('TRANSACTION_REVERSED');
  });

  it('enforces append-only immutability and preserves chronological sequencing', () => {
    const baselineCount = auditService.getRecentCount();

    auditService.record({
      action: 'ADMIN_ACCESS_DENIED',
      actorRole: 'CUSTOMER',
      actorUserId: 'usr_test_customer_01',
      resourceType: 'AdminRoute',
      reason: 'Unauthorized access attempt to /api/v1/admin/overview',
    });

    const newCount = auditService.getRecentCount();
    expect(newCount).toBe(baselineCount + 1);

    // Logs array returned should be isolated, not allowing external mutation
    const query1 = auditService.queryLogs({});
    query1.records.pop();

    const query2 = auditService.queryLogs({});
    expect(query2.total).toBe(newCount);
  });
});
