/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Zero-Floating-Point Monetary Value Object
 *
 * Implements Martin Fowler's Money pattern using BigInt minor units.
 * Eliminates IEEE-754 binary floating-point representation errors (such as 0.1 + 0.2 !== 0.3).
 */

import { CurrencyDefinition, getCurrency } from './Currency.ts';

export class Money {
  public readonly amountMinor: bigint;
  public readonly currency: CurrencyDefinition;

  private constructor(amountMinor: bigint, currency: CurrencyDefinition) {
    this.amountMinor = amountMinor;
    this.currency = currency;
  }

  /**
   * Factory method: instantiate from integer minor units (e.g. cents, satoshis).
   */
  public static fromMinor(amountMinor: bigint | number | string, currencyCode: string): Money {
    const currency = getCurrency(currencyCode);
    const bigintAmount = typeof amountMinor === 'bigint' ? amountMinor : BigInt(amountMinor);
    return new Money(bigintAmount, currency);
  }

  /**
   * Factory method: parse from decimal string (e.g. "1250.50" or "-10.05") without floating-point math.
   */
  public static fromDecimalString(amountStr: string, currencyCode: string): Money {
    const currency = getCurrency(currencyCode);
    const cleaned = amountStr.trim().replace(/,/g, '');
    const isNegative = cleaned.startsWith('-');
    const unsignedStr = isNegative ? cleaned.slice(1) : cleaned;

    const parts = unsignedStr.split('.');
    if (parts.length > 2) {
      throw new Error(`Invalid monetary decimal format: "${amountStr}"`);
    }

    const wholePart = parts[0] || '0';
    let fractionPart = parts[1] || '';

    if (!/^\d+$/.test(wholePart) || (fractionPart && !/^\d+$/.test(fractionPart))) {
      throw new Error(`Monetary string contains non-numeric characters: "${amountStr}"`);
    }

    // Pad or truncate fraction to currency minorUnits
    if (fractionPart.length > currency.minorUnits) {
      throw new Error(
        `Precision overflow: "${amountStr}" has ${fractionPart.length} decimals; ${currency.code} allows max ${currency.minorUnits}`
      );
    }

    fractionPart = fractionPart.padEnd(currency.minorUnits, '0');
    const combinedStr = wholePart + fractionPart;
    const unsignedMinor = BigInt(combinedStr);
    const amountMinor = isNegative ? -unsignedMinor : unsignedMinor;

    return new Money(amountMinor, currency);
  }

  public static zero(currencyCode: string): Money {
    return Money.fromMinor(0n, currencyCode);
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor + other.amountMinor, this.currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor - other.amountMinor, this.currency);
  }

  public multiply(scalar: bigint | number): Money {
    if (typeof scalar === 'number') {
      if (!Number.isInteger(scalar)) {
        throw new Error('Scalar multiplication on Money must use integer multiplier to prevent float drift.');
      }
      return new Money(this.amountMinor * BigInt(scalar), this.currency);
    }
    return new Money(this.amountMinor * scalar, this.currency);
  }

  /**
   * Pro-rata integer allocation without losing minor units (cents / satoshis).
   * Ensures sum(allocated) === this.amountMinor exactly.
   */
  public allocate(ratios: number[]): Money[] {
    if (ratios.length === 0) {
      return [];
    }
    const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
    if (totalRatio <= 0) {
      throw new Error('Total allocation ratio must be positive.');
    }

    let remainder = this.amountMinor;
    const results: bigint[] = [];

    for (let i = 0; i < ratios.length; i++) {
      const ratio = ratios[i] ?? 0;
      const share = (this.amountMinor * BigInt(ratio)) / BigInt(totalRatio);
      results.push(share);
      remainder -= share;
    }

    // Distribute remaining minor units round-robin to preserve exact equality
    let idx = 0;
    while (remainder > 0n) {
      results[idx] = (results[idx] ?? 0n) + 1n;
      remainder -= 1n;
      idx = (idx + 1) % results.length;
    }

    return results.map((val) => new Money(val, this.currency));
  }

  public isZero(): boolean {
    return this.amountMinor === 0n;
  }

  public isPositive(): boolean {
    return this.amountMinor > 0n;
  }

  public isNegative(): boolean {
    return this.amountMinor < 0n;
  }

  public equals(other: Money): boolean {
    return this.currency.code === other.currency.code && this.amountMinor === other.amountMinor;
  }

  public compareTo(other: Money): number {
    this.assertSameCurrency(other);
    if (this.amountMinor < other.amountMinor) return -1;
    if (this.amountMinor > other.amountMinor) return 1;
    return 0;
  }

  public greaterThan(other: Money): boolean {
    return this.compareTo(other) > 0;
  }

  public lessThan(other: Money): boolean {
    return this.compareTo(other) < 0;
  }

  public greaterThanOrEqual(other: Money): boolean {
    return this.compareTo(other) >= 0;
  }

  public lessThanOrEqual(other: Money): boolean {
    return this.compareTo(other) <= 0;
  }

  /**
   * Convert to formatted decimal string (e.g. "1250.50" or "0.00015000").
   */
  public toDecimalString(): string {
    const isNegative = this.amountMinor < 0n;
    const absVal = isNegative ? -this.amountMinor : this.amountMinor;
    const factor = 10n ** BigInt(this.currency.minorUnits);

    const whole = absVal / factor;
    const fraction = absVal % factor;
    const fractionStr = fraction.toString().padStart(this.currency.minorUnits, '0');

    const result = `${whole}.${fractionStr}`;
    return isNegative ? `-${result}` : result;
  }

  /**
   * Display string with currency symbol.
   */
  public toDisplayString(): string {
    return `${this.currency.symbol}${this.toDecimalString()} ${this.currency.code}`;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency.code !== other.currency.code) {
      throw new Error(`Currency mismatch: cannot perform operation between ${this.currency.code} and ${other.currency.code}`);
    }
  }
}
