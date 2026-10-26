# Avenora — International Financial Technology Platform
> **Phase 01: Production-Oriented Project Foundation**

[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue.svg)](https://www.typescriptlang.org/)
[![Database](https://img.shields.io/badge/PostgreSQL-Neon%20Serverless-00e599.svg)](https://neon.tech/)
[![ORM](https://img.shields.io/badge/Prisma-Schema%20&%20Migrations-2D3748.svg)](https://www.prisma.io/)
[![Ledger Invariant](https://img.shields.io/badge/Ledger-Double--Entry%20Parity-emerald.svg)]()
[![Precision](https://img.shields.io/badge/Monetary%20Math-Zero--Float%20BigInt-indigo.svg)]()
[![Status](https://img.shields.io/badge/Platform-Production%20Oriented-emerald.svg)]()

Avenora is a modern international fintech platform designed for individual customers. This repository houses the core production-oriented architecture, double-entry financial ledger engine, strict zero-float monetary value objects, API gateway, and database foundation.

---

## 1. Quick Start & Local Development

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **Package Manager**: `npm` (v10+)
- **Database**: PostgreSQL 14+ (or a free [Neon](https://neon.tech/) serverless PostgreSQL database)

### Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/avenora/avenora-core.git
cd avenora-core

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and supply your PostgreSQL connection string if running against live DB

# 4. Generate Prisma client
npm run db:generate

# 5. Start the full-stack development server (Express + Vite on Port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts full-stack Express API with Vite client on `http://0.0.0.0:3000` |
| `npm run build` | Compiles Vite production frontend bundle to `dist/` |
| `npm run lint` | Runs strict TypeScript compiler check (`tsc --noEmit`) |
| `npm test` | Runs the Vitest automated test suite |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run start` | Starts Node production server (`node server.ts`) |
| `npm run db:generate`| Generates Prisma client types from `prisma/schema.prisma` |
| `npm run db:migrate` | Applies migrations to PostgreSQL database (`prisma migrate dev`) |

---

## 3. Database Architecture & Migrations

Avenora uses PostgreSQL (with Neon as the preferred serverless provider) and Prisma ORM.

### Database Connection Strings
Two URLs are required in `.env`:
1. `DATABASE_URL`: Connection pooler endpoint (e.g. `ep-sample-pooler.region.aws.neon.tech`), used by runtime application queries.
2. `DIRECT_URL`: Direct unpooled database connection string, required for Prisma migrations and DDL operations.

### Running Migrations
The database schema is version-controlled via Prisma migrations:
1. `prisma/migrations/20261014000000_init_financial_ledger/migration.sql`: Initial Chart of Accounts, Double-Entry Ledger, Idempotency, and Audit Logs.
2. `prisma/migrations/20261014120000_customer_identity_wallets_webhooks/migration.sql`: Phase 02 Users, Sessions, Password Resets, KYC Profiles, Multicurrency Wallets, FX Quotes, and Mock Webhook Events.

To apply migrations:
```bash
npx prisma migrate deploy
```

### Core Schema Models
- **`User`**: Customer & staff accounts with Scrypt password hashes, roles (`CUSTOMER`, `SUPPORT`, `COMPLIANCE_REVIEWER`, `ADMIN`, `SUPER_ADMIN`), and lockout counters.
- **`Session`**: Durable server-side sessions tracking hashed tokens, expiration, and revocation status.
- **`PasswordResetToken`**: Single-use, short-lived reset tokens (hashed).
- **`KycProfile`**: Tiered verification records with masked tax IDs, synthetic vault document references, and immutable review history.
- **`Wallet` & `WalletAccount`**: Customer multi-currency wallets mapped directly to double-entry ledger accounts.
- **`FxQuote`**: Illustrative currency conversion quotes with expiration and applied synthetic rates.
- **`MockWebhookEvent`**: Webhook event audit trail tracking payload hashes, signatures, and processing status.
- **`LedgerAccount`**: Chart of Accounts categorized as `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, or `EXPENSE`.
- **`FinancialTransaction`**: Transaction header tracking state transitions (`DRAFT`, `PENDING`, `POSTED`, `REVERSED`).
- **`JournalEntry`**: Immutable transaction records.
- **`LedgerEntryLine`**: Debit and credit line items with amounts stored as `BigInt` minor units.
- **`IdempotencyRecord`**: Distributed idempotency keys ensuring commands execute exactly once.
- **`AuditLog`**: Append-only security audit log recording actors, IP addresses, and timestamps.

---

## 4. API Endpoints (v1)

### Diagnostic Probes
- `GET /api/v1/health`: Liveness probe. Returns process uptime, Node version, heap memory, and environment safety flags.
- `GET /api/v1/ready`: Readiness probe. Verifies database and ledger engine readiness without exposing credentials.
- `GET /api/v1/system/status`: Returns public platform capability flags, active corridors, and regulatory disclaimers.

### Customer Identity & Authentication
- `POST /api/v1/auth/register`: Register new customer with email, password, full name, country.
- `POST /api/v1/auth/login`: Authenticate customer or staff, supports TOTP MFA codes and recovery codes. Sets HttpOnly cookie.
- `POST /api/v1/auth/logout`: Revokes active session.
- `GET /api/v1/auth/me`: Retrieves current authenticated user profile and roles.
- `POST /api/v1/auth/password-reset/request`: Dispatches single-use short-lived reset token via Resend email.
- `POST /api/v1/auth/password-reset/confirm`: Resets password and invalidates all existing sessions.
- `POST /api/v1/contact`: Public contact form — emails support + acknowledgement to sender (Resend).
- `POST /api/v1/contact/support`: Support ticket inquiry (session optional) — emails support inbox (Resend).
- `POST /api/v1/auth/mfa/enroll`: Generates base32 TOTP secret and `otpauth://` URI.
- `POST /api/v1/auth/mfa/confirm`: Validates 6-digit TOTP code and generates single-use recovery codes.

### KYC & Compliance
- `GET /api/v1/kyc/me`: Retrieves current user's verification profile (sanitized).
- `POST /api/v1/kyc/submit`: Customer submits Tier 1 / Tier 2 verification with masked tax ID and private vault refs.
- `GET /api/v1/kyc/reviews`: Lists pending verification profiles (restricted to `COMPLIANCE_REVIEWER` / `ADMIN`).
- `POST /api/v1/kyc/reviews/:userId/decision`: Records compliance decision (`APPROVED`, `REJECTED`, `NEEDS_MORE_INFORMATION`).

### Multicurrency Wallets & Financial Operations
- `GET /api/v1/wallets/me`: Returns customer's multicurrency wallet (USD, EUR, BRL, BTC) with dynamic balances.
- `POST /api/v1/wallets/deposit`: Executes atomic deposit with double-entry ledger posting.
- `POST /api/v1/wallets/withdraw`: Executes atomic withdrawal with overdraft protection.
- `POST /api/v1/wallets/transfer`: Executes atomic internal transfer between customer wallets.
- `POST /api/v1/wallets/fx/quote`: Generates illustrative short-lived FX quote.
- `POST /api/v1/wallets/fx/convert`: Executes conversion against valid quote with balanced currency legs.

### Secure webhooks
- `POST /api/v1/webhooks/mock-provider`: Secure receiver with HMAC-SHA256 signature verification over raw bytes, replay window defense, and idempotent delivery.
- `GET /api/v1/webhooks/events`: Retrieves recent webhook audit logs.
- `POST /api/v1/webhooks/generate-test-signature`: Developer signing utility for automated testing.

### Financial Ledger
- `GET /api/v1/ledger/accounts`: Retrieves Chart of Accounts.
- `GET /api/v1/ledger/entries`: Lists immutable posted journal entries.
- `GET /api/v1/ledger/summary`: Returns full balance sheet with debit/credit sums.
- `GET /api/v1/ledger/verify-invariant`: Verifies $\sum \text{Debits} \equiv \sum \text{Credits}$.
- `POST /api/v1/ledger/entries`: Posts a new balanced journal entry with validation.

---

## 5. Security & DevSecOps Standards

- **Server-Side Secret Isolation**: No database passwords, secrets, or encryption keys are accessible by client code.
- **PII Redaction**: All structured logs automatically redact card numbers, passwords, auth tokens, and SSN/tax IDs.
- **Zero-Float Math**: Uses the `Money` value object backed by `BigInt` minor units to eliminate floating-point drift.
- **Settlement controls**: Live settlement requires explicit configuration and partner readiness.
- **Regulatory disclaimers**: Product availability, deposit insurance, and licensing vary by region—see customer disclosures.

---

## 6. Troubleshooting

### Issue: `SECURITY VIOLATION: ENABLE_LIVE_SETTLEMENT cannot be true while PROTOTYPE_MODE is enabled`
**Cause:** Safety guard in `src/config/env.config.ts` prevents enabling live settlement while isolation mode is active.  
**Fix:** In `.env`, keep `ENABLE_LIVE_SETTLEMENT="false"` unless your deployment is fully approved for live settlement.

### Issue: `Ledger imbalance detected: Debits do not match Credits`
**Cause:** The posted journal entry has an unequal sum of debits and credits.  
**Fix:** Verify that the sum of all `DEBIT` lines equals the sum of all `CREDIT` lines down to the exact minor unit (cent/satoshi).

---

## 7. License
Licensed under Apache 2.0. Copyright © 2026 Avenora. All rights reserved.
