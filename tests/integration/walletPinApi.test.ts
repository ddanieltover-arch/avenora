/**
 * @license Apache-2.0
 * Withdraw / transfer require a valid 4-digit transaction PIN.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { createExpressApp } from '../../src/server/app.ts';
import { defaultAuthService } from '../../src/server/services/auth.service.ts';

const TEST_PASSWORD = 'AvenoraPassword2026!';
const TEST_PIN = '1234';

describe('Wallet money-move PIN enforcement', () => {
  let server: http.Server;
  let baseUrl: string;
  let sessionToken: string;

  beforeAll(async () => {
    const app = createExpressApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    const email = `wallet.pin.${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: TEST_PASSWORD,
        fullName: 'Wallet PIN Tester',
        phoneNumber: '12025550123',
        transactionPin: TEST_PIN,
        countryCode: 'US',
      }),
    });
    const regData = await regRes.json();
    expect(regRes.status).toBe(201);
    sessionToken = regData.sessionToken;

    const user = defaultAuthService.getUserById(regData.user.id);
    expect(user).toBeDefined();
    user!.kycStatus = 'APPROVED';
    defaultAuthService.syncCustomerActivationFromKyc(user!.id);
    expect(user!.status).toBe('ACTIVE');
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('rejects withdraw without transactionPin (400)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/wallets/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        currency: 'USD',
        amountDecimal: '10.00',
        destinationRail: 'ACH',
      }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects withdraw with wrong transactionPin (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/wallets/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        currency: 'USD',
        amountDecimal: '10.00',
        destinationRail: 'ACH',
        transactionPin: '9999',
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.title).toMatch(/Transaction PIN/i);
  });

  it('rejects transfer without transactionPin (400)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/wallets/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
        'Idempotency-Key': `pin_xfer_missing_${Date.now()}`,
      },
      body: JSON.stringify({
        recipientEmailOrId: 'someone@example.com',
        currency: 'USD',
        amountDecimal: '5.00',
      }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects transfer with wrong transactionPin (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/wallets/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
        'Idempotency-Key': `pin_xfer_bad_${Date.now()}`,
      },
      body: JSON.stringify({
        recipientEmailOrId: 'someone@example.com',
        currency: 'USD',
        amountDecimal: '5.00',
        transactionPin: '0000',
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.title).toMatch(/Transaction PIN/i);
  });
});
