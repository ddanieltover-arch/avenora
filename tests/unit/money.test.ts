/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Zero-Float Money Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { Money } from '../../src/domain/money/Money.ts';

describe('Money Domain Value Object (Zero-Float Precision)', () => {
  it('correctly converts decimal strings to integer minor units without float error', () => {
    const m1 = Money.fromDecimalString('0.10', 'USD');
    const m2 = Money.fromDecimalString('0.20', 'USD');
    const sum = m1.add(m2);

    expect(m1.amountMinor).toBe(10n);
    expect(m2.amountMinor).toBe(20n);
    expect(sum.amountMinor).toBe(30n);
    expect(sum.toDecimalString()).toBe('0.30');
  });

  it('handles negative monetary amounts properly', () => {
    const m = Money.fromDecimalString('-45.50', 'USD');
    expect(m.amountMinor).toBe(-4550n);
    expect(m.isNegative()).toBe(true);
    expect(m.toDecimalString()).toBe('-45.50');
  });

  it('rejects input with decimals exceeding currency minorUnits', () => {
    expect(() => Money.fromDecimalString('100.999', 'USD')).toThrow(/Precision overflow/);
  });

  it('supports 8-decimal cryptocurrency precision (Bitcoin)', () => {
    const btc = Money.fromDecimalString('0.00015000', 'BTC');
    expect(btc.amountMinor).toBe(15000n);
    expect(btc.toDecimalString()).toBe('0.00015000');
  });

  it('allocates pro-rata without losing a single minor unit (penny conservation)', () => {
    // $10.00 split 3 ways: 333 cents, 333 cents, 334 cents
    const tenDollars = Money.fromDecimalString('10.00', 'USD');
    const shares = tenDollars.allocate([1, 1, 1]);

    expect(shares.length).toBe(3);
    const sum = shares.reduce((acc, s) => acc + s.amountMinor, 0n);
    expect(sum).toBe(1000n); // Exact $10.00 conserved!
  });

  it('prevents operations across mismatched currencies', () => {
    const usd = Money.fromDecimalString('100.00', 'USD');
    const eur = Money.fromDecimalString('100.00', 'EUR');
    expect(() => usd.add(eur)).toThrow(/Currency mismatch/);
  });
});
