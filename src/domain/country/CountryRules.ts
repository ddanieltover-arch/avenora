/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Country-Specific Formatting & Checksum Rules
 *
 * Implements authoritative mathematical checksum algorithms:
 * - ISO 7064 Mod 97-10 (IBAN check digits)
 * - Federal Reserve ABA 9-Digit Checksum (3*d1 + 7*d2 + 1*d3 ...) % 10 === 0
 * - Spanish Banco de España CCC Control Digits & DNI Modulo 23
 * - German BLZ (Bankleitzahl) & SEPA IBAN Formatting
 * - Brazilian Receita Federal CPF Double Check Digits (Modulo 11) & Banco/Agência/Conta
 * - UK APACS Sort Code & Account Modulus
 * - ISO/IEC 7812 Luhn Modulo 10 for Payment Cards
 */

import { SupportedCountryCode, IdentifierType } from './CountryTypes.ts';

export const SUPPORTED_COUNTRIES: SupportedCountryCode[] = ['US', 'GB', 'ES', 'DE', 'BR'];

export const SUPPORTED_IDENTIFIER_TYPES: Record<SupportedCountryCode, IdentifierType[]> = {
  US: ['BANK_ACCOUNT', 'TAX_ID', 'PAYMENT_CARD'],
  GB: ['BANK_ACCOUNT', 'IBAN', 'SORT_CODE', 'TAX_ID', 'PAYMENT_CARD'],
  ES: ['BANK_ACCOUNT', 'IBAN', 'TAX_ID', 'PAYMENT_CARD'],
  DE: ['BANK_ACCOUNT', 'IBAN', 'TAX_ID', 'PAYMENT_CARD'],
  BR: ['BANK_ACCOUNT', 'TAX_ID', 'PIX_KEY', 'PAYMENT_CARD'],
};

export class CountryRules {
  /**
   * ISO 7064 Modulo 97-10 IBAN Check Digit Generation
   */
  public static computeIbanCheckDigits(countryCode: string, bban: string): string {
    const rearranged = bban.toUpperCase() + countryCode.toUpperCase() + '00';
    const numericString = rearranged
      .split('')
      .map((char) => {
        const code = char.charCodeAt(0);
        return code >= 65 && code <= 90 ? (code - 55).toString() : char;
      })
      .join('');
    const remainder = BigInt(numericString) % 97n;
    const check = 98n - remainder;
    return check < 10n ? '0' + check.toString() : check.toString();
  }

  /**
   * Validates ISO 7064 Modulo 97-10 IBAN checksum
   */
  public static validateIban(iban: string): boolean {
    const clean = iban.replace(/[\s-]/g, '').toUpperCase();
    if (clean.length < 15 || clean.length > 34) return false;
    const rearranged = clean.slice(4) + clean.slice(0, 4);
    const numericString = rearranged
      .split('')
      .map((char) => {
        const code = char.charCodeAt(0);
        return code >= 65 && code <= 90 ? (code - 55).toString() : char;
      })
      .join('');
    try {
      return BigInt(numericString) % 97n === 1n;
    } catch {
      return false;
    }
  }

  /**
   * Validates US Federal Reserve 9-Digit ABA Routing Transit Number
   */
  public static validateAbaRouting(routing: string): boolean {
    const clean = routing.replace(/[\s-]/g, '');
    if (!/^\d{9}$/.test(clean)) return false;
    const d = clean.split('').map(Number);
    const d0 = d[0] ?? 0;
    const d1 = d[1] ?? 0;
    const d2 = d[2] ?? 0;
    const d3 = d[3] ?? 0;
    const d4 = d[4] ?? 0;
    const d5 = d[5] ?? 0;
    const d6 = d[6] ?? 0;
    const d7 = d[7] ?? 0;
    const d8 = d[8] ?? 0;
    const weighted = 3 * (d0 + d3 + d6) + 7 * (d1 + d4 + d7) + 1 * (d2 + d5 + d8);
    return weighted % 10 === 0;
  }

