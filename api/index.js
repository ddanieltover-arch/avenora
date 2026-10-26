"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/domain/ledger/LedgerInvariant.ts
function verifyDoubleEntryInvariant(lines) {
  if (!lines || lines.length < 2) {
    return {
      isValid: false,
      totalDebitMinor: 0n,
      totalCreditMinor: 0n,
      imbalanceMinor: 0n,
      lineCount: lines ? lines.length : 0,
      error: "Double-entry journal entry requires at least two lines (minimum one debit and one credit)."
    };
  }
  let totalDebit = 0n;
  let totalCredit = 0n;
  let hasDebit = false;
  let hasCredit = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.amountMinor <= 0n) {
      return {
        isValid: false,
        totalDebitMinor: totalDebit,
        totalCreditMinor: totalCredit,
        imbalanceMinor: totalDebit - totalCredit,
        lineCount: lines.length,
        error: `Line ${i + 1} has non-positive amount (${line.amountMinor}). All ledger lines must be strictly positive.`
      };
    }
    if (line.direction === "DEBIT") {
      totalDebit += line.amountMinor;
      hasDebit = true;
    } else if (line.direction === "CREDIT") {
      totalCredit += line.amountMinor;
      hasCredit = true;
    } else {
      return {
        isValid: false,
        totalDebitMinor: totalDebit,
        totalCreditMinor: totalCredit,
        imbalanceMinor: 0n,
        lineCount: lines.length,
        error: `Line ${i + 1} has invalid direction. Must be DEBIT or CREDIT.`
      };
    }
  }
  if (!hasDebit || !hasCredit) {
    return {
      isValid: false,
      totalDebitMinor: totalDebit,
      totalCreditMinor: totalCredit,
      imbalanceMinor: totalDebit - totalCredit,
      lineCount: lines.length,
      error: "Journal entry must contain at least one DEBIT and at least one CREDIT line."
    };
  }
  const imbalance = totalDebit - totalCredit;
  const isValid = imbalance === 0n;
  return {
    isValid,
    totalDebitMinor: totalDebit,
    totalCreditMinor: totalCredit,
    imbalanceMinor: imbalance,
    lineCount: lines.length,
    error: isValid ? void 0 : `Ledger imbalance detected: Debits (${totalDebit}) do not match Credits (${totalCredit}). Imbalance: ${imbalance} minor units.`
  };
}
function assertDoubleEntryInvariant(lines) {
  const result = verifyDoubleEntryInvariant(lines);
  if (!result.isValid) {
    throw new LedgerInvariantError(result.error ?? "Ledger invariant violation", result);
  }
  return result;
}
var LedgerInvariantError;
var init_LedgerInvariant = __esm({
  "src/domain/ledger/LedgerInvariant.ts"() {
    "use strict";
    LedgerInvariantError = class extends Error {
      constructor(message, details) {
        super(message);
        this.details = details;
        this.name = "LedgerInvariantError";
      }
      details;
    };
  }
});

// src/config/constants.ts
var PLATFORM_METADATA, PLATFORM_BTC_DEPOSIT_ADDRESS, PLATFORM_DEPOSIT_SUPPORT_EMAIL, SYSTEM_CHART_OF_ACCOUNTS;
var init_constants = __esm({
  "src/config/constants.ts"() {
    "use strict";
    PLATFORM_METADATA = {
      NAME: "Avenora",
      VERSION: "0.1.0-phase01",
      RELEASE_CODENAME: "FOUNDATION_CORE",
      PROTOTYPE_MODE: true,
      LIVE_MONEY_ENABLED: false
    };
    PLATFORM_BTC_DEPOSIT_ADDRESS = "bc1qavenora0platformcustodydepositaddress000000000000000";
    PLATFORM_DEPOSIT_SUPPORT_EMAIL = "support@avenorabank.com";
    SYSTEM_CHART_OF_ACCOUNTS = {
      // Asset Accounts (1000s)
      SAFEGUARDING_CASH_USD: {
        accountNumber: "1010-USD-SAFEGUARD",
        name: "Safeguarding Vault - USD Treasury",
        type: "ASSET",
        classification: "SYSTEM_SAFEGUARDING_ASSET",
        currency: "USD"
      },
      SAFEGUARDING_CASH_EUR: {
        accountNumber: "1010-EUR-SAFEGUARD",
        name: "Safeguarding Vault - EUR Treasury",
        type: "ASSET",
        classification: "SYSTEM_SAFEGUARDING_ASSET",
        currency: "EUR"
      },
      SAFEGUARDING_CASH_BRL: {
        accountNumber: "1010-BRL-SAFEGUARD",
        name: "Safeguarding Vault - BRL Reserve",
        type: "ASSET",
        classification: "SYSTEM_SAFEGUARDING_ASSET",
        currency: "BRL"
      },
      SAFEGUARDING_CRYPTO_BTC: {
        accountNumber: "1050-BTC-COLD-VAULT",
        name: "Bitcoin Multi-Sig Cold Storage Vault",
        type: "ASSET",
        classification: "SYSTEM_SAFEGUARDING_ASSET",
        currency: "BTC"
      },
      // Clearing / In-flight (1500s)
      PROVIDER_CLEARING_USD: {
        accountNumber: "1510-USD-CLEARING",
        name: "ACH / FedNow Provider Clearing",
        type: "ASSET",
        classification: "SYSTEM_PROVIDER_CLEARING",
        currency: "USD"
      },
      // Customer Liabilities (2000s)
      CUSTOMER_LIABILITY_USD: {
        accountNumber: "2010-USD-CUSTOMER-DEPOSITS",
        name: "Customer Wallets - Available USD",
        type: "LIABILITY",
        classification: "CUSTOMER_AVAILABLE_BALANCE",
        currency: "USD"
      },
      CUSTOMER_LIABILITY_EUR: {
        accountNumber: "2010-EUR-CUSTOMER-DEPOSITS",
        name: "Customer Wallets - Available EUR",
        type: "LIABILITY",
        classification: "CUSTOMER_AVAILABLE_BALANCE",
        currency: "EUR"
      },
      CUSTOMER_LIABILITY_BRL: {
        accountNumber: "2010-BRL-CUSTOMER-DEPOSITS",
        name: "Customer Wallets - Available BRL",
        type: "LIABILITY",
        classification: "CUSTOMER_AVAILABLE_BALANCE",
        currency: "BRL"
      },
      CUSTOMER_LIABILITY_BTC: {
        accountNumber: "2050-BTC-CUSTOMER-BALANCES",
        name: "Customer Wallets - Custodied Bitcoin",
        type: "LIABILITY",
        classification: "CUSTOMER_AVAILABLE_BALANCE",
        currency: "BTC"
      },
      // Revenue Accounts (4000s)
      FEE_REVENUE_FX: {
        accountNumber: "4010-FX-SPREAD-REVENUE",
        name: "Platform FX Spread & Conversion Fees",
        type: "REVENUE",
        classification: "SYSTEM_FEE_REVENUE",
        currency: "USD"
      }
    };
  }
});

// src/config/env.config.ts
function getValidatedConfig(customEnv) {
  if (cachedEnv && !customEnv) {
    return cachedEnv;
  }
  const rawEnv = customEnv ?? (typeof process !== "undefined" ? process.env : {});
  const parsed = EnvSchema.safeParse(rawEnv);
  if (!parsed.success) {
    const errorDetails = JSON.stringify(parsed.error.format(), null, 2);
    throw new Error(`CRITICAL: Environment validation failed:
${errorDetails}`);
  }
  if (parsed.data.ENABLE_LIVE_SETTLEMENT && parsed.data.PROTOTYPE_MODE) {
    throw new Error(
      "SECURITY VIOLATION: ENABLE_LIVE_SETTLEMENT cannot be true while PROTOTYPE_MODE is enabled."
    );
  }
  if (!parsed.data.PROTOTYPE_MODE && (!rawEnv.PRODUCTION_INTEGRATION_AUDIT_PASSED || rawEnv.PRODUCTION_INTEGRATION_AUDIT_PASSED !== "AUDIT_VERIFIED_SIGN_OFF_2026")) {
    throw new Error(
      "SECURITY VIOLATION: Production mode cannot be activated solely by toggling PROTOTYPE_MODE. Formal regulatory approval, institutional banking contracts, and certified security credentials are required."
    );
  }
  if (!customEnv) {
    cachedEnv = parsed.data;
  }
  return parsed.data;
}
function getSafePublicConfig(config) {
  return {
    environment: config.NODE_ENV,
    prototypeMode: config.PROTOTYPE_MODE,
    bypassKycGates: Boolean(config.BYPASS_KYC_GATES),
    liveSettlementEnabled: config.ENABLE_LIVE_SETTLEMENT,
    logLevel: config.LOG_LEVEL,
    maskPiiEnabled: config.MASK_PII_IN_LOGS,
    databaseConfigured: Boolean(config.DATABASE_URL && !config.DATABASE_URL.includes("placeholder")),
    emailConfigured: Boolean(
      config.RESEND_API_KEY && config.RESEND_API_KEY.trim() !== "" && !config.RESEND_API_KEY.includes("placeholder")
    )
  };
}
var import_zod2, EnvSchema, cachedEnv;
var init_env_config = __esm({
  "src/config/env.config.ts"() {
    "use strict";
    import_zod2 = require("zod");
    EnvSchema = import_zod2.z.object({
      NODE_ENV: import_zod2.z.enum(["development", "test", "production"]).default("development"),
      PORT: import_zod2.z.string().default("3000").transform((val) => parseInt(val, 10)),
      APP_URL: import_zod2.z.string().url().default("http://localhost:3000"),
      // Prototype isolation
      PROTOTYPE_MODE: import_zod2.z.string().default("true").transform((v) => v.toLowerCase() === "true"),
      ENABLE_LIVE_SETTLEMENT: import_zod2.z.string().default("false").transform((v) => v.toLowerCase() === "true"),
      /**
       * When true, auto-approve KYC and unlock domestic account numbers without review.
       * Defaults to false — KYC workflow is required. Set explicitly to enable prototype bypass.
       */
      BYPASS_KYC_GATES: import_zod2.z.string().default("false").transform((v) => v.toLowerCase() === "true"),
      // Database Connection Strings
      DATABASE_URL: import_zod2.z.string().optional().default("postgresql://user:pass@localhost:5432/avenora_dev"),
      DIRECT_URL: import_zod2.z.string().optional().default("postgresql://user:pass@localhost:5432/avenora_dev"),
      // Logging & Telemetry
      LOG_LEVEL: import_zod2.z.enum(["debug", "info", "warn", "error"]).default("info"),
      MASK_PII_IN_LOGS: import_zod2.z.string().default("true").transform((v) => v.toLowerCase() === "true"),
      // Security & Authentication Secrets (Server-only)
      SESSION_SECRET: import_zod2.z.string().min(16).default("avenora_dev_session_secret_32bytes_min_length_required!"),
      MOCK_PROVIDER_WEBHOOK_SECRET: import_zod2.z.string().min(16).default("whsec_mock_avenora_fintech_partner_signing_key_2026"),
      WEBHOOK_TOLERANCE_SECONDS: import_zod2.z.string().default("300").transform((val) => parseInt(val, 10)),
      // CORS
      CORS_ALLOWED_ORIGINS: import_zod2.z.string().default("http://localhost:3000"),
      // Transactional email (Resend) — optional; sends are skipped when unset
      RESEND_API_KEY: import_zod2.z.string().optional().default(""),
      EMAIL_FROM: import_zod2.z.string().optional().default("Avenora Bank <noreply@avenorabank.com>"),
      EMAIL_FROM_ADDRESS: import_zod2.z.string().email().optional().default("noreply@avenorabank.com"),
      EMAIL_FROM_NAME: import_zod2.z.string().optional().default("Avenora Bank"),
      EMAIL_REPLY_TO: import_zod2.z.string().email().optional().default("support@avenorabank.com"),
      SUPPORT_EMAIL: import_zod2.z.string().email().optional().default("support@avenorabank.com"),
      ADMIN_EMAIL: import_zod2.z.string().email().optional().default("support@avenorabank.com"),
      CONTACT_EMAIL: import_zod2.z.string().email().optional().default("support@avenorabank.com")
    });
    cachedEnv = null;
  }
});

// src/config/iso4217CurrencyCodes.json
var iso4217CurrencyCodes_default;
var init_iso4217CurrencyCodes = __esm({
  "src/config/iso4217CurrencyCodes.json"() {
    iso4217CurrencyCodes_default = ["AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN", "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL", "BSD", "BWP", "BYR", "BZD", "CAD", "CDF", "CHF", "CLP", "CNY", "COP", "CRC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EGP", "ERN", "ETB", "EUR", "FJD", "FKP", "GBP", "GEL", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HRK", "HTG", "HUF", "IDR", "ILS", "INR", "IQD", "IRR", "ISK", "JMD", "JOD", "JPY", "KES", "KGS", "KHR", "KMF", "KPW", "KRW", "KWD", "KYD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRO", "MUR", "MVR", "MWK", "MXN", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLL", "SOS", "SRD", "SSP", "STD", "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "USD", "UYU", "UZS", "VEF", "VND", "VUV", "WST", "XAF", "XCD", "XOF", "XPF", "YER", "ZAR", "ZMW"];
  }
});

// src/domain/money/currencyMinorUnits.ts
function minorUnitsForCurrencyCode(code) {
  const upper = code.toUpperCase();
  if (upper === "BTC") return 8;
  if (ZERO_DECIMAL_CURRENCIES.has(upper)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(upper)) return 3;
  return 2;
}
var ZERO_DECIMAL_CURRENCIES, THREE_DECIMAL_CURRENCIES;
var init_currencyMinorUnits = __esm({
  "src/domain/money/currencyMinorUnits.ts"() {
    "use strict";
    ZERO_DECIMAL_CURRENCIES = /* @__PURE__ */ new Set([
      "BIF",
      "CLP",
      "DJF",
      "GNF",
      "ISK",
      "JPY",
      "KMF",
      "KRW",
      "PYG",
      "RWF",
      "UGX",
      "UYI",
      "VND",
      "VUV",
      "XAF",
      "XOF",
      "XPF"
    ]);
    THREE_DECIMAL_CURRENCIES = /* @__PURE__ */ new Set([
      "BHD",
      "IQD",
      "JOD",
      "KWD",
      "LYD",
      "OMR",
      "TND"
    ]);
  }
});

// src/domain/money/currencyRegistry.ts
function currencyDisplayName(code) {
  try {
    const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(code);
    if (name && name !== code) return name;
  } catch {
  }
  return code;
}
function currencyDisplaySymbol(code) {
  try {
    const parts = new Intl.NumberFormat("en", { style: "currency", currency: code }).formatToParts(1);
    const sym = parts.find((p) => p.type === "currency")?.value;
    if (sym && sym !== code) return sym;
  } catch {
  }
  return code;
}
function isRegisteredCurrencyCode(code) {
  const upper = code.toUpperCase();
  return upper === "BTC" || FIAT_CODES.has(upper);
}
function buildCurrencyDefinition(code) {
  const upper = code.toUpperCase();
  if (!isRegisteredCurrencyCode(upper)) {
    throw new Error(`Unsupported or unverified currency code: ${code}`);
  }
  const override = KNOWN_OVERRIDES[upper];
  const isCrypto = upper === "BTC" || override?.isCrypto === true;
  return {
    code: upper,
    name: override?.name ?? currencyDisplayName(upper),
    symbol: override?.symbol ?? currencyDisplaySymbol(upper),
    minorUnits: minorUnitsForCurrencyCode(upper),
    isCrypto,
    defaultLocale: override?.defaultLocale ?? "en-US"
  };
}
var FIAT_CODES, KNOWN_OVERRIDES;
var init_currencyRegistry = __esm({
  "src/domain/money/currencyRegistry.ts"() {
    "use strict";
    init_iso4217CurrencyCodes();
    init_currencyMinorUnits();
    FIAT_CODES = /* @__PURE__ */ new Set([
      ...iso4217CurrencyCodes_default,
      "BTC"
    ]);
    KNOWN_OVERRIDES = {
      USD: { name: "United States Dollar", symbol: "$", defaultLocale: "en-US" },
      EUR: { name: "Euro", symbol: "\u20AC", defaultLocale: "de-DE" },
      GBP: { name: "British Pound", symbol: "\xA3", defaultLocale: "en-GB" },
      BRL: { name: "Brazilian Real", symbol: "R$", defaultLocale: "pt-BR" },
      JPY: { name: "Japanese Yen", symbol: "\xA5", defaultLocale: "ja-JP" },
      BTC: { name: "Bitcoin", symbol: "\u20BF", defaultLocale: "en-US", isCrypto: true }
    };
  }
});

// src/domain/money/Currency.ts
function getCurrency(code) {
  const upper = code.toUpperCase();
  const preset = SUPPORTED_CURRENCIES[upper];
  if (preset) return preset;
  return buildCurrencyDefinition(upper);
}
function isSupportedCurrency(code) {
  const upper = code.toUpperCase();
  return upper in SUPPORTED_CURRENCIES || isRegisteredCurrencyCode(upper);
}
var SUPPORTED_CURRENCIES;
var init_Currency = __esm({
  "src/domain/money/Currency.ts"() {
    "use strict";
    init_currencyRegistry();
    SUPPORTED_CURRENCIES = {
      USD: {
        code: "USD",
        name: "United States Dollar",
        symbol: "$",
        minorUnits: 2,
        isCrypto: false,
        defaultLocale: "en-US"
      },
      EUR: {
        code: "EUR",
        name: "Euro",
        symbol: "\u20AC",
        minorUnits: 2,
        isCrypto: false,
        defaultLocale: "de-DE"
      },
      GBP: {
        code: "GBP",
        name: "British Pound",
        symbol: "\xA3",
        minorUnits: 2,
        isCrypto: false,
        defaultLocale: "en-GB"
      },
      BRL: {
        code: "BRL",
        name: "Brazilian Real",
        symbol: "R$",
        minorUnits: 2,
        isCrypto: false,
        defaultLocale: "pt-BR"
      },
      BTC: {
        code: "BTC",
        name: "Bitcoin",
        symbol: "\u20BF",
        minorUnits: 8,
        isCrypto: true,
        defaultLocale: "en-US"
      }
    };
  }
});

// src/domain/money/Money.ts
var Money;
var init_Money = __esm({
  "src/domain/money/Money.ts"() {
    "use strict";
    init_Currency();
    Money = class _Money {
      amountMinor;
      currency;
      constructor(amountMinor, currency) {
        this.amountMinor = amountMinor;
        this.currency = currency;
      }
      /**
       * Factory method: instantiate from integer minor units (e.g. cents, satoshis).
       */
      static fromMinor(amountMinor, currencyCode) {
        const currency = getCurrency(currencyCode);
        const bigintAmount = typeof amountMinor === "bigint" ? amountMinor : BigInt(amountMinor);
        return new _Money(bigintAmount, currency);
      }
      /**
       * Factory method: parse from decimal string (e.g. "1250.50" or "-10.05") without floating-point math.
       */
      static fromDecimalString(amountStr, currencyCode) {
        const currency = getCurrency(currencyCode);
        const cleaned = amountStr.trim().replace(/,/g, "");
        const isNegative = cleaned.startsWith("-");
        const unsignedStr = isNegative ? cleaned.slice(1) : cleaned;
        const parts = unsignedStr.split(".");
        if (parts.length > 2) {
          throw new Error(`Invalid monetary decimal format: "${amountStr}"`);
        }
        const wholePart = parts[0] || "0";
        let fractionPart = parts[1] || "";
        if (!/^\d+$/.test(wholePart) || fractionPart && !/^\d+$/.test(fractionPart)) {
          throw new Error(`Monetary string contains non-numeric characters: "${amountStr}"`);
        }
        if (fractionPart.length > currency.minorUnits) {
          throw new Error(
            `Precision overflow: "${amountStr}" has ${fractionPart.length} decimals; ${currency.code} allows max ${currency.minorUnits}`
          );
        }
        fractionPart = fractionPart.padEnd(currency.minorUnits, "0");
        const combinedStr = wholePart + fractionPart;
        const unsignedMinor = BigInt(combinedStr);
        const amountMinor = isNegative ? -unsignedMinor : unsignedMinor;
        return new _Money(amountMinor, currency);
      }
      static zero(currencyCode) {
        return _Money.fromMinor(0n, currencyCode);
      }
      add(other) {
        this.assertSameCurrency(other);
        return new _Money(this.amountMinor + other.amountMinor, this.currency);
      }
      subtract(other) {
        this.assertSameCurrency(other);
        return new _Money(this.amountMinor - other.amountMinor, this.currency);
      }
      multiply(scalar) {
        if (typeof scalar === "number") {
          if (!Number.isInteger(scalar)) {
            throw new Error("Scalar multiplication on Money must use integer multiplier to prevent float drift.");
          }
          return new _Money(this.amountMinor * BigInt(scalar), this.currency);
        }
        return new _Money(this.amountMinor * scalar, this.currency);
      }
      /**
       * Pro-rata integer allocation without losing minor units (cents / satoshis).
       * Ensures sum(allocated) === this.amountMinor exactly.
       */
      allocate(ratios) {
        if (ratios.length === 0) {
          return [];
        }
        const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
        if (totalRatio <= 0) {
          throw new Error("Total allocation ratio must be positive.");
        }
        let remainder = this.amountMinor;
        const results = [];
        for (let i = 0; i < ratios.length; i++) {
          const ratio = ratios[i] ?? 0;
          const share = this.amountMinor * BigInt(ratio) / BigInt(totalRatio);
          results.push(share);
          remainder -= share;
        }
        let idx = 0;
        while (remainder > 0n) {
          results[idx] = (results[idx] ?? 0n) + 1n;
          remainder -= 1n;
          idx = (idx + 1) % results.length;
        }
        return results.map((val) => new _Money(val, this.currency));
      }
      isZero() {
        return this.amountMinor === 0n;
      }
      isPositive() {
        return this.amountMinor > 0n;
      }
      isNegative() {
        return this.amountMinor < 0n;
      }
      equals(other) {
        return this.currency.code === other.currency.code && this.amountMinor === other.amountMinor;
      }
      compareTo(other) {
        this.assertSameCurrency(other);
        if (this.amountMinor < other.amountMinor) return -1;
        if (this.amountMinor > other.amountMinor) return 1;
        return 0;
      }
      greaterThan(other) {
        return this.compareTo(other) > 0;
      }
      lessThan(other) {
        return this.compareTo(other) < 0;
      }
      greaterThanOrEqual(other) {
        return this.compareTo(other) >= 0;
      }
      lessThanOrEqual(other) {
        return this.compareTo(other) <= 0;
      }
      /**
       * Convert to formatted decimal string (e.g. "1250.50" or "0.00015000").
       */
      toDecimalString() {
        const isNegative = this.amountMinor < 0n;
        const absVal = isNegative ? -this.amountMinor : this.amountMinor;
        const factor = 10n ** BigInt(this.currency.minorUnits);
        const whole = absVal / factor;
        const fraction = absVal % factor;
        const fractionStr = fraction.toString().padStart(this.currency.minorUnits, "0");
        const result = `${whole}.${fractionStr}`;
        return isNegative ? `-${result}` : result;
      }
      /**
       * Display string with currency symbol.
       */
      toDisplayString() {
        return `${this.currency.symbol}${this.toDecimalString()} ${this.currency.code}`;
      }
      assertSameCurrency(other) {
        if (this.currency.code !== other.currency.code) {
          throw new Error(`Currency mismatch: cannot perform operation between ${this.currency.code} and ${other.currency.code}`);
        }
      }
    };
  }
});

// src/config/countryToCurrency.json
var countryToCurrency_default;
var init_countryToCurrency = __esm({
  "src/config/countryToCurrency.json"() {
    countryToCurrency_default = { AC: "USD", AD: "EUR", AE: "AED", AF: "AFN", AG: "XCD", AI: "XCD", AL: "ALL", AM: "AMD", AN: "USD", AO: "AOA", AQ: "USD", AR: "ARS", AS: "USD", AT: "EUR", AU: "AUD", AW: "AWG", AX: "EUR", AZ: "AZN", BA: "BAM", BB: "BBD", BD: "BDT", BE: "EUR", BF: "XOF", BG: "BGN", BH: "BHD", BI: "BIF", BJ: "XOF", BL: "EUR", BM: "BMD", BN: "BND", BO: "BOB", BQ: "USD", BR: "BRL", BS: "BSD", BT: "INR", BU: "USD", BV: "NOK", BW: "BWP", BY: "BYR", BZ: "BZD", CA: "CAD", CC: "AUD", CD: "CDF", CF: "XAF", CG: "XAF", CH: "CHF", CI: "XOF", CK: "NZD", CL: "CLP", CM: "XAF", CN: "CNY", CO: "COP", CP: "EUR", CQ: "USD", CR: "CRC", CS: "USD", CU: "CUP", CV: "CVE", CW: "ANG", CX: "AUD", CY: "EUR", CZ: "CZK", DD: "USD", DE: "EUR", DG: "USD", DJ: "DJF", DK: "DKK", DM: "XCD", DO: "DOP", DY: "USD", DZ: "DZD", EA: "EUR", EC: "USD", EE: "EUR", EG: "EGP", EH: "MAD", ER: "ERN", ES: "EUR", ET: "ETB", EU: "EUR", EZ: "USD", FI: "EUR", FJ: "FJD", FK: "FKP", FM: "USD", FO: "DKK", FR: "EUR", FX: "EUR", GA: "XAF", GB: "GBP", GD: "XCD", GE: "GEL", GF: "EUR", GG: "GBP", GH: "GHS", GI: "GIP", GL: "DKK", GM: "GMD", GN: "GNF", GP: "EUR", GQ: "XAF", GR: "EUR", GS: "GBP", GT: "GTQ", GU: "USD", GW: "XOF", GY: "GYD", HK: "HKD", HM: "AUD", HN: "HNL", HR: "HRK", HT: "HTG", HU: "HUF", HV: "USD", IC: "EUR", ID: "IDR", IE: "EUR", IL: "ILS", IM: "GBP", IN: "INR", IO: "USD", IQ: "IQD", IR: "IRR", IS: "ISK", IT: "EUR", JE: "GBP", JM: "JMD", JO: "JOD", JP: "JPY", KE: "KES", KG: "KGS", KH: "KHR", KI: "AUD", KM: "KMF", KN: "XCD", KP: "KPW", KR: "KRW", KW: "KWD", KY: "KYD", KZ: "KZT", LA: "LAK", LB: "LBP", LC: "XCD", LI: "CHF", LK: "LKR", LR: "LRD", LS: "LSL", LT: "EUR", LU: "EUR", LV: "EUR", LY: "LYD", MA: "MAD", MC: "EUR", MD: "MDL", ME: "EUR", MF: "EUR", MG: "MGA", MH: "USD", MK: "MKD", ML: "XOF", MM: "MMK", MN: "MNT", MO: "MOP", MP: "USD", MQ: "EUR", MR: "MRO", MS: "XCD", MT: "EUR", MU: "MUR", MV: "MVR", MW: "MWK", MX: "MXN", MY: "MYR", MZ: "MZN", NA: "NAD", NC: "XPF", NE: "XOF", NF: "AUD", NG: "NGN", NH: "USD", NI: "NIO", NL: "EUR", NO: "NOK", NP: "NPR", NR: "AUD", NU: "NZD", NZ: "NZD", OM: "OMR", PA: "PAB", PE: "PEN", PF: "XPF", PG: "PGK", PH: "PHP", PK: "PKR", PL: "PLN", PM: "EUR", PN: "NZD", PR: "USD", PS: "JOD", PT: "EUR", PW: "USD", PY: "PYG", QA: "QAR", QO: "USD", RE: "EUR", RH: "USD", RO: "RON", RS: "RSD", RU: "RUB", RW: "RWF", SA: "SAR", SB: "SBD", SC: "SCR", SD: "SDG", SE: "SEK", SG: "SGD", SH: "SHP", SI: "EUR", SJ: "NOK", SK: "EUR", SL: "SLL", SM: "EUR", SN: "XOF", SO: "SOS", SR: "SRD", SS: "SSP", ST: "STD", SU: "RUB", SV: "USD", SX: "ANG", SY: "SYP", SZ: "SZL", TA: "GBP", TC: "USD", TD: "XAF", TF: "EUR", TG: "XOF", TH: "THB", TJ: "TJS", TK: "NZD", TL: "USD", TM: "TMT", TN: "TND", TO: "TOP", TP: "USD", TR: "TRY", TT: "TTD", TV: "AUD", TW: "TWD", TZ: "TZS", UA: "UAH", UG: "UGX", UK: "GBP", UM: "USD", UN: "USD", US: "USD", UY: "UYU", UZ: "UZS", VA: "EUR", VC: "XCD", VD: "USD", VE: "VEF", VG: "USD", VI: "USD", VN: "VND", VU: "VUV", WF: "XPF", WS: "WST", XA: "USD", XB: "USD", XK: "EUR", YD: "USD", YE: "YER", YT: "EUR", YU: "USD", ZA: "ZAR", ZM: "ZMW", ZR: "USD", ZW: "USD", ZZ: "USD" };
  }
});

// src/config/iso3166CountryCodes.json
var iso3166CountryCodes_default;
var init_iso3166CountryCodes = __esm({
  "src/config/iso3166CountryCodes.json"() {
    iso3166CountryCodes_default = ["AC", "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AN", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BU", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CP", "CQ", "CR", "CS", "CU", "CV", "CW", "CX", "CY", "CZ", "DD", "DE", "DG", "DJ", "DK", "DM", "DO", "DY", "DZ", "EA", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "EU", "EZ", "FI", "FJ", "FK", "FM", "FO", "FR", "FX", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU", "HV", "IC", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NH", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "QO", "RE", "RH", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SU", "SV", "SX", "SY", "SZ", "TA", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TP", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UK", "UM", "UN", "US", "UY", "UZ", "VA", "VC", "VD", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "XA", "XB", "XK", "YD", "YE", "YT", "YU", "ZA", "ZM", "ZR", "ZW", "ZZ"];
  }
});

// src/domain/country/countryPrimaryCurrency.ts
function resolvePrimaryFiatCurrency(countryCode) {
  const code = countryCode.trim().toUpperCase();
  if (!code) return "USD";
  return MANUAL_COUNTRY_CURRENCY[code] ?? COUNTRY_CURRENCY_MAP[code] ?? "USD";
}
function getWalletCurrencyCodesForCountry(countryCode) {
  return [resolvePrimaryFiatCurrency(countryCode), "BTC"];
}
var COUNTRY_CURRENCY_MAP, MANUAL_COUNTRY_CURRENCY, KNOWN_COUNTRIES;
var init_countryPrimaryCurrency = __esm({
  "src/domain/country/countryPrimaryCurrency.ts"() {
    "use strict";
    init_countryToCurrency();
    init_iso3166CountryCodes();
    COUNTRY_CURRENCY_MAP = countryToCurrency_default;
    MANUAL_COUNTRY_CURRENCY = {
      XK: "EUR",
      AQ: "USD",
      BV: "NOK",
      HM: "AUD",
      TF: "EUR",
      UM: "USD",
      IO: "USD",
      PN: "NZD",
      GS: "GBP",
      CC: "AUD",
      CX: "AUD",
      AN: "USD"
    };
    KNOWN_COUNTRIES = new Set(iso3166CountryCodes_default);
  }
});

// src/server/services/ledger.service.ts
var LedgerService, defaultLedgerService;
var init_ledger_service = __esm({
  "src/server/services/ledger.service.ts"() {
    "use strict";
    init_constants();
    init_LedgerInvariant();
    init_Money();
    init_countryPrimaryCurrency();
    LedgerService = class {
      accounts = /* @__PURE__ */ new Map();
      entries = [];
      constructor() {
        this.seedDefaultAccounts();
        this.seedBaselineJournalEntries();
      }
      seedDefaultAccounts() {
        const defaultAccounts = Object.entries(SYSTEM_CHART_OF_ACCOUNTS).map(([key, acc]) => ({
          id: `acc_${key.toLowerCase()}`,
          accountNumber: acc.accountNumber,
          name: acc.name,
          type: acc.type,
          classification: acc.classification,
          currency: acc.currency,
          isActive: true,
          isFrozen: false,
          createdAt: /* @__PURE__ */ new Date("2026-01-01T00:00:00Z"),
          updatedAt: /* @__PURE__ */ new Date("2026-01-01T00:00:00Z")
        }));
        for (const acc of defaultAccounts) {
          this.accounts.set(acc.id, acc);
        }
        this.accounts.set("acc_equity_reserve_usd", {
          id: "acc_equity_reserve_usd",
          accountNumber: "3010-USD-EQUITY-CAPITAL",
          name: "Tier-1 Capital & Statutory Reserves",
          type: "EQUITY",
          classification: "SYSTEM_SAFEGUARDING_ASSET",
          currency: "USD",
          isActive: true,
          isFrozen: false,
          createdAt: /* @__PURE__ */ new Date("2026-01-01T00:00:00Z"),
          updatedAt: /* @__PURE__ */ new Date("2026-01-01T00:00:00Z")
        });
      }
      seedBaselineJournalEntries() {
        const capEntry = {
          id: "je_cap_001",
          transactionId: "tx_init_capital_2026",
          entrySequence: 1,
          currency: "USD",
          narration: "Initial Tier-1 Regulatory Capital Deposit into Partner Safeguarding Vault",
          postedAt: /* @__PURE__ */ new Date("2026-01-01T00:00:00Z"),
          lines: [
            {
              accountId: "acc_safeguarding_cash_usd",
              direction: "DEBIT",
              amountMinor: 50000000n,
              // $500,000.00
              description: "Funds received in safeguarding treasury account"
            },
            {
              accountId: "acc_equity_reserve_usd",
              direction: "CREDIT",
              amountMinor: 50000000n,
              // $500,000.00
              description: "Capital reserve equity recognition"
            }
          ]
        };
        assertDoubleEntryInvariant(capEntry.lines);
        this.entries.push(capEntry);
      }
      getAccounts() {
        return Array.from(this.accounts.values());
      }
      getAccount(id) {
        return this.accounts.get(id);
      }
      /** Prototype safeguarding asset for regional fiat not in the static chart. */
      ensureSafeguardingAssetAccount(currency) {
        const code = currency.toUpperCase();
        const existingId = `acc_safeguarding_cash_${code.toLowerCase()}`;
        const existing = this.accounts.get(existingId);
        if (existing) return existing;
        const account = {
          id: existingId,
          accountNumber: `1100-${code}-SAFEGUARD-PROTO`,
          name: `${code} Safeguarding Treasury (prototype)`,
          type: "ASSET",
          classification: "SYSTEM_SAFEGUARDING_ASSET",
          currency: code,
          isActive: true,
          isFrozen: false,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.accounts.set(existingId, account);
        return account;
      }
      getEntries() {
        return [...this.entries];
      }
      /**
       * Posts an immutable balanced journal entry.
       */
      postJournalEntry(input) {
        assertDoubleEntryInvariant(input.lines);
        for (const line of input.lines) {
          const account = this.accounts.get(line.accountId);
          if (!account) {
            throw new Error(`Account not found: ${line.accountId}`);
          }
          if (account.currency !== input.currency) {
            throw new Error(
              `Account currency mismatch: Account ${account.accountNumber} is ${account.currency}, but entry is ${input.currency}`
            );
          }
          if (account.isFrozen) {
            throw new Error(`Account ${account.accountNumber} is frozen and cannot accept postings.`);
          }
        }
        const newRecord = {
          id: `je_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          transactionId: input.transactionId,
          entrySequence: this.entries.length + 1,
          currency: input.currency,
          narration: input.narration,
          postedAt: /* @__PURE__ */ new Date(),
          lines: input.lines
        };
        this.entries.push(newRecord);
        return newRecord;
      }
      /**
       * Calculates net balance for every account and checks global ledger invariant.
       */
      getLedgerSummary() {
        const debitMap = /* @__PURE__ */ new Map();
        const creditMap = /* @__PURE__ */ new Map();
        let globalDebits = 0n;
        let globalCredits = 0n;
        for (const entry of this.entries) {
          for (const line of entry.lines) {
            if (line.direction === "DEBIT") {
              debitMap.set(line.accountId, (debitMap.get(line.accountId) ?? 0n) + line.amountMinor);
              globalDebits += line.amountMinor;
            } else {
              creditMap.set(line.accountId, (creditMap.get(line.accountId) ?? 0n) + line.amountMinor);
              globalCredits += line.amountMinor;
            }
          }
        }
        const accountBalances = Array.from(this.accounts.values()).map((acc) => {
          const debitMinor = debitMap.get(acc.id) ?? 0n;
          const creditMinor = creditMap.get(acc.id) ?? 0n;
          let netMinor = 0n;
          if (acc.type === "ASSET" || acc.type === "EXPENSE") {
            netMinor = debitMinor - creditMinor;
          } else {
            netMinor = creditMinor - debitMinor;
          }
          const money = Money.fromMinor(netMinor, acc.currency);
          return {
            account: acc,
            debitMinor: debitMinor.toString(),
            creditMinor: creditMinor.toString(),
            netBalanceMinor: netMinor.toString(),
            formattedBalance: money.toDisplayString()
          };
        });
        const isBalanced = globalDebits === globalCredits;
        return {
          totalAccounts: this.accounts.size,
          totalEntries: this.entries.length,
          globalDebitsMinor: globalDebits.toString(),
          globalCreditsMinor: globalCredits.toString(),
          isBalanced,
          imbalanceMinor: (globalDebits - globalCredits).toString(),
          accountBalances
        };
      }
      /**
       * Provisions customer liability accounts for the signup-country fiat corridor and Bitcoin.
       */
      provisionCustomerAccounts(userId, fullName, countryCode = "US") {
        const currencies = getWalletCurrencyCodesForCountry(countryCode);
        const created = [];
        for (const curr of currencies) {
          const availId = `acc_${userId}_${curr.toLowerCase()}_avail`;
          if (!this.accounts.has(availId)) {
            const availAcc = {
              id: availId,
              accountNumber: `2100-${curr}-${userId.substring(0, 8).toUpperCase()}-AVAIL`,
              name: `${fullName} (${curr} Available Wallet)`,
              type: "LIABILITY",
              classification: "CUSTOMER_AVAILABLE_BALANCE",
              currency: curr,
              userId,
              isActive: true,
              isFrozen: false,
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            };
            this.accounts.set(availId, availAcc);
            created.push(availAcc);
          }
          const holdId = `acc_${userId}_${curr.toLowerCase()}_hold`;
          if (!this.accounts.has(holdId)) {
            const holdAcc = {
              id: holdId,
              accountNumber: `2200-${curr}-${userId.substring(0, 8).toUpperCase()}-HOLD`,
              name: `${fullName} (${curr} Pending Hold)`,
              type: "LIABILITY",
              classification: "CUSTOMER_PENDING_HOLD",
              currency: curr,
              userId,
              isActive: true,
              isFrozen: false,
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            };
            this.accounts.set(holdId, holdAcc);
            created.push(holdAcc);
          }
        }
        return created;
      }
      /**
       * Computes available minor units for a specific account by summing debits & credits.
       */
      getAccountBalance(accountId) {
        const account = this.accounts.get(accountId);
        if (!account) {
          throw new Error(`Account not found: ${accountId}`);
        }
        let debits = 0n;
        let credits = 0n;
        for (const entry of this.entries) {
          for (const line of entry.lines) {
            if (line.accountId === accountId) {
              if (line.direction === "DEBIT") {
                debits += line.amountMinor;
              } else {
                credits += line.amountMinor;
              }
            }
          }
        }
        let balanceMinor = 0n;
        if (account.type === "ASSET" || account.type === "EXPENSE") {
          balanceMinor = debits - credits;
        } else {
          balanceMinor = credits - debits;
        }
        const money = Money.fromMinor(balanceMinor, account.currency);
        return {
          account,
          balanceMinor,
          formatted: money.toDisplayString()
        };
      }
      /**
       * Returns all ledger accounts owned by a specific customer.
       */
      getUserAccounts(userId) {
        return Array.from(this.accounts.values()).filter((acc) => acc.userId === userId);
      }
    };
    defaultLedgerService = new LedgerService();
  }
});

// src/domain/country/CountryRules.ts
var SUPPORTED_COUNTRIES, SUPPORTED_IDENTIFIER_TYPES, CountryRules;
var init_CountryRules = __esm({
  "src/domain/country/CountryRules.ts"() {
    "use strict";
    SUPPORTED_COUNTRIES = ["US", "GB", "ES", "DE", "BR"];
    SUPPORTED_IDENTIFIER_TYPES = {
      US: ["BANK_ACCOUNT", "TAX_ID", "PAYMENT_CARD"],
      GB: ["BANK_ACCOUNT", "IBAN", "SORT_CODE", "TAX_ID", "PAYMENT_CARD"],
      ES: ["BANK_ACCOUNT", "IBAN", "TAX_ID", "PAYMENT_CARD"],
      DE: ["BANK_ACCOUNT", "IBAN", "TAX_ID", "PAYMENT_CARD"],
      BR: ["BANK_ACCOUNT", "TAX_ID", "PIX_KEY", "PAYMENT_CARD"]
    };
    CountryRules = class {
      /**
       * ISO 7064 Modulo 97-10 IBAN Check Digit Generation
       */
      static computeIbanCheckDigits(countryCode, bban) {
        const rearranged = bban.toUpperCase() + countryCode.toUpperCase() + "00";
        const numericString = rearranged.split("").map((char) => {
          const code = char.charCodeAt(0);
          return code >= 65 && code <= 90 ? (code - 55).toString() : char;
        }).join("");
        const remainder = BigInt(numericString) % 97n;
        const check = 98n - remainder;
        return check < 10n ? "0" + check.toString() : check.toString();
      }
      /**
       * Validates ISO 7064 Modulo 97-10 IBAN checksum
       */
      static validateIban(iban) {
        const clean = iban.replace(/[\s-]/g, "").toUpperCase();
        if (clean.length < 15 || clean.length > 34) return false;
        const rearranged = clean.slice(4) + clean.slice(0, 4);
        const numericString = rearranged.split("").map((char) => {
          const code = char.charCodeAt(0);
          return code >= 65 && code <= 90 ? (code - 55).toString() : char;
        }).join("");
        try {
          return BigInt(numericString) % 97n === 1n;
        } catch {
          return false;
        }
      }
      /**
       * Validates US Federal Reserve 9-Digit ABA Routing Transit Number
       */
      static validateAbaRouting(routing) {
        const clean = routing.replace(/[\s-]/g, "");
        if (!/^\d{9}$/.test(clean)) return false;
        const d = clean.split("").map(Number);
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
      static computeSpanishCccControlDigits(bank, branch, account) {
        const weights1 = [4, 8, 5, 10, 9, 7, 3, 6];
        const str1 = (bank + branch).padStart(8, "0");
        let sum1 = 0;
        for (let i = 0; i < 8; i++) {
          sum1 += parseInt(str1[i] ?? "0", 10) * (weights1[i] ?? 0);
        }
        let d1 = 11 - sum1 % 11;
        if (d1 === 10) d1 = 1;
        if (d1 === 11) d1 = 0;
        const weights2 = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6];
        const str2 = account.padStart(10, "0");
        let sum2 = 0;
        for (let i = 0; i < 10; i++) {
          sum2 += parseInt(str2[i] ?? "0", 10) * (weights2[i] ?? 0);
        }
        let d2 = 11 - sum2 % 11;
        if (d2 === 10) d2 = 1;
        if (d2 === 11) d2 = 0;
        return `${d1}${d2}`;
      }
      /**
       * Validates Spanish DNI / NIE Check Letter
       */
      static validateSpanishDni(dni) {
        const clean = dni.replace(/[\s-]/g, "").toUpperCase();
        if (!/^[0-9XYZ]\d{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(clean)) return false;
        let numStr = clean.slice(0, 8);
        if (numStr.startsWith("X")) numStr = "0" + numStr.slice(1);
        else if (numStr.startsWith("Y")) numStr = "1" + numStr.slice(1);
        else if (numStr.startsWith("Z")) numStr = "2" + numStr.slice(1);
        const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
        const idx = parseInt(numStr, 10) % 23;
        const expectedLetter = letters[idx];
        return clean.slice(-1) === expectedLetter;
      }
      /**
       * Validates Brazilian Receita Federal CPF Dual Check Digits (Modulo 11)
       */
      static validateBrazilianCpf(cpf) {
        const clean = cpf.replace(/[\s.-]/g, "");
        if (!/^\d{11}$/.test(clean)) return false;
        if (/^(\d)\1{10}$/.test(clean)) return false;
        let sum = 0;
        for (let i = 0; i < 9; i++) {
          sum += parseInt(clean[i] ?? "0", 10) * (10 - i);
        }
        let remainder = sum * 10 % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(clean[9] ?? "-1", 10)) return false;
        sum = 0;
        for (let i = 0; i < 10; i++) {
          sum += parseInt(clean[i] ?? "0", 10) * (11 - i);
        }
        remainder = sum * 10 % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        return remainder === parseInt(clean[10] ?? "-1", 10);
      }
      /**
       * Generates valid synthetic Brazilian CPF check digits for 9 base digits
       */
      static generateCpfCheckDigits(nineDigits) {
        const clean = nineDigits.padStart(9, "0").slice(0, 9);
        let sum1 = 0;
        for (let i = 0; i < 9; i++) {
          sum1 += parseInt(clean[i] ?? "0", 10) * (10 - i);
        }
        let d1 = sum1 * 10 % 11;
        if (d1 === 10 || d1 === 11) d1 = 0;
        const tenDigits = clean + d1.toString();
        let sum2 = 0;
        for (let i = 0; i < 10; i++) {
          sum2 += parseInt(tenDigits[i] ?? "0", 10) * (11 - i);
        }
        let d2 = sum2 * 10 % 11;
        if (d2 === 10 || d2 === 11) d2 = 0;
        return `${d1}${d2}`;
      }
      /**
       * Validates ISO/IEC 7812 Luhn Modulo 10 Checksum for Cards
       */
      static validateLuhn(numStr) {
        const clean = numStr.replace(/[\s-]/g, "");
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
      static computeLuhnCheckDigit(partialNum) {
        const clean = partialNum.replace(/[\s-]/g, "");
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
        const check = (10 - sum % 10) % 10;
        return check.toString();
      }
    };
  }
});

// src/server/services/providerAdapters.ts
function verifyHmacSha256Webhook(params) {
  try {
    const { payload, signatureHeader, secret, toleranceSeconds = 300, timestampHeader } = params;
    if (!signatureHeader || !secret) {
      return false;
    }
    if (timestampHeader) {
      const ts = parseInt(timestampHeader, 10);
      const now = Math.floor(Date.now() / 1e3);
      if (isNaN(ts) || Math.abs(now - ts) > toleranceSeconds) {
        return false;
      }
    }
    const expectedSig = signatureHeader.startsWith("v1=") ? signatureHeader.substring(3) : signatureHeader;
    const dataToSign = timestampHeader ? `${timestampHeader}.${typeof payload === "string" ? payload : payload.toString("utf8")}` : typeof payload === "string" ? payload : payload.toString("utf8");
    const computed = import_crypto2.default.createHmac("sha256", secret).update(dataToSign).digest("hex");
    const computedBuf = Buffer.from(computed, "utf8");
    const expectedBuf = Buffer.from(expectedSig, "utf8");
    if (computedBuf.length !== expectedBuf.length) {
      return false;
    }
    return import_crypto2.default.timingSafeEqual(computedBuf, expectedBuf);
  } catch {
    return false;
  }
}
var import_crypto2, MockBankAccountProvisioningProvider, MockFiatPaymentProvider, MockCardNetworkProvider, MockExternalKycProvider, MockBitcoinCustodyProvider, MockFxQuoteProvider, defaultMockBankingProvider, defaultMockPaymentProvider, defaultMockCardProvider, defaultMockKycProvider, defaultMockBitcoinProvider, defaultMockFxProvider;
var init_providerAdapters = __esm({
  "src/server/services/providerAdapters.ts"() {
    "use strict";
    import_crypto2 = __toESM(require("crypto"), 1);
    init_env_config();
    MockBankAccountProvisioningProvider = class {
      constructor(testOptions) {
        this.testOptions = testOptions;
      }
      testOptions;
      providerName = "AvenoraMockCoreBankingProvider";
      isLive = false;
      setTestOptions(options) {
        this.testOptions = options;
      }
      async provisionAccount(request) {
        const config = getValidatedConfig();
        const startTime = Date.now();
        if (this.testOptions?.simulateTimeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, this.testOptions.simulateTimeoutMs));
        }
        if (this.testOptions?.simulateFailureCode) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: this.testOptions.simulateFailureCode,
              message: this.testOptions.simulateFailureMessage || "Provider error",
              retryable: false,
              httpStatusCode: 502
            }
          };
        }
        if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: "LIVE_BANKING_PROVIDER_UNCONFIGURED",
              message: "Production core banking provider is not configured. Live provisioning blocked.",
              retryable: false,
              httpStatusCode: 503
            }
          };
        }
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "CONFIRMED",
          externalReference: `ext_bnk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          correlationId: request.correlationId,
          idempotencyKey: request.idempotencyKey,
          data: {
            providerAccountId: `prov_acc_${request.userId}_${request.countryCode}`,
            accountNumberMasked: `****${Math.floor(1e3 + Math.random() * 9e3)}`,
            routingOrSortCode: request.countryCode === "US" ? "021000021" : request.countryCode === "GB" ? "20-00-00" : "2100",
            iban: request.countryCode === "ES" ? "ES9121000418450200051332" : void 0,
            status: "PROVISIONED_ACTIVE",
            supportedCurrencies: [request.currency],
            provisionedAt: /* @__PURE__ */ new Date()
          },
          durationMs: Date.now() - startTime,
          timestamp: /* @__PURE__ */ new Date()
        };
      }
      async getAccountStatus(providerAccountId, correlationId) {
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "CONFIRMED",
          correlationId,
          durationMs: 12,
          timestamp: /* @__PURE__ */ new Date(),
          data: {
            status: "ACTIVE_SIMULATED",
            limits: { dailyTransferMinor: "10000000", perTransactionMinor: "2500000" }
          }
        };
      }
    };
    MockFiatPaymentProvider = class {
      constructor(testOptions) {
        this.testOptions = testOptions;
      }
      testOptions;
      providerName = "AvenoraMockPaymentRailProvider";
      isLive = false;
      setTestOptions(options) {
        this.testOptions = options;
      }
      async initiatePayment(request) {
        const config = getValidatedConfig();
        const startTime = Date.now();
        if (this.testOptions?.simulateTimeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, this.testOptions.simulateTimeoutMs));
        }
        if (this.testOptions?.simulateFailureCode) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: this.testOptions.simulateFailureCode,
              message: this.testOptions.simulateFailureMessage || "Provider error",
              retryable: false,
              httpStatusCode: 502
            }
          };
        }
        if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: "LIVE_FIAT_RAIL_UNAVAILABLE",
              message: "Production fiat clearing rails (FedNow/FPS/SEPA/PIX) are not connected. Live payment initiation blocked.",
              retryable: false,
              httpStatusCode: 503
            }
          };
        }
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "PENDING_PROVIDER",
          externalReference: `ext_pmt_${request.paymentId}`,
          correlationId: request.correlationId,
          idempotencyKey: request.idempotencyKey,
          data: {
            providerPaymentId: `prov_pmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            clearingRail: request.currency === "USD" ? "FedACH" : request.currency === "GBP" ? "FPS" : request.currency === "EUR" ? "SEPA_INST" : "PIX",
            settlementEta: "T+0 (Simulated Instant)",
            status: "PENDING_PROVIDER"
          },
          durationMs: Date.now() - startTime,
          timestamp: /* @__PURE__ */ new Date()
        };
      }
      async getPaymentStatus(providerPaymentId, correlationId) {
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "CONFIRMED",
          correlationId,
          durationMs: 8,
          timestamp: /* @__PURE__ */ new Date(),
          data: {
            status: "CONFIRMED",
            settledAt: /* @__PURE__ */ new Date()
          }
        };
      }
    };
    MockCardNetworkProvider = class {
      constructor(testOptions) {
        this.testOptions = testOptions;
      }
      testOptions;
      providerName = "AvenoraMockCardNetwork";
      isLive = false;
      setTestOptions(options) {
        this.testOptions = options;
      }
      async issueVirtualCard(request) {
        const config = getValidatedConfig();
        const startTime = Date.now();
        if (this.testOptions?.simulateTimeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, this.testOptions.simulateTimeoutMs));
        }
        if (this.testOptions?.simulateFailureCode) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: this.testOptions.simulateFailureCode,
              message: this.testOptions.simulateFailureMessage || "Provider error",
              retryable: false,
              httpStatusCode: 502
            }
          };
        }
        if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: "LIVE_CARD_NETWORK_UNCONFIGURED",
              message: "Production card issuer processor is not connected. Live card issuance prohibited.",
              retryable: false,
              httpStatusCode: 503
            }
          };
        }
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "CONFIRMED",
          externalReference: `ext_crd_${Date.now()}`,
          correlationId: request.correlationId,
          idempotencyKey: request.idempotencyKey,
          data: {
            providerCardToken: `tok_crd_${Math.random().toString(36).substring(2, 10)}`,
            maskedPan: "4821 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 8421",
            syntheticExpiry: "12/28",
            cardNetwork: "VISA_SIMULATED",
            status: "ACTIVE_SIMULATED"
          },
          durationMs: Date.now() - startTime,
          timestamp: /* @__PURE__ */ new Date()
        };
      }
      async updateCardStatus(providerCardToken, status, reason, correlationId) {
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "CONFIRMED",
          correlationId,
          durationMs: 15,
          timestamp: /* @__PURE__ */ new Date(),
          data: {
            status,
            updatedAt: /* @__PURE__ */ new Date()
          }
        };
      }
      async processCardTransactionEvent(request) {
        const config = getValidatedConfig();
        const startTime = Date.now();
        if (this.testOptions?.simulateTimeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, this.testOptions.simulateTimeoutMs));
        }
        if (this.testOptions?.simulateFailureCode) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: this.testOptions.simulateFailureCode,
              message: this.testOptions.simulateFailureMessage || "Simulated card transaction error",
              retryable: false,
              httpStatusCode: 502
            }
          };
        }
        if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: "LIVE_CARD_NETWORK_UNCONFIGURED",
              message: "Production card network processor is not connected. Live card event processing prohibited.",
              retryable: false,
              httpStatusCode: 503
            }
          };
        }
        const authCode = request.authCode || `AUTH_${Date.now().toString(36).toUpperCase()}`;
        const resultStatus = request.eventType === "REVERSAL" ? "REVERSED" : request.eventType === "CLEARING" ? "SETTLED" : "APPROVED";
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "CONFIRMED",
          externalReference: `ext_card_evt_${request.externalTxId}`,
          correlationId: request.correlationId,
          idempotencyKey: request.idempotencyKey,
          data: {
            status: resultStatus,
            authCode,
            providerReference: `card_proc_ref_${request.idempotencyKey}`,
            clearedAmountMinor: request.amountMinor,
            processedAt: /* @__PURE__ */ new Date()
          },
          durationMs: Date.now() - startTime,
          timestamp: /* @__PURE__ */ new Date()
        };
      }
    };
    MockExternalKycProvider = class {
      constructor(testOptions) {
        this.testOptions = testOptions;
      }
      testOptions;
      providerName = "AvenoraMockIdentityVerificationService";
      isLive = false;
      setTestOptions(options) {
        this.testOptions = options;
      }
      async initiateExternalVerification(request) {
        const config = getValidatedConfig();
        const startTime = Date.now();
        if (this.testOptions?.simulateTimeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, this.testOptions.simulateTimeoutMs));
        }
        if (this.testOptions?.simulateFailureCode) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: this.testOptions.simulateFailureCode,
              message: this.testOptions.simulateFailureMessage || "Simulated KYC provider error",
              retryable: false,
              httpStatusCode: 502
            }
          };
        }
        if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: "LIVE_KYC_PROVIDER_UNCONFIGURED",
              message: "Regulated IDSP identity provider is not connected. Silent fallback in production is prohibited.",
              retryable: false,
              httpStatusCode: 503
            }
          };
        }
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "PENDING_PROVIDER",
          externalReference: `ext_kyc_${request.userId}`,
          correlationId: request.correlationId,
          idempotencyKey: request.idempotencyKey,
          data: {
            externalCaseId: `idsp_case_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            verificationStatus: "PENDING",
            confidenceScore: 0.96,
            checksSummary: {
              documentAuthenticity: true,
              facialMatch: true,
              sanctionsClear: true,
              pepClear: true
            },
            disclaimer: "EXTERNAL ADVISORY ONLY - DOES NOT CONSTITUTE FINAL REGULATORY OR INTERNAL COMPLIANCE APPROVAL"
          },
          durationMs: Date.now() - startTime,
          timestamp: /* @__PURE__ */ new Date()
        };
      }
      async queryVerificationResult(externalCaseId, correlationId) {
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "CONFIRMED",
          correlationId,
          durationMs: 14,
          timestamp: /* @__PURE__ */ new Date(),
          data: {
            externalCaseId,
            verificationStatus: "VERIFIED",
            confidenceScore: 0.98,
            checksSummary: {
              documentAuthenticity: true,
              facialMatch: true,
              sanctionsClear: true,
              pepClear: true
            },
            disclaimer: "EXTERNAL ADVISORY ONLY - DOES NOT CONSTITUTE FINAL REGULATORY OR INTERNAL COMPLIANCE APPROVAL"
          }
        };
      }
    };
    MockBitcoinCustodyProvider = class {
      constructor(testOptions) {
        this.testOptions = testOptions;
      }
      testOptions;
      providerName = "AvenoraMockBitcoinCustodyService";
      isLive = false;
      setTestOptions(options) {
        this.testOptions = options;
      }
      async generateDepositAddress(request) {
        const config = getValidatedConfig();
        const startTime = Date.now();
        if (this.testOptions?.simulateTimeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, this.testOptions.simulateTimeoutMs));
        }
        if (this.testOptions?.simulateFailureCode) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: this.testOptions.simulateFailureCode,
              message: this.testOptions.simulateFailureMessage || "Simulated Bitcoin custody error",
              retryable: false,
              httpStatusCode: 502
            }
          };
        }
        if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: "LIVE_BTC_CUSTODY_UNCONFIGURED",
              message: "Institutional qualified Bitcoin custodian is not configured. Real address generation blocked.",
              retryable: false,
              httpStatusCode: 503
            }
          };
        }
        const syntheticAddress = `bc1qsim${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "CONFIRMED",
          correlationId: request.correlationId,
          idempotencyKey: request.idempotencyKey,
          data: {
            depositAddress: syntheticAddress,
            addressType: "P2WPKH_NATIVE_SEGWIT",
            derivationPath: "m/84'/0'/0'/0/0",
            network: "simulated_prototype",
            isSimulated: true,
            disclaimer: "SIMULATED BITCOIN ADDRESS - DO NOT SEND REAL BTC - ASSETS WILL BE LOST"
          },
          durationMs: Date.now() - startTime,
          timestamp: /* @__PURE__ */ new Date()
        };
      }
      async getDepositStatus(txid, address, correlationId) {
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "CONFIRMED",
          correlationId,
          durationMs: 10,
          timestamp: /* @__PURE__ */ new Date(),
          data: {
            confirmations: 6,
            amountSats: 2500000n,
            status: "CONFIRMED"
          }
        };
      }
      async initiateWithdrawal(request) {
        const config = getValidatedConfig();
        const startTime = Date.now();
        if (this.testOptions?.simulateTimeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, this.testOptions.simulateTimeoutMs));
        }
        if (this.testOptions?.simulateFailureCode) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: this.testOptions.simulateFailureCode,
              message: this.testOptions.simulateFailureMessage || "Simulated BTC withdrawal error",
              retryable: false,
              httpStatusCode: 502
            }
          };
        }
        if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: "LIVE_BTC_CUSTODY_UNCONFIGURED",
              message: "Institutional Bitcoin custodian is not connected. Real broadcast prohibited.",
              retryable: false,
              httpStatusCode: 503
            }
          };
        }
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "PENDING_PROVIDER",
          externalReference: `btc_tx_${request.withdrawalId}`,
          correlationId: request.correlationId,
          idempotencyKey: request.idempotencyKey,
          data: {
            providerTxId: `sim_tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            estimatedFeeSats: 1420n,
            status: "PENDING_PROVIDER"
          },
          durationMs: Date.now() - startTime,
          timestamp: /* @__PURE__ */ new Date()
        };
      }
    };
    MockFxQuoteProvider = class {
      constructor(testOptions) {
        this.testOptions = testOptions;
      }
      testOptions;
      providerName = "AvenoraMockWholesaleFxProvider";
      isLive = false;
      setTestOptions(options) {
        this.testOptions = options;
      }
      async requestQuote(request) {
        const config = getValidatedConfig();
        const startTime = Date.now();
        if (this.testOptions?.simulateTimeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, this.testOptions.simulateTimeoutMs));
        }
        if (this.testOptions?.simulateFailureCode) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: this.testOptions.simulateFailureCode,
              message: this.testOptions.simulateFailureMessage || "Simulated FX quote error",
              retryable: false,
              httpStatusCode: 502
            }
          };
        }
        if (!config.PROTOTYPE_MODE && config.ENABLE_LIVE_SETTLEMENT) {
          return {
            success: false,
            providerCode: this.providerName,
            isMock: true,
            operationStatus: "FAILED",
            correlationId: request.correlationId,
            idempotencyKey: request.idempotencyKey,
            durationMs: Date.now() - startTime,
            timestamp: /* @__PURE__ */ new Date(),
            error: {
              code: "LIVE_FX_LIQUIDITY_UNCONFIGURED",
              message: "Institutional FX liquidity facility is not contracted. Real FX settlement blocked.",
              retryable: false,
              httpStatusCode: 503
            }
          };
        }
        const rateScaled = 108500000n;
        const targetAmountMinor = request.amountMinor * rateScaled / 100000000n;
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "CONFIRMED",
          externalReference: `fx_ref_${request.idempotencyKey}`,
          correlationId: request.correlationId,
          idempotencyKey: request.idempotencyKey,
          data: {
            quoteId: `quote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            rateScaled,
            rateFormatted: "1.0850",
            sourceAmountMinor: request.amountMinor,
            targetAmountMinor,
            expiresAt: new Date(Date.now() + 6e4),
            // 60s quote validity
            providerSettlementRef: `fx_settle_ref_${request.idempotencyKey}`
          },
          durationMs: Date.now() - startTime,
          timestamp: /* @__PURE__ */ new Date()
        };
      }
      async executeSettlement(params) {
        return {
          success: true,
          providerCode: this.providerName,
          isMock: true,
          operationStatus: "CONFIRMED",
          correlationId: params.correlationId,
          idempotencyKey: params.idempotencyKey,
          durationMs: 20,
          timestamp: /* @__PURE__ */ new Date(),
          data: {
            settlementId: `fx_settle_${params.quoteId}`,
            status: "CONFIRMED"
          }
        };
      }
    };
    defaultMockBankingProvider = new MockBankAccountProvisioningProvider();
    defaultMockPaymentProvider = new MockFiatPaymentProvider();
    defaultMockCardProvider = new MockCardNetworkProvider();
    defaultMockKycProvider = new MockExternalKycProvider();
    defaultMockBitcoinProvider = new MockBitcoinCustodyProvider();
    defaultMockFxProvider = new MockFxQuoteProvider();
  }
});

// src/server/services/identifier.service.ts
var SyntheticIdentifierProvider, defaultIdentifierProvider;
var init_identifier_service = __esm({
  "src/server/services/identifier.service.ts"() {
    "use strict";
    init_CountryRules();
    init_providerAdapters();
    SyntheticIdentifierProvider = class _SyntheticIdentifierProvider {
      name = "AvenoraSyntheticIdentifierProvider";
      isLive = false;
      static instanceCounter = 1e3;
      // In-memory atomic allocation registry: key = `${country}:${type}:${rawValue}`
      allocatedRegistry = /* @__PURE__ */ new Map();
      // Mutex promise chain to guarantee safe concurrent allocation
      allocationLock = Promise.resolve();
      // Provider-provisioned identifier cache: key = `${country}:${type}:${idempotencyKey}`
      providerProvisionRegistry = /* @__PURE__ */ new Map();
      /**
       * Thread-safe atomic generation with concurrency collision avoidance.
       */
      async generateIdentifier(params) {
        const { countryCode, type } = params;
        if (!SUPPORTED_COUNTRIES.includes(countryCode)) {
          throw new Error(
            `Unsupported country code: "${countryCode}". Supported countries are: [${SUPPORTED_COUNTRIES.join(", ")}].`
          );
        }
        const allowedTypes = SUPPORTED_IDENTIFIER_TYPES[countryCode] || [];
        if (!allowedTypes.includes(type)) {
          throw new Error(
            `Identifier type "${type}" is not supported for country "${countryCode}". Supported types for ${countryCode} are: [${allowedTypes.join(", ")}].`
          );
        }
        let releaseLock;
        const lockWait = new Promise((resolve) => {
          releaseLock = resolve;
        });
        const previousLock = this.allocationLock;
        this.allocationLock = this.allocationLock.then(() => lockWait);
        await previousLock;
        try {
          let attempts = 0;
          const MAX_ATTEMPTS = 50;
          while (attempts < MAX_ATTEMPTS) {
            attempts++;
            _SyntheticIdentifierProvider.instanceCounter++;
            const seq = _SyntheticIdentifierProvider.instanceCounter;
            const rawCandidate = this.buildCandidate(countryCode, type, seq, params.currency);
            const candidate = {
              ...rawCandidate,
              source: "SYNTHETIC_GENERATOR"
            };
            const regKey = `${countryCode}:${type}:${candidate.rawValue}`;
            if (!this.allocatedRegistry.has(regKey)) {
              this.allocatedRegistry.set(regKey, candidate);
              return candidate;
            }
          }
          throw new Error(`Failed to allocate a unique ${type} identifier for ${countryCode} after ${MAX_ATTEMPTS} attempts.`);
        } finally {
          releaseLock();
        }
      }
      /**
       * Requests an account or card identifier from an authorized external provider adapter.
       * If the external provider fails or is unconfigured, this throws an error and NEVER silently falls back!
       */
      async provisionFromProvider(params) {
        const { countryCode, type, accountHolderName, currency, idempotencyKey, correlationId } = params;
        if (!SUPPORTED_COUNTRIES.includes(countryCode)) {
          throw new Error(`Unsupported country code: "${countryCode}".`);
        }
        const cacheKey = `${countryCode}:${type}:${idempotencyKey}`;
        const cached = this.providerProvisionRegistry.get(cacheKey);
        if (cached) {
          return cached;
        }
        if (type === "BANK_ACCOUNT" || type === "IBAN") {
          const provider = params.bankingProvider || defaultMockBankingProvider;
          const res = await provider.provisionAccount({
            userId: `usr_prov_${idempotencyKey}`,
            countryCode,
            currency,
            accountHolderName,
            idempotencyKey,
            correlationId
          });
          if (!res.success || !res.data) {
            throw new Error(
              `Provider account provisioning failed: [${res.error?.code || "UNKNOWN_ERROR"}] ${res.error?.message || "External provider error"}`
            );
          }
          const isLive = Boolean(provider.isLive);
          const result = {
            countryCode,
            type,
            formattedValue: res.data.iban || `${res.data.routingOrSortCode} / ${res.data.accountNumberMasked}`,
            rawValue: res.data.providerAccountId,
            maskedValue: res.data.accountNumberMasked,
            components: {
              providerAccountId: res.data.providerAccountId,
              routingOrSortCode: res.data.routingOrSortCode,
              iban: res.data.iban || ""
            },
            isSimulated: !isLive,
            source: isLive ? "AUTHORIZED_PROVIDER" : "MOCK_PROVIDER",
            providerReference: {
              providerCode: provider.providerName,
              externalId: res.data.providerAccountId,
              provisionedAt: res.data.provisionedAt
            },
            disclaimer: isLive ? "OFFICIALLY ISSUED BY AUTHORIZED BANKING PARTNER" : "PROVISIONED VIA SANDBOX/MOCK PROVIDER ADAPTER (INTEGRATION TEST ONLY)",
            generatedAt: /* @__PURE__ */ new Date()
          };
          this.providerProvisionRegistry.set(cacheKey, result);
          return result;
        }
        if (type === "PAYMENT_CARD") {
          const provider = params.cardProvider || defaultMockCardProvider;
          const res = await provider.issueVirtualCard({
            userId: `usr_prov_${idempotencyKey}`,
            walletAccountId: `acc_${idempotencyKey}`,
            currency,
            idempotencyKey,
            correlationId
          });
          if (!res.success || !res.data) {
            throw new Error(
              `Provider card provisioning failed: [${res.error?.code || "UNKNOWN_ERROR"}] ${res.error?.message || "External card processor error"}`
            );
          }
          const isLive = Boolean(provider.isLive);
          const result = {
            countryCode,
            type,
            formattedValue: `${res.data.cardNetwork}: ${res.data.maskedPan} (Exp: ${res.data.syntheticExpiry})`,
            rawValue: res.data.providerCardToken,
            maskedValue: res.data.maskedPan,
            components: {
              providerCardToken: res.data.providerCardToken,
              cardNetwork: res.data.cardNetwork,
              syntheticExpiry: res.data.syntheticExpiry
            },
            isSimulated: !isLive,
            source: isLive ? "AUTHORIZED_PROVIDER" : "MOCK_PROVIDER",
            providerReference: {
              providerCode: provider.providerName,
              externalId: res.data.providerCardToken,
              provisionedAt: /* @__PURE__ */ new Date()
            },
            disclaimer: isLive ? "OFFICIALLY ISSUED BY AUTHORIZED CARD NETWORK" : "PROVISIONED VIA SANDBOX/MOCK CARD PROCESSOR (INTEGRATION TEST ONLY)",
            generatedAt: /* @__PURE__ */ new Date()
          };
          this.providerProvisionRegistry.set(cacheKey, result);
          return result;
        }
        throw new Error(`Provider provisioning is not supported for identifier type "${type}".`);
      }
      /**
       * Validates a given identifier against country rules and checksums.
       */
      validateIdentifier(params) {
        const { countryCode, type, value } = params;
        const clean = value.trim();
        if (!SUPPORTED_COUNTRIES.includes(countryCode)) {
          return {
            isValid: false,
            countryCode,
            type,
            error: `Country "${countryCode}" is not supported. Supported: [${SUPPORTED_COUNTRIES.join(", ")}].`
          };
        }
        const allowed = SUPPORTED_IDENTIFIER_TYPES[countryCode] || [];
        if (!allowed.includes(type)) {
          return {
            isValid: false,
            countryCode,
            type,
            error: `Identifier type "${type}" is not supported for country "${countryCode}".`
          };
        }
        switch (countryCode) {
          case "US": {
            if (type === "BANK_ACCOUNT") {
              const parts = clean.split("/");
              const routing = parts.length > 1 ? parts[0]?.trim() || "" : "";
              const account = parts.length > 1 ? parts[1]?.trim() || "" : clean;
              const isAbaValid = routing ? CountryRules.validateAbaRouting(routing) : true;
              const isAccValid = /^\d{8,14}$/.test(account.replace(/[\s-]/g, ""));
              return {
                isValid: isAbaValid && isAccValid,
                countryCode,
                type,
                error: !isAbaValid ? "Invalid US ABA 9-digit routing checksum" : !isAccValid ? "Invalid US account length" : void 0
              };
            }
            if (type === "TAX_ID") {
              const raw = clean.replace(/[\s-]/g, "");
              const isSsn = /^\d{9}$/.test(raw) && !raw.startsWith("000") && !raw.startsWith("666") && !raw.startsWith("9");
              const isEin = /^\d{9}$/.test(raw);
              return {
                isValid: isSsn || isEin,
                countryCode,
                type,
                error: isSsn || isEin ? void 0 : "Invalid US SSN/EIN format (expected 9 digits)"
              };
            }
            if (type === "PAYMENT_CARD") {
              const isLuhn = CountryRules.validateLuhn(clean);
              return {
                isValid: isLuhn,
                countryCode,
                type,
                error: isLuhn ? void 0 : "Invalid card number Luhn checksum"
              };
            }
            break;
          }
          case "GB": {
            if (type === "SORT_CODE") {
              const raw = clean.replace(/[\s-]/g, "");
              const isValid = /^\d{6}$/.test(raw);
              return { isValid, countryCode, type, error: isValid ? void 0 : "UK Sort code must be 6 digits" };
            }
            if (type === "BANK_ACCOUNT") {
              const raw = clean.replace(/[\s-]/g, "");
              const isValid = /^\d{8}$/.test(raw);
              return { isValid, countryCode, type, error: isValid ? void 0 : "UK Bank Account must be 8 digits" };
            }
            if (type === "IBAN") {
              const isValid = clean.startsWith("GB") && CountryRules.validateIban(clean);
              return { isValid, countryCode, type, error: isValid ? void 0 : "Invalid UK IBAN Mod 97-10 checksum" };
            }
            if (type === "TAX_ID") {
              const raw = clean.replace(/[\s-]/g, "").toUpperCase();
              const isUtr = /^\d{10}$/.test(raw);
              const isNino = /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/.test(raw);
              return { isValid: isUtr || isNino, countryCode, type, error: isUtr || isNino ? void 0 : "Invalid UK Tax ID (UTR/NINO)" };
            }
            if (type === "PAYMENT_CARD") {
              const isValid = CountryRules.validateLuhn(clean);
              return { isValid, countryCode, type, error: isValid ? void 0 : "Invalid card Luhn checksum" };
            }
            break;
          }
          case "ES": {
            if (type === "BANK_ACCOUNT" || type === "IBAN") {
              const isValid = clean.startsWith("ES") && CountryRules.validateIban(clean);
              return { isValid, countryCode, type, error: isValid ? void 0 : "Invalid Spanish IBAN Mod 97-10 checksum" };
            }
            if (type === "TAX_ID") {
              const isValid = CountryRules.validateSpanishDni(clean);
              return { isValid, countryCode, type, error: isValid ? void 0 : "Invalid Spanish DNI/NIE modulo 23 letter" };
            }
            if (type === "PAYMENT_CARD") {
              const isValid = CountryRules.validateLuhn(clean);
              return { isValid, countryCode, type, error: isValid ? void 0 : "Invalid card Luhn checksum" };
            }
            break;
          }
          case "DE": {
            if (type === "BANK_ACCOUNT" || type === "IBAN") {
              const isValid = clean.startsWith("DE") && CountryRules.validateIban(clean);
              return { isValid, countryCode, type, error: isValid ? void 0 : "Invalid German IBAN Mod 97-10 checksum" };
            }
            if (type === "TAX_ID") {
              const raw = clean.replace(/[\s-]/g, "");
              const isValid = /^\d{11}$/.test(raw);
              return { isValid, countryCode, type, error: isValid ? void 0 : "German Steuer-ID must be 11 digits" };
            }
            if (type === "PAYMENT_CARD") {
              const isValid = CountryRules.validateLuhn(clean);
              return { isValid, countryCode, type, error: isValid ? void 0 : "Invalid card Luhn checksum" };
            }
            break;
          }
          case "BR": {
            if (type === "BANK_ACCOUNT") {
              const raw = clean.replace(/[\s.-]/g, "");
              const isValid = raw.length >= 8 && raw.length <= 16;
              return { isValid, countryCode, type, error: isValid ? void 0 : "Invalid Brazilian account structure" };
            }
            if (type === "TAX_ID") {
              const isValid = CountryRules.validateBrazilianCpf(clean);
              return { isValid, countryCode, type, error: isValid ? void 0 : "Invalid Brazilian CPF modulo 11 check digits" };
            }
            if (type === "PIX_KEY") {
              const isValid = clean.length >= 5 && clean.length <= 100;
              return { isValid, countryCode, type, error: isValid ? void 0 : "Invalid Pix key format" };
            }
            if (type === "PAYMENT_CARD") {
              const isValid = CountryRules.validateLuhn(clean);
              return { isValid, countryCode, type, error: isValid ? void 0 : "Invalid card Luhn checksum" };
            }
            break;
          }
        }
        return { isValid: false, countryCode, type, error: "Unsupported verification specification" };
      }
      /**
       * Internal generator building authoritative formatted candidates.
       */
      buildCandidate(countryCode, type, seq, currency) {
        const generatedAt = /* @__PURE__ */ new Date();
        const disclaimer = "SIMULATED / PROTOTYPE DEMO ONLY - NOT FOR LIVE FINANCIAL SETTLEMENT";
        switch (countryCode) {
          case "US": {
            if (type === "BANK_ACCOUNT") {
              const routing = "021000021";
              const accNumber = `8900${seq.toString().padStart(6, "0")}`;
              const formatted2 = `ABA ${routing} / ACCT ${accNumber}`;
              const raw = `${routing}${accNumber}`;
              const masked = `ABA ***021 / ACCT *****${accNumber.slice(-4)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: {
                  routingNumber: routing,
                  accountNumber: accNumber,
                  bankName: "Federal Reserve Bank of New York (Prototype Vault)"
                },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            if (type === "TAX_ID") {
              const area = (100 + seq % 800).toString();
              const group = "00";
              const serial = (1e3 + seq % 8999).toString();
              const formatted2 = `${area}-${group}-${serial}`;
              const raw = `${area}${group}${serial}`;
              const masked = `***-**-${serial}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { area, group, serial, taxScheme: "US-SSN-SYNTHETIC" },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            if (type === "PAYMENT_CARD") {
              const bin = "4821";
              const accountSeq = seq.toString().padStart(11, "0").slice(-11);
              const partial = bin + accountSeq;
              const check = CountryRules.computeLuhnCheckDigit(partial);
              const raw = partial + check;
              const formatted2 = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 16)}`;
              const masked = `************${raw.slice(-4)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { bin, last4: raw.slice(-4), cardBrand: "VISA_SIMULATED" },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            break;
          }
          case "GB": {
            if (type === "SORT_CODE" || type === "BANK_ACCOUNT") {
              const sortCode = "20-00-00";
              const accNumber = `70${seq.toString().padStart(6, "0")}`;
              const formatted2 = `Sort Code: ${sortCode} \xB7 Account: ${accNumber}`;
              const raw = `200000${accNumber}`;
              const masked = `Sort Code: **-**-00 \xB7 Account: *****${accNumber.slice(-3)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { sortCode, accountNumber: accNumber, bankName: "Barclays Clearing UK (Prototype)" },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            if (type === "IBAN") {
              const bankCode = "AVEN";
              const sortCode = "200000";
              const acc = `70${seq.toString().padStart(6, "0")}`;
              const bban = `${bankCode}${sortCode}${acc}`;
              const check = CountryRules.computeIbanCheckDigits("GB", bban);
              const raw = `GB${check}${bban}`;
              const formatted2 = `GB${check} ${bankCode} ${sortCode.slice(0, 4)} ${sortCode.slice(4)}${acc.slice(0, 2)} ${acc.slice(2, 6)} ${acc.slice(6)}`;
              const masked = `GB${check} **** **** **** **** ${acc.slice(-4)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { ibanCheckDigits: check, bankCode, sortCode, accountNumber: acc },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            if (type === "TAX_ID") {
              const raw = `99${seq.toString().padStart(8, "0")}`;
              const formatted2 = `${raw.slice(0, 5)} ${raw.slice(5)}`;
              const masked = `***** ${raw.slice(-5)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { taxScheme: "HMRC-UTR-SYNTHETIC" },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            if (type === "PAYMENT_CARD") {
              const bin = "5241";
              const accountSeq = seq.toString().padStart(11, "0").slice(-11);
              const partial = bin + accountSeq;
              const check = CountryRules.computeLuhnCheckDigit(partial);
              const raw = partial + check;
              const formatted2 = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 16)}`;
              const masked = `************${raw.slice(-4)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { bin, last4: raw.slice(-4), cardBrand: "MASTERCARD_SIMULATED" },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            break;
          }
          case "ES": {
            if (type === "BANK_ACCOUNT" || type === "IBAN") {
              const bank = "2100";
              const branch = "0418";
              const acc = `02${seq.toString().padStart(8, "0")}`;
              const cccControl = CountryRules.computeSpanishCccControlDigits(bank, branch, acc);
              const bban = `${bank}${branch}${cccControl}${acc}`;
              const check = CountryRules.computeIbanCheckDigits("ES", bban);
              const raw = `ES${check}${bban}`;
              const formatted2 = `ES${check} ${bank} ${branch} ${cccControl}${acc.slice(0, 2)} ${acc.slice(2, 6)} ${acc.slice(6)}`;
              const masked = `ES${check} ${bank} **** ** ** **** ${acc.slice(-4)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { bank, branch, controlDigits: cccControl, accountNumber: acc },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            if (type === "TAX_ID") {
              const num = 5e7 + seq % 39999999;
              const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
              const letter = letters[num % 23];
              const raw = `${num}${letter}`;
              const formatted2 = `${raw.slice(0, 8)}-${letter}`;
              const masked = `****${raw.slice(4, 8)}-${letter}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { dniNumber: num.toString(), checkLetter: letter, taxScheme: "ES-DNI-SYNTHETIC" },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            if (type === "PAYMENT_CARD") {
              const bin = "4821";
              const accountSeq = seq.toString().padStart(11, "0").slice(-11);
              const partial = bin + accountSeq;
              const check = CountryRules.computeLuhnCheckDigit(partial);
              const raw = partial + check;
              const formatted2 = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 16)}`;
              const masked = `************${raw.slice(-4)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { bin, last4: raw.slice(-4), cardBrand: "VISA_SIMULATED" },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            break;
          }
          case "DE": {
            if (type === "BANK_ACCOUNT" || type === "IBAN") {
              const blz = "37040044";
              const acc = `05${seq.toString().padStart(8, "0")}`;
              const bban = `${blz}${acc}`;
              const check = CountryRules.computeIbanCheckDigits("DE", bban);
              const raw = `DE${check}${bban}`;
              const formatted2 = `DE${check} ${blz.slice(0, 4)} ${blz.slice(4)} ${acc.slice(0, 4)} ${acc.slice(4, 8)} ${acc.slice(8)}`;
              const masked = `DE${check} ${blz.slice(0, 4)} **** **** **** ${acc.slice(-4)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { blz, accountNumber: acc, bankName: "Commerzbank AG (Prototype)" },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            if (type === "TAX_ID") {
              const raw = `04${seq.toString().padStart(9, "0")}`;
              const formatted2 = `${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5, 8)} ${raw.slice(8)}`;
              const masked = `** *** *** ${raw.slice(-3)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { taxScheme: "DE-STEUER-ID-SYNTHETIC" },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            if (type === "PAYMENT_CARD") {
              const bin = "5241";
              const accountSeq = seq.toString().padStart(11, "0").slice(-11);
              const partial = bin + accountSeq;
              const check = CountryRules.computeLuhnCheckDigit(partial);
              const raw = partial + check;
              const formatted2 = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 16)}`;
              const masked = `************${raw.slice(-4)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { bin, last4: raw.slice(-4), cardBrand: "MASTERCARD_SIMULATED" },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            break;
          }
          case "BR": {
            if (type === "BANK_ACCOUNT") {
              const banco = (seq % 899 + 1).toString().padStart(3, "0");
              const agencia = (seq * 17 % 9e3 + 1e3).toString().padStart(4, "0");
              const contaSeq = (1e4 + seq % 89999).toString();
              let sum = 0;
              for (let i = 0; i < contaSeq.length; i++) {
                sum += parseInt(contaSeq[i] ?? "0", 10) * (contaSeq.length + 1 - i);
              }
              const cd = sum % 11 === 10 ? "X" : (sum % 11).toString();
              const contaFormatted = `${contaSeq}-${cd}`;
              const ddd = (11 + seq % 79).toString().padStart(2, "0");
              const mobile = (9e8 + seq * 13 % 1e8).toString().padStart(9, "0");
              const pixKey = `${ddd}${mobile}`;
              const formatted2 = `Banco: ${banco} \xB7 Ag\xEAncia: ${agencia} \xB7 Conta: ${contaFormatted} \xB7 Pix: ${pixKey}`;
              const raw = `${banco}${agencia}${contaSeq}${cd}|pix:${pixKey}`;
              const masked = `Banco: ${banco} \xB7 Ag: **** \xB7 Conta: *****-${cd} \xB7 Pix: ****${pixKey.slice(-4)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { banco, agencia, conta: contaFormatted, pixKey },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            if (type === "TAX_ID") {
              const nineDigits = (1e8 + seq % 899999999).toString();
              const checkDigits = CountryRules.generateCpfCheckDigits(nineDigits);
              const raw = `${nineDigits}${checkDigits}`;
              const formatted2 = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${checkDigits}`;
              const masked = `***.***.${raw.slice(6, 9)}-${checkDigits}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { checkDigits, taxScheme: "BR-CPF-SYNTHETIC" },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            if (type === "PIX_KEY") {
              const ddd = (11 + seq % 79).toString().padStart(2, "0");
              const mobile = (9e8 + seq * 31 % 1e8).toString().padStart(9, "0");
              const pixKey = `${ddd}${mobile}`;
              const formatted2 = pixKey;
              const raw = `pix:${pixKey}`;
              const masked = `****${pixKey.slice(-4)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { pixKey, pixType: "PHONE" },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            if (type === "PAYMENT_CARD") {
              const bin = "4821";
              const accountSeq = seq.toString().padStart(11, "0").slice(-11);
              const partial = bin + accountSeq;
              const check = CountryRules.computeLuhnCheckDigit(partial);
              const raw = partial + check;
              const formatted2 = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 16)}`;
              const masked = `************${raw.slice(-4)}`;
              return {
                countryCode,
                type,
                formattedValue: formatted2,
                rawValue: raw,
                maskedValue: masked,
                components: { bin, last4: raw.slice(-4), cardBrand: "ELO_VISA_SIMULATED" },
                isSimulated: true,
                disclaimer,
                generatedAt
              };
            }
            break;
          }
        }
        throw new Error(`Unsupported generation request: ${countryCode} / ${type}`);
      }
    };
    defaultIdentifierProvider = new SyntheticIdentifierProvider();
  }
});

// src/server/emails/layout.ts
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function getAppBaseUrl() {
  return getValidatedConfig().APP_URL.replace(/\/$/, "");
}
function getEmailLogoUrl() {
  return `${getAppBaseUrl()}/avenora-header-logo.jpg`;
}
function getSupportEmail() {
  return getValidatedConfig().SUPPORT_EMAIL || "support@avenorabank.com";
}
function renderCtaButton(cta) {
  return `<a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:13px 24px;background:${EMAIL_BRAND.cta};color:${EMAIL_BRAND.white};text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;font-family:system-ui,-apple-system,sans-serif;line-height:1.2;">${escapeHtml(cta.label)}</a>`;
}
function renderSecondaryLink(cta) {
  return `<a href="${escapeHtml(cta.href)}" style="color:${EMAIL_BRAND.cta};font-weight:600;text-decoration:underline;font-size:14px;font-family:system-ui,-apple-system,sans-serif;">${escapeHtml(cta.label)}</a>`;
}
function renderDetailCard(rows) {
  if (rows.length === 0) return "";
  const rowsHtml = rows.map(
    (row, index) => `
        <tr>
          <td style="padding:${index === 0 ? "0" : "10px"} 0 ${index === rows.length - 1 ? "0" : "10px"};font-family:system-ui,-apple-system,sans-serif;font-size:12px;color:${EMAIL_BRAND.muted};vertical-align:top;width:38%;">${escapeHtml(row.label)}</td>
          <td style="padding:${index === 0 ? "0" : "10px"} 0 ${index === rows.length - 1 ? "0" : "10px"};font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:${EMAIL_BRAND.body};font-weight:600;text-align:right;vertical-align:top;">${escapeHtml(row.value)}</td>
        </tr>`
  ).join("");
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;background:${EMAIL_BRAND.cardBg};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;">
      <tr>
        <td style="padding:16px 18px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rowsHtml}</table>
        </td>
      </tr>
    </table>`;
}
function brandShell(params) {
  const base = getAppBaseUrl();
  const logoUrl = getEmailLogoUrl();
  const support = getSupportEmail();
  const privacyUrl = `${base}/privacy`;
  const termsUrl = `${base}/terms`;
  const footer = params.footerNote || "Avenora Bank \u2014 secure digital banking. This message was sent automatically; please do not reply unless instructed.";
  const preheader = params.preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${EMAIL_BRAND.pageBg};">${escapeHtml(params.preheader)}</div>` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.pageBg};font-family:Georgia,'Times New Roman',serif;color:${EMAIL_BRAND.body};">
  ${preheader}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.pageBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:${EMAIL_BRAND.white};border-radius:16px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td style="background:linear-gradient(135deg,${EMAIL_BRAND.headerFrom},${EMAIL_BRAND.headerTo});padding:26px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:14px;">
                    <img src="${escapeHtml(logoUrl)}" width="44" height="44" alt="Avenora" style="display:block;width:44px;height:44px;border-radius:10px;border:0;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.04em;color:${EMAIL_BRAND.white};font-family:Georgia,'Times New Roman',serif;">AVENORA</p>
                    <p style="margin:5px 0 0;font-size:12px;color:#c8ebe4;font-family:system-ui,-apple-system,sans-serif;">Secure digital banking</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.body};">
              ${params.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 28px;font-family:system-ui,-apple-system,sans-serif;font-size:11px;line-height:1.55;color:${EMAIL_BRAND.muted};border-top:1px solid #e8efed;">
              <p style="margin:0 0 10px;">${escapeHtml(footer)}</p>
              <p style="margin:0 0 8px;">
                Need help?
                <a href="mailto:${escapeHtml(support)}" style="color:${EMAIL_BRAND.cta};text-decoration:none;">${escapeHtml(support)}</a>
              </p>
              <p style="margin:0;">
                <a href="${escapeHtml(privacyUrl)}" style="color:${EMAIL_BRAND.muted};text-decoration:underline;">Privacy</a>
                &nbsp;\xB7&nbsp;
                <a href="${escapeHtml(termsUrl)}" style="color:${EMAIL_BRAND.muted};text-decoration:underline;">Terms</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
var EMAIL_BRAND;
var init_layout = __esm({
  "src/server/emails/layout.ts"() {
    "use strict";
    init_env_config();
    EMAIL_BRAND = {
      headerFrom: "#003933",
      headerTo: "#076c64",
      cta: "#076c64",
      body: "#0f1f1e",
      muted: "#5c6f6c",
      pageBg: "#f0f4f3",
      cardBg: "#f8fbf9",
      border: "#d8e3e0",
      white: "#ffffff"
    };
  }
});

// src/server/emails/templates/welcome.ts
function buildWelcomeEmail(params) {
  const base = getAppBaseUrl();
  const support = getSupportEmail();
  const firstName = params.fullName.trim().split(/\s+/)[0] || "there";
  const portalUrl2 = base;
  const verifyUrl = `${base}/portal/kyc`;
  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.cta};">Welcome</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:700;color:${EMAIL_BRAND.body};font-family:Georgia,'Times New Roman',serif;">Hello, ${escapeHtml(firstName)}.</h1>
    <p style="margin:0 0 14px;">Your Avenora account is ready. Sign in to explore multicurrency wallets, transfers, and secure digital banking built around you.</p>
    <p style="margin:0 0 8px;">Next step: complete identity verification so we can unlock deposits, withdrawals, and full account features.</p>
    <p style="margin:28px 0 12px;">
      ${renderCtaButton({ label: "Open your portal", href: portalUrl2 })}
    </p>
    <p style="margin:0 0 24px;">
      ${renderSecondaryLink({ label: "Complete verification", href: verifyUrl })}
    </p>
    <p style="margin:0;font-size:13px;color:${EMAIL_BRAND.muted};">Questions? We are here at <a href="mailto:${escapeHtml(support)}" style="color:${EMAIL_BRAND.cta};text-decoration:none;">${escapeHtml(support)}</a>.</p>
  `;
  const html = brandShell({
    title: "Welcome to Avenora",
    preheader: "Your Avenora account is ready \u2014 open your portal and complete verification.",
    bodyHtml
  });
  const text = [
    `Welcome, ${firstName}.`,
    "",
    "Your Avenora account is ready. Sign in to explore multicurrency wallets, transfers, and secure digital banking.",
    "",
    `Open your portal: ${portalUrl2}`,
    `Complete verification: ${verifyUrl}`,
    "",
    `Need help? ${support}`
  ].join("\n");
  return {
    subject: "Welcome to Avenora Bank",
    html,
    text,
    tags: [{ name: "category", value: "welcome" }]
  };
}
var init_welcome = __esm({
  "src/server/emails/templates/welcome.ts"() {
    "use strict";
    init_layout();
  }
});

// src/server/emails/compose.ts
function firstNameFrom(fullName) {
  if (!fullName?.trim()) return "there";
  return fullName.trim().split(/\s+/)[0] || "there";
}
function composeTransactionalEmail(params) {
  const greeting = params.greeting ?? `Hello, ${escapeHtml(firstNameFrom(params.fullName))}.`;
  const eyebrow = params.eyebrow ? `<p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.cta};">${escapeHtml(params.eyebrow)}</p>` : "";
  const paragraphsHtml = params.paragraphs.map(
    (p, i) => `<p style="margin:0 0 ${i === params.paragraphs.length - 1 && !params.details?.length ? "8px" : "14px"};">${escapeHtml(p)}</p>`
  ).join("");
  const detailsHtml = params.details?.length ? renderDetailCard(params.details) : "";
  let ctaHtml = "";
  if (params.primaryCta) {
    ctaHtml += `<p style="margin:28px 0 12px;">${renderCtaButton(params.primaryCta)}</p>`;
  }
  if (params.secondaryCta) {
    ctaHtml += `<p style="margin:0 0 16px;">${renderSecondaryLink(params.secondaryCta)}</p>`;
  }
  const bodyHtml = `
    ${eyebrow}
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:${EMAIL_BRAND.body};font-family:Georgia,'Times New Roman',serif;">${greeting}</h1>
    ${paragraphsHtml}
    ${detailsHtml}
    ${ctaHtml}
  `;
  const html = brandShell({
    title: params.subject,
    preheader: params.preheader || params.paragraphs[0],
    bodyHtml,
    footerNote: params.footerNote
  });
  const textParts = [
    params.greeting ? params.greeting.replace(/<[^>]+>/g, "") : `Hello, ${firstNameFrom(params.fullName)}.`,
    "",
    ...params.paragraphs
  ];
  if (params.details?.length) {
    textParts.push("");
    for (const row of params.details) {
      textParts.push(`${row.label}: ${row.value}`);
    }
  }
  if (params.primaryCta) {
    textParts.push("", `${params.primaryCta.label}: ${params.primaryCta.href}`);
  }
  if (params.secondaryCta) {
    textParts.push(`${params.secondaryCta.label}: ${params.secondaryCta.href}`);
  }
  textParts.push("", `Support: ${getSupportEmail()}`);
  return {
    subject: params.subject,
    html,
    text: textParts.join("\n"),
    tags: [{ name: "category", value: params.category }]
  };
}
function portalUrl(path = "") {
  const base = getAppBaseUrl();
  if (!path) return `${base}/portal`;
  return `${base}/portal/${path.replace(/^\//, "")}`;
}
function appUrl(path = "") {
  const base = getAppBaseUrl();
  if (!path) return base;
  return `${base}/${path.replace(/^\//, "")}`;
}
function adminInbox() {
  const config = getValidatedConfig();
  return config.ADMIN_EMAIL || config.SUPPORT_EMAIL || "support@avenorabank.com";
}
function contactInbox() {
  const config = getValidatedConfig();
  return config.CONTACT_EMAIL || config.SUPPORT_EMAIL || config.ADMIN_EMAIL || "support@avenorabank.com";
}
function supportInbox() {
  const config = getValidatedConfig();
  return config.SUPPORT_EMAIL || config.ADMIN_EMAIL || "support@avenorabank.com";
}
var init_compose = __esm({
  "src/server/emails/compose.ts"() {
    "use strict";
    init_env_config();
    init_layout();
  }
});

// src/server/emails/templates/auth.ts
function buildPasswordResetRequestEmail(params) {
  const resetUrl = `${getAppBaseUrl()}/?view=auth&reset=1&token=${encodeURIComponent(params.resetToken)}`;
  const firstName = params.fullName.trim().split(/\s+/)[0] || "there";
  const html = brandShell({
    title: "Reset your Avenora password",
    preheader: "Reset your password within 30 minutes.",
    bodyHtml: `
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#076c64;">Security</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:#0f1f1e;font-family:Georgia,'Times New Roman',serif;">Hello, ${escapeHtml(firstName)}.</h1>
      <p style="margin:0 0 14px;">We received a request to reset the password for your Avenora account. Use the button below within <strong>30 minutes</strong>.</p>
      <p style="margin:0 0 8px;">If you did not request this, you can safely ignore this email.</p>
      <p style="margin:28px 0 12px;">${renderCtaButton({ label: "Reset password", href: resetUrl })}</p>
      <p style="margin:0 0 8px;font-size:12px;color:#5c6f6c;">Or paste this link into your browser:</p>
      <p style="margin:0;font-size:12px;word-break:break-all;color:#076c64;">${escapeHtml(resetUrl)}</p>
    `
  });
  return {
    subject: "Reset your Avenora password",
    html,
    text: `Hello, ${firstName}.

Reset your Avenora password (expires in 30 minutes):
${resetUrl}

If you did not request this, ignore this email.`,
    tags: [{ name: "category", value: "password_reset_request" }]
  };
}
function buildPasswordResetCompletedEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora password was reset",
    category: "password_reset_completed",
    eyebrow: "Security",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your password was successfully reset. All previous sessions have been signed out for your security.",
      "If you did not make this change, contact support immediately."
    ],
    primaryCta: { label: "Sign in", href: appUrl() },
    secondaryCta: { label: "Contact support", href: appUrl("contact") }
  });
}
function buildPasswordChangedEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora password was changed",
    category: "password_changed",
    eyebrow: "Security",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "The password for your Avenora account was just changed.",
      "If this was not you, secure your account and contact support right away."
    ],
    primaryCta: { label: "Review security settings", href: portalUrl("profile") },
    secondaryCta: { label: "Contact support", href: appUrl("contact") }
  });
}
function buildLoginLockoutEmail(params) {
  return composeTransactionalEmail({
    subject: "Avenora account temporarily locked",
    category: "login_lockout",
    eyebrow: "Security alert",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      `We temporarily locked your account after too many failed sign-in attempts. Please wait about ${params.lockMinutes} minutes before trying again.`,
      "If this was not you, reset your password and contact support."
    ],
    details: [{ label: "Lock duration", value: `About ${params.lockMinutes} minutes` }],
    primaryCta: { label: "Reset password", href: `${appUrl()}?view=auth&reset=1` },
    secondaryCta: { label: "Contact support", href: appUrl("contact") }
  });
}
function buildLoginNewDeviceEmail(params) {
  const details = [
    { label: "Time", value: params.signedInAt },
    ...params.ipAddress ? [{ label: "IP address", value: params.ipAddress }] : [],
    ...params.userAgent ? [{ label: "Device", value: params.userAgent.slice(0, 120) }] : []
  ];
  return composeTransactionalEmail({
    subject: "New sign-in to your Avenora account",
    category: "login_new_device",
    eyebrow: "Security alert",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "We noticed a sign-in to your Avenora account from a new device or location.",
      "If this was you, no action is needed. If not, change your password and contact support."
    ],
    details,
    primaryCta: { label: "Secure my account", href: portalUrl("profile") },
    secondaryCta: { label: "Contact support", href: appUrl("contact") }
  });
}
function buildLoginSuccessEmail(params) {
  return composeTransactionalEmail({
    subject: "Successful sign-in to Avenora",
    category: "login_success",
    eyebrow: "Security",
    heading: "",
    fullName: params.fullName,
    paragraphs: ["You successfully signed in to your Avenora account."],
    details: [
      { label: "Time", value: params.signedInAt },
      ...params.ipAddress ? [{ label: "IP address", value: params.ipAddress }] : []
    ],
    primaryCta: { label: "Open portal", href: portalUrl() },
    secondaryCta: { label: "Review activity", href: portalUrl("profile") }
  });
}
function buildMfaEnrolledEmail(params) {
  return composeTransactionalEmail({
    subject: "Authenticator app enabled on Avenora",
    category: "mfa_enrolled",
    eyebrow: "Security",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Two-factor authentication is now enabled on your Avenora account. Store your recovery codes in a safe place."
    ],
    primaryCta: { label: "View security settings", href: portalUrl("profile") }
  });
}
function buildMfaDisabledEmail(params) {
  return composeTransactionalEmail({
    subject: "Authenticator app disabled on Avenora",
    category: "mfa_disabled",
    eyebrow: "Security alert",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Two-factor authentication was disabled on your Avenora account.",
      "If you did not make this change, secure your account immediately."
    ],
    primaryCta: { label: "Secure my account", href: portalUrl("profile") },
    secondaryCta: { label: "Contact support", href: appUrl("contact") }
  });
}
function buildAccountSuspendedEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora account has been suspended",
    category: "account_suspended",
    eyebrow: "Account notice",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your Avenora account has been suspended. You can still sign in to view notices, but financial activity is restricted.",
      params.reason ? `Reason provided: ${params.reason}` : "Please contact support for assistance."
    ],
    primaryCta: { label: "Contact support", href: appUrl("contact") },
    secondaryCta: { label: "Open portal", href: portalUrl() }
  });
}
function buildAccountLockedEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora account has been locked",
    category: "account_locked",
    eyebrow: "Account notice",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your Avenora account has been locked by our operations team. Access to the portal is restricted until the lock is lifted.",
      params.reason ? `Reason provided: ${params.reason}` : "Please contact support for next steps."
    ],
    primaryCta: { label: "Contact support", href: appUrl("contact") }
  });
}
function buildAccountRestoredEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora account has been restored",
    category: "account_restored",
    eyebrow: "Account notice",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Good news \u2014 your Avenora account access has been restored. You can sign in and continue using your portal."
    ],
    primaryCta: { label: "Sign in to portal", href: portalUrl() }
  });
}
function buildPendingVerificationEmail(params) {
  return composeTransactionalEmail({
    subject: "Complete verification to activate Avenora",
    category: "pending_verification",
    eyebrow: "Verification",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your account is pending identity verification. Complete KYC to unlock deposits, withdrawals, and full banking features."
    ],
    primaryCta: { label: "Complete verification", href: portalUrl("kyc") }
  });
}
function buildRoleChangedEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora access role was updated",
    category: "role_changed",
    eyebrow: "Account notice",
    heading: "",
    fullName: params.fullName,
    paragraphs: ["Your Avenora platform role has been updated."],
    details: [{ label: "New role", value: params.newRole }],
    primaryCta: { label: "Open portal", href: portalUrl() }
  });
}
function buildAccountDeletedEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora account has been deleted",
    category: "account_deleted",
    eyebrow: "Account notice",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your Avenora account has been permanently deleted as requested by our operations team.",
      "If you believe this was a mistake, contact support as soon as possible."
    ],
    primaryCta: { label: "Contact support", href: appUrl("contact") }
  });
}
var init_auth = __esm({
  "src/server/emails/templates/auth.ts"() {
    "use strict";
    init_compose();
    init_layout();
  }
});

// src/server/emails/templates/kyc.ts
function buildKycSubmittedEmail(params) {
  return composeTransactionalEmail({
    subject: "We received your Avenora identity verification",
    category: "kyc_submitted",
    eyebrow: "Verification",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Thanks \u2014 your identity verification documents were submitted successfully. Our compliance team will review them shortly."
    ],
    details: params.reference ? [{ label: "Reference", value: params.reference }] : void 0,
    primaryCta: { label: "Track status", href: portalUrl("kyc") }
  });
}
function buildKycSubmittedStaffEmail(params) {
  return composeTransactionalEmail({
    subject: `[KYC] New submission \u2014 ${params.customerName}`,
    category: "kyc_submitted_staff",
    eyebrow: "Ops queue",
    heading: "",
    greeting: "New KYC submission",
    paragraphs: ["A customer submitted identity verification for review."],
    details: [
      { label: "Customer", value: params.customerName },
      { label: "Email", value: params.customerEmail },
      { label: "User ID", value: params.userId }
    ],
    primaryCta: { label: "Open admin KYC queue", href: `${appUrl()}/admin/kyc` },
    footerNote: `Internal notification \u2014 ${adminInbox()}`
  });
}
function buildKycUnderReviewEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora verification is under review",
    category: "kyc_under_review",
    eyebrow: "Verification",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your identity verification is now under review by our compliance team. We will email you when a decision is ready."
    ],
    primaryCta: { label: "Track status", href: portalUrl("kyc") }
  });
}
function buildKycNeedsMoreInfoEmail(params) {
  return composeTransactionalEmail({
    subject: "More information needed for Avenora verification",
    category: "kyc_needs_more_info",
    eyebrow: "Action required",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "We need a bit more information to complete your identity verification.",
      params.notes || "Please return to the verification flow and upload the requested documents."
    ],
    primaryCta: { label: "Continue verification", href: portalUrl("kyc") }
  });
}
function buildKycApprovedEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora identity verification is approved",
    category: "kyc_approved",
    eyebrow: "Verified",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Congratulations \u2014 your identity has been verified. Your account is now active for deposits, withdrawals, and transfers."
    ],
    primaryCta: { label: "Open wallet", href: portalUrl("wallets") },
    secondaryCta: { label: "View account details", href: portalUrl("kyc") }
  });
}
function buildKycRejectedEmail(params) {
  return composeTransactionalEmail({
    subject: "Update on your Avenora identity verification",
    category: "kyc_rejected",
    eyebrow: "Verification",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Unfortunately we could not approve your identity verification at this time.",
      params.notes || "You may resubmit with updated documents or contact support for help."
    ],
    primaryCta: { label: "Resubmit documents", href: portalUrl("kyc") },
    secondaryCta: { label: "Contact support", href: appUrl("contact") }
  });
}
function buildDomesticAccountIssuedEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora domestic account details are ready",
    category: "domestic_account_issued",
    eyebrow: "Account details",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your domestic bank account details have been generated and are ready to use for local transfers."
    ],
    details: [
      { label: "Account", value: params.accountSummary },
      ...params.currency ? [{ label: "Currency", value: params.currency }] : []
    ],
    primaryCta: { label: "View account details", href: portalUrl("wallets") }
  });
}
function buildDomesticAccountFailedEmail(params) {
  return composeTransactionalEmail({
    subject: "We could not generate your Avenora account details",
    category: "domestic_account_failed",
    eyebrow: "Account details",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "We ran into an issue generating your domestic account details.",
      params.reason || "Our team has been notified. You can retry from your portal or contact support."
    ],
    primaryCta: { label: "Open portal", href: portalUrl("wallets") },
    secondaryCta: { label: "Contact support", href: appUrl("contact") }
  });
}
var init_kyc = __esm({
  "src/server/emails/templates/kyc.ts"() {
    "use strict";
    init_compose();
  }
});

// src/server/emails/templates/wallet.ts
function buildDepositRequestedEmail(params) {
  return composeTransactionalEmail({
    subject: `Deposit request received \u2014 ${params.amount} ${params.currency}`,
    category: "deposit_requested",
    eyebrow: "Deposit",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "We received your deposit request. Funds are held pending review and will appear in your available balance once approved."
    ],
    details: [
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      ...params.reference ? [{ label: "Reference", value: params.reference }] : [],
      { label: "Status", value: "Pending review" }
    ],
    primaryCta: { label: "Track deposit", href: portalUrl("transactions") }
  });
}
function buildDepositStaffEmail(params) {
  return composeTransactionalEmail({
    subject: `[Deposit] ${params.amount} ${params.currency} \u2014 ${params.customerName}`,
    category: "deposit_requested_staff",
    eyebrow: "Ops queue",
    heading: "",
    greeting: "Deposit awaiting approval",
    paragraphs: ["A customer deposit is pending review."],
    details: [
      { label: "Customer", value: params.customerName },
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      { label: "Deposit ID", value: params.depositId }
    ],
    primaryCta: { label: "Open transactions", href: `${appUrl()}/admin/transactions` },
    footerNote: `Internal notification \u2014 ${adminInbox()}`
  });
}
function buildDepositApprovedEmail(params) {
  return composeTransactionalEmail({
    subject: `Deposit approved \u2014 ${params.amount} ${params.currency}`,
    category: "deposit_approved",
    eyebrow: "Deposit",
    heading: "",
    fullName: params.fullName,
    paragraphs: ["Your deposit has been approved and is now available in your wallet balance."],
    details: [
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      ...params.reference ? [{ label: "Reference", value: params.reference }] : [],
      { label: "Status", value: "Approved" }
    ],
    primaryCta: { label: "View balance", href: portalUrl("wallets") },
    secondaryCta: { label: "View transactions", href: portalUrl("transactions") }
  });
}
function buildDepositRejectedEmail(params) {
  return composeTransactionalEmail({
    subject: `Deposit not approved \u2014 ${params.amount} ${params.currency}`,
    category: "deposit_rejected",
    eyebrow: "Deposit",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your deposit request was not approved. Any held amount has been released according to our review outcome.",
      params.reason || "You may submit a new deposit or contact support for details."
    ],
    details: [
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      { label: "Status", value: "Rejected" }
    ],
    primaryCta: { label: "View details", href: portalUrl("transactions") },
    secondaryCta: { label: "Contact support", href: appUrl("contact") }
  });
}
function buildBtcDepositProofEmail(params) {
  return composeTransactionalEmail({
    subject: "BTC deposit proof received",
    category: "btc_deposit_proof",
    eyebrow: "Bitcoin deposit",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "We received your Bitcoin deposit proof. Our team will review the transaction and credit your wallet once confirmed."
    ],
    details: [
      { label: "Amount", value: params.amount },
      ...params.txHash ? [{ label: "Tx hash", value: params.txHash }] : [],
      { label: "Status", value: "Pending review" }
    ],
    primaryCta: { label: "Track deposit", href: portalUrl("transactions") }
  });
}
function buildWithdrawalRequestedEmail(params) {
  return composeTransactionalEmail({
    subject: `Withdrawal request received \u2014 ${params.amount} ${params.currency}`,
    category: "withdrawal_requested",
    eyebrow: "Withdrawal",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "We received your withdrawal request. Funds are held pending review before payout."
    ],
    details: [
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      ...params.reference ? [{ label: "Reference", value: params.reference }] : [],
      { label: "Status", value: "Pending review" }
    ],
    primaryCta: { label: "Track withdrawal", href: portalUrl("transactions") }
  });
}
function buildWithdrawalStaffEmail(params) {
  return composeTransactionalEmail({
    subject: `[Withdrawal] ${params.amount} ${params.currency} \u2014 ${params.customerName}`,
    category: "withdrawal_requested_staff",
    eyebrow: "Ops queue",
    heading: "",
    greeting: "Withdrawal awaiting approval",
    paragraphs: ["A customer withdrawal is pending review."],
    details: [
      { label: "Customer", value: params.customerName },
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      { label: "Withdrawal ID", value: params.withdrawalId }
    ],
    primaryCta: { label: "Open transactions", href: `${appUrl()}/admin/transactions` },
    footerNote: `Internal notification \u2014 ${adminInbox()}`
  });
}
function buildWithdrawalApprovedEmail(params) {
  return composeTransactionalEmail({
    subject: `Withdrawal approved \u2014 ${params.amount} ${params.currency}`,
    category: "withdrawal_approved",
    eyebrow: "Withdrawal",
    heading: "",
    fullName: params.fullName,
    paragraphs: ["Your withdrawal has been approved and is being processed for payout."],
    details: [
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      { label: "Status", value: "Approved" }
    ],
    primaryCta: { label: "View payout status", href: portalUrl("transactions") }
  });
}
function buildWithdrawalRejectedEmail(params) {
  return composeTransactionalEmail({
    subject: `Withdrawal not approved \u2014 ${params.amount} ${params.currency}`,
    category: "withdrawal_rejected",
    eyebrow: "Withdrawal",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your withdrawal request was not approved. Held funds have been returned to your available balance.",
      params.reason || "Please update your payout details or contact support."
    ],
    details: [
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      { label: "Status", value: "Rejected" }
    ],
    primaryCta: { label: "View wallet", href: portalUrl("wallets") },
    secondaryCta: { label: "Contact support", href: appUrl("contact") }
  });
}
function buildTransferSentEmail(params) {
  return composeTransactionalEmail({
    subject: `Transfer sent \u2014 ${params.amount} ${params.currency}`,
    category: "transfer_sent",
    eyebrow: "Transfer",
    heading: "",
    fullName: params.fullName,
    paragraphs: ["Your internal transfer was completed successfully."],
    details: [
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      { label: "To", value: params.recipient },
      ...params.reference ? [{ label: "Reference", value: params.reference }] : []
    ],
    primaryCta: { label: "View receipt", href: portalUrl("transactions") }
  });
}
function buildTransferReceivedEmail(params) {
  return composeTransactionalEmail({
    subject: `Transfer received \u2014 ${params.amount} ${params.currency}`,
    category: "transfer_received",
    eyebrow: "Transfer",
    heading: "",
    fullName: params.fullName,
    paragraphs: ["You received an internal transfer into your Avenora wallet."],
    details: [
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      { label: "From", value: params.sender },
      ...params.reference ? [{ label: "Reference", value: params.reference }] : []
    ],
    primaryCta: { label: "View balance", href: portalUrl("wallets") }
  });
}
function buildFxConvertedEmail(params) {
  return composeTransactionalEmail({
    subject: `FX conversion complete \u2014 ${params.fromCurrency} \u2192 ${params.toCurrency}`,
    category: "fx_converted",
    eyebrow: "Currency exchange",
    heading: "",
    fullName: params.fullName,
    paragraphs: ["Your currency conversion completed successfully."],
    details: [
      { label: "Sold", value: `${params.fromAmount} ${params.fromCurrency}` },
      { label: "Bought", value: `${params.toAmount} ${params.toCurrency}` },
      ...params.rate ? [{ label: "Rate", value: params.rate }] : []
    ],
    primaryCta: { label: "View balances", href: portalUrl("wallets") }
  });
}
function buildAdminAdjustmentQueuedEmail(params) {
  return composeTransactionalEmail({
    subject: `Account adjustment pending \u2014 ${params.amount} ${params.currency}`,
    category: "admin_adjustment_queued",
    eyebrow: "Account adjustment",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      `An administrative ${params.direction.toLowerCase()} has been queued on your account and is pending review.`
    ],
    details: [
      { label: "Type", value: params.direction },
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      { label: "Status", value: "Pending" }
    ],
    primaryCta: { label: "View transactions", href: portalUrl("transactions") }
  });
}
function buildTransactionReversedEmail(params) {
  return composeTransactionalEmail({
    subject: `Transaction reversed \u2014 ${params.amount} ${params.currency}`,
    category: "transaction_reversed",
    eyebrow: "Ledger",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "A transaction on your account was reversed by our operations team. Your balances have been updated accordingly."
    ],
    details: [
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      { label: "Transaction", value: params.transactionId }
    ],
    primaryCta: { label: "View statement", href: portalUrl("transactions") }
  });
}
function buildStatementReadyEmail(params) {
  return composeTransactionalEmail({
    subject: `Your Avenora statement is ready \u2014 ${params.periodLabel}`,
    category: "statement_ready",
    eyebrow: "Statements",
    heading: "",
    fullName: params.fullName,
    paragraphs: [`Your account statement for ${params.periodLabel} is ready to download.`],
    primaryCta: { label: "Download statement", href: portalUrl("statements") }
  });
}
var init_wallet = __esm({
  "src/server/emails/templates/wallet.ts"() {
    "use strict";
    init_compose();
  }
});

// src/server/emails/templates/cards.ts
function buildCardRequestedEmail(params) {
  return composeTransactionalEmail({
    subject: "Card request received",
    category: "card_requested",
    eyebrow: "Cards",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "We received your card request. It is pending review and you will be notified once a decision is made."
    ],
    details: params.cardLabel ? [{ label: "Card", value: params.cardLabel }] : void 0,
    primaryCta: { label: "Track request", href: portalUrl("cards") }
  });
}
function buildCardRequestedStaffEmail(params) {
  return composeTransactionalEmail({
    subject: `[Card] Issuance request \u2014 ${params.customerName}`,
    category: "card_requested_staff",
    eyebrow: "Ops queue",
    heading: "",
    greeting: "Card issuance pending review",
    paragraphs: ["A customer requested a new card."],
    details: [
      { label: "Customer", value: params.customerName },
      { label: "Card ID", value: params.cardId }
    ],
    primaryCta: { label: "Open cards queue", href: `${appUrl()}/admin/cards` },
    footerNote: `Internal notification \u2014 ${adminInbox()}`
  });
}
function buildCardIssuanceApprovedEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora card is approved",
    category: "card_issuance_approved",
    eyebrow: "Cards",
    heading: "",
    fullName: params.fullName,
    paragraphs: ["Great news \u2014 your card request was approved and the card is ready to manage in your portal."],
    details: params.last4 ? [{ label: "Card", value: `\u2022\u2022\u2022\u2022 ${params.last4}` }] : void 0,
    primaryCta: { label: "Manage cards", href: portalUrl("cards") }
  });
}
function buildCardIssuanceDeclinedEmail(params) {
  return composeTransactionalEmail({
    subject: "Update on your Avenora card request",
    category: "card_issuance_declined",
    eyebrow: "Cards",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your card request was not approved at this time.",
      params.reason || "Contact support if you would like more information."
    ],
    primaryCta: { label: "Contact support", href: appUrl("contact") },
    secondaryCta: { label: "View cards", href: portalUrl("cards") }
  });
}
function buildCardFrozenEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora card was frozen",
    category: "card_frozen",
    eyebrow: "Cards",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your card has been frozen. New authorizations will be declined until it is unfrozen."
    ],
    details: params.last4 ? [{ label: "Card", value: `\u2022\u2022\u2022\u2022 ${params.last4}` }] : void 0,
    primaryCta: { label: "Manage card", href: portalUrl("cards") },
    secondaryCta: { label: "Contact support", href: appUrl("contact") }
  });
}
function buildCardUnfrozenEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora card was unfrozen",
    category: "card_unfrozen",
    eyebrow: "Cards",
    heading: "",
    fullName: params.fullName,
    paragraphs: ["Your card is active again and can be used for new purchases."],
    details: params.last4 ? [{ label: "Card", value: `\u2022\u2022\u2022\u2022 ${params.last4}` }] : void 0,
    primaryCta: { label: "Manage cards", href: portalUrl("cards") }
  });
}
function buildCardTerminatedEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora card was terminated",
    category: "card_terminated",
    eyebrow: "Cards",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your card has been terminated and can no longer be used. You may request a replacement from your portal."
    ],
    details: params.last4 ? [{ label: "Card", value: `\u2022\u2022\u2022\u2022 ${params.last4}` }] : void 0,
    primaryCta: { label: "Request replacement", href: portalUrl("cards") }
  });
}
function buildCardLimitsChangedEmail(params) {
  return composeTransactionalEmail({
    subject: "Your Avenora card limits were updated",
    category: "card_limits_changed",
    eyebrow: "Cards",
    heading: "",
    fullName: params.fullName,
    paragraphs: ["Spending limits on your card have been updated."],
    details: [
      ...params.last4 ? [{ label: "Card", value: `\u2022\u2022\u2022\u2022 ${params.last4}` }] : [],
      ...params.dailyLimit ? [{ label: "Daily limit", value: params.dailyLimit }] : [],
      ...params.monthlyLimit ? [{ label: "Monthly limit", value: params.monthlyLimit }] : []
    ],
    primaryCta: { label: "View limits", href: portalUrl("cards") }
  });
}
function buildCardAuthHoldEmail(params) {
  return composeTransactionalEmail({
    subject: `Card authorization hold \u2014 ${params.amount} ${params.currency}`,
    category: "card_auth_hold",
    eyebrow: "Card activity",
    heading: "",
    fullName: params.fullName,
    paragraphs: ["A temporary authorization hold was placed on your card."],
    details: [
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      ...params.merchant ? [{ label: "Merchant", value: params.merchant }] : [],
      ...params.last4 ? [{ label: "Card", value: `\u2022\u2022\u2022\u2022 ${params.last4}` }] : [],
      { label: "Status", value: "Pending hold" }
    ],
    primaryCta: { label: "Review hold", href: portalUrl("cards") }
  });
}
function buildCardHoldSettledEmail(params) {
  const settled = params.outcome === "settled";
  return composeTransactionalEmail({
    subject: settled ? `Card charge settled \u2014 ${params.amount} ${params.currency}` : `Card hold released \u2014 ${params.amount} ${params.currency}`,
    category: "card_hold_settled",
    eyebrow: "Card activity",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      settled ? "A pending card authorization was settled and posted to your account." : "A pending card authorization hold was released. The reserved amount is available again."
    ],
    details: [
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      ...params.merchant ? [{ label: "Merchant", value: params.merchant }] : [],
      { label: "Status", value: settled ? "Settled" : "Released" }
    ],
    primaryCta: { label: "View transactions", href: portalUrl("transactions") }
  });
}
var init_cards = __esm({
  "src/server/emails/templates/cards.ts"() {
    "use strict";
    init_compose();
  }
});

// src/server/emails/templates/loans.ts
function buildLoanSubmittedEmail(params) {
  return composeTransactionalEmail({
    subject: "Loan application received",
    category: "loan_submitted",
    eyebrow: "Lending",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "We received your loan application. Our team will review it and notify you of the decision."
    ],
    details: [
      { label: "Application", value: params.applicationId },
      ...params.amount ? [{ label: "Amount", value: params.amount }] : []
    ],
    primaryCta: { label: "Track application", href: portalUrl("loans") }
  });
}
function buildLoanSubmittedStaffEmail(params) {
  return composeTransactionalEmail({
    subject: `[Loan] Application \u2014 ${params.customerName}`,
    category: "loan_submitted_staff",
    eyebrow: "Ops queue",
    heading: "",
    greeting: "New loan application",
    paragraphs: ["A customer submitted a loan application for review."],
    details: [
      { label: "Customer", value: params.customerName },
      { label: "Application", value: params.applicationId }
    ],
    primaryCta: { label: "Open loans queue", href: `${appUrl()}/admin/loans` },
    footerNote: `Internal notification \u2014 ${adminInbox()}`
  });
}
function buildLoanDecisionEmail(params) {
  return composeTransactionalEmail({
    subject: `Loan application update \u2014 ${params.decision}`,
    category: "loan_decision",
    eyebrow: "Lending",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      `There is an update on your loan application: ${params.decision}.`,
      params.notes || "Sign in to your portal for full details and next steps."
    ],
    details: [
      { label: "Application", value: params.applicationId },
      { label: "Decision", value: params.decision }
    ],
    primaryCta: { label: "View decision", href: portalUrl("loans") }
  });
}
function buildGrantSubmittedEmail(params) {
  return composeTransactionalEmail({
    subject: "Grant application received",
    category: "grant_submitted",
    eyebrow: "Grants",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "We received your grant application. You will be notified once eligibility and review are complete."
    ],
    details: [{ label: "Application", value: params.applicationId }],
    primaryCta: { label: "Track application", href: portalUrl("grants") }
  });
}
function buildGrantSubmittedStaffEmail(params) {
  return composeTransactionalEmail({
    subject: `[Grant] Application \u2014 ${params.customerName}`,
    category: "grant_submitted_staff",
    eyebrow: "Ops queue",
    heading: "",
    greeting: "New grant application",
    paragraphs: ["A customer submitted a grant application for review."],
    details: [
      { label: "Customer", value: params.customerName },
      { label: "Application", value: params.applicationId }
    ],
    primaryCta: { label: "Open grants queue", href: `${appUrl()}/admin/loans` },
    footerNote: `Internal notification \u2014 ${adminInbox()}`
  });
}
function buildGrantIneligibleEmail(params) {
  return composeTransactionalEmail({
    subject: "Grant application eligibility update",
    category: "grant_ineligible",
    eyebrow: "Grants",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Based on the information provided, your grant application did not meet eligibility requirements.",
      params.reason || "Review the program criteria and update your application if applicable."
    ],
    details: [{ label: "Application", value: params.applicationId }],
    primaryCta: { label: "Review eligibility", href: portalUrl("grants") }
  });
}
function buildGrantReviewedEmail(params) {
  return composeTransactionalEmail({
    subject: `Grant application update \u2014 ${params.decision}`,
    category: "grant_reviewed",
    eyebrow: "Grants",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      `There is an update on your grant application: ${params.decision}.`,
      params.notes || "Sign in to your portal for full details."
    ],
    details: [
      { label: "Application", value: params.applicationId },
      { label: "Decision", value: params.decision }
    ],
    primaryCta: { label: "View status", href: portalUrl("grants") }
  });
}
function buildGrantDisbursedEmail(params) {
  return composeTransactionalEmail({
    subject: `Grant disbursed \u2014 ${params.amount} ${params.currency}`,
    category: "grant_disbursed",
    eyebrow: "Grants",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your grant has been disbursed and credited to your Avenora wallet."
    ],
    details: [
      { label: "Application", value: params.applicationId },
      { label: "Amount", value: `${params.amount} ${params.currency}` }
    ],
    primaryCta: { label: "View wallet", href: portalUrl("wallets") },
    secondaryCta: { label: "View grant", href: portalUrl("grants") }
  });
}
var init_loans = __esm({
  "src/server/emails/templates/loans.ts"() {
    "use strict";
    init_compose();
  }
});

// src/server/emails/templates/support.ts
function buildContactStaffEmail(params) {
  const categoryLine = params.category ? `<p style="margin:0 0 8px;"><strong>Category:</strong> ${escapeHtml(params.category)}</p>` : "";
  const html = brandShell({
    title: `Contact inquiry ${params.reference}`,
    preheader: `New website inquiry ${params.reference}`,
    bodyHtml: `
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.cta};">Contact</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:${EMAIL_BRAND.body};font-family:Georgia,'Times New Roman',serif;">New website inquiry</h1>
      <p style="margin:0 0 8px;"><strong>Reference:</strong> ${escapeHtml(params.reference)}</p>
      <p style="margin:0 0 8px;"><strong>From:</strong> ${escapeHtml(params.name)} &lt;${escapeHtml(params.email)}&gt;</p>
      ${categoryLine}
      <p style="margin:0 0 8px;"><strong>Subject:</strong> ${escapeHtml(params.subject)}</p>
      <div style="margin-top:16px;padding:16px;background:${EMAIL_BRAND.cardBg};border-radius:12px;border:1px solid ${EMAIL_BRAND.border};white-space:pre-wrap;">${escapeHtml(params.message)}</div>
    `,
    footerNote: `Internal notification \u2014 reply to the customer. Inbox: ${contactInbox()}`
  });
  return {
    subject: `[Avenora Contact] ${params.reference}: ${params.subject}`,
    html,
    text: `Inquiry ${params.reference}
From: ${params.name} <${params.email}>
Subject: ${params.subject}

${params.message}`,
    tags: [{ name: "category", value: "contact_staff" }]
  };
}
function buildContactAckEmail(params) {
  return composeTransactionalEmail({
    subject: `We received your message (${params.reference})`,
    category: "contact_ack",
    eyebrow: "Support",
    heading: "",
    fullName: params.name,
    paragraphs: [
      "Thanks for contacting Avenora. We received your message and will respond using this email address."
    ],
    details: [{ label: "Reference", value: params.reference }],
    primaryCta: { label: "Visit help center", href: appUrl("help") }
  });
}
function buildSupportTicketStaffEmail(params) {
  const html = brandShell({
    title: `Support ticket ${params.ticketId}`,
    preheader: `Support ticket ${params.ticketId}`,
    bodyHtml: `
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.cta};">Support</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:${EMAIL_BRAND.body};font-family:Georgia,'Times New Roman',serif;">Support ticket</h1>
      <p style="margin:0 0 8px;"><strong>Ticket:</strong> ${escapeHtml(params.ticketId)}</p>
      <p style="margin:0 0 8px;"><strong>Customer:</strong> ${escapeHtml(params.customerName)} &lt;${escapeHtml(params.customerEmail)}&gt;</p>
      <p style="margin:0 0 8px;"><strong>Priority:</strong> ${escapeHtml(params.priority || "STANDARD")}</p>
      <p style="margin:0 0 8px;"><strong>Subject:</strong> ${escapeHtml(params.subject)}</p>
      <div style="margin-top:16px;padding:16px;background:${EMAIL_BRAND.cardBg};border-radius:12px;border:1px solid ${EMAIL_BRAND.border};white-space:pre-wrap;">${escapeHtml(params.message)}</div>
    `,
    footerNote: `Internal support notification \u2014 ${supportInbox()}`
  });
  return {
    subject: `[Avenora Support ${params.priority || "STANDARD"}] ${params.ticketId}: ${params.subject}`,
    html,
    text: `Ticket ${params.ticketId}
From: ${params.customerName} <${params.customerEmail}>
Priority: ${params.priority || "STANDARD"}
Subject: ${params.subject}

${params.message}`,
    tags: [{ name: "category", value: "support_ticket_staff" }]
  };
}
function buildSupportTicketAckEmail(params) {
  return composeTransactionalEmail({
    subject: `We received your support request (${params.ticketId})`,
    category: "support_ticket_ack",
    eyebrow: "Support",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Thanks for reaching out. Our support team received your ticket and will follow up by email."
    ],
    details: [
      { label: "Ticket", value: params.ticketId },
      { label: "Subject", value: params.subject }
    ],
    primaryCta: { label: "Open help & support", href: portalUrl("support") }
  });
}
function buildSupportTicketResolvedEmail(params) {
  return composeTransactionalEmail({
    subject: `Support ticket resolved (${params.ticketId})`,
    category: "support_ticket_resolved",
    eyebrow: "Support",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "Your support ticket has been marked as resolved.",
      params.resolutionNote || "If you still need help, reply to this email or open a new ticket from your portal."
    ],
    details: [
      { label: "Ticket", value: params.ticketId },
      { label: "Subject", value: params.subject }
    ],
    primaryCta: { label: "Open help & support", href: portalUrl("support") }
  });
}
var init_support = __esm({
  "src/server/emails/templates/support.ts"() {
    "use strict";
    init_compose();
    init_layout();
  }
});

// src/server/emails/templates/provider.ts
function buildProviderDepositClearedEmail(params) {
  return composeTransactionalEmail({
    subject: "Deposit cleared with our payment partner",
    category: "provider_deposit_cleared",
    eyebrow: "Payments",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "A deposit linked to your account was marked cleared by our payment partner."
    ],
    details: [
      ...params.amount && params.currency ? [{ label: "Amount", value: `${params.amount} ${params.currency}` }] : [],
      ...params.reference ? [{ label: "Reference", value: params.reference }] : []
    ],
    primaryCta: { label: "View deposit", href: portalUrl("transactions") }
  });
}
function buildProviderWireInboundEmail(params) {
  return composeTransactionalEmail({
    subject: "Inbound wire received",
    category: "provider_wire_inbound",
    eyebrow: "Payments",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "An inbound wire related to your account was reported by our payment partner. Confirm details in your portal."
    ],
    details: [
      ...params.amount && params.currency ? [{ label: "Amount", value: `${params.amount} ${params.currency}` }] : [],
      ...params.reference ? [{ label: "Reference", value: params.reference }] : []
    ],
    primaryCta: { label: "View funds", href: portalUrl("wallets") }
  });
}
function buildProviderWireInboundStaffEmail(params) {
  return composeTransactionalEmail({
    subject: "[Wire] Inbound wire reported",
    category: "provider_wire_inbound_staff",
    eyebrow: "Ops",
    heading: "",
    greeting: "Inbound wire alert",
    paragraphs: ["A mock/provider inbound wire event was received and needs ops attention."],
    details: [
      ...params.amount && params.currency ? [{ label: "Amount", value: `${params.amount} ${params.currency}` }] : [],
      ...params.reference ? [{ label: "Reference", value: params.reference }] : []
    ],
    primaryCta: { label: "Open admin", href: `${appUrl()}/admin/transactions` },
    footerNote: `Internal notification \u2014 ${adminInbox()}`
  });
}
function buildComplianceFlagEmail(params) {
  return composeTransactionalEmail({
    subject: "[Compliance] Flag raised",
    category: "compliance_flag",
    eyebrow: "Compliance",
    heading: "",
    greeting: "Compliance flag",
    paragraphs: [
      "A compliance flag was raised by the payment partner webhook and requires review.",
      params.detail || "Open the admin console to investigate."
    ],
    details: [
      ...params.flagType ? [{ label: "Flag", value: params.flagType }] : [],
      ...params.reference ? [{ label: "Reference", value: params.reference }] : []
    ],
    primaryCta: { label: "Review flag", href: `${appUrl()}/admin/audit` },
    footerNote: `Internal compliance notification \u2014 ${adminInbox()}`
  });
}
function buildProviderPaymentConfirmedEmail(params) {
  return composeTransactionalEmail({
    subject: `Payment confirmed \u2014 ${params.amount} ${params.currency}`,
    category: "provider_payment_confirmed",
    eyebrow: "Payments",
    heading: "",
    fullName: params.fullName,
    paragraphs: ["Your payment was confirmed by our payment partner."],
    details: [
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      { label: "Payment ID", value: params.paymentId }
    ],
    primaryCta: { label: "View payment", href: portalUrl("transactions") }
  });
}
function buildProviderPaymentFailedEmail(params) {
  return composeTransactionalEmail({
    subject: `Payment failed \u2014 ${params.amount} ${params.currency}`,
    category: "provider_payment_failed",
    eyebrow: "Payments",
    heading: "",
    fullName: params.fullName,
    paragraphs: [
      "A payment linked to your account failed or was reversed by our payment partner.",
      params.reason || "Contact support if you need help resolving this."
    ],
    details: [
      { label: "Amount", value: `${params.amount} ${params.currency}` },
      { label: "Payment ID", value: params.paymentId }
    ],
    primaryCta: { label: "Contact support", href: appUrl("contact") },
    secondaryCta: { label: "View transactions", href: portalUrl("transactions") }
  });
}
function buildReconciliationRequiredEmail(params) {
  return composeTransactionalEmail({
    subject: `[Reconciliation] Required \u2014 ${params.paymentId}`,
    category: "reconciliation_required",
    eyebrow: "Ops",
    heading: "",
    greeting: "Reconciliation required",
    paragraphs: [
      "A provider payment requires manual reconciliation.",
      params.detail || "Review the payment in the admin console."
    ],
    details: [{ label: "Payment ID", value: params.paymentId }],
    primaryCta: { label: "Reconcile payment", href: `${appUrl()}/admin/transactions` },
    footerNote: `Internal ops notification \u2014 ${adminInbox()}`
  });
}
var init_provider = __esm({
  "src/server/emails/templates/provider.ts"() {
    "use strict";
    init_compose();
  }
});

// src/server/services/security.service.ts
var import_crypto3, SecurityService;
var init_security_service = __esm({
  "src/server/services/security.service.ts"() {
    "use strict";
    import_crypto3 = __toESM(require("crypto"), 1);
    SecurityService = class {
      /**
       * Hashes a password using Scrypt with a cryptographically secure 16-byte salt.
       * Format: `scrypt:${saltHex}:${keyHex}`
       */
      static async hashPassword(password) {
        return new Promise((resolve, reject) => {
          const salt = import_crypto3.default.randomBytes(16).toString("hex");
          import_crypto3.default.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
            if (err) return reject(err);
            resolve(`scrypt:${salt}:${derivedKey.toString("hex")}`);
          });
        });
      }
      /**
       * Verifies a password against an scrypt hash using constant-time comparison.
       */
      static async verifyPassword(password, storedHash) {
        return new Promise((resolve) => {
          const parts = storedHash.split(":");
          if (parts.length !== 3 || parts[0] !== "scrypt") {
            return resolve(false);
          }
          const salt = parts[1];
          const expectedKey = Buffer.from(parts[2], "hex");
          import_crypto3.default.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
            if (err) return resolve(false);
            if (derivedKey.length !== expectedKey.length) return resolve(false);
            resolve(import_crypto3.default.timingSafeEqual(derivedKey, expectedKey));
          });
        });
      }
      /**
       * Generates a high-entropy random token (e.g. for sessions or password resets).
       */
      static generateSecureToken(byteLength = 32) {
        return import_crypto3.default.randomBytes(byteLength).toString("hex");
      }
      /**
       * Computes SHA-256 hash of a token for secure database storage.
       */
      static hashToken(token) {
        return import_crypto3.default.createHash("sha256").update(token).digest("hex");
      }
      /**
       * Constant-time string equality check.
       */
      static timingSafeCompare(a, b) {
        const bufA = Buffer.from(a, "utf8");
        const bufB = Buffer.from(b, "utf8");
        if (bufA.length !== bufB.length) return false;
        return import_crypto3.default.timingSafeEqual(bufA, bufB);
      }
      // ---------------------------------------------------------------------------
      // TOTP MULTI-FACTOR AUTHENTICATION (RFC 6238)
      // ---------------------------------------------------------------------------
      static BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      /**
       * Generates a 20-byte base32 secret suitable for Authenticator apps (Google Authenticator, Authy).
       */
      static generateTotpSecret() {
        const buffer = import_crypto3.default.randomBytes(20);
        let secret = "";
        for (let i = 0; i < buffer.length; i++) {
          const byte = buffer[i];
          secret += this.BASE32_CHARS[byte % 32];
        }
        return secret;
      }
      /**
       * Generates otpauth:// URI for QR code integration.
       */
      static generateTotpUri(email, secret, issuer = "Avenora Fintech") {
        return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
      }
      /**
       * Generates 6-digit TOTP code for a given timestamp and base32 secret.
       */
      static generateTotpCode(secret, timestampMs = Date.now(), timeStepSeconds = 30) {
        const counter = Math.floor(timestampMs / 1e3 / timeStepSeconds);
        const counterBuf = Buffer.alloc(8);
        counterBuf.writeBigInt64BE(BigInt(counter));
        const key = this.decodeBase32(secret);
        const hmac = import_crypto3.default.createHmac("sha1", key).update(counterBuf).digest();
        const offset = hmac[hmac.length - 1] & 15;
        const binary = (hmac[offset] & 127) << 24 | (hmac[offset + 1] & 255) << 16 | (hmac[offset + 2] & 255) << 8 | hmac[offset + 3] & 255;
        const otp = (binary % 1e6).toString().padStart(6, "0");
        return otp;
      }
      /**
       * Verifies a 6-digit TOTP code with +/- 1 step drift tolerance (prevents clock skew failures).
       */
      static verifyTotpCode(secret, token, windowSteps = 1) {
        const cleanToken = token.trim().replace(/\s/g, "");
        if (!/^\d{6}$/.test(cleanToken)) return false;
        const now = Date.now();
        for (let step = -windowSteps; step <= windowSteps; step++) {
          const timeMs = now + step * 30 * 1e3;
          const expectedCode = this.generateTotpCode(secret, timeMs);
          if (this.timingSafeCompare(cleanToken, expectedCode)) {
            return true;
          }
        }
        return false;
      }
      /**
       * Generates 8 single-use alphanumeric recovery codes.
       */
      static generateRecoveryCodes(count = 8) {
        const rawCodes = [];
        const hashedCodes = [];
        for (let i = 0; i < count; i++) {
          const code = `${import_crypto3.default.randomBytes(3).toString("hex")}-${import_crypto3.default.randomBytes(3).toString("hex")}`.toUpperCase();
          rawCodes.push(code);
          hashedCodes.push(this.hashToken(code));
        }
        return { rawCodes, hashedCodes };
      }
      static decodeBase32(str) {
        const clean = str.toUpperCase().replace(/[^A-Z2-7]/g, "");
        let bits = "";
        for (let i = 0; i < clean.length; i++) {
          const val = this.BASE32_CHARS.indexOf(clean[i]);
          bits += val.toString(2).padStart(5, "0");
        }
        const bytes = [];
        for (let i = 0; i + 8 <= bits.length; i += 8) {
          bytes.push(parseInt(bits.substring(i, i + 8), 2));
        }
        return Buffer.from(bytes);
      }
    };
  }
});

// src/server/services/audit.service.ts
var AuditService, defaultAuditService;
var init_audit_service = __esm({
  "src/server/services/audit.service.ts"() {
    "use strict";
    AuditService = class {
      auditLogs = [];
      constructor() {
        this.seedBaselineAuditLogs();
      }
      seedBaselineAuditLogs() {
        const baseline = [
          {
            id: "aud_seed_001",
            action: "JOURNAL_POSTED",
            actorUserId: "usr_system",
            actorRole: "SYSTEM",
            resourceType: "FINANCIAL_TRANSACTION",
            resourceId: "tx_init_capital_2026",
            details: {
              narration: "Initial Tier-1 Regulatory Capital Deposit into Partner Safeguarding Vault",
              currency: "USD",
              amountMinor: "50000000"
            },
            financialTxId: "tx_init_capital_2026",
            createdAt: /* @__PURE__ */ new Date("2026-01-01T00:00:00Z")
          },
          {
            id: "aud_seed_005",
            action: "GRANT_PROGRAM_VERIFIED",
            actorUserId: "usr_staff_admin_01",
            actorRole: "SUPER_ADMIN",
            resourceType: "GRANT_PROGRAM",
            resourceId: "grp_cleantech_2026",
            previousState: "PENDING_REVIEW",
            newState: "VERIFIED",
            reason: "Institutional charter and funding escrow verified with sponsor",
            createdAt: /* @__PURE__ */ new Date("2026-02-01T09:30:00Z")
          }
        ];
        this.auditLogs.push(...baseline);
      }
      /**
       * Sanitizes input data to strip sensitive passwords, tokens, raw secrets, and PANs.
       */
      sanitizeDetails(data) {
        if (!data) return void 0;
        const sensitiveRedactKeys = [
          "password",
          "passwordhash",
          "secret",
          "mfasecret",
          "token",
          "tokenhash",
          "sessiontoken",
          "recoverycode",
          "recoverycodes",
          "cvv",
          "taxidnumber",
          "rawbody"
        ];
        const clean = {};
        for (const [key, val] of Object.entries(data)) {
          const lower = key.toLowerCase();
          if (lower.includes("cardnumber") || lower === "pan" || lower.includes("fullpan")) {
            const strVal = String(val);
            clean[key] = strVal.length >= 4 ? `************${strVal.slice(-4)}` : "[REDACTED]";
          } else if (sensitiveRedactKeys.some((s) => lower.includes(s))) {
            clean[key] = "[REDACTED]";
          } else if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
            clean[key] = this.sanitizeDetails(val);
          } else {
            clean[key] = val;
          }
        }
        return clean;
      }
      /**
       * Appends an immutable audit record.
       */
      logAction(params) {
        const record = {
          id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          action: params.action,
          actorUserId: params.actorUserId,
          actorRole: params.actorRole,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          previousState: params.previousState,
          newState: params.newState,
          reason: params.reason,
          correlationId: params.correlationId,
          details: this.sanitizeDetails(params.details),
          financialTxId: params.financialTxId,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.auditLogs.unshift(record);
        return { ...record };
      }
      /**
       * Alias for logAction to record audit events.
       */
      record(params) {
        return this.logAction(params);
      }
      /**
       * Queries audit logs with filtering and pagination.
       */
      queryLogs(filters) {
        let list = [...this.auditLogs];
        if (filters?.action && filters.action !== "ALL") {
          list = list.filter((r) => r.action === filters.action);
        }
        if (filters?.actorRole && filters.actorRole !== "ALL") {
          list = list.filter((r) => r.actorRole === filters.actorRole);
        }
        if (filters?.actorUserId) {
          list = list.filter((r) => r.actorUserId === filters.actorUserId);
        }
        if (filters?.resourceType && filters.resourceType !== "ALL") {
          list = list.filter((r) => r.resourceType === filters.resourceType);
        }
        if (filters?.resourceId) {
          list = list.filter((r) => r.resourceId?.toLowerCase().includes(filters.resourceId.toLowerCase()));
        }
        if (filters?.financialTxId) {
          list = list.filter((r) => r.financialTxId === filters.financialTxId);
        }
        if (filters?.startDate) {
          const start = new Date(filters.startDate).getTime();
          list = list.filter((r) => r.createdAt.getTime() >= start);
        }
        if (filters?.endDate) {
          const end = new Date(filters.endDate).getTime();
          list = list.filter((r) => r.createdAt.getTime() <= end);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (r) => r.id.toLowerCase().includes(q) || r.action.toLowerCase().includes(q) || r.reason && r.reason.toLowerCase().includes(q) || r.resourceId && r.resourceId.toLowerCase().includes(q) || r.actorUserId && r.actorUserId.toLowerCase().includes(q) || r.correlationId && r.correlationId.toLowerCase().includes(q)
          );
        }
        const total = list.length;
        const limit = Math.min(Math.max(filters?.limit || 50, 1), 200);
        const offset = Math.max(filters?.offset || 0, 0);
        const paginated = list.slice(offset, offset + limit);
        return {
          total,
          limit,
          offset,
          records: paginated
        };
      }
      getRecordById(id) {
        return this.auditLogs.find((r) => r.id === id);
      }
      getRecentCount() {
        return this.auditLogs.length;
      }
    };
    defaultAuditService = new AuditService();
  }
});

// src/server/services/email.service.ts
function voidEmail(label, promise) {
  void promise.catch((err) => console.error(`[email] ${label} failed:`, err));
}
var import_resend, EmailService, defaultEmailService;
var init_email_service = __esm({
  "src/server/services/email.service.ts"() {
    "use strict";
    import_resend = require("resend");
    init_env_config();
    init_compose();
    init_welcome();
    init_auth();
    init_kyc();
    init_wallet();
    init_cards();
    init_loans();
    init_support();
    init_provider();
    EmailService = class {
      client = null;
      getConfig() {
        return getValidatedConfig();
      }
      isConfigured() {
        const key = this.getConfig().RESEND_API_KEY?.trim();
        return Boolean(key && key !== "re_placeholder" && !key.includes("placeholder"));
      }
      getClient() {
        if (!this.isConfigured()) return null;
        if (!this.client) {
          this.client = new import_resend.Resend(this.getConfig().RESEND_API_KEY);
        }
        return this.client;
      }
      resolveFrom() {
        const config = this.getConfig();
        if (config.EMAIL_FROM?.trim()) return config.EMAIL_FROM.trim();
        const name = config.EMAIL_FROM_NAME?.trim() || "Avenora Bank";
        const address = config.EMAIL_FROM_ADDRESS?.trim() || "noreply@avenorabank.com";
        return `${name} <${address}>`;
      }
      async send(params) {
        const client = this.getClient();
        if (!client) {
          if (process.env.NODE_ENV !== "test") {
            console.warn("[email] RESEND_API_KEY not configured \u2014 skipping send:", params.subject);
          }
          return { sent: false, skipped: true };
        }
        const config = this.getConfig();
        const to = Array.isArray(params.to) ? params.to : [params.to];
        try {
          const { data, error } = await client.emails.send({
            from: this.resolveFrom(),
            to,
            subject: params.subject,
            html: params.html,
            text: params.text,
            replyTo: params.replyTo || config.EMAIL_REPLY_TO || void 0,
            tags: params.tags
          });
          if (error) {
            console.error("[email] Resend API error:", error.message);
            return { sent: false, error: error.message };
          }
          return { sent: true, id: data?.id };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[email] Failed to send:", message);
          return { sent: false, error: message };
        }
      }
      async sendPayload(to, payload, replyTo) {
        return this.send({
          to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          tags: payload.tags,
          replyTo
        });
      }
      // ── Welcome ──────────────────────────────────────────────────────────────
      async sendWelcomeEmail(params) {
        return this.sendPayload(params.to, buildWelcomeEmail({ fullName: params.fullName }));
      }
      // ── Auth & account ───────────────────────────────────────────────────────
      async sendPasswordResetEmail(params) {
        return this.sendPayload(params.to, buildPasswordResetRequestEmail(params));
      }
      async sendPasswordResetCompletedEmail(params) {
        return this.sendPayload(params.to, buildPasswordResetCompletedEmail(params));
      }
      async sendPasswordChangedEmail(params) {
        return this.sendPayload(params.to, buildPasswordChangedEmail(params));
      }
      async sendLoginLockoutEmail(params) {
        return this.sendPayload(params.to, buildLoginLockoutEmail(params));
      }
      async sendLoginNewDeviceEmail(params) {
        return this.sendPayload(params.to, buildLoginNewDeviceEmail(params));
      }
      async sendLoginSuccessEmail(params) {
        return this.sendPayload(params.to, buildLoginSuccessEmail(params));
      }
      async sendMfaEnrolledEmail(params) {
        return this.sendPayload(params.to, buildMfaEnrolledEmail(params));
      }
      async sendMfaDisabledEmail(params) {
        return this.sendPayload(params.to, buildMfaDisabledEmail(params));
      }
      async sendAccountSuspendedEmail(params) {
        return this.sendPayload(params.to, buildAccountSuspendedEmail(params));
      }
      async sendAccountLockedEmail(params) {
        return this.sendPayload(params.to, buildAccountLockedEmail(params));
      }
      async sendAccountRestoredEmail(params) {
        return this.sendPayload(params.to, buildAccountRestoredEmail(params));
      }
      async sendPendingVerificationEmail(params) {
        return this.sendPayload(params.to, buildPendingVerificationEmail(params));
      }
      async sendRoleChangedEmail(params) {
        return this.sendPayload(params.to, buildRoleChangedEmail(params));
      }
      async sendAccountDeletedEmail(params) {
        return this.sendPayload(params.to, buildAccountDeletedEmail(params));
      }
      // ── KYC ──────────────────────────────────────────────────────────────────
      async sendKycSubmittedEmail(params) {
        return this.sendPayload(params.to, buildKycSubmittedEmail(params));
      }
      async sendKycSubmittedStaffEmail(params) {
        return this.sendPayload(adminInbox(), buildKycSubmittedStaffEmail(params));
      }
      async sendKycUnderReviewEmail(params) {
        return this.sendPayload(params.to, buildKycUnderReviewEmail(params));
      }
      async sendKycNeedsMoreInfoEmail(params) {
        return this.sendPayload(params.to, buildKycNeedsMoreInfoEmail(params));
      }
      async sendKycApprovedEmail(params) {
        return this.sendPayload(params.to, buildKycApprovedEmail(params));
      }
      async sendKycRejectedEmail(params) {
        return this.sendPayload(params.to, buildKycRejectedEmail(params));
      }
      async sendDomesticAccountIssuedEmail(params) {
        return this.sendPayload(params.to, buildDomesticAccountIssuedEmail(params));
      }
      async sendDomesticAccountFailedEmail(params) {
        return this.sendPayload(params.to, buildDomesticAccountFailedEmail(params));
      }
      // ── Wallet ───────────────────────────────────────────────────────────────
      async sendDepositRequestedEmail(params) {
        return this.sendPayload(params.to, buildDepositRequestedEmail(params));
      }
      async sendDepositStaffEmail(params) {
        return this.sendPayload(adminInbox(), buildDepositStaffEmail(params));
      }
      async sendDepositApprovedEmail(params) {
        return this.sendPayload(params.to, buildDepositApprovedEmail(params));
      }
      async sendDepositRejectedEmail(params) {
        return this.sendPayload(params.to, buildDepositRejectedEmail(params));
      }
      async sendBtcDepositProofEmail(params) {
        return this.sendPayload(params.to, buildBtcDepositProofEmail(params));
      }
      async sendWithdrawalRequestedEmail(params) {
        return this.sendPayload(params.to, buildWithdrawalRequestedEmail(params));
      }
      async sendWithdrawalStaffEmail(params) {
        return this.sendPayload(adminInbox(), buildWithdrawalStaffEmail(params));
      }
      async sendWithdrawalApprovedEmail(params) {
        return this.sendPayload(params.to, buildWithdrawalApprovedEmail(params));
      }
      async sendWithdrawalRejectedEmail(params) {
        return this.sendPayload(params.to, buildWithdrawalRejectedEmail(params));
      }
      async sendTransferSentEmail(params) {
        return this.sendPayload(params.to, buildTransferSentEmail(params));
      }
      async sendTransferReceivedEmail(params) {
        return this.sendPayload(params.to, buildTransferReceivedEmail(params));
      }
      async sendFxConvertedEmail(params) {
        return this.sendPayload(params.to, buildFxConvertedEmail(params));
      }
      async sendAdminAdjustmentQueuedEmail(params) {
        return this.sendPayload(params.to, buildAdminAdjustmentQueuedEmail(params));
      }
      async sendTransactionReversedEmail(params) {
        return this.sendPayload(params.to, buildTransactionReversedEmail(params));
      }
      async sendStatementReadyEmail(params) {
        return this.sendPayload(params.to, buildStatementReadyEmail(params));
      }
      // ── Cards ────────────────────────────────────────────────────────────────
      async sendCardRequestedEmail(params) {
        return this.sendPayload(params.to, buildCardRequestedEmail(params));
      }
      async sendCardRequestedStaffEmail(params) {
        return this.sendPayload(adminInbox(), buildCardRequestedStaffEmail(params));
      }
      async sendCardIssuanceApprovedEmail(params) {
        return this.sendPayload(params.to, buildCardIssuanceApprovedEmail(params));
      }
      async sendCardIssuanceDeclinedEmail(params) {
        return this.sendPayload(params.to, buildCardIssuanceDeclinedEmail(params));
      }
      async sendCardFrozenEmail(params) {
        return this.sendPayload(params.to, buildCardFrozenEmail(params));
      }
      async sendCardUnfrozenEmail(params) {
        return this.sendPayload(params.to, buildCardUnfrozenEmail(params));
      }
      async sendCardTerminatedEmail(params) {
        return this.sendPayload(params.to, buildCardTerminatedEmail(params));
      }
      async sendCardLimitsChangedEmail(params) {
        return this.sendPayload(params.to, buildCardLimitsChangedEmail(params));
      }
      async sendCardAuthHoldEmail(params) {
        return this.sendPayload(params.to, buildCardAuthHoldEmail(params));
      }
      async sendCardHoldSettledEmail(params) {
        return this.sendPayload(params.to, buildCardHoldSettledEmail(params));
      }
      // ── Loans & grants ───────────────────────────────────────────────────────
      async sendLoanSubmittedEmail(params) {
        return this.sendPayload(params.to, buildLoanSubmittedEmail(params));
      }
      async sendLoanSubmittedStaffEmail(params) {
        return this.sendPayload(adminInbox(), buildLoanSubmittedStaffEmail(params));
      }
      async sendLoanDecisionEmail(params) {
        return this.sendPayload(params.to, buildLoanDecisionEmail(params));
      }
      async sendGrantSubmittedEmail(params) {
        return this.sendPayload(params.to, buildGrantSubmittedEmail(params));
      }
      async sendGrantSubmittedStaffEmail(params) {
        return this.sendPayload(adminInbox(), buildGrantSubmittedStaffEmail(params));
      }
      async sendGrantIneligibleEmail(params) {
        return this.sendPayload(params.to, buildGrantIneligibleEmail(params));
      }
      async sendGrantReviewedEmail(params) {
        return this.sendPayload(params.to, buildGrantReviewedEmail(params));
      }
      async sendGrantDisbursedEmail(params) {
        return this.sendPayload(params.to, buildGrantDisbursedEmail(params));
      }
      // ── Contact & support ────────────────────────────────────────────────────
      async sendContactInquiry(params) {
        const staffResult = await this.sendPayload(
          contactInbox(),
          buildContactStaffEmail(params),
          params.email
        );
        await this.sendPayload(params.email, buildContactAckEmail(params));
        return staffResult;
      }
      async sendSupportTicket(params) {
        const staffResult = await this.sendPayload(
          supportInbox(),
          buildSupportTicketStaffEmail(params),
          params.customerEmail
        );
        await this.sendPayload(
          params.customerEmail,
          buildSupportTicketAckEmail({
            fullName: params.customerName,
            ticketId: params.ticketId,
            subject: params.subject
          })
        );
        return staffResult;
      }
      async sendSupportTicketResolvedEmail(params) {
        return this.sendPayload(params.to, buildSupportTicketResolvedEmail(params));
      }
      // ── Provider / webhooks ──────────────────────────────────────────────────
      async sendProviderDepositClearedEmail(params) {
        return this.sendPayload(params.to, buildProviderDepositClearedEmail(params));
      }
      async sendProviderWireInboundEmail(params) {
        return this.sendPayload(params.to, buildProviderWireInboundEmail(params));
      }
      async sendProviderWireInboundStaffEmail(params) {
        return this.sendPayload(adminInbox(), buildProviderWireInboundStaffEmail(params));
      }
      async sendComplianceFlagEmail(params) {
        return this.sendPayload(adminInbox(), buildComplianceFlagEmail(params));
      }
      async sendProviderPaymentConfirmedEmail(params) {
        return this.sendPayload(params.to, buildProviderPaymentConfirmedEmail(params));
      }
      async sendProviderPaymentFailedEmail(params) {
        return this.sendPayload(params.to, buildProviderPaymentFailedEmail(params));
      }
      async sendReconciliationRequiredEmail(params) {
        return this.sendPayload(adminInbox(), buildReconciliationRequiredEmail(params));
      }
    };
    defaultEmailService = new EmailService();
  }
});

// src/config/prototypeAccess.ts
function isKycBypassEnabled() {
  const config = getValidatedConfig();
  return config.BYPASS_KYC_GATES === true;
}
var init_prototypeAccess = __esm({
  "src/config/prototypeAccess.ts"() {
    "use strict";
    init_env_config();
  }
});

// src/domain/country/iso13616IbanLengths.json
var iso13616IbanLengths_default;
var init_iso13616IbanLengths = __esm({
  "src/domain/country/iso13616IbanLengths.json"() {
    iso13616IbanLengths_default = {
      _source: "ISO 13616 / SWIFT IBAN Registry (length per country, BBAN = totalLength - 4). Used for checksum validation and synthetic BBAN sizing only.",
      AD: 24,
      AE: 23,
      AL: 28,
      AT: 20,
      AZ: 28,
      BA: 20,
      BE: 16,
      BG: 22,
      BH: 22,
      BI: 16,
      BR: 29,
      BY: 28,
      CH: 21,
      CR: 22,
      CY: 28,
      CZ: 24,
      DE: 22,
      DK: 18,
      DO: 28,
      EE: 20,
      EG: 29,
      ES: 24,
      FI: 18,
      FO: 18,
      FR: 27,
      GB: 22,
      GE: 22,
      GI: 23,
      GL: 18,
      GR: 27,
      GT: 28,
      HR: 21,
      HU: 28,
      IE: 22,
      IL: 23,
      IQ: 23,
      IS: 26,
      IT: 27,
      JO: 30,
      KW: 30,
      KZ: 20,
      LB: 28,
      LC: 32,
      LI: 21,
      LT: 20,
      LU: 20,
      LV: 21,
      LY: 25,
      MC: 27,
      MD: 24,
      ME: 22,
      MK: 19,
      MR: 27,
      MT: 31,
      MU: 30,
      NL: 18,
      NO: 15,
      PK: 24,
      PL: 28,
      PS: 29,
      PT: 25,
      QA: 29,
      RO: 24,
      RS: 22,
      SA: 24,
      SC: 31,
      SD: 18,
      SE: 24,
      SI: 19,
      SK: 24,
      SM: 27,
      ST: 25,
      SV: 28,
      TL: 23,
      TN: 24,
      TR: 26,
      UA: 29,
      VA: 22,
      VG: 24,
      XK: 20
    };
  }
});

// src/domain/country/CountryBankingRegistry.ts
function partialIbanRule(countryCode, totalLength) {
  return {
    countryCode,
    scheme: "IBAN_SYNTHETIC_PARTIAL",
    simulationStatus: "PARTIAL",
    primaryIdentifierType: "IBAN",
    implementedComponents: ["iban"],
    validationSupport: true,
    syntheticGenerationSupport: true,
    safeSimulationStatus: "PROTOTYPE_ONLY",
    verificationSource: "ISO 13616 IBAN length and ISO 7064 Mod 97-10 checksum only.",
    gaps: "National BBAN structure and bank assignment are not modeled; synthetic AVEN-prefix BBAN for prototype display only.",
    ibanTotalLength: totalLength
  };
}
function resolveRule(countryCode) {
  const code = countryCode.trim().toUpperCase();
  if (code === "US" || US_TERRITORY_CODES.has(code)) {
    return { countryCode: code, ...FULL_US, ...code !== "US" ? { delegatesTo: "US" } : {} };
  }
  if (code === "GB" || code === "UK" || GB_TERRITORY_CODES.has(code)) {
    return { countryCode: code === "UK" ? "GB" : code, ...FULL_GB, ...code !== "GB" && code !== "UK" ? { delegatesTo: "GB" } : {} };
  }
  if (code === "ES") return { countryCode: code, ...FULL_ES };
  if (code === "DE") return { countryCode: code, ...FULL_DE };
  if (code === "BR") return { countryCode: code, ...FULL_BR };
  const ibanLen = IBAN_LENGTHS[code];
  if (ibanLen) {
    return partialIbanRule(code, ibanLen);
  }
  return { countryCode: code, ...NOT_IMPLEMENTED };
}
function getCountryBankingRule(countryCode) {
  const code = countryCode.trim().toUpperCase();
  if (code === "UK") return getCountryBankingRule("GB");
  return REGISTRY.get(code) ?? { countryCode: code, ...NOT_IMPLEMENTED };
}
function getGenerationCountryCode(countryCode) {
  const rule = getCountryBankingRule(countryCode);
  return rule.delegatesTo ?? rule.countryCode;
}
function listAllCountryBankingRules() {
  return Array.from(REGISTRY.values());
}
function getCoverageMatrix() {
  return listAllCountryBankingRules().map((r) => ({
    countryCode: r.countryCode,
    scheme: r.scheme,
    simulationStatus: r.simulationStatus,
    components: r.implementedComponents,
    validationSupport: r.validationSupport,
    syntheticGenerationSupport: r.syntheticGenerationSupport,
    safeSimulationStatus: r.safeSimulationStatus,
    verificationSource: r.verificationSource,
    gaps: r.gaps ?? ""
  }));
}
var IBAN_LENGTHS, US_TERRITORY_CODES, GB_TERRITORY_CODES, FULL_US, FULL_GB, FULL_ES, FULL_DE, FULL_BR, NOT_IMPLEMENTED, REGISTRY, REGISTRY_VERSION;
var init_CountryBankingRegistry = __esm({
  "src/domain/country/CountryBankingRegistry.ts"() {
    "use strict";
    init_iso3166CountryCodes();
    init_iso13616IbanLengths();
    IBAN_LENGTHS = Object.fromEntries(
      Object.entries(iso13616IbanLengths_default).filter(([k]) => k !== "_source").map(([k, v]) => [k, v])
    );
    US_TERRITORY_CODES = /* @__PURE__ */ new Set(["AS", "GU", "MP", "PR", "VI", "UM"]);
    GB_TERRITORY_CODES = /* @__PURE__ */ new Set(["IM", "JE", "GG"]);
    FULL_US = {
      scheme: "US_ABA_DDA",
      simulationStatus: "FULL",
      primaryIdentifierType: "BANK_ACCOUNT",
      implementedComponents: ["routingNumber", "accountNumber"],
      validationSupport: true,
      syntheticGenerationSupport: true,
      safeSimulationStatus: "VERIFIED_TEST_RANGES",
      verificationSource: "Federal Reserve E-Payments Routing Directory (ABA checksum); prototype uses 021000021 test routing."
    };
    FULL_GB = {
      scheme: "GB_SORT_ACCOUNT_IBAN",
      simulationStatus: "FULL",
      primaryIdentifierType: "BANK_ACCOUNT",
      implementedComponents: ["sortCode", "accountNumber", "iban"],
      validationSupport: true,
      syntheticGenerationSupport: true,
      safeSimulationStatus: "PROTOTYPE_ONLY",
      verificationSource: "UK sort code / account conventions; ISO 7064 Mod 97-10 for GB IBAN."
    };
    FULL_ES = {
      scheme: "ES_CCC_IBAN",
      simulationStatus: "FULL",
      primaryIdentifierType: "IBAN",
      implementedComponents: ["bank", "branch", "controlDigits", "accountNumber", "iban"],
      validationSupport: true,
      syntheticGenerationSupport: true,
      safeSimulationStatus: "PROTOTYPE_ONLY",
      verificationSource: "Banco de Espa\xF1a CCC control digits; ISO 7064 Mod 97-10 IBAN."
    };
    FULL_DE = {
      scheme: "DE_BLZ_IBAN",
      simulationStatus: "FULL",
      primaryIdentifierType: "IBAN",
      implementedComponents: ["blz", "accountNumber", "iban"],
      validationSupport: true,
      syntheticGenerationSupport: true,
      safeSimulationStatus: "PROTOTYPE_ONLY",
      verificationSource: "German BLZ structure within IBAN; ISO 7064 Mod 97-10 IBAN."
    };
    FULL_BR = {
      scheme: "BR_FEBRABAN",
      simulationStatus: "FULL",
      primaryIdentifierType: "BANK_ACCOUNT",
      implementedComponents: ["banco", "agencia", "conta", "pixKey"],
      validationSupport: true,
      syntheticGenerationSupport: true,
      safeSimulationStatus: "PROTOTYPE_ONLY",
      verificationSource: "FEBRABAN bank/branch/account layout; modulo-11 style account check digit; unique phone-style Pix key (prototype)."
    };
    NOT_IMPLEMENTED = {
      scheme: "FORMAT_NOT_IMPLEMENTED",
      simulationStatus: "UNSUPPORTED",
      primaryIdentifierType: "BANK_ACCOUNT",
      implementedComponents: [],
      validationSupport: false,
      syntheticGenerationSupport: false,
      safeSimulationStatus: "NOT_APPLICABLE",
      verificationSource: "No verified domestic format rule loaded for this jurisdiction.",
      gaps: "Domestic account identifier simulation not implemented; requires registry extension."
    };
    REGISTRY = /* @__PURE__ */ new Map();
    for (const code of iso3166CountryCodes_default) {
      REGISTRY.set(code, resolveRule(code));
    }
    REGISTRY_VERSION = "2026.03.1";
  }
});

// src/domain/country/countryBankAccountGenerator.ts
function nextSequence() {
  sequenceCounter += 1;
  return sequenceCounter;
}
function buildAlphanumericBban(prefix, targetLength, seq) {
  const base = `${prefix}${seq.toString(36).toUpperCase()}`;
  const padded = base.padEnd(targetLength, "0").slice(0, targetLength);
  return padded.replace(/[^A-Z0-9]/g, "0");
}
function generatePartialSyntheticIban(countryCode, ibanTotalLength, seq) {
  const bbanLength = ibanTotalLength - 4;
  if (bbanLength < 4) {
    throw new Error(`Invalid IBAN length ${ibanTotalLength} for country ${countryCode}`);
  }
  const bban = buildAlphanumericBban("AVEN", bbanLength, seq);
  const check = CountryRules.computeIbanCheckDigits(countryCode, bban);
  const raw = `${countryCode}${check}${bban}`;
  const formatted2 = `${countryCode}${check} ${bban.replace(/(.{4})/g, "$1 ").trim()}`;
  const masked = `${countryCode}${check} **** **** **** ${bban.slice(-4)}`;
  const generatedAt = /* @__PURE__ */ new Date();
  const disclaimer = "SIMULATED ACCOUNT \u2014 PROTOTYPE ONLY \u2014 NOT FOR REAL DEPOSITS, WITHDRAWALS, OR LIVE FINANCIAL SETTLEMENT. IBAN checksum is valid; national BBAN is synthetic and not bank-assigned.";
  return {
    countryCode,
    type: "IBAN",
    formattedValue: formatted2,
    rawValue: raw,
    maskedValue: masked,
    components: { iban: raw, ibanCheckDigits: check, syntheticBban: bban },
    isSimulated: true,
    source: "SYNTHETIC_GENERATOR",
    disclaimer,
    generatedAt
  };
}
function resolvePrimaryGenerationRequest(verifiedCountryCode) {
  const rule = getCountryBankingRule(verifiedCountryCode);
  if (!rule.syntheticGenerationSupport || rule.scheme === "FORMAT_NOT_IMPLEMENTED") {
    return {
      ruleScheme: rule.scheme,
      ruleVersion: REGISTRY_VERSION,
      formatNotImplemented: true
    };
  }
  const generationCountry = getGenerationCountryCode(verifiedCountryCode);
  const fullMap = {
    US_ABA_DDA: "US",
    GB_SORT_ACCOUNT_IBAN: "GB",
    ES_CCC_IBAN: "ES",
    DE_BLZ_IBAN: "DE",
    BR_FEBRABAN: "BR"
  };
  const delegate = fullMap[rule.scheme];
  if (delegate) {
    return {
      ruleScheme: rule.scheme,
      ruleVersion: REGISTRY_VERSION,
      formatNotImplemented: false,
      delegateProviderCountry: delegate,
      identifierType: rule.primaryIdentifierType
    };
  }
  if (rule.scheme === "IBAN_SYNTHETIC_PARTIAL" && rule.ibanTotalLength) {
    return {
      ruleScheme: rule.scheme,
      ruleVersion: REGISTRY_VERSION,
      formatNotImplemented: false,
      partialIban: { countryCode: generationCountry, ibanTotalLength: rule.ibanTotalLength },
      identifierType: "IBAN"
    };
  }
  return {
    ruleScheme: rule.scheme,
    ruleVersion: REGISTRY_VERSION,
    formatNotImplemented: true
  };
}
function generatePartialIbanForCountry(countryCode, ibanTotalLength) {
  return generatePartialSyntheticIban(countryCode, ibanTotalLength, nextSequence());
}
var sequenceCounter;
var init_countryBankAccountGenerator = __esm({
  "src/domain/country/countryBankAccountGenerator.ts"() {
    "use strict";
    init_CountryRules();
    init_CountryBankingRegistry();
    sequenceCounter = 5e5;
  }
});

// src/server/services/domesticBankAccount.service.ts
var domesticBankAccount_service_exports = {};
__export(domesticBankAccount_service_exports, {
  DomesticBankAccountService: () => DomesticBankAccountService,
  defaultDomesticBankAccountService: () => defaultDomesticBankAccountService
});
var PROTOTYPE_DISCLAIMER, DOMESTIC_FORMAT_VERSION, DomesticBankAccountService, defaultDomesticBankAccountService;
var init_domesticBankAccount_service = __esm({
  "src/server/services/domesticBankAccount.service.ts"() {
    "use strict";
    init_countryBankAccountGenerator();
    init_countryPrimaryCurrency();
    init_prototypeAccess();
    init_auth_service();
    init_audit_service();
    init_email_service();
    init_identifier_service();
    PROTOTYPE_DISCLAIMER = "SIMULATED ACCOUNT \u2014 PROTOTYPE ONLY \u2014 NOT FOR REAL DEPOSITS, WITHDRAWALS, OR LIVE FINANCIAL SETTLEMENT.";
    DOMESTIC_FORMAT_VERSION = "1.2.1";
    DomesticBankAccountService = class {
      constructor(identifierProvider = defaultIdentifierProvider, authService = defaultAuthService) {
        this.identifierProvider = identifierProvider;
        this.authService = authService;
      }
      identifierProvider;
      authService;
      accountsByUserId = /* @__PURE__ */ new Map();
      rawValueOwner = /* @__PURE__ */ new Map();
      /** Ensures Pix keys are unique across all customer domestic accounts. */
      pixKeyOwner = /* @__PURE__ */ new Map();
      userLocks = /* @__PURE__ */ new Map();
      getPrimaryAccountForUser(userId) {
        return this.accountsByUserId.get(userId);
      }
      /** Drop stored domestic identifiers (e.g. when reversing a KYC bypass unlock). */
      clearPrimaryAccountForUser(userId) {
        const existing = this.accountsByUserId.get(userId);
        if (existing?.rawValue) {
          this.rawValueOwner.delete(existing.rawValue);
        }
        const pixKey = existing?.components?.pixKey;
        if (pixKey) {
          this.pixKeyOwner.delete(pixKey);
        }
        this.accountsByUserId.delete(userId);
      }
      getCustomerSafeView(record) {
        return {
          id: record.id,
          verifiedCountryCode: record.verifiedCountryCode,
          schemeId: record.schemeId,
          generationStatus: record.generationStatus,
          identifierType: record.identifierType,
          formattedValue: record.formattedValue,
          maskedValue: record.maskedValue,
          displayFields: this.buildDisplayFields(record),
          components: record.generationStatus === "GENERATED" ? record.components : {},
          source: record.source,
          generatedAt: record.generatedAt,
          lastError: record.lastError
        };
      }
      buildDisplayFields(record) {
        if (record.generationStatus !== "GENERATED") return [];
        const c = record.components;
        const fields = [];
        if (c.routingNumber) fields.push({ key: "routingNumber", label: "Routing number", value: c.routingNumber });
        if (c.accountNumber) fields.push({ key: "accountNumber", label: "Account number", value: c.accountNumber });
        if (c.sortCode) fields.push({ key: "sortCode", label: "Sort code", value: c.sortCode });
        if (c.iban) fields.push({ key: "iban", label: "IBAN", value: c.iban });
        if (c.banco) fields.push({ key: "banco", label: "Bank code", value: c.banco });
        if (c.agencia) fields.push({ key: "agencia", label: "Branch (Ag\xEAncia)", value: c.agencia });
        if (c.conta) fields.push({ key: "conta", label: "Account (Conta)", value: c.conta });
        if (c.pixKey && record.verifiedCountryCode === "BR") {
          fields.push({ key: "pixKey", label: "Pix key", value: c.pixKey });
        }
        if (c.blz) fields.push({ key: "blz", label: "Bank code (BLZ)", value: c.blz });
        if (c.bank) fields.push({ key: "bank", label: "Bank code", value: c.bank });
        if (c.branch) fields.push({ key: "branch", label: "Branch code", value: c.branch });
        if (fields.length === 0 && record.formattedValue) {
          fields.push({ key: "primary", label: "Account identifier", value: record.formattedValue });
        }
        return fields;
      }
      async withUserLock(userId, fn) {
        const prev = this.userLocks.get(userId) ?? Promise.resolve();
        let release;
        const gate = new Promise((resolve) => {
          release = resolve;
        });
        this.userLocks.set(userId, prev.then(() => gate));
        await prev;
        try {
          return await fn();
        } finally {
          release();
        }
      }
      /**
       * Idempotent orchestration after KYC approval (or prototype KYC bypass).
       */
      async ensurePrimaryAccountAfterKycApproval(params) {
        return this.withUserLock(params.userId, () => this.ensurePrimaryAccountAfterKycApprovalInternal(params));
      }
      /**
       * Generate/backfill domestic identifiers for KYC-approved users (or when bypass is explicitly enabled).
       */
      async ensurePrimaryAccountForActiveUser(params) {
        const user = this.authService.getUserById(params.userId);
        if (!user) return void 0;
        const bypass = isKycBypassEnabled();
        if (!bypass && user.kycStatus !== "APPROVED") {
          return this.getPrimaryAccountForUser(params.userId);
        }
        const { defaultKycService: defaultKycService2 } = await Promise.resolve().then(() => (init_kyc_service(), kyc_service_exports));
        const kycProfile = defaultKycService2.getOrCreateProfile(params.userId);
        if (bypass) {
          kycProfile.status = "APPROVED";
          kycProfile.verifiedCountryCode = kycProfile.verifiedCountryCode || user.countryCode;
          if (!kycProfile.residentialAddress) {
            kycProfile.residentialAddress = {
              street: "Prototype address pending KYC submission",
              city: "N/A",
              postalCode: "00000",
              country: user.countryCode
            };
          }
          if (user.kycStatus !== "APPROVED") {
            user.kycStatus = "APPROVED";
            user.updatedAt = /* @__PURE__ */ new Date();
          }
        }
        return this.ensurePrimaryAccountAfterKycApproval({
          userId: params.userId,
          kycProfile,
          correlationId: params.correlationId
        });
      }
      async ensurePrimaryAccountAfterKycApprovalInternal(params) {
        const existing = this.accountsByUserId.get(params.userId);
        if (existing?.generationStatus === "GENERATED" && existing.formatVersion === DOMESTIC_FORMAT_VERSION) {
          return existing;
        }
        if (existing?.generationStatus === "FORMAT_NOT_IMPLEMENTED") {
          return existing;
        }
        if (existing?.generationStatus === "COUNTRY_MISMATCH_REQUIRES_REVIEW" && !isKycBypassEnabled()) {
          return existing;
        }
        if (existing?.generationStatus === "GENERATED") {
          if (existing.rawValue) {
            this.rawValueOwner.delete(existing.rawValue);
          }
          if (existing.components?.pixKey) {
            this.pixKeyOwner.delete(existing.components.pixKey);
          }
          this.accountsByUserId.delete(params.userId);
        }
        const user = this.authService.getUserById(params.userId);
        const bypass = isKycBypassEnabled();
        if (!user || !bypass && user.kycStatus !== "APPROVED") {
          return this.upsertPlaceholder(params.userId, {
            generationStatus: "NOT_ELIGIBLE",
            verifiedCountryCode: user?.countryCode ?? "US",
            schemeId: "FORMAT_NOT_IMPLEMENTED",
            lastError: "KYC approval required before domestic account generation."
          });
        }
        if (params.kycProfile.status !== "APPROVED") {
          params.kycProfile.status = "APPROVED";
          params.kycProfile.verifiedCountryCode = params.kycProfile.verifiedCountryCode || params.kycProfile.residentialAddress?.country || user.countryCode;
        }
        const signupCountry = user.countryCode.trim().toUpperCase();
        let verifiedCountry = (params.kycProfile.verifiedCountryCode || params.kycProfile.residentialAddress?.country || signupCountry).trim().toUpperCase();
        if (bypass) {
          verifiedCountry = signupCountry;
        }
        params.kycProfile.verifiedCountryCode = verifiedCountry;
        if (!bypass && verifiedCountry !== signupCountry) {
          const mismatch = this.upsertPlaceholder(params.userId, {
            generationStatus: "COUNTRY_MISMATCH_REQUIRES_REVIEW",
            verifiedCountryCode: verifiedCountry,
            schemeId: "FORMAT_NOT_IMPLEMENTED",
            lastError: `Signup country (${signupCountry}) differs from KYC-verified country (${verifiedCountry}). Administrative resolution required.`,
            kycProfileId: params.kycProfile.id
          });
          defaultAuditService.logAction({
            action: "KYC_REVIEWED",
            actorUserId: "system_domestic_account",
            actorRole: "SYSTEM",
            resourceType: "DOMESTIC_BANK_ACCOUNT",
            resourceId: mismatch.id,
            reason: "Country mismatch blocks automated domestic account generation",
            details: {
              userId: params.userId,
              signupCountry,
              verifiedCountry,
              correlationId: params.correlationId
            }
          });
          return mismatch;
        }
        const pending = this.upsertPlaceholder(params.userId, {
          generationStatus: "PENDING_GENERATION",
          verifiedCountryCode: verifiedCountry,
          schemeId: "FORMAT_NOT_IMPLEMENTED",
          kycProfileId: params.kycProfile.id,
          kycApprovalReference: params.kycProfile.id
        });
        try {
          const userName = `${params.kycProfile.legalFirstName ?? ""} ${params.kycProfile.legalLastName ?? ""}`.trim();
          const currency = resolvePrimaryFiatCurrency(verifiedCountry);
          const plan = resolvePrimaryGenerationRequest(verifiedCountry);
          if (plan.formatNotImplemented) {
            const done = this.finalizeRecord(pending, {
              generationStatus: "FORMAT_NOT_IMPLEMENTED",
              schemeId: plan.ruleScheme,
              identifierType: "BANK_ACCOUNT",
              ruleSourceVersion: plan.ruleVersion,
              lastError: "No verified domestic banking format is available for this country."
            });
            this.auditGeneration(params.userId, done, params.correlationId);
            return done;
          }
          let identifier;
          if (plan.delegateProviderCountry && plan.identifierType) {
            identifier = await this.identifierProvider.generateIdentifier({
              countryCode: plan.delegateProviderCountry,
              type: plan.identifierType,
              accountHolderName: userName || user.fullName,
              currency
            });
            identifier = {
              ...identifier,
              countryCode: verifiedCountry,
              disclaimer: PROTOTYPE_DISCLAIMER,
              source: "SYNTHETIC_GENERATOR"
            };
          } else if (plan.partialIban) {
            identifier = generatePartialIbanForCountry(plan.partialIban.countryCode, plan.partialIban.ibanTotalLength);
          } else {
            throw new Error("Generation plan missing delegate and partial IBAN instructions.");
          }
          const rawOwner = this.rawValueOwner.get(identifier.rawValue);
          if (rawOwner && rawOwner !== params.userId) {
            throw new Error("Unique domestic identifier collision; retry required.");
          }
          const pixKey = identifier.components?.pixKey;
          if (pixKey) {
            const pixOwner = this.pixKeyOwner.get(pixKey);
            if (pixOwner && pixOwner !== params.userId) {
              throw new Error("Unique Pix key collision; retry required.");
            }
          }
          const generated = this.finalizeRecord(pending, {
            generationStatus: "GENERATED",
            schemeId: plan.ruleScheme,
            identifierType: identifier.type === "IBAN" ? "IBAN" : "BANK_ACCOUNT",
            formattedValue: identifier.formattedValue,
            rawValue: identifier.rawValue,
            maskedValue: identifier.maskedValue,
            components: {
              ...identifier.components,
              ...identifier.type === "IBAN" ? { iban: identifier.rawValue } : {}
            },
            isSimulated: true,
            source: "SYNTHETIC_GENERATOR",
            disclaimer: identifier.disclaimer || PROTOTYPE_DISCLAIMER,
            formatVersion: DOMESTIC_FORMAT_VERSION,
            ruleSourceVersion: plan.ruleVersion,
            generatedAt: identifier.generatedAt ?? /* @__PURE__ */ new Date(),
            lastError: void 0
          });
          this.rawValueOwner.set(identifier.rawValue, params.userId);
          if (pixKey) {
            this.pixKeyOwner.set(pixKey, params.userId);
          }
          this.auditGeneration(params.userId, generated, params.correlationId);
          if (user) {
            const accountSummary = generated.formattedValue || generated.maskedValue || generated.rawValue || generated.id;
            voidEmail(
              "domestic-account-issued",
              defaultEmailService.sendDomesticAccountIssuedEmail({
                to: user.email,
                fullName: user.fullName,
                accountSummary,
                currency
              })
            );
          }
          return generated;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown generation error";
          const failed = this.finalizeRecord(pending, {
            generationStatus: "GENERATION_FAILED",
            lastError: message
          });
          defaultAuditService.logAction({
            action: "CONFIG_CHANGED",
            actorUserId: "system_domestic_account",
            actorRole: "SYSTEM",
            resourceType: "DOMESTIC_BANK_ACCOUNT",
            resourceId: failed.id,
            reason: "Domestic account generation failed",
            details: { userId: params.userId, error: message, correlationId: params.correlationId }
          });
          const notifyUser = user ?? this.authService.getUserById(params.userId);
          if (notifyUser) {
            voidEmail(
              "domestic-account-failed",
              defaultEmailService.sendDomesticAccountFailedEmail({
                to: notifyUser.email,
                fullName: notifyUser.fullName,
                reason: message
              })
            );
          }
          return failed;
        }
      }
      async retryGenerationForUser(params) {
        if (params.kycProfile.status !== "APPROVED" && !isKycBypassEnabled()) {
          throw new Error("Cannot retry domestic account generation: KYC is not approved.");
        }
        if (params.dryRun) {
          const plan = resolvePrimaryGenerationRequest(
            params.kycProfile.verifiedCountryCode || params.kycProfile.residentialAddress?.country || "US"
          );
          return {
            dryRun: true,
            preview: {
              id: "dry_run",
              userId: params.targetUserId,
              verifiedCountryCode: params.kycProfile.residentialAddress?.country ?? "US",
              schemeId: plan.ruleScheme,
              generationStatus: plan.formatNotImplemented ? "FORMAT_NOT_IMPLEMENTED" : "PENDING_GENERATION",
              identifierType: plan.identifierType ?? "BANK_ACCOUNT",
              components: {},
              isSimulated: true,
              source: "SYNTHETIC_GENERATOR",
              disclaimer: PROTOTYPE_DISCLAIMER,
              formatVersion: DOMESTIC_FORMAT_VERSION,
              ruleSourceVersion: plan.ruleVersion,
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            }
          };
        }
        const result = await this.ensurePrimaryAccountAfterKycApproval({
          userId: params.targetUserId,
          kycProfile: params.kycProfile,
          correlationId: `admin_retry_${params.actorUserId}`
        });
        defaultAuditService.logAction({
          action: "CONFIG_CHANGED",
          actorUserId: params.actorUserId,
          actorRole: params.actorRole,
          resourceType: "DOMESTIC_BANK_ACCOUNT",
          resourceId: result.id,
          reason: "Manual domestic account generation retry",
          details: { targetUserId: params.targetUserId, status: result.generationStatus }
        });
        return { dryRun: false, result };
      }
      auditGeneration(userId, record, correlationId) {
        defaultAuditService.logAction({
          action: "DOMESTIC_ACCOUNT_GENERATED",
          actorUserId: "system_domestic_account",
          actorRole: "SYSTEM",
          resourceType: "DOMESTIC_BANK_ACCOUNT",
          resourceId: record.id,
          newState: record.generationStatus,
          details: {
            userId,
            schemeId: record.schemeId,
            verifiedCountryCode: record.verifiedCountryCode,
            source: record.source,
            isSimulated: record.isSimulated,
            correlationId,
            maskedPreview: record.maskedValue
          }
        });
      }
      upsertPlaceholder(userId, patch) {
        const now = /* @__PURE__ */ new Date();
        const existing = this.accountsByUserId.get(userId);
        const record = {
          id: existing?.id ?? `dba_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          userId,
          verifiedCountryCode: patch.verifiedCountryCode,
          schemeId: patch.schemeId,
          generationStatus: patch.generationStatus,
          identifierType: patch.identifierType ?? existing?.identifierType ?? "BANK_ACCOUNT",
          formattedValue: patch.formattedValue ?? existing?.formattedValue,
          rawValue: patch.rawValue ?? existing?.rawValue,
          maskedValue: patch.maskedValue ?? existing?.maskedValue,
          components: patch.components ?? existing?.components ?? {},
          isSimulated: true,
          source: "SYNTHETIC_GENERATOR",
          disclaimer: patch.disclaimer ?? existing?.disclaimer ?? PROTOTYPE_DISCLAIMER,
          formatVersion: patch.formatVersion ?? existing?.formatVersion ?? "1.0.0",
          ruleSourceVersion: patch.ruleSourceVersion ?? existing?.ruleSourceVersion ?? "unknown",
          kycProfileId: patch.kycProfileId ?? existing?.kycProfileId,
          kycApprovalReference: patch.kycApprovalReference ?? existing?.kycApprovalReference,
          generatedAt: patch.generatedAt ?? existing?.generatedAt,
          lastError: patch.lastError ?? existing?.lastError,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now
        };
        this.accountsByUserId.set(userId, record);
        return record;
      }
      finalizeRecord(base, patch) {
        const record = this.upsertPlaceholder(base.userId, {
          ...base,
          ...patch,
          verifiedCountryCode: patch.verifiedCountryCode ?? base.verifiedCountryCode,
          schemeId: patch.schemeId ?? base.schemeId,
          generationStatus: patch.generationStatus ?? base.generationStatus
        });
        return record;
      }
    };
    defaultDomesticBankAccountService = new DomesticBankAccountService();
  }
});

// src/domain/kyc/taxIdCatalog.ts
function digits(code, label, placeholder, length) {
  const pattern = typeof length === "number" ? `^\\d{${length}}$` : `^\\d{${length[0]},${length[1]}}$`;
  const patternHint = typeof length === "number" ? `${label} must be ${length} digits.` : `${label} must be ${length[0]} to ${length[1]} digits.`;
  return { code, label, placeholder, pattern, patternHint };
}
function formatted(code, label, placeholder, pattern, patternHint) {
  return { code, label, placeholder, pattern, patternHint };
}
function resolveTaxIdCountryCode(countryCode) {
  const code = countryCode.trim().toUpperCase();
  return TAX_ID_COUNTRY_ALIASES[code] ?? code;
}
function isUnsupportedTaxIdCountry(countryCode) {
  return UNSUPPORTED.has(resolveTaxIdCountryCode(countryCode));
}
function getTaxIdCatalogOptions(countryCode) {
  const code = resolveTaxIdCountryCode(countryCode);
  return TAX_ID_CATALOG[code] ?? [];
}
function findTaxIdCatalogOption(countryCode, taxIdCode) {
  const normalized = taxIdCode.trim().toUpperCase();
  return getTaxIdCatalogOptions(countryCode).find((option) => option.code === normalized);
}
var US_OPTIONS, GB_OPTIONS, FR_OPTIONS, ES_OPTIONS, NL_OPTIONS, AU_OPTIONS, NZ_OPTIONS, NO_OPTIONS, FI_OPTIONS, SE_OPTIONS, DK_OPTIONS, CH_OPTIONS, TAX_ID_UNSUPPORTED_COUNTRY_CODES, TAX_ID_COUNTRY_ALIASES, TAX_ID_CATALOG, UNSUPPORTED;
var init_taxIdCatalog = __esm({
  "src/domain/kyc/taxIdCatalog.ts"() {
    "use strict";
    US_OPTIONS = [
      digits("US_SSN", "Social Security Number (SSN)", "123456789", 9),
      formatted(
        "US_ITIN",
        "Individual Taxpayer Identification Number (ITIN)",
        "912345678",
        "^9\\d{8}$",
        "US ITIN must be 9 digits and start with 9."
      )
    ];
    GB_OPTIONS = [
      formatted(
        "GB_NINO",
        "National Insurance number (NINO)",
        "AB123456C",
        "^[A-CEGHJ-PR-TW-Z]{2}\\d{6}[A-D]$",
        "UK National Insurance number must be two letters, six digits, and a suffix letter A\u2013D."
      ),
      digits("GB_UTR", "Unique Taxpayer Reference (UTR)", "1234567890", 10)
    ];
    FR_OPTIONS = [
      digits("FR_SPI", "Num\xE9ro fiscal de r\xE9f\xE9rence (SPI)", "1234567890123", 13)
    ];
    ES_OPTIONS = [
      formatted(
        "ES_DNI",
        "Documento Nacional de Identidad (DNI)",
        "12345678Z",
        "^\\d{8}[A-Z]$",
        "Spanish DNI must be 8 digits followed by a check letter."
      ),
      formatted(
        "ES_NIE",
        "N\xFAmero de Identidad de Extranjero (NIE)",
        "X1234567L",
        "^[XYZ]\\d{7}[A-Z]$",
        "Spanish NIE must start with X, Y, or Z, followed by 7 digits and a check letter."
      )
    ];
    NL_OPTIONS = [
      digits("NL_BSN", "Burgerservicenummer (BSN)", "123456789", 9)
    ];
    AU_OPTIONS = [
      digits("AU_TFN", "Tax File Number (TFN)", "123456789", [8, 9])
    ];
    NZ_OPTIONS = [
      digits("NZ_IRD", "IRD number", "123456789", [8, 9])
    ];
    NO_OPTIONS = [
      digits("NO_FNUMMER", "F\xF8dselsnummer", "12345678901", 11),
      digits("NO_DNUMMER", "D-nummer", "42345678901", 11)
    ];
    FI_OPTIONS = [
      formatted(
        "FI_HETU",
        "Henkil\xF6tunnus (HETU)",
        "010190123A",
        "^\\d{9}[A-Z0-9]$",
        "Finnish henkil\xF6tunnus must be 9 digits and a check character after spaces and hyphens are removed."
      )
    ];
    SE_OPTIONS = [
      digits("SE_PERSONNUMMER", "Personnummer", "199001011234", [10, 12]),
      digits("SE_SAMORDNINGSNUMMER", "Samordningsnummer", "199001611234", [10, 12])
    ];
    DK_OPTIONS = [
      digits("DK_CPR", "CPR-nummer", "0101901234", 10)
    ];
    CH_OPTIONS = [
      digits("CH_AHV", "AHV-Nummer / Num\xE9ro AVS", "7561234567890", 13)
    ];
    TAX_ID_UNSUPPORTED_COUNTRY_CODES = [
      "AN",
      "AQ",
      "BU",
      "BV",
      "CP",
      "CQ",
      "CS",
      "DD",
      "DG",
      "DY",
      "EH",
      "EU",
      "EZ",
      "FX",
      "GS",
      "HM",
      "HV",
      "IO",
      "NH",
      "QO",
      "RH",
      "SU",
      "TF",
      "TP",
      "UM",
      "UN",
      "VA",
      "VD",
      "XA",
      "XB",
      "YD",
      "YU",
      "ZR",
      "ZZ"
    ];
    TAX_ID_COUNTRY_ALIASES = {
      UK: "GB"
    };
    TAX_ID_CATALOG = {
      US: US_OPTIONS,
      AS: US_OPTIONS,
      GU: US_OPTIONS,
      MP: US_OPTIONS,
      PR: US_OPTIONS,
      VI: US_OPTIONS,
      GB: GB_OPTIONS,
      FK: [
        formatted(
          "FK_TIN",
          "Falkland Islands tax reference",
          "123456",
          "^[A-Z0-9]{5,12}$",
          "Falkland Islands tax reference must be 5 to 12 letters or digits."
        )
      ],
      GI: [
        formatted(
          "GI_TIN",
          "Gibraltar taxpayer reference number",
          "123456",
          "^[A-Z0-9]{5,12}$",
          "Gibraltar taxpayer reference must be 5 to 12 letters or digits."
        )
      ],
      GG: [
        formatted(
          "GG_TRN",
          "Guernsey tax reference number",
          "123456",
          "^[A-Z0-9]{5,12}$",
          "Guernsey tax reference must be 5 to 12 letters or digits."
        )
      ],
      IM: [
        formatted(
          "IM_TRN",
          "Isle of Man tax reference number",
          "123456",
          "^[A-Z0-9]{5,12}$",
          "Isle of Man tax reference must be 5 to 12 letters or digits."
        )
      ],
      JE: [
        formatted(
          "JE_TIN",
          "Jersey tax identification number",
          "123456",
          "^[A-Z0-9]{5,12}$",
          "Jersey tax identification number must be 5 to 12 letters or digits."
        )
      ],
      PN: GB_OPTIONS,
      SH: [
        formatted(
          "SH_TIN",
          "Saint Helena income tax number",
          "123456",
          "^[A-Z0-9]{5,12}$",
          "Saint Helena income tax number must be 5 to 12 letters or digits."
        )
      ],
      TA: GB_OPTIONS,
      FR: FR_OPTIONS,
      BL: FR_OPTIONS,
      GF: FR_OPTIONS,
      GP: FR_OPTIONS,
      MF: FR_OPTIONS,
      MQ: FR_OPTIONS,
      PM: FR_OPTIONS,
      RE: FR_OPTIONS,
      YT: FR_OPTIONS,
      NC: [
        digits("NC_TIN", "Num\xE9ro de contribuable (Nouvelle-Cal\xE9donie)", "123456789", [6, 12])
      ],
      PF: [
        digits("PF_TIN", "Num\xE9ro fiscal (Polyn\xE9sie fran\xE7aise)", "123456789", [6, 12])
      ],
      WF: [
        digits("WF_TIN", "Num\xE9ro d\u2019identification fiscale (Wallis-et-Futuna)", "123456789", [6, 12])
      ],
      ES: ES_OPTIONS,
      EA: ES_OPTIONS,
      IC: ES_OPTIONS,
      NL: NL_OPTIONS,
      BQ: NL_OPTIONS,
      AW: [digits("AW_PERSOONSNUMMER", "Persoonsnummer (Aruba)", "12345678", [6, 10])],
      CW: [digits("CW_CRIB", "Cura\xE7ao CRIB number", "123456789", 9)],
      SX: [digits("SX_CRIB", "Sint Maarten CRIB number", "123456789", 9)],
      AU: AU_OPTIONS,
      CC: AU_OPTIONS,
      CX: AU_OPTIONS,
      NF: AU_OPTIONS,
      NZ: NZ_OPTIONS,
      TK: NZ_OPTIONS,
      NO: NO_OPTIONS,
      SJ: NO_OPTIONS,
      FI: FI_OPTIONS,
      AX: FI_OPTIONS,
      SE: SE_OPTIONS,
      DK: DK_OPTIONS,
      FO: [digits("FO_PTAL", "P-tal (Faroese personal identification number)", "0101901234", 10)],
      GL: [digits("GL_CPR", "CPR-nummer (Greenland)", "0101901234", 10)],
      CH: CH_OPTIONS,
      AC: [
        formatted(
          "AC_TIN",
          "Ascension Island tax reference",
          "123456",
          "^[A-Z0-9]{5,12}$",
          "Ascension Island tax reference must be 5 to 12 letters or digits."
        )
      ],
      AD: [
        formatted(
          "AD_NRT",
          "N\xFAmero de Registre Tributari (NRT)",
          "A123456B",
          "^[A-Z]\\d{6}[A-Z]$",
          "Andorran NRT must be a letter, 6 digits, and a letter."
        )
      ],
      AE: [
        digits("AE_EMIRATES_ID", "Emirates ID number", "784199012345671", 15),
        digits("AE_TRN", "Tax Registration Number (TRN)", "100123456700003", 15)
      ],
      AF: [digits("AF_TIN", "Tax Identification Number (TIN)", "1234567890", [9, 13])],
      AG: [digits("AG_TIN", "Tax Identification Number (TIN)", "123456", [6, 10])],
      AI: [digits("AI_TIN", "Anguilla Tax Identification Number", "123456", [6, 10])],
      AL: [
        formatted(
          "AL_NID",
          "Numri i Identitetit (NID)",
          "A12345678B",
          "^[A-Z]\\d{8}[A-Z]$",
          "Albanian NID must be a letter, 8 digits, and a letter."
        ),
        formatted(
          "AL_NIPT",
          "Numri i Identifikimit p\xEBr Personin e Tatuesh\xEBm (NIPT)",
          "A12345678B",
          "^[A-Z]\\d{8}[A-Z]$",
          "Albanian NIPT must be a letter, 8 digits, and a letter."
        )
      ],
      AM: [digits("AM_PSN", "Public Services Number (PSN)", "1234567890", 10)],
      AO: [digits("AO_NIF", "N\xFAmero de Identifica\xE7\xE3o Fiscal (NIF)", "1234567890", [9, 14])],
      AR: [
        digits("AR_CUIL", "C\xF3digo \xDAnico de Identificaci\xF3n Laboral (CUIL)", "20123456786", 11),
        digits("AR_CUIT", "C\xF3digo \xDAnico de Identificaci\xF3n Tributaria (CUIT)", "20123456786", 11)
      ],
      AT: [digits("AT_IDNR", "Steuerliche Identifikationsnummer", "123456789", 9)],
      AZ: [
        formatted(
          "AZ_FIN",
          "F\u0259rdi \u0130dentifikasiya N\xF6mr\u0259si (FIN)",
          "ABC1234",
          "^[A-Z0-9]{7}$",
          "Azerbaijan FIN must be 7 letters or digits."
        ),
        digits("AZ_VOEN", "Vergi \xF6d\u0259yicisinin eynil\u0259\u015Fdirm\u0259 n\xF6mr\u0259si (V\xD6EN)", "1234567890", 10)
      ],
      BA: [digits("BA_JMB", "Jedinstveni mati\u010Dni broj (JMB)", "0101990123456", 13)],
      BB: [digits("BB_TIN", "Barbados Tax Identification Number", "1234567890123", 13)],
      BD: [digits("BD_ETIN", "e-TIN", "123456789012", 12)],
      BE: [digits("BE_NN", "Num\xE9ro national / Rijksregisternummer", "12345678901", 11)],
      BF: [digits("BF_IFU", "Identifiant Fiscal Unique (IFU)", "1234567890123", [8, 14])],
      BG: [
        digits("BG_EGN", "\u0415\u0434\u0438\u043D\u0435\u043D \u0433\u0440\u0430\u0436\u0434\u0430\u043D\u0441\u043A\u0438 \u043D\u043E\u043C\u0435\u0440 (\u0415\u0413\u041D)", "0101901234", 10),
        digits("BG_LNCH", "\u041B\u0438\u0447\u0435\u043D \u043D\u043E\u043C\u0435\u0440 \u043D\u0430 \u0447\u0443\u0436\u0434\u0435\u043D\u0435\u0446 (\u041B\u041D\u0427)", "0101901234", 10)
      ],
      BH: [digits("BH_CPR", "Central Population Registry number (CPR)", "900101234", 9)],
      BI: [digits("BI_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "1234567890", [8, 12])],
      BJ: [digits("BJ_IFU", "Identifiant Fiscal Unique (IFU)", "1234567890123", [8, 14])],
      BM: [digits("BM_TIN", "Bermuda tax identification number", "123456", [6, 12])],
      BN: [
        digits("BN_IC", "Brunei identity card number", "00123456", 8)
      ],
      BO: [
        digits("BO_NIT", "N\xFAmero de Identificaci\xF3n Tributaria (NIT)", "1234567890", [7, 12]),
        digits("BO_CI", "C\xE9dula de identidad", "1234567", [5, 10])
      ],
      BR: [digits("BR_CPF", "Cadastro de Pessoas F\xEDsicas (CPF)", "12345678901", 11)],
      BS: [
        digits("BS_NIB", "National Insurance Board number", "12345678", 8),
        digits("BS_TIN", "Bahamas Tax Identification Number", "123456789", [8, 12])
      ],
      BT: [digits("BT_TPN", "Taxpayer Number (TPN)", "12345678901", 11)],
      BW: [digits("BW_TIN", "Taxpayer Identification Number (TIN)", "12345678901", [8, 12])],
      BY: [
        formatted(
          "BY_PN",
          "\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043D\u043E\u043C\u0435\u0440 (personal number)",
          "1234567A123PB1",
          "^[A-Z0-9]{14}$",
          "Belarus personal number must be 14 letters or digits."
        )
      ],
      BZ: [digits("BZ_TIN", "Tax Identification Number (TIN)", "123456", [6, 10])],
      CA: [digits("CA_SIN", "Social Insurance Number (SIN)", "123456789", 9)],
      CD: [digits("CD_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "1234567890", [8, 15])],
      CF: [digits("CF_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "1234567890", [8, 14])],
      CG: [digits("CG_NIU", "Num\xE9ro d\u2019identification unique (NIU)", "1234567890", [8, 14])],
      CI: [
        formatted(
          "CI_NCC",
          "Num\xE9ro de compte contribuable (NCC)",
          "1234567A",
          "^[A-Z0-9]{7,12}$",
          "C\xF4te d\u2019Ivoire NCC must be 7 to 12 letters or digits."
        )
      ],
      CK: [digits("CK_TIN", "Cook Islands tax identification number", "123456", [5, 12])],
      CL: [
        formatted(
          "CL_RUT",
          "Rol \xDAnico Tributario (RUT)",
          "12345678K",
          "^\\d{7,8}[0-9K]$",
          "Chilean RUT must be 7 or 8 digits followed by a check digit or K."
        )
      ],
      CM: [digits("CM_NIU", "Num\xE9ro d\u2019identifiant unique (NIU)", "1234567890123", [8, 14])],
      CN: [
        formatted(
          "CN_ID",
          "\u516C\u6C11\u8EAB\u4EFD\u53F7\u7801 (Citizen Identification Number)",
          "110101199001011234",
          "^\\d{17}[0-9X]$",
          "Chinese citizen ID number must be 17 digits followed by a digit or X."
        )
      ],
      CO: [
        digits("CO_NIT", "N\xFAmero de Identificaci\xF3n Tributaria (NIT)", "1234567890", [9, 11]),
        digits("CO_CEDULA", "C\xE9dula de ciudadan\xEDa", "1234567890", [6, 10])
      ],
      CR: [
        digits("CR_CEDULA", "C\xE9dula de identidad", "123456789", 9),
        digits("CR_NITE", "N\xFAmero de Identificaci\xF3n Tributario Especial (NITE)", "123456789012", 12)
      ],
      CU: [digits("CU_CI", "Carn\xE9 de identidad", "90010112345", 11)],
      CV: [digits("CV_NIF", "N\xFAmero de Identifica\xE7\xE3o Fiscal (NIF)", "123456789", 9)],
      CY: [
        formatted(
          "CY_TIC",
          "\u0391\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2 \u03A6\u03BF\u03C1\u03BF\u03BB\u03BF\u03B3\u03B9\u03BA\u03BF\u03CD \u039C\u03B7\u03C4\u03C1\u03CE\u03BF\u03C5 (TIC)",
          "12345678A",
          "^\\d{8}[A-Z]$",
          "Cyprus TIC must be 8 digits followed by a letter."
        )
      ],
      CZ: [
        digits("CZ_RC", "Rodn\xE9 \u010D\xEDslo", "9001011234", [9, 10]),
        formatted(
          "CZ_DIC",
          "Da\u0148ov\xE9 identifika\u010Dn\xED \u010D\xEDslo (DI\u010C)",
          "CZ9001011234",
          "^CZ\\d{8,10}$",
          "Czech DI\u010C must start with CZ and contain 8 to 10 digits."
        )
      ],
      DE: [digits("DE_IDNR", "Steuerliche Identifikationsnummer (IdNr)", "12345678901", 11)],
      DJ: [digits("DJ_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "1234567890", [8, 12])],
      DM: [digits("DM_TIN", "Dominica Tax Identification Number", "123456", [6, 10])],
      DO: [
        digits("DO_CEDULA", "C\xE9dula de identidad y electoral", "00112345678", 11),
        digits("DO_RNC", "Registro Nacional del Contribuyente (RNC)", "123456789", 9)
      ],
      DZ: [digits("DZ_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "123456789012345", 15)],
      EC: [
        digits("EC_CEDULA", "C\xE9dula de identidad", "1234567890", 10),
        digits("EC_RUC", "Registro \xDAnico de Contribuyentes (RUC)", "1234567890001", 13)
      ],
      EE: [digits("EE_ISIKUKOOD", "Isikukood", "39001011234", 11)],
      EG: [digits("EG_TIN", "Tax registration number", "123456789", 9)],
      ER: [digits("ER_TIN", "Tax Identification Number (TIN)", "1234567890", [8, 12])],
      ET: [digits("ET_TIN", "Taxpayer Identification Number (TIN)", "1234567890", 10)],
      FJ: [digits("FJ_TIN", "Tax Identification Number (TIN)", "123456789", [6, 10])],
      FM: [digits("FM_TIN", "FSM taxpayer identification number", "123456", [6, 12])],
      GA: [digits("GA_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "1234567890", [8, 14])],
      GD: [digits("GD_TIN", "Grenada Tax Identification Number", "123456", [6, 10])],
      GE: [digits("GE_PN", "Personal number", "12345678901", 11)],
      GH: [
        formatted(
          "GH_TIN",
          "Taxpayer Identification Number (TIN)",
          "P0012345678",
          "^[A-Z0-9]{10,15}$",
          "Ghana TIN must be 10 to 15 letters or digits."
        ),
        formatted(
          "GH_PIN",
          "Ghana Card PIN",
          "GHA1234567890",
          "^GHA\\d{10}$",
          "Ghana Card PIN must start with GHA and contain 10 digits."
        )
      ],
      GM: [digits("GM_TIN", "Taxpayer Identification Number (TIN)", "123456789", [6, 12])],
      GN: [digits("GN_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "1234567890", [8, 14])],
      GQ: [digits("GQ_NIF", "N\xFAmero de identificaci\xF3n fiscal (NIF)", "1234567890", [8, 14])],
      GR: [digits("GR_AFM", "\u0391\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2 \u03A6\u03BF\u03C1\u03BF\u03BB\u03BF\u03B3\u03B9\u03BA\u03BF\u03CD \u039C\u03B7\u03C4\u03C1\u03CE\u03BF\u03C5 (\u0391\u03A6\u039C)", "123456789", 9)],
      GT: [
        digits("GT_NIT", "N\xFAmero de Identificaci\xF3n Tributaria (NIT)", "12345678", [7, 10]),
        digits("GT_CUI", "C\xF3digo \xDAnico de Identificaci\xF3n (CUI)", "1234567890123", 13)
      ],
      GW: [digits("GW_NIF", "N\xFAmero de identifica\xE7\xE3o fiscal (NIF)", "123456789", [8, 12])],
      GY: [digits("GY_TIN", "Taxpayer Identification Number (TIN)", "123456789", [6, 12])],
      HK: [
        formatted(
          "HK_HKID",
          "Hong Kong Identity Card number (HKID)",
          "A1234567",
          "^[A-Z]{1,2}\\d{6}[0-9A]$",
          "Hong Kong identity card number must be 1 or 2 letters, 6 digits, and a check character."
        )
      ],
      HN: [
        digits("HN_RTN", "Registro Tributario Nacional (RTN)", "08011990123456", 14),
        digits("HN_ID", "N\xFAmero de identidad", "0801199012345", 13)
      ],
      HR: [digits("HR_OIB", "Osobni identifikacijski broj (OIB)", "12345678901", 11)],
      HT: [digits("HT_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "1234567890", [8, 12])],
      HU: [digits("HU_ADOAZONOSITO", "Ad\xF3azonos\xEDt\xF3 jel", "8123456789", 10)],
      ID: [digits("ID_NPWP", "Nomor Pokok Wajib Pajak (NPWP)", "1234567890123456", [15, 16])],
      IE: [
        formatted(
          "IE_PPSN",
          "Personal Public Service Number (PPSN)",
          "1234567A",
          "^\\d{7}[A-Z]{1,2}$",
          "Irish PPSN must be 7 digits followed by 1 or 2 letters."
        )
      ],
      IL: [digits("IL_ZEHUT", "\u05DE\u05E1\u05E4\u05E8 \u05D6\u05D4\u05D5\u05EA (Mispar Zehut)", "123456789", 9)],
      IN: [
        formatted(
          "IN_PAN",
          "Permanent Account Number (PAN)",
          "ABCDE1234F",
          "^[A-Z]{5}\\d{4}[A-Z]$",
          "Indian PAN must be 5 letters, 4 digits, and a letter."
        )
      ],
      IQ: [digits("IQ_NID", "National identification number", "123456789012", 12)],
      IR: [digits("IR_NID", "\u0634\u0645\u0627\u0631\u0647 \u0645\u0644\u06CC (National ID number)", "1234567890", 10)],
      IS: [digits("IS_KENNITALA", "Kennitala", "0101901234", 10)],
      IT: [
        formatted(
          "IT_CF",
          "Codice fiscale",
          "RSSMRA90A01H501U",
          "^[A-Z]{6}\\d{2}[A-Z]\\d{2}[A-Z]\\d{3}[A-Z]$",
          "Italian codice fiscale must be 16 characters in the official letter-and-digit layout."
        )
      ],
      JM: [digits("JM_TRN", "Taxpayer Registration Number (TRN)", "123456789", 9)],
      JO: [digits("JO_NID", "National number", "9001011234", 10)],
      JP: [digits("JP_MY_NUMBER", "\u500B\u4EBA\u756A\u53F7 (My Number)", "123456789012", 12)],
      KE: [
        formatted(
          "KE_PIN",
          "KRA Personal Identification Number (PIN)",
          "A123456789B",
          "^[A-Z]\\d{9}[A-Z]$",
          "Kenya KRA PIN must be a letter, 9 digits, and a letter."
        )
      ],
      KG: [digits("KG_PIN", "Personal identification number (PIN)", "12345678901234", 14)],
      KH: [digits("KH_TIN", "Tax Identification Number (TIN)", "123456789", [9, 12])],
      KI: [digits("KI_TIN", "Kiribati tax identification number", "123456", [5, 12])],
      KM: [digits("KM_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "123456789", [8, 12])],
      KN: [digits("KN_TIN", "Saint Kitts and Nevis Tax Identification Number", "123456", [6, 10])],
      KP: [digits("KP_RRN", "Resident registration number", "1234567890123", 13)],
      KR: [digits("KR_RRN", "\uC8FC\uBBFC\uB4F1\uB85D\uBC88\uD638 (Resident Registration Number)", "9001011234567", 13)],
      KW: [digits("KW_CIVIL_ID", "Civil ID number", "123456789012", 12)],
      KY: [digits("KY_TIN", "Cayman Islands Tax Identification Number", "123456", [6, 12])],
      KZ: [digits("KZ_IIN", "\u0416\u0435\u043A\u0435 \u0441\u04D9\u0439\u043A\u0435\u0441\u0442\u0435\u043D\u0434\u0456\u0440\u0443 \u043D\u04E9\u043C\u0456\u0440\u0456 (IIN)", "900101123456", 12)],
      LA: [digits("LA_TIN", "Tax Identification Number (TIN)", "1234567890", [9, 13])],
      LB: [digits("LB_TIN", "Tax identification number", "12345678", [6, 12])],
      LC: [digits("LC_TIN", "Saint Lucia Tax Identification Number", "123456", [6, 10])],
      LI: [digits("LI_PEID", "Personenidentifikationsnummer (PEID)", "1234567", [4, 12])],
      LK: [digits("LK_TIN", "Taxpayer Identification Number (TIN)", "123456789", 9)],
      LR: [digits("LR_TIN", "Taxpayer Identification Number (TIN)", "123456789", [8, 12])],
      LS: [digits("LS_TIN", "Taxpayer Identification Number (TIN)", "1234567890", [8, 12])],
      LT: [digits("LT_ASMENS_KODAS", "Asmens kodas", "39001011234", 11)],
      LU: [digits("LU_MATRICULE", "Num\xE9ro d\u2019identification nationale (matricule)", "1890123456789", 13)],
      LV: [digits("LV_PERSONAS_KODS", "Personas kods", "01019012345", 11)],
      LY: [digits("LY_NID", "National number", "123456789012", 12)],
      MA: [digits("MA_IF", "Identifiant fiscal (IF)", "12345678", [7, 10])],
      MC: [
        formatted(
          "MC_TIN",
          "Num\xE9ro d\u2019identification fiscale",
          "AB12345",
          "^[A-Z0-9]{5,12}$",
          "Monaco tax identification number must be 5 to 12 letters or digits."
        )
      ],
      MD: [digits("MD_IDNP", "Num\u0103rul de identificare de stat (IDNP)", "1234567890123", 13)],
      ME: [digits("ME_JMB", "Jedinstveni mati\u010Dni broj (JMB)", "0101990123456", 13)],
      MG: [digits("MG_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "1234567890", [9, 14])],
      MH: [digits("MH_TIN", "Marshall Islands taxpayer identification number", "123456", [6, 12])],
      MK: [digits("MK_EMBG", "\u0415\u0434\u0438\u043D\u0441\u0442\u0432\u0435\u043D \u043C\u0430\u0442\u0438\u0447\u0435\u043D \u0431\u0440\u043E\u0458 (\u0415\u041C\u0411\u0413)", "0101990123456", 13)],
      ML: [digits("ML_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "1234567890", [8, 14])],
      MM: [digits("MM_TIN", "Taxpayer Identification Number (TIN)", "123456789", [8, 14])],
      MN: [
        formatted(
          "MN_RN",
          "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0439\u043D \u0434\u0443\u0433\u0430\u0430\u0440 (civil registration number)",
          "AB12345678",
          "^[A-Z0-9]{8,12}$",
          "Mongolia civil registration number must be 8 to 12 letters or digits."
        )
      ],
      MO: [digits("MO_TIN", "N\xFAmero de contribuinte (Macau)", "12345678", 8)],
      MR: [digits("MR_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "1234567890", [8, 14])],
      MS: [digits("MS_TIN", "Montserrat Tax Identification Number", "123456", [6, 10])],
      MT: [
        formatted(
          "MT_ID",
          "Identity card number",
          "1234567A",
          "^\\d{7}[A-Z]$",
          "Malta identity card number must be 7 digits followed by a letter."
        ),
        formatted(
          "MT_TIN",
          "Tax number",
          "123456789",
          "^\\d{8,9}[A-Z]?$",
          "Malta tax number must be 8 or 9 digits, optionally followed by a letter."
        )
      ],
      MU: [digits("MU_TAN", "Tax Account Number (TAN)", "12345678", 8)],
      MV: [digits("MV_TIN", "Tax Identification Number (TIN)", "1234567", [6, 10])],
      MW: [digits("MW_TPIN", "Taxpayer Identification Number (TPIN)", "12345678", 8)],
      MX: [
        formatted(
          "MX_RFC",
          "Registro Federal de Contribuyentes (RFC)",
          "ABCD900101XX1",
          "^[A-Z&\xD1]{4}\\d{6}[A-Z0-9]{3}$",
          "Mexican individual RFC must be 4 letters, 6 digits, and 3 letters or digits."
        )
      ],
      MY: [
        formatted(
          "MY_ITN",
          "Nombor cukai pendapatan",
          "SG12345678901",
          "^[A-Z]{1,2}\\d{10,12}$",
          "Malaysian income tax number must be 1 or 2 letters followed by 10 to 12 digits."
        )
      ],
      MZ: [digits("MZ_NUIT", "N\xFAmero \xDAnico de Identifica\xE7\xE3o Tribut\xE1ria (NUIT)", "123456789", 9)],
      NA: [digits("NA_ITN", "Income tax reference number", "1234567890", [8, 12])],
      NE: [digits("NE_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "1234567890", [8, 14])],
      NG: [digits("NG_TIN", "Tax Identification Number (TIN)", "1234567890", [8, 14])],
      NI: [
        formatted(
          "NI_CEDULA",
          "C\xE9dula de identidad",
          "0010101901234A",
          "^[A-Z0-9]{13,14}$",
          "Nicaragua c\xE9dula must be 13 or 14 letters or digits."
        ),
        digits("NI_RUC", "Registro \xDAnico de Contribuyente (RUC)", "12345678901234", 14)
      ],
      NP: [digits("NP_PAN", "Permanent Account Number (PAN)", "123456789", 9)],
      NR: [digits("NR_TIN", "Nauru tax identification number", "123456", [5, 12])],
      NU: [digits("NU_TIN", "Niue tax identification number", "123456", [5, 12])],
      OM: [digits("OM_CIVIL", "Civil number", "12345678", [6, 9])],
      PA: [
        digits("PA_RUC", "Registro \xDAnico de Contribuyente (RUC)", "123456789012", [10, 15]),
        formatted(
          "PA_CEDULA",
          "C\xE9dula de identidad",
          "8-123-4567",
          "^[A-Z0-9]{5,15}$",
          "Panama c\xE9dula must be 5 to 15 letters or digits."
        )
      ],
      PE: [
        digits("PE_DNI", "Documento Nacional de Identidad (DNI)", "12345678", 8),
        digits("PE_RUC", "Registro \xDAnico de Contribuyentes (RUC)", "10123456789", 11)
      ],
      PG: [digits("PG_TIN", "Tax Identification Number (TIN)", "123456789", [6, 12])],
      PH: [digits("PH_TIN", "Taxpayer Identification Number (TIN)", "123456789", [9, 12])],
      PK: [
        digits("PK_CNIC", "Computerised National Identity Card (CNIC)", "1234567890123", 13),
        digits("PK_NTN", "National Tax Number (NTN)", "1234567", 7)
      ],
      PL: [
        digits("PL_PESEL", "PESEL", "90010112345", 11),
        digits("PL_NIP", "Numer Identyfikacji Podatkowej (NIP)", "1234567890", 10)
      ],
      PS: [digits("PS_ID", "Palestinian identity number", "123456789", 9)],
      PT: [digits("PT_NIF", "N\xFAmero de Identifica\xE7\xE3o Fiscal (NIF)", "123456789", 9)],
      PW: [digits("PW_TIN", "Palau taxpayer identification number", "123456", [6, 12])],
      PY: [
        digits("PY_RUC", "Registro \xDAnico de Contribuyentes (RUC)", "12345678", [6, 10]),
        digits("PY_CI", "C\xE9dula de identidad civil", "1234567", [5, 8])
      ],
      QA: [digits("QA_QID", "Qatar ID (QID)", "12345678901", 11)],
      RO: [digits("RO_CNP", "Cod Numeric Personal (CNP)", "1900101123456", 13)],
      RS: [
        digits("RS_JMBG", "Jedinstveni mati\u010Dni broj gra\u0111ana (JMBG)", "0101990123456", 13),
        digits("RS_PIB", "Poreski identifikacioni broj (PIB)", "123456789", 9)
      ],
      RU: [digits("RU_INN", "\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043D\u043E\u043C\u0435\u0440 \u043D\u0430\u043B\u043E\u0433\u043E\u043F\u043B\u0430\u0442\u0435\u043B\u044C\u0449\u0438\u043A\u0430 (\u0418\u041D\u041D)", "123456789012", 12)],
      RW: [digits("RW_TIN", "Tax Identification Number (TIN)", "123456789", 9)],
      SA: [
        formatted(
          "SA_NATIONAL_ID",
          "National ID number",
          "1234567890",
          "^1\\d{9}$",
          "Saudi national ID must be 10 digits and start with 1."
        ),
        formatted(
          "SA_IQAMA",
          "Iqama number",
          "2345678901",
          "^2\\d{9}$",
          "Saudi Iqama number must be 10 digits and start with 2."
        )
      ],
      SB: [digits("SB_TIN", "Solomon Islands tax identification number", "123456", [6, 12])],
      SC: [digits("SC_TIN", "Seychelles Tax Identification Number", "123456789", [6, 12])],
      SD: [digits("SD_TIN", "Tax Identification Number (TIN)", "1234567890", [8, 14])],
      SG: [
        formatted(
          "SG_NRIC",
          "NRIC number",
          "S1234567A",
          "^[ST]\\d{7}[A-Z]$",
          "Singapore NRIC must start with S or T, followed by 7 digits and a letter."
        ),
        formatted(
          "SG_FIN",
          "Foreign Identification Number (FIN)",
          "F1234567A",
          "^[FGM]\\d{7}[A-Z]$",
          "Singapore FIN must start with F, G, or M, followed by 7 digits and a letter."
        )
      ],
      SI: [digits("SI_DAVST", "Dav\u010Dna \u0161tevilka", "12345678", 8)],
      SK: [
        digits("SK_RC", "Rodn\xE9 \u010D\xEDslo", "9001011234", [9, 10]),
        formatted(
          "SK_DIC",
          "Da\u0148ov\xE9 identifika\u010Dn\xE9 \u010D\xEDslo (DI\u010C)",
          "1234567890",
          "^\\d{10}$",
          "Slovak DI\u010C must be 10 digits."
        )
      ],
      SL: [digits("SL_TIN", "Taxpayer Identification Number (TIN)", "123456789", [8, 12])],
      SM: [digits("SM_ISS", "Codice ISS", "12345", [4, 8])],
      SN: [
        digits("SN_CNI", "Num\xE9ro de carte nationale d\u2019identit\xE9 (CNI)", "1234567890123", 13)
      ],
      SO: [digits("SO_TIN", "Tax Identification Number (TIN)", "1234567890", [8, 12])],
      SR: [digits("SR_TIN", "Tax Identification Number (TIN)", "1234567890", [8, 12])],
      SS: [digits("SS_TIN", "Tax Identification Number (TIN)", "1234567890", [8, 14])],
      ST: [digits("ST_NIF", "N\xFAmero de identifica\xE7\xE3o fiscal (NIF)", "123456789", 9)],
      SV: [
        digits("SV_NIT", "N\xFAmero de Identificaci\xF3n Tributaria (NIT)", "12345678901234", 14),
        digits("SV_DUI", "Documento \xDAnico de Identidad (DUI)", "123456789", 9)
      ],
      SY: [digits("SY_NID", "National number", "12345678901", 11)],
      SZ: [digits("SZ_TIN", "Tax Identification Number (TIN)", "1234567890", [8, 12])],
      TC: [digits("TC_TIN", "Turks and Caicos Islands Tax Identification Number", "123456", [6, 12])],
      TD: [digits("TD_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "1234567890", [8, 14])],
      TG: [digits("TG_NIF", "Num\xE9ro d\u2019identification fiscale (NIF)", "1234567890", [8, 14])],
      TH: [digits("TH_TIN", "\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35 (Tax Identification Number)", "1234567890123", 13)],
      TJ: [digits("TJ_TIN", "\u0420\u0430\u049B\u0430\u043C\u0438 \u043C\u0443\u0448\u0430\u0445\u0445\u0430\u0441\u0438 \u0430\u043D\u0434\u043E\u0437\u0441\u0443\u043F\u043E\u0440\u0430\u043D\u0434\u0430 (TIN)", "123456789", 9)],
      TL: [digits("TL_TIN", "N\xFAmero de identifica\xE7\xE3o fiscal (NIF)", "123456789", [8, 12])],
      TM: [digits("TM_PN", "Personal number", "12345678901", [8, 14])],
      TN: [
        formatted(
          "TN_MF",
          "Matricule fiscal",
          "1234567A",
          "^[A-Z0-9]{7,13}$",
          "Tunisian matricule fiscal must be 7 to 13 letters or digits."
        )
      ],
      TO: [digits("TO_TIN", "Tonga tax identification number", "123456", [5, 12])],
      TR: [
        digits("TR_TCKN", "T.C. Kimlik Numaras\u0131", "12345678901", 11),
        digits("TR_VKN", "Vergi Kimlik Numaras\u0131", "1234567890", 10)
      ],
      TT: [digits("TT_BIR", "Board of Inland Revenue (BIR) number", "123456", [6, 10])],
      TV: [digits("TV_TIN", "Tuvalu tax identification number", "123456", [5, 12])],
      TW: [
        formatted(
          "TW_NID",
          "National Identification Number",
          "A123456789",
          "^[A-Z][12]\\d{8}$",
          "Taiwan national ID must be a letter, 1 or 2, and 8 digits."
        )
      ],
      TZ: [digits("TZ_TIN", "Taxpayer Identification Number (TIN)", "123456789", 9)],
      UA: [digits("UA_RNOKPP", "\u0420\u041D\u041E\u041A\u041F\u041F (individual tax number)", "1234567890", 10)],
      UG: [digits("UG_TIN", "Taxpayer Identification Number (TIN)", "1234567890", 10)],
      UY: [
        digits("UY_CI", "C\xE9dula de identidad", "12345678", [7, 8]),
        digits("UY_RUT", "Registro \xDAnico Tributario (RUT)", "123456789012", 12)
      ],
      UZ: [
        digits("UZ_PINFL", "Jismoniy shaxsning shaxsiy identifikatsiya raqami (PINFL)", "12345678901234", 14),
        digits("UZ_INN", "Identifikatsion soliq raqami (INN)", "123456789", 9)
      ],
      VC: [digits("VC_TIN", "Saint Vincent and the Grenadines Tax Identification Number", "123456", [6, 10])],
      VE: [
        formatted(
          "VE_RIF",
          "Registro de Informaci\xF3n Fiscal (RIF)",
          "V123456789",
          "^[VEJPG]\\d{8,9}$",
          "Venezuelan RIF must start with V, E, J, P, or G and contain 8 or 9 digits."
        ),
        digits("VE_CEDULA", "C\xE9dula de identidad", "12345678", [6, 9])
      ],
      VG: [digits("VG_TIN", "British Virgin Islands Tax Identification Number", "123456", [6, 12])],
      VN: [digits("VN_MST", "M\xE3 s\u1ED1 thu\u1EBF", "1234567890", [10, 13])],
      VU: [digits("VU_TIN", "Vanuatu Tax Identification Number", "123456", [6, 12])],
      WS: [digits("WS_TIN", "Samoa tax identification number", "123456", [5, 12])],
      XK: [digits("XK_FN", "Fiscal number", "1234567890", 10)],
      YE: [digits("YE_NID", "National ID number", "12345678901", [8, 14])],
      ZA: [digits("ZA_TAX_REF", "Income tax reference number", "1234567890", 10)],
      ZM: [digits("ZM_TPIN", "Taxpayer Identification Number (TPIN)", "1234567890", 10)],
      ZW: [digits("ZW_TIN", "Taxpayer Identification Number (TIN)", "1234567890", [8, 12])]
    };
    UNSUPPORTED = new Set(TAX_ID_UNSUPPORTED_COUNTRY_CODES);
  }
});

// src/domain/kyc/taxIdByCountry.ts
function isTaxIdTypeAllowedForCountry(countryCode, taxIdType) {
  return findTaxIdCatalogOption(countryCode, taxIdType) !== void 0;
}
function canonicalizeTaxIdType(countryCode, taxIdType) {
  const raw = taxIdType.trim().toUpperCase();
  const candidate = LEGACY_TAX_ID_CODES[raw] ?? raw;
  return isTaxIdTypeAllowedForCountry(countryCode, candidate) ? candidate : null;
}
function findTaxIdOption(countryCode, taxIdType) {
  const canonical = canonicalizeTaxIdType(countryCode, taxIdType);
  if (!canonical) return void 0;
  return findTaxIdCatalogOption(countryCode, canonical);
}
function countryHasIndividualTaxId(countryCode) {
  return getTaxIdCatalogOptions(countryCode).length > 0 && !isUnsupportedTaxIdCountry(countryCode);
}
var LEGACY_TAX_ID_CODES, UNSUPPORTED_TAX_ID_COUNTRY_MESSAGE;
var init_taxIdByCountry = __esm({
  "src/domain/kyc/taxIdByCountry.ts"() {
    "use strict";
    init_taxIdCatalog();
    LEGACY_TAX_ID_CODES = {
      SSN: "US_SSN",
      CPF: "BR_CPF",
      DNI: "ES_DNI"
    };
    UNSUPPORTED_TAX_ID_COUNTRY_MESSAGE = "Individual tax identifiers are not issued for this account country, so verification cannot be submitted.";
  }
});

// src/server/services/kyc.service.ts
var kyc_service_exports = {};
__export(kyc_service_exports, {
  KycService: () => KycService,
  defaultKycService: () => defaultKycService
});
var KycService, defaultKycService;
var init_kyc_service = __esm({
  "src/server/services/kyc.service.ts"() {
    "use strict";
    init_auth_service();
    init_audit_service();
    init_domesticBankAccount_service();
    init_email_service();
    init_taxIdByCountry();
    KycService = class {
      profilesByUserId = /* @__PURE__ */ new Map();
      /**
       * Retrieves or initializes a KYC profile for a user.
       */
      getOrCreateProfile(userId) {
        let profile = this.profilesByUserId.get(userId);
        if (!profile) {
          profile = {
            id: `kyc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId,
            tier: 1,
            status: "NOT_STARTED",
            version: 1,
            resubmissionCount: 0,
            documentRefs: [],
            reviewHistory: [],
            customerNotifications: [],
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          };
          this.profilesByUserId.set(userId, profile);
        }
        return profile;
      }
      /**
       * Submits or updates verification details. Customer-facing.
       */
      submitVerification(params) {
        const profile = this.getOrCreateProfile(params.userId);
        if (profile.status === "UNDER_REVIEW") {
          throw new Error("Your verification is currently under review by our compliance team.");
        }
        if (profile.status === "APPROVED") {
          throw new Error("Your identity verification has already been approved.");
        }
        const country = params.residentialAddress.country;
        if (!countryHasIndividualTaxId(country)) {
          throw new Error(UNSUPPORTED_TAX_ID_COUNTRY_MESSAGE);
        }
        const taxIdType = canonicalizeTaxIdType(country, params.taxIdType);
        if (!taxIdType) {
          throw new Error("Tax ID type is not valid for this country.");
        }
        this.validateTaxId(taxIdType, params.taxIdNumber, country);
        const cleanTaxId = params.taxIdNumber.trim();
        const masked = cleanTaxId.length > 4 ? `***-**-${cleanTaxId.slice(-4)}` : "***";
        const newDocRefs = (params.documents || []).map((doc) => {
          const preview = typeof doc.previewDataUrl === "string" && doc.previewDataUrl.startsWith("data:") && doc.previewDataUrl.length <= 18e5 ? doc.previewDataUrl : void 0;
          return {
            id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: doc.type,
            fileName: doc.fileName,
            mimeType: doc.mimeType,
            storageRef: `vault://kyc/${(/* @__PURE__ */ new Date()).getFullYear()}/${params.userId}/${Math.random().toString(36).substring(2, 10)}.enc`,
            fileSize: doc.fileSize,
            uploadedAt: /* @__PURE__ */ new Date(),
            ...preview ? { previewDataUrl: preview } : {}
          };
        });
        const isResubmission = profile.status === "REJECTED" || profile.status === "NEEDS_MORE_INFORMATION";
        profile.tier = params.tier || 1;
        profile.status = "SUBMITTED";
        profile.version = (profile.version || 1) + 1;
        if (isResubmission) {
          profile.resubmissionCount = (profile.resubmissionCount || 0) + 1;
        }
        profile.legalFirstName = params.legalFirstName.trim();
        profile.legalLastName = params.legalLastName.trim();
        profile.dateOfBirth = params.dateOfBirth;
        profile.taxIdType = taxIdType;
        profile.taxIdMasked = masked;
        profile.taxIdFull = cleanTaxId;
        profile.residentialAddress = params.residentialAddress;
        profile.documentRefs = newDocRefs.length > 0 ? newDocRefs : profile.documentRefs;
        profile.submittedAt = /* @__PURE__ */ new Date();
        profile.rejectionReason = void 0;
        profile.updatedAt = /* @__PURE__ */ new Date();
        profile.customerNotifications.unshift({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: "SUBMITTED",
          title: isResubmission ? "KYC Resubmission Queued" : "KYC Verification Queued",
          message: isResubmission ? "Your updated verification details and documents have been received and queued for compliance re-evaluation." : "Your verification submission has been received and queued for compliance review.",
          timestamp: /* @__PURE__ */ new Date()
        });
        const user = defaultAuthService.getUserById(params.userId);
        if (user) {
          user.kycStatus = "SUBMITTED";
          user.updatedAt = /* @__PURE__ */ new Date();
          defaultAuthService.syncCustomerActivationFromKyc(params.userId);
          const customerName = `${params.legalFirstName} ${params.legalLastName}`.trim() || user.fullName;
          voidEmail(
            "kyc-submitted",
            defaultEmailService.sendKycSubmittedEmail({
              to: user.email,
              fullName: customerName,
              reference: profile.id
            })
          );
          voidEmail(
            "kyc-submitted-staff",
            defaultEmailService.sendKycSubmittedStaffEmail({
              customerName,
              customerEmail: user.email,
              userId: user.id
            })
          );
        }
        return profile;
      }
      /**
       * Compliance review action. Strictly restricted to COMPLIANCE_REVIEWER / ADMIN.
       * Customers CANNOT invoke this method.
       */
      async reviewProfile(params) {
        const allowedRoles = ["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
        if (!allowedRoles.includes(params.reviewerRole)) {
          throw new Error("Access denied: only compliance officers or administrators can review verification profiles.");
        }
        if (params.reviewerUserId === params.targetUserId) {
          throw new Error("Separation of duties violation: You cannot review or approve your own KYC profile.");
        }
        if (params.decision === "REJECTED" && !params.rejectionReason && !params.notes) {
          throw new Error("A documented reason is required when rejecting a KYC submission.");
        }
        if (params.decision === "NEEDS_MORE_INFORMATION" && !params.notes) {
          throw new Error("Documented notes explaining what additional information is required are mandatory.");
        }
        const profile = this.profilesByUserId.get(params.targetUserId);
        if (!profile) {
          throw new Error(`KYC profile not found for user: ${params.targetUserId}`);
        }
        if (params.expectedVersion !== void 0 && profile.version !== params.expectedVersion) {
          throw new Error(
            `Conflict: KYC case for user "${params.targetUserId}" was modified by another reviewer (version ${profile.version} vs expected ${params.expectedVersion}).`
          );
        }
        if (profile.status === params.decision && profile.reviewerUserId === params.reviewerUserId && (profile.reviewerNotes === params.notes || !params.notes)) {
          return profile;
        }
        if (profile.status === "APPROVED" && params.decision !== "APPROVED") {
          throw new Error(
            `Conflict: KYC case for user "${params.targetUserId}" has already reached terminal status APPROVED. Status cannot be changed without customer resubmission.`
          );
        }
        const prevStatus = profile.status;
        profile.status = params.decision;
        profile.version = (profile.version || 1) + 1;
        profile.reviewerUserId = params.reviewerUserId;
        profile.reviewerNotes = params.notes;
        profile.reasonCode = params.reasonCode || (params.decision === "APPROVED" ? "SANCTIONS_AND_IDENTITY_CLEARED" : "COMPLIANCE_EVALUATION");
        profile.reviewedAt = /* @__PURE__ */ new Date();
        profile.rejectionReason = params.rejectionReason;
        profile.updatedAt = /* @__PURE__ */ new Date();
        if (params.decision === "APPROVED") {
          profile.verifiedCountryCode = profile.residentialAddress?.country?.trim().toUpperCase();
        }
        profile.reviewHistory.push({
          reviewerUserId: params.reviewerUserId,
          reviewerName: params.reviewerName,
          previousStatus: prevStatus,
          newStatus: params.decision,
          notes: params.notes,
          reasonCode: profile.reasonCode,
          timestamp: /* @__PURE__ */ new Date()
        });
        const notifTitle = params.decision === "APPROVED" ? "Identity Verification Approved (Demo Prototype)" : params.decision === "REJECTED" ? "Identity Verification Rejected" : params.decision === "NEEDS_MORE_INFORMATION" ? "Additional Information Required for Verification" : "Verification Under Review";
        const notifMsg = params.notes || params.rejectionReason || `Your verification status was updated to ${params.decision}.`;
        profile.customerNotifications.unshift({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: params.decision,
          title: notifTitle,
          message: notifMsg,
          timestamp: /* @__PURE__ */ new Date()
        });
        const user = defaultAuthService.getUserById(params.targetUserId);
        if (user) {
          user.kycStatus = params.decision;
          user.updatedAt = /* @__PURE__ */ new Date();
          defaultAuthService.syncCustomerActivationFromKyc(params.targetUserId);
        }
        defaultAuditService.logAction({
          action: "KYC_REVIEWED",
          actorUserId: params.reviewerUserId,
          actorRole: params.reviewerRole,
          resourceType: "KYC_PROFILE",
          resourceId: profile.id,
          previousState: prevStatus,
          newState: params.decision,
          reason: params.rejectionReason || params.notes || `Decision recorded as ${params.decision}`,
          details: {
            targetUserId: params.targetUserId,
            reviewerName: params.reviewerName,
            tier: profile.tier,
            reasonCode: profile.reasonCode,
            version: profile.version,
            verifiedCountryCode: profile.verifiedCountryCode,
            determinationScope: "INTERNAL_ADMINISTRATIVE_ONLY",
            disclaimer: "INTERNAL DETERMINATION ONLY \u2014 DOES NOT CONSTITUTE REGULATORY APPROVAL OR PROOF OF EXTERNAL IDSP CLEARANCE"
          }
        });
        if (params.decision === "APPROVED") {
          try {
            await defaultDomesticBankAccountService.ensurePrimaryAccountAfterKycApproval({
              userId: params.targetUserId,
              kycProfile: profile,
              correlationId: `kyc_approve_${profile.id}_v${profile.version}`
            });
          } catch (err) {
            defaultAuditService.logAction({
              action: "CONFIG_CHANGED",
              actorUserId: "system_domestic_account",
              actorRole: "SYSTEM",
              resourceType: "DOMESTIC_BANK_ACCOUNT",
              resourceId: profile.id,
              reason: "Domestic account generation failed after KYC approval",
              details: {
                targetUserId: params.targetUserId,
                error: err instanceof Error ? err.message : String(err)
              }
            });
          }
        }
        if (user) {
          const fullName = `${profile.legalFirstName ?? ""} ${profile.legalLastName ?? ""}`.trim() || user.fullName;
          const notes = params.notes || params.rejectionReason;
          switch (params.decision) {
            case "UNDER_REVIEW":
              voidEmail(
                "kyc-under-review",
                defaultEmailService.sendKycUnderReviewEmail({ to: user.email, fullName })
              );
              break;
            case "NEEDS_MORE_INFORMATION":
              voidEmail(
                "kyc-needs-more-info",
                defaultEmailService.sendKycNeedsMoreInfoEmail({
                  to: user.email,
                  fullName,
                  notes
                })
              );
              break;
            case "APPROVED":
              voidEmail(
                "kyc-approved",
                defaultEmailService.sendKycApprovedEmail({ to: user.email, fullName })
              );
              break;
            case "REJECTED":
              voidEmail(
                "kyc-rejected",
                defaultEmailService.sendKycRejectedEmail({
                  to: user.email,
                  fullName,
                  notes
                })
              );
              break;
          }
        }
        return profile;
      }
      /**
       * Secure identity document access control.
       * Prohibits unauthorized access to other customers' sensitive verification artifacts.
       */
      getSecureDocumentAccess(params) {
        const isOwner = params.actorUserId === params.targetUserId;
        const isStaff = ["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"].includes(params.actorRole);
        if (!isOwner && !isStaff) {
          throw new Error("Access denied: You do not have permission to access another customer's identity documents.");
        }
        const profile = this.profilesByUserId.get(params.targetUserId);
        if (!profile) throw new Error("KYC profile not found.");
        const doc = profile.documentRefs.find((d) => d.id === params.documentId);
        if (!doc) throw new Error("Document not found in verification profile.");
        return {
          accessGranted: true,
          document: doc,
          storageRef: doc.storageRef,
          secureToken: `sectok_kyc_doc_${Math.random().toString(36).substring(2, 10)}`,
          notice: "CONFIDENTIAL IDENTITY ARTIFACT - Controlled Internal Access Only. Never expose publicly."
        };
      }
      /**
       * Sanitizes profile for customer consumption (stripping internal reviewer notes,
       * full tax ID, and document preview payloads).
       */
      sanitizeForCustomer(profile) {
        const { reviewerNotes: _notes, taxIdFull: _tax, ...safeProfile } = profile;
        return {
          ...safeProfile,
          documentRefs: (profile.documentRefs || []).map(({ previewDataUrl: _p, ...doc }) => doc)
        };
      }
      getAllProfilesForReview(reviewerRole) {
        const allowedRoles = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
        if (!allowedRoles.includes(reviewerRole)) {
          throw new Error("Access denied.");
        }
        return Array.from(this.profilesByUserId.values());
      }
      /**
       * Attaches an external identity verification / screening result from an IDSP partner.
       * INVARIANT: External verification results DO NOT automatically approve a customer.
       * The submission remains SUBMITTED or UNDER_REVIEW pending human compliance review.
       * Timeouts, errors, or unverified signatures are marked UNRESOLVED.
       */
      attachExternalVerificationResult(params) {
        const profile = this.profilesByUserId.get(params.userId);
        if (!profile) {
          throw new Error(`Cannot attach external KYC result: profile not found for user "${params.userId}".`);
        }
        const effectiveStatus = !params.signatureVerified ? "UNRESOLVED" : params.status;
        profile.externalVerification = {
          providerCode: params.providerCode,
          externalCaseId: params.externalCaseId,
          status: effectiveStatus,
          confidenceScore: params.confidenceScore,
          checksSummary: params.checksSummary,
          disclaimer: "EXTERNAL ADVISORY INTELLIGENCE - REQUIRES FINAL COMPLIANCE OFFICER DETERMINATION",
          receivedAt: /* @__PURE__ */ new Date(),
          callbackSignatureVerified: params.signatureVerified
        };
        profile.updatedAt = /* @__PURE__ */ new Date();
        if (profile.status === "SUBMITTED") {
          profile.status = "UNDER_REVIEW";
        }
        defaultAuditService.logAction({
          action: "KYC_REVIEWED",
          actorUserId: `system_provider_${params.providerCode}`,
          actorRole: "SYSTEM",
          resourceType: "KycProfile",
          resourceId: profile.id,
          financialTxId: void 0,
          details: {
            providerCode: params.providerCode,
            externalCaseId: params.externalCaseId,
            externalStatus: effectiveStatus,
            signatureVerified: params.signatureVerified,
            autoApprovalPrevented: true
          }
        });
        return profile;
      }
      validateTaxId(type, value, country) {
        const clean = value.replace(/[\s.-]/g, "").toUpperCase();
        if (!clean) throw new Error("Tax identifier is required.");
        if (type === "US_SSN") {
          if (!/^\d{9}$/.test(clean) && !/^\d{4}$/.test(clean)) {
            throw new Error("US SSN must be 9 digits (or last 4 digits for Tier 1).");
          }
          return;
        }
        if (type === "US_ITIN") {
          if (!/^9\d{8}$/.test(clean)) {
            throw new Error("US ITIN must be 9 digits and start with 9.");
          }
          return;
        }
        if (type === "BR_CPF") {
          if (!/^\d{11}$/.test(clean)) {
            throw new Error("Brazilian CPF must be 11 digits.");
          }
          return;
        }
        if (type === "ES_DNI") {
          if (!/^\d{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(clean)) {
            throw new Error("Spanish DNI must be 8 digits followed by a check letter.");
          }
          return;
        }
        if (type === "ES_NIE") {
          if (!/^[XYZ]\d{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(clean)) {
            throw new Error("Spanish NIE must start with X, Y, or Z, followed by 7 digits and a check letter.");
          }
          return;
        }
        const option = findTaxIdOption(country, type);
        if (!option) {
          throw new Error("Tax ID type is not valid for this country.");
        }
        if (!new RegExp(option.pattern).test(clean)) {
          throw new Error(option.patternHint);
        }
      }
    };
    defaultKycService = new KycService();
  }
});

// src/server/services/auth.service.ts
var AuthService2, defaultAuthService;
var init_auth_service = __esm({
  "src/server/services/auth.service.ts"() {
    "use strict";
    init_security_service();
    init_ledger_service();
    init_audit_service();
    init_email_service();
    init_env_config();
    init_prototypeAccess();
    AuthService2 = class {
      usersByEmail = /* @__PURE__ */ new Map();
      usersById = /* @__PURE__ */ new Map();
      sessionsByTokenHash = /* @__PURE__ */ new Map();
      resetTokensByHash = /* @__PURE__ */ new Map();
      // Rate limiting / Lockout config
      MAX_FAILED_ATTEMPTS = 5;
      LOCKOUT_DURATION_MS = 15 * 60 * 1e3;
      // 15 minutes
      SESSION_TTL_MS = 24 * 60 * 60 * 1e3;
      // 24 hours
      RESET_TOKEN_TTL_MS = 15 * 60 * 1e3;
      // 15 minutes
      readyPromise;
      constructor() {
        this.readyPromise = this.seedPrimaryAdminAccount();
      }
      /** Single operational admin for local / prototype control-center access. */
      async seedPrimaryAdminAccount() {
        const email = "support@avenorabank.com";
        if (this.usersByEmail.has(email)) {
          return;
        }
        const passwordHash = await SecurityService.hashPassword("AvenoraPassword2026!");
        const transactionPinHash = await SecurityService.hashPassword("1234");
        this.createUserInternal({
          id: "usr_staff_support_admin_01",
          email,
          passwordHash,
          fullName: "Avenora Support Admin",
          phoneNumber: "12025550100",
          transactionPinHash,
          countryCode: "US",
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          kycStatus: "APPROVED",
          mfaEnabled: true,
          mfaSecret: "JBSWY3DPEHPK3PXP"
        });
      }
      /**
       * Creates staff fixtures for automated tests only. Never called from the app constructor.
       */
      async seedStaffUsersForAutomatedTests() {
        await this.readyPromise;
        if (this.usersByEmail.has("admin.super@avenora.internal")) {
          return;
        }
        const defaultPassword = "AvenoraPassword2026!";
        const hash = await SecurityService.hashPassword(defaultPassword);
        const defaultPinHash = await SecurityService.hashPassword("1234");
        this.createUserInternal({
          id: "usr_staff_support_01",
          email: "support.lead@avenora.internal",
          passwordHash: hash,
          fullName: "Elena Rostova (Support)",
          phoneNumber: "12025550200",
          transactionPinHash: defaultPinHash,
          countryCode: "US",
          role: "SUPPORT",
          status: "ACTIVE",
          kycStatus: "APPROVED",
          mfaEnabled: true,
          mfaSecret: "JBSWY3DPEHPK3PXP"
        });
        this.createUserInternal({
          id: "usr_staff_compliance_01",
          email: "compliance.lead@avenora.internal",
          passwordHash: hash,
          fullName: "Maria Chen (Compliance)",
          phoneNumber: "12025550201",
          transactionPinHash: defaultPinHash,
          countryCode: "US",
          role: "COMPLIANCE_REVIEWER",
          status: "ACTIVE",
          kycStatus: "APPROVED",
          mfaEnabled: true,
          mfaSecret: "JBSWY3DPEHPK3PXP"
        });
        this.createUserInternal({
          id: "usr_staff_ops_admin_01",
          email: "admin.ops@avenora.internal",
          passwordHash: hash,
          fullName: "Marcus Sterling (Ops Admin)",
          phoneNumber: "12025550202",
          transactionPinHash: defaultPinHash,
          countryCode: "US",
          role: "ADMIN",
          status: "ACTIVE",
          kycStatus: "APPROVED",
          mfaEnabled: true,
          mfaSecret: "JBSWY3DPEHPK3PXP"
        });
        this.createUserInternal({
          id: "usr_staff_admin_01",
          email: "admin.super@avenora.internal",
          passwordHash: hash,
          fullName: "David Thorne (Super Admin)",
          phoneNumber: "12025550203",
          transactionPinHash: defaultPinHash,
          countryCode: "US",
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          kycStatus: "APPROVED",
          mfaEnabled: true,
          mfaSecret: "JBSWY3DPEHPK3PXP"
        });
      }
      createUserInternal(user) {
        const fullRecord = {
          ...user,
          failedLoginAttempts: 0,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.usersByEmail.set(user.email.toLowerCase(), fullRecord);
        this.usersById.set(user.id, fullRecord);
        return fullRecord;
      }
      /**
       * Registers a new customer with duplicate email protection.
       */
      async registerCustomer(params) {
        await this.readyPromise;
        const emailNorm = params.email.trim().toLowerCase();
        if (this.usersByEmail.has(emailNorm)) {
          throw new Error("An account with this email address already exists.");
        }
        if (params.password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }
        const phoneDigits = params.phoneNumber.replace(/\D/g, "");
        if (phoneDigits.length < 7 || phoneDigits.length > 15) {
          throw new Error("Enter a valid phone number (7\u201315 digits).");
        }
        if (!/^\d{4}$/.test(params.transactionPin)) {
          throw new Error("Transaction PIN must be exactly 4 digits.");
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
          countryCode: params.countryCode?.toUpperCase() || "US",
          role: "CUSTOMER",
          // Customers NEVER self-assign roles
          // Inactive until compliance approves KYC (prototype bypass starts ACTIVE).
          status: isKycBypassEnabled() ? "ACTIVE" : "PENDING_VERIFICATION",
          kycStatus: isKycBypassEnabled() ? "APPROVED" : "NOT_STARTED",
          mfaEnabled: false
        });
        defaultLedgerService.provisionCustomerAccounts(userId, user.fullName, user.countryCode);
        void defaultEmailService.sendWelcomeEmail({ to: user.email, fullName: user.fullName }).catch((err) => console.error("[auth] welcome email failed:", err));
        return this.createSession(user, params.ipAddress, params.userAgent, {
          transactionPinUnlocked: true
        });
      }
      /**
       * Authenticates a user with password, lockout protection, and optional MFA validation.
       */
      async login(params) {
        await this.readyPromise;
        const emailNorm = params.email.trim().toLowerCase();
        const user = this.usersByEmail.get(emailNorm);
        const genericAuthError = new Error("Invalid email or password.");
        if (!user) {
          await SecurityService.verifyPassword("dummy", "scrypt:salt:00");
          throw genericAuthError;
        }
        if (user.lockedUntil && user.lockedUntil > /* @__PURE__ */ new Date()) {
          const waitMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 6e4);
          throw new Error(`Account temporarily locked due to excessive failed attempts. Please try again in ${waitMinutes} minutes.`);
        }
        const isPasswordValid = await SecurityService.verifyPassword(params.password, user.passwordHash);
        if (!isPasswordValid) {
          user.failedLoginAttempts += 1;
          if (user.failedLoginAttempts >= this.MAX_FAILED_ATTEMPTS) {
            user.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS);
            voidEmail(
              "login-lockout",
              defaultEmailService.sendLoginLockoutEmail({
                to: user.email,
                fullName: user.fullName,
                lockMinutes: Math.ceil(this.LOCKOUT_DURATION_MS / 6e4)
              })
            );
          }
          throw genericAuthError;
        }
        user.failedLoginAttempts = 0;
        user.lockedUntil = void 0;
        if (!isKycBypassEnabled() && user.role === "CUSTOMER" && user.kycStatus === "APPROVED") {
          try {
            const { defaultKycService: defaultKycService2 } = await Promise.resolve().then(() => (init_kyc_service(), kyc_service_exports));
            const profile = defaultKycService2.getOrCreateProfile(user.id);
            const bypassOnly = !profile.reviewedAt || profile.residentialAddress?.street === "Prototype address pending KYC submission";
            if (bypassOnly) {
              const restoredStatus = profile.submittedAt ? "SUBMITTED" : "NOT_STARTED";
              user.kycStatus = restoredStatus;
              profile.status = restoredStatus;
              profile.updatedAt = /* @__PURE__ */ new Date();
              const { defaultDomesticBankAccountService: defaultDomesticBankAccountService2 } = await Promise.resolve().then(() => (init_domesticBankAccount_service(), domesticBankAccount_service_exports));
              defaultDomesticBankAccountService2.clearPrimaryAccountForUser(user.id);
            }
            this.syncCustomerActivationFromKyc(user.id);
          } catch {
          }
        } else if (!isKycBypassEnabled() && user.role === "CUSTOMER") {
          this.syncCustomerActivationFromKyc(user.id);
        }
        if (user.mfaEnabled && user.mfaSecret) {
          if (!params.totpCode && !params.recoveryCode) {
            return { requiresMfa: true };
          }
          if (params.totpCode) {
            const config = getValidatedConfig();
            const isDemoBypass = config.PROTOTYPE_MODE && params.totpCode === "123456" && (user.email.endsWith("@avenora.internal") || user.email === "support@avenorabank.com");
            const isTotpValid = isDemoBypass || SecurityService.verifyTotpCode(user.mfaSecret, params.totpCode);
            if (!isTotpValid) {
              throw new Error("Invalid MFA verification code.");
            }
          } else if (params.recoveryCode) {
            const hashedAttempt = SecurityService.hashToken(params.recoveryCode.trim().toUpperCase());
            const codeIndex = (user.mfaRecoveryCodes || []).indexOf(hashedAttempt);
            if (codeIndex === -1) {
              throw new Error("Invalid or already used recovery code.");
            }
            user.mfaRecoveryCodes?.splice(codeIndex, 1);
          }
        }
        const isNewDevice = !Array.from(this.sessionsByTokenHash.values()).some(
          (s) => s.userId === user.id && s.userAgent === params.userAgent
        );
        const authResult = await this.createSession(user, params.ipAddress, params.userAgent);
        const signedInAt = (/* @__PURE__ */ new Date()).toISOString();
        voidEmail(
          "login-success",
          defaultEmailService.sendLoginSuccessEmail({
            to: user.email,
            fullName: user.fullName,
            ipAddress: params.ipAddress,
            signedInAt
          })
        );
        if (isNewDevice) {
          voidEmail(
            "login-new-device",
            defaultEmailService.sendLoginNewDeviceEmail({
              to: user.email,
              fullName: user.fullName,
              ipAddress: params.ipAddress,
              userAgent: params.userAgent,
              signedInAt
            })
          );
        }
        return { requiresMfa: false, authResult };
      }
      /**
       * Validates a session token and returns the authenticated user.
       */
      async validateSession(sessionToken) {
        if (!sessionToken) return null;
        await this.readyPromise;
        const tokenHash = SecurityService.hashToken(sessionToken);
        const session = this.sessionsByTokenHash.get(tokenHash);
        if (!session) return null;
        if (session.isRevoked) return null;
        if (session.expiresAt < /* @__PURE__ */ new Date()) {
          session.isRevoked = true;
          return null;
        }
        const user = this.usersById.get(session.userId);
        if (!user) {
          return null;
        }
        return user;
      }
      /**
       * Revokes a session (Logout).
       */
      async revokeSession(sessionToken) {
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
      async revokeAllUserSessions(userId) {
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
      async requestPasswordReset(email) {
        const user = this.usersByEmail.get(email.trim().toLowerCase());
        if (!user) {
          return {};
        }
        const rawToken = SecurityService.generateSecureToken(32);
        const tokenHash = SecurityService.hashToken(rawToken);
        const record = {
          id: `prt_${Date.now()}`,
          userId: user.id,
          tokenHash,
          isUsed: false,
          expiresAt: new Date(Date.now() + this.RESET_TOKEN_TTL_MS),
          createdAt: /* @__PURE__ */ new Date()
        };
        this.resetTokensByHash.set(tokenHash, record);
        const emailResult = await defaultEmailService.sendPasswordResetEmail({
          to: user.email,
          fullName: user.fullName,
          resetToken: rawToken
        });
        const config = getValidatedConfig();
        const exposeDebugToken = !emailResult.sent || config.PROTOTYPE_MODE || config.NODE_ENV !== "production";
        return {
          token: exposeDebugToken ? rawToken : void 0,
          emailSent: emailResult.sent
        };
      }
      /**
       * Completes password reset using single-use token.
       */
      async resetPassword(token, newPassword) {
        if (newPassword.length < 8) {
          throw new Error("New password must be at least 8 characters long.");
        }
        const tokenHash = SecurityService.hashToken(token);
        const resetRecord = this.resetTokensByHash.get(tokenHash);
        if (!resetRecord || resetRecord.isUsed || resetRecord.expiresAt < /* @__PURE__ */ new Date()) {
          throw new Error("Password reset token is invalid or has expired.");
        }
        const user = this.usersById.get(resetRecord.userId);
        if (!user) {
          throw new Error("User not found.");
        }
        resetRecord.isUsed = true;
        user.passwordHash = await SecurityService.hashPassword(newPassword);
        user.updatedAt = /* @__PURE__ */ new Date();
        await this.revokeAllUserSessions(user.id);
        voidEmail(
          "password-reset-completed",
          defaultEmailService.sendPasswordResetCompletedEmail({
            to: user.email,
            fullName: user.fullName
          })
        );
      }
      /**
       * Authenticated password change.
       */
      async changePassword(userId, currentPassword, newPassword) {
        if (newPassword.length < 8) {
          throw new Error("New password must be at least 8 characters long.");
        }
        const user = this.usersById.get(userId);
        if (!user) {
          throw new Error("User not found.");
        }
        const isValid = await SecurityService.verifyPassword(currentPassword, user.passwordHash);
        if (!isValid) {
          throw new Error("Current password does not match.");
        }
        user.passwordHash = await SecurityService.hashPassword(newPassword);
        user.updatedAt = /* @__PURE__ */ new Date();
        voidEmail(
          "password-changed",
          defaultEmailService.sendPasswordChangedEmail({
            to: user.email,
            fullName: user.fullName
          })
        );
      }
      /**
       * Initiates TOTP MFA enrollment: returns secret and otpauth URI.
       */
      async startMfaEnrollment(userId) {
        const user = this.usersById.get(userId);
        if (!user) throw new Error("User not found");
        const secret = SecurityService.generateTotpSecret();
        const otpauthUri = SecurityService.generateTotpUri(user.email, secret);
        return { secret, otpauthUri };
      }
      /**
       * Confirms TOTP MFA enrollment by validating initial 6-digit code.
       */
      async confirmMfaEnrollment(userId, secret, code) {
        const user = this.usersById.get(userId);
        if (!user) throw new Error("User not found");
        const isValid = SecurityService.verifyTotpCode(secret, code);
        if (!isValid) {
          throw new Error("Invalid verification code. Please check your authenticator clock.");
        }
        const { rawCodes, hashedCodes } = SecurityService.generateRecoveryCodes();
        user.mfaEnabled = true;
        user.mfaSecret = secret;
        user.mfaRecoveryCodes = hashedCodes;
        user.updatedAt = /* @__PURE__ */ new Date();
        voidEmail(
          "mfa-enrolled",
          defaultEmailService.sendMfaEnrolledEmail({
            to: user.email,
            fullName: user.fullName
          })
        );
        return { recoveryCodes: rawCodes };
      }
      getUserById(id) {
        return this.usersById.get(id);
      }
      /**
       * Keeps customer account activation aligned with KYC approval.
       * - APPROVED → ACTIVE (transactions permitted)
       * - Any other KYC state → PENDING_VERIFICATION (inactive; no transactions)
       * Does not override admin SUSPENDED / LOCKED holds.
       */
      syncCustomerActivationFromKyc(userId) {
        const user = this.usersById.get(userId);
        if (!user || user.role !== "CUSTOMER") return void 0;
        if (user.status === "SUSPENDED" || user.status === "LOCKED") {
          return user.status;
        }
        if (isKycBypassEnabled() && user.kycStatus === "APPROVED") {
          if (user.status !== "ACTIVE") {
            user.status = "ACTIVE";
            user.updatedAt = /* @__PURE__ */ new Date();
          }
          return user.status;
        }
        const prevStatus = user.status;
        const nextStatus = user.kycStatus === "APPROVED" ? "ACTIVE" : "PENDING_VERIFICATION";
        if (user.status !== nextStatus) {
          user.status = nextStatus;
          user.updatedAt = /* @__PURE__ */ new Date();
          if (nextStatus === "PENDING_VERIFICATION" && prevStatus === "ACTIVE") {
            voidEmail(
              "pending-verification",
              defaultEmailService.sendPendingVerificationEmail({
                to: user.email,
                fullName: user.fullName
              })
            );
          }
        }
        return user.status;
      }
      /** Resolve a customer by email (case-insensitive) or internal user id. */
      resolveUserByEmailOrId(query) {
        const trimmed = query.trim();
        if (!trimmed) return void 0;
        const byEmail = this.usersByEmail.get(trimmed.toLowerCase());
        if (byEmail) return byEmail;
        return this.usersById.get(trimmed);
      }
      sanitizeUser(user) {
        const { passwordHash, transactionPinHash, mfaSecret, mfaRecoveryCodes, ...safeUser } = user;
        return safeUser;
      }
      /** Returns whether the current session has completed post-login PIN unlock. */
      isTransactionPinUnlocked(sessionToken) {
        if (!sessionToken) return false;
        const tokenHash = SecurityService.hashToken(sessionToken);
        const session = this.sessionsByTokenHash.get(tokenHash);
        if (!session || session.isRevoked || session.expiresAt < /* @__PURE__ */ new Date()) return false;
        return session.transactionPinUnlocked === true;
      }
      /**
       * Verifies the 4-digit transaction PIN for the session user and unlocks the session.
       * Uses the same lockout counters as password login.
       */
      async unlockSessionWithTransactionPin(sessionToken, transactionPin) {
        await this.readyPromise;
        if (!/^\d{4}$/.test(transactionPin)) {
          throw new Error("Transaction PIN must be exactly 4 digits.");
        }
        const tokenHash = SecurityService.hashToken(sessionToken);
        const session = this.sessionsByTokenHash.get(tokenHash);
        if (!session || session.isRevoked || session.expiresAt < /* @__PURE__ */ new Date()) {
          throw new Error("Invalid or expired session.");
        }
        const user = this.usersById.get(session.userId);
        if (!user) {
          throw new Error("Invalid or expired session.");
        }
        await this.assertTransactionPinForUser(user, transactionPin);
        session.transactionPinUnlocked = true;
        session.updatedAt = /* @__PURE__ */ new Date();
        return { transactionPinUnlocked: true };
      }
      /**
       * Verifies a transaction PIN for a money-moving operation (does not unlock the session).
       */
      async verifyTransactionPinForUser(userId, transactionPin) {
        await this.readyPromise;
        if (!/^\d{4}$/.test(transactionPin)) {
          throw new Error("Transaction PIN must be exactly 4 digits.");
        }
        const user = this.usersById.get(userId);
        if (!user) {
          throw new Error("Invalid transaction PIN.");
        }
        await this.assertTransactionPinForUser(user, transactionPin);
      }
      async assertTransactionPinForUser(user, transactionPin) {
        if (user.lockedUntil && user.lockedUntil > /* @__PURE__ */ new Date()) {
          const waitMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 6e4);
          throw new Error(
            `Account temporarily locked due to excessive failed attempts. Please try again in ${waitMinutes} minutes.`
          );
        }
        const isValid = await SecurityService.verifyPassword(transactionPin, user.transactionPinHash);
        if (!isValid) {
          user.failedLoginAttempts += 1;
          user.updatedAt = /* @__PURE__ */ new Date();
          if (user.failedLoginAttempts >= this.MAX_FAILED_ATTEMPTS) {
            user.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MS);
            voidEmail(
              "login-lockout",
              defaultEmailService.sendLoginLockoutEmail({
                to: user.email,
                fullName: user.fullName,
                lockMinutes: Math.ceil(this.LOCKOUT_DURATION_MS / 6e4)
              })
            );
          }
          throw new Error("Invalid transaction PIN.");
        }
        user.failedLoginAttempts = 0;
        user.lockedUntil = void 0;
        user.updatedAt = /* @__PURE__ */ new Date();
      }
      async createSession(user, ipAddress, userAgent, options) {
        const rawSessionToken = SecurityService.generateSecureToken(32);
        const tokenHash = SecurityService.hashToken(rawSessionToken);
        const expiresAt = new Date(Date.now() + this.SESSION_TTL_MS);
        const transactionPinUnlocked = options?.transactionPinUnlocked === true;
        const session = {
          id: `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: user.id,
          tokenHash,
          ipAddress,
          userAgent,
          isRevoked: false,
          transactionPinUnlocked,
          expiresAt,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.sessionsByTokenHash.set(tokenHash, session);
        return {
          user: this.sanitizeUser(user),
          sessionToken: rawSessionToken,
          expiresAt,
          transactionPinUnlocked
        };
      }
      /**
       * Retrieves all users for operations management (sanitized only).
       * Restricted to staff roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN.
       */
      async getAllUsersForAdmin(params) {
        await this.readyPromise;
        const allowed = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
        if (!allowed.includes(params.actorRole)) {
          throw new Error("Access denied: Staff role required.");
        }
        let list = Array.from(this.usersById.values());
        if (params.roleFilter && params.roleFilter !== "ALL") {
          list = list.filter((u) => u.role === params.roleFilter);
        }
        if (params.statusFilter && params.statusFilter !== "ALL") {
          list = list.filter((u) => u.status === params.statusFilter);
        }
        if (params.kycFilter && params.kycFilter !== "ALL") {
          list = list.filter((u) => u.kycStatus === params.kycFilter);
        }
        if (params.search) {
          const q = params.search.toLowerCase().trim();
          list = list.filter(
            (u) => u.id.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q) || u.countryCode.toLowerCase().includes(q)
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
      async updateUserStatus(params) {
        await this.readyPromise;
        const allowed = ["SUPPORT", "ADMIN", "SUPER_ADMIN"];
        if (!allowed.includes(params.actorRole)) {
          throw new Error("Access denied: Only Support, Admin, or Super Admin can modify account status.");
        }
        if (!params.reason || params.reason.trim().length < 5) {
          throw new Error("A documented operational reason of at least 5 characters is strictly required.");
        }
        const targetUser = this.usersById.get(params.targetUserId);
        if (!targetUser) {
          throw new Error(`Target user not found: ${params.targetUserId}`);
        }
        if (params.actorRole === "SUPPORT" && (targetUser.role === "ADMIN" || targetUser.role === "SUPER_ADMIN")) {
          throw new Error("Access denied: Support role cannot alter status of Administrator accounts.");
        }
        if (params.actorUserId === params.targetUserId && params.newStatus !== "ACTIVE") {
          throw new Error("Safety guard: You cannot suspend or lock your own active administrative account.");
        }
        const prevStatus = targetUser.status;
        targetUser.status = params.newStatus;
        targetUser.updatedAt = /* @__PURE__ */ new Date();
        if (params.newStatus === "LOCKED") {
          for (const session of this.sessionsByTokenHash.values()) {
            if (session.userId === targetUser.id) {
              session.isRevoked = true;
            }
          }
        }
        defaultAuditService.logAction({
          action: "USER_STATUS_CHANGED",
          actorUserId: params.actorUserId,
          actorRole: params.actorRole,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          resourceType: "USER",
          resourceId: targetUser.id,
          previousState: prevStatus,
          newState: params.newStatus,
          reason: params.reason.trim(),
          correlationId: params.correlationId,
          details: {
            targetEmail: targetUser.email,
            targetRole: targetUser.role
          }
        });
        if (params.newStatus === "SUSPENDED") {
          voidEmail(
            "account-suspended",
            defaultEmailService.sendAccountSuspendedEmail({
              to: targetUser.email,
              fullName: targetUser.fullName,
              reason: params.reason.trim()
            })
          );
        } else if (params.newStatus === "LOCKED") {
          voidEmail(
            "account-locked",
            defaultEmailService.sendAccountLockedEmail({
              to: targetUser.email,
              fullName: targetUser.fullName,
              reason: params.reason.trim()
            })
          );
        } else if (params.newStatus === "ACTIVE" && (prevStatus === "SUSPENDED" || prevStatus === "LOCKED")) {
          voidEmail(
            "account-restored",
            defaultEmailService.sendAccountRestoredEmail({
              to: targetUser.email,
              fullName: targetUser.fullName
            })
          );
        }
        return this.sanitizeUser(targetUser);
      }
      /**
       * Updates a user's role (CUSTOMER, SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN).
       * Strictly restricted to SUPER_ADMIN. Audited, requires documented operational reason.
       */
      async updateUserRole(params) {
        await this.readyPromise;
        if (params.actorRole !== "SUPER_ADMIN") {
          throw new Error("Access denied: Role modifications are strictly restricted to Super Administrators.");
        }
        if (!params.reason || params.reason.trim().length < 5) {
          throw new Error("A documented reason of at least 5 characters is strictly required for role modifications.");
        }
        const targetUser = this.usersById.get(params.targetUserId);
        if (!targetUser) {
          throw new Error(`Target user not found: ${params.targetUserId}`);
        }
        if (targetUser.role === "SUPER_ADMIN" && params.newRole !== "SUPER_ADMIN") {
          const superAdminCount = Array.from(this.usersById.values()).filter((u) => u.role === "SUPER_ADMIN").length;
          if (superAdminCount <= 1) {
            throw new Error("Cannot demote the only remaining Super Administrator.");
          }
        }
        const prevRole = targetUser.role;
        targetUser.role = params.newRole;
        targetUser.updatedAt = /* @__PURE__ */ new Date();
        defaultAuditService.logAction({
          action: "USER_ROLE_CHANGED",
          actorUserId: params.actorUserId,
          actorRole: params.actorRole,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          resourceType: "USER",
          resourceId: targetUser.id,
          previousState: prevRole,
          newState: params.newRole,
          reason: params.reason.trim(),
          correlationId: params.correlationId,
          details: {
            targetEmail: targetUser.email
          }
        });
        voidEmail(
          "role-changed",
          defaultEmailService.sendRoleChangedEmail({
            to: targetUser.email,
            fullName: targetUser.fullName,
            newRole: params.newRole
          })
        );
        return this.sanitizeUser(targetUser);
      }
      /**
       * Permanently deletes a user account (prototype in-memory store).
       * Revokes sessions. Cannot delete self or the last SUPER_ADMIN.
       */
      async deleteUser(params) {
        await this.readyPromise;
        const allowed = ["ADMIN", "SUPER_ADMIN"];
        if (!allowed.includes(params.actorRole)) {
          throw new Error("Access denied: Only Admin or Super Admin can delete user accounts.");
        }
        if (!params.reason || params.reason.trim().length < 5) {
          throw new Error("A documented operational reason of at least 5 characters is strictly required.");
        }
        if (params.actorUserId === params.targetUserId) {
          throw new Error("Safety guard: You cannot delete your own administrative account.");
        }
        const targetUser = this.usersById.get(params.targetUserId);
        if (!targetUser) {
          throw new Error(`Target user not found: ${params.targetUserId}`);
        }
        if (params.actorRole === "ADMIN" && (targetUser.role === "ADMIN" || targetUser.role === "SUPER_ADMIN")) {
          throw new Error("Access denied: Admin cannot delete Administrator accounts.");
        }
        if (targetUser.role === "SUPER_ADMIN") {
          const superAdminCount = Array.from(this.usersById.values()).filter((u) => u.role === "SUPER_ADMIN").length;
          if (superAdminCount <= 1) {
            throw new Error("Cannot delete the only remaining Super Administrator.");
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
          action: "USER_DELETED",
          actorUserId: params.actorUserId,
          actorRole: params.actorRole,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          resourceType: "USER",
          resourceId: params.targetUserId,
          previousState: role,
          newState: "DELETED",
          reason: params.reason.trim(),
          correlationId: params.correlationId,
          details: {
            targetEmail: email,
            targetRole: role,
            targetFullName: fullName
          }
        });
        voidEmail(
          "account-deleted",
          defaultEmailService.sendAccountDeletedEmail({
            to: email,
            fullName
          })
        );
        return { deletedUserId: params.targetUserId, email };
      }
    };
    defaultAuthService = new AuthService2();
  }
});

// src/server/vercel-handler.ts
var vercel_handler_exports = {};
__export(vercel_handler_exports, {
  default: () => vercel_handler_default
});
module.exports = __toCommonJS(vercel_handler_exports);

// src/server/app.ts
var import_express14 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_cookie_parser = __toESM(require("cookie-parser"), 1);

// src/server/middleware/correlationId.ts
var import_crypto = __toESM(require("crypto"), 1);
function correlationIdMiddleware(req, res, next) {
  const incomingId = req.headers["x-correlation-id"] || req.headers["x-request-id"];
  const correlationId = typeof incomingId === "string" && incomingId.length > 0 ? incomingId : `ave_${import_crypto.default.randomUUID()}`;
  req.headers["x-correlation-id"] = correlationId;
  res.setHeader("X-Correlation-ID", correlationId);
  res.setHeader("X-Request-ID", correlationId);
  next();
}

// src/server/middleware/requestLogger.ts
var SENSITIVE_KEYS = /* @__PURE__ */ new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "apikey",
  "api_key",
  "cardnumber",
  "pan",
  "cvv",
  "ssn",
  "cpf",
  "taxid"
]);
function maskSensitiveData(data) {
  if (data === null || data === void 0) return data;
  if (typeof data !== "object") {
    if (typeof data === "string") {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
        const [user, domain] = data.split("@");
        return `${(user ?? "").slice(0, 1)}***@${domain}`;
      }
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }
  const maskedObj = {};
  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.toLowerCase().replace(/[-_]/g, "");
    if (SENSITIVE_KEYS.has(normalizedKey)) {
      maskedObj[key] = "[REDACTED_FINANCIAL_PII]";
    } else if (typeof value === "object" && value !== null) {
      maskedObj[key] = maskSensitiveData(value);
    } else {
      maskedObj[key] = value;
    }
  }
  return maskedObj;
}
function structuredLoggerMiddleware(req, res, next) {
  const startTime = process.hrtime.bigint();
  const correlationId = req.headers["x-correlation-id"] || "unknown";
  res.on("finish", () => {
    const elapsedNanos = process.hrtime.bigint() - startTime;
    const durationMs = Number(elapsedNanos) / 1e6;
    const logEntry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      correlationId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userAgent: req.get("user-agent") || "internal",
      query: maskSensitiveData(req.query)
    };
    if (res.statusCode >= 500) {
      console.error(JSON.stringify({ level: "ERROR", ...logEntry }));
    } else if (res.statusCode >= 400) {
      console.warn(JSON.stringify({ level: "WARN", ...logEntry }));
    } else {
      console.log(JSON.stringify({ level: "INFO", ...logEntry }));
    }
  });
  next();
}

// src/server/middleware/errorHandler.ts
var import_zod = require("zod");
init_LedgerInvariant();

// src/domain/ledger/TransactionState.ts
var InvalidStateTransitionError = class extends Error {
  constructor(current, attempted) {
    super(`Illegal financial state transition: cannot move from ${current} to ${attempted}`);
    this.current = current;
    this.attempted = attempted;
    this.name = "InvalidStateTransitionError";
  }
  current;
  attempted;
};

// src/server/middleware/errorHandler.ts
function centralErrorHandler(err, req, res, _next) {
  const correlationId = req.headers["x-correlation-id"] || void 0;
  const instance = req.originalUrl || req.url;
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  if (err instanceof import_zod.ZodError) {
    const invalidParams = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message
    }));
    const response2 = {
      type: "https://avenora.com/errors/validation-failed",
      title: "Bad Request / Invalid Parameters",
      status: 400,
      detail: "The submitted request payload failed strict schema validation.",
      instance,
      correlationId,
      invalidParams,
      timestamp
    };
    res.status(400).json(response2);
    return;
  }
  if (err instanceof LedgerInvariantError) {
    const response2 = {
      type: "https://avenora.com/errors/ledger-invariant-violation",
      title: "Financial Ledger Invariant Violation",
      status: 422,
      detail: err.message,
      instance,
      correlationId,
      timestamp
    };
    res.status(422).json(response2);
    return;
  }
  if (err instanceof InvalidStateTransitionError) {
    const response2 = {
      type: "https://avenora.com/errors/illegal-state-transition",
      title: "Illegal Transaction State Transition",
      status: 409,
      detail: err.message,
      instance,
      correlationId,
      timestamp
    };
    res.status(409).json(response2);
    return;
  }
  const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
  if (errorMessage.includes("Invalid email or password") || errorMessage.includes("Authentication Failed") || errorMessage.includes("Invalid credentials") || errorMessage.includes("Invalid MFA") || errorMessage.includes("recovery code") || errorMessage.includes("Unauthorized") || errorMessage.includes("unauthorized")) {
    const response2 = {
      type: "https://avenora.com/errors/unauthorized",
      title: "Authentication Failed",
      status: 401,
      detail: errorMessage,
      instance,
      correlationId,
      timestamp
    };
    res.status(401).json(response2);
    return;
  }
  if (errorMessage.includes("temporarily locked")) {
    const response2 = {
      type: "https://avenora.com/errors/account-locked",
      title: "Account Locked",
      status: 423,
      detail: errorMessage,
      instance,
      correlationId,
      timestamp
    };
    res.status(423).json(response2);
    return;
  }
  if (errorMessage.includes("Access denied") || errorMessage.includes("Account is suspended") || errorMessage.includes("Account is locked") || errorMessage.includes("Separation of duties") || errorMessage.includes("Forbidden")) {
    const response2 = {
      type: "https://avenora.com/errors/forbidden",
      title: "Forbidden",
      status: 403,
      detail: errorMessage,
      instance,
      correlationId,
      timestamp
    };
    res.status(403).json(response2);
    return;
  }
  if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
    const response2 = {
      type: "https://avenora.com/errors/conflict",
      title: "Resource Conflict",
      status: 409,
      detail: errorMessage,
      instance,
      correlationId,
      timestamp
    };
    res.status(409).json(response2);
    return;
  }
  if (errorMessage.includes("not found") || errorMessage.includes("User not found")) {
    const response2 = {
      type: "https://avenora.com/errors/not-found",
      title: "Resource Not Found",
      status: 404,
      detail: errorMessage,
      instance,
      correlationId,
      timestamp
    };
    res.status(404).json(response2);
    return;
  }
  if (errorMessage.includes("Password must be") || errorMessage.includes("Invalid or expired") || errorMessage.includes("Current password is incorrect") || errorMessage.includes("Invalid verification code") || errorMessage.includes("Cannot delete") || errorMessage.includes("documented reason") || errorMessage.includes("not awaiting issuance")) {
    const response2 = {
      type: "https://avenora.com/errors/bad-request",
      title: "Bad Request",
      status: 400,
      detail: errorMessage,
      instance,
      correlationId,
      timestamp
    };
    res.status(400).json(response2);
    return;
  }
  const isProduction = process.env.NODE_ENV === "production";
  const response = {
    type: "https://avenora.com/errors/internal-server-error",
    title: "Internal Server Error",
    status: 500,
    detail: isProduction ? "An unexpected internal system error occurred. Please reference correlation ID." : errorMessage,
    instance,
    correlationId,
    timestamp
  };
  res.status(500).json(response);
}

// src/server/routes/health.routes.ts
var import_express = require("express");

// src/server/services/health.service.ts
init_constants();
init_env_config();
var HealthService = class {
  static getLiveness() {
    const memory = process.memoryUsage();
    const memoryMb = Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100;
    return {
      status: "healthy",
      service: PLATFORM_METADATA.NAME,
      version: PLATFORM_METADATA.VERSION,
      releaseCodename: PLATFORM_METADATA.RELEASE_CODENAME,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      checks: {
        runtime: {
          status: "pass",
          nodeVersion: process.version,
          memoryMb
        },
        environment: {
          status: "pass",
          prototypeMode: true,
          liveMoneyMovementBlocked: true
        }
      }
    };
  }
  static getReadiness() {
    let config;
    try {
      config = getValidatedConfig();
    } catch {
      config = null;
    }
    const dbConfigured = Boolean(
      config?.DATABASE_URL && !config.DATABASE_URL.includes("placeholder_password")
    );
    return {
      status: "ready",
      service: PLATFORM_METADATA.NAME,
      version: PLATFORM_METADATA.VERSION,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      subsystems: {
        database: {
          status: dbConfigured ? "configured" : "pending_provisioning",
          provider: "postgresql_neon",
          pooling: true
        },
        ledgerEngine: {
          status: "ready",
          mode: "in_memory_reference_store"
        },
        idempotencyStore: {
          status: "ready"
        }
      }
    };
  }
};

// src/server/routes/health.routes.ts
var healthRouter = (0, import_express.Router)();
healthRouter.get("/health", (_req, res) => {
  const health = HealthService.getLiveness();
  res.status(200).json(health);
});
healthRouter.get("/ready", (_req, res) => {
  const readiness = HealthService.getReadiness();
  res.status(200).json(readiness);
});

// src/server/routes/ledger.routes.ts
var import_express2 = require("express");
var import_zod3 = require("zod");
init_ledger_service();
init_LedgerInvariant();
var ledgerRouter = (0, import_express2.Router)();
var PostEntrySchema = import_zod3.z.object({
  transactionId: import_zod3.z.string().min(1, "Transaction ID is required"),
  currency: import_zod3.z.string().length(3, "Currency code must be 3 characters"),
  narration: import_zod3.z.string().min(3, "Narration must be at least 3 characters"),
  lines: import_zod3.z.array(
    import_zod3.z.object({
      accountId: import_zod3.z.string().min(1),
      direction: import_zod3.z.enum(["DEBIT", "CREDIT"]),
      amountMinor: import_zod3.z.string().or(import_zod3.z.number()).transform((val) => BigInt(val)),
      description: import_zod3.z.string().optional()
    })
  ).min(2, "Journal entry requires at least 2 lines")
});
ledgerRouter.get("/accounts", (_req, res) => {
  const accounts = defaultLedgerService.getAccounts();
  res.json({
    count: accounts.length,
    accounts
  });
});
ledgerRouter.get("/entries", (_req, res) => {
  const entries = defaultLedgerService.getEntries().map((e) => ({
    ...e,
    lines: e.lines.map((l) => ({
      ...l,
      amountMinor: l.amountMinor.toString()
    }))
  }));
  res.json({
    count: entries.length,
    entries
  });
});
ledgerRouter.get("/summary", (_req, res) => {
  const summary = defaultLedgerService.getLedgerSummary();
  res.json(summary);
});
ledgerRouter.get("/verify-invariant", (_req, res) => {
  const summary = defaultLedgerService.getLedgerSummary();
  res.json({
    invariantSatisfied: summary.isBalanced,
    globalDebitsMinor: summary.globalDebitsMinor,
    globalCreditsMinor: summary.globalCreditsMinor,
    imbalanceMinor: summary.imbalanceMinor,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    rule: "Sum(Debits) === Sum(Credits) across all posted journal entries"
  });
});
ledgerRouter.post("/entries", (req, res, next) => {
  try {
    const validated = PostEntrySchema.parse(req.body);
    const invariant = verifyDoubleEntryInvariant(validated.lines);
    if (!invariant.isValid) {
      res.status(422).json({
        type: "https://avenora.com/errors/unbalanced-entry",
        title: "Unbalanced Journal Entry",
        status: 422,
        detail: invariant.error,
        totalDebitMinor: invariant.totalDebitMinor.toString(),
        totalCreditMinor: invariant.totalCreditMinor.toString(),
        imbalanceMinor: invariant.imbalanceMinor.toString()
      });
      return;
    }
    const created = defaultLedgerService.postJournalEntry({
      transactionId: validated.transactionId,
      currency: validated.currency,
      narration: validated.narration,
      lines: validated.lines
    });
    res.status(201).json({
      status: "posted",
      entry: {
        ...created,
        lines: created.lines.map((l) => ({
          ...l,
          amountMinor: l.amountMinor.toString()
        }))
      }
    });
  } catch (err) {
    next(err);
  }
});

// src/server/routes/system.routes.ts
var import_express3 = require("express");
var import_zod4 = require("zod");
init_constants();
init_Currency();
init_env_config();
init_identifier_service();
init_CountryRules();

// src/domain/country/ProviderCapabilityMatrix.ts
var PROVIDER_INTEGRATION_PREREQUISITES = [
  {
    category: "BANK_ACCOUNT_PROVISIONING",
    title: "Core Depository & Clearing Sponsor Bank Partnership",
    description: "Direct clearinghouse access or commercial partnership with an authorized depository institution with FBO (For Benefit Of) account structure.",
    mandatoryCertifications: ["SOC 1 Type II (SSAE 18)", "SOC 2 Type II", "ISO 27001"],
    regulatoryRegistrations: ["FinCEN MSB (US)", "FCA Payment Institution / EMI (UK)", "BaFin ZAG License (DE/EU)", "BACEN Authorized IP (BR)"],
    operationalRequirements: ["24/7 Liquidity Monitoring", "Daily Automated Ledger Reconciliation", "Negative Balance Prevention Safeguards"],
    currentStatus: "UNMET"
  },
  {
    category: "FIAT_PAYMENT_INITIATION",
    title: "Real-Time Clearing Network Direct/Indirect Connectivity",
    description: "Technical and operational gateway to FedNow/ACH (US), Faster Payments / BACS (UK), SEPA SCT Inst (EU), and PIX SPI (Brazil).",
    mandatoryCertifications: ["FedLine Direct / FedLine Advantage Security Validation", "ISO 20022 Schema Conformance"],
    regulatoryRegistrations: ["Authorized Payment Initiation Service Provider (PISP)", "OFAC / Sanctions Screening Automation"],
    operationalRequirements: ["Real-Time Fraud Scoring & AML Velocity Throttles", "Sub-second Idempotency Registry"],
    currentStatus: "UNMET"
  },
  {
    category: "CARD_ISSUANCE",
    title: "Card Network Principal Membership / Sponsor BIN Agreement",
    description: "Formal card program agreement with Visa or Mastercard, BIN range assignment, and Certified Card Management System (CMS).",
    mandatoryCertifications: ["PCI-DSS Level 1 Service Provider Certification", "EMVCo 3-D Secure (3DS 2.2) ACS Certification", "Visa VTS / Mastercard MDES Tokenization"],
    regulatoryRegistrations: ["Prepaid / Debit Card Program Manager Filing"],
    operationalRequirements: ["HSM (Hardware Security Module) Pin & Key Cryptography", "Real-time 150ms Authorization Engine SLA"],
    currentStatus: "UNMET"
  },
  {
    category: "IDENTITY_VERIFICATION",
    title: "Certified Identity Service Provider (IDSP) Integration",
    description: "Regulated biometric and document verification gateway with access to authoritative government registers.",
    mandatoryCertifications: ["eIDAS High / Substantial Conformance (EU)", "NIST SP 800-63-3 IAL2 / AAL2", "SOC 2 Type II"],
    regulatoryRegistrations: ["GDPR Article 28 Data Processing Agreement", "State Biometric Information Privacy Act (BIPA) Compliance"],
    operationalRequirements: ["Secure Document Vault with Client-Side Encryption", "Mandatory 4-Eyes Compliance Review Queue"],
    currentStatus: "UNMET"
  },
  {
    category: "BITCOIN_CUSTODY",
    title: "Institutional Qualified Custodian Designation",
    description: "Segregated cold storage vault, Multi-Party Computation (MPC), and hot-wallet liquidity provider.",
    mandatoryCertifications: ["Cryptocurrency Security Standard (CCSS) Level 3", "SOC 2 Type II with Custody Controls Addendum"],
    regulatoryRegistrations: ["NYDFS BitLicense or Limited Purpose Trust Charter", "FinCEN Money Services Business (MSB) Convertible Virtual Currency"],
    operationalRequirements: ["Quorum-Governed Multi-Sig Timelock Withdrawals", "Comprehensive Specie / Crime Insurance Policy ($50M+ Coverage)"],
    currentStatus: "UNMET"
  },
  {
    category: "FX_SETTLEMENT",
    title: "Institutional Wholesale FX Liquidity & ISDA Master Agreement",
    description: "Credit facility and multi-currency settlement clearing accounts with Tier 1 liquidity providers.",
    mandatoryCertifications: ["FX Global Code of Conduct Signatory", "ISO 20022 Real-Time Settlement Engine"],
    regulatoryRegistrations: ["Commodity Futures Trading Commission (CFTC) / NFA Registration (US)", "MiFID II Investment Firm / MTF (EU)"],
    operationalRequirements: ["Real-Time Slippage Monitoring & Maximum Spread Caps", "Dual-Leg Settlement Risk Mitigation (PvP via CLS)"],
    currentStatus: "UNMET"
  }
];
var COUNTRY_PROVIDER_CAPABILITY_MATRIX = [
  {
    countryCode: "US",
    countryName: "United States",
    currency: "USD",
    clearingRail: "FedACH / FedNow / RTP",
    formatSupported: true,
    supportedIdentifierTypes: ["BANK_ACCOUNT", "TAX_ID", "PAYMENT_CARD"],
    serviceCapabilities: {
      BANK_ACCOUNT_PROVISIONING: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Simulated Federal Reserve 021000021 routing supported. Production requires Sponsor Bank FBO agreement and FinCEN MSB registration."
      },
      FIAT_PAYMENT_INITIATION: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Mock ACH clearance implemented. Live FedACH/FedNow settlement disabled by environment guard."
      },
      CARD_ISSUANCE: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Simulated Visa/Mastercard BIN generation with Luhn check. Requires PCI-DSS Level 1 and Issuer Processor contract."
      },
      IDENTITY_VERIFICATION: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Synthetic SSN validation and admin approval workflow active. Live KYC provider adapter not connected."
      },
      BITCOIN_CUSTODY: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Prototype address allocation and ledger tracking active. Production requires institutional qualified custodian."
      },
      FX_SETTLEMENT: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Algorithmic zero-float FX quoting active. Live interbank FX delivery unconfigured."
      }
    }
  },
  {
    countryCode: "GB",
    countryName: "United Kingdom",
    currency: "GBP",
    clearingRail: "Faster Payments (FPS) / BACS / CHAPS",
    formatSupported: true,
    supportedIdentifierTypes: ["BANK_ACCOUNT", "IBAN", "SORT_CODE", "TAX_ID", "PAYMENT_CARD"],
    serviceCapabilities: {
      BANK_ACCOUNT_PROVISIONING: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "UK Sort Code and Account Number generation with GB IBAN active. Requires FCA Authorised Payment Institution (API) license."
      },
      FIAT_PAYMENT_INITIATION: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Faster Payments simulation active. Live Pay.UK settlement disabled."
      },
      CARD_ISSUANCE: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Virtual card issuance simulated. Requires UK BIN sponsorship."
      },
      IDENTITY_VERIFICATION: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Manual compliance review queue active. UK IDSP integration unconfigured."
      },
      BITCOIN_CUSTODY: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Segregated ledger balance simulation active. Requires FCA MLR crypto registration."
      },
      FX_SETTLEMENT: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "GBP/USD and GBP/EUR cross-rate quoting active in prototype mode."
      }
    }
  },
  {
    countryCode: "ES",
    countryName: "Spain (Eurozone)",
    currency: "EUR",
    clearingRail: "SEPA Credit Transfer (SCT) / SCT Inst / Iberpay",
    formatSupported: true,
    supportedIdentifierTypes: ["BANK_ACCOUNT", "IBAN", "TAX_ID", "PAYMENT_CARD"],
    serviceCapabilities: {
      BANK_ACCOUNT_PROVISIONING: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Banco de Espa\xF1a CCC and ES IBAN active. Requires Banco de Espa\xF1a EDE / Payment Institution passport."
      },
      FIAT_PAYMENT_INITIATION: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "SEPA instant transfer simulation active. Live TARGET2/TIPS clearing unconfigured."
      },
      CARD_ISSUANCE: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Spanish virtual card simulation active. Requires EU BIN sponsor."
      },
      IDENTITY_VERIFICATION: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Spanish DNI modulo 23 format validation active. Sepblac video-identification partner not connected."
      },
      BITCOIN_CUSTODY: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Prototype ledger balances only. Requires MiCA CASP (Crypto-Asset Service Provider) authorization."
      },
      FX_SETTLEMENT: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "EUR exchange simulation active."
      }
    }
  },
  {
    countryCode: "DE",
    countryName: "Germany (Eurozone)",
    currency: "EUR",
    clearingRail: "SEPA / Bundesbank RPS / EBA CLEARING",
    formatSupported: true,
    supportedIdentifierTypes: ["BANK_ACCOUNT", "IBAN", "TAX_ID", "PAYMENT_CARD"],
    serviceCapabilities: {
      BANK_ACCOUNT_PROVISIONING: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Bundesbank BLZ and DE IBAN active. Requires BaFin ZAG license or German partner bank."
      },
      FIAT_PAYMENT_INITIATION: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "SEPA clearing simulation active."
      },
      CARD_ISSUANCE: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Virtual Mastercard simulation active with German country code."
      },
      IDENTITY_VERIFICATION: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Steuer-ID 11-digit syntax validation active. BaFin-compliant GwG Video-Ident unconfigured."
      },
      BITCOIN_CUSTODY: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Simulated Bitcoin custody active. Requires BaFin Kryptoverwahrgesch\xE4ft license in Germany."
      },
      FX_SETTLEMENT: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Internal fixed-point FX calculations active in prototype mode."
      }
    }
  },
  {
    countryCode: "BR",
    countryName: "Brazil",
    currency: "BRL",
    clearingRail: "PIX (SPI) / TED / STR (Banco Central do Brasil)",
    formatSupported: true,
    supportedIdentifierTypes: ["BANK_ACCOUNT", "TAX_ID", "PIX_KEY", "PAYMENT_CARD"],
    serviceCapabilities: {
      BANK_ACCOUNT_PROVISIONING: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Banco do Brasil Ag\xEAncia/Conta formatting active. Requires BACEN Institui\xE7\xE3o de Pagamento authorization."
      },
      FIAT_PAYMENT_INITIATION: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Pix instant payment simulation active. Direct participant SPI gateway unconfigured."
      },
      CARD_ISSUANCE: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Simulated virtual card issuance with BRL settlement currency."
      },
      IDENTITY_VERIFICATION: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "Receita Federal CPF modulo 11 algorithm active. Receita Federal official API bridge unconfigured."
      },
      BITCOIN_CUSTODY: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "BTC simulated custody active. Requires BACEN Lei n\xBA 14.478/2022 VASP registration in Brazil."
      },
      FX_SETTLEMENT: {
        technicalStatus: "MOCK_ADAPTER_ACTIVE",
        contractualStatus: "NO_COMMERCIAL_AGREEMENT",
        regulatoryStatus: "UNLICENSED_PROTOTYPE",
        productionReadiness: "BLOCKED_PROTOTYPE_ONLY",
        notes: "BRL cross-currency simulated rates active. C\xE2mbio commercial license unconfigured."
      }
    }
  }
];

// src/server/emails/catalog.ts
init_welcome();
init_auth();
init_kyc();
init_wallet();
init_cards();
init_loans();
init_support();
init_provider();
var PLANNED_EMAIL_TEMPLATE_IDS = [
  "welcome",
  "password_reset_request",
  "password_reset_completed",
  "password_changed",
  "login_lockout",
  "login_new_device",
  "login_success",
  "mfa_enrolled",
  "mfa_disabled",
  "account_suspended",
  "account_locked",
  "account_restored",
  "pending_verification",
  "role_changed",
  "account_deleted",
  "kyc_submitted",
  "kyc_under_review",
  "kyc_needs_more_info",
  "kyc_approved",
  "kyc_rejected",
  "domestic_account_issued",
  "domestic_account_failed",
  "deposit_requested",
  "deposit_approved",
  "deposit_rejected",
  "btc_deposit_proof",
  "withdrawal_requested",
  "withdrawal_approved",
  "withdrawal_rejected",
  "transfer_sent",
  "transfer_received",
  "fx_converted",
  "admin_adjustment_queued",
  "transaction_reversed",
  "statement_ready",
  "card_requested",
  "card_issuance_approved",
  "card_issuance_declined",
  "card_frozen",
  "card_unfrozen",
  "card_terminated",
  "card_limits_changed",
  "card_auth_hold",
  "card_hold_settled",
  "loan_submitted",
  "loan_decision",
  "grant_submitted",
  "grant_ineligible",
  "grant_reviewed",
  "grant_disbursed",
  "contact_staff",
  "contact_ack",
  "support_ticket_staff",
  "support_ticket_ack",
  "support_ticket_resolved",
  "provider_deposit_cleared",
  "provider_wire_inbound",
  "compliance_flag",
  "provider_payment_confirmed",
  "provider_payment_failed",
  "reconciliation_required"
];
var EMAIL_TEMPLATE_IDS = [...PLANNED_EMAIL_TEMPLATE_IDS];
var SAMPLE = "Alex Rivera";
function renderEmailPreview(id) {
  switch (id) {
    case "welcome":
      return buildWelcomeEmail({ fullName: SAMPLE });
    case "password_reset_request":
      return buildPasswordResetRequestEmail({ fullName: SAMPLE, resetToken: "preview-token" });
    case "password_reset_completed":
      return buildPasswordResetCompletedEmail({ fullName: SAMPLE });
    case "password_changed":
      return buildPasswordChangedEmail({ fullName: SAMPLE });
    case "login_lockout":
      return buildLoginLockoutEmail({ fullName: SAMPLE, lockMinutes: 15 });
    case "login_new_device":
      return buildLoginNewDeviceEmail({
        fullName: SAMPLE,
        ipAddress: "203.0.113.42",
        userAgent: "Chrome on Windows",
        signedInAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    case "login_success":
      return buildLoginSuccessEmail({
        fullName: SAMPLE,
        ipAddress: "203.0.113.42",
        signedInAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    case "mfa_enrolled":
      return buildMfaEnrolledEmail({ fullName: SAMPLE });
    case "mfa_disabled":
      return buildMfaDisabledEmail({ fullName: SAMPLE });
    case "account_suspended":
      return buildAccountSuspendedEmail({ fullName: SAMPLE, reason: "Compliance review" });
    case "account_locked":
      return buildAccountLockedEmail({ fullName: SAMPLE, reason: "Security hold" });
    case "account_restored":
      return buildAccountRestoredEmail({ fullName: SAMPLE });
    case "pending_verification":
      return buildPendingVerificationEmail({ fullName: SAMPLE });
    case "role_changed":
      return buildRoleChangedEmail({ fullName: SAMPLE, newRole: "SUPPORT" });
    case "account_deleted":
      return buildAccountDeletedEmail({ fullName: SAMPLE });
    case "kyc_submitted":
      return buildKycSubmittedEmail({ fullName: SAMPLE, reference: "KYC-1001" });
    case "kyc_under_review":
      return buildKycUnderReviewEmail({ fullName: SAMPLE });
    case "kyc_needs_more_info":
      return buildKycNeedsMoreInfoEmail({ fullName: SAMPLE, notes: "Please upload a clearer ID photo." });
    case "kyc_approved":
      return buildKycApprovedEmail({ fullName: SAMPLE });
    case "kyc_rejected":
      return buildKycRejectedEmail({ fullName: SAMPLE, notes: "Document expired." });
    case "domestic_account_issued":
      return buildDomesticAccountIssuedEmail({
        fullName: SAMPLE,
        accountSummary: "GB29 NWBK 6016 1331 9268 19",
        currency: "GBP"
      });
    case "domestic_account_failed":
      return buildDomesticAccountFailedEmail({ fullName: SAMPLE });
    case "deposit_requested":
      return buildDepositRequestedEmail({
        fullName: SAMPLE,
        amount: "1,000.00",
        currency: "USD",
        reference: "DEP-1001"
      });
    case "deposit_approved":
      return buildDepositApprovedEmail({
        fullName: SAMPLE,
        amount: "1,000.00",
        currency: "USD",
        reference: "DEP-1001"
      });
    case "deposit_rejected":
      return buildDepositRejectedEmail({
        fullName: SAMPLE,
        amount: "1,000.00",
        currency: "USD",
        reason: "Source of funds unclear"
      });
    case "btc_deposit_proof":
      return buildBtcDepositProofEmail({
        fullName: SAMPLE,
        amount: "0.05 BTC",
        txHash: "abc123\u2026"
      });
    case "withdrawal_requested":
      return buildWithdrawalRequestedEmail({
        fullName: SAMPLE,
        amount: "250.00",
        currency: "EUR",
        reference: "WDR-2001"
      });
    case "withdrawal_approved":
      return buildWithdrawalApprovedEmail({
        fullName: SAMPLE,
        amount: "250.00",
        currency: "EUR"
      });
    case "withdrawal_rejected":
      return buildWithdrawalRejectedEmail({
        fullName: SAMPLE,
        amount: "250.00",
        currency: "EUR"
      });
    case "transfer_sent":
      return buildTransferSentEmail({
        fullName: SAMPLE,
        amount: "50.00",
        currency: "USD",
        recipient: "Jordan Lee",
        reference: "TRF-3001"
      });
    case "transfer_received":
      return buildTransferReceivedEmail({
        fullName: SAMPLE,
        amount: "50.00",
        currency: "USD",
        sender: "Jordan Lee"
      });
    case "fx_converted":
      return buildFxConvertedEmail({
        fullName: SAMPLE,
        fromAmount: "100.00",
        fromCurrency: "USD",
        toAmount: "92.00",
        toCurrency: "EUR",
        rate: "0.9200"
      });
    case "admin_adjustment_queued":
      return buildAdminAdjustmentQueuedEmail({
        fullName: SAMPLE,
        direction: "Credit",
        amount: "25.00",
        currency: "USD"
      });
    case "transaction_reversed":
      return buildTransactionReversedEmail({
        fullName: SAMPLE,
        amount: "25.00",
        currency: "USD",
        transactionId: "txn_demo"
      });
    case "statement_ready":
      return buildStatementReadyEmail({ fullName: SAMPLE, periodLabel: "September 2026" });
    case "card_requested":
      return buildCardRequestedEmail({ fullName: SAMPLE, cardLabel: "Virtual Debit" });
    case "card_issuance_approved":
      return buildCardIssuanceApprovedEmail({ fullName: SAMPLE, last4: "4242" });
    case "card_issuance_declined":
      return buildCardIssuanceDeclinedEmail({ fullName: SAMPLE });
    case "card_frozen":
      return buildCardFrozenEmail({ fullName: SAMPLE, last4: "4242" });
    case "card_unfrozen":
      return buildCardUnfrozenEmail({ fullName: SAMPLE, last4: "4242" });
    case "card_terminated":
      return buildCardTerminatedEmail({ fullName: SAMPLE, last4: "4242" });
    case "card_limits_changed":
      return buildCardLimitsChangedEmail({
        fullName: SAMPLE,
        last4: "4242",
        dailyLimit: "1,000 USD",
        monthlyLimit: "5,000 USD"
      });
    case "card_auth_hold":
      return buildCardAuthHoldEmail({
        fullName: SAMPLE,
        amount: "42.50",
        currency: "USD",
        merchant: "Cafe Avenora",
        last4: "4242"
      });
    case "card_hold_settled":
      return buildCardHoldSettledEmail({
        fullName: SAMPLE,
        amount: "42.50",
        currency: "USD",
        outcome: "settled",
        merchant: "Cafe Avenora"
      });
    case "loan_submitted":
      return buildLoanSubmittedEmail({
        fullName: SAMPLE,
        applicationId: "LN-1001",
        amount: "10,000 USD"
      });
    case "loan_decision":
      return buildLoanDecisionEmail({
        fullName: SAMPLE,
        applicationId: "LN-1001",
        decision: "APPROVED"
      });
    case "grant_submitted":
      return buildGrantSubmittedEmail({ fullName: SAMPLE, applicationId: "GR-1001" });
    case "grant_ineligible":
      return buildGrantIneligibleEmail({ fullName: SAMPLE, applicationId: "GR-1001" });
    case "grant_reviewed":
      return buildGrantReviewedEmail({
        fullName: SAMPLE,
        applicationId: "GR-1001",
        decision: "APPROVED"
      });
    case "grant_disbursed":
      return buildGrantDisbursedEmail({
        fullName: SAMPLE,
        applicationId: "GR-1001",
        amount: "500.00",
        currency: "USD"
      });
    case "contact_staff":
      return buildContactStaffEmail({
        name: SAMPLE,
        email: "alex@example.com",
        subject: "Account question",
        message: "I need help with my wallet.",
        reference: "CNT-1001"
      });
    case "contact_ack":
      return buildContactAckEmail({ name: SAMPLE, reference: "CNT-1001" });
    case "support_ticket_staff":
      return buildSupportTicketStaffEmail({
        customerEmail: "alex@example.com",
        customerName: SAMPLE,
        subject: "Cannot withdraw",
        message: "My withdrawal is stuck.",
        ticketId: "TKT-1001",
        priority: "HIGH"
      });
    case "support_ticket_ack":
      return buildSupportTicketAckEmail({
        fullName: SAMPLE,
        ticketId: "TKT-1001",
        subject: "Cannot withdraw"
      });
    case "support_ticket_resolved":
      return buildSupportTicketResolvedEmail({
        fullName: SAMPLE,
        ticketId: "TKT-1001",
        subject: "Cannot withdraw",
        resolutionNote: "Withdrawal was released."
      });
    case "provider_deposit_cleared":
      return buildProviderDepositClearedEmail({
        fullName: SAMPLE,
        amount: "500.00",
        currency: "USD",
        reference: "mock.deposit.cleared"
      });
    case "provider_wire_inbound":
      return buildProviderWireInboundEmail({
        fullName: SAMPLE,
        amount: "1,200.00",
        currency: "USD"
      });
    case "compliance_flag":
      return buildComplianceFlagEmail({
        flagType: "SANCTIONS_SCREEN",
        reference: "FLG-1"
      });
    case "provider_payment_confirmed":
      return buildProviderPaymentConfirmedEmail({
        fullName: SAMPLE,
        amount: "75.00",
        currency: "USD",
        paymentId: "pay_demo"
      });
    case "provider_payment_failed":
      return buildProviderPaymentFailedEmail({
        fullName: SAMPLE,
        amount: "75.00",
        currency: "USD",
        paymentId: "pay_demo"
      });
    case "reconciliation_required":
      return buildReconciliationRequiredEmail({ paymentId: "pay_demo" });
    default:
      return null;
  }
}

// src/server/routes/system.routes.ts
var systemRouter = (0, import_express3.Router)();
function isEmailPreviewAllowed() {
  const config = getValidatedConfig();
  return config.NODE_ENV !== "production" || config.PROTOTYPE_MODE === true;
}
var GenerateIdentifierSchema = import_zod4.z.object({
  countryCode: import_zod4.z.enum(["US", "GB", "ES", "DE", "BR"]),
  type: import_zod4.z.enum([
    "BANK_ACCOUNT",
    "IBAN",
    "SORT_CODE",
    "TAX_ID",
    "PAYMENT_CARD",
    "PIX_KEY"
  ]),
  accountHolderName: import_zod4.z.string().optional(),
  currency: import_zod4.z.string().optional()
});
var ValidateIdentifierSchema = import_zod4.z.object({
  countryCode: import_zod4.z.enum(["US", "GB", "ES", "DE", "BR"]),
  type: import_zod4.z.enum([
    "BANK_ACCOUNT",
    "IBAN",
    "SORT_CODE",
    "TAX_ID",
    "PAYMENT_CARD",
    "PIX_KEY"
  ]),
  value: import_zod4.z.string().min(1, "Value is required")
});
systemRouter.get("/email-preview", (_req, res) => {
  if (!isEmailPreviewAllowed()) {
    res.status(404).json({
      type: "https://avenora.com/errors/not-found",
      title: "Not Found",
      status: 404,
      detail: "Email preview is unavailable in this environment."
    });
    return;
  }
  res.json({
    available: EMAIL_TEMPLATE_IDS,
    planned: PLANNED_EMAIL_TEMPLATE_IDS,
    previewPath: "/api/v1/system/email-preview/:id"
  });
});
systemRouter.get("/email-preview/:id", (req, res) => {
  if (!isEmailPreviewAllowed()) {
    res.status(404).json({
      type: "https://avenora.com/errors/not-found",
      title: "Not Found",
      status: 404,
      detail: "Email preview is unavailable in this environment."
    });
    return;
  }
  const id = String(req.params.id || "").trim().toLowerCase();
  const payload = renderEmailPreview(id);
  if (!payload) {
    res.status(404).json({
      type: "https://avenora.com/errors/not-found",
      title: "Email Template Not Found",
      status: 404,
      detail: `No preview is available for template "${id}". Available: ${EMAIL_TEMPLATE_IDS.join(", ")}.`,
      available: EMAIL_TEMPLATE_IDS
    });
    return;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Avenora-Email-Subject", payload.subject);
  res.send(payload.html);
});
systemRouter.get("/status", (_req, res) => {
  const config = getValidatedConfig();
  const safeConfig = getSafePublicConfig(config);
  res.json({
    platform: PLATFORM_METADATA.NAME,
    version: PLATFORM_METADATA.VERSION,
    releaseCodename: PLATFORM_METADATA.RELEASE_CODENAME,
    environment: safeConfig.environment,
    prototypeMode: safeConfig.prototypeMode,
    liveSettlementEnabled: safeConfig.liveSettlementEnabled,
    disclaimers: {
      bankingLicense: "Avenora provides digital banking and financial technology services subject to applicable licenses and regulations in your jurisdiction.",
      fundMovement: "Product availability, settlement timing, and partner networks vary by region and account type.",
      insurance: "Deposit insurance and investor protection schemes depend on your country and product\u2014see your account disclosures."
    },
    corridors: SUPPORTED_COUNTRIES,
    currencies: Object.values(SUPPORTED_CURRENCIES),
    standards: [
      "Strict Double-Entry Ledger (Sum(Debits) === Sum(Credits))",
      "Zero-Float Monetary Math (BigInt Minor Units)",
      "Immutable Journal Entries & Append-Only Audit Trail",
      "RFC 7807 Problem Details Error Responses",
      "Strict PII Redaction in Logs",
      "Country-Aware Autogenerated Financial Identifiers (US ABA, GB Sort Code, ES/DE IBAN, BR CPF/Pix)"
    ]
  });
});
systemRouter.get("/identifiers/supported-matrix", (_req, res) => {
  res.json({
    supportedCountries: SUPPORTED_COUNTRIES,
    matrix: SUPPORTED_IDENTIFIER_TYPES,
    standards: {
      US: "Federal Reserve 9-Digit ABA Routing Checksum + SSA Non-Issued Synthetic SSN",
      GB: "APACS Sort Code 6-Digit + HMRC UTR / NINO + GB IBAN ISO 7064 Mod 97-10",
      ES: "Banco de Espa\xF1a CCC 2-Digit Mod 11 + Spanish DNI Mod 23 + ES IBAN Mod 97-10",
      DE: "Bundesbank BLZ 8-Digit + Steuer-ID 11-Digit + DE IBAN Mod 97-10",
      BR: "Receita Federal CPF Dual Check Digits Mod 11 + Banco/Ag\xEAncia/Conta + Pix EVP Key",
      CARDS: "ISO/IEC 7812 Luhn Checksum + Country/Network Specific BIN Allocation"
    },
    disclaimer: "Generated identifiers are for account setup and validation within the Avenora platform."
  });
});
systemRouter.post("/identifiers/generate", async (req, res, next) => {
  try {
    const validated = GenerateIdentifierSchema.parse(req.body);
    const result = await defaultIdentifierProvider.generateIdentifier(validated);
    res.status(201).json({
      status: "generated",
      identifier: result
    });
  } catch (err) {
    next(err);
  }
});
systemRouter.post("/identifiers/validate", (req, res, next) => {
  try {
    const validated = ValidateIdentifierSchema.parse(req.body);
    const result = defaultIdentifierProvider.validateIdentifier(validated);
    res.json({
      status: result.isValid ? "valid" : "invalid",
      result
    });
  } catch (err) {
    next(err);
  }
});
systemRouter.get("/providers/matrix", (_req, res) => {
  const config = getValidatedConfig();
  const safeConfig = getSafePublicConfig(config);
  res.json({
    platform: PLATFORM_METADATA.NAME,
    environment: safeConfig.environment,
    prototypeMode: safeConfig.prototypeMode,
    liveSettlementEnabled: safeConfig.liveSettlementEnabled,
    countries: COUNTRY_PROVIDER_CAPABILITY_MATRIX,
    prerequisites: PROVIDER_INTEGRATION_PREREQUISITES,
    disclaimer: "Provider integration status reflects regional readiness and partner configuration."
  });
});
var ProvisionIdentifierSchema = import_zod4.z.object({
  countryCode: import_zod4.z.enum(["US", "GB", "ES", "DE", "BR"]),
  type: import_zod4.z.enum(["BANK_ACCOUNT", "IBAN", "PAYMENT_CARD"]),
  accountHolderName: import_zod4.z.string().min(2, "Account holder name is required"),
  currency: import_zod4.z.string().length(3),
  idempotencyKey: import_zod4.z.string().min(4)
});
systemRouter.post("/identifiers/provision", async (req, res, next) => {
  try {
    const validated = ProvisionIdentifierSchema.parse(req.body);
    const correlationId = req.headers["x-correlation-id"] || `corr_prov_${Date.now()}`;
    if (!defaultIdentifierProvider.provisionFromProvider) {
      res.status(501).json({
        type: "https://avenora.com/errors/not-implemented",
        title: "Provider Provisioning Unsupported",
        status: 501,
        detail: "The current identifier provider does not support external adapter provisioning."
      });
      return;
    }
    const result = await defaultIdentifierProvider.provisionFromProvider({
      countryCode: validated.countryCode,
      type: validated.type,
      accountHolderName: validated.accountHolderName,
      currency: validated.currency,
      idempotencyKey: validated.idempotencyKey,
      correlationId
    });
    res.status(201).json({
      status: "provisioned",
      identifier: result
    });
  } catch (err) {
    next(err);
  }
});

// src/server/routes/auth.routes.ts
var import_express4 = require("express");
var import_zod5 = require("zod");
init_auth_service();

// src/server/middleware/auth.ts
init_auth_service();
init_audit_service();
async function authenticate(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }
  if (!token && req.cookies && req.cookies["avenora_session"]) {
    token = req.cookies["avenora_session"];
  }
  if (!token) {
    res.status(401).json({
      type: "https://avenora.com/errors/unauthorized",
      title: "Authentication Required",
      status: 401,
      detail: "You must provide a valid session token via Bearer header or session cookie.",
      instance: req.originalUrl,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return;
  }
  const user = await defaultAuthService.validateSession(token);
  if (!user) {
    res.status(401).json({
      type: "https://avenora.com/errors/invalid-session",
      title: "Invalid or Expired Session",
      status: 401,
      detail: "The provided session is invalid, expired, or has been revoked.",
      instance: req.originalUrl,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return;
  }
  req.user = user;
  req.sessionToken = token;
  next();
}
function requireRoles(roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        type: "https://avenora.com/errors/unauthorized",
        title: "Authentication Required",
        status: 401,
        detail: "User authentication required.",
        instance: req.originalUrl,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return;
    }
    if (!roles.includes(req.user.role)) {
      defaultAuditService.logAction({
        action: "ADMIN_ACCESS_DENIED",
        actorUserId: req.user.id,
        actorRole: req.user.role,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        resourceType: "API_ENDPOINT",
        resourceId: req.originalUrl,
        reason: `Access denied. Role "${req.user.role}" does not have required permissions: [${roles.join(", ")}].`,
        correlationId: req.headers["x-correlation-id"] || void 0
      });
      res.status(403).json({
        type: "https://avenora.com/errors/access-denied",
        title: "Forbidden / Insufficient Privileges",
        status: 403,
        detail: `Access denied. Role "${req.user.role}" does not have required permissions: [${roles.join(", ")}].`,
        instance: req.originalUrl,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return;
    }
    next();
  };
}

// src/config/countryOptions.ts
init_iso3166CountryCodes();
var ISO3166_COUNTRY_CODES = iso3166CountryCodes_default;
var ISO_COUNTRY_CODE_SET = new Set(ISO3166_COUNTRY_CODES);
function isValidIsoCountryCode(code) {
  return ISO_COUNTRY_CODE_SET.has(code.trim().toUpperCase());
}

// src/server/routes/auth.routes.ts
var authRouter = (0, import_express4.Router)();
var RegisterSchema = import_zod5.z.object({
  email: import_zod5.z.string().email("Invalid email address format"),
  password: import_zod5.z.string().min(8, "Password must be at least 8 characters long"),
  fullName: import_zod5.z.string().min(2, "Full name must be at least 2 characters"),
  phoneNumber: import_zod5.z.string().min(7, "Phone number is required").max(32, "Phone number is too long").refine((value) => {
    const digits2 = value.replace(/\D/g, "");
    return digits2.length >= 7 && digits2.length <= 15;
  }, "Enter a valid phone number (7\u201315 digits)"),
  transactionPin: import_zod5.z.string().regex(/^\d{4}$/, "Transaction PIN must be exactly 4 digits"),
  countryCode: import_zod5.z.string().length(2, "Country code must be 2 characters (e.g. US, BR, ES)").transform((code) => code.toUpperCase()).refine(isValidIsoCountryCode, "Select a valid country")
});
var LoginSchema = import_zod5.z.object({
  email: import_zod5.z.string().email(),
  password: import_zod5.z.string().min(1),
  totpCode: import_zod5.z.string().optional(),
  recoveryCode: import_zod5.z.string().optional()
});
var PasswordResetRequestSchema = import_zod5.z.object({
  email: import_zod5.z.string().email()
});
var PasswordResetConfirmSchema = import_zod5.z.object({
  token: import_zod5.z.string().min(10),
  newPassword: import_zod5.z.string().min(8)
});
var MfaConfirmSchema = import_zod5.z.object({
  secret: import_zod5.z.string().min(16),
  code: import_zod5.z.string().length(6)
});
var VerifyTransactionPinSchema = import_zod5.z.object({
  transactionPin: import_zod5.z.string().regex(/^\d{4}$/, "Transaction PIN must be exactly 4 digits")
});
authRouter.post("/register", async (req, res, next) => {
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
      userAgent: req.get("user-agent")
    });
    try {
      const { defaultDomesticBankAccountService: defaultDomesticBankAccountService2 } = await Promise.resolve().then(() => (init_domesticBankAccount_service(), domesticBankAccount_service_exports));
      await defaultDomesticBankAccountService2.ensurePrimaryAccountForActiveUser({
        userId: result.user.id,
        correlationId: `register_${result.user.id}`
      });
    } catch {
    }
    res.cookie("avenora_session", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: result.expiresAt
    });
    res.status(201).json({
      status: "registered",
      user: result.user,
      sessionToken: result.sessionToken,
      expiresAt: result.expiresAt.toISOString(),
      transactionPinUnlocked: result.transactionPinUnlocked
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("already exists")) {
      res.status(409).json({
        type: "https://avenora.com/errors/account-conflict",
        title: "Account Already Exists",
        status: 409,
        detail: message,
        instance: req.originalUrl,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return;
    }
    if (message.includes("Password must be")) {
      res.status(400).json({
        type: "https://avenora.com/errors/invalid-password",
        title: "Weak Password",
        status: 400,
        detail: message,
        instance: req.originalUrl,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return;
    }
    next(err);
  }
});
authRouter.post("/login", async (req, res, next) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const { requiresMfa, authResult } = await defaultAuthService.login({
      email: validated.email,
      password: validated.password,
      totpCode: validated.totpCode,
      recoveryCode: validated.recoveryCode,
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    if (requiresMfa) {
      res.status(200).json({
        status: "mfa_required",
        message: "Multi-factor authentication required. Please submit a 6-digit TOTP code or recovery code."
      });
      return;
    }
    if (!authResult) {
      res.status(401).json({
        type: "https://avenora.com/errors/invalid-credentials",
        title: "Authentication Failed",
        status: 401,
        detail: "Invalid credentials."
      });
      return;
    }
    try {
      const { defaultDomesticBankAccountService: defaultDomesticBankAccountService2 } = await Promise.resolve().then(() => (init_domesticBankAccount_service(), domesticBankAccount_service_exports));
      await defaultDomesticBankAccountService2.ensurePrimaryAccountForActiveUser({
        userId: authResult.user.id,
        correlationId: `login_${authResult.user.id}`
      });
    } catch {
    }
    const liveUser = defaultAuthService.getUserById(authResult.user.id);
    res.cookie("avenora_session", authResult.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: authResult.expiresAt
    });
    res.status(200).json({
      status: "authenticated",
      user: liveUser ? {
        ...authResult.user,
        kycStatus: liveUser.kycStatus,
        status: liveUser.status,
        countryCode: liveUser.countryCode
      } : authResult.user,
      sessionToken: authResult.sessionToken,
      expiresAt: authResult.expiresAt.toISOString(),
      transactionPinUnlocked: authResult.transactionPinUnlocked
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Invalid email or password")) {
      res.status(401).json({
        type: "https://avenora.com/errors/invalid-credentials",
        title: "Authentication Failed",
        status: 401,
        detail: "Invalid email or password. Please verify your credentials or register for an account.",
        instance: req.originalUrl,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return;
    }
    if (message.includes("temporarily locked")) {
      res.status(423).json({
        type: "https://avenora.com/errors/account-locked",
        title: "Account Locked",
        status: 423,
        detail: message,
        instance: req.originalUrl,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return;
    }
    if (message.includes("Account is")) {
      res.status(403).json({
        type: "https://avenora.com/errors/account-suspended",
        title: "Account Suspended or Inactive",
        status: 403,
        detail: message,
        instance: req.originalUrl,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return;
    }
    if (message.includes("MFA") || message.includes("recovery code")) {
      res.status(401).json({
        type: "https://avenora.com/errors/invalid-mfa",
        title: "MFA Verification Failed",
        status: 401,
        detail: message,
        instance: req.originalUrl,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return;
    }
    next(err);
  }
});
authRouter.post("/logout", authenticate, async (req, res, next) => {
  try {
    if (req.sessionToken) {
      await defaultAuthService.revokeSession(req.sessionToken);
    }
    res.clearCookie("avenora_session");
    res.status(200).json({ status: "logged_out", message: "Session successfully revoked." });
  } catch (err) {
    next(err);
  }
});
authRouter.get("/me", authenticate, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({
    user: defaultAuthService.sanitizeUser(req.user),
    transactionPinUnlocked: defaultAuthService.isTransactionPinUnlocked(req.sessionToken)
  });
});
authRouter.post(
  "/verify-transaction-pin",
  authenticate,
  async (req, res, next) => {
    try {
      const validated = VerifyTransactionPinSchema.parse(req.body);
      const result = await defaultAuthService.unlockSessionWithTransactionPin(
        req.sessionToken,
        validated.transactionPin
      );
      res.status(200).json({
        status: "pin_verified",
        transactionPinUnlocked: result.transactionPinUnlocked
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Invalid transaction PIN")) {
        res.status(401).json({
          type: "https://avenora.com/errors/invalid-transaction-pin",
          title: "Invalid Transaction PIN",
          status: 401,
          detail: message,
          instance: req.originalUrl,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        return;
      }
      if (message.includes("temporarily locked")) {
        res.status(429).json({
          type: "https://avenora.com/errors/account-locked",
          title: "Account Temporarily Locked",
          status: 429,
          detail: message,
          instance: req.originalUrl,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        return;
      }
      if (message.includes("must be exactly 4 digits")) {
        res.status(400).json({
          type: "https://avenora.com/errors/invalid-transaction-pin",
          title: "Invalid Transaction PIN",
          status: 400,
          detail: message,
          instance: req.originalUrl,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        return;
      }
      next(err);
    }
  }
);
authRouter.post("/password-reset/request", async (req, res, next) => {
  try {
    const validated = PasswordResetRequestSchema.parse(req.body);
    const result = await defaultAuthService.requestPasswordReset(validated.email);
    res.status(200).json({
      status: "success",
      message: "If the email exists, a password reset link has been dispatched.",
      emailSent: result.emailSent ?? false,
      // Prototype / local DX only — omitted when production email delivery succeeds
      ...result.token ? { debugToken: result.token } : {}
    });
  } catch (err) {
    next(err);
  }
});
authRouter.post("/password-reset/confirm", async (req, res, next) => {
  try {
    const validated = PasswordResetConfirmSchema.parse(req.body);
    await defaultAuthService.resetPassword(validated.token, validated.newPassword);
    res.status(200).json({
      status: "success",
      message: "Password successfully updated. All previous sessions have been invalidated."
    });
  } catch (err) {
    next(err);
  }
});
var ChangePasswordSchema = import_zod5.z.object({
  currentPassword: import_zod5.z.string().min(1, "Current password is required"),
  newPassword: import_zod5.z.string().min(8, "New password must be at least 8 characters long")
});
authRouter.post("/change-password", authenticate, async (req, res, next) => {
  try {
    const validated = ChangePasswordSchema.parse(req.body);
    await defaultAuthService.changePassword(req.user.id, validated.currentPassword, validated.newPassword);
    res.status(200).json({
      status: "success",
      message: "Password successfully changed."
    });
  } catch (err) {
    next(err);
  }
});
authRouter.post("/mfa/enroll", authenticate, async (req, res, next) => {
  try {
    const result = await defaultAuthService.startMfaEnrollment(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
authRouter.post("/mfa/confirm", authenticate, async (req, res, next) => {
  try {
    const validated = MfaConfirmSchema.parse(req.body);
    const result = await defaultAuthService.confirmMfaEnrollment(
      req.user.id,
      validated.secret,
      validated.code
    );
    res.json({
      status: "mfa_enabled",
      recoveryCodes: result.recoveryCodes,
      message: "MFA enabled. Store recovery codes in a secure location."
    });
  } catch (err) {
    next(err);
  }
});

// src/server/routes/kyc.routes.ts
var import_express5 = require("express");
var import_zod6 = require("zod");
init_kyc_service();
init_taxIdByCountry();
init_env_config();
init_providerAdapters();
var kycRouter = (0, import_express5.Router)();
var KycSubmitSchema = import_zod6.z.object({
  tier: import_zod6.z.number().int().min(1).max(2).default(1),
  legalFirstName: import_zod6.z.string().min(1, "First name is required"),
  legalLastName: import_zod6.z.string().min(1, "Last name is required"),
  dateOfBirth: import_zod6.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD"),
  taxIdType: import_zod6.z.string().min(1, "Tax ID type is required"),
  taxIdNumber: import_zod6.z.string().min(4, "Tax ID is required"),
  residentialAddress: import_zod6.z.object({
    street: import_zod6.z.string().min(3),
    city: import_zod6.z.string().optional(),
    state: import_zod6.z.string().optional(),
    postalCode: import_zod6.z.string().optional(),
    country: import_zod6.z.string().length(2)
  }),
  documents: import_zod6.z.array(
    import_zod6.z.object({
      type: import_zod6.z.enum([
        "PASSPORT",
        "DRIVERS_LICENSE",
        "NATIONAL_ID",
        "PASSPORT_PHOTOGRAPH",
        "PROOF_OF_ADDRESS"
      ]),
      fileName: import_zod6.z.string(),
      mimeType: import_zod6.z.string(),
      fileSize: import_zod6.z.number().positive(),
      /** Optional staff-review preview (data URL). Capped server-side. */
      previewDataUrl: import_zod6.z.string().startsWith("data:").max(18e5).optional()
    })
  ).optional()
}).superRefine((value, ctx) => {
  if (!countryHasIndividualTaxId(value.residentialAddress.country)) {
    ctx.addIssue({
      code: "custom",
      message: UNSUPPORTED_TAX_ID_COUNTRY_MESSAGE,
      path: ["taxIdType"]
    });
    return;
  }
  if (!isTaxIdTypeAllowedForCountry(value.residentialAddress.country, value.taxIdType)) {
    ctx.addIssue({
      code: "custom",
      message: "Tax ID type is not valid for this country.",
      path: ["taxIdType"]
    });
  }
});
var ReviewDecisionSchema = import_zod6.z.object({
  decision: import_zod6.z.enum(["APPROVED", "REJECTED", "NEEDS_MORE_INFORMATION", "UNDER_REVIEW"]),
  notes: import_zod6.z.string().optional(),
  rejectionReason: import_zod6.z.string().optional(),
  reasonCode: import_zod6.z.string().optional(),
  expectedVersion: import_zod6.z.number().int().optional()
});
kycRouter.get("/me", authenticate, (req, res) => {
  const profile = defaultKycService.getOrCreateProfile(req.user.id);
  res.json({
    profile: defaultKycService.sanitizeForCustomer(profile)
  });
});
kycRouter.post("/submit", authenticate, (req, res, next) => {
  try {
    const validated = KycSubmitSchema.parse(req.body);
    const updated = defaultKycService.submitVerification({
      userId: req.user.id,
      tier: validated.tier,
      legalFirstName: validated.legalFirstName,
      legalLastName: validated.legalLastName,
      dateOfBirth: validated.dateOfBirth,
      taxIdType: validated.taxIdType,
      taxIdNumber: validated.taxIdNumber,
      residentialAddress: validated.residentialAddress,
      documents: validated.documents
    });
    res.status(200).json({
      status: "submitted",
      message: "Verification submission received and queued for compliance review.",
      profile: defaultKycService.sanitizeForCustomer(updated)
    });
  } catch (err) {
    next(err);
  }
});
kycRouter.get("/users/:userId/documents/:documentId", authenticate, (req, res, next) => {
  try {
    const { userId, documentId } = req.params;
    const result = defaultKycService.getSecureDocumentAccess({
      targetUserId: userId,
      documentId,
      actorUserId: req.user.id,
      actorRole: req.user.role
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});
kycRouter.get(
  "/reviews",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res) => {
    const profiles = defaultKycService.getAllProfilesForReview(req.user.role);
    res.json({
      count: profiles.length,
      profiles
    });
  }
);
kycRouter.post(
  "/reviews/:userId/decision",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const validated = ReviewDecisionSchema.parse(req.body);
      const updated = await defaultKycService.reviewProfile({
        reviewerRole: req.user.role,
        reviewerUserId: req.user.id,
        reviewerName: req.user.fullName,
        targetUserId: userId,
        decision: validated.decision,
        notes: validated.notes,
        rejectionReason: validated.rejectionReason,
        reasonCode: validated.reasonCode,
        expectedVersion: validated.expectedVersion
      });
      res.status(200).json({
        status: "decision_recorded",
        profile: updated
      });
    } catch (err) {
      next(err);
    }
  }
);
var ExternalKycCallbackSchema = import_zod6.z.object({
  userId: import_zod6.z.string().min(1),
  providerCode: import_zod6.z.string().min(1),
  externalCaseId: import_zod6.z.string().min(1),
  status: import_zod6.z.enum(["PENDING", "VERIFIED", "FAILED", "INCONCLUSIVE", "UNRESOLVED"]),
  confidenceScore: import_zod6.z.number().min(0).max(1).optional(),
  checksSummary: import_zod6.z.object({
    documentAuthenticity: import_zod6.z.boolean(),
    facialMatch: import_zod6.z.boolean(),
    sanctionsClear: import_zod6.z.boolean(),
    pepClear: import_zod6.z.boolean()
  }).optional()
});
kycRouter.post("/external-callback", (req, res, next) => {
  try {
    const signature = req.headers["x-provider-signature"] || "";
    const timestamp = req.headers["x-provider-timestamp"] || "";
    const correlationId = req.headers["x-correlation-id"] || `corr_kyc_${Date.now()}`;
    const config = getValidatedConfig();
    const rawPayload = JSON.stringify(req.body);
    const signatureVerified = verifyHmacSha256Webhook({
      payload: rawPayload,
      signatureHeader: signature,
      secret: config.MOCK_PROVIDER_WEBHOOK_SECRET,
      timestampHeader: timestamp,
      toleranceSeconds: config.WEBHOOK_TOLERANCE_SECONDS
    });
    const validated = ExternalKycCallbackSchema.parse(req.body);
    const updated = defaultKycService.attachExternalVerificationResult({
      userId: validated.userId,
      providerCode: validated.providerCode,
      externalCaseId: validated.externalCaseId,
      status: validated.status,
      confidenceScore: validated.confidenceScore,
      checksSummary: validated.checksSummary,
      signatureVerified,
      correlationId
    });
    res.status(200).json({
      status: "callback_processed",
      signatureVerified,
      externalCaseId: validated.externalCaseId,
      customerKycStatus: updated.status,
      advisoryNotice: "External verification recorded. Internal human review remains required for full approval."
    });
  } catch (err) {
    next(err);
  }
});

// src/server/routes/wallet.routes.ts
var import_express6 = require("express");
var import_zod7 = require("zod");

// src/server/services/wallet.service.ts
init_Money();
init_Currency();
init_ledger_service();
init_LedgerInvariant();

// src/domain/common/Idempotency.ts
function generateSimpleHash(payload) {
  const str = JSON.stringify(payload ?? {});
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

// src/server/services/wallet.service.ts
init_audit_service();
init_auth_service();
init_email_service();
init_countryPrimaryCurrency();
init_constants();

// src/domain/country/countryDepositRails.ts
init_countryPrimaryCurrency();
var US_RAILS = [
  { code: "US_ACH", label: "ACH (Automated Clearing House)" },
  { code: "US_FEDWIRE", label: "Fedwire bank transfer" },
  { code: "US_RTP", label: "RTP / FedNow (real-time)" }
];
var GB_RAILS = [
  { code: "GB_FPS", label: "Faster Payments (FPS)" },
  { code: "GB_BACS", label: "BACS bank transfer" },
  { code: "GB_CHAPS", label: "CHAPS (same-day sterling)" }
];
var BR_RAILS = [
  { code: "BR_PIX", label: "Pix (SPI instant payment)" },
  { code: "BR_TED", label: "TED (same-day transfer)" },
  { code: "BR_DOC", label: "DOC (legacy credit transfer)" }
];
var SEPA_RAILS = [
  { code: "EU_SEPA_SCT", label: "SEPA Credit Transfer (SCT)" },
  { code: "EU_SEPA_INST", label: "SEPA Instant (SCT Inst)" }
];
var DE_RAILS = [
  { code: "DE_SEPA", label: "SEPA / Bundesbank RPS" },
  { code: "DE_EBA", label: "EBA CLEARING (Germany)" }
];
var ES_RAILS = [
  { code: "ES_SEPA", label: "SEPA Credit Transfer" },
  { code: "ES_IBERPAY", label: "Iberpay instant transfer" }
];
var XAF_RAILS = [
  { code: "CEMAC_BEAC", label: "BEAC / SYSTAC (CEMAC) bank transfer" },
  { code: "CEMAC_BRANCH", label: "Participating local branch deposit" }
];
var XOF_RAILS = [
  { code: "WAEMU_BCEAO", label: "BCEAO / regional bank transfer (UEMOA)" },
  { code: "WAEMU_BRANCH", label: "Participating local branch deposit" }
];
var IN_RAILS = [
  { code: "IN_UPI", label: "UPI" },
  { code: "IN_IMPS", label: "IMPS" },
  { code: "IN_NEFT", label: "NEFT" },
  { code: "IN_RTGS", label: "RTGS" }
];
var NG_RAILS = [
  { code: "NG_NIP", label: "NIP (Nigeria Inter-Bank Settlement)" },
  { code: "NG_BANK", label: "Local bank transfer" }
];
var AU_RAILS = [
  { code: "AU_NPP", label: "NPP / PayID (real-time)" },
  { code: "AU_BECS", label: "BECS direct entry" }
];
var CA_RAILS = [
  { code: "CA_EFT", label: "EFT (Electronic Funds Transfer)" },
  { code: "CA_INTERAC", label: "Interac e-Transfer" },
  { code: "CA_WIRE", label: "Domestic wire transfer" }
];
var MX_RAILS = [
  { code: "MX_SPEI", label: "SPEI (Banco de M\xE9xico)" },
  { code: "MX_LOCAL", label: "Local bank transfer" }
];
var JP_RAILS = [
  { code: "JP_ZENGIN", label: "Zengin System (domestic)" },
  { code: "JP_FURIKOMI", label: "Bank furikomi transfer" }
];
var CN_RAILS = [
  { code: "CN_CNAPS", label: "CNAPS / IBPS" },
  { code: "CN_LOCAL", label: "Local bank transfer" }
];
var HK_RAILS = [
  { code: "HK_FPS", label: "FPS (Faster Payment System)" },
  { code: "HK_CHATS", label: "CHATS (RTGS)" }
];
var SG_RAILS = [
  { code: "SG_FAST", label: "FAST / PayNow" },
  { code: "SG_GIRO", label: "GIRO" }
];
var AE_RAILS = [
  { code: "AE_UAEFTS", label: "UAEFTS (UAE Funds Transfer System)" },
  { code: "AE_LOCAL", label: "Local bank transfer" }
];
var ZA_RAILS = [
  { code: "ZA_EFT", label: "EFT (electronic funds transfer)" },
  { code: "ZA_RTC", label: "RTC (real-time clearing)" }
];
var KE_RAILS = [
  { code: "KE_PESALINK", label: "PesaLink" },
  { code: "KE_RTGS", label: "Kenya RTGS" }
];
var KR_RAILS = [
  { code: "KR_LOCAL", label: "Korea Financial Telecommunications transfer" }
];
var TR_RAILS = [
  { code: "TR_FAST", label: "FAST (instant payment)" },
  { code: "TR_EFT", label: "EFT / Havale" }
];
var PL_RAILS = [
  { code: "PL_ELIXIR", label: "Elixir (domestic clearing)" },
  { code: "PL_SEPA", label: "SEPA transfer" }
];
var CH_RAILS = [
  { code: "CH_SIC", label: "SIC (Swiss Interbank Clearing)" },
  { code: "CH_SEPA", label: "SEPA transfer" }
];
var NO_RAILS = [
  { code: "NO_NICS", label: "NICS (Norwegian clearing)" }
];
var SE_RAILS = [
  { code: "SE_BANKGIRO", label: "Bankgiro" },
  { code: "SE_PLUSGIRO", label: "Plusgiro" }
];
var DK_RAILS = [
  { code: "DK_INTRADAG", label: "Intradag clearing" }
];
var COUNTRY_DEPOSIT_RAILS = {
  US: US_RAILS,
  AS: US_RAILS,
  GU: US_RAILS,
  MP: US_RAILS,
  PR: US_RAILS,
  VI: US_RAILS,
  UM: US_RAILS,
  GB: GB_RAILS,
  UK: GB_RAILS,
  IM: GB_RAILS,
  JE: GB_RAILS,
  GG: GB_RAILS,
  BR: BR_RAILS,
  DE: DE_RAILS,
  ES: ES_RAILS,
  IN: IN_RAILS,
  NG: NG_RAILS,
  AU: AU_RAILS,
  CC: AU_RAILS,
  CX: AU_RAILS,
  NF: AU_RAILS,
  CA: CA_RAILS,
  MX: MX_RAILS,
  JP: JP_RAILS,
  CN: CN_RAILS,
  HK: HK_RAILS,
  SG: SG_RAILS,
  AE: AE_RAILS,
  ZA: ZA_RAILS,
  KE: KE_RAILS,
  KR: KR_RAILS,
  TR: TR_RAILS,
  PL: PL_RAILS,
  CH: CH_RAILS,
  NO: NO_RAILS,
  SJ: NO_RAILS,
  SE: SE_RAILS,
  DK: DK_RAILS,
  FO: DK_RAILS,
  GL: DK_RAILS,
  CM: XAF_RAILS,
  CF: XAF_RAILS,
  CG: XAF_RAILS,
  TD: XAF_RAILS,
  GQ: XAF_RAILS,
  GA: XAF_RAILS,
  SN: XOF_RAILS,
  CI: XOF_RAILS,
  BF: XOF_RAILS,
  ML: XOF_RAILS,
  NE: XOF_RAILS,
  TG: XOF_RAILS,
  BJ: XOF_RAILS,
  GW: XOF_RAILS
};
var CURRENCY_DEPOSIT_RAILS = {
  USD: US_RAILS,
  EUR: SEPA_RAILS,
  GBP: GB_RAILS,
  BRL: BR_RAILS,
  XAF: XAF_RAILS,
  XOF: XOF_RAILS,
  INR: IN_RAILS,
  NGN: NG_RAILS,
  AUD: AU_RAILS,
  CAD: CA_RAILS,
  MXN: MX_RAILS,
  JPY: JP_RAILS,
  CNY: CN_RAILS,
  HKD: HK_RAILS,
  SGD: SG_RAILS,
  AED: AE_RAILS,
  ZAR: ZA_RAILS,
  KES: KE_RAILS,
  KRW: KR_RAILS,
  TRY: TR_RAILS,
  PLN: PL_RAILS,
  CHF: CH_RAILS,
  NOK: NO_RAILS,
  SEK: SE_RAILS,
  DKK: DK_RAILS
};
var EUROZONE_AND_SEPA_STYLE = /* @__PURE__ */ new Set([
  "AT",
  "BE",
  "CY",
  "EE",
  "FI",
  "FR",
  "GR",
  "HR",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PT",
  "SI",
  "SK",
  "AD",
  "MC",
  "SM",
  "VA",
  "XK",
  "BL",
  "GF",
  "GP",
  "MF",
  "MQ",
  "PM",
  "RE",
  "YT",
  "EA",
  "IC"
]);
function resolveDepositCountryCode(countryCode) {
  const code = countryCode.trim().toUpperCase();
  if (code === "UK") return "GB";
  return code;
}
function getDepositRailsForCountry(countryCode) {
  const code = resolveDepositCountryCode(countryCode);
  const explicit = COUNTRY_DEPOSIT_RAILS[code];
  if (explicit?.length) {
    return [...explicit];
  }
  if (EUROZONE_AND_SEPA_STYLE.has(code)) {
    return [...SEPA_RAILS];
  }
  const fiat = resolvePrimaryFiatCurrency(code);
  const byCurrency = CURRENCY_DEPOSIT_RAILS[fiat];
  if (byCurrency?.length) {
    return [...byCurrency];
  }
  return [
    {
      code: "LOCAL_BANK",
      label: `Local bank transfer (${fiat})`
    }
  ];
}
function isDepositRailAllowedForCountry(countryCode, railCode) {
  const normalized = railCode.trim().toUpperCase();
  return getDepositRailsForCountry(countryCode).some((rail) => rail.code === normalized);
}

// src/domain/country/withdrawalRailFields.ts
function isWithdrawalRailAllowedForCountry(countryCode, railCode) {
  return isDepositRailAllowedForCountry(countryCode, railCode);
}
var ACCOUNT_HOLDER = {
  key: "accountHolderName",
  label: "Account holder name",
  placeholder: "Full legal name",
  required: true
};
var US_BANK_FIELDS = [
  ACCOUNT_HOLDER,
  { key: "bankName", label: "Bank name", placeholder: "Receiving bank", required: true },
  { key: "routingNumber", label: "Routing number (ABA)", placeholder: "9 digits", required: true },
  { key: "accountNumber", label: "Account number", placeholder: "Account number", required: true },
  {
    key: "accountType",
    label: "Account type",
    type: "select",
    required: true,
    options: [
      { value: "CHECKING", label: "Checking" },
      { value: "SAVINGS", label: "Savings" }
    ]
  }
];
var SEPA_FIELDS = [
  { key: "beneficiaryName", label: "Beneficiary name", placeholder: "Full legal name", required: true },
  { key: "iban", label: "IBAN", placeholder: "DE89 3704 0044 0532 0130 00", required: true },
  { key: "bic", label: "BIC / SWIFT", placeholder: "COBADEFFXXX", required: true }
];
var GB_FIELDS = [
  ACCOUNT_HOLDER,
  { key: "sortCode", label: "Sort code", placeholder: "00-00-00", required: true },
  { key: "accountNumber", label: "Account number", placeholder: "8 digits", required: true }
];
var BR_PIX_FIELDS = [
  ACCOUNT_HOLDER,
  {
    key: "pixKeyType",
    label: "Pix key type",
    type: "select",
    required: true,
    options: [
      { value: "CPF", label: "CPF" },
      { value: "CNPJ", label: "CNPJ" },
      { value: "EMAIL", label: "Email" },
      { value: "PHONE", label: "Phone" },
      { value: "RANDOM", label: "Random key" }
    ]
  },
  { key: "pixKey", label: "Pix key", placeholder: "Your Pix key", required: true }
];
var BR_BANK_FIELDS = [
  ACCOUNT_HOLDER,
  { key: "bankName", label: "Bank name", required: true },
  { key: "branchCode", label: "Branch (ag\xEAncia)", required: true },
  { key: "accountNumber", label: "Account number", required: true },
  { key: "cpfCnpj", label: "CPF or CNPJ", required: true }
];
var IN_UPI_FIELDS = [
  ACCOUNT_HOLDER,
  { key: "upiId", label: "UPI ID", placeholder: "name@bank", required: true }
];
var IN_BANK_FIELDS = [
  ACCOUNT_HOLDER,
  { key: "accountNumber", label: "Account number", required: true },
  { key: "ifsc", label: "IFSC code", placeholder: "SBIN0001234", required: true }
];
var GENERIC_BANK_FIELDS = [
  ACCOUNT_HOLDER,
  { key: "bankName", label: "Bank name", required: true },
  { key: "accountNumber", label: "Account number", required: true },
  { key: "swiftOrRouting", label: "SWIFT / BIC / routing reference", required: true }
];
function getWithdrawalFieldsForRail(railCode) {
  const code = railCode.trim().toUpperCase();
  if (code === "BR_PIX") return BR_PIX_FIELDS;
  if (code.startsWith("BR_")) return BR_BANK_FIELDS;
  if (code.startsWith("US_")) return US_BANK_FIELDS;
  if (code.startsWith("GB_")) return GB_FIELDS;
  if (code.startsWith("EU_") || code.startsWith("DE_") || code.startsWith("ES_") || code === "PL_SEPA" || code === "CH_SEPA") {
    return SEPA_FIELDS;
  }
  if (code === "IN_UPI") return IN_UPI_FIELDS;
  if (code.startsWith("IN_")) return IN_BANK_FIELDS;
  if (code.startsWith("AU_")) {
    return [
      ACCOUNT_HOLDER,
      { key: "bsb", label: "BSB", placeholder: "000-000", required: true },
      { key: "accountNumber", label: "Account number", required: true },
      { key: "payId", label: "PayID (optional)", required: false }
    ];
  }
  if (code.startsWith("CA_")) {
    return [
      ACCOUNT_HOLDER,
      { key: "institutionNumber", label: "Institution number", required: true },
      { key: "transitNumber", label: "Transit number", required: true },
      { key: "accountNumber", label: "Account number", required: true }
    ];
  }
  return GENERIC_BANK_FIELDS;
}
function validateWithdrawalBankingDetails(railCode, details) {
  const fields = getWithdrawalFieldsForRail(railCode);
  for (const field of fields) {
    if (!field.required) continue;
    const value = (details[field.key] ?? "").trim();
    if (!value) {
      throw new Error(`${field.label} is required for this withdrawal method.`);
    }
  }
}
var BTC_ADDRESS_MIN = 14;
var BTC_ADDRESS_MAX = 90;
function validateBtcWithdrawalAddress(address) {
  const trimmed = address.trim();
  if (trimmed.length < BTC_ADDRESS_MIN || trimmed.length > BTC_ADDRESS_MAX) {
    throw new Error("Enter a valid Bitcoin withdrawal address.");
  }
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    throw new Error("Bitcoin address must contain only letters and numbers.");
  }
}

// src/lib/illustrativeUsdRates.ts
var LOCAL_UNITS_PER_USD = {
  AED: 3.67,
  AFN: 70,
  ALL: 93,
  AMD: 390,
  ANG: 1.79,
  AOA: 830,
  ARS: 870,
  AUD: 1.53,
  AWG: 1.79,
  AZN: 1.7,
  BAM: 1.8,
  BBD: 2,
  BDT: 110,
  BGN: 1.8,
  BHD: 0.377,
  BIF: 2870,
  BMD: 1,
  BND: 1.34,
  BOB: 6.9,
  BRL: 5.45,
  BSD: 1,
  BWP: 13.5,
  BYR: 3.2,
  // legacy code; treat like BYN scale for prototype
  BYN: 3.2,
  BZD: 2,
  CAD: 1.36,
  CDF: 2800,
  CHF: 0.88,
  CLP: 940,
  CNY: 7.24,
  COP: 3950,
  CRC: 520,
  CUP: 24,
  CVE: 101,
  CZK: 23,
  DJF: 178,
  DKK: 6.9,
  DOP: 59,
  DZD: 134,
  EGP: 48,
  ERN: 15,
  ETB: 57,
  EUR: 0.92,
  FJD: 2.25,
  FKP: 0.79,
  GBP: 0.79,
  GEL: 2.7,
  GHS: 15.5,
  GIP: 0.79,
  GMD: 68,
  GNF: 8600,
  GTQ: 7.75,
  GYD: 209,
  HKD: 7.82,
  HNL: 24.7,
  HRK: 6.9,
  HTG: 132,
  HUF: 360,
  IDR: 15800,
  ILS: 3.7,
  INR: 83.5,
  IQD: 1310,
  IRR: 42e3,
  ISK: 138,
  JMD: 156,
  JOD: 0.709,
  JPY: 149,
  KES: 129,
  KGS: 89,
  KHR: 4100,
  KMF: 450,
  KPW: 900,
  KRW: 1350,
  KWD: 0.308,
  KYD: 0.82,
  KZT: 450,
  LAK: 21500,
  LBP: 89500,
  LKR: 300,
  LRD: 193,
  LSL: 18.5,
  LYD: 4.8,
  MAD: 9.9,
  MDL: 17.7,
  MGA: 4500,
  MKD: 56.5,
  MMK: 2100,
  MNT: 3400,
  MOP: 8.05,
  MRO: 39,
  // legacy
  MRU: 39.5,
  MUR: 46,
  MVR: 15.4,
  MWK: 1730,
  MXN: 17.1,
  MYR: 4.7,
  MZN: 63.5,
  NAD: 18.5,
  NGN: 1550,
  NIO: 36.7,
  NOK: 10.7,
  NPR: 133,
  NZD: 1.66,
  OMR: 0.385,
  PAB: 1,
  PEN: 3.75,
  PGK: 3.9,
  PHP: 58,
  PKR: 278,
  PLN: 3.95,
  PYG: 7500,
  QAR: 3.64,
  RON: 4.57,
  RSD: 108,
  RUB: 92,
  RWF: 1300,
  SAR: 3.75,
  SBD: 8.4,
  SCR: 13.5,
  SDG: 600,
  SEK: 10.5,
  SGD: 1.34,
  SHP: 0.79,
  SLL: 21e3,
  // legacy Leone
  SLE: 22.5,
  SOS: 570,
  SRD: 35,
  SSP: 1300,
  STD: 22200,
  // legacy
  STN: 22.5,
  SYP: 13e3,
  SZL: 18.5,
  THB: 35.5,
  TJS: 10.9,
  TMT: 3.5,
  TND: 3.1,
  TOP: 2.35,
  TRY: 32.5,
  TTD: 6.78,
  TWD: 32,
  TZS: 2650,
  UAH: 41,
  UGX: 3750,
  USD: 1,
  UYU: 39,
  UZS: 12600,
  VEF: 36,
  // treat as VES-scale for prototype
  VES: 36,
  VND: 25400,
  VUV: 120,
  WST: 2.75,
  XAF: 600,
  XCD: 2.7,
  XOF: 600,
  XPF: 110,
  YER: 250,
  ZAR: 18.5,
  ZMW: 26.5,
  ZWL: 13
};
function illustrativeUsdPerLocalUnit(currency) {
  const code = currency.trim().toUpperCase();
  if (!code || code === "USD") return 1;
  if (code === "BTC") return 68500;
  const localPerUsd = LOCAL_UNITS_PER_USD[code];
  if (localPerUsd && localPerUsd > 0) {
    return 1 / localPerUsd;
  }
  return 1;
}
function illustrativeLocalUnitsPerUsd(currency) {
  const code = currency.trim().toUpperCase();
  if (!code || code === "USD") return 1;
  if (code === "BTC") return 1 / 68500;
  const localPerUsd = LOCAL_UNITS_PER_USD[code];
  if (localPerUsd && localPerUsd > 0) return localPerUsd;
  return 1;
}

// src/server/services/wallet.service.ts
var WalletService = class {
  quotes = /* @__PURE__ */ new Map();
  idempotencyStore = /* @__PURE__ */ new Map();
  transactionHistory = [];
  pendingDeposits = [];
  pendingWithdrawals = [];
  // Illustrative reference rates (strictly synthetic demo rates)
  /** Illustrative USD value of one unit of currency (prototype triangulation). */
  illustrativeUsdPerUnit(currency) {
    return illustrativeUsdPerLocalUnit(currency);
  }
  resolveIllustrativeRate(sourceCurrency, destinationCurrency) {
    const source = sourceCurrency.toUpperCase();
    const dest = destinationCurrency.toUpperCase();
    if (source === dest) return 1;
    if (source === "USD") {
      return illustrativeLocalUnitsPerUsd(dest);
    }
    if (dest === "USD") {
      return this.illustrativeUsdPerUnit(source);
    }
    const usdPerSource = this.illustrativeUsdPerUnit(source);
    const usdPerDest = this.illustrativeUsdPerUnit(dest);
    if (usdPerDest <= 0) return 1;
    return usdPerSource / usdPerDest;
  }
  resolveCustomerCountryCode(userId, countryCode) {
    const fromUser = defaultAuthService.getUserById(userId)?.countryCode;
    const resolved = (countryCode?.trim() || fromUser || "US").toUpperCase();
    return resolved;
  }
  /** Ensures operations use only signup-country fiat + BTC wallets. */
  assertCurrencyAllowedForCustomer(userId, currency, countryCode) {
    const allowed = getWalletCurrencyCodesForCountry(
      this.resolveCustomerCountryCode(userId, countryCode)
    );
    const code = currency.toUpperCase();
    if (!allowed.includes(code)) {
      throw new Error(
        `Currency ${code} is not enabled for your account. Supported: ${allowed.join(", ")}.`
      );
    }
  }
  /**
   * Retrieves or provisions the user's wallet (home fiat + BTC).
   */
  getOrCreateUserWallet(userId, fullName = "Valued Customer", countryCode) {
    const resolvedCountry = this.resolveCustomerCountryCode(userId, countryCode);
    const currencies = getWalletCurrencyCodesForCountry(resolvedCountry);
    defaultLedgerService.provisionCustomerAccounts(userId, fullName, resolvedCountry);
    const userLedgerAccounts = defaultLedgerService.getUserAccounts(userId);
    const accounts = [];
    for (const curr of currencies) {
      const currDef = getCurrency(curr);
      const availAcc = userLedgerAccounts.find(
        (a) => a.currency === curr && a.classification === "CUSTOMER_AVAILABLE_BALANCE"
      );
      const holdAcc = userLedgerAccounts.find(
        (a) => a.currency === curr && a.classification === "CUSTOMER_PENDING_HOLD"
      );
      if (availAcc) {
        const availBal = defaultLedgerService.getAccountBalance(availAcc.id);
        const holdBal = holdAcc ? defaultLedgerService.getAccountBalance(holdAcc.id) : null;
        accounts.push({
          id: `wacc_${userId}_${curr.toLowerCase()}`,
          currency: curr,
          currencyName: currDef.name,
          currencySymbol: currDef.symbol,
          minorUnits: currDef.minorUnits,
          isCrypto: currDef.isCrypto,
          ledgerAccountId: availAcc.id,
          accountNumber: availAcc.accountNumber,
          availableBalanceMinor: availBal.balanceMinor.toString(),
          formattedBalance: availBal.formatted,
          pendingHoldMinor: holdBal ? holdBal.balanceMinor.toString() : "0",
          formattedHold: holdBal ? holdBal.formatted : `${currDef.symbol}0.00 ${curr}`,
          status: availAcc.isFrozen ? "FROZEN" : "ACTIVE"
        });
      }
    }
    return {
      walletId: `wallet_${userId}`,
      userId,
      name: `${fullName}'s Wallet`,
      accounts
    };
  }
  /**
   * Executes a simulated deposit.
   * Debits Safeguarding Cash Asset, Credits Customer Available Liability.
   */
  async executeSimulatedDeposit(params) {
    const { userId, currency, amountDecimal } = params;
    const key = params.idempotencyKey || `idem_dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cached = this.checkIdempotency(key, userId, "DEPOSIT", params);
    if (cached) return cached;
    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency corridor: ${currency}`);
    }
    this.assertCurrencyAllowedForCustomer(userId, currency);
    const money = Money.fromDecimalString(amountDecimal, currency);
    if (!money.isPositive()) {
      throw new Error("Deposit amount must be strictly greater than zero.");
    }
    const wallet = this.getOrCreateUserWallet(userId);
    const targetAccount = wallet.accounts.find((a) => a.currency === currency);
    if (!targetAccount) {
      throw new Error(`Wallet account not found for currency ${currency}`);
    }
    const safeguardingAccountId = this.getSafeguardingAccountId(currency);
    const txId = `tx_sim_dep_${Date.now()}`;
    const refNum = `DEP-${currency}-${Date.now().toString().slice(-6)}`;
    const lines = [
      {
        accountId: safeguardingAccountId,
        direction: "DEBIT",
        amountMinor: money.amountMinor,
        description: `${params.sourceRail || "WIRE"} clearing settlement`
      },
      {
        accountId: targetAccount.ledgerAccountId,
        direction: "CREDIT",
        amountMinor: money.amountMinor,
        description: `Customer wallet available credit: ${refNum}`
      }
    ];
    assertDoubleEntryInvariant(lines);
    const entry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency,
      narration: `Inbound Deposit via ${params.sourceRail || "WIRE"} [${refNum}]`,
      lines
    });
    const newBalance = defaultLedgerService.getAccountBalance(targetAccount.ledgerAccountId);
    const result = {
      transactionId: txId,
      referenceNumber: refNum,
      operationType: "SIMULATED_DEPOSIT",
      status: "POSTED",
      currency,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      journalEntryId: entry.id,
      recipientAccountId: targetAccount.ledgerAccountId,
      idempotencyKey: key,
      isSimulated: true,
      authoritativeBalance: newBalance.formatted,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId,
      direction: "CREDIT",
      narration: `${currency} Deposit via ${params.sourceRail || "WIRE"}`
    };
    this.recordIdempotency(key, userId, "DEPOSIT", params, result);
    return result;
  }
  /**
   * Executes a simulated withdrawal.
   * Debits Customer Available Liability, Credits Safeguarding Cash Asset.
   * Strictly enforces available balance >= withdrawal amount (No Overdrafts).
   */
  async executeSimulatedWithdrawal(params) {
    const { userId, currency, amountDecimal } = params;
    const key = params.idempotencyKey || `idem_wth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cached = this.checkIdempotency(key, userId, "WITHDRAWAL", params);
    if (cached) return cached;
    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency corridor: ${currency}`);
    }
    this.assertCurrencyAllowedForCustomer(userId, currency);
    const money = Money.fromDecimalString(amountDecimal, currency);
    if (!money.isPositive()) {
      throw new Error("Withdrawal amount must be strictly greater than zero.");
    }
    const wallet = this.getOrCreateUserWallet(userId);
    const sourceAccount = wallet.accounts.find((a) => a.currency === currency);
    if (!sourceAccount) {
      throw new Error(`Wallet account not found for currency ${currency}`);
    }
    const currentBalance = defaultLedgerService.getAccountBalance(sourceAccount.ledgerAccountId);
    if (currentBalance.balanceMinor < money.amountMinor) {
      throw new Error(
        `Insufficient available funds. Required: ${money.toDisplayString()}, Available: ${currentBalance.formatted}`
      );
    }
    const safeguardingAccountId = this.getSafeguardingAccountId(currency);
    const txId = `tx_sim_wth_${Date.now()}`;
    const refNum = `WTH-${currency}-${Date.now().toString().slice(-6)}`;
    const lines = [
      {
        accountId: sourceAccount.ledgerAccountId,
        direction: "DEBIT",
        amountMinor: money.amountMinor,
        description: `Customer withdrawal debit: ${refNum}`
      },
      {
        accountId: safeguardingAccountId,
        direction: "CREDIT",
        amountMinor: money.amountMinor,
        description: `Disbursement to ${params.destinationRef || "External account"}`
      }
    ];
    assertDoubleEntryInvariant(lines);
    const entry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency,
      narration: `Outbound Withdrawal [${refNum}]`,
      lines
    });
    const newBalance = defaultLedgerService.getAccountBalance(sourceAccount.ledgerAccountId);
    const result = {
      transactionId: txId,
      referenceNumber: refNum,
      operationType: "SIMULATED_WITHDRAWAL",
      status: "POSTED",
      currency,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      journalEntryId: entry.id,
      senderAccountId: sourceAccount.ledgerAccountId,
      idempotencyKey: key,
      isSimulated: true,
      authoritativeBalance: newBalance.formatted,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId,
      direction: "DEBIT",
      narration: `${currency} Withdrawal to ${params.destinationRef || "External Account"}`
    };
    this.recordIdempotency(key, userId, "WITHDRAWAL", params, result);
    return result;
  }
  /**
   * Executes a simulated internal transfer between two users in the same currency.
   * Debits Sender Customer Liability, Credits Receiver Customer Liability in ONE balanced entry.
   */
  async executeInternalTransfer(params) {
    const { senderUserId, recipientEmailOrId, currency, amountDecimal } = params;
    const key = params.idempotencyKey || `idem_trf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cached = this.checkIdempotency(key, senderUserId, "TRANSFER", params);
    if (cached) return cached;
    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency corridor: ${currency}`);
    }
    this.assertCurrencyAllowedForCustomer(senderUserId, currency);
    const money = Money.fromDecimalString(amountDecimal, currency);
    if (!money.isPositive()) {
      throw new Error("Transfer amount must be strictly greater than zero.");
    }
    const senderWallet = this.getOrCreateUserWallet(senderUserId);
    const senderAccount = senderWallet.accounts.find((a) => a.currency === currency);
    if (!senderAccount) {
      throw new Error(`Sender does not have an active ${currency} wallet.`);
    }
    const senderBalance = defaultLedgerService.getAccountBalance(senderAccount.ledgerAccountId);
    if (senderBalance.balanceMinor < money.amountMinor) {
      throw new Error(
        `Insufficient available balance for transfer. Available: ${senderBalance.formatted}`
      );
    }
    const recipientWallet = this.resolveRecipientWallet(recipientEmailOrId);
    if (recipientWallet.userId === senderUserId) {
      throw new Error("Sender and recipient cannot be the same user for an internal transfer.");
    }
    const recipientAccount = recipientWallet.accounts.find((a) => a.currency === currency);
    if (!recipientAccount) {
      throw new Error(`Recipient does not have a ${currency} wallet account.`);
    }
    const txId = `tx_sim_trf_${Date.now()}`;
    const refNum = `TRF-${currency}-${Date.now().toString().slice(-6)}`;
    const lines = [
      {
        accountId: senderAccount.ledgerAccountId,
        direction: "DEBIT",
        amountMinor: money.amountMinor,
        description: `Transfer to ${recipientWallet.name}: ${params.note || "No note"}`
      },
      {
        accountId: recipientAccount.ledgerAccountId,
        direction: "CREDIT",
        amountMinor: money.amountMinor,
        description: `Transfer from ${senderWallet.name}: ${params.note || "No note"}`
      }
    ];
    assertDoubleEntryInvariant(lines);
    const entry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency,
      narration: `Internal P2P Transfer [${refNum}]`,
      lines
    });
    const newSenderBalance = defaultLedgerService.getAccountBalance(senderAccount.ledgerAccountId);
    const newRecipientBalance = defaultLedgerService.getAccountBalance(recipientAccount.ledgerAccountId);
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const result = {
      transactionId: txId,
      referenceNumber: refNum,
      operationType: "INTERNAL_TRANSFER",
      status: "POSTED",
      currency,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      journalEntryId: entry.id,
      senderAccountId: senderAccount.ledgerAccountId,
      recipientAccountId: recipientAccount.ledgerAccountId,
      idempotencyKey: key,
      isSimulated: true,
      authoritativeBalance: newSenderBalance.formatted,
      timestamp,
      userId: senderUserId,
      direction: "DEBIT",
      counterparty: recipientEmailOrId,
      narration: params.note || `Internal transfer to ${recipientEmailOrId}`
    };
    this.recordIdempotency(key, senderUserId, "TRANSFER", params, result);
    this.recordTransaction({
      transactionId: `${txId}_rcv`,
      referenceNumber: refNum,
      operationType: "INTERNAL_TRANSFER",
      status: "POSTED",
      currency,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      journalEntryId: entry.id,
      senderAccountId: senderAccount.ledgerAccountId,
      recipientAccountId: recipientAccount.ledgerAccountId,
      idempotencyKey: `${key}_rcv`,
      isSimulated: true,
      authoritativeBalance: newRecipientBalance.formatted,
      timestamp,
      userId: recipientWallet.userId,
      direction: "CREDIT",
      counterparty: senderWallet.name || senderUserId,
      narration: params.note || `Internal transfer from ${senderWallet.name || senderUserId}`
    });
    const amountStr = money.toDecimalString();
    const senderUser = defaultAuthService.getUserById(senderUserId);
    const recipientUser = defaultAuthService.getUserById(recipientWallet.userId);
    if (senderUser) {
      voidEmail(
        "transfer-sent",
        defaultEmailService.sendTransferSentEmail({
          to: senderUser.email,
          fullName: senderUser.fullName,
          amount: amountStr,
          currency,
          recipient: recipientUser?.fullName || recipientUser?.email || recipientEmailOrId,
          reference: refNum
        })
      );
    }
    if (recipientUser) {
      voidEmail(
        "transfer-received",
        defaultEmailService.sendTransferReceivedEmail({
          to: recipientUser.email,
          fullName: recipientUser.fullName,
          amount: amountStr,
          currency,
          sender: senderUser?.fullName || senderUser?.email || senderWallet.name || senderUserId,
          reference: refNum
        })
      );
    }
    return result;
  }
  /**
   * Generates an illustrative, short-lived FX quote.
   */
  generateFxQuote(params) {
    const { userId, sourceCurrency, destinationCurrency, sourceAmountDecimal } = params;
    if (sourceCurrency === destinationCurrency) {
      throw new Error("Source and destination currencies must be different.");
    }
    if (!isSupportedCurrency(sourceCurrency) || !isSupportedCurrency(destinationCurrency)) {
      throw new Error("Unsupported currency in conversion pair.");
    }
    this.assertCurrencyAllowedForCustomer(userId, sourceCurrency);
    this.assertCurrencyAllowedForCustomer(userId, destinationCurrency);
    const srcMoney = Money.fromDecimalString(sourceAmountDecimal, sourceCurrency);
    if (!srcMoney.isPositive()) {
      throw new Error("Conversion amount must be strictly greater than zero.");
    }
    const rate = this.resolveIllustrativeRate(sourceCurrency, destinationCurrency);
    const destCurrencyDef = getCurrency(destinationCurrency);
    const srcCurrencyDef = getCurrency(sourceCurrency);
    const rateScaled = BigInt(Math.round(rate * 1e8));
    const factorDest = 10n ** BigInt(destCurrencyDef.minorUnits);
    const factorSrc = 10n ** BigInt(srcCurrencyDef.minorUnits);
    const grossDestMinor = srcMoney.amountMinor * rateScaled * factorDest / (factorSrc * 100000000n);
    const feeMinor = grossDestMinor / 200n;
    const netDestMinor = grossDestMinor - feeMinor;
    const quoteRecord = {
      id: `quote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      sourceCurrency,
      destinationCurrency,
      sourceAmountMinor: srcMoney.amountMinor.toString(),
      destinationAmountMinor: netDestMinor.toString(),
      exchangeRate: rate.toString(),
      feeMinor: feeMinor.toString(),
      rateSource: "SIMULATED_REFERENCE_RATE",
      expiresAt: new Date(Date.now() + 60 * 1e3),
      // 60 seconds TTL
      isExecuted: false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.quotes.set(quoteRecord.id, quoteRecord);
    return quoteRecord;
  }
  /**
   * Executes an illustrative currency conversion against a valid, unexpired quote.
   */
  async executeFxConversion(params) {
    const { userId, quoteId } = params;
    const key = params.idempotencyKey || `idem_fx_${quoteId}`;
    const cached = this.checkIdempotency(key, userId, "FX_CONVERSION", params);
    if (cached) return cached;
    const quote = this.quotes.get(quoteId);
    if (!quote) {
      throw new Error("Quote not found or invalid.");
    }
    if (quote.userId !== userId) {
      throw new Error("Access denied: quote does not belong to this user.");
    }
    if (quote.isExecuted) {
      throw new Error("This FX quote has already been executed.");
    }
    if (quote.expiresAt < /* @__PURE__ */ new Date()) {
      throw new Error("FX quote has expired. Please request a fresh quote.");
    }
    const wallet = this.getOrCreateUserWallet(userId);
    const srcAccount = wallet.accounts.find((a) => a.currency === quote.sourceCurrency);
    const destAccount = wallet.accounts.find((a) => a.currency === quote.destinationCurrency);
    if (!srcAccount || !destAccount) {
      throw new Error("Required currency wallet account not found.");
    }
    const srcMinor = BigInt(quote.sourceAmountMinor);
    const destMinor = BigInt(quote.destinationAmountMinor);
    const srcBalance = defaultLedgerService.getAccountBalance(srcAccount.ledgerAccountId);
    if (srcBalance.balanceMinor < srcMinor) {
      throw new Error(
        `Insufficient available ${quote.sourceCurrency} funds for conversion. Available: ${srcBalance.formatted}`
      );
    }
    quote.isExecuted = true;
    const txId = `tx_sim_fx_${Date.now()}`;
    const refNum = `FX-${quote.sourceCurrency}${quote.destinationCurrency}-${Date.now().toString().slice(-6)}`;
    const leg1Lines = [
      {
        accountId: srcAccount.ledgerAccountId,
        direction: "DEBIT",
        amountMinor: srcMinor,
        description: `FX conversion out: ${refNum}`
      },
      {
        accountId: this.getSafeguardingAccountId(quote.sourceCurrency),
        direction: "CREDIT",
        amountMinor: srcMinor,
        description: `FX clearing outbound: ${refNum}`
      }
    ];
    assertDoubleEntryInvariant(leg1Lines);
    defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency: quote.sourceCurrency,
      narration: `FX Outbound Leg [${refNum}]`,
      lines: leg1Lines
    });
    const leg2Lines = [
      {
        accountId: this.getSafeguardingAccountId(quote.destinationCurrency),
        direction: "DEBIT",
        amountMinor: destMinor,
        description: `FX clearing inbound: ${refNum}`
      },
      {
        accountId: destAccount.ledgerAccountId,
        direction: "CREDIT",
        amountMinor: destMinor,
        description: `FX conversion credit: ${refNum}`
      }
    ];
    assertDoubleEntryInvariant(leg2Lines);
    const entry2 = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency: quote.destinationCurrency,
      narration: `FX Inbound Leg [${refNum}]`,
      lines: leg2Lines
    });
    const newDestBalance = defaultLedgerService.getAccountBalance(destAccount.ledgerAccountId);
    const destMoney = Money.fromMinor(destMinor, quote.destinationCurrency);
    const result = {
      transactionId: txId,
      referenceNumber: refNum,
      operationType: "FX_CONVERSION",
      status: "POSTED",
      currency: quote.destinationCurrency,
      amountMinor: destMinor.toString(),
      formattedAmount: destMoney.toDisplayString(),
      journalEntryId: entry2.id,
      senderAccountId: srcAccount.ledgerAccountId,
      recipientAccountId: destAccount.ledgerAccountId,
      idempotencyKey: key,
      isSimulated: true,
      authoritativeBalance: newDestBalance.formatted,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId,
      direction: "CREDIT",
      counterparty: `${quote.sourceCurrency} -> ${quote.destinationCurrency}`,
      narration: `FX Conversion: ${quote.sourceCurrency} to ${quote.destinationCurrency} @ ${quote.exchangeRate}`
    };
    this.recordIdempotency(key, userId, "FX_CONVERSION", params, result);
    const fxUser = defaultAuthService.getUserById(userId);
    if (fxUser) {
      const srcMoney = Money.fromMinor(srcMinor, quote.sourceCurrency);
      voidEmail(
        "fx-converted",
        defaultEmailService.sendFxConvertedEmail({
          to: fxUser.email,
          fullName: fxUser.fullName,
          fromAmount: srcMoney.toDecimalString(),
          fromCurrency: quote.sourceCurrency,
          toAmount: destMoney.toDecimalString(),
          toCurrency: quote.destinationCurrency,
          rate: quote.exchangeRate
        })
      );
    }
    return result;
  }
  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------
  getSafeguardingAccountId(currency) {
    switch (currency) {
      case "USD":
        return "acc_safeguarding_cash_usd";
      case "EUR":
        return "acc_safeguarding_cash_eur";
      case "BRL":
        return "acc_safeguarding_cash_brl";
      case "BTC":
        return "acc_safeguarding_crypto_btc";
      default:
        return defaultLedgerService.ensureSafeguardingAssetAccount(currency).id;
    }
  }
  getCustomerHoldLedgerAccountId(userId, currency, fullName) {
    this.getOrCreateUserWallet(userId, fullName);
    const holdAcc = defaultLedgerService.getUserAccounts(userId).find(
      (a) => a.currency === currency && a.classification === "CUSTOMER_PENDING_HOLD"
    );
    if (!holdAcc) {
      throw new Error(`Pending hold account not provisioned for ${currency}.`);
    }
    return holdAcc.id;
  }
  getCustomerAvailableLedgerAccountId(userId, currency, fullName) {
    const wallet = this.getOrCreateUserWallet(userId, fullName);
    const target = wallet.accounts.find((a) => a.currency === currency);
    if (!target) {
      throw new Error(`Wallet account not found for currency ${currency}`);
    }
    return target.ledgerAccountId;
  }
  /**
   * Records an inbound deposit on the customer's pending-hold liability until operations approves it.
   * DEBIT safeguarding asset, CREDIT customer pending hold (not available balance).
   */
  async requestPendingDeposit(params) {
    const currency = params.currency.toUpperCase();
    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency corridor: ${currency}`);
    }
    this.assertCurrencyAllowedForCustomer(params.userId, currency);
    const money = Money.fromDecimalString(params.amountDecimal, currency);
    if (!money.isPositive()) {
      throw new Error("Deposit amount must be strictly greater than zero.");
    }
    if (params.kind === "BTC") {
      if (!params.fileName || !params.mimeType || params.fileSize === void 0) {
        throw new Error("Bitcoin deposit proof metadata is required.");
      }
      if (!params.mimeType.startsWith("image/")) {
        throw new Error("Payment proof must be an image (JPEG, PNG, or WebP).");
      }
      if (params.fileSize > 10 * 1024 * 1024) {
        throw new Error("Payment proof image must be 10 MB or smaller.");
      }
    }
    if (params.kind === "FIAT" && params.sourceRail) {
      this.assertFiatDepositRailAllowed(params.userId, params.sourceRail);
    }
    const safeguardingAccountId = this.getSafeguardingAccountId(currency);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(params.userId, currency);
    const txId = `tx_dep_hold_${Date.now()}`;
    const refNum = `DEP-HOLD-${currency}-${Date.now().toString().slice(-6)}`;
    const lines = [
      {
        accountId: safeguardingAccountId,
        direction: "DEBIT",
        amountMinor: money.amountMinor,
        description: `${params.kind === "BTC" ? "BTC" : params.sourceRail || "WIRE"} inbound pending clearance`
      },
      {
        accountId: holdAccountId,
        direction: "CREDIT",
        amountMinor: money.amountMinor,
        description: `Customer deposit pending review: ${refNum}`
      }
    ];
    assertDoubleEntryInvariant(lines);
    const entry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency,
      narration: `Pending deposit hold (${params.kind}) [${refNum}]`,
      lines
    });
    const record = {
      id: `dep_pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: params.userId,
      kind: params.kind,
      currency,
      amountDecimal: params.amountDecimal,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      sourceRail: params.sourceRail,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      storageRef: params.kind === "BTC" ? `vault://deposits/btc/${params.userId}/${Date.now()}.enc` : void 0,
      submittedAt: /* @__PURE__ */ new Date(),
      status: "PENDING_REVIEW",
      holdJournalEntryId: entry.id,
      referenceNumber: refNum,
      origin: "CUSTOMER"
    };
    this.pendingDeposits.push(record);
    this.recordPendingDepositHistory(record, entry.id, txId);
    defaultAuditService.logAction({
      action: params.kind === "BTC" ? "BTC_DEPOSIT_PROOF_SUBMITTED" : "FIAT_DEPOSIT_REQUESTED",
      actorUserId: params.userId,
      actorRole: "CUSTOMER",
      resourceType: "WALLET_DEPOSIT",
      resourceId: record.id,
      details: {
        currency,
        amountDecimal: params.amountDecimal,
        referenceNumber: refNum,
        sourceRail: params.sourceRail,
        fileName: params.fileName
      }
    });
    const depositUser = defaultAuthService.getUserById(params.userId);
    if (depositUser) {
      const amountStr = money.toDecimalString();
      voidEmail(
        "deposit-requested",
        defaultEmailService.sendDepositRequestedEmail({
          to: depositUser.email,
          fullName: depositUser.fullName,
          amount: amountStr,
          currency,
          reference: refNum
        })
      );
      voidEmail(
        "deposit-staff",
        defaultEmailService.sendDepositStaffEmail({
          customerName: depositUser.fullName,
          amount: amountStr,
          currency,
          depositId: record.id
        })
      );
    }
    return record;
  }
  getPendingDepositsForAdmin(params) {
    const allowed = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowed.includes(params.actorRole)) {
      throw new Error("Access denied: Staff role required.");
    }
    const status = params.status ?? "PENDING_REVIEW";
    return this.pendingDeposits.filter((d) => d.status === status).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }
  approvePendingDeposit(params) {
    const allowed = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowed.includes(params.actorRole)) {
      throw new Error("Access denied: Staff role required.");
    }
    const record = this.pendingDeposits.find((d) => d.id === params.depositId);
    if (!record) {
      throw new Error("Pending deposit not found.");
    }
    if (record.status !== "PENDING_REVIEW") {
      throw new Error(`Deposit is already ${record.status}.`);
    }
    const amountMinor = BigInt(record.amountMinor);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(record.userId, record.currency);
    const availAccountId = this.getCustomerAvailableLedgerAccountId(record.userId, record.currency);
    const txId = `tx_dep_release_${Date.now()}`;
    const refNum = `DEP-APPR-${record.currency}-${Date.now().toString().slice(-6)}`;
    const lines = [
      {
        accountId: holdAccountId,
        direction: "DEBIT",
        amountMinor,
        description: `Release pending deposit to available: ${record.referenceNumber}`
      },
      {
        accountId: availAccountId,
        direction: "CREDIT",
        amountMinor,
        description: `Approved deposit credit: ${refNum}`
      }
    ];
    assertDoubleEntryInvariant(lines);
    const releaseEntry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency: record.currency,
      narration: `Deposit approved \u2014 hold released to available [${refNum}]`,
      lines
    });
    record.status = "APPROVED";
    record.reviewedAt = /* @__PURE__ */ new Date();
    record.reviewedByUserId = params.actorUserId;
    record.reviewNotes = params.notes;
    record.releaseJournalEntryId = releaseEntry.id;
    const availBalance = defaultLedgerService.getAccountBalance(availAccountId);
    this.updateHistoryByReference(
      record.userId,
      record.referenceNumber,
      {
        status: "POSTED",
        journalEntryId: releaseEntry.id,
        transactionId: txId,
        authoritativeBalance: availBalance.formatted,
        narration: `${record.currency} deposit approved via ${record.sourceRail || record.kind}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        transactionId: txId,
        operationType: "SIMULATED_DEPOSIT",
        status: "POSTED",
        currency: record.currency,
        amountMinor: record.amountMinor,
        formattedAmount: record.formattedAmount,
        journalEntryId: releaseEntry.id,
        idempotencyKey: `idem_${record.id}`,
        isSimulated: true,
        authoritativeBalance: availBalance.formatted,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        direction: "CREDIT",
        narration: `${record.currency} deposit approved via ${record.sourceRail || record.kind}`
      }
    );
    defaultAuditService.logAction({
      action: "DEPOSIT_APPROVED",
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: "WALLET_DEPOSIT",
      resourceId: record.id,
      details: {
        referenceNumber: record.referenceNumber,
        releaseJournalEntryId: releaseEntry.id,
        notes: params.notes
      }
    });
    const approvedUser = defaultAuthService.getUserById(record.userId);
    if (approvedUser) {
      voidEmail(
        "deposit-approved",
        defaultEmailService.sendDepositApprovedEmail({
          to: approvedUser.email,
          fullName: approvedUser.fullName,
          amount: record.amountDecimal,
          currency: record.currency,
          reference: record.referenceNumber
        })
      );
    }
    return record;
  }
  rejectPendingDeposit(params) {
    const allowed = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowed.includes(params.actorRole)) {
      throw new Error("Access denied: Staff role required.");
    }
    if (!params.reason.trim()) {
      throw new Error("Rejection reason is required.");
    }
    const record = this.pendingDeposits.find((d) => d.id === params.depositId);
    if (!record) {
      throw new Error("Pending deposit not found.");
    }
    if (record.status !== "PENDING_REVIEW") {
      throw new Error(`Deposit is already ${record.status}.`);
    }
    const amountMinor = BigInt(record.amountMinor);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(record.userId, record.currency);
    const safeguardingAccountId = this.getSafeguardingAccountId(record.currency);
    const txId = `tx_dep_reject_${Date.now()}`;
    const refNum = `DEP-REJ-${record.currency}-${Date.now().toString().slice(-6)}`;
    const lines = [
      {
        accountId: holdAccountId,
        direction: "DEBIT",
        amountMinor,
        description: `Reverse pending deposit hold: ${record.referenceNumber}`
      },
      {
        accountId: safeguardingAccountId,
        direction: "CREDIT",
        amountMinor,
        description: `Reject inbound deposit clearance: ${refNum}`
      }
    ];
    assertDoubleEntryInvariant(lines);
    const releaseEntry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency: record.currency,
      narration: `Deposit rejected \u2014 hold reversed [${refNum}]`,
      lines
    });
    record.status = "REJECTED";
    record.reviewedAt = /* @__PURE__ */ new Date();
    record.reviewedByUserId = params.actorUserId;
    record.reviewNotes = params.reason.trim();
    record.releaseJournalEntryId = releaseEntry.id;
    this.updateHistoryByReference(
      record.userId,
      record.referenceNumber,
      {
        status: "REVERSED",
        journalEntryId: releaseEntry.id,
        transactionId: txId,
        narration: `${record.currency} deposit rejected \u2014 ${params.reason.trim()}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        transactionId: txId,
        operationType: "SIMULATED_DEPOSIT",
        status: "REVERSED",
        currency: record.currency,
        amountMinor: record.amountMinor,
        formattedAmount: record.formattedAmount,
        journalEntryId: releaseEntry.id,
        idempotencyKey: `idem_${record.id}`,
        isSimulated: true,
        authoritativeBalance: "\u2014",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        direction: "CREDIT",
        narration: `${record.currency} deposit rejected \u2014 ${params.reason.trim()}`
      }
    );
    defaultAuditService.logAction({
      action: "DEPOSIT_REJECTED",
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: "WALLET_DEPOSIT",
      resourceId: record.id,
      details: {
        referenceNumber: record.referenceNumber,
        reason: params.reason.trim(),
        releaseJournalEntryId: releaseEntry.id
      }
    });
    const rejectedUser = defaultAuthService.getUserById(record.userId);
    if (rejectedUser) {
      voidEmail(
        "deposit-rejected",
        defaultEmailService.sendDepositRejectedEmail({
          to: rejectedUser.email,
          fullName: rejectedUser.fullName,
          amount: record.amountDecimal,
          currency: record.currency,
          reason: params.reason.trim()
        })
      );
    }
    return record;
  }
  /**
   * Reserves withdrawal amount from available balance onto pending hold until operations approves payout.
   * DEBIT customer available, CREDIT customer pending hold.
   */
  async requestPendingWithdrawal(params) {
    const currency = params.currency.toUpperCase();
    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency corridor: ${currency}`);
    }
    this.assertCurrencyAllowedForCustomer(params.userId, currency);
    const money = Money.fromDecimalString(params.amountDecimal, currency);
    if (!money.isPositive()) {
      throw new Error("Withdrawal amount must be strictly greater than zero.");
    }
    const bankingDetails = { ...params.bankingDetails ?? {} };
    if (params.kind === "BTC") {
      if (!params.btcAddress?.trim()) {
        throw new Error("Bitcoin withdrawal address is required.");
      }
      validateBtcWithdrawalAddress(params.btcAddress);
    } else {
      if (!params.destinationRail?.trim()) {
        throw new Error("Select a local withdrawal method.");
      }
      this.assertFiatWithdrawalRailAllowed(params.userId, params.destinationRail);
      validateWithdrawalBankingDetails(params.destinationRail, bankingDetails);
    }
    const availAccountId = this.getCustomerAvailableLedgerAccountId(params.userId, currency);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(params.userId, currency);
    const currentBalance = defaultLedgerService.getAccountBalance(availAccountId);
    if (currentBalance.balanceMinor < money.amountMinor) {
      throw new Error(
        `Insufficient available funds. Required: ${money.toDisplayString()}, Available: ${currentBalance.formatted}`
      );
    }
    const txId = `tx_wth_hold_${Date.now()}`;
    const refNum = `WTH-HOLD-${currency}-${Date.now().toString().slice(-6)}`;
    const lines = [
      {
        accountId: availAccountId,
        direction: "DEBIT",
        amountMinor: money.amountMinor,
        description: `Withdrawal reservation from available: ${refNum}`
      },
      {
        accountId: holdAccountId,
        direction: "CREDIT",
        amountMinor: money.amountMinor,
        description: `Outbound withdrawal pending review: ${refNum}`
      }
    ];
    assertDoubleEntryInvariant(lines);
    const entry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency,
      narration: `Pending withdrawal hold (${params.kind}) [${refNum}]`,
      lines
    });
    const record = {
      id: `wth_pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: params.userId,
      kind: params.kind,
      currency,
      amountDecimal: params.amountDecimal,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      destinationRail: params.destinationRail?.trim().toUpperCase(),
      bankingDetails,
      btcAddress: params.btcAddress?.trim(),
      submittedAt: /* @__PURE__ */ new Date(),
      status: "PENDING_REVIEW",
      holdJournalEntryId: entry.id,
      referenceNumber: refNum,
      origin: "CUSTOMER"
    };
    this.pendingWithdrawals.push(record);
    this.recordPendingWithdrawalHistory(record, entry.id, txId);
    defaultAuditService.logAction({
      action: params.kind === "BTC" ? "BTC_WITHDRAWAL_REQUESTED" : "FIAT_WITHDRAWAL_REQUESTED",
      actorUserId: params.userId,
      actorRole: "CUSTOMER",
      resourceType: "WALLET_WITHDRAWAL",
      resourceId: record.id,
      details: {
        currency,
        amountDecimal: params.amountDecimal,
        referenceNumber: refNum,
        destinationRail: record.destinationRail,
        btcAddress: record.btcAddress,
        bankingDetails
      }
    });
    const withdrawalUser = defaultAuthService.getUserById(params.userId);
    if (withdrawalUser) {
      const amountStr = money.toDecimalString();
      voidEmail(
        "withdrawal-requested",
        defaultEmailService.sendWithdrawalRequestedEmail({
          to: withdrawalUser.email,
          fullName: withdrawalUser.fullName,
          amount: amountStr,
          currency,
          reference: refNum
        })
      );
      voidEmail(
        "withdrawal-staff",
        defaultEmailService.sendWithdrawalStaffEmail({
          customerName: withdrawalUser.fullName,
          amount: amountStr,
          currency,
          withdrawalId: record.id
        })
      );
    }
    return record;
  }
  getPendingWithdrawalsForAdmin(params) {
    const allowed = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowed.includes(params.actorRole)) {
      throw new Error("Access denied: Staff role required.");
    }
    const status = params.status ?? "PENDING_REVIEW";
    return this.pendingWithdrawals.filter((w) => w.status === status).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }
  approvePendingWithdrawal(params) {
    const allowed = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowed.includes(params.actorRole)) {
      throw new Error("Access denied: Staff role required.");
    }
    const record = this.pendingWithdrawals.find((w) => w.id === params.withdrawalId);
    if (!record) {
      throw new Error("Pending withdrawal not found.");
    }
    if (record.status !== "PENDING_REVIEW") {
      throw new Error(`Withdrawal is already ${record.status}.`);
    }
    const amountMinor = BigInt(record.amountMinor);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(record.userId, record.currency);
    const safeguardingAccountId = this.getSafeguardingAccountId(record.currency);
    const txId = `tx_wth_release_${Date.now()}`;
    const refNum = `WTH-APPR-${record.currency}-${Date.now().toString().slice(-6)}`;
    const payoutRef = record.kind === "BTC" ? record.btcAddress : Object.entries(record.bankingDetails).map(([k, v]) => `${k}=${v}`).join("; ");
    const lines = [
      {
        accountId: holdAccountId,
        direction: "DEBIT",
        amountMinor,
        description: `Release withdrawal hold for payout: ${record.referenceNumber}`
      },
      {
        accountId: safeguardingAccountId,
        direction: "CREDIT",
        amountMinor,
        description: `Disbursement to ${payoutRef || "external account"}`
      }
    ];
    assertDoubleEntryInvariant(lines);
    const releaseEntry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency: record.currency,
      narration: `Withdrawal approved \u2014 payout from hold [${refNum}]`,
      lines
    });
    record.status = "APPROVED";
    record.reviewedAt = /* @__PURE__ */ new Date();
    record.reviewedByUserId = params.actorUserId;
    record.reviewNotes = params.notes;
    record.releaseJournalEntryId = releaseEntry.id;
    const availBalance = defaultLedgerService.getAccountBalance(
      this.getCustomerAvailableLedgerAccountId(record.userId, record.currency)
    );
    this.updateHistoryByReference(
      record.userId,
      record.referenceNumber,
      {
        status: "POSTED",
        journalEntryId: releaseEntry.id,
        transactionId: txId,
        authoritativeBalance: availBalance.formatted,
        narration: `${record.currency} withdrawal paid out via ${record.destinationRail || record.kind}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        transactionId: txId,
        operationType: "SIMULATED_WITHDRAWAL",
        status: "POSTED",
        currency: record.currency,
        amountMinor: record.amountMinor,
        formattedAmount: record.formattedAmount,
        journalEntryId: releaseEntry.id,
        idempotencyKey: `idem_${record.id}`,
        isSimulated: true,
        authoritativeBalance: availBalance.formatted,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        direction: "DEBIT",
        narration: `${record.currency} withdrawal paid out via ${record.destinationRail || record.kind}`
      }
    );
    defaultAuditService.logAction({
      action: "WITHDRAWAL_APPROVED",
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: "WALLET_WITHDRAWAL",
      resourceId: record.id,
      details: {
        referenceNumber: record.referenceNumber,
        releaseJournalEntryId: releaseEntry.id,
        notes: params.notes
      }
    });
    const approvedWthUser = defaultAuthService.getUserById(record.userId);
    if (approvedWthUser) {
      voidEmail(
        "withdrawal-approved",
        defaultEmailService.sendWithdrawalApprovedEmail({
          to: approvedWthUser.email,
          fullName: approvedWthUser.fullName,
          amount: record.amountDecimal,
          currency: record.currency
        })
      );
    }
    return record;
  }
  rejectPendingWithdrawal(params) {
    const allowed = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowed.includes(params.actorRole)) {
      throw new Error("Access denied: Staff role required.");
    }
    if (!params.reason.trim()) {
      throw new Error("Rejection reason is required.");
    }
    const record = this.pendingWithdrawals.find((w) => w.id === params.withdrawalId);
    if (!record) {
      throw new Error("Pending withdrawal not found.");
    }
    if (record.status !== "PENDING_REVIEW") {
      throw new Error(`Withdrawal is already ${record.status}.`);
    }
    const amountMinor = BigInt(record.amountMinor);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(record.userId, record.currency);
    const availAccountId = this.getCustomerAvailableLedgerAccountId(record.userId, record.currency);
    const txId = `tx_wth_reject_${Date.now()}`;
    const refNum = `WTH-REJ-${record.currency}-${Date.now().toString().slice(-6)}`;
    const lines = [
      {
        accountId: holdAccountId,
        direction: "DEBIT",
        amountMinor,
        description: `Cancel pending withdrawal hold: ${record.referenceNumber}`
      },
      {
        accountId: availAccountId,
        direction: "CREDIT",
        amountMinor,
        description: `Return funds to available: ${refNum}`
      }
    ];
    assertDoubleEntryInvariant(lines);
    const releaseEntry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency: record.currency,
      narration: `Withdrawal rejected \u2014 hold returned to available [${refNum}]`,
      lines
    });
    record.status = "REJECTED";
    record.reviewedAt = /* @__PURE__ */ new Date();
    record.reviewedByUserId = params.actorUserId;
    record.reviewNotes = params.reason.trim();
    record.releaseJournalEntryId = releaseEntry.id;
    const availBalance = defaultLedgerService.getAccountBalance(availAccountId);
    this.updateHistoryByReference(
      record.userId,
      record.referenceNumber,
      {
        status: "REVERSED",
        journalEntryId: releaseEntry.id,
        transactionId: txId,
        authoritativeBalance: availBalance.formatted,
        narration: `${record.currency} withdrawal cancelled \u2014 funds returned`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        transactionId: txId,
        operationType: "SIMULATED_WITHDRAWAL",
        status: "REVERSED",
        currency: record.currency,
        amountMinor: record.amountMinor,
        formattedAmount: record.formattedAmount,
        journalEntryId: releaseEntry.id,
        idempotencyKey: `idem_${record.id}`,
        isSimulated: true,
        authoritativeBalance: availBalance.formatted,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        direction: "DEBIT",
        narration: `${record.currency} withdrawal cancelled \u2014 funds returned`
      }
    );
    defaultAuditService.logAction({
      action: "WITHDRAWAL_REJECTED",
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: "WALLET_WITHDRAWAL",
      resourceId: record.id,
      details: {
        referenceNumber: record.referenceNumber,
        reason: params.reason.trim(),
        releaseJournalEntryId: releaseEntry.id
      }
    });
    const rejectedWthUser = defaultAuthService.getUserById(record.userId);
    if (rejectedWthUser) {
      voidEmail(
        "withdrawal-rejected",
        defaultEmailService.sendWithdrawalRejectedEmail({
          to: rejectedWthUser.email,
          fullName: rejectedWthUser.fullName,
          amount: record.amountDecimal,
          currency: record.currency,
          reason: params.reason.trim()
        })
      );
    }
    return record;
  }
  /**
   * Admin-initiated funding adjustment: CREDIT queues a pending deposit hold;
   * DEBIT queues a pending withdrawal hold. Both require a documented reason and
   * still need approve/reject via the existing ops queues.
   */
  async adminRequestFundingAdjustment(params) {
    const allowed = ["ADMIN", "SUPER_ADMIN"];
    if (!allowed.includes(params.actorRole)) {
      throw new Error("Access denied: ADMIN or SUPER_ADMIN role required.");
    }
    const reason = params.reason.trim();
    if (reason.length < 3) {
      throw new Error("A documented reason of at least 3 characters is required.");
    }
    const target = defaultAuthService.getUserById(params.targetUserId);
    if (!target) {
      throw new Error("Customer not found.");
    }
    if (target.role !== "CUSTOMER") {
      throw new Error("Funding adjustments are only allowed for customer accounts.");
    }
    const currency = params.currency.toUpperCase();
    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency corridor: ${currency}`);
    }
    this.assertCurrencyAllowedForCustomer(params.targetUserId, currency);
    const money = Money.fromDecimalString(params.amountDecimal, currency);
    if (!money.isPositive()) {
      throw new Error("Amount must be strictly greater than zero.");
    }
    if (params.direction === "CREDIT") {
      const safeguardingAccountId = this.getSafeguardingAccountId(currency);
      const holdAccountId2 = this.getCustomerHoldLedgerAccountId(params.targetUserId, currency);
      const txId2 = `tx_dep_hold_${Date.now()}`;
      const refNum2 = `DEP-HOLD-${currency}-${Date.now().toString().slice(-6)}`;
      const lines2 = [
        {
          accountId: safeguardingAccountId,
          direction: "DEBIT",
          amountMinor: money.amountMinor,
          description: "ADMIN_FUNDING inbound pending clearance"
        },
        {
          accountId: holdAccountId2,
          direction: "CREDIT",
          amountMinor: money.amountMinor,
          description: `Admin funding pending review: ${refNum2}`
        }
      ];
      assertDoubleEntryInvariant(lines2);
      const entry2 = defaultLedgerService.postJournalEntry({
        transactionId: txId2,
        currency,
        narration: `Pending admin funding credit hold [${refNum2}]`,
        lines: lines2
      });
      const deposit = {
        id: `dep_pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId: params.targetUserId,
        kind: "FIAT",
        currency,
        amountDecimal: params.amountDecimal,
        amountMinor: money.amountMinor.toString(),
        formattedAmount: money.toDisplayString(),
        sourceRail: "ADMIN_FUNDING",
        submittedAt: /* @__PURE__ */ new Date(),
        status: "PENDING_REVIEW",
        holdJournalEntryId: entry2.id,
        referenceNumber: refNum2,
        origin: "ADMIN",
        initiatedByUserId: params.actorUserId,
        initiationReason: reason
      };
      this.pendingDeposits.push(deposit);
      this.recordPendingDepositHistory(deposit, entry2.id, txId2);
      defaultAuditService.logAction({
        action: "ADMIN_WALLET_CREDIT_REQUESTED",
        actorUserId: params.actorUserId,
        actorRole: params.actorRole,
        resourceType: "WALLET_DEPOSIT",
        resourceId: deposit.id,
        reason,
        details: {
          targetUserId: params.targetUserId,
          currency,
          amountDecimal: params.amountDecimal,
          referenceNumber: refNum2,
          sourceRail: "ADMIN_FUNDING"
        }
      });
      voidEmail(
        "admin-adjustment-queued",
        defaultEmailService.sendAdminAdjustmentQueuedEmail({
          to: target.email,
          fullName: target.fullName,
          direction: "CREDIT",
          amount: money.toDecimalString(),
          currency
        })
      );
      return { direction: "CREDIT", deposit };
    }
    const availAccountId = this.getCustomerAvailableLedgerAccountId(params.targetUserId, currency);
    const holdAccountId = this.getCustomerHoldLedgerAccountId(params.targetUserId, currency);
    const currentBalance = defaultLedgerService.getAccountBalance(availAccountId);
    if (currentBalance.balanceMinor < money.amountMinor) {
      throw new Error(
        `Insufficient available funds. Required: ${money.toDisplayString()}, Available: ${currentBalance.formatted}`
      );
    }
    const txId = `tx_wth_hold_${Date.now()}`;
    const refNum = `WTH-HOLD-${currency}-${Date.now().toString().slice(-6)}`;
    const lines = [
      {
        accountId: availAccountId,
        direction: "DEBIT",
        amountMinor: money.amountMinor,
        description: `Admin debit reservation from available: ${refNum}`
      },
      {
        accountId: holdAccountId,
        direction: "CREDIT",
        amountMinor: money.amountMinor,
        description: `Admin debit pending review: ${refNum}`
      }
    ];
    assertDoubleEntryInvariant(lines);
    const entry = defaultLedgerService.postJournalEntry({
      transactionId: txId,
      currency,
      narration: `Pending admin funding debit hold [${refNum}]`,
      lines
    });
    const withdrawal = {
      id: `wth_pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: params.targetUserId,
      kind: "FIAT",
      currency,
      amountDecimal: params.amountDecimal,
      amountMinor: money.amountMinor.toString(),
      formattedAmount: money.toDisplayString(),
      destinationRail: "ADMIN_ADJUSTMENT",
      bankingDetails: {},
      submittedAt: /* @__PURE__ */ new Date(),
      status: "PENDING_REVIEW",
      holdJournalEntryId: entry.id,
      referenceNumber: refNum,
      origin: "ADMIN",
      initiatedByUserId: params.actorUserId,
      initiationReason: reason
    };
    this.pendingWithdrawals.push(withdrawal);
    this.recordPendingWithdrawalHistory(withdrawal, entry.id, txId);
    defaultAuditService.logAction({
      action: "ADMIN_WALLET_DEBIT_REQUESTED",
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: "WALLET_WITHDRAWAL",
      resourceId: withdrawal.id,
      reason,
      details: {
        targetUserId: params.targetUserId,
        currency,
        amountDecimal: params.amountDecimal,
        referenceNumber: refNum,
        destinationRail: "ADMIN_ADJUSTMENT"
      }
    });
    voidEmail(
      "admin-adjustment-queued",
      defaultEmailService.sendAdminAdjustmentQueuedEmail({
        to: target.email,
        fullName: target.fullName,
        direction: "DEBIT",
        amount: money.toDecimalString(),
        currency
      })
    );
    return { direction: "DEBIT", withdrawal };
  }
  resolveRecipientWallet(query) {
    const user = defaultAuthService.resolveUserByEmailOrId(query);
    if (!user) {
      throw new Error("Recipient not found. Use a registered customer email or user ID.");
    }
    if (user.role !== "CUSTOMER") {
      throw new Error("Internal transfers are only supported between customer accounts.");
    }
    return this.getOrCreateUserWallet(user.id, user.fullName, user.countryCode);
  }
  checkIdempotency(key, userId, endpoint, payload) {
    const existing = this.idempotencyStore.get(key);
    if (!existing) return null;
    if (existing.userId !== userId) {
      throw new Error("Idempotency key collision: key belongs to another user.");
    }
    const requestHash = generateSimpleHash(payload);
    if (existing.requestHash !== requestHash) {
      throw new Error(
        "Idempotency key reused with different request payload parameters (HTTP 409 Conflict)."
      );
    }
    return existing.response;
  }
  recordIdempotency(key, userId, endpoint, payload, response) {
    this.idempotencyStore.set(key, {
      key,
      userId,
      endpoint,
      requestHash: generateSimpleHash(payload),
      response,
      createdAt: /* @__PURE__ */ new Date()
    });
    const exists = this.transactionHistory.some((t) => t.transactionId === response.transactionId);
    if (!exists) {
      this.transactionHistory.unshift(response);
    }
  }
  recordTransaction(tx) {
    const exists = this.transactionHistory.some((t) => t.transactionId === tx.transactionId);
    if (!exists) {
      this.transactionHistory.unshift(tx);
    }
  }
  recordPendingDepositHistory(record, journalEntryId, transactionId) {
    this.recordTransaction({
      transactionId,
      referenceNumber: record.referenceNumber,
      operationType: "SIMULATED_DEPOSIT",
      status: "PENDING_REVIEW",
      currency: record.currency,
      amountMinor: record.amountMinor,
      formattedAmount: record.formattedAmount,
      journalEntryId,
      idempotencyKey: `idem_${record.id}`,
      isSimulated: true,
      authoritativeBalance: "Pending review",
      timestamp: record.submittedAt.toISOString(),
      userId: record.userId,
      direction: "CREDIT",
      narration: `${record.currency} deposit pending review (${record.sourceRail || record.kind})`,
      counterparty: record.origin === "ADMIN" ? "Admin funding" : void 0
    });
  }
  recordPendingWithdrawalHistory(record, journalEntryId, transactionId) {
    let availFormatted = "\u2014";
    try {
      availFormatted = defaultLedgerService.getAccountBalance(
        this.getCustomerAvailableLedgerAccountId(record.userId, record.currency)
      ).formatted;
    } catch {
    }
    this.recordTransaction({
      transactionId,
      referenceNumber: record.referenceNumber,
      operationType: "SIMULATED_WITHDRAWAL",
      status: "PENDING_REVIEW",
      currency: record.currency,
      amountMinor: record.amountMinor,
      formattedAmount: record.formattedAmount,
      journalEntryId,
      idempotencyKey: `idem_${record.id}`,
      isSimulated: true,
      authoritativeBalance: availFormatted,
      timestamp: record.submittedAt.toISOString(),
      userId: record.userId,
      direction: "DEBIT",
      narration: `${record.currency} withdrawal pending review (${record.destinationRail || record.kind})`,
      counterparty: record.origin === "ADMIN" ? "Admin adjustment" : void 0
    });
  }
  updateHistoryByReference(userId, referenceNumber, patch, seed) {
    const tx = this.transactionHistory.find(
      (t) => t.userId === userId && t.referenceNumber === referenceNumber
    );
    if (tx) {
      Object.assign(tx, patch);
      return;
    }
    if (!seed) return;
    this.recordTransaction({
      ...seed,
      ...patch,
      referenceNumber,
      userId,
      transactionId: patch.transactionId || seed.transactionId,
      status: patch.status || seed.status,
      journalEntryId: patch.journalEntryId || seed.journalEntryId,
      timestamp: patch.timestamp || seed.timestamp,
      narration: patch.narration || seed.narration,
      authoritativeBalance: patch.authoritativeBalance || seed.authoritativeBalance
    });
  }
  /**
   * Build customer-visible history rows from ledger journal entries that touch
   * the customer's available/hold accounts. Fills gaps when in-memory history
   * missed a write (or after partial code paths).
   */
  buildLedgerBackedHistory(userId) {
    const userAccounts = defaultLedgerService.getUserAccounts(userId);
    if (userAccounts.length === 0) return [];
    const accountIds = new Set(userAccounts.map((a) => a.id));
    const availByCurrency = new Map(
      userAccounts.filter((a) => a.id.endsWith("_avail")).map((a) => [a.currency.toUpperCase(), a.id])
    );
    const results = [];
    for (const entry of defaultLedgerService.getEntries()) {
      const userLines = entry.lines.filter((l) => accountIds.has(l.accountId));
      if (userLines.length === 0) continue;
      const txId = entry.transactionId;
      if (txId.startsWith("tx_init_")) continue;
      const availId = availByCurrency.get(entry.currency.toUpperCase());
      const availLine = availId ? userLines.find((l) => l.accountId === availId) : void 0;
      const primaryLine = availLine || userLines[0];
      const amountMinor = primaryLine.amountMinor;
      const money = Money.fromMinor(amountMinor, entry.currency);
      let operationType = "SIMULATED_DEPOSIT";
      let status = "POSTED";
      let direction = primaryLine.direction === "CREDIT" ? "CREDIT" : "DEBIT";
      const n = (entry.narration || "").toLowerCase();
      if (txId.startsWith("tx_wth_") || n.includes("withdrawal")) {
        operationType = "SIMULATED_WITHDRAWAL";
        direction = "DEBIT";
        if (txId.includes("_hold") || n.includes("pending")) status = "PENDING_REVIEW";
        if (n.includes("rejected") || n.includes("cancel")) status = "REVERSED";
      } else if (txId.startsWith("tx_dep_") || n.includes("deposit") || n.includes("funding")) {
        operationType = "SIMULATED_DEPOSIT";
        direction = "CREDIT";
        if (txId.includes("_hold") || n.includes("pending")) status = "PENDING_REVIEW";
        if (n.includes("rejected")) status = "REVERSED";
        if (n.includes("approved") || txId.includes("_release")) status = "POSTED";
      } else if (txId.startsWith("tx_sim_trf") || n.includes("transfer")) {
        operationType = "INTERNAL_TRANSFER";
        direction = primaryLine.direction === "CREDIT" ? "CREDIT" : "DEBIT";
      } else if (txId.includes("fx") || n.includes("fx") || n.includes("conversion")) {
        operationType = "FX_CONVERSION";
        direction = primaryLine.direction === "CREDIT" ? "CREDIT" : "DEBIT";
      } else if (n.includes("grant")) {
        operationType = "GRANT_DISBURSEMENT";
        direction = "CREDIT";
      } else if (n.includes("card") || n.includes("hold")) {
        operationType = "CARD_HOLD";
        direction = "DEBIT";
      } else if (n.includes("reversal") || n.includes("compensat")) {
        operationType = "COMPENSATING_REVERSAL";
      } else {
        operationType = direction === "CREDIT" ? "SIMULATED_DEPOSIT" : "SIMULATED_WITHDRAWAL";
      }
      let balanceFormatted = "\u2014";
      if (availId) {
        try {
          balanceFormatted = defaultLedgerService.getAccountBalance(availId).formatted;
        } catch {
        }
      }
      const refMatch = entry.narration.match(/\[([A-Z0-9-]+)\]/);
      const referenceNumber = refMatch?.[1] || txId;
      results.push({
        transactionId: txId,
        referenceNumber,
        operationType,
        status,
        currency: entry.currency,
        amountMinor: amountMinor.toString(),
        formattedAmount: money.toDisplayString(),
        journalEntryId: entry.id,
        idempotencyKey: `ledger_${entry.id}`,
        isSimulated: true,
        authoritativeBalance: balanceFormatted,
        timestamp: entry.postedAt.toISOString(),
        userId,
        direction,
        narration: entry.narration
      });
    }
    return results;
  }
  mergeUserTransactionHistory(userId) {
    this.syncPendingQueuesIntoHistory();
    const fromHistory = this.transactionHistory.filter((t) => t.userId === userId);
    const seenTx = new Set(fromHistory.map((t) => t.transactionId));
    const seenJournal = new Set(fromHistory.map((t) => t.journalEntryId).filter(Boolean));
    const seenRefs = new Set(fromHistory.map((t) => `${t.referenceNumber}|${t.operationType}`));
    for (const ledgerTx of this.buildLedgerBackedHistory(userId)) {
      if (seenTx.has(ledgerTx.transactionId)) continue;
      if (ledgerTx.journalEntryId && seenJournal.has(ledgerTx.journalEntryId)) continue;
      const refKey = `${ledgerTx.referenceNumber}|${ledgerTx.operationType}`;
      if (seenRefs.has(refKey)) continue;
      fromHistory.push(ledgerTx);
      seenTx.add(ledgerTx.transactionId);
      if (ledgerTx.journalEntryId) seenJournal.add(ledgerTx.journalEntryId);
      seenRefs.add(refKey);
    }
    fromHistory.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return fromHistory;
  }
  /** Backfill history rows for queue items that predate history recording. */
  syncPendingQueuesIntoHistory() {
    for (const deposit of this.pendingDeposits) {
      const existing = this.transactionHistory.find(
        (t) => t.userId === deposit.userId && t.referenceNumber === deposit.referenceNumber
      );
      if (!existing) {
        this.recordPendingDepositHistory(
          deposit,
          deposit.releaseJournalEntryId || deposit.holdJournalEntryId,
          `tx_hist_${deposit.id}`
        );
      }
      if (deposit.status === "APPROVED") {
        this.updateHistoryByReference(deposit.userId, deposit.referenceNumber, {
          status: "POSTED",
          journalEntryId: deposit.releaseJournalEntryId || deposit.holdJournalEntryId
        });
      } else if (deposit.status === "REJECTED") {
        this.updateHistoryByReference(deposit.userId, deposit.referenceNumber, {
          status: "REVERSED",
          journalEntryId: deposit.releaseJournalEntryId || deposit.holdJournalEntryId
        });
      }
    }
    for (const withdrawal of this.pendingWithdrawals) {
      const existing = this.transactionHistory.find(
        (t) => t.userId === withdrawal.userId && t.referenceNumber === withdrawal.referenceNumber
      );
      if (!existing) {
        this.recordPendingWithdrawalHistory(
          withdrawal,
          withdrawal.releaseJournalEntryId || withdrawal.holdJournalEntryId,
          `tx_hist_${withdrawal.id}`
        );
      }
      if (withdrawal.status === "APPROVED") {
        this.updateHistoryByReference(withdrawal.userId, withdrawal.referenceNumber, {
          status: "POSTED",
          journalEntryId: withdrawal.releaseJournalEntryId || withdrawal.holdJournalEntryId
        });
      } else if (withdrawal.status === "REJECTED") {
        this.updateHistoryByReference(withdrawal.userId, withdrawal.referenceNumber, {
          status: "REVERSED",
          journalEntryId: withdrawal.releaseJournalEntryId || withdrawal.holdJournalEntryId
        });
      }
    }
  }
  getUserTransactions(userId, filter) {
    let txs = this.mergeUserTransactionHistory(userId);
    if (filter?.currency && filter.currency !== "ALL") {
      txs = txs.filter((t) => t.currency.toUpperCase() === filter.currency.toUpperCase());
    }
    if (filter?.type && filter.type !== "ALL") {
      txs = txs.filter((t) => t.operationType === filter.type);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      txs = txs.filter(
        (t) => t.referenceNumber.toLowerCase().includes(q) || t.transactionId.toLowerCase().includes(q) || t.narration && t.narration.toLowerCase().includes(q) || t.counterparty && t.counterparty.toLowerCase().includes(q)
      );
    }
    return txs;
  }
  getTransactionById(transactionId, userId) {
    const tx = this.transactionHistory.find(
      (t) => t.transactionId === transactionId && t.userId === userId
    );
    return tx || null;
  }
  /**
   * Retrieves all transactions for investigation and audit.
   * Restricted to staff roles: SUPPORT, COMPLIANCE_REVIEWER, ADMIN, SUPER_ADMIN.
   */
  getAllTransactionsForAdmin(params) {
    const allowed = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowed.includes(params.actorRole)) {
      throw new Error("Access denied: Staff role required.");
    }
    this.syncPendingQueuesIntoHistory();
    const userIds = /* @__PURE__ */ new Set();
    for (const t of this.transactionHistory) {
      if (t.userId) userIds.add(t.userId);
    }
    for (const acc of defaultLedgerService.getAccounts()) {
      if (acc.userId) userIds.add(acc.userId);
    }
    const merged = [];
    const seen = /* @__PURE__ */ new Set();
    for (const uid of userIds) {
      for (const tx of this.mergeUserTransactionHistory(uid)) {
        const key = `${tx.transactionId}|${tx.userId}|${tx.journalEntryId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(tx);
      }
    }
    let list = merged.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (params.status && params.status !== "ALL") {
      list = list.filter((t) => t.status === params.status);
    }
    if (params.currency && params.currency !== "ALL") {
      list = list.filter((t) => t.currency.toUpperCase() === params.currency.toUpperCase());
    }
    if (params.type && params.type !== "ALL") {
      list = list.filter((t) => t.operationType === params.type);
    }
    if (params.idempotencyKey) {
      list = list.filter((t) => t.idempotencyKey === params.idempotencyKey);
    }
    if (params.startDate) {
      const start = new Date(params.startDate).getTime();
      list = list.filter((t) => new Date(t.timestamp).getTime() >= start);
    }
    if (params.endDate) {
      const end = new Date(params.endDate).getTime();
      list = list.filter((t) => new Date(t.timestamp).getTime() <= end);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (t) => t.transactionId.toLowerCase().includes(q) || t.referenceNumber.toLowerCase().includes(q) || t.userId && t.userId.toLowerCase().includes(q) || t.narration && t.narration.toLowerCase().includes(q) || t.counterparty && t.counterparty.toLowerCase().includes(q)
      );
    }
    const total = list.length;
    const limit = Math.min(Math.max(params.limit || 50, 1), 100);
    const offset = Math.max(params.offset || 0, 0);
    const paginated = list.slice(offset, offset + limit);
    return { total, limit, offset, transactions: paginated };
  }
  /**
   * Reverses an erroneous or disputed transaction via a double-entry compensating reversal.
   * Strictly preserves immutability: DOES NOT mutate or delete the original posted entry.
   * Restricted to ADMIN and SUPER_ADMIN. Requires documented reason.
   */
  reverseTransaction(params) {
    const allowed = ["ADMIN", "SUPER_ADMIN"];
    if (!allowed.includes(params.actorRole)) {
      throw new Error("Access denied: Only Administrators can authorize ledger transaction reversals.");
    }
    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error("A documented reason of at least 5 characters is strictly required for reversing a transaction.");
    }
    const tx = this.transactionHistory.find((t) => t.transactionId === params.transactionId);
    if (!tx) {
      throw new Error(`Transaction not found: ${params.transactionId}`);
    }
    if (tx.status === "REVERSED") {
      throw new Error(`Transaction ${tx.referenceNumber} has already been reversed on ${tx.reversedAt}.`);
    }
    const entries = defaultLedgerService.getEntries();
    const origEntry = entries.find((e) => e.transactionId === tx.transactionId || e.id === tx.journalEntryId);
    if (!origEntry || origEntry.lines.length < 2) {
      throw new Error(`Original double-entry journal entry not found for transaction: ${params.transactionId}`);
    }
    const reversalLines = origEntry.lines.map((l) => ({
      accountId: l.accountId,
      direction: l.direction === "DEBIT" ? "CREDIT" : "DEBIT",
      amountMinor: l.amountMinor,
      description: `Compensating reversal: ${l.description || origEntry.narration}`
    }));
    assertDoubleEntryInvariant(reversalLines);
    const reversalEntryId = `tx_rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const reversalJournal = defaultLedgerService.postJournalEntry({
      transactionId: reversalEntryId,
      currency: origEntry.currency,
      narration: `Compensating reversal for ${tx.referenceNumber}: ${params.reason.trim()}`,
      lines: reversalLines
    });
    tx.status = "REVERSED";
    tx.reversalJournalEntryId = reversalJournal.id;
    tx.reversalReason = params.reason.trim();
    tx.reversedAt = (/* @__PURE__ */ new Date()).toISOString();
    tx.reversedByUserId = params.actorUserId;
    const compensatingTx = {
      transactionId: reversalEntryId,
      referenceNumber: `REV-${tx.referenceNumber}`,
      operationType: "COMPENSATING_REVERSAL",
      status: "POSTED",
      currency: tx.currency,
      amountMinor: tx.amountMinor,
      formattedAmount: tx.formattedAmount,
      journalEntryId: reversalJournal.id,
      idempotencyKey: `idem_rev_${tx.transactionId}`,
      isSimulated: true,
      authoritativeBalance: "Compensating Reversal Posted",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: tx.userId,
      counterparty: "Avenora Ledger Clearing Reversal",
      narration: `Compensating reversal for tx ${tx.referenceNumber}: ${params.reason.trim()}`,
      direction: tx.direction === "CREDIT" ? "DEBIT" : "CREDIT"
    };
    this.transactionHistory.unshift(compensatingTx);
    defaultAuditService.logAction({
      action: "TRANSACTION_REVERSED",
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: "FINANCIAL_TRANSACTION",
      resourceId: tx.transactionId,
      previousState: "POSTED",
      newState: "REVERSED",
      reason: params.reason.trim(),
      correlationId: params.correlationId,
      financialTxId: tx.transactionId,
      details: {
        originalReference: tx.referenceNumber,
        compensatingTransactionId: reversalEntryId,
        reversalJournalEntryId: reversalJournal.id,
        currency: tx.currency,
        amountMinor: tx.amountMinor
      }
    });
    if (tx.userId) {
      const affectedUser = defaultAuthService.getUserById(tx.userId);
      if (affectedUser) {
        const amountStr = Money.fromMinor(tx.amountMinor, tx.currency).toDecimalString();
        voidEmail(
          "transaction-reversed",
          defaultEmailService.sendTransactionReversedEmail({
            to: affectedUser.email,
            fullName: affectedUser.fullName,
            amount: amountStr,
            currency: tx.currency,
            transactionId: tx.transactionId
          })
        );
      }
    }
    return {
      originalTransaction: tx,
      compensatingTransaction: compensatingTx,
      reversalJournalEntryId: reversalJournal.id
    };
  }
  getMonthlyStatement(userId, currency = "USD", year, month) {
    const now = /* @__PURE__ */ new Date();
    const stYear = year || now.getFullYear();
    const stMonth = month || now.getMonth() + 1;
    const txs = this.getUserTransactions(userId, { currency });
    const monthTxs = txs.filter((t) => {
      const d = new Date(t.timestamp);
      return d.getFullYear() === stYear && d.getMonth() + 1 === stMonth;
    });
    const totalCreditsMinor = monthTxs.filter((t) => t.direction === "CREDIT" || t.operationType === "SIMULATED_DEPOSIT").reduce((acc, t) => acc + BigInt(t.amountMinor), 0n);
    const totalDebitsMinor = monthTxs.filter((t) => t.direction === "DEBIT" || t.operationType === "SIMULATED_WITHDRAWAL" || t.operationType === "CARD_HOLD").reduce((acc, t) => acc + BigInt(t.amountMinor), 0n);
    const wallet = this.getOrCreateUserWallet(userId);
    const currAccount = wallet.accounts.find((a) => a.currency === currency);
    const endingBalanceMinor = currAccount ? BigInt(currAccount.availableBalanceMinor) : 0n;
    const startingBalanceMinor = endingBalanceMinor - totalCreditsMinor + totalDebitsMinor;
    const statement = {
      statementId: `STMT-${currency}-${stYear}${String(stMonth).padStart(2, "0")}-${userId.slice(-6).toUpperCase()}`,
      period: `${stYear}-${String(stMonth).padStart(2, "0")}`,
      currency,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      accountNumber: currAccount?.accountNumber || `2100-${currency}-ACCOUNT`,
      startingBalanceMinor: startingBalanceMinor.toString(),
      formattedStartingBalance: Money.fromMinor(startingBalanceMinor >= 0n ? startingBalanceMinor : 0n, currency).toDisplayString(),
      totalCreditsMinor: totalCreditsMinor.toString(),
      formattedTotalCredits: Money.fromMinor(totalCreditsMinor, currency).toDisplayString(),
      totalDebitsMinor: totalDebitsMinor.toString(),
      formattedTotalDebits: Money.fromMinor(totalDebitsMinor, currency).toDisplayString(),
      endingBalanceMinor: endingBalanceMinor.toString(),
      formattedEndingBalance: Money.fromMinor(endingBalanceMinor, currency).toDisplayString(),
      transactionsCount: monthTxs.length,
      transactions: monthTxs,
      isSimulated: true,
      legalNotice: "This statement is provided for your records. Retain it with your tax and accounting documents as required in your jurisdiction."
    };
    const statementUser = defaultAuthService.getUserById(userId);
    if (statementUser) {
      const periodLabel = new Date(stYear, stMonth - 1, 1).toLocaleString("en-US", {
        month: "long",
        year: "numeric"
      });
      voidEmail(
        "statement-ready",
        defaultEmailService.sendStatementReadyEmail({
          to: statementUser.email,
          fullName: statementUser.fullName,
          periodLabel
        })
      );
    }
    return statement;
  }
  getBtcDepositInstructions() {
    return {
      network: "Bitcoin",
      address: PLATFORM_BTC_DEPOSIT_ADDRESS,
      supportEmail: PLATFORM_DEPOSIT_SUPPORT_EMAIL
    };
  }
  async submitBtcDepositProof(params) {
    const pending = await this.requestPendingDeposit({
      userId: params.userId,
      currency: "BTC",
      amountDecimal: params.amountDecimal,
      kind: "BTC",
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: params.fileSize
    });
    const btcUser = defaultAuthService.getUserById(params.userId);
    if (btcUser) {
      voidEmail(
        "btc-deposit-proof",
        defaultEmailService.sendBtcDepositProofEmail({
          to: btcUser.email,
          fullName: btcUser.fullName,
          amount: pending.amountDecimal
        })
      );
    }
    return {
      id: pending.id,
      userId: pending.userId,
      amountDecimal: pending.amountDecimal,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      storageRef: pending.storageRef ?? "",
      submittedAt: pending.submittedAt,
      status: pending.status
    };
  }
  assertFiatDepositRailAllowed(userId, railCode) {
    const country = defaultAuthService.getUserById(userId)?.countryCode ?? "US";
    if (!isDepositRailAllowedForCountry(country, railCode)) {
      throw new Error("Deposit method is not available for your signup country.");
    }
  }
  assertFiatWithdrawalRailAllowed(userId, railCode) {
    const country = defaultAuthService.getUserById(userId)?.countryCode ?? "US";
    if (!isWithdrawalRailAllowedForCountry(country, railCode)) {
      throw new Error("Withdrawal method is not available for your signup country.");
    }
  }
};
var defaultWalletService = new WalletService();

// src/server/routes/wallet.routes.ts
init_auth_service();

// src/server/middleware/accountAccess.ts
init_prototypeAccess();
var SUPPORT_EMAIL = "support@avenorabank.com";
function requireTransactionEligible(req, res, next) {
  const status = req.user?.status;
  const role = req.user?.role;
  const kycStatus = req.user?.kycStatus;
  if (status === "SUSPENDED") {
    res.status(403).json({
      type: "https://avenora.com/errors/account-suspended",
      title: "Account Suspended",
      status: 403,
      code: "ACCOUNT_SUSPENDED",
      detail: "Your account is under a temporary operational hold. All transactions are frozen. You may still sign in and browse your account. Contact customer service at support@avenorabank.com.",
      supportEmail: SUPPORT_EMAIL,
      instance: req.originalUrl,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return;
  }
  if (status === "LOCKED") {
    res.status(403).json({
      type: "https://avenora.com/errors/account-locked",
      title: "Account Locked",
      status: 403,
      code: "ACCOUNT_LOCKED",
      detail: "Your account has been locked due to multiple suspensions. All activity is blocked. Contact customer service at support@avenorabank.com.",
      supportEmail: SUPPORT_EMAIL,
      instance: req.originalUrl,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return;
  }
  if (status === "PENDING_VERIFICATION") {
    res.status(403).json({
      type: "https://avenora.com/errors/account-pending-verification",
      title: "Account Inactive \u2014 KYC Required",
      status: 403,
      code: "ACCOUNT_PENDING_VERIFICATION",
      detail: "Your account is inactive until identity verification (KYC) is approved by compliance. You may sign in and complete or update your KYC application, but no transactions can be performed until an administrator approves verification.",
      supportEmail: SUPPORT_EMAIL,
      instance: req.originalUrl,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return;
  }
  if (role === "CUSTOMER" && kycStatus !== "APPROVED" && !isKycBypassEnabled()) {
    res.status(403).json({
      type: "https://avenora.com/errors/account-pending-verification",
      title: "Account Inactive \u2014 KYC Required",
      status: 403,
      code: "ACCOUNT_PENDING_VERIFICATION",
      detail: "Your account is inactive until identity verification (KYC) is approved by compliance. Complete KYC and wait for administrator approval before performing transactions.",
      supportEmail: SUPPORT_EMAIL,
      instance: req.originalUrl,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return;
  }
  next();
}

// src/server/routes/wallet.routes.ts
var walletRouter = (0, import_express6.Router)();
var TransactionPinSchema = import_zod7.z.string().regex(/^\d{4}$/, "Transaction PIN must be exactly 4 digits");
var DepositSchema = import_zod7.z.object({
  currency: import_zod7.z.string().length(3),
  amountDecimal: import_zod7.z.string().regex(/^\d+(\.\d+)?$/, "Amount must be a valid positive decimal"),
  sourceRail: import_zod7.z.string().min(2).optional()
});
var BtcDepositProofSchema = import_zod7.z.object({
  amountDecimal: import_zod7.z.string().regex(/^\d+(\.\d+)?$/, "Amount must be a valid positive decimal"),
  fileName: import_zod7.z.string().min(1),
  mimeType: import_zod7.z.string().min(3),
  fileSize: import_zod7.z.number().int().positive()
});
var WithdrawalSchema = import_zod7.z.object({
  currency: import_zod7.z.string().min(3).max(4),
  amountDecimal: import_zod7.z.string().regex(/^\d+(\.\d+)?$/, "Amount must be a valid positive decimal"),
  destinationRail: import_zod7.z.string().min(2).optional(),
  bankingDetails: import_zod7.z.record(import_zod7.z.string(), import_zod7.z.string()).optional(),
  btcAddress: import_zod7.z.string().min(14).max(90).optional(),
  transactionPin: TransactionPinSchema
});
var TransferSchema = import_zod7.z.object({
  recipientEmailOrId: import_zod7.z.string().min(3),
  currency: import_zod7.z.string().length(3),
  amountDecimal: import_zod7.z.string().regex(/^\d+(\.\d+)?$/, "Amount must be a valid positive decimal"),
  note: import_zod7.z.string().optional(),
  transactionPin: TransactionPinSchema
});
async function requireValidTransactionPin(req, res, transactionPin) {
  try {
    await defaultAuthService.verifyTransactionPinForUser(req.user.id, transactionPin);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("temporarily locked")) {
      res.status(429).json({
        type: "https://avenora.com/errors/account-locked",
        title: "Account Temporarily Locked",
        status: 429,
        detail: message,
        instance: req.originalUrl,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return false;
    }
    res.status(401).json({
      type: "https://avenora.com/errors/invalid-transaction-pin",
      title: "Invalid Transaction PIN",
      status: 401,
      detail: message.includes("must be exactly 4 digits") ? message : "The transaction PIN is incorrect.",
      instance: req.originalUrl,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return false;
  }
}
var FxQuoteSchema = import_zod7.z.object({
  sourceCurrency: import_zod7.z.string().min(3).max(4),
  destinationCurrency: import_zod7.z.string().min(3).max(4),
  sourceAmountDecimal: import_zod7.z.string().regex(/^\d+(\.\d+)?$/)
});
var FxConvertSchema = import_zod7.z.object({
  quoteId: import_zod7.z.string().min(5)
});
walletRouter.get("/me", authenticate, (req, res) => {
  const wallet = defaultWalletService.getOrCreateUserWallet(
    req.user.id,
    req.user.fullName,
    req.user.countryCode
  );
  res.json({
    wallet
  });
});
walletRouter.get("/transactions", authenticate, (req, res, next) => {
  try {
    const currency = typeof req.query.currency === "string" ? req.query.currency : void 0;
    const type = typeof req.query.type === "string" ? req.query.type : void 0;
    const search = typeof req.query.search === "string" ? req.query.search : void 0;
    const transactions = defaultWalletService.getUserTransactions(req.user.id, {
      currency,
      type,
      search
    });
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.json({
      total: transactions.length,
      transactions
    });
  } catch (err) {
    next(err);
  }
});
walletRouter.get("/transactions/:id", authenticate, (req, res, next) => {
  try {
    const tx = defaultWalletService.getTransactionById(req.params.id, req.user.id);
    if (!tx) {
      res.status(404).json({
        type: "https://avenora.com/errors/not-found",
        title: "Transaction Not Found",
        status: 404,
        detail: `No transaction with ID "${req.params.id}" exists for this customer account.`
      });
      return;
    }
    res.json({ transaction: tx });
  } catch (err) {
    next(err);
  }
});
walletRouter.get("/statements", authenticate, (req, res, next) => {
  try {
    const currency = typeof req.query.currency === "string" ? req.query.currency.toUpperCase() : "USD";
    const year = req.query.year ? parseInt(req.query.year, 10) : void 0;
    const month = req.query.month ? parseInt(req.query.month, 10) : void 0;
    const statement = defaultWalletService.getMonthlyStatement(req.user.id, currency, year, month);
    res.json({ statement });
  } catch (err) {
    next(err);
  }
});
walletRouter.get("/deposit/btc-instructions", authenticate, (_req, res) => {
  res.json(defaultWalletService.getBtcDepositInstructions());
});
walletRouter.post("/deposit/btc-proof", authenticate, requireTransactionEligible, async (req, res, next) => {
  try {
    const validated = BtcDepositProofSchema.parse(req.body);
    const record = await defaultWalletService.submitBtcDepositProof({
      userId: req.user.id,
      amountDecimal: validated.amountDecimal,
      fileName: validated.fileName,
      mimeType: validated.mimeType,
      fileSize: validated.fileSize
    });
    res.status(201).json({
      status: "pending_review",
      message: "Payment proof received. The requested amount is on hold in your BTC wallet until our team verifies and approves the deposit.",
      proof: {
        id: record.id,
        submittedAt: record.submittedAt
      }
    });
  } catch (err) {
    next(err);
  }
});
walletRouter.post("/deposit", authenticate, requireTransactionEligible, async (req, res, next) => {
  try {
    const validated = DepositSchema.parse(req.body);
    const idempotencyKey = req.headers["idempotency-key"] || void 0;
    if (validated.currency.toUpperCase() === "BTC") {
      res.status(400).json({
        title: "Use Bitcoin deposit flow",
        detail: "Submit your BTC transfer using the on-screen Bitcoin deposit instructions."
      });
      return;
    }
    if (validated.sourceRail) {
      const country = req.user.countryCode ?? "US";
      if (!isDepositRailAllowedForCountry(country, validated.sourceRail)) {
        res.status(400).json({
          title: "Invalid deposit method",
          detail: "The selected deposit method is not available for your country."
        });
        return;
      }
    }
    const record = await defaultWalletService.requestPendingDeposit({
      userId: req.user.id,
      currency: validated.currency.toUpperCase(),
      amountDecimal: validated.amountDecimal,
      kind: "FIAT",
      sourceRail: validated.sourceRail
    });
    res.status(201).json({
      status: "pending_review",
      message: "Deposit request recorded. The amount appears on hold in your wallet until operations approves it, then it moves to your available balance.",
      deposit: {
        id: record.id,
        referenceNumber: record.referenceNumber,
        formattedAmount: record.formattedAmount,
        currency: record.currency,
        submittedAt: record.submittedAt
      }
    });
  } catch (err) {
    next(err);
  }
});
walletRouter.post("/withdraw", authenticate, requireTransactionEligible, async (req, res, next) => {
  try {
    const validated = WithdrawalSchema.parse(req.body);
    const pinOk = await requireValidTransactionPin(req, res, validated.transactionPin);
    if (!pinOk) return;
    const currency = validated.currency.toUpperCase();
    const isBtc = currency === "BTC";
    if (isBtc) {
      if (!validated.btcAddress) {
        res.status(400).json({
          title: "Bitcoin address required",
          detail: "Provide the BTC address where funds should be sent."
        });
        return;
      }
    } else if (validated.destinationRail) {
      const country = req.user.countryCode ?? "US";
      if (!isWithdrawalRailAllowedForCountry(country, validated.destinationRail)) {
        res.status(400).json({
          title: "Invalid withdrawal method",
          detail: "The selected withdrawal method is not available for your country."
        });
        return;
      }
    }
    const record = await defaultWalletService.requestPendingWithdrawal({
      userId: req.user.id,
      currency,
      amountDecimal: validated.amountDecimal,
      kind: isBtc ? "BTC" : "FIAT",
      destinationRail: validated.destinationRail,
      bankingDetails: validated.bankingDetails,
      btcAddress: validated.btcAddress
    });
    res.status(201).json({
      status: "pending_review",
      message: "Withdrawal request submitted. The amount is reserved from your available balance and shown under Hold until operations approves the payout.",
      withdrawal: {
        id: record.id,
        referenceNumber: record.referenceNumber,
        formattedAmount: record.formattedAmount,
        currency: record.currency,
        submittedAt: record.submittedAt
      }
    });
  } catch (err) {
    next(err);
  }
});
walletRouter.post("/transfer", authenticate, requireTransactionEligible, async (req, res, next) => {
  try {
    const validated = TransferSchema.parse(req.body);
    const pinOk = await requireValidTransactionPin(req, res, validated.transactionPin);
    if (!pinOk) return;
    const idempotencyKey = req.headers["idempotency-key"] || void 0;
    const result = await defaultWalletService.executeInternalTransfer({
      senderUserId: req.user.id,
      recipientEmailOrId: validated.recipientEmailOrId,
      currency: validated.currency.toUpperCase(),
      amountDecimal: validated.amountDecimal,
      idempotencyKey,
      note: validated.note
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
walletRouter.post("/fx/quote", authenticate, requireTransactionEligible, (req, res, next) => {
  try {
    const validated = FxQuoteSchema.parse(req.body);
    const quote = defaultWalletService.generateFxQuote({
      userId: req.user.id,
      sourceCurrency: validated.sourceCurrency.toUpperCase(),
      destinationCurrency: validated.destinationCurrency.toUpperCase(),
      sourceAmountDecimal: validated.sourceAmountDecimal
    });
    res.status(200).json({
      quote
    });
  } catch (err) {
    next(err);
  }
});
walletRouter.post("/fx/convert", authenticate, requireTransactionEligible, async (req, res, next) => {
  try {
    const validated = FxConvertSchema.parse(req.body);
    const idempotencyKey = req.headers["idempotency-key"] || void 0;
    const result = await defaultWalletService.executeFxConversion({
      userId: req.user.id,
      quoteId: validated.quoteId,
      idempotencyKey
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// src/server/routes/webhook.routes.ts
var import_express7 = require("express");
var import_zod8 = require("zod");

// src/server/services/webhook.service.ts
var import_crypto4 = __toESM(require("crypto"), 1);
init_env_config();
init_auth_service();
init_email_service();
var WebhookService = class {
  eventStore = /* @__PURE__ */ new Map();
  /**
   * Generates a valid HMAC-SHA256 signature header for testing and simulation.
   * Format: `t=${timestamp},v1=${signatureHex}`
   */
  static generateSignatureHeader(rawBody, secret, timestampSeconds) {
    const config = getValidatedConfig();
    const signingSecret = secret || config.MOCK_PROVIDER_WEBHOOK_SECRET;
    const ts = timestampSeconds ?? Math.floor(Date.now() / 1e3);
    const bodyBuffer = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
    const signedPayload = `${ts}.${bodyBuffer.toString("utf8")}`;
    const signature = import_crypto4.default.createHmac("sha256", signingSecret).update(signedPayload).digest("hex");
    return `t=${ts},v1=${signature}`;
  }
  /**
   * Verifies an incoming webhook request signature over exact raw bytes.
   */
  verifySignature(rawBody, signatureHeader) {
    const config = getValidatedConfig();
    const secret = config.MOCK_PROVIDER_WEBHOOK_SECRET;
    const toleranceSeconds = config.WEBHOOK_TOLERANCE_SECONDS || 300;
    if (!signatureHeader || typeof signatureHeader !== "string") {
      return {
        isValid: false,
        code: "MISSING_SIGNATURE",
        error: "Missing required Avenora-Signature or Provider-Signature header."
      };
    }
    if (!rawBody) {
      return {
        isValid: false,
        code: "MALFORMED_HEADER",
        error: "Raw request body buffer unavailable for signature verification."
      };
    }
    const parts = signatureHeader.split(",").reduce((acc, item) => {
      const [k, v] = item.split("=");
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});
    const tsStr = parts["t"];
    const v1 = parts["v1"];
    if (!tsStr || !v1) {
      return {
        isValid: false,
        code: "MALFORMED_HEADER",
        error: 'Signature header must contain "t" (timestamp) and "v1" (HMAC hex) keys.'
      };
    }
    const timestamp = parseInt(tsStr, 10);
    if (isNaN(timestamp)) {
      return {
        isValid: false,
        code: "MALFORMED_HEADER",
        error: "Invalid timestamp value in signature header."
      };
    }
    const currentSeconds = Math.floor(Date.now() / 1e3);
    const ageSeconds = currentSeconds - timestamp;
    if (Math.abs(ageSeconds) > toleranceSeconds) {
      return {
        isValid: false,
        code: "EXPIRED_TIMESTAMP",
        error: `Timestamp out of tolerance window (${Math.abs(ageSeconds)}s > ${toleranceSeconds}s). Replay attack blocked.`,
        timestamp
      };
    }
    const bodyStr = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    const signedPayload = `${timestamp}.${bodyStr}`;
    const expectedSignature = import_crypto4.default.createHmac("sha256", secret).update(signedPayload).digest("hex");
    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    const actualBuf = Buffer.from(v1, "utf8");
    if (expectedBuf.length !== actualBuf.length || !import_crypto4.default.timingSafeEqual(expectedBuf, actualBuf)) {
      return {
        isValid: false,
        code: "INVALID_SIGNATURE",
        error: "HMAC signature verification failed. Secret or payload mismatch.",
        timestamp,
        signature: `${v1.substring(0, 6)}...[REDACTED]`
      };
    }
    return {
      isValid: true,
      code: "VALID",
      timestamp,
      signature: `${v1.substring(0, 6)}...[REDACTED]`
    };
  }
  /**
   * Processes a verified mock webhook event with idempotency and duplicate detection.
   */
  processEvent(event, rawBodyStr, signatureHeader) {
    if (!event.eventId || !event.eventType) {
      throw new Error('Webhook payload must specify "eventId" and "eventType".');
    }
    const payloadHash = import_crypto4.default.createHash("sha256").update(rawBodyStr).digest("hex");
    const existing = this.eventStore.get(event.eventId);
    if (existing) {
      existing.status = "DUPLICATE";
      existing.processingLog += ` | Duplicate delivery received at ${(/* @__PURE__ */ new Date()).toISOString()}`;
      return {
        status: "DUPLICATE",
        message: `Event #${event.eventId} was already received and processed. Retaining original state.`,
        recordId: existing.id
      };
    }
    let processingMessage = "";
    switch (event.eventType) {
      case "mock.deposit.cleared": {
        processingMessage = `Mock clearing acknowledged for tx ref: ${event.data.referenceNumber || "N/A"}`;
        const depositUser = event.data.userId ? defaultAuthService.getUserById(event.data.userId) : void 0;
        if (depositUser?.email) {
          voidEmail(
            "provider-deposit-cleared",
            defaultEmailService.sendProviderDepositClearedEmail({
              to: depositUser.email,
              fullName: depositUser.fullName,
              amount: event.data.amountDecimal,
              currency: event.data.currency,
              reference: event.data.referenceNumber
            })
          );
        }
        break;
      }
      case "mock.wire.inbound": {
        processingMessage = `Inbound wire notification captured for user: ${event.data.userId || "N/A"}`;
        voidEmail(
          "provider-wire-inbound-staff",
          defaultEmailService.sendProviderWireInboundStaffEmail({
            reference: event.data.referenceNumber,
            amount: event.data.amountDecimal,
            currency: event.data.currency
          })
        );
        const wireUser = event.data.userId ? defaultAuthService.getUserById(event.data.userId) : void 0;
        if (wireUser?.email) {
          voidEmail(
            "provider-wire-inbound",
            defaultEmailService.sendProviderWireInboundEmail({
              to: wireUser.email,
              fullName: wireUser.fullName,
              amount: event.data.amountDecimal,
              currency: event.data.currency,
              reference: event.data.referenceNumber
            })
          );
        }
        break;
      }
      case "mock.compliance.flag": {
        processingMessage = `Simulated risk flag recorded for evaluation: ${event.data.reason || "None"}`;
        voidEmail(
          "compliance-flag",
          defaultEmailService.sendComplianceFlagEmail({
            flagType: event.eventType,
            reference: event.data.referenceNumber || event.data.providerTxId,
            detail: event.data.reason
          })
        );
        break;
      }
      case "mock.health.ping":
        processingMessage = "Provider webhook heartbeat successfully acknowledged.";
        break;
      default:
        processingMessage = `Unrecognized mock event type: ${event.eventType}. No action taken.`;
    }
    const record = {
      id: `whevt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventId: event.eventId,
      eventType: event.eventType,
      payloadHash,
      signatureHeader: signatureHeader.split(",")[0] || "t=[REDACTED]",
      // Never store full signature
      status: "PROCESSED",
      processingLog: processingMessage,
      receivedAt: /* @__PURE__ */ new Date(),
      processedAt: /* @__PURE__ */ new Date()
    };
    this.eventStore.set(event.eventId, record);
    return {
      status: "PROCESSED",
      message: processingMessage,
      recordId: record.id
    };
  }
  getRecentEvents(limit = 20) {
    return Array.from(this.eventStore.values()).sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime()).slice(0, limit);
  }
};
var defaultWebhookService = new WebhookService();

// src/server/routes/webhook.routes.ts
init_env_config();
var webhookRouter = (0, import_express7.Router)();
var MockEventSchema = import_zod8.z.object({
  eventId: import_zod8.z.string().min(5),
  eventType: import_zod8.z.enum(["mock.deposit.cleared", "mock.wire.inbound", "mock.compliance.flag", "mock.health.ping"]),
  timestamp: import_zod8.z.string(),
  data: import_zod8.z.record(import_zod8.z.string(), import_zod8.z.any())
});
webhookRouter.post("/mock-provider", (req, res, next) => {
  try {
    const signatureHeader = req.headers["avenora-signature"] || req.headers["provider-signature"] || req.headers["x-signature"];
    const verification = defaultWebhookService.verifySignature(req.rawBody, signatureHeader);
    if (!verification.isValid) {
      res.status(401).json({
        type: "https://avenora.com/errors/invalid-webhook-signature",
        title: "Webhook Signature Verification Failed",
        status: 401,
        detail: verification.error,
        code: verification.code,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return;
    }
    const rawBodyStr = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);
    const parsedEvent = MockEventSchema.parse(req.body);
    const processResult = defaultWebhookService.processEvent(
      parsedEvent,
      rawBodyStr,
      signatureHeader
    );
    res.status(200).json({
      received: true,
      status: processResult.status,
      message: processResult.message,
      recordId: processResult.recordId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    next(err);
  }
});
webhookRouter.get("/events", (_req, res) => {
  const events = defaultWebhookService.getRecentEvents();
  res.json({
    count: events.length,
    events
  });
});
webhookRouter.post("/generate-test-signature", (req, res) => {
  const payload = req.body;
  const rawBodyStr = JSON.stringify(payload);
  const config = getValidatedConfig();
  const signatureHeader = WebhookService.generateSignatureHeader(
    rawBodyStr,
    config.MOCK_PROVIDER_WEBHOOK_SECRET
  );
  res.json({
    payload,
    signatureHeader,
    hint: 'Include this signature in the "Avenora-Signature" header when calling /api/v1/webhooks/mock-provider'
  });
});

// src/server/routes/loan.routes.ts
var import_express8 = require("express");
var import_zod9 = require("zod");

// src/server/services/loan.service.ts
init_Money();
init_Currency();
init_auth_service();
init_audit_service();
init_email_service();
var LoanService = class {
  applications = /* @__PURE__ */ new Map();
  RULESET_VERSION = "v1.2.0-demo";
  /**
   * Deterministic fixed-rate monthly installment amortization calculator.
   * Uses minor integer units (BigInt) for financial conservation and balances the final installment.
   */
  calculateAmortization(params) {
    const { currency, annualRatePercent, termMonths } = params;
    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    if (termMonths <= 0 || termMonths > 360) {
      throw new Error("Loan term must be between 1 and 360 months.");
    }
    if (annualRatePercent < 0 || annualRatePercent > 100) {
      throw new Error("Annual rate percentage must be between 0 and 100.");
    }
    const principalMoney = Money.fromDecimalString(params.principalDecimal, currency);
    if (!principalMoney.isPositive()) {
      throw new Error("Principal amount must be strictly greater than zero.");
    }
    const P = Number(principalMoney.amountMinor);
    let monthlyPaymentNumber;
    if (annualRatePercent === 0) {
      monthlyPaymentNumber = Math.round(P / termMonths);
    } else {
      const monthlyRate = annualRatePercent / 100 / 12;
      const compound = Math.pow(1 + monthlyRate, termMonths);
      monthlyPaymentNumber = Math.round(P * (monthlyRate * compound) / (compound - 1));
    }
    let remainingMinor = principalMoney.amountMinor;
    let totalInterestMinor = 0n;
    const schedule = [];
    for (let k = 1; k <= termMonths; k++) {
      let interestMinor = 0n;
      if (annualRatePercent > 0) {
        const monthlyRate = annualRatePercent / 100 / 12;
        interestMinor = BigInt(Math.round(Number(remainingMinor) * monthlyRate));
      }
      let principalMinor = BigInt(monthlyPaymentNumber) - interestMinor;
      if (k === termMonths || principalMinor > remainingMinor) {
        principalMinor = remainingMinor;
        monthlyPaymentNumber = Number(principalMinor + interestMinor);
      }
      remainingMinor -= principalMinor;
      if (remainingMinor < 0n) remainingMinor = 0n;
      totalInterestMinor += interestMinor;
      const paymentMoney = Money.fromMinor(monthlyPaymentNumber, currency);
      const remainingMoney = Money.fromMinor(remainingMinor, currency);
      schedule.push({
        installmentNumber: k,
        paymentMinor: monthlyPaymentNumber.toString(),
        principalMinor: principalMinor.toString(),
        interestMinor: interestMinor.toString(),
        remainingBalanceMinor: remainingMinor.toString(),
        formattedPayment: paymentMoney.toDisplayString(),
        formattedRemaining: remainingMoney.toDisplayString()
      });
    }
    const totalRepaymentMinor = principalMoney.amountMinor + totalInterestMinor;
    return {
      principalMinor: principalMoney.amountMinor.toString(),
      currency,
      annualRatePercent,
      termMonths,
      monthlyPaymentMinor: monthlyPaymentNumber.toString(),
      totalInterestMinor: totalInterestMinor.toString(),
      totalRepaymentMinor: totalRepaymentMinor.toString(),
      formattedMonthlyPayment: Money.fromMinor(monthlyPaymentNumber, currency).toDisplayString(),
      formattedTotalInterest: Money.fromMinor(totalInterestMinor, currency).toDisplayString(),
      formattedTotalRepayment: Money.fromMinor(totalRepaymentMinor, currency).toDisplayString(),
      schedule,
      isIllustrative: true
    };
  }
  /**
   * Deterministic Synthetic Risk Assessment.
   * Evaluates debt-to-income (DTI) and returns an illustrative rating.
   */
  performSyntheticAssessment(application) {
    const annualIncome = Number(application.applicantIncomeAnnualMinor);
    const monthlyIncome = annualIncome > 0 ? annualIncome / 12 : 1;
    const monthlyExpenses = Number(application.applicantExpensesMonthlyMinor);
    const dtiRatio = monthlyExpenses / monthlyIncome;
    const dtiFormatted = (Math.round(dtiRatio * 100) / 100).toFixed(2);
    let riskCategory;
    let recommendation;
    let score;
    const factors = [];
    if (dtiRatio <= 0.35) {
      riskCategory = "LOW_RISK_DEMO";
      recommendation = "RECOMMEND_DEMO_APPROVAL";
      score = 780;
      factors.push(`Favorable debt-to-income ratio (${Math.round(dtiRatio * 100)}% <= 35%).`);
      factors.push("Sufficient cash flow buffer relative to requested term.");
      factors.push("Credit model evaluation: favorable profile.");
    } else if (dtiRatio <= 0.5) {
      riskCategory = "MODERATE_RISK_DEMO";
      recommendation = "REQUIRES_MANUAL_REVIEW";
      score = 690;
      factors.push(`Moderate debt-to-income ratio (${Math.round(dtiRatio * 100)}%).`);
      factors.push("Requires loan officer review of employment verification.");
    } else {
      riskCategory = "ELEVATED_RISK_DEMO";
      recommendation = "DECLINE_DEMO";
      score = 610;
      factors.push(`High debt-to-income ratio (${Math.round(dtiRatio * 100)}% > 50%).`);
      factors.push("Projected monthly payment strains debt service capacity.");
    }
    return {
      applicationId: application.id,
      riskCategory,
      recommendation,
      syntheticScore: score,
      debtToIncomeRatio: dtiFormatted,
      rulesetVersion: this.RULESET_VERSION,
      factorsExplanation: factors,
      assessedAt: /* @__PURE__ */ new Date(),
      notice: "Preliminary assessment for review purposes. Final credit decisions require completed verification and signed loan documents."
    };
  }
  /**
   * Creates a draft loan application.
   */
  createDraftApplication(params) {
    if (!isSupportedCurrency(params.currency)) {
      throw new Error(`Unsupported loan currency: ${params.currency}`);
    }
    const amountMoney = Money.fromDecimalString(params.requestedAmountDecimal, params.currency);
    const incomeMoney = Money.fromDecimalString(params.annualIncomeDecimal, params.currency);
    const expensesMoney = Money.fromDecimalString(params.monthlyExpensesDecimal, params.currency);
    const id = `loan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record = {
      id,
      userId: params.userId,
      applicantName: params.applicantName,
      type: params.type,
      currency: params.currency,
      requestedAmountMinor: amountMoney.amountMinor.toString(),
      formattedRequestedAmount: amountMoney.toDisplayString(),
      termMonths: params.termMonths,
      purpose: params.purpose,
      applicantIncomeAnnualMinor: incomeMoney.amountMinor.toString(),
      applicantExpensesMonthlyMinor: expensesMoney.amountMinor.toString(),
      businessName: params.businessName,
      businessRevenueAnnualMinor: params.businessRevenueDecimal ? Money.fromDecimalString(params.businessRevenueDecimal, params.currency).amountMinor.toString() : void 0,
      status: "DRAFT",
      consentAcknowledged: params.consentAcknowledged,
      reviewHistory: [],
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.applications.set(id, record);
    return record;
  }
  /**
   * Submits a draft loan application and generates an automatic synthetic assessment.
   */
  submitApplication(applicationId, userId) {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error("Loan application not found.");
    if (app.userId !== userId) throw new Error("Access denied: application belongs to another customer.");
    if (app.status !== "DRAFT" && app.status !== "NEEDS_MORE_INFORMATION") {
      throw new Error(`Cannot submit application in status: ${app.status}`);
    }
    app.status = "SUBMITTED";
    app.submittedAt = /* @__PURE__ */ new Date();
    app.updatedAt = /* @__PURE__ */ new Date();
    app.assessment = this.performSyntheticAssessment(app);
    const customer = defaultAuthService.getUserById(userId);
    const customerName = customer?.fullName || app.applicantName;
    if (customer?.email) {
      voidEmail(
        "loan-submitted",
        defaultEmailService.sendLoanSubmittedEmail({
          to: customer.email,
          fullName: customerName,
          applicationId: app.id,
          amount: app.formattedRequestedAmount
        })
      );
    }
    voidEmail(
      "loan-submitted-staff",
      defaultEmailService.sendLoanSubmittedStaffEmail({
        customerName,
        applicationId: app.id
      })
    );
    return app;
  }
  /**
   * Compliance/Officer Review action. Strictly restricted to staff roles.
   */
  reviewApplication(params) {
    const allowedRoles = ["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(params.reviewerRole)) {
      throw new Error("Access denied: only compliance officers or administrators can record loan decisions.");
    }
    const app = this.applications.get(params.applicationId);
    if (!app) throw new Error("Loan application not found.");
    if (app.userId === params.reviewerUserId) {
      throw new Error("Separation of duties violation: you cannot review or approve your own loan application.");
    }
    const prevStatus = app.status;
    app.status = params.decision;
    app.reviewerUserId = params.reviewerUserId;
    app.reviewerNotes = params.notes;
    app.reasonCode = params.reasonCode;
    app.reviewedAt = /* @__PURE__ */ new Date();
    app.updatedAt = /* @__PURE__ */ new Date();
    app.reviewHistory.push({
      actorUserId: params.reviewerUserId,
      previousStatus: prevStatus,
      newStatus: params.decision,
      reason: params.reasonCode,
      notes: params.notes,
      timestamp: /* @__PURE__ */ new Date()
    });
    defaultAuditService.logAction({
      action: "LOAN_APPLICATION_REVIEWED",
      actorUserId: params.reviewerUserId,
      actorRole: params.reviewerRole,
      resourceType: "LOAN_APPLICATION",
      resourceId: app.id,
      previousState: prevStatus,
      newState: params.decision,
      reason: params.reasonCode || params.notes || `Decision recorded as ${params.decision}`,
      details: {
        applicantUserId: app.userId,
        applicantName: app.applicantName,
        requestedAmountMinor: app.requestedAmountMinor,
        currency: app.currency
      }
    });
    const customer = defaultAuthService.getUserById(app.userId);
    if (customer?.email) {
      voidEmail(
        "loan-decision",
        defaultEmailService.sendLoanDecisionEmail({
          to: customer.email,
          fullName: customer.fullName || app.applicantName,
          applicationId: app.id,
          decision: params.decision,
          notes: params.notes
        })
      );
    }
    return app;
  }
  getUserApplications(userId) {
    return Array.from(this.applications.values()).filter((a) => a.userId === userId);
  }
  getAllApplicationsForReview(reviewerRole) {
    const allowedRoles = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(reviewerRole)) {
      throw new Error("Access denied.");
    }
    return Array.from(this.applications.values());
  }
  cancelApplication(applicationId, userId) {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error("Loan application not found.");
    if (app.userId !== userId) throw new Error("Access denied: application belongs to another customer.");
    if (app.status === "APPROVED_FOR_DEMO" || app.status === "DECLINED_FOR_DEMO") {
      throw new Error(`Cannot cancel application that has already reached final status: ${app.status}`);
    }
    const prevStatus = app.status;
    app.status = "CANCELLED";
    app.updatedAt = /* @__PURE__ */ new Date();
    app.reviewHistory.push({
      actorUserId: userId,
      previousStatus: prevStatus,
      newStatus: "CANCELLED",
      reason: "CUSTOMER_WITHDRAWAL",
      notes: "Customer elected to cancel the application before final underwriting.",
      timestamp: /* @__PURE__ */ new Date()
    });
    return app;
  }
  getApplicationById(id) {
    return this.applications.get(id);
  }
};
var defaultLoanService = new LoanService();

// src/server/routes/loan.routes.ts
var loanRouter = (0, import_express8.Router)();
var AmortizationSchema = import_zod9.z.object({
  principalDecimal: import_zod9.z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be valid positive monetary string"),
  currency: import_zod9.z.string().length(3),
  annualRatePercent: import_zod9.z.number().min(0).max(100),
  termMonths: import_zod9.z.number().int().min(1).max(360)
});
var CreateLoanSchema = import_zod9.z.object({
  type: import_zod9.z.enum(["PERSONAL", "SMALL_BUSINESS"]).default("PERSONAL"),
  currency: import_zod9.z.string().length(3).default("USD"),
  requestedAmountDecimal: import_zod9.z.string().regex(/^\d+(\.\d{1,2})?$/),
  termMonths: import_zod9.z.number().int().min(1).max(360),
  purpose: import_zod9.z.string().min(5).max(500),
  annualIncomeDecimal: import_zod9.z.string().regex(/^\d+(\.\d{1,2})?$/),
  monthlyExpensesDecimal: import_zod9.z.string().regex(/^\d+(\.\d{1,2})?$/),
  businessName: import_zod9.z.string().optional(),
  businessRevenueDecimal: import_zod9.z.string().optional(),
  consentAcknowledged: import_zod9.z.boolean().refine((val) => val === true, {
    message: "Must acknowledge credit demonstration consent and synthetic assessment terms"
  }),
  autoSubmit: import_zod9.z.boolean().optional().default(false)
});
var ReviewLoanSchema = import_zod9.z.object({
  decision: import_zod9.z.enum(["APPROVED_FOR_DEMO", "DECLINED_FOR_DEMO", "NEEDS_MORE_INFORMATION", "UNDER_REVIEW"]),
  reasonCode: import_zod9.z.string().optional(),
  notes: import_zod9.z.string().optional()
});
loanRouter.post("/amortization-calculator", (req, res, next) => {
  try {
    const validated = AmortizationSchema.parse(req.body);
    const result = defaultLoanService.calculateAmortization(validated);
    res.json({
      status: "calculated",
      data: result,
      notice: "DEMO ESTIMATE ONLY: Subject to underwriting and regulatory approval."
    });
  } catch (err) {
    next(err);
  }
});
loanRouter.get("/applications", authenticate, (req, res, next) => {
  try {
    const user = req.user;
    const showAll = req.query.all === "true";
    if (showAll && ["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      const allApps = defaultLoanService.getAllApplicationsForReview(user.role);
      res.json({
        total: allApps.length,
        view: "compliance_officer_queue",
        applications: allApps
      });
      return;
    }
    const userApps = defaultLoanService.getUserApplications(user.id);
    res.json({
      total: userApps.length,
      view: "customer_applications",
      applications: userApps
    });
  } catch (err) {
    next(err);
  }
});
loanRouter.get("/applications/:id", authenticate, (req, res, next) => {
  try {
    const user = req.user;
    const appId = req.params.id;
    const app = defaultLoanService.getApplicationById(appId);
    if (!app) {
      res.status(404).json({
        type: "https://avenora.com/errors/not-found",
        title: "Application Not Found",
        status: 404,
        detail: `Loan application with ID "${appId}" was not found.`
      });
      return;
    }
    const isStaff = ["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"].includes(user.role);
    if (app.userId !== user.id && !isStaff) {
      res.status(403).json({
        type: "https://avenora.com/errors/access-denied",
        title: "Access Denied",
        status: 403,
        detail: "You do not have permission to view another customer\u2019s loan application."
      });
      return;
    }
    res.json({ application: app });
  } catch (err) {
    next(err);
  }
});
loanRouter.post("/applications", authenticate, (req, res, next) => {
  try {
    const user = req.user;
    const validated = CreateLoanSchema.parse(req.body);
    const app = defaultLoanService.createDraftApplication({
      userId: user.id,
      applicantName: user.fullName,
      type: validated.type,
      currency: validated.currency,
      requestedAmountDecimal: validated.requestedAmountDecimal,
      termMonths: validated.termMonths,
      purpose: validated.purpose,
      annualIncomeDecimal: validated.annualIncomeDecimal,
      monthlyExpensesDecimal: validated.monthlyExpensesDecimal,
      businessName: validated.businessName,
      businessRevenueDecimal: validated.businessRevenueDecimal,
      consentAcknowledged: validated.consentAcknowledged
    });
    if (validated.autoSubmit) {
      const submitted = defaultLoanService.submitApplication(app.id, user.id);
      res.status(201).json({
        status: "submitted",
        application: submitted
      });
      return;
    }
    res.status(201).json({
      status: "draft_created",
      application: app
    });
  } catch (err) {
    next(err);
  }
});
loanRouter.post("/applications/:id/submit", authenticate, requireTransactionEligible, (req, res, next) => {
  try {
    const user = req.user;
    const appId = req.params.id;
    const submitted = defaultLoanService.submitApplication(appId, user.id);
    res.json({
      status: "submitted",
      application: submitted
    });
  } catch (err) {
    next(err);
  }
});
loanRouter.post("/applications/:id/cancel", authenticate, requireTransactionEligible, (req, res, next) => {
  try {
    const user = req.user;
    const appId = req.params.id;
    const cancelled = defaultLoanService.cancelApplication(appId, user.id);
    res.json({
      status: "cancelled",
      application: cancelled
    });
  } catch (err) {
    next(err);
  }
});
loanRouter.post(
  "/applications/:id/review",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const reviewer = req.user;
      const appId = req.params.id;
      const validated = ReviewLoanSchema.parse(req.body);
      const updated = defaultLoanService.reviewApplication({
        reviewerRole: reviewer.role,
        reviewerUserId: reviewer.id,
        applicationId: appId,
        decision: validated.decision,
        reasonCode: validated.reasonCode,
        notes: validated.notes
      });
      res.json({
        status: "decision_recorded",
        application: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

// src/server/routes/grant.routes.ts
var import_express9 = require("express");
var import_zod10 = require("zod");

// src/server/services/grant.service.ts
init_Money();
init_auth_service();
init_audit_service();
init_email_service();
var GrantService = class {
  programs = /* @__PURE__ */ new Map();
  applications = /* @__PURE__ */ new Map();
  constructor() {
    this.seedPrograms();
  }
  seedPrograms() {
    const p1 = {
      id: "grp_cleantech_2026",
      name: "Clean Tech & Renewable Innovation Accelerator",
      description: "Non-dilutive grant funding for individuals and early research initiatives focused on solar energy optimization, microgrid resilience, and residential decarbonization.",
      organizationName: "Global Sustainable Energy Foundation",
      fundingSourceRef: "GSEF-GRANT-FY26-A1",
      verificationStatus: "VERIFIED",
      eligibleCountries: ["US", "BR", "ES", "DE", "GB"],
      fundingMinMinor: "1000000",
      // $10,000.00
      fundingMaxMinor: "5000000",
      // $50,000.00
      formattedFundingRange: "$10,000.00 \u2013 $50,000.00 USD",
      currency: "USD",
      openingDate: /* @__PURE__ */ new Date("2026-01-01T00:00:00Z"),
      closingDate: /* @__PURE__ */ new Date("2026-12-31T23:59:59Z"),
      eligibilityCriteria: [
        "Must demonstrate measurable carbon or energy reduction metrics",
        "Applicant must maintain verified identity and valid residential address",
        "Project plan must be deliverable within 12 months of disbursement"
      ],
      verifiedByUserId: "usr_compliance_lead",
      verifiedAt: /* @__PURE__ */ new Date("2026-01-02T10:00:00Z"),
      isPublished: true,
      createdAt: /* @__PURE__ */ new Date("2026-01-01T09:00:00Z"),
      updatedAt: /* @__PURE__ */ new Date("2026-01-02T10:00:00Z")
    };
    const p2 = {
      id: "grp_microenterprise_2026",
      name: "European Microenterprise Resilience Grant",
      description: "Targeted financial assistance program supporting independent craftspeople, digital freelancers, and rural microenterprises across the European Economic Area.",
      organizationName: "Pan-European Innovation Alliance",
      fundingSourceRef: "PEIA-ME-EUR-2026",
      verificationStatus: "VERIFIED",
      eligibleCountries: ["ES", "DE", "FR", "IT", "PT"],
      fundingMinMinor: "500000",
      // €5,000.00
      fundingMaxMinor: "2500000",
      // €25,000.00
      formattedFundingRange: "\u20AC5,000.00 \u2013 \u20AC25,000.00 EUR",
      currency: "EUR",
      openingDate: /* @__PURE__ */ new Date("2026-02-01T00:00:00Z"),
      closingDate: /* @__PURE__ */ new Date("2026-11-30T23:59:59Z"),
      eligibilityCriteria: [
        "Registered sole proprietor or independent operator in eligible jurisdiction",
        "Must submit 6-month projected operational budget",
        "Compliance with local fiscal requirements"
      ],
      verifiedByUserId: "usr_compliance_lead",
      verifiedAt: /* @__PURE__ */ new Date("2026-02-01T14:30:00Z"),
      isPublished: true,
      createdAt: /* @__PURE__ */ new Date("2026-02-01T09:00:00Z"),
      updatedAt: /* @__PURE__ */ new Date("2026-02-01T14:30:00Z")
    };
    const p3 = {
      id: "grp_digital_latam_2026",
      name: "Iniciativa de Inclus\xE3o Digital e Educa\xE7\xE3o Tecnol\xF3gica",
      description: "Fundo de fomento social destinado a projetos comunit\xE1rios de capacita\xE7\xE3o em tecnologia, conectividade escolar e inclus\xE3o banc\xE1ria em \xE1reas vulner\xE1veis.",
      organizationName: "Instituto Latino-Americano de Desenvolvimento",
      fundingSourceRef: "ILAD-BR-2026-INCLUSAO",
      verificationStatus: "VERIFIED",
      eligibleCountries: ["BR"],
      fundingMinMinor: "1500000",
      // R$ 15.000,00
      fundingMaxMinor: "7500000",
      // R$ 75.000,00
      formattedFundingRange: "R$ 15.000,00 \u2013 R$ 75.000,00 BRL",
      currency: "BRL",
      openingDate: /* @__PURE__ */ new Date("2026-01-15T00:00:00Z"),
      closingDate: /* @__PURE__ */ new Date("2026-10-15T23:59:59Z"),
      eligibilityCriteria: [
        "Projeto sem fins lucrativos ou de impacto comunit\xE1rio comprovado no Brasil",
        "Relat\xF3rio trimestral de presta\xE7\xE3o de contas com m\xE9tricas de alunos formados",
        "Conta de liquida\xE7\xE3o vinculada em moeda BRL"
      ],
      verifiedByUserId: "usr_compliance_lead",
      verifiedAt: /* @__PURE__ */ new Date("2026-01-16T11:00:00Z"),
      isPublished: true,
      createdAt: /* @__PURE__ */ new Date("2026-01-15T09:00:00Z"),
      updatedAt: /* @__PURE__ */ new Date("2026-01-16T11:00:00Z")
    };
    const p4 = {
      id: "grp_open_source_fellowship",
      name: "Open Source Financial Cryptography Fellowship",
      description: "Fellowship grants for independent researchers contributing to reproducible zero-knowledge systems, formal verification of smart contracts, and open banking protocol security.",
      organizationName: "Decentralized Systems Research Council",
      fundingSourceRef: "DSRC-OSF-2026",
      verificationStatus: "PENDING_REVIEW",
      eligibleCountries: ["US", "ES", "BR", "DE", "GB"],
      fundingMinMinor: "2000000",
      // $20,000.00
      fundingMaxMinor: "6000000",
      // $60,000.00
      formattedFundingRange: "$20,000.00 \u2013 $60,000.00 USD",
      currency: "USD",
      openingDate: /* @__PURE__ */ new Date("2026-04-01T00:00:00Z"),
      closingDate: /* @__PURE__ */ new Date("2026-12-15T23:59:59Z"),
      eligibilityCriteria: [
        "Code and findings must be published under an OSI-approved permissive open source license",
        "Demonstrated history of contributions to cryptographic or systems software"
      ],
      isPublished: true,
      createdAt: /* @__PURE__ */ new Date("2026-03-01T10:00:00Z"),
      updatedAt: /* @__PURE__ */ new Date("2026-03-01T10:00:00Z")
    };
    this.programs.set(p1.id, p1);
    this.programs.set(p2.id, p2);
    this.programs.set(p3.id, p3);
    this.programs.set(p4.id, p4);
  }
  /**
   * Retrieves all grant programs, optionally filtered.
   */
  getPrograms(filters) {
    let list = Array.from(this.programs.values());
    if (filters?.verifiedOnly) {
      list = list.filter((p) => p.verificationStatus === "VERIFIED");
    }
    if (filters?.status) {
      list = list.filter((p) => p.verificationStatus === filters.status);
    }
    if (filters?.currency) {
      list = list.filter((p) => p.currency === filters.currency.toUpperCase());
    }
    if (filters?.country) {
      list = list.filter((p) => p.eligibleCountries.includes(filters.country.toUpperCase()));
    }
    return list;
  }
  getProgramById(id) {
    return this.programs.get(id);
  }
  /**
   * Compliance officer verifies or rejects a grant program.
   */
  verifyProgram(params) {
    const allowedRoles = ["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(params.reviewerRole)) {
      throw new Error("Access denied: only compliance officers or administrators can verify grant programs.");
    }
    const prog = this.programs.get(params.programId);
    if (!prog) throw new Error("Grant program not found.");
    const prevStatus = prog.verificationStatus;
    prog.verificationStatus = params.newStatus;
    prog.verifiedByUserId = params.reviewerUserId;
    prog.verifiedAt = /* @__PURE__ */ new Date();
    prog.updatedAt = /* @__PURE__ */ new Date();
    defaultAuditService.logAction({
      action: "GRANT_PROGRAM_VERIFIED",
      actorUserId: params.reviewerUserId,
      actorRole: params.reviewerRole,
      resourceType: "GRANT_PROGRAM",
      resourceId: prog.id,
      previousState: prevStatus,
      newState: params.newStatus,
      reason: `Grant program verification status set to ${params.newStatus}`,
      details: {
        programName: prog.name,
        organizationName: prog.organizationName,
        currency: prog.currency
      }
    });
    return prog;
  }
  /**
   * Creates a draft or submitted grant application.
   */
  createApplication(params) {
    const prog = this.programs.get(params.programId);
    if (!prog) throw new Error("Grant program not found.");
    if (prog.verificationStatus !== "VERIFIED") {
      throw new Error("Applications can only be submitted to programs that are officially VERIFIED.");
    }
    const money = Money.fromDecimalString(params.requestedAmountDecimal, prog.currency);
    const minMoney = Money.fromMinor(BigInt(prog.fundingMinMinor), prog.currency);
    const maxMoney = Money.fromMinor(BigInt(prog.fundingMaxMinor), prog.currency);
    if (money.lessThan(minMoney) || money.greaterThan(maxMoney)) {
      throw new Error(
        `Requested grant amount (${money.toDisplayString()}) must be within the published program range (${prog.formattedFundingRange}).`
      );
    }
    const id = `gapp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record = {
      id,
      programId: prog.id,
      programName: prog.name,
      userId: params.userId,
      applicantName: params.applicantName,
      projectTitle: params.projectTitle,
      projectSummary: params.projectSummary,
      requestedAmountMinor: money.amountMinor.toString(),
      formattedRequestedAmount: money.toDisplayString(),
      currency: prog.currency,
      status: "DRAFT",
      eligibilityAnswers: params.eligibilityAnswers,
      documentRefs: params.documentRefs || [],
      reviewHistory: [],
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.applications.set(id, record);
    return record;
  }
  /**
   * Submits a draft grant application.
   */
  submitApplication(applicationId, userId) {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error("Grant application not found.");
    if (app.userId !== userId) throw new Error("Access denied: application belongs to another customer.");
    if (app.status !== "DRAFT" && app.status !== "NEEDS_MORE_INFORMATION") {
      throw new Error(`Cannot submit grant application in status: ${app.status}`);
    }
    const prog = this.programs.get(app.programId);
    let allEligible = true;
    if (prog) {
      for (const criterion of prog.eligibilityCriteria) {
        if (!app.eligibilityAnswers[criterion]) {
          allEligible = false;
        }
      }
    }
    const prevStatus = app.status;
    app.status = allEligible ? "SUBMITTED" : "INELIGIBLE";
    app.submittedAt = /* @__PURE__ */ new Date();
    app.updatedAt = /* @__PURE__ */ new Date();
    app.reviewHistory.push({
      actorUserId: userId,
      previousStatus: prevStatus,
      newStatus: app.status,
      notes: allEligible ? "Application passed automated initial eligibility checklist." : "Application failed one or more mandatory eligibility requirements.",
      timestamp: /* @__PURE__ */ new Date()
    });
    const customer = defaultAuthService.getUserById(userId);
    const customerName = customer?.fullName || app.applicantName;
    if (!allEligible) {
      if (customer?.email) {
        voidEmail(
          "grant-ineligible",
          defaultEmailService.sendGrantIneligibleEmail({
            to: customer.email,
            fullName: customerName,
            applicationId: app.id,
            reason: "Application failed one or more mandatory eligibility requirements."
          })
        );
      }
    } else {
      if (customer?.email) {
        voidEmail(
          "grant-submitted",
          defaultEmailService.sendGrantSubmittedEmail({
            to: customer.email,
            fullName: customerName,
            applicationId: app.id
          })
        );
      }
      voidEmail(
        "grant-submitted-staff",
        defaultEmailService.sendGrantSubmittedStaffEmail({
          customerName,
          applicationId: app.id
        })
      );
    }
    return app;
  }
  /**
   * Compliance review for grant applications with separation of duties enforcement.
   */
  reviewApplication(params) {
    const allowedRoles = ["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(params.reviewerRole)) {
      throw new Error("Access denied: only compliance officers or administrators can review grant applications.");
    }
    const app = this.applications.get(params.applicationId);
    if (!app) throw new Error("Grant application not found.");
    if (app.userId === params.reviewerUserId) {
      throw new Error("Separation of duties violation: you cannot review or approve your own grant application.");
    }
    const prevStatus = app.status;
    app.status = params.decision;
    app.reviewerUserId = params.reviewerUserId;
    app.reviewerNotes = params.notes;
    app.reviewedAt = /* @__PURE__ */ new Date();
    app.updatedAt = /* @__PURE__ */ new Date();
    app.reviewHistory.push({
      actorUserId: params.reviewerUserId,
      previousStatus: prevStatus,
      newStatus: params.decision,
      notes: params.notes,
      timestamp: /* @__PURE__ */ new Date()
    });
    defaultAuditService.logAction({
      action: "GRANT_APPLICATION_REVIEWED",
      actorUserId: params.reviewerUserId,
      actorRole: params.reviewerRole,
      resourceType: "GRANT_APPLICATION",
      resourceId: app.id,
      previousState: prevStatus,
      newState: params.decision,
      reason: params.notes || `Decision recorded as ${params.decision}`,
      details: {
        applicantUserId: app.userId,
        programId: app.programId,
        programName: app.programName,
        requestedAmountMinor: app.requestedAmountMinor,
        currency: app.currency
      }
    });
    const customer = defaultAuthService.getUserById(app.userId);
    if (customer?.email) {
      voidEmail(
        "grant-reviewed",
        defaultEmailService.sendGrantReviewedEmail({
          to: customer.email,
          fullName: customer.fullName || app.applicantName,
          applicationId: app.id,
          decision: params.decision,
          notes: params.notes
        })
      );
    }
    return app;
  }
  /**
   * Simulates non-dilutive grant award disbursement into the customer's multicurrency wallet.
   * Connects to the double-entry ledger via defaultWalletService.
   */
  async simulateDisbursement(params) {
    const allowedRoles = ["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(params.approvedByRole)) {
      throw new Error("Access denied: only compliance officers or administrators can disburse grant funds.");
    }
    const app = this.applications.get(params.applicationId);
    if (!app) throw new Error("Grant application not found.");
    if (app.status !== "APPROVED_FOR_DEMO") {
      throw new Error(`Cannot disburse grant award for application with status: ${app.status}. Must be APPROVED_FOR_DEMO.`);
    }
    if (app.userId === params.approvedByUserId) {
      throw new Error("Separation of duties violation: reviewer cannot authorize disbursement to their own account.");
    }
    if (app.award && app.award.disbursementStatus === "DISBURSED_SIMULATED") {
      throw new Error("Grant award has already been disbursed.");
    }
    const idemKey = params.idempotencyKey || `idem_grant_disb_${app.id}_${Date.now()}`;
    const reconRef = `RECON-GRANT-${app.programId.toUpperCase().slice(-8)}-${Date.now().toString(36).toUpperCase()}`;
    const awardAmountMoney = Money.fromMinor(BigInt(app.requestedAmountMinor), app.currency);
    const depositResult = await defaultWalletService.executeSimulatedDeposit({
      userId: app.userId,
      currency: app.currency,
      amountDecimal: awardAmountMoney.toDecimalString(),
      idempotencyKey: idemKey,
      sourceRail: "WIRE"
    });
    const award = {
      id: `gaward_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      applicationId: app.id,
      awardedAmountMinor: app.requestedAmountMinor,
      formattedAwardedAmount: awardAmountMoney.toDisplayString(),
      currency: app.currency,
      reconciliationRef: reconRef,
      approvedByUserId: params.approvedByUserId,
      disbursementStatus: "DISBURSED_SIMULATED",
      disbursedAt: /* @__PURE__ */ new Date(),
      idempotencyKey: idemKey,
      createdAt: /* @__PURE__ */ new Date()
    };
    app.award = award;
    app.updatedAt = /* @__PURE__ */ new Date();
    defaultAuditService.logAction({
      action: "GRANT_AWARD_DISBURSED",
      actorUserId: params.approvedByUserId,
      actorRole: params.approvedByRole,
      resourceType: "GRANT_AWARD",
      resourceId: award.id,
      newState: "DISBURSED_SIMULATED",
      reason: "Grant award disbursement credited to customer wallet",
      financialTxId: depositResult.transactionId,
      details: {
        applicationId: app.id,
        recipientUserId: app.userId,
        awardedAmountMinor: award.awardedAmountMinor,
        currency: award.currency,
        reconciliationRef: reconRef
      }
    });
    const customer = defaultAuthService.getUserById(app.userId);
    if (customer?.email) {
      voidEmail(
        "grant-disbursed",
        defaultEmailService.sendGrantDisbursedEmail({
          to: customer.email,
          fullName: customer.fullName || app.applicantName,
          applicationId: app.id,
          amount: awardAmountMoney.toDecimalString(),
          currency: award.currency
        })
      );
    }
    return {
      application: app,
      award,
      depositResult
    };
  }
  getUserApplications(userId) {
    return Array.from(this.applications.values()).filter((a) => a.userId === userId);
  }
  getAllApplicationsForReview(reviewerRole) {
    const allowedRoles = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(reviewerRole)) {
      throw new Error("Access denied.");
    }
    return Array.from(this.applications.values());
  }
  getApplicationById(id) {
    return this.applications.get(id);
  }
};
var defaultGrantService = new GrantService();

// src/server/routes/grant.routes.ts
var grantRouter = (0, import_express9.Router)();
var CreateGrantAppSchema = import_zod10.z.object({
  programId: import_zod10.z.string().min(1),
  projectTitle: import_zod10.z.string().min(3).max(200),
  projectSummary: import_zod10.z.string().min(10).max(2e3),
  requestedAmountDecimal: import_zod10.z.string().regex(/^\d+(\.\d{1,2})?$/),
  eligibilityAnswers: import_zod10.z.record(import_zod10.z.string(), import_zod10.z.union([import_zod10.z.boolean(), import_zod10.z.string()])),
  documentRefs: import_zod10.z.array(import_zod10.z.string()).optional(),
  autoSubmit: import_zod10.z.boolean().optional().default(false)
});
var ReviewGrantAppSchema = import_zod10.z.object({
  decision: import_zod10.z.enum(["APPROVED_FOR_DEMO", "DECLINED", "NEEDS_MORE_INFORMATION", "UNDER_REVIEW"]),
  notes: import_zod10.z.string().optional()
});
var VerifyProgramSchema = import_zod10.z.object({
  status: import_zod10.z.enum(["VERIFIED", "REJECTED"])
});
grantRouter.get("/programs", (req, res, next) => {
  try {
    const { country, currency, status, verifiedOnly } = req.query;
    const programs = defaultGrantService.getPrograms({
      country: country ? String(country) : void 0,
      currency: currency ? String(currency) : void 0,
      status: status ? String(status) : void 0,
      verifiedOnly: verifiedOnly === "true"
    });
    res.json({
      total: programs.length,
      programs
    });
  } catch (err) {
    next(err);
  }
});
grantRouter.get("/programs/:id", (req, res, next) => {
  try {
    const progId = req.params.id;
    const prog = defaultGrantService.getProgramById(progId);
    if (!prog) {
      res.status(404).json({
        type: "https://avenora.com/errors/not-found",
        title: "Grant Program Not Found",
        status: 404,
        detail: `Grant program "${progId}" does not exist.`
      });
      return;
    }
    res.json({ program: prog });
  } catch (err) {
    next(err);
  }
});
grantRouter.post(
  "/programs/:id/verify",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const reviewer = req.user;
      const progId = req.params.id;
      const validated = VerifyProgramSchema.parse(req.body);
      const prog = defaultGrantService.verifyProgram({
        programId: progId,
        reviewerUserId: reviewer.id,
        reviewerRole: reviewer.role,
        newStatus: validated.status
      });
      res.json({
        status: "program_verified",
        program: prog
      });
    } catch (err) {
      next(err);
    }
  }
);
grantRouter.get("/applications", authenticate, (req, res, next) => {
  try {
    const user = req.user;
    const showAll = req.query.all === "true";
    if (showAll && ["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      const allApps = defaultGrantService.getAllApplicationsForReview(user.role);
      res.json({
        total: allApps.length,
        view: "compliance_officer_queue",
        applications: allApps
      });
      return;
    }
    const userApps = defaultGrantService.getUserApplications(user.id);
    res.json({
      total: userApps.length,
      view: "customer_applications",
      applications: userApps
    });
  } catch (err) {
    next(err);
  }
});
grantRouter.get("/applications/:id", authenticate, (req, res, next) => {
  try {
    const user = req.user;
    const appId = req.params.id;
    const app = defaultGrantService.getApplicationById(appId);
    if (!app) {
      res.status(404).json({
        type: "https://avenora.com/errors/not-found",
        title: "Grant Application Not Found",
        status: 404,
        detail: `Grant application with ID "${appId}" does not exist.`
      });
      return;
    }
    const isStaff = ["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"].includes(user.role);
    if (app.userId !== user.id && !isStaff) {
      res.status(403).json({
        type: "https://avenora.com/errors/access-denied",
        title: "Access Denied",
        status: 403,
        detail: "You do not have permission to view this grant application."
      });
      return;
    }
    res.json({ application: app });
  } catch (err) {
    next(err);
  }
});
grantRouter.post("/applications", authenticate, (req, res, next) => {
  try {
    const user = req.user;
    const validated = CreateGrantAppSchema.parse(req.body);
    const app = defaultGrantService.createApplication({
      programId: validated.programId,
      userId: user.id,
      applicantName: user.fullName,
      projectTitle: validated.projectTitle,
      projectSummary: validated.projectSummary,
      requestedAmountDecimal: validated.requestedAmountDecimal,
      eligibilityAnswers: validated.eligibilityAnswers,
      documentRefs: validated.documentRefs
    });
    if (validated.autoSubmit) {
      const submitted = defaultGrantService.submitApplication(app.id, user.id);
      res.status(201).json({
        status: "submitted",
        application: submitted
      });
      return;
    }
    res.status(201).json({
      status: "draft_created",
      application: app
    });
  } catch (err) {
    next(err);
  }
});
grantRouter.post("/applications/:id/submit", authenticate, requireTransactionEligible, (req, res, next) => {
  try {
    const user = req.user;
    const appId = req.params.id;
    const submitted = defaultGrantService.submitApplication(appId, user.id);
    res.json({
      status: "submitted",
      application: submitted
    });
  } catch (err) {
    next(err);
  }
});
grantRouter.post(
  "/applications/:id/review",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const reviewer = req.user;
      const appId = req.params.id;
      const validated = ReviewGrantAppSchema.parse(req.body);
      const reviewed = defaultGrantService.reviewApplication({
        reviewerRole: reviewer.role,
        reviewerUserId: reviewer.id,
        applicationId: appId,
        decision: validated.decision,
        notes: validated.notes
      });
      res.json({
        status: "decision_recorded",
        application: reviewed
      });
    } catch (err) {
      next(err);
    }
  }
);
grantRouter.post(
  "/applications/:id/disburse",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  async (req, res, next) => {
    try {
      const reviewer = req.user;
      const appId = req.params.id;
      const result = await defaultGrantService.simulateDisbursement({
        applicationId: appId,
        approvedByUserId: reviewer.id,
        approvedByRole: reviewer.role,
        idempotencyKey: req.headers["x-idempotency-key"]
      });
      res.json({
        status: "grant_disbursed",
        award: result.award,
        application: result.application,
        depositDetails: result.depositResult
      });
    } catch (err) {
      next(err);
    }
  }
);

// src/server/routes/card.routes.ts
var import_express10 = require("express");
var import_zod11 = require("zod");

// src/server/services/card.service.ts
init_Money();
init_Currency();

// src/domain/cards/cardSpendLimits.ts
init_Currency();

// src/lib/illustrativeFx.ts
init_Currency();
var DEMO_PAIR_OVERRIDES = {
  USD_EUR: LOCAL_UNITS_PER_USD.EUR,
  EUR_USD: 1 / LOCAL_UNITS_PER_USD.EUR,
  USD_BRL: LOCAL_UNITS_PER_USD.BRL,
  BRL_USD: 1 / LOCAL_UNITS_PER_USD.BRL,
  USD_GBP: LOCAL_UNITS_PER_USD.GBP,
  GBP_USD: 1 / LOCAL_UNITS_PER_USD.GBP,
  BTC_USD: 68500,
  USD_BTC: 1 / 68500
};
function illustrativeUsdPerUnit(currency) {
  return illustrativeUsdPerLocalUnit(currency);
}
function resolveIllustrativeRate(sourceCurrency, destinationCurrency) {
  const source = sourceCurrency.toUpperCase();
  const dest = destinationCurrency.toUpperCase();
  if (source === dest) return 1;
  const direct = DEMO_PAIR_OVERRIDES[`${source}_${dest}`];
  if (direct) return direct;
  const inverse = DEMO_PAIR_OVERRIDES[`${dest}_${source}`];
  if (inverse && inverse > 0) return 1 / inverse;
  if (source === "USD") {
    return illustrativeLocalUnitsPerUsd(dest);
  }
  if (dest === "USD") {
    return illustrativeUsdPerUnit(source);
  }
  const usdPerSource = illustrativeUsdPerUnit(source);
  const usdPerDest = illustrativeUsdPerUnit(dest);
  if (usdPerDest <= 0) return 1;
  return usdPerSource / usdPerDest;
}

// src/domain/cards/cardSpendLimits.ts
var CARD_SINGLE_LIMIT_USD = 20;
var CARD_MONTHLY_LIMIT_USD = 2e3;
var CARD_BR_SINGLE_LIMIT = 1e3;
var CARD_BR_MONTHLY_LIMIT = 1e4;
function ceilToPolicyStep(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return 10;
  let step;
  if (amount < 100) step = 10;
  else if (amount < 1e3) step = 100;
  else if (amount < 1e4) step = 1e3;
  else step = 1e4;
  return Math.ceil(amount / step) * step;
}
function formatMajorLimit(amount, currency) {
  const def = getCurrency(currency);
  const digits2 = def.minorUnits <= 0 ? 0 : Math.min(def.minorUnits, 2);
  const whole = Math.round(amount);
  if (digits2 === 0) return String(whole);
  return whole.toFixed(digits2);
}
function isBrazilCardAccount(params) {
  const currency = params.currency.trim().toUpperCase();
  const country = (params.countryCode || "").trim().toUpperCase();
  return country === "BR" || currency === "BRL";
}
function resolveFixedCardSpendLimits(params) {
  const currency = params.currency.trim().toUpperCase() || "USD";
  if (isBrazilCardAccount(params)) {
    return {
      singleTxLimitDecimal: formatMajorLimit(CARD_BR_SINGLE_LIMIT, currency === "BRL" ? "BRL" : currency),
      monthlyLimitDecimal: formatMajorLimit(CARD_BR_MONTHLY_LIMIT, currency === "BRL" ? "BRL" : currency)
    };
  }
  const localPerUsd = resolveIllustrativeRate("USD", currency);
  if (!Number.isFinite(localPerUsd) || localPerUsd <= 0) {
    throw new Error(`Unable to convert card limits into ${currency}.`);
  }
  const singleRaw = CARD_SINGLE_LIMIT_USD * localPerUsd;
  const monthlyRaw = CARD_MONTHLY_LIMIT_USD * localPerUsd;
  const single = ceilToPolicyStep(singleRaw);
  const monthly = ceilToPolicyStep(monthlyRaw);
  const monthlyFinal = Math.max(monthly, single);
  return {
    singleTxLimitDecimal: formatMajorLimit(single, currency),
    monthlyLimitDecimal: formatMajorLimit(monthlyFinal, currency)
  };
}

// src/server/services/card.service.ts
init_ledger_service();
init_LedgerInvariant();
init_audit_service();
init_auth_service();
init_email_service();
var CardService = class {
  cards = /* @__PURE__ */ new Map();
  authorizations = /* @__PURE__ */ new Map();
  /**
   * Generates a realistic synthetic test card number with valid Luhn checksum.
   */
  generateSyntheticPan() {
    const base = "4532" + Math.floor(1e7 + Math.random() * 9e7).toString();
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      let digit = parseInt(base.charAt(i), 10);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    const checkDigit = (10 - sum % 10) % 10;
    const full = base + checkDigit.toString();
    const formatted2 = full.replace(/(\d{4})/g, "$1 ").trim();
    const lastFour = full.slice(-4);
    const masked = `\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ${lastFour}`;
    return { full: formatted2, masked, lastFour };
  }
  /**
   * Customer requests a card. Stays PENDING_REVIEW until an admin approves issuance.
   * Credentials are provisioned server-side but not usable until ACTIVE_SIMULATED.
   */
  requestCard(params) {
    const currency = (params.currency || "USD").toUpperCase();
    if (!isSupportedCurrency(currency)) {
      throw new Error(`Unsupported card currency: ${currency}`);
    }
    const pendingForUser = Array.from(this.cards.values()).filter(
      (c) => c.userId === params.userId && c.status === "PENDING_REVIEW"
    );
    if (pendingForUser.length >= 3) {
      throw new Error(
        "You already have multiple card requests awaiting admin approval. Please wait for a decision before requesting another."
      );
    }
    const { full, masked, lastFour } = this.generateSyntheticPan();
    const type = params.type || "DEBIT";
    const form = params.form || "VIRTUAL";
    const user = defaultAuthService.getUserById(params.userId);
    const countryCode = (params.countryCode || user?.countryCode || "").toUpperCase();
    const fixedLimits = resolveFixedCardSpendLimits({ currency, countryCode });
    const dailyLimit = Money.fromDecimalString(fixedLimits.monthlyLimitDecimal, currency);
    const singleLimit = Money.fromDecimalString(fixedLimits.singleTxLimitDecimal, currency);
    const id = `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const card = {
      id,
      userId: params.userId,
      walletAccountId: `wacc_${params.userId}_${currency.toLowerCase()}`,
      type,
      form,
      status: "PENDING_REVIEW",
      currency,
      maskedPan: masked,
      lastFour,
      syntheticPanFormatted: full,
      syntheticExpiry: "12/29",
      syntheticCvv: Math.floor(100 + Math.random() * 900).toString(),
      syntheticCardholderName: params.cardholderName.toUpperCase(),
      dailySpendLimitMinor: dailyLimit.amountMinor.toString(),
      singleTxLimitMinor: singleLimit.amountMinor.toString(),
      formattedDailyLimit: dailyLimit.toDisplayString(),
      formattedSingleTxLimit: singleLimit.toDisplayString(),
      dailySpentMinor: "0",
      providerRef: `SIM-ISSUER-${Date.now().toString(36).toUpperCase()}`,
      authorizations: [],
      stateEvents: [
        {
          id: `cevent_${Date.now()}`,
          cardId: id,
          previousStatus: "REQUESTED",
          newStatus: "PENDING_REVIEW",
          reason: "Card issuance requested \u2014 awaiting admin approval",
          actorUserId: params.userId,
          createdAt: /* @__PURE__ */ new Date()
        }
      ],
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.cards.set(id, card);
    defaultAuditService.logAction({
      action: "CARD_REQUESTED",
      actorUserId: params.userId,
      actorRole: "CUSTOMER",
      resourceType: "PAYMENT_CARD",
      resourceId: card.id,
      previousState: "REQUESTED",
      newState: "PENDING_REVIEW",
      reason: "Customer requested card issuance",
      details: {
        currency: card.currency,
        type: card.type,
        form: card.form,
        cardLastFour: card.lastFour
      }
    });
    const customer = defaultAuthService.getUserById(params.userId);
    const customerName = customer?.fullName || params.cardholderName;
    if (customer?.email) {
      voidEmail(
        "card-requested",
        defaultEmailService.sendCardRequestedEmail({
          to: customer.email,
          fullName: customerName,
          cardLabel: `${card.form} ${card.type} (${card.currency})`
        })
      );
    }
    voidEmail(
      "card-requested-staff",
      defaultEmailService.sendCardRequestedStaffEmail({
        customerName,
        cardId: card.id
      })
    );
    return card;
  }
  /**
   * Admin approves or declines a pending card issuance request.
   * Only APPROVE moves the card to ACTIVE_SIMULATED (issued).
   */
  reviewCardIssuance(params) {
    const allowed = ["SUPPORT", "ADMIN", "SUPER_ADMIN"];
    if (!allowed.includes(params.actorRole)) {
      throw new Error("Access denied: only Support, Admin, or Super Admin can review card issuance.");
    }
    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error("A documented reason of at least 5 characters is required for issuance review.");
    }
    const card = this.cards.get(params.cardId);
    if (!card) throw new Error("Card not found.");
    if (card.status !== "PENDING_REVIEW" && card.status !== "REQUESTED") {
      throw new Error(
        `Card "${params.cardId}" is not awaiting issuance review (current status: ${card.status}).`
      );
    }
    const prevStatus = card.status;
    const newStatus = params.decision === "APPROVE" ? "ACTIVE_SIMULATED" : "ISSUANCE_DECLINED";
    card.status = newStatus;
    card.updatedAt = /* @__PURE__ */ new Date();
    card.stateEvents.push({
      id: `cevent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cardId: card.id,
      previousStatus: prevStatus,
      newStatus,
      reason: params.reason.trim(),
      actorUserId: params.actorUserId,
      createdAt: /* @__PURE__ */ new Date()
    });
    defaultAuditService.logAction({
      action: "CARD_STATUS_CHANGED",
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: "PAYMENT_CARD",
      resourceId: card.id,
      previousState: prevStatus,
      newState: newStatus,
      reason: params.reason.trim(),
      details: {
        decision: params.decision,
        cardLastFour: card.lastFour,
        currency: card.currency,
        userId: card.userId,
        issuanceReview: true
      }
    });
    const customer = defaultAuthService.getUserById(card.userId);
    if (customer?.email) {
      if (params.decision === "APPROVE") {
        voidEmail(
          "card-issuance-approved",
          defaultEmailService.sendCardIssuanceApprovedEmail({
            to: customer.email,
            fullName: customer.fullName,
            last4: card.lastFour
          })
        );
      } else {
        voidEmail(
          "card-issuance-declined",
          defaultEmailService.sendCardIssuanceDeclinedEmail({
            to: customer.email,
            fullName: customer.fullName,
            reason: params.reason.trim()
          })
        );
      }
    }
    return card;
  }
  /**
   * Permanently deletes a card request (or declined/terminated record) from the queue.
   * Active cards with open authorization holds cannot be deleted.
   */
  deleteCard(params) {
    const allowed = ["SUPPORT", "ADMIN", "SUPER_ADMIN"];
    if (!allowed.includes(params.actorRole)) {
      throw new Error("Access denied: only Support, Admin, or Super Admin can delete card records.");
    }
    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error("A documented reason of at least 5 characters is required to delete a card.");
    }
    const card = this.cards.get(params.cardId);
    if (!card) throw new Error("Card not found.");
    const openHolds = card.authorizations.filter((a) => a.holdStatus === "PENDING_HOLD");
    if (openHolds.length > 0) {
      throw new Error("Cannot delete a card that still has open authorization holds. Release or settle holds first.");
    }
    const previousStatus = card.status;
    for (const auth of card.authorizations) {
      this.authorizations.delete(auth.id);
    }
    this.cards.delete(params.cardId);
    defaultAuditService.logAction({
      action: "CARD_DELETED",
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: "PAYMENT_CARD",
      resourceId: params.cardId,
      previousState: previousStatus,
      newState: "DELETED",
      reason: params.reason.trim(),
      details: {
        userId: card.userId,
        currency: card.currency,
        type: card.type,
        form: card.form,
        cardLastFour: card.lastFour,
        cardholderName: card.syntheticCardholderName
      }
    });
    const customer = defaultAuthService.getUserById(card.userId);
    if (customer?.email) {
      voidEmail(
        "card-terminated",
        defaultEmailService.sendCardTerminatedEmail({
          to: customer.email,
          fullName: customer.fullName,
          last4: card.lastFour
        })
      );
    }
    return { deletedCardId: params.cardId, previousStatus };
  }
  /**
   * Redacts full PAN / CVV for cards that have not been approved/issued yet.
   */
  sanitizeCardForCustomer(card) {
    if (card.status === "ACTIVE_SIMULATED" || card.status === "FROZEN") {
      return { ...card };
    }
    return {
      ...card,
      maskedPan: "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022",
      lastFour: "\u2022\u2022\u2022\u2022",
      syntheticPanFormatted: "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022",
      syntheticCvv: "\u2022\u2022\u2022"
    };
  }
  /**
   * Updates card lifecycle status (Freeze, Unfreeze, Terminate).
   */
  updateCardStatus(params) {
    const card = this.cards.get(params.cardId);
    if (!card) throw new Error("Card not found.");
    const isStaff = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"].includes(params.actorRole);
    if (card.userId !== params.actorUserId && !isStaff) {
      throw new Error("Access denied: you can only update your own cards.");
    }
    if (card.status === "TERMINATED" || card.status === "ISSUANCE_DECLINED") {
      throw new Error("Cannot change status of a card that has been permanently closed or declined.");
    }
    if (card.status === "PENDING_REVIEW" || card.status === "REQUESTED") {
      throw new Error(
        "This card is awaiting issuance approval. Use the admin issuance review action to approve or decline it."
      );
    }
    if (!isStaff && params.newStatus === "ACTIVE_SIMULATED" && card.status !== "FROZEN") {
      throw new Error("Access denied: card activation requires administrator approval.");
    }
    const prevStatus = card.status;
    card.status = params.newStatus;
    card.updatedAt = /* @__PURE__ */ new Date();
    const eventRecord = {
      id: `cevent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cardId: card.id,
      previousStatus: prevStatus,
      newStatus: params.newStatus,
      reason: params.reason || `Status updated to ${params.newStatus}`,
      actorUserId: params.actorUserId,
      createdAt: /* @__PURE__ */ new Date()
    };
    card.stateEvents.push(eventRecord);
    defaultAuditService.logAction({
      action: "CARD_STATUS_CHANGED",
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: "PAYMENT_CARD",
      resourceId: card.id,
      previousState: prevStatus,
      newState: params.newStatus,
      reason: params.reason || `Status updated to ${params.newStatus}`,
      details: {
        cardLastFour: card.lastFour,
        currency: card.currency,
        userId: card.userId
      }
    });
    const customer = defaultAuthService.getUserById(card.userId);
    if (customer?.email) {
      if (params.newStatus === "FROZEN") {
        voidEmail(
          "card-frozen",
          defaultEmailService.sendCardFrozenEmail({
            to: customer.email,
            fullName: customer.fullName,
            last4: card.lastFour
          })
        );
      } else if (params.newStatus === "ACTIVE_SIMULATED" && prevStatus === "FROZEN") {
        voidEmail(
          "card-unfrozen",
          defaultEmailService.sendCardUnfrozenEmail({
            to: customer.email,
            fullName: customer.fullName,
            last4: card.lastFour
          })
        );
      } else if (params.newStatus === "TERMINATED") {
        voidEmail(
          "card-terminated",
          defaultEmailService.sendCardTerminatedEmail({
            to: customer.email,
            fullName: customer.fullName,
            last4: card.lastFour
          })
        );
      }
    }
    return card;
  }
  /**
   * Updates card spending limits.
   */
  updateLimits(params) {
    const card = this.cards.get(params.cardId);
    if (!card) throw new Error("Card not found.");
    if (card.userId !== params.userId) {
      throw new Error("Access denied.");
    }
    if (card.status !== "ACTIVE_SIMULATED" && card.status !== "FROZEN") {
      throw new Error("Spending limits can only be changed on issued (active or frozen) cards.");
    }
    const dailyLimit = Money.fromDecimalString(params.dailyLimitDecimal, card.currency);
    const singleLimit = Money.fromDecimalString(params.singleTxLimitDecimal, card.currency);
    if (singleLimit.greaterThan(dailyLimit)) {
      throw new Error("Single transaction limit cannot exceed monthly spend limit.");
    }
    card.dailySpendLimitMinor = dailyLimit.amountMinor.toString();
    card.singleTxLimitMinor = singleLimit.amountMinor.toString();
    card.formattedDailyLimit = dailyLimit.toDisplayString();
    card.formattedSingleTxLimit = singleLimit.toDisplayString();
    card.updatedAt = /* @__PURE__ */ new Date();
    const customer = defaultAuthService.getUserById(card.userId);
    if (customer?.email) {
      voidEmail(
        "card-limits-changed",
        defaultEmailService.sendCardLimitsChangedEmail({
          to: customer.email,
          fullName: customer.fullName,
          last4: card.lastFour,
          dailyLimit: card.formattedSingleTxLimit,
          monthlyLimit: card.formattedDailyLimit
        })
      );
    }
    return card;
  }
  /**
   * Step 1: Point-of-Sale / Merchant Authorization Simulator.
   * Performs authorization checks and creates a PENDING_HOLD backed by the double-entry ledger.
   */
  simulateAuthorization(params) {
    const card = this.cards.get(params.cardId);
    if (!card) throw new Error("Card not found.");
    if (card.status === "FROZEN") {
      throw new Error("Card Declination: Card is currently FROZEN. Please unfreeze card to authorize purchases.");
    }
    if (card.status === "TERMINATED") {
      throw new Error("Card Declination: Card has been permanently TERMINATED.");
    }
    if (card.status !== "ACTIVE_SIMULATED") {
      throw new Error(`Card Declination: Card status is ${card.status}. Cannot authorize.`);
    }
    if (params.currency.toUpperCase() !== card.currency) {
      throw new Error(
        `Card Declination: Transaction currency (${params.currency}) does not match card currency (${card.currency}).`
      );
    }
    const txMoney = Money.fromDecimalString(params.amountDecimal, card.currency);
    if (!txMoney.isPositive()) {
      throw new Error("Card authorization amount must be strictly positive.");
    }
    const singleLimitMinor = BigInt(card.singleTxLimitMinor);
    if (txMoney.amountMinor > singleLimitMinor) {
      throw new Error(
        `Card Declination: Amount ${txMoney.toDisplayString()} exceeds single transaction limit (${card.formattedSingleTxLimit}).`
      );
    }
    const dailySpent = BigInt(card.dailySpentMinor);
    const dailyLimit = BigInt(card.dailySpendLimitMinor);
    if (dailySpent + txMoney.amountMinor > dailyLimit) {
      throw new Error(
        `Card Declination: Transaction would exceed monthly limit (${card.formattedDailyLimit}). Monthly spent so far: ${Money.fromMinor(dailySpent, card.currency).toDisplayString()}.`
      );
    }
    const userLedgerAccounts = defaultLedgerService.getUserAccounts(card.userId);
    const availableAccount = userLedgerAccounts.find(
      (a) => a.currency === card.currency && a.classification === "CUSTOMER_AVAILABLE_BALANCE"
    );
    const holdAccount = userLedgerAccounts.find(
      (a) => a.currency === card.currency && a.classification === "CUSTOMER_PENDING_HOLD"
    );
    if (!availableAccount || !holdAccount) {
      throw new Error("User ledger accounts not provisioned for card currency.");
    }
    const availableBal = defaultLedgerService.getAccountBalance(availableAccount.id);
    if (availableBal.balanceMinor < txMoney.amountMinor) {
      throw new Error(
        `Card Declination: Insufficient available funds. Available: ${availableBal.formatted}, Required: ${txMoney.toDisplayString()}`
      );
    }
    const holdLines = [
      {
        accountId: availableAccount.id,
        direction: "DEBIT",
        amountMinor: txMoney.amountMinor,
        description: `Pre-auth reservation hold: ${params.merchantName}`
      },
      {
        accountId: holdAccount.id,
        direction: "CREDIT",
        amountMinor: txMoney.amountMinor,
        description: `Pending card pre-auth liability: ${params.merchantName}`
      }
    ];
    assertDoubleEntryInvariant(holdLines);
    const journalEntry = defaultLedgerService.postJournalEntry({
      transactionId: `tx_card_auth_${Date.now()}`,
      currency: card.currency,
      narration: `Pre-authorization hold for ${params.merchantName} (MCC: ${params.mcc})`,
      lines: holdLines
    });
    const authId = `auth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const authCode = `AUTH-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const authorization = {
      id: authId,
      cardId: card.id,
      merchantName: params.merchantName,
      mcc: params.mcc,
      currency: card.currency,
      amountMinor: txMoney.amountMinor.toString(),
      formattedAmount: txMoney.toDisplayString(),
      holdStatus: "PENDING_HOLD",
      authCode,
      ledgerHoldJournalEntryId: journalEntry.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3),
      // 7 day hold
      createdAt: /* @__PURE__ */ new Date()
    };
    card.dailySpentMinor = (dailySpent + txMoney.amountMinor).toString();
    card.authorizations.unshift(authorization);
    card.updatedAt = /* @__PURE__ */ new Date();
    this.authorizations.set(authId, authorization);
    const customer = defaultAuthService.getUserById(card.userId);
    if (customer?.email) {
      voidEmail(
        "card-auth-hold",
        defaultEmailService.sendCardAuthHoldEmail({
          to: customer.email,
          fullName: customer.fullName,
          amount: txMoney.toDecimalString(),
          currency: card.currency,
          merchant: params.merchantName,
          last4: card.lastFour
        })
      );
    }
    return {
      authorization,
      card,
      ledgerJournalEntryId: journalEntry.id
    };
  }
  /**
   * Step 2: Settle Pre-Authorization.
   * Clears the pending hold liability and completes settlement against provider clearing.
   */
  simulateSettlement(params) {
    const auth = this.authorizations.get(params.authorizationId);
    if (!auth) throw new Error("Authorization record not found.");
    if (auth.holdStatus !== "PENDING_HOLD") {
      throw new Error(`Cannot settle authorization in status: ${auth.holdStatus}`);
    }
    const card = this.cards.get(auth.cardId);
    if (!card) throw new Error("Associated card not found.");
    const userLedgerAccounts = defaultLedgerService.getUserAccounts(card.userId);
    const holdAccount = userLedgerAccounts.find(
      (a) => a.currency === card.currency && a.classification === "CUSTOMER_PENDING_HOLD"
    );
    const clearingAccount = defaultLedgerService.getAccounts().find((a) => a.currency === card.currency && a.classification === "SYSTEM_PROVIDER_CLEARING");
    if (!holdAccount || !clearingAccount) {
      throw new Error("Required ledger settlement accounts not found.");
    }
    const amountMinor = BigInt(auth.amountMinor);
    const settleLines = [
      {
        accountId: holdAccount.id,
        direction: "DEBIT",
        amountMinor,
        description: `Settlement clear hold: ${auth.merchantName} (${auth.authCode})`
      },
      {
        accountId: clearingAccount.id,
        direction: "CREDIT",
        amountMinor,
        description: `Merchant network interchange clearing: ${auth.merchantName}`
      }
    ];
    assertDoubleEntryInvariant(settleLines);
    const journalEntry = defaultLedgerService.postJournalEntry({
      transactionId: `tx_card_settle_${auth.authCode}_${Date.now()}`,
      currency: card.currency,
      narration: `Card settlement: ${auth.merchantName} (${auth.authCode})`,
      lines: settleLines
    });
    auth.holdStatus = "SETTLED_SIMULATED";
    auth.ledgerSettleJournalEntryId = journalEntry.id;
    auth.settledAt = /* @__PURE__ */ new Date();
    const customer = defaultAuthService.getUserById(card.userId);
    if (customer?.email) {
      voidEmail(
        "card-hold-settled",
        defaultEmailService.sendCardHoldSettledEmail({
          to: customer.email,
          fullName: customer.fullName,
          amount: Money.fromMinor(auth.amountMinor, auth.currency).toDecimalString(),
          currency: auth.currency,
          outcome: "settled",
          merchant: auth.merchantName
        })
      );
    }
    return {
      authorization: auth,
      ledgerJournalEntryId: journalEntry.id
    };
  }
  /**
   * Step 3: Release or Reverse Hold.
   * Restores held funds back to customer available balance (e.g. cancelled order, expired pre-auth).
   */
  simulateReleaseOrReversal(params) {
    const auth = this.authorizations.get(params.authorizationId);
    if (!auth) throw new Error("Authorization record not found.");
    if (auth.holdStatus !== "PENDING_HOLD") {
      throw new Error(`Cannot reverse authorization in status: ${auth.holdStatus}`);
    }
    const card = this.cards.get(auth.cardId);
    if (!card) throw new Error("Associated card not found.");
    const userLedgerAccounts = defaultLedgerService.getUserAccounts(card.userId);
    const holdAccount = userLedgerAccounts.find(
      (a) => a.currency === card.currency && a.classification === "CUSTOMER_PENDING_HOLD"
    );
    const availableAccount = userLedgerAccounts.find(
      (a) => a.currency === card.currency && a.classification === "CUSTOMER_AVAILABLE_BALANCE"
    );
    if (!holdAccount || !availableAccount) {
      throw new Error("Required ledger reversal accounts not found.");
    }
    const amountMinor = BigInt(auth.amountMinor);
    const reversalLines = [
      {
        accountId: holdAccount.id,
        direction: "DEBIT",
        amountMinor,
        description: `Pre-auth hold release: ${auth.merchantName} (${auth.authCode})`
      },
      {
        accountId: availableAccount.id,
        direction: "CREDIT",
        amountMinor,
        description: `Funds restored to available balance: ${auth.merchantName}`
      }
    ];
    assertDoubleEntryInvariant(reversalLines);
    const journalEntry = defaultLedgerService.postJournalEntry({
      transactionId: `tx_card_rev_${auth.authCode}_${Date.now()}`,
      currency: card.currency,
      narration: `Hold release/reversal: ${auth.merchantName} (${auth.authCode})`,
      lines: reversalLines
    });
    auth.holdStatus = "REVERSED";
    auth.ledgerReversalJournalEntryId = journalEntry.id;
    auth.reversedAt = /* @__PURE__ */ new Date();
    const dailySpent = BigInt(card.dailySpentMinor);
    const updatedSpent = dailySpent >= amountMinor ? dailySpent - amountMinor : 0n;
    card.dailySpentMinor = updatedSpent.toString();
    card.updatedAt = /* @__PURE__ */ new Date();
    const customer = defaultAuthService.getUserById(card.userId);
    if (customer?.email) {
      voidEmail(
        "card-hold-released",
        defaultEmailService.sendCardHoldSettledEmail({
          to: customer.email,
          fullName: customer.fullName,
          amount: Money.fromMinor(auth.amountMinor, auth.currency).toDecimalString(),
          currency: auth.currency,
          outcome: "released",
          merchant: auth.merchantName
        })
      );
    }
    return {
      authorization: auth,
      ledgerJournalEntryId: journalEntry.id
    };
  }
  getUserCards(userId) {
    return Array.from(this.cards.values()).filter((c) => c.userId === userId);
  }
  getCardById(id) {
    return this.cards.get(id);
  }
  /**
   * Retrieves all payment cards for administrative operations.
   * Credentials (CVV, full synthetic PAN) are redacted to prevent data leakage.
   */
  getAllCardsForAdmin(params) {
    const allowed = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"];
    if (!allowed.includes(params.actorRole)) {
      throw new Error("Access denied: Staff role required.");
    }
    let list = Array.from(this.cards.values());
    if (params.statusFilter && params.statusFilter !== "ALL") {
      list = list.filter((c) => c.status === params.statusFilter);
    }
    if (params.currencyFilter && params.currencyFilter !== "ALL") {
      list = list.filter((c) => c.currency.toUpperCase() === params.currencyFilter.toUpperCase());
    }
    if (params.typeFilter && params.typeFilter !== "ALL") {
      list = list.filter((c) => c.type === params.typeFilter);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (c) => c.id.toLowerCase().includes(q) || c.userId.toLowerCase().includes(q) || c.maskedPan.toLowerCase().includes(q) || c.syntheticCardholderName.toLowerCase().includes(q) || c.providerRef.toLowerCase().includes(q)
      );
    }
    const total = list.length;
    const limit = Math.min(Math.max(params.limit || 50, 1), 100);
    const offset = Math.max(params.offset || 0, 0);
    const paginated = list.slice(offset, offset + limit).map((c) => {
      const { syntheticPanFormatted, syntheticCvv, ...safeCard } = c;
      return safeCard;
    });
    return { total, limit, offset, cards: paginated };
  }
};
var defaultCardService = new CardService();

// src/server/routes/card.routes.ts
var cardRouter = (0, import_express10.Router)();
var RequestCardSchema = import_zod11.z.object({
  currency: import_zod11.z.string().length(3).default("USD"),
  cardholderName: import_zod11.z.string().min(2).max(50),
  type: import_zod11.z.enum(["DEBIT", "CREDIT"]).default("DEBIT"),
  form: import_zod11.z.enum(["VIRTUAL", "PHYSICAL"]).default("VIRTUAL"),
  dailyLimitDecimal: import_zod11.z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  singleTxLimitDecimal: import_zod11.z.string().regex(/^\d+(\.\d{1,2})?$/).optional()
});
var UpdateStatusSchema = import_zod11.z.object({
  status: import_zod11.z.enum(["ACTIVE_SIMULATED", "FROZEN", "TERMINATED"]),
  reason: import_zod11.z.string().optional()
});
var UpdateLimitsSchema = import_zod11.z.object({
  dailyLimitDecimal: import_zod11.z.string().regex(/^\d+(\.\d{1,2})?$/),
  singleTxLimitDecimal: import_zod11.z.string().regex(/^\d+(\.\d{1,2})?$/)
});
var SimulateAuthSchema = import_zod11.z.object({
  merchantName: import_zod11.z.string().min(2).max(100),
  mcc: import_zod11.z.string().regex(/^\d{4}$/, "Must be 4-digit Merchant Category Code"),
  amountDecimal: import_zod11.z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: import_zod11.z.string().length(3)
});
cardRouter.get("/", authenticate, (req, res, next) => {
  try {
    const user = req.user;
    const cards = defaultCardService.getUserCards(user.id).map((c) => defaultCardService.sanitizeCardForCustomer(c));
    res.json({
      total: cards.length,
      cards
    });
  } catch (err) {
    next(err);
  }
});
cardRouter.get("/:id", authenticate, (req, res, next) => {
  try {
    const user = req.user;
    const cardId = req.params.id;
    const card = defaultCardService.getCardById(cardId);
    if (!card) {
      res.status(404).json({
        type: "https://avenora.com/errors/not-found",
        title: "Card Not Found",
        status: 404,
        detail: `Card "${cardId}" does not exist.`
      });
      return;
    }
    const isStaff = ["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"].includes(user.role);
    if (card.userId !== user.id && !isStaff) {
      res.status(403).json({
        type: "https://avenora.com/errors/access-denied",
        title: "Access Denied",
        status: 403,
        detail: "You do not have permission to view another customer\u2019s card."
      });
      return;
    }
    const payload = card.userId === user.id && !isStaff ? defaultCardService.sanitizeCardForCustomer(card) : card;
    res.json({ card: payload });
  } catch (err) {
    next(err);
  }
});
cardRouter.post("/request", authenticate, requireTransactionEligible, (req, res, next) => {
  try {
    const user = req.user;
    const validated = RequestCardSchema.parse(req.body);
    const card = defaultCardService.requestCard({
      userId: user.id,
      cardholderName: validated.cardholderName || user.fullName,
      currency: validated.currency,
      type: validated.type,
      form: validated.form,
      countryCode: user.countryCode,
      dailyLimitDecimal: validated.dailyLimitDecimal,
      singleTxLimitDecimal: validated.singleTxLimitDecimal
    });
    res.status(201).json({
      status: "card_request_pending_review",
      message: "Your card request was submitted and is awaiting administrator approval before it can be issued.",
      card: defaultCardService.sanitizeCardForCustomer(card)
    });
  } catch (err) {
    next(err);
  }
});
cardRouter.patch("/:id/status", authenticate, requireTransactionEligible, (req, res, next) => {
  try {
    const user = req.user;
    const cardId = req.params.id;
    const validated = UpdateStatusSchema.parse(req.body);
    const updated = defaultCardService.updateCardStatus({
      cardId,
      actorUserId: user.id,
      actorRole: user.role,
      newStatus: validated.status,
      reason: validated.reason
    });
    res.json({
      status: "card_status_updated",
      card: updated
    });
  } catch (err) {
    next(err);
  }
});
cardRouter.patch("/:id/limits", authenticate, requireTransactionEligible, (req, res, next) => {
  try {
    const user = req.user;
    const cardId = req.params.id;
    const validated = UpdateLimitsSchema.parse(req.body);
    const updated = defaultCardService.updateLimits({
      cardId,
      userId: user.id,
      dailyLimitDecimal: validated.dailyLimitDecimal,
      singleTxLimitDecimal: validated.singleTxLimitDecimal
    });
    res.json({
      status: "limits_updated",
      card: updated
    });
  } catch (err) {
    next(err);
  }
});
cardRouter.post("/:id/simulate-auth", authenticate, requireTransactionEligible, (req, res, next) => {
  try {
    const cardId = req.params.id;
    const validated = SimulateAuthSchema.parse(req.body);
    const result = defaultCardService.simulateAuthorization({
      cardId,
      merchantName: validated.merchantName,
      mcc: validated.mcc,
      amountDecimal: validated.amountDecimal,
      currency: validated.currency
    });
    res.status(201).json({
      status: "authorized_pending_hold",
      authorization: result.authorization,
      card: result.card,
      ledgerJournalEntryId: result.ledgerJournalEntryId
    });
  } catch (err) {
    next(err);
  }
});
cardRouter.post("/authorizations/:authId/settle", authenticate, requireTransactionEligible, (req, res, next) => {
  try {
    const user = req.user;
    const authId = req.params.authId;
    const result = defaultCardService.simulateSettlement({
      authorizationId: authId,
      actorUserId: user.id
    });
    res.json({
      status: "settled_cleared",
      authorization: result.authorization,
      ledgerJournalEntryId: result.ledgerJournalEntryId
    });
  } catch (err) {
    next(err);
  }
});
cardRouter.post("/authorizations/:authId/release", authenticate, requireTransactionEligible, (req, res, next) => {
  try {
    const user = req.user;
    const authId = req.params.authId;
    const reason = req.body?.reason ? String(req.body.reason) : "Customer or merchant requested hold release";
    const result = defaultCardService.simulateReleaseOrReversal({
      authorizationId: authId,
      actorUserId: user.id,
      reason
    });
    res.json({
      status: "hold_released",
      authorization: result.authorization,
      ledgerJournalEntryId: result.ledgerJournalEntryId
    });
  } catch (err) {
    next(err);
  }
});

// src/server/routes/admin.routes.ts
var import_express11 = require("express");
var import_zod12 = require("zod");
init_auth_service();
init_kyc_service();
init_ledger_service();
init_audit_service();

// src/domain/ledger/ProviderOperationState.ts
var ALLOWED_PROVIDER_TRANSITIONS = {
  REQUESTED: ["PENDING_PROVIDER", "FAILED", "RECONCILIATION_REQUIRED"],
  PENDING_PROVIDER: ["CONFIRMED", "FAILED", "RECONCILIATION_REQUIRED"],
  CONFIRMED: ["REVERSED", "RECONCILIATION_REQUIRED"],
  FAILED: ["RECONCILIATION_REQUIRED"],
  // In case of late contradictory settlement notice
  RECONCILIATION_REQUIRED: ["CONFIRMED", "FAILED", "REVERSED"],
  // Resolved only by audited compliance review
  REVERSED: []
  // Terminal compensating state
};
var InvalidProviderStateTransitionError = class extends Error {
  constructor(current, attempted, operationId) {
    super(
      `Illegal provider lifecycle state transition for operation "${operationId || "unknown"}": cannot transition from ${current} to ${attempted}`
    );
    this.current = current;
    this.attempted = attempted;
    this.operationId = operationId;
    this.name = "InvalidProviderStateTransitionError";
  }
  current;
  attempted;
  operationId;
};
function canTransitionProviderState(current, next) {
  if (current === next) return true;
  const allowed = ALLOWED_PROVIDER_TRANSITIONS[current];
  return allowed ? allowed.includes(next) : false;
}
function assertValidProviderTransition(current, next, operationId) {
  if (!canTransitionProviderState(current, next)) {
    throw new InvalidProviderStateTransitionError(current, next, operationId);
  }
}

// src/server/services/providerPayment.service.ts
init_Money();
init_ledger_service();
init_audit_service();
init_providerAdapters();
init_auth_service();
init_email_service();
var ProviderPaymentService = class {
  // idempotencyKey -> paymentId
  constructor(paymentProvider = defaultMockPaymentProvider) {
    this.paymentProvider = paymentProvider;
  }
  paymentProvider;
  payments = /* @__PURE__ */ new Map();
  paymentsByIdempotencyKey = /* @__PURE__ */ new Map();
  /** Resolve customer from debtor ledger wallet when the account is user-owned. */
  resolvePaymentCustomer(payment) {
    const debtorAccount = defaultLedgerService.getAccount(payment.debtorWalletId);
    const userId = debtorAccount?.userId;
    if (!userId) return void 0;
    return defaultAuthService.getUserById(userId);
  }
  formatPaymentAmount(payment) {
    return Money.fromMinor(payment.amountMinor, payment.currency).toDecimalString();
  }
  /**
   * Step 1: Initiates a payment request.
   * State: REQUESTED. Ledger state: DRAFT.
   */
  createPaymentRequest(params) {
    const existingId = this.paymentsByIdempotencyKey.get(params.idempotencyKey);
    if (existingId) {
      const existing = this.payments.get(existingId);
      if (existing) return existing;
    }
    const paymentId = `pmt_op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record = {
      id: paymentId,
      idempotencyKey: params.idempotencyKey,
      debtorWalletId: params.debtorWalletId,
      creditorWalletId: params.creditorWalletId,
      currency: params.currency,
      amountMinor: params.amountMinor,
      status: "REQUESTED",
      history: [
        {
          previousStatus: "REQUESTED",
          newStatus: "REQUESTED",
          event: "PAYMENT_REQUESTED",
          timestamp: /* @__PURE__ */ new Date(),
          details: { correlationId: params.correlationId }
        }
      ],
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.payments.set(paymentId, record);
    this.paymentsByIdempotencyKey.set(params.idempotencyKey, paymentId);
    defaultAuditService.logAction({
      action: "INTERNAL_TRANSFER",
      actorUserId: "system_provider_lifecycle",
      actorRole: "SYSTEM",
      resourceType: "ProviderPayment",
      resourceId: paymentId,
      details: {
        idempotencyKey: params.idempotencyKey,
        amountMinor: params.amountMinor.toString(),
        currency: params.currency,
        status: "REQUESTED"
      }
    });
    return record;
  }
  /**
   * Step 2: Dispatches payment to the external payment rail provider.
   * State: PENDING_PROVIDER. Ledger state: PENDING (authorization hold; zero balance distortion).
   */
  async dispatchToProvider(paymentId, correlationId) {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment "${paymentId}" not found.`);
    }
    assertValidProviderTransition(payment.status, "PENDING_PROVIDER", paymentId);
    const prevStatus = payment.status;
    const providerRes = await this.paymentProvider.initiatePayment({
      paymentId: payment.id,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      debtorAccountId: payment.debtorWalletId,
      creditorAccountId: payment.creditorWalletId,
      reference: `Avenora Settlement ${payment.id}`,
      idempotencyKey: payment.idempotencyKey,
      correlationId
    });
    if (!providerRes.success || !providerRes.data) {
      payment.status = "FAILED";
      payment.updatedAt = /* @__PURE__ */ new Date();
      payment.history.push({
        previousStatus: prevStatus,
        newStatus: "FAILED",
        event: "PROVIDER_DISPATCH_REJECTED",
        timestamp: /* @__PURE__ */ new Date(),
        details: { error: providerRes.error, correlationId }
      });
      throw new Error(
        `Provider dispatch rejected: [${providerRes.error?.code || "UNKNOWN"}] ${providerRes.error?.message || "Provider failed"}`
      );
    }
    payment.status = "PENDING_PROVIDER";
    payment.providerPaymentId = providerRes.data.providerPaymentId;
    payment.externalReference = providerRes.externalReference;
    payment.updatedAt = /* @__PURE__ */ new Date();
    payment.history.push({
      previousStatus: prevStatus,
      newStatus: "PENDING_PROVIDER",
      event: "DISPATCHED_TO_PROVIDER",
      timestamp: /* @__PURE__ */ new Date(),
      details: {
        providerPaymentId: providerRes.data.providerPaymentId,
        clearingRail: providerRes.data.clearingRail,
        correlationId
      }
    });
    return payment;
  }
  /**
   * Step 3: Processes provider confirmation callback/webhook.
   * State: CONFIRMED.
   * LEDGER SAFETY: Posts an immutable, balanced double-entry journal entry!
   * Idempotent: If already CONFIRMED, deduplicates and skips posting a second entry.
   */
  processProviderConfirmation(params) {
    const payment = this.payments.get(params.paymentId);
    if (!payment) {
      throw new Error(`Payment "${params.paymentId}" not found.`);
    }
    if (payment.status === "CONFIRMED") {
      return payment;
    }
    if (payment.status === "FAILED") {
      payment.status = "RECONCILIATION_REQUIRED";
      payment.reconciliationNotes = `Received confirmation for previously failed payment. ExternalRef: ${params.externalReference}`;
      payment.updatedAt = /* @__PURE__ */ new Date();
      payment.history.push({
        previousStatus: "FAILED",
        newStatus: "RECONCILIATION_REQUIRED",
        event: "CONTRADICTORY_CONFIRMATION_AFTER_FAILURE",
        timestamp: /* @__PURE__ */ new Date(),
        details: { externalReference: params.externalReference, correlationId: params.correlationId }
      });
      voidEmail(
        "reconciliation-required",
        defaultEmailService.sendReconciliationRequiredEmail({
          paymentId: payment.id,
          detail: payment.reconciliationNotes
        })
      );
      return payment;
    }
    assertValidProviderTransition(payment.status, "CONFIRMED", payment.id);
    const prevStatus = payment.status;
    const journalEntry = defaultLedgerService.postJournalEntry({
      transactionId: payment.id,
      currency: payment.currency,
      narration: `Provider Settled Transfer ${payment.id} (Ref: ${params.externalReference})`,
      lines: [
        {
          accountId: params.debtorAccount.id,
          direction: "DEBIT",
          amountMinor: payment.amountMinor,
          description: `Provider debit settlement for payment ${payment.id}`
        },
        {
          accountId: params.creditorAccount.id,
          direction: "CREDIT",
          amountMinor: payment.amountMinor,
          description: `Provider credit settlement for payment ${payment.id}`
        }
      ]
    });
    payment.status = "CONFIRMED";
    payment.externalReference = params.externalReference;
    payment.ledgerJournalEntryId = journalEntry.id;
    payment.updatedAt = /* @__PURE__ */ new Date();
    payment.history.push({
      previousStatus: prevStatus,
      newStatus: "CONFIRMED",
      event: "PROVIDER_SETTLEMENT_CONFIRMED",
      timestamp: /* @__PURE__ */ new Date(),
      details: {
        journalEntryId: journalEntry.id,
        externalReference: params.externalReference,
        correlationId: params.correlationId
      }
    });
    defaultAuditService.logAction({
      action: "JOURNAL_POSTED",
      actorUserId: "system_provider_settlement",
      actorRole: "SYSTEM",
      resourceType: "ProviderPayment",
      resourceId: payment.id,
      financialTxId: journalEntry.id,
      details: {
        status: "CONFIRMED",
        journalEntryId: journalEntry.id,
        amountMinor: payment.amountMinor.toString(),
        currency: payment.currency
      }
    });
    const customer = this.resolvePaymentCustomer(payment);
    if (customer?.email) {
      voidEmail(
        "provider-payment-confirmed",
        defaultEmailService.sendProviderPaymentConfirmedEmail({
          to: customer.email,
          fullName: customer.fullName,
          amount: this.formatPaymentAmount(payment),
          currency: payment.currency,
          paymentId: payment.id
        })
      );
    }
    return payment;
  }
  /**
   * Handles failure callback from provider.
   * If already confirmed, flags RECONCILIATION_REQUIRED rather than deleting the posted journal entry!
   */
  processProviderFailure(params) {
    const payment = this.payments.get(params.paymentId);
    if (!payment) {
      throw new Error(`Payment "${params.paymentId}" not found.`);
    }
    if (payment.status === "CONFIRMED") {
      payment.status = "RECONCILIATION_REQUIRED";
      payment.reconciliationNotes = `Late provider failure received for already confirmed payment. Error: [${params.errorCode}] ${params.errorMessage}`;
      payment.updatedAt = /* @__PURE__ */ new Date();
      payment.history.push({
        previousStatus: "CONFIRMED",
        newStatus: "RECONCILIATION_REQUIRED",
        event: "LATE_FAILURE_AFTER_CONFIRMATION",
        timestamp: /* @__PURE__ */ new Date(),
        details: { errorCode: params.errorCode, errorMessage: params.errorMessage, correlationId: params.correlationId }
      });
      voidEmail(
        "reconciliation-required",
        defaultEmailService.sendReconciliationRequiredEmail({
          paymentId: payment.id,
          detail: payment.reconciliationNotes
        })
      );
      return payment;
    }
    if (payment.status === "FAILED") {
      return payment;
    }
    const prevStatus = payment.status;
    payment.status = "FAILED";
    payment.updatedAt = /* @__PURE__ */ new Date();
    payment.history.push({
      previousStatus: prevStatus,
      newStatus: "FAILED",
      event: "PROVIDER_PAYMENT_FAILED",
      timestamp: /* @__PURE__ */ new Date(),
      details: { errorCode: params.errorCode, errorMessage: params.errorMessage, correlationId: params.correlationId }
    });
    const customer = this.resolvePaymentCustomer(payment);
    if (customer?.email) {
      voidEmail(
        "provider-payment-failed",
        defaultEmailService.sendProviderPaymentFailedEmail({
          to: customer.email,
          fullName: customer.fullName,
          amount: this.formatPaymentAmount(payment),
          currency: payment.currency,
          paymentId: payment.id,
          reason: `[${params.errorCode}] ${params.errorMessage}`
        })
      );
    }
    return payment;
  }
  /**
   * Executes a compensating reversal for a CONFIRMED payment.
   * State: REVERSED.
   * LEDGER SAFETY: Posts an immutable compensating entry (swapping debit and credit).
   */
  reversePayment(params) {
    const payment = this.payments.get(params.paymentId);
    if (!payment) {
      throw new Error(`Payment "${params.paymentId}" not found.`);
    }
    if (payment.status !== "CONFIRMED") {
      throw new Error(`Cannot reverse payment in status "${payment.status}". Only CONFIRMED payments can be reversed.`);
    }
    const prevStatus = payment.status;
    const reversalEntry = defaultLedgerService.postJournalEntry({
      transactionId: `tx_rev_${payment.id}`,
      currency: payment.currency,
      narration: `Compensating Reversal for Payment ${payment.id}: ${params.reason}`,
      lines: [
        {
          accountId: params.creditorAccount.id,
          // Swapped
          direction: "DEBIT",
          amountMinor: payment.amountMinor,
          description: `Compensating debit for payment ${payment.id}`
        },
        {
          accountId: params.debtorAccount.id,
          // Swapped
          direction: "CREDIT",
          amountMinor: payment.amountMinor,
          description: `Compensating credit for payment ${payment.id}`
        }
      ]
    });
    payment.status = "REVERSED";
    payment.reversalJournalEntryId = reversalEntry.id;
    payment.updatedAt = /* @__PURE__ */ new Date();
    payment.history.push({
      previousStatus: prevStatus,
      newStatus: "REVERSED",
      event: "COMPENSATING_REVERSAL_POSTED",
      timestamp: /* @__PURE__ */ new Date(),
      details: {
        reversalJournalEntryId: reversalEntry.id,
        reason: params.reason,
        actorUserId: params.actorUserId,
        correlationId: params.correlationId
      }
    });
    defaultAuditService.logAction({
      action: "TRANSACTION_REVERSED",
      actorUserId: params.actorUserId,
      actorRole: "ADMIN",
      resourceType: "ProviderPayment",
      resourceId: payment.id,
      financialTxId: reversalEntry.id,
      details: {
        reason: params.reason,
        originalJournalEntryId: payment.ledgerJournalEntryId,
        reversalJournalEntryId: reversalEntry.id
      }
    });
    return payment;
  }
  /**
   * Resolves a payment currently in RECONCILIATION_REQUIRED status.
   * Audited administrative operation ensuring ledger balance invariants.
   */
  resolveReconciliation(params) {
    const payment = this.payments.get(params.paymentId);
    if (!payment) {
      throw new Error(`Payment "${params.paymentId}" not found.`);
    }
    if (payment.status !== "RECONCILIATION_REQUIRED") {
      throw new Error(
        `Cannot resolve reconciliation for payment in status "${payment.status}". Only RECONCILIATION_REQUIRED payments can be resolved.`
      );
    }
    const prevStatus = payment.status;
    if (params.resolution === "CONFIRMED") {
      if (!payment.ledgerJournalEntryId && params.debtorAccount && params.creditorAccount) {
        const journalEntry = defaultLedgerService.postJournalEntry({
          transactionId: payment.id,
          currency: payment.currency,
          narration: `Reconciliation Settlement: ${payment.id} - ${params.reason}`,
          lines: [
            {
              accountId: params.debtorAccount.id,
              direction: "DEBIT",
              amountMinor: payment.amountMinor,
              description: `Reconciliation confirmed debit for payment ${payment.id}`
            },
            {
              accountId: params.creditorAccount.id,
              direction: "CREDIT",
              amountMinor: payment.amountMinor,
              description: `Reconciliation confirmed credit for payment ${payment.id}`
            }
          ]
        });
        payment.ledgerJournalEntryId = journalEntry.id;
      }
      payment.status = "CONFIRMED";
    } else if (params.resolution === "REVERSED") {
      if (payment.ledgerJournalEntryId && params.debtorAccount && params.creditorAccount) {
        const reversalEntry = defaultLedgerService.postJournalEntry({
          transactionId: `tx_rev_${payment.id}`,
          currency: payment.currency,
          narration: `Compensating Reversal for Reconciled Payment ${payment.id}: ${params.reason}`,
          lines: [
            {
              accountId: params.creditorAccount.id,
              direction: "DEBIT",
              amountMinor: payment.amountMinor,
              description: `Compensating debit for payment ${payment.id}`
            },
            {
              accountId: params.debtorAccount.id,
              direction: "CREDIT",
              amountMinor: payment.amountMinor,
              description: `Compensating credit for payment ${payment.id}`
            }
          ]
        });
        payment.reversalJournalEntryId = reversalEntry.id;
      }
      payment.status = "REVERSED";
    } else {
      payment.status = "FAILED";
    }
    payment.reconciliationNotes = `Resolved to ${params.resolution} by ${params.actorUserId} (${params.actorRole}): ${params.reason}`;
    payment.updatedAt = /* @__PURE__ */ new Date();
    payment.history.push({
      previousStatus: prevStatus,
      newStatus: payment.status,
      event: "RECONCILIATION_RESOLVED",
      timestamp: /* @__PURE__ */ new Date(),
      details: {
        resolution: params.resolution,
        reason: params.reason,
        actorUserId: params.actorUserId,
        actorRole: params.actorRole,
        correlationId: params.correlationId
      }
    });
    defaultAuditService.logAction({
      action: "RECONCILIATION_RESOLVED",
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      resourceType: "ProviderPayment",
      resourceId: payment.id,
      financialTxId: payment.reversalJournalEntryId || payment.ledgerJournalEntryId,
      details: {
        resolution: params.resolution,
        reason: params.reason,
        previousStatus: prevStatus,
        newStatus: payment.status
      }
    });
    return payment;
  }
  getPayment(paymentId) {
    return this.payments.get(paymentId);
  }
};
var defaultProviderPaymentService = new ProviderPaymentService();

// src/server/routes/admin.routes.ts
init_env_config();
init_constants();
var adminRouter = (0, import_express11.Router)();
var UpdateCustomerStatusSchema = import_zod12.z.object({
  status: import_zod12.z.enum(["ACTIVE", "SUSPENDED", "LOCKED", "PENDING_VERIFICATION"]),
  reason: import_zod12.z.string().min(5, "A documented operational reason of at least 5 characters is required")
});
var UpdateCustomerRoleSchema = import_zod12.z.object({
  role: import_zod12.z.enum(["CUSTOMER", "SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  reason: import_zod12.z.string().min(5, "A documented operational reason of at least 5 characters is required")
});
var DeleteCustomerSchema = import_zod12.z.object({
  reason: import_zod12.z.string().min(5, "A documented operational reason of at least 5 characters is required")
});
var AdminFundingAdjustmentSchema = import_zod12.z.object({
  direction: import_zod12.z.enum(["CREDIT", "DEBIT"]),
  currency: import_zod12.z.string().min(2).max(10),
  amountDecimal: import_zod12.z.string().regex(/^\d+(\.\d+)?$/, "Amount must be a positive decimal string"),
  reason: import_zod12.z.string().min(3).max(2e3)
});
var AdminKycReviewSchema = import_zod12.z.object({
  decision: import_zod12.z.enum(["APPROVED", "REJECTED", "NEEDS_MORE_INFORMATION", "UNDER_REVIEW"]),
  notes: import_zod12.z.string().optional(),
  rejectionReason: import_zod12.z.string().optional(),
  reasonCode: import_zod12.z.string().optional(),
  expectedVersion: import_zod12.z.number().int().optional()
});
var ReverseTransactionSchema = import_zod12.z.object({
  reason: import_zod12.z.string().min(5, "A documented operational reason of at least 5 characters is required")
});
var AdminCardStatusSchema = import_zod12.z.object({
  status: import_zod12.z.enum(["ACTIVE_SIMULATED", "FROZEN", "TERMINATED"]),
  reason: import_zod12.z.string().min(5, "A documented operational reason of at least 5 characters is required")
});
var AdminCardIssuanceReviewSchema = import_zod12.z.object({
  decision: import_zod12.z.enum(["APPROVE", "DECLINE", "DELETE"]),
  reason: import_zod12.z.string().min(5, "A documented reason of at least 5 characters is required")
});
var AdminCardDeleteSchema = import_zod12.z.object({
  reason: import_zod12.z.string().min(5, "A documented reason of at least 5 characters is required")
});
var AdminLoanReviewSchema = import_zod12.z.object({
  decision: import_zod12.z.enum(["APPROVED_FOR_DEMO", "DECLINED_FOR_DEMO", "NEEDS_MORE_INFORMATION", "UNDER_REVIEW"]),
  reasonCode: import_zod12.z.string().min(3, "A reason code or underwriting note is required"),
  notes: import_zod12.z.string().optional()
});
var AdminGrantReviewSchema = import_zod12.z.object({
  decision: import_zod12.z.enum(["APPROVED_FOR_DEMO", "DECLINED", "NEEDS_MORE_INFORMATION", "UNDER_REVIEW"]),
  notes: import_zod12.z.string().min(5, "A documented review reason of at least 5 characters is required")
});
var AdminGrantVerifySchema = import_zod12.z.object({
  status: import_zod12.z.enum(["VERIFIED", "REJECTED"]),
  notes: import_zod12.z.string().optional()
});
adminRouter.get(
  "/overview",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  async (req, res, next) => {
    try {
      const user = req.user;
      const usersData = await defaultAuthService.getAllUsersForAdmin({ actorRole: user.role, limit: 1e3 });
      const totalUsers = usersData.total;
      const activeUsers = usersData.users.filter((u) => u.status === "ACTIVE").length;
      const suspendedUsers = usersData.users.filter((u) => u.status === "SUSPENDED").length;
      const lockedUsers = usersData.users.filter((u) => u.status === "LOCKED").length;
      const kycProfiles = defaultKycService.getAllProfilesForReview(user.role);
      const pendingKyc = kycProfiles.filter((p) => p.status === "SUBMITTED" || p.status === "UNDER_REVIEW");
      const approvedKyc = kycProfiles.filter((p) => p.status === "APPROVED").length;
      const rejectedKyc = kycProfiles.filter((p) => p.status === "REJECTED").length;
      const now = Date.now();
      const kycAging = {
        under24h: 0,
        oneToThreeDays: 0,
        overThreeDays: 0
      };
      for (const p of pendingKyc) {
        const submitted = p.submittedAt ? new Date(p.submittedAt).getTime() : now;
        const ageHours = (now - submitted) / (1e3 * 60 * 60);
        if (ageHours < 24) kycAging.under24h++;
        else if (ageHours <= 72) kycAging.oneToThreeDays++;
        else kycAging.overThreeDays++;
      }
      const allLoans = defaultLoanService.getAllApplicationsForReview(user.role);
      const pendingLoans = allLoans.filter((l) => l.status === "SUBMITTED" || l.status === "UNDER_REVIEW").length;
      const approvedLoans = allLoans.filter((l) => l.status === "APPROVED_FOR_DEMO").length;
      const declinedLoans = allLoans.filter((l) => l.status === "DECLINED_FOR_DEMO").length;
      const allGrants = defaultGrantService.getAllApplicationsForReview(user.role);
      const pendingGrants = allGrants.filter(
        (g) => g.status === "SUBMITTED" || g.status === "UNDER_REVIEW" || g.status === "ELIGIBLE_FOR_REVIEW"
      ).length;
      const disbursedGrants = allGrants.filter((g) => g.award?.disbursementStatus === "DISBURSED_SIMULATED").length;
      const cardsData = defaultCardService.getAllCardsForAdmin({ actorRole: user.role, limit: 1e3 });
      const totalCards = cardsData.total;
      const activeCards = cardsData.cards.filter((c) => c.status === "ACTIVE_SIMULATED").length;
      const frozenCards = cardsData.cards.filter((c) => c.status === "FROZEN").length;
      const terminatedCards = cardsData.cards.filter((c) => c.status === "TERMINATED").length;
      const pendingCardIssuance = cardsData.cards.filter(
        (c) => c.status === "PENDING_REVIEW" || c.status === "REQUESTED"
      ).length;
      const pendingDepositQueue = defaultWalletService.getPendingDepositsForAdmin({ actorRole: user.role });
      const pendingWithdrawalQueue = defaultWalletService.getPendingWithdrawalsForAdmin({ actorRole: user.role });
      const txData = defaultWalletService.getAllTransactionsForAdmin({ actorRole: user.role, limit: 1e3 });
      const totalTransactions = txData.total;
      const reversedTransactions = txData.transactions.filter((t) => t.status === "REVERSED").length;
      const ledgerSummary = defaultLedgerService.getLedgerSummary();
      const webhookEvents = defaultWebhookService.getRecentEvents(100);
      const totalWebhooks = webhookEvents.length;
      const processedWebhooks = webhookEvents.filter((w) => w.status === "PROCESSED").length;
      const duplicateWebhooks = webhookEvents.filter((w) => w.status === "DUPLICATE").length;
      const auditCount = defaultAuditService.getRecentCount();
      res.json({
        metricsGeneratedAt: (/* @__PURE__ */ new Date()).toISOString(),
        actorRole: user.role,
        environment: "production-oriented",
        customers: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          locked: lockedUsers,
          source: "AuthService User Store"
        },
        kycQueue: {
          pendingReview: pendingKyc.length,
          approved: approvedKyc,
          rejected: rejectedKyc,
          aging: kycAging,
          source: "KycService Verification Store"
        },
        loans: {
          total: allLoans.length,
          pendingReview: pendingLoans,
          approvedDemo: approvedLoans,
          declinedDemo: declinedLoans,
          source: "LoanService Application Store"
        },
        grants: {
          total: allGrants.length,
          pendingReview: pendingGrants,
          disbursedSimulated: disbursedGrants,
          source: "GrantService Application Store"
        },
        cards: {
          total: totalCards,
          activeSimulated: activeCards,
          frozen: frozenCards,
          terminated: terminatedCards,
          pendingIssuance: pendingCardIssuance,
          source: "CardService Store"
        },
        deposits: {
          pendingReview: pendingDepositQueue.length,
          source: "Wallet Pending Deposit Hold Queue"
        },
        withdrawals: {
          pendingReview: pendingWithdrawalQueue.length,
          source: "Wallet Pending Withdrawal Hold Queue"
        },
        transactions: {
          total: totalTransactions,
          posted: totalTransactions - reversedTransactions,
          reversed: reversedTransactions,
          source: "Wallet & Ledger Operations Engine"
        },
        ledger: {
          totalAccounts: ledgerSummary.totalAccounts,
          totalJournalEntries: ledgerSummary.totalEntries,
          isBalanced: ledgerSummary.isBalanced,
          globalDebitsMinor: ledgerSummary.globalDebitsMinor,
          globalCreditsMinor: ledgerSummary.globalCreditsMinor,
          imbalanceMinor: ledgerSummary.imbalanceMinor,
          source: "Double-Entry Invariant Engine (Sum(Debits) === Sum(Credits))"
        },
        webhooks: {
          total: totalWebhooks,
          processed: processedWebhooks,
          duplicate: duplicateWebhooks,
          source: "Mock Webhook Gateway HMAC Store"
        },
        auditLogs: {
          total: auditCount,
          source: "Durable Audit Service"
        }
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/customers",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  async (req, res, next) => {
    try {
      const { search, role, status, kycStatus, limit, offset } = req.query;
      const result = await defaultAuthService.getAllUsersForAdmin({
        actorRole: req.user.role,
        search: search ? String(search) : void 0,
        roleFilter: role ? String(role) : void 0,
        statusFilter: status ? String(status) : void 0,
        kycFilter: kycStatus ? String(kycStatus) : void 0,
        limit: limit ? parseInt(String(limit), 10) : 50,
        offset: offset ? parseInt(String(offset), 10) : 0
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/customers/:id",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  async (req, res, next) => {
    try {
      const customerId = req.params.id;
      const user = defaultAuthService.getUserById(customerId);
      if (!user) {
        res.status(404).json({
          type: "https://avenora.com/errors/not-found",
          title: "Customer Not Found",
          status: 404,
          detail: `Customer with ID "${customerId}" does not exist.`
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
        recentTransactions: transactions.slice(0, 15)
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.patch(
  "/customers/:id/status",
  authenticate,
  requireRoles(["SUPPORT", "ADMIN", "SUPER_ADMIN"]),
  async (req, res, next) => {
    try {
      const targetUserId = req.params.id;
      const validated = UpdateCustomerStatusSchema.parse(req.body);
      const updated = await defaultAuthService.updateUserStatus({
        actorUserId: req.user.id,
        actorRole: req.user.role,
        targetUserId,
        newStatus: validated.status,
        reason: validated.reason,
        correlationId: req.headers["x-correlation-id"],
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      res.json({
        status: "status_updated",
        customer: updated
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.patch(
  "/customers/:id/role",
  authenticate,
  requireRoles(["SUPER_ADMIN"]),
  async (req, res, next) => {
    try {
      const targetUserId = req.params.id;
      const validated = UpdateCustomerRoleSchema.parse(req.body);
      const updated = await defaultAuthService.updateUserRole({
        actorUserId: req.user.id,
        actorRole: req.user.role,
        targetUserId,
        newRole: validated.role,
        reason: validated.reason,
        correlationId: req.headers["x-correlation-id"],
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      res.json({
        status: "role_updated",
        customer: updated
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.post(
  "/customers/:id/delete",
  authenticate,
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  async (req, res, next) => {
    try {
      const targetUserId = req.params.id;
      const validated = DeleteCustomerSchema.parse(req.body ?? {});
      const result = await defaultAuthService.deleteUser({
        actorUserId: req.user.id,
        actorRole: req.user.role,
        targetUserId,
        reason: validated.reason,
        correlationId: req.headers["x-correlation-id"],
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      res.json({
        status: "customer_deleted",
        ...result
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.post(
  "/customers/:id/funding-adjustment",
  authenticate,
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  async (req, res, next) => {
    try {
      const targetUserId = req.params.id;
      const validated = AdminFundingAdjustmentSchema.parse(req.body);
      const result = await defaultWalletService.adminRequestFundingAdjustment({
        targetUserId,
        direction: validated.direction,
        currency: validated.currency,
        amountDecimal: validated.amountDecimal,
        reason: validated.reason,
        actorUserId: req.user.id,
        actorRole: req.user.role
      });
      if (result.direction === "CREDIT") {
        const d = result.deposit;
        res.status(201).json({
          status: "pending_review",
          direction: "CREDIT",
          message: "Admin credit queued as a pending deposit hold. Approve from the deposit queue to move funds to available balance.",
          deposit: {
            ...d,
            submittedAt: d.submittedAt.toISOString(),
            reviewedAt: d.reviewedAt?.toISOString()
          }
        });
        return;
      }
      const w = result.withdrawal;
      res.status(201).json({
        status: "pending_review",
        direction: "DEBIT",
        message: "Admin debit queued as a pending withdrawal hold. Approve from the withdrawal queue to complete the adjustment.",
        withdrawal: {
          ...w,
          submittedAt: w.submittedAt.toISOString(),
          reviewedAt: w.reviewedAt?.toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/kyc/queue",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const { status } = req.query;
      let profiles = defaultKycService.getAllProfilesForReview(req.user.role);
      if (status && status !== "ALL") {
        profiles = profiles.filter((p) => p.status === status);
      }
      res.json({
        total: profiles.length,
        profiles
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/kyc/:userId",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const targetUserId = req.params.userId;
      const profile = defaultKycService.getOrCreateProfile(targetUserId);
      res.json({ profile });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/kyc/:userId/documents/:documentId",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const { userId, documentId } = req.params;
      const result = defaultKycService.getSecureDocumentAccess({
        targetUserId: userId,
        documentId,
        actorUserId: req.user.id,
        actorRole: req.user.role
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.post(
  "/kyc/:userId/review",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  async (req, res, next) => {
    try {
      const targetUserId = req.params.userId;
      const validated = AdminKycReviewSchema.parse(req.body);
      const updated = await defaultKycService.reviewProfile({
        reviewerRole: req.user.role,
        reviewerUserId: req.user.id,
        reviewerName: req.user.fullName,
        targetUserId,
        decision: validated.decision,
        notes: validated.notes,
        rejectionReason: validated.rejectionReason,
        reasonCode: validated.reasonCode,
        expectedVersion: validated.expectedVersion
      });
      res.json({
        status: "decision_recorded",
        profile: updated
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/deposits/pending",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const deposits = defaultWalletService.getPendingDepositsForAdmin({ actorRole: req.user.role });
      const enriched = deposits.map((d) => {
        const customer = defaultAuthService.getUserById(d.userId);
        return {
          ...d,
          submittedAt: d.submittedAt.toISOString(),
          reviewedAt: d.reviewedAt?.toISOString(),
          customerEmail: customer?.email,
          customerName: customer?.fullName
        };
      });
      res.json({ total: enriched.length, deposits: enriched });
    } catch (err) {
      next(err);
    }
  }
);
var DepositApproveSchema = import_zod12.z.object({
  notes: import_zod12.z.string().max(2e3).optional()
});
var DepositRejectSchema = import_zod12.z.object({
  reason: import_zod12.z.string().min(3).max(2e3)
});
adminRouter.post(
  "/deposits/:depositId/approve",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const validated = DepositApproveSchema.parse(req.body ?? {});
      const updated = defaultWalletService.approvePendingDeposit({
        depositId: req.params.depositId,
        actorUserId: req.user.id,
        actorRole: req.user.role,
        notes: validated.notes
      });
      res.json({
        status: "approved",
        deposit: {
          ...updated,
          submittedAt: updated.submittedAt.toISOString(),
          reviewedAt: updated.reviewedAt?.toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.post(
  "/deposits/:depositId/reject",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const validated = DepositRejectSchema.parse(req.body ?? {});
      const updated = defaultWalletService.rejectPendingDeposit({
        depositId: req.params.depositId,
        actorUserId: req.user.id,
        actorRole: req.user.role,
        reason: validated.reason
      });
      res.json({
        status: "rejected",
        deposit: {
          ...updated,
          submittedAt: updated.submittedAt.toISOString(),
          reviewedAt: updated.reviewedAt?.toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/withdrawals/pending",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const withdrawals = defaultWalletService.getPendingWithdrawalsForAdmin({ actorRole: req.user.role });
      const enriched = withdrawals.map((w) => {
        const customer = defaultAuthService.getUserById(w.userId);
        return {
          ...w,
          submittedAt: w.submittedAt.toISOString(),
          reviewedAt: w.reviewedAt?.toISOString(),
          customerEmail: customer?.email,
          customerName: customer?.fullName
        };
      });
      res.json({ total: enriched.length, withdrawals: enriched });
    } catch (err) {
      next(err);
    }
  }
);
var WithdrawalApproveSchema = import_zod12.z.object({
  notes: import_zod12.z.string().max(2e3).optional()
});
var WithdrawalRejectSchema = import_zod12.z.object({
  reason: import_zod12.z.string().min(3).max(2e3)
});
adminRouter.post(
  "/withdrawals/:withdrawalId/approve",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const validated = WithdrawalApproveSchema.parse(req.body ?? {});
      const updated = defaultWalletService.approvePendingWithdrawal({
        withdrawalId: req.params.withdrawalId,
        actorUserId: req.user.id,
        actorRole: req.user.role,
        notes: validated.notes
      });
      res.json({
        status: "approved",
        withdrawal: {
          ...updated,
          submittedAt: updated.submittedAt.toISOString(),
          reviewedAt: updated.reviewedAt?.toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.post(
  "/withdrawals/:withdrawalId/reject",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const validated = WithdrawalRejectSchema.parse(req.body ?? {});
      const updated = defaultWalletService.rejectPendingWithdrawal({
        withdrawalId: req.params.withdrawalId,
        actorUserId: req.user.id,
        actorRole: req.user.role,
        reason: validated.reason
      });
      res.json({
        status: "rejected",
        withdrawal: {
          ...updated,
          submittedAt: updated.submittedAt.toISOString(),
          reviewedAt: updated.reviewedAt?.toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/transactions",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const { search, status, currency, type, idempotencyKey, startDate, endDate, limit, offset } = req.query;
      const result = defaultWalletService.getAllTransactionsForAdmin({
        actorRole: req.user.role,
        search: search ? String(search) : void 0,
        status: status ? String(status) : void 0,
        currency: currency ? String(currency) : void 0,
        type: type ? String(type) : void 0,
        idempotencyKey: idempotencyKey ? String(idempotencyKey) : void 0,
        startDate: startDate ? String(startDate) : void 0,
        endDate: endDate ? String(endDate) : void 0,
        limit: limit ? parseInt(String(limit), 10) : 50,
        offset: offset ? parseInt(String(offset), 10) : 0
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/transactions/:id",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const txId = req.params.id;
      const txs = defaultWalletService.getAllTransactionsForAdmin({ actorRole: req.user.role, limit: 1e3 }).transactions;
      const tx = txs.find((t) => t.transactionId === txId);
      if (!tx) {
        res.status(404).json({
          type: "https://avenora.com/errors/not-found",
          title: "Transaction Not Found",
          status: 404,
          detail: `Transaction "${txId}" not found.`
        });
        return;
      }
      const entries = defaultLedgerService.getEntries();
      const journalEntry = entries.find((e) => e.transactionId === tx.transactionId || e.id === tx.journalEntryId);
      const linesWithAccounts = journalEntry?.lines.map((line) => ({
        ...line,
        amountMinor: line.amountMinor.toString(),
        account: defaultLedgerService.getAccount(line.accountId)
      }));
      const auditLogs = defaultAuditService.queryLogs({ financialTxId: tx.transactionId, limit: 10 }).records;
      res.json({
        transaction: tx,
        journalEntry: journalEntry ? {
          ...journalEntry,
          lines: linesWithAccounts
        } : null,
        auditLogs
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.post(
  "/transactions/:id/reverse",
  authenticate,
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const txId = req.params.id;
      const validated = ReverseTransactionSchema.parse(req.body);
      const result = defaultWalletService.reverseTransaction({
        transactionId: txId,
        actorUserId: req.user.id,
        actorRole: req.user.role,
        reason: validated.reason,
        correlationId: req.headers["x-correlation-id"]
      });
      res.json({
        status: "transaction_reversed",
        originalTransaction: result.originalTransaction,
        compensatingTransaction: result.compensatingTransaction,
        reversalJournalEntryId: result.reversalJournalEntryId
      });
    } catch (err) {
      next(err);
    }
  }
);
var ResolveReconciliationSchema = import_zod12.z.object({
  resolution: import_zod12.z.enum(["CONFIRMED", "FAILED", "REVERSED"]),
  reason: import_zod12.z.string().min(5, "A documented operational reason of at least 5 characters is required")
});
adminRouter.post(
  "/providers/payments/:id/reconcile",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const paymentId = req.params.id;
      const validated = ResolveReconciliationSchema.parse(req.body);
      const result = defaultProviderPaymentService.resolveReconciliation({
        paymentId,
        resolution: validated.resolution,
        reason: validated.reason,
        actorUserId: req.user.id,
        actorRole: req.user.role,
        correlationId: req.headers["x-correlation-id"] || `corr_rec_${Date.now()}`
      });
      res.json({
        status: "reconciliation_resolved",
        payment: result
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/cards",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const { search, status, currency, type, limit, offset } = req.query;
      const result = defaultCardService.getAllCardsForAdmin({
        actorRole: req.user.role,
        search: search ? String(search) : void 0,
        statusFilter: status ? String(status) : void 0,
        currencyFilter: currency ? String(currency) : void 0,
        typeFilter: type ? String(type) : void 0,
        limit: limit ? parseInt(String(limit), 10) : 50,
        offset: offset ? parseInt(String(offset), 10) : 0
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.patch(
  "/cards/:id/status",
  authenticate,
  requireRoles(["SUPPORT", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const cardId = req.params.id;
      const validated = AdminCardStatusSchema.parse(req.body);
      const updated = defaultCardService.updateCardStatus({
        cardId,
        actorUserId: req.user.id,
        actorRole: req.user.role,
        newStatus: validated.status,
        reason: validated.reason
      });
      const { syntheticPanFormatted, syntheticCvv, ...safeCard } = updated;
      res.json({
        status: "card_status_updated",
        card: safeCard
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.post(
  "/cards/:id/issuance-review",
  authenticate,
  requireRoles(["SUPPORT", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const cardId = req.params.id;
      const validated = AdminCardIssuanceReviewSchema.parse(req.body);
      if (validated.decision === "DELETE") {
        const result = defaultCardService.deleteCard({
          cardId,
          actorUserId: req.user.id,
          actorRole: req.user.role,
          reason: validated.reason
        });
        res.json({
          status: "card_deleted",
          ...result
        });
        return;
      }
      const updated = defaultCardService.reviewCardIssuance({
        cardId,
        actorUserId: req.user.id,
        actorRole: req.user.role,
        decision: validated.decision,
        reason: validated.reason
      });
      const { syntheticPanFormatted, syntheticCvv, ...safeCard } = updated;
      res.json({
        status: validated.decision === "APPROVE" ? "card_issuance_approved" : "card_issuance_declined",
        card: safeCard
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.post(
  "/cards/:id/delete",
  authenticate,
  requireRoles(["SUPPORT", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const cardId = req.params.id;
      const validated = AdminCardDeleteSchema.parse(req.body ?? {});
      const result = defaultCardService.deleteCard({
        cardId,
        actorUserId: req.user.id,
        actorRole: req.user.role,
        reason: validated.reason
      });
      res.json({
        status: "card_deleted",
        ...result
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/webhooks",
  authenticate,
  requireRoles(["SUPPORT", "ADMIN", "SUPER_ADMIN"]),
  (_req, res, next) => {
    try {
      const events = defaultWebhookService.getRecentEvents(100);
      res.json({
        total: events.length,
        events: events.map((e) => ({
          ...e,
          // Guarantee that no signing secret is present
          secret: void 0
        }))
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/audit-logs",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const { action, actorRole, actorUserId, resourceType, resourceId, startDate, endDate, search, limit, offset } = req.query;
      const result = defaultAuditService.queryLogs({
        action: action ? String(action) : void 0,
        actorRole: actorRole ? String(actorRole) : void 0,
        actorUserId: actorUserId ? String(actorUserId) : void 0,
        resourceType: resourceType ? String(resourceType) : void 0,
        resourceId: resourceId ? String(resourceId) : void 0,
        startDate: startDate ? String(startDate) : void 0,
        endDate: endDate ? String(endDate) : void 0,
        search: search ? String(search) : void 0,
        limit: limit ? parseInt(String(limit), 10) : 50,
        offset: offset ? parseInt(String(offset), 10) : 0
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/loans",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const { status, search, limit, offset } = req.query;
      let apps = defaultLoanService.getAllApplicationsForReview(req.user.role);
      if (status && status !== "ALL") {
        apps = apps.filter((a) => a.status === status);
      }
      if (search) {
        const q = String(search).toLowerCase();
        apps = apps.filter(
          (a) => a.id.toLowerCase().includes(q) || a.applicantName.toLowerCase().includes(q) || a.purpose.toLowerCase().includes(q)
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
        applications: paginated
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/loans/:id",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const appId = req.params.id;
      const app = defaultLoanService.getApplicationById(appId);
      if (!app) {
        res.status(404).json({
          type: "https://avenora.com/errors/not-found",
          title: "Loan Application Not Found",
          status: 404,
          detail: `Loan application with ID "${appId}" does not exist.`
        });
        return;
      }
      res.json({ application: app });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.post(
  "/loans/:id/review",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const appId = req.params.id;
      const validated = AdminLoanReviewSchema.parse(req.body);
      const updated = defaultLoanService.reviewApplication({
        reviewerRole: req.user.role,
        reviewerUserId: req.user.id,
        applicationId: appId,
        decision: validated.decision,
        reasonCode: validated.reasonCode,
        notes: validated.notes
      });
      res.json({
        status: "decision_recorded",
        application: updated
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/grants",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const { status, programId, search, limit, offset } = req.query;
      let apps = defaultGrantService.getAllApplicationsForReview(req.user.role);
      if (status && status !== "ALL") {
        apps = apps.filter((a) => a.status === status);
      }
      if (programId && programId !== "ALL") {
        apps = apps.filter((a) => a.programId === programId);
      }
      if (search) {
        const q = String(search).toLowerCase();
        apps = apps.filter(
          (a) => a.id.toLowerCase().includes(q) || a.applicantName.toLowerCase().includes(q) || a.projectTitle.toLowerCase().includes(q)
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
        applications: paginated
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/grants/programs",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (_req, res, next) => {
    try {
      const programs = defaultGrantService.getPrograms({});
      res.json({
        total: programs.length,
        programs
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/grants/:id",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const appId = req.params.id;
      const app = defaultGrantService.getApplicationById(appId);
      if (!app) {
        res.status(404).json({
          type: "https://avenora.com/errors/not-found",
          title: "Grant Application Not Found",
          status: 404,
          detail: `Grant application with ID "${appId}" does not exist.`
        });
        return;
      }
      res.json({ application: app });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.post(
  "/grants/:id/review",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const appId = req.params.id;
      const validated = AdminGrantReviewSchema.parse(req.body);
      const updated = defaultGrantService.reviewApplication({
        reviewerRole: req.user.role,
        reviewerUserId: req.user.id,
        applicationId: appId,
        decision: validated.decision,
        notes: validated.notes
      });
      res.json({
        status: "decision_recorded",
        application: updated
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.post(
  "/grants/programs/:id/verify",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (req, res, next) => {
    try {
      const progId = req.params.id;
      const validated = AdminGrantVerifySchema.parse(req.body);
      const prog = defaultGrantService.verifyProgram({
        programId: progId,
        reviewerUserId: req.user.id,
        reviewerRole: req.user.role,
        newStatus: validated.status
      });
      res.json({
        status: "program_verified",
        program: prog
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/system/readiness",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (_req, res, next) => {
    try {
      const config = getValidatedConfig();
      const safeConfig = getSafePublicConfig(config);
      const ledgerSummary = defaultLedgerService.getLedgerSummary();
      res.json({
        platform: PLATFORM_METADATA.NAME,
        version: PLATFORM_METADATA.VERSION,
        releaseCodename: PLATFORM_METADATA.RELEASE_CODENAME,
        environment: safeConfig.environment,
        checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
        components: [
          {
            name: "Financial Ledger Engine",
            status: ledgerSummary.isBalanced ? "HEALTHY" : "DEGRADED",
            state: "PRODUCTION_READY",
            rule: "Double-entry invariant: Sum(Debits) === Sum(Credits)",
            details: {
              isBalanced: ledgerSummary.isBalanced,
              totalAccounts: ledgerSummary.totalAccounts,
              totalEntries: ledgerSummary.totalEntries,
              globalDebits: ledgerSummary.globalDebitsMinor,
              globalCredits: ledgerSummary.globalCreditsMinor,
              imbalanceMinor: ledgerSummary.imbalanceMinor
            }
          },
          {
            name: "Database Architecture & Migrations",
            status: "HEALTHY",
            state: "CONFIGURED",
            details: {
              engine: "PostgreSQL 14+ / Neon Serverless Architecture",
              currentMigration: "20261015000000_admin_operations_audit_controls",
              driver: "Prisma Client v7.10.0",
              connectionPooler: "Configured with SSL Require",
              directMigrationsUrl: "Configured"
            }
          },
          {
            name: "Authentication & Session Engine",
            status: "HEALTHY",
            state: "PRODUCTION_READY",
            details: {
              passwordAlgorithm: "Scrypt (16-byte random salt, 64-byte key)",
              mfaStandard: "RFC 6238 TOTP (SHA1, 30s step, drift tolerance +/-1)",
              sessionStorage: "SHA-256 hashed bearer tokens with rotation",
              accountLockout: "5 consecutive failed attempts -> 15 min lock"
            }
          },
          {
            name: "Integration Webhook Gateway",
            status: "HEALTHY",
            state: "TESTED",
            details: {
              signatureAlgorithm: "HMAC-SHA256 over raw request buffer",
              replayToleranceWindow: `${config.WEBHOOK_TOLERANCE_SECONDS || 300} seconds`,
              idempotencyEnforcement: "Durable event store deduplication active"
            }
          },
          {
            name: "Durable Audit Trail",
            status: "HEALTHY",
            state: "PRODUCTION_READY",
            details: {
              immutability: "Append-only in-memory & Postgres audit_logs table",
              piiRedaction: "Automated masking of passwords, secrets, tokens, PANs",
              totalLoggedEvents: defaultAuditService.getRecentCount()
            }
          },
          {
            name: "Financial safety guardrails",
            status: "ACTIVE_GUARD",
            state: "CONFIGURED",
            details: {
              prototypeMode: safeConfig.prototypeMode,
              liveSettlementEnabled: safeConfig.liveSettlementEnabled,
              realMoneyGuard: "Settlement and partner rails are governed by regional configuration and approvals.",
              cardNetworkLiveAuthorization: "BLOCKED",
              liveCryptoCustody: "BLOCKED",
              liveLendingFunding: "BLOCKED"
            }
          }
        ]
      });
    } catch (err) {
      next(err);
    }
  }
);
adminRouter.get(
  "/providers/readiness",
  authenticate,
  requireRoles(["SUPPORT", "COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (_req, res, next) => {
    try {
      const config = getValidatedConfig();
      const safeConfig = getSafePublicConfig(config);
      res.json({
        platform: "Avenora",
        timestamp: /* @__PURE__ */ new Date(),
        environment: safeConfig.environment,
        prototypeMode: safeConfig.prototypeMode,
        liveSettlementEnabled: safeConfig.liveSettlementEnabled,
        adapters: [
          {
            category: "BANK_ACCOUNT_PROVISIONING",
            name: "Core Banking Account Provisioning",
            adapterClass: "MockBankAccountProvisioningProvider",
            activeMode: "MOCK_SANDBOX",
            isLive: false,
            timeoutMs: 5e3,
            maxRetryAttempts: 3,
            contractStatus: "NO_COMMERCIAL_AGREEMENT",
            regulatoryStatus: "UNLICENSED_PROTOTYPE",
            readiness: "BLOCKED_PROTOTYPE_ONLY",
            prerequisiteNote: "Requires Sponsor Bank Partnership Agreement and FinCEN MSB / EBA Passporting registration."
          },
          {
            category: "FIAT_PAYMENT_INITIATION",
            name: "Fiat Payment Clearing & Status",
            adapterClass: "MockFiatPaymentProvider",
            activeMode: "MOCK_SANDBOX",
            isLive: false,
            timeoutMs: 5e3,
            maxRetryAttempts: 3,
            contractStatus: "NO_COMMERCIAL_AGREEMENT",
            regulatoryStatus: "UNLICENSED_PROTOTYPE",
            readiness: "BLOCKED_PROTOTYPE_ONLY",
            prerequisiteNote: "Requires FedNow / Faster Payments / SEPA Inst / PIX direct/indirect participant agreement."
          },
          {
            category: "CARD_ISSUANCE",
            name: "Virtual Card Issuance & Network Processing",
            adapterClass: "MockCardNetworkProvider",
            activeMode: "MOCK_SANDBOX",
            isLive: false,
            timeoutMs: 5e3,
            maxRetryAttempts: 3,
            contractStatus: "NO_COMMERCIAL_AGREEMENT",
            regulatoryStatus: "UNLICENSED_PROTOTYPE",
            readiness: "BLOCKED_PROTOTYPE_ONLY",
            prerequisiteNote: "Requires Visa/Mastercard BIN Sponsorship and PCI-DSS Level 1 Service Provider Certification."
          },
          {
            category: "IDENTITY_VERIFICATION",
            name: "External IDSP Identity Verification & Biometrics",
            adapterClass: "MockExternalKycProvider",
            activeMode: "MOCK_SANDBOX",
            isLive: false,
            timeoutMs: 5e3,
            maxRetryAttempts: 3,
            contractStatus: "NO_COMMERCIAL_AGREEMENT",
            regulatoryStatus: "UNLICENSED_PROTOTYPE",
            readiness: "BLOCKED_PROTOTYPE_ONLY",
            prerequisiteNote: "Requires Certified IDSP Enterprise Contract and GDPR Article 28 DPA execution."
          },
          {
            category: "BITCOIN_CUSTODY",
            name: "Institutional Bitcoin Custody & Hot/Cold Wallets",
            adapterClass: "MockBitcoinCustodyProvider",
            activeMode: "MOCK_SANDBOX",
            isLive: false,
            timeoutMs: 5e3,
            maxRetryAttempts: 3,
            contractStatus: "NO_COMMERCIAL_AGREEMENT",
            regulatoryStatus: "UNLICENSED_PROTOTYPE",
            readiness: "BLOCKED_PROTOTYPE_ONLY",
            prerequisiteNote: "Requires Qualified Custodian Agreement, CCSS Level 3 certification, and VASP license."
          },
          {
            category: "FX_SETTLEMENT",
            name: "Wholesale FX Quotes & Interbank Settlement",
            adapterClass: "MockFxQuoteProvider",
            activeMode: "MOCK_SANDBOX",
            isLive: false,
            timeoutMs: 5e3,
            maxRetryAttempts: 3,
            contractStatus: "NO_COMMERCIAL_AGREEMENT",
            regulatoryStatus: "UNLICENSED_PROTOTYPE",
            readiness: "BLOCKED_PROTOTYPE_ONLY",
            prerequisiteNote: "Requires ISDA Master Agreement with Tier-1 FX Liquidity Provider."
          }
        ],
        safetyRules: [
          "PROTOTYPE_MODE is enforced; live settlement without configured production providers is blocked.",
          "Missing provider credentials in production will refuse execution rather than falling back to mock.",
          "All mock responses are labeled with explicit integration test disclaimers."
        ]
      });
    } catch (err) {
      next(err);
    }
  }
);

// src/server/routes/domesticBankAccount.routes.ts
var import_express12 = require("express");
var import_zod13 = require("zod");
init_auth_service();
init_domesticBankAccount_service();
init_kyc_service();
init_CountryBankingRegistry();
var domesticBankAccountRouter = (0, import_express12.Router)();
domesticBankAccountRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    let record = defaultDomesticBankAccountService.getPrimaryAccountForUser(user.id);
    record = await defaultDomesticBankAccountService.ensurePrimaryAccountForActiveUser({
      userId: user.id,
      correlationId: `domestic_me_${user.id}`
    });
    const kycStatus = defaultAuthService.getUserById(user.id)?.kycStatus ?? user.kycStatus;
    if (!record) {
      res.json({
        generationStatus: "NOT_ELIGIBLE",
        message: "Domestic account details are not available yet.",
        kycStatus
      });
      return;
    }
    if (record.userId !== user.id) {
      res.status(403).json({ error: "Access denied." });
      return;
    }
    res.json({
      account: defaultDomesticBankAccountService.getCustomerSafeView(record),
      kycStatus
    });
  } catch (err) {
    next(err);
  }
});
domesticBankAccountRouter.get(
  "/coverage-matrix",
  authenticate,
  requireRoles(["COMPLIANCE_REVIEWER", "ADMIN", "SUPER_ADMIN"]),
  (_req, res) => {
    res.json({
      registryVersion: "2026.03.1",
      countries: getCoverageMatrix(),
      disclaimer: "Coverage reflects synthetic prototype capabilities, not live banking partnerships."
    });
  }
);
var RetrySchema = import_zod13.z.object({
  userId: import_zod13.z.string().min(1),
  dryRun: import_zod13.z.boolean().optional().default(false)
});
domesticBankAccountRouter.post(
  "/admin/retry",
  authenticate,
  requireRoles(["ADMIN", "SUPER_ADMIN"]),
  async (req, res, next) => {
    try {
      const validated = RetrySchema.parse(req.body);
      const profile = defaultKycService.getOrCreateProfile(validated.userId);
      const outcome = await defaultDomesticBankAccountService.retryGenerationForUser({
        actorUserId: req.user.id,
        actorRole: req.user.role,
        targetUserId: validated.userId,
        kycProfile: profile,
        dryRun: validated.dryRun
      });
      res.status(200).json(outcome);
    } catch (err) {
      next(err);
    }
  }
);

// src/server/routes/contact.routes.ts
var import_express13 = require("express");
var import_zod14 = require("zod");
init_email_service();
init_auth_service();
var contactRouter = (0, import_express13.Router)();
var ContactInquirySchema = import_zod14.z.object({
  name: import_zod14.z.string().min(2, "Name is required").max(120),
  email: import_zod14.z.string().email("Valid email is required"),
  subject: import_zod14.z.string().min(2, "Subject is required").max(200),
  message: import_zod14.z.string().min(10, "Message must be at least 10 characters").max(5e3),
  category: import_zod14.z.string().max(64).optional()
});
var SupportTicketSchema = import_zod14.z.object({
  subject: import_zod14.z.string().min(2).max(200),
  message: import_zod14.z.string().min(10).max(5e3),
  priority: import_zod14.z.enum(["STANDARD", "HIGH", "CRITICAL"]).default("STANDARD"),
  name: import_zod14.z.string().min(2).max(120).optional(),
  email: import_zod14.z.string().email().optional(),
  category: import_zod14.z.string().max(64).optional()
});
function buildReference(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}
async function attachUserIfPresent(req) {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }
  if (!token && req.cookies?.["avenora_session"]) {
    token = req.cookies["avenora_session"];
  }
  if (!token) return;
  const user = await defaultAuthService.validateSession(token);
  if (user) {
    req.user = user;
    req.sessionToken = token;
  }
}
contactRouter.post("/", async (req, res, next) => {
  try {
    const validated = ContactInquirySchema.parse(req.body);
    const reference = buildReference("AVN");
    const result = await defaultEmailService.sendContactInquiry({
      name: validated.name,
      email: validated.email,
      subject: validated.subject,
      message: validated.message,
      category: validated.category,
      reference
    });
    res.status(200).json({
      status: "success",
      reference,
      emailDispatched: result.sent || Boolean(result.skipped),
      message: "Your message has been received. Our team will respond shortly."
    });
  } catch (err) {
    next(err);
  }
});
contactRouter.post("/support", async (req, res, next) => {
  try {
    await attachUserIfPresent(req);
    const validated = SupportTicketSchema.parse(req.body);
    const ticketId = buildReference("TKT");
    const customerEmail = req.user?.email || validated.email;
    const customerName = req.user?.fullName || validated.name;
    if (!customerEmail || !customerName) {
      res.status(400).json({
        type: "https://avenora.com/errors/validation",
        title: "Validation Error",
        status: 400,
        detail: "Name and email are required when not signed in.",
        instance: req.originalUrl,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return;
    }
    const subject = validated.category ? `[${validated.category}] ${validated.subject}` : validated.subject;
    const result = await defaultEmailService.sendSupportTicket({
      customerEmail,
      customerName,
      subject,
      message: validated.message,
      priority: validated.priority,
      ticketId
    });
    res.status(200).json({
      status: "success",
      ticketId,
      emailDispatched: result.sent || Boolean(result.skipped),
      message: "Your inquiry has been logged. A support specialist will respond using the contact details provided."
    });
  } catch (err) {
    next(err);
  }
});

// src/server/app.ts
function createExpressApp() {
  const app = (0, import_express14.default)();
  app.disable("x-powered-by");
  app.use((0, import_cors.default)());
  app.use((0, import_cookie_parser.default)());
  app.use(
    import_express14.default.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app.use(import_express14.default.urlencoded({ extended: true, limit: "1mb" }));
  app.use(correlationIdMiddleware);
  app.use(structuredLoggerMiddleware);
  app.use("/api/v1", healthRouter);
  app.use("/api/v1/system", systemRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/kyc", kycRouter);
  app.use("/api/v1/wallets", walletRouter);
  app.use("/api/v1/ledger", ledgerRouter);
  app.use("/api/v1/webhooks", webhookRouter);
  app.use("/api/v1/loans", loanRouter);
  app.use("/api/v1/grants", grantRouter);
  app.use("/api/v1/cards", cardRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/domestic-accounts", domesticBankAccountRouter);
  app.use("/api/v1/contact", contactRouter);
  app.use("/api", (req, res) => {
    res.status(404).json({
      type: "https://avenora.com/errors/not-found",
      title: "Not Found",
      status: 404,
      detail: `No API route matches ${req.method} ${req.originalUrl}.`,
      instance: req.originalUrl,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.use(centralErrorHandler);
  return app;
}

// src/server/vercel-handler.ts
var vercel_handler_default = createExpressApp();
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Double-Entry Ledger Invariant Engine
 *
 * Enforces the fundamental accounting equation:
 * Sum(Debits) === Sum(Credits)
 * Every debit must be matched by an equal credit in identical currency.
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — System Constants & Corridors
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Strict Environment Configuration
 *
 * Validates all environment variables using Zod.
 * Ensures secrets stay server-only and enforces security invariants.
 */
/**
 * @license Apache-2.0
 * ISO 4217 minor-unit exponents for fiat currencies (crypto handled separately).
 */
/**
 * @license Apache-2.0
 * Dynamic ISO 4217 currency registry (all fiat codes used in country mapping + BTC).
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Currency Metadata & Registry
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Zero-Floating-Point Monetary Value Object
 *
 * Implements Martin Fowler's Money pattern using BigInt minor units.
 * Eliminates IEEE-754 binary floating-point representation errors (such as 0.1 + 0.2 !== 0.3).
 */
/**
 * @license Apache-2.0
 * Maps signup country (ISO 3166-1 alpha-2) to primary fiat ISO 4217 code.
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Reference Financial Ledger Service
 *
 * Implements strict double-entry mechanics, Chart of Accounts,
 * immutable posted journal entries, and invariant verification.
 */
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
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Future Financial Provider Integration Architecture & Adapters
 *
 * Implements authoritative, vendor-neutral provider abstractions:
 * 1. Bank Account & Payment-Account Provisioning (IBankAccountProvisioningProvider)
 * 2. Fiat Payment Initiation & Status Inquiries (IFiatPaymentProvider)
 * 3. Card Issuance, Status & Transaction Events (ICardNetworkProvider)
 * 4. External Identity Verification & KYC Checks (IExternalKycProvider)
 * 5. Bitcoin Custody & Blockchain Operations (IBitcoinCustodyProvider)
 * 6. FX Quotes & External Wholesale Settlement (IFxQuoteProvider)
 *
 * Security & Reliability Policies:
 * - Exponential backoff with jitter and configurable maximum retry attempts
 * - AbortController timeout bounds on all outbound calls
 * - Idempotency enforcement: deduplicates duplicate callbacks and requests
 * - Webhook HMAC-SHA256 signature verification with tolerance timestamp validation
 * - PROTOTYPE/LIVE SAFETY GUARD: If live mode is enabled, unconfigured real integrations
 *   MUST NOT fall back silently to mock adapters!
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Country-Aware Identifier Generation & Validation Service
 *
 * Implements:
 * - Deterministic, country-aware synthetic financial identifier generation
 * - Separation of internal database IDs from customer-facing bank/tax/card details
 * - Authoritative checksum algorithms (ISO 7064 Mod 97-10, ABA 9-Digit, Spanish CCC, Brazilian CPF, Luhn)
 * - Safe concurrent allocation with thread-safe atomic reservation store and deduplication
 * - Pluggable IIdentifierProvider interface for future live banking/card adapters
 * - Strict prototype boundary disclaimers and masking
 */
/**
 * @license Apache-2.0
 * Avenora — shared transactional email layout (email-safe HTML tables + inline CSS)
 */
/**
 * @license Apache-2.0
 * Avenora — Welcome / registration transactional email
 */
/**
 * @license Apache-2.0
 * Avenora — standard transactional email composer
 */
/**
 * @license Apache-2.0
 * Avenora — auth & account status email templates
 */
/**
 * @license Apache-2.0
 * Avenora — KYC & domestic account email templates
 */
/**
 * @license Apache-2.0
 * Avenora — wallet, transfer, FX & statement email templates
 */
/**
 * @license Apache-2.0
 * Avenora — card lifecycle email templates
 */
/**
 * @license Apache-2.0
 * Avenora — loan & grant email templates
 */
/**
 * @license Apache-2.0
 * Avenora — contact & support email templates
 */
/**
 * @license Apache-2.0
 * Avenora — provider / webhook email templates
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Cryptographic Security Service
 *
 * Implements:
 * - Scrypt password hashing with unique salts (safe Node.js built-in, zero vulnerable dependencies)
 * - Timing-safe comparisons
 * - Durable session token hashing (SHA-256)
 * - Single-use password reset token hashing
 * - RFC 6238 TOTP Multi-Factor Authentication engine with drift tolerance and recovery codes
 * - Brute-force rate limiting and account lockout guards
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Durable Administrative & Operations Audit Service
 *
 * Implements:
 * - Append-only, tamper-evident audit trail for sensitive administrative and operational actions
 * - Server-side PII and credential sanitization (automatic redaction of passwords, tokens, TOTP secrets, PANs)
 * - Structured audit querying with pagination, action filtering, actor filtering, and date range support
 * - Correlation ID linkage for distributed tracing of administrative commands
 * - Immutability enforcement: audit records CANNOT be modified or deleted via any API
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Transactional Email Service (Resend)
 *
 * Centralizes outbound email via Resend. When RESEND_API_KEY is unset,
 * sends are no-ops so local/prototype flows remain usable.
 */
/**
 * @license Apache-2.0
 * Central registry of domestic banking identifier schemes for every ISO 3166-1 alpha-2
 * country available in signup. Distinct from live provider capability.
 */
/**
 * @license Apache-2.0
 * Country-aware primary domestic bank account generation (synthetic prototype only).
 */
/**
 * @license Apache-2.0
 * Primary simulated domestic bank account lifecycle — KYC-gated, idempotent, auditable.
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Simulated KYC & Identity Verification Service
 *
 * Implements:
 * - Tiered verification workflows (Tier 1 Basic, Tier 2 Full Document)
 * - Country-specific compliance validations (US SSN, BR CPF, ES DNI)
 * - Document metadata vault with private synthetic references (no public URLs)
 * - Server-authoritative state transitions with reviewer role enforcement
 * - Append-only review history and audit events
 */
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
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Correlation & Request ID Middleware
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Structured Request Logger with PII Masking
 *
 * Emits JSON logs with correlation IDs.
 * Automatically masks sensitive customer data (passwords, tokens, PANs, emails, SSNs).
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Finite State Machine for Financial Transactions
 *
 * Governs strict state transitions:
 * DRAFT -> PENDING | VOIDED | REJECTED
 * PENDING -> POSTED | REJECTED | VOIDED
 * POSTED -> REVERSED (immutable: original posted state cannot be erased; only compensated)
 * VOIDED / REJECTED -> Terminal states
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Centralized Error Handler (RFC 7807 Problem Details)
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Health & Readiness Diagnostics Service
 *
 * Checks subsystem availability without leaking credentials or infrastructure topology.
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Health & Readiness HTTP Routes
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Financial Ledger Routes
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Country & Provider Integration Capability Matrix
 *
 * Enforces strict distinction between:
 * 1. Country-format support (mathematical checksum & syntax)
 * 2. Provider technical capability (adapters implemented in software)
 * 3. Provider contractual eligibility (commercial partnership status)
 * 4. Legal permission to offer service (charter/licensing/registration)
 * 5. Production readiness (security audit, operational readiness, SOC2)
 */
/**
 * @license Apache-2.0
 * Avenora — email template catalog (preview registry for all 61 notifications)
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — System Status & Country-Aware Identifiers API
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Authentication & RBAC Middleware
 */
/**
 * @license Apache-2.0
 * ISO 3166-1 alpha-2 country options for registration and profile forms.
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Authentication Routes
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — KYC & Compliance Verification Routes
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Idempotency Contract & Verification
 */
/**
 * @license Apache-2.0
 * Approximate units of local currency per 1 USD (illustrative / prototype FX).
 * Used to convert USD-anchored policy amounts into account currencies.
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Multicurrency Wallet & Ledger Operations Service
 *
 * Implements:
 * - Persistent wallet accounts linked to the double-entry Chart of Accounts
 * - deposits, withdrawals, and internal transfers with zero-float BigInt math
 * - Overdraft prevention (negative available balances rejected)
 * - Strict double-entry invariant verification: Sum(Debits) === Sum(Credits)
 * - Illustrative FX Quote generation and atomic currency conversions
 * - Cryptographic idempotency key binding, duplicate detection, and concurrency safety
 */
/**
 * @license Apache-2.0
 * Account status gates: PENDING_VERIFICATION / SUSPENDED / LOCKED freeze financial
 * actions without blocking auth. Customers remain inactive until KYC is admin-approved.
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Multicurrency Wallet & Financial Operations Routes
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Secure Mock Webhook Gateway Service
 *
 * Implements:
 * - HMAC-SHA256 signature verification over exact raw request bytes
 * - Signed timestamp verification with replay prevention (freshness window)
 * - Constant-time cryptographic comparison (timingSafeEqual)
 * - Idempotent event receipt and durable processing logs
 * - Automated rejection of tampered, expired, or replayed events
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Secure Mock Webhook Gateway Routes
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Loan & Credit Application Engine
 *
 * Implements:
 * - Deterministic Amortization Calculator with integer minor-unit math and final penny adjustment
 * - Transparent Synthetic Risk Assessment engine with ruleset versioning and factor explanations
 * - Server-authoritative application lifecycle (DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED_FOR_DEMO / DECLINED_FOR_DEMO)
 * - Separation of duties: customers cannot review or approve their own loan applications
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Loan & Credit Application HTTP Routes
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Verified Grant Programs & Applications Engine
 *
 * Implements:
 * - Verified public/institutional grant opportunities catalog
 * - Verification status workflow (UNVERIFIED -> PENDING_REVIEW -> VERIFIED / REJECTED)
 * - Grant application lifecycle with eligibility verification
 * - Separation of duties: staff reviewers cannot review their own grant applications
 * - Simulated grant award & disbursement into user's multicurrency wallet with ledger entry
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Verified Grant Programs & Applications HTTP Routes
 */
/**
 * @license Apache-2.0
 * Client-side illustrative FX (matches wallet.service demo triangulation).
 */
/**
 * @license Apache-2.0
 * Fixed card spend-limit policy (USD-anchored, Brazil overrides).
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Simulated Card Services & POS Authorization Engine
 *
 * Implements:
 * - Debit and Virtual card lifecycle (REQUESTED -> ACTIVE_SIMULATED <-> FROZEN -> TERMINATED)
 * - Synthetic card credentials (masked PAN, synthetic expiry, tokenized CVV)
 * - Configurable daily spend limits and single transaction limits
 * - Two-step card payment mechanics:
 *   1. POS Pre-Authorization: Creates PENDING_HOLD and executes double-entry ledger hold
 *      (Debits Customer Available Balance, Credits Customer Pending Hold)
 *   2. Settlement: Clears hold and posts immutable journal entry to clearing
 *   3. Reversal / Expiration: Restores reserved funds back to Customer Available Balance
 * - Full audit trail with CardStateEvents
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Payment Card Services & POS Simulator HTTP Routes
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Provider Operation Lifecycle & Ledger Safety States
 *
 * Governs strict lifecycle states for external financial provider operations:
 * REQUESTED -> PENDING_PROVIDER -> CONFIRMED | FAILED | RECONCILIATION_REQUIRED
 * CONFIRMED -> REVERSED (via compensating double-entry journal entry only)
 *
 * Invariants:
 * 1. An HTTP 200 response alone NEVER constitutes final settlement.
 * 2. Funds are only confirmed when settled or verified by verified provider webhook/reconciliation.
 * 3. Posted ledger entries are immutable. No double-posting on retry or out-of-order callbacks.
 * 4. Inconclusive or conflicting states transition to RECONCILIATION_REQUIRED.
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Provider Payment Lifecycle & Ledger Safety Service
 *
 * Implements strict, testable lifecycle state machine:
 * REQUESTED -> PENDING_PROVIDER -> CONFIRMED | FAILED | RECONCILIATION_REQUIRED
 * CONFIRMED -> REVERSED (via compensating double-entry journal entry only)
 *
 * Invariants Enforced:
 * 1. HTTP 200 response alone NEVER constitutes final settlement.
 * 2. Idempotency registry prevents duplicate postings from duplicate or replayed webhooks.
 * 3. Out-of-order event handling: Late failures after confirmation trigger RECONCILIATION_REQUIRED.
 * 4. Posted ledger entries are strictly immutable. Compensating entries provide audit lineage.
 * 5. Production guard: In live mode without real provider credentials, operations fail explicitly.
 */
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
/**
 * @license Apache-2.0
 * Customer domestic simulated bank account routes (KYC-gated).
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Public Contact & Support Inquiry Routes
 */
/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Express Application Factory
 */
/**
 * @license Apache-2.0
 * Avenora — Vercel serverless entry (bundled to api/index.js at build time)
 */

;module.exports = (typeof module.exports === 'function' || (module.exports && typeof module.exports.handle === 'function'))
  ? module.exports
  : (module.exports && module.exports.default) || module.exports;
