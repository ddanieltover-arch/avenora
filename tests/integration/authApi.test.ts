/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Auth API Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { createExpressApp } from '../../src/server/app.ts';

const TEST_PASSWORD = 'AvenoraPassword2026!';

describe('Auth HTTP API Endpoints (/api/v1/auth)', () => {
  let server: http.Server;
  let baseUrl: string;
  let registeredEmail: string;

  beforeAll(async () => {
    const app = createExpressApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    registeredEmail = `customer.${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registeredEmail,
        password: TEST_PASSWORD,
        fullName: 'Integration Test Customer',
        phoneNumber: '12025550999',
        transactionPin: '1234',
        countryCode: 'US',
      }),
    });
    expect(regRes.status).toBe(201);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('successfully logs in a registered customer with 200', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registeredEmail,
        password: TEST_PASSWORD,
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('authenticated');
    expect(data.user.email).toBe(registeredEmail);
    expect(data.sessionToken).toBeDefined();
    expect(data.transactionPinUnlocked).toBe(false);
  });

  it('requires and verifies transaction PIN to unlock the session', async () => {
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registeredEmail,
        password: TEST_PASSWORD,
      }),
    });
    const loginData = await loginRes.json();
    expect(loginRes.status).toBe(200);
    const token = loginData.sessionToken as string;

    const meLocked = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meLockedData = await meLocked.json();
    expect(meLocked.status).toBe(200);
    expect(meLockedData.transactionPinUnlocked).toBe(false);

    const badPin = await fetch(`${baseUrl}/api/v1/auth/verify-transaction-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ transactionPin: '0000' }),
    });
    expect(badPin.status).toBe(401);

    const goodPin = await fetch(`${baseUrl}/api/v1/auth/verify-transaction-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ transactionPin: '1234' }),
    });
    const goodData = await goodPin.json();
    expect(goodPin.status).toBe(200);
    expect(goodData.transactionPinUnlocked).toBe(true);

    const meUnlocked = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meUnlockedData = await meUnlocked.json();
    expect(meUnlockedData.transactionPinUnlocked).toBe(true);
  });

  it('returns 401 Unauthorized (NOT 500) for incorrect password', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registeredEmail,
        password: 'WrongPassword123!',
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.title).toContain('Authentication');
    expect(data.status).toBe(401);
  });

  it('returns 401 Unauthorized (NOT 500) for unregistered email', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent.user.test@example.com',
        password: 'SomePassword2026!',
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.status).toBe(401);
    expect(data.detail).toContain('Invalid email or password');
  });

  it('returns 409 Conflict (NOT 500) when registering duplicate email', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registeredEmail,
        password: 'AnotherPassword2026!',
        fullName: 'Duplicate Customer',
        phoneNumber: '12025550998',
        transactionPin: '5678',
        countryCode: 'US',
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(409);
    expect(data.status).toBe(409);
    expect(data.detail).toContain('already exists');
  });
});