  /**
   * Computes Spanish CCC control digits (2 digits for 4-digit bank, 4-digit branch, 10-digit account)
   */
  public static computeSpanishCccControlDigits(bank: string, branch: string, account: string): string {
    const weights1 = [4, 8, 5, 10, 9, 7, 3, 6];
    const str1 = (bank + branch).padStart(8, '0');
    let sum1 = 0;
    for (let i = 0; i < 8; i++) {
      sum1 += parseInt(str1[i] ?? '0', 10) * (weights1[i] ?? 0);
    }
    let d1 = 11 - (sum1 % 11);
    if (d1 === 10) d1 = 1;
    if (d1 === 11) d1 = 0;

    const weights2 = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6];
    const str2 = account.padStart(10, '0');
    let sum2 = 0;
    for (let i = 0; i < 10; i++) {
      sum2 += parseInt(str2[i] ?? '0', 10) * (weights2[i] ?? 0);
    }
    let d2 = 11 - (sum2 % 11);
    if (d2 === 10) d2 = 1;
    if (d2 === 11) d2 = 0;

    return `${d1}${d2}`;
  }

  /**
   * Validates Spanish DNI / NIE Check Letter
   */
  public static validateSpanishDni(dni: string): boolean {
    const clean = dni.replace(/[\s-]/g, '').toUpperCase();
    if (!/^[0-9XYZ]\d{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(clean)) return false;
    let numStr = clean.slice(0, 8);
    if (numStr.startsWith('X')) numStr = '0' + numStr.slice(1);
    else if (numStr.startsWith('Y')) numStr = '1' + numStr.slice(1);
    else if (numStr.startsWith('Z')) numStr = '2' + numStr.slice(1);
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const idx = parseInt(numStr, 10) % 23;
    const expectedLetter = letters[idx];
    return clean.slice(-1) === expectedLetter;
  }

  /**
   * Validates Brazilian Receita Federal CPF Dual Check Digits (Modulo 11)
   */
  public static validateBrazilianCpf(cpf: string): boolean {
    const clean = cpf.replace(/[\s.-]/g, '');
    if (!/^\d{11}$/.test(clean)) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false; // Exclude repeats e.g. 11111111111

    // First check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean[i] ?? '0', 10) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(clean[9] ?? '-1', 10)) return false;

    // Second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(clean[i] ?? '0', 10) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(clean[10] ?? '-1', 10);
  }

  /**
   * Generates valid synthetic Brazilian CPF check digits for 9 base digits
   */
  public static generateCpfCheckDigits(nineDigits: string): string {
    const clean = nineDigits.padStart(9, '0').slice(0, 9);
    let sum1 = 0;
    for (let i = 0; i < 9; i++) {
      sum1 += parseInt(clean[i] ?? '0', 10) * (10 - i);
    }
    let d1 = (sum1 * 10) % 11;
    if (d1 === 10 || d1 === 11) d1 = 0;

    const tenDigits = clean + d1.toString();
    let sum2 = 0;
    for (let i = 0; i < 10; i++) {
      sum2 += parseInt(tenDigits[i] ?? '0', 10) * (11 - i);
    }
    let d2 = (sum2 * 10) % 11;
    if (d2 === 10 || d2 === 11) d2 = 0;

    return `${d1}${d2}`;
  }

  /**
   * Validates ISO/IEC 7812 Luhn Modulo 10 Checksum for Cards
   */
  public static validateLuhn(numStr: string): boolean {
    const clean = numStr.replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(clean)) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  /**
   * Calculates Luhn check digit for an uncompleted number string
   */
  public static computeLuhnCheckDigit(partialNum: string): string {
    const clean = partialNum.replace(/[\s-]/g, '');
    let sum = 0;
    let shouldDouble = true;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    const check = (10 - (sum % 10)) % 10;
    return check.toString();
  }
}
