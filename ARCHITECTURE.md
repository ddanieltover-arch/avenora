# AVENORA — SYSTEM ARCHITECTURE SPECIFICATION
**Version:** 0.2.0 (Phase 02: Customer Identity, Multicurrency Wallets & Secure Webhooks)  
**Security Status:** Prototype / Simulation Mode Enforced  
**Document Classification:** Internal Technical Architecture & Engineering Standards  

---

## 1. Executive Summary & Vision

**Avenora** is a modern international fintech platform designed for individual customers. The platform is architected to support:

- Multicurrency digital wallets (USD, EUR, BRL, BTC).
- Fiat deposits, withdrawals, and domestic/cross-border transfers (FedNow/ACH, SEPA, Pix).
- Bitcoin custody, deposits, withdrawals, and conversions through licensed institutional providers.
- Personal and business loan application workflows.
- Verified philanthropic and non-profit grant application programs.
- Debit and virtual card issuance through regulated issuing partner banks.
- Customer onboarding, identity verification (KYC/AML), and tiered risk limits.
- Multilingual localized interfaces (English, Spanish, Brazilian Portuguese).
- Operational compliance, audit logging, and customer support console.

### Critical Operating Constraints (Phase 01)
During Phase 01, Avenora operates **exclusively in prototype/simulation mode**:
1. **Zero Real-Money Movement:** Live fiat banking rails, live card creation, and live crypto custody are blocked by policy and code guards (`PROTOTYPE_MODE=true`, `ENABLE_LIVE_SETTLEMENT=false`).
2. **Zero False Licensing Claims:** Avenora makes no claim of being an FDIC-insured or licensed depository bank. All future banking and custody services will be delivered in partnership with regulated financial institutions.
3. **No Phantom Balances:** Balance fields are never directly editable; all balances are dynamically computed from an immutable double-entry ledger.

---

## 2. Technology Stack & Runtime Topology

```
+-----------------------------------------------------------------------------------+
|                            TIER 1: CLIENT APPLICATIONS                            |
|  - Web Application: React 19 + TypeScript + Tailwind CSS (Vite / Next.js ready)  |
|  - Mobile Client (Planned): React Native + Expo Workspace                         |
|  - Operations Portal: Internal Admin & Compliance Console                         |
+-----------------------------------------------------------------------------------+
                                          |
                        HTTPS / TLS 1.3 | JSON REST APIs
                        X-Correlation-ID | Idempotency-Key
                                          v
+-----------------------------------------------------------------------------------+
|                        TIER 2: API GATEWAY & SECURITY DMZ                         |
|  - Stateless Node.js / Express Application Server (port 3000)                     |
|  - Strict Zod Input Validation & Sanitization                                    |
|  - Structured JSON Logging with PII Redaction (Masks PAN, SSN, passwords, tokens) |
|  - RFC 7807 Problem Details Centralized Error Handling                            |
|  - Health & Readiness Probes (/api/v1/health, /api/v1/ready)                      |
+-----------------------------------------------------------------------------------+
                                          |
                      Zero-Float Minor Units (BigInt)
                      Finite State Machine (FSM) Guards
                                          v
+-----------------------------------------------------------------------------------+
|                    TIER 3: CORE FINANCIAL DOMAIN & LEDGER ENGINE                  |
|  - Double-Entry Invariant Engine: Sum(Debits) === Sum(Credits)                    |
|  - Immutable Posted Journal Entries (No UPDATE / No DELETE)                       |
|  - Separation of Funds: Available Balance vs. Pending Pre-Auth Holds vs. Reserve  |
|  - Zero-Float Money Value Object (BigInt minor units: cents, satoshis)            |
+-----------------------------------------------------------------------------------+
                                          |
                       Connection Pooler / Direct DDL
                                          v
+-----------------------------------------------------------------------------------+
|                         TIER 4: PERSISTENCE & AUDIT TRAIL                         |
|  - PostgreSQL 14+ (Managed Neon Serverless Postgres)                              |
|  - Prisma ORM with versioned SQL migrations (prisma/migrations/*)                 |
|  - Append-Only Tables: journal_entries, ledger_entry_lines, audit_logs            |
|  - Distributed Idempotency Token Cache                                            |
+-----------------------------------------------------------------------------------+
```

### Environment Mapping & Next.js Transition
- **AI Studio Environment:** Runs a unified full-stack server on port 3000 using Express with Vite middleware in development (`server.ts`). This satisfies AI Studio's single-port iframe constraints while guaranteeing complete server-side secret isolation.
- **Production Deployment (Vercel / Cloud Run):** The core domain layer (`src/domain/*`) and server routes (`src/server/*`) are built with clean decoupled boundaries. When deploying to Vercel with Next.js App Router, the API routes map 1:1 to Next.js route handlers (`app/api/v1/*`), or run as a dedicated NestJS/Express containerized service.

---

## 3. Financial Engineering Standards

### 3.1 Double-Entry General Ledger (Chart of Accounts)
Financial truth is maintained through classical double-entry bookkeeping:
- **Normal Debit Accounts:** Assets (safeguarding cash, crypto vault) and Expenses (provider processing fees). An increase is recorded as a **DEBIT**.
- **Normal Credit Accounts:** Liabilities (customer wallet deposits, pending holds), Equity (statutory reserves, capital), and Revenue (FX spreads, interchange). An increase is recorded as a **CREDIT**.

### 3.2 The Core Invariant
Before any financial command commits to the ledger, the system executes `assertDoubleEntryInvariant()`:
$$\sum \text{Debits} \equiv \sum \text{Credits}$$
If $\sum \text{Debits} - \sum \text{Credits} \neq 0$, the transaction is immediately rejected with HTTP `422 Unprocessable Entity` complying with RFC 7807.

### 3.3 Zero-Floating-Point Monetary Arithmetic (`Money.ts`)
Standard JavaScript/TypeScript `number` types use IEEE-754 binary floating-point representation, causing catastrophic inaccuracies in financial ledgers:
```typescript
0.10 + 0.20 === 0.30000000000000004 // Fatal rounding leak
```
**Avenora Rule:** No financial calculation uses floating-point types.
- All amounts are stored as **integer minor units** using TypeScript `bigint` (e.g., $100.00 USD is `10000n` cents; 0.00015000 BTC is `15000n` satoshis).
- Pro-rata allocations (such as splitting loan repayments or distributor fees) use a remainder-conserving integer algorithm (`Money.allocate()`) ensuring zero penny loss.

### 3.4 Separation of Available, Pending, and Settled Funds
Funds in customer wallets are separated into discrete liability accounts:
- `CUSTOMER_AVAILABLE_BALANCE`: Liquid funds available for immediate transfer, withdrawal, or conversion.
- `CUSTOMER_PENDING_HOLD`: Funds locked during card pre-authorizations, outbound wire clearing, or pending loan disbursements.
- `CUSTOMER_RESERVED_BALANCE`: Collateral or regulatory hold reserves.

### 3.5 Transaction Finite State Machine (FSM)
Transactions must transition through strictly guarded states:
- `DRAFT` $\rightarrow$ `PENDING` | `VOIDED` | `REJECTED`
- `PENDING` $\rightarrow$ `POSTED` | `REJECTED` | `VOIDED`
- `POSTED` $\rightarrow$ `REVERSED` (Posted entries are immutable; corrections require compensating journal entries)
- Direct jumps (such as `DRAFT` $\rightarrow$ `POSTED`) are rejected by `assertValidTransition()`.

---

## 4. Security, Identity & DevSecOps Standards (Phase 02 Updates)

1. **Scrypt Password Hashing & Constant-Time Verification:** Passwords are never stored in plaintext. They are salted with 16 bytes of entropy and hashed via Scrypt with high cost parameters (`N=16384, r=8, p=1`). Password checks use `crypto.timingSafeEqual` to eliminate timing side-channels.
2. **Durable Session Management & Rotation:** Sessions are stored server-side with SHA-256 hashed token lookups (`sessions` table). Session tokens are rotated upon authentication and privilege changes, and invalidated during password resets.
3. **Multi-Factor Authentication (RFC 6238 TOTP):** Native TOTP engine generating 6-digit codes and single-use recovery codes. Time drift tolerance of +/- 30 seconds protects against client clock skew.
4. **Tiered KYC & Role-Based Access Control:** Strict RBAC enforcing `CUSTOMER`, `SUPPORT`, `COMPLIANCE_REVIEWER`, `ADMIN`, and `SUPER_ADMIN`. Verification approval requires compliance officer authorization; customers cannot approve their own verification by altering request payloads.
5. **HMAC-SHA-256 Webhook Integrity & Replay Defense:** Provider events received at `POST /api/v1/webhooks/mock-provider` verify HMAC-SHA-256 signatures over raw request bytes (`req.rawBody`). Signed timestamps older than 300 seconds are rejected to block replay attacks. Reused `eventId` values are acknowledged idempotently as `DUPLICATE` without double-processing.
6. **PII Masking in Logs:** The structured request logger intercepts all requests and automatically redacts passwords, tokens, API keys, card PANs, SSNs, and CPFs with `[REDACTED_FINANCIAL_PII]`.
7. **Idempotent Financial Commands:** Every state-modifying endpoint accepts an `Idempotency-Key` header. Duplicate requests within a 24-hour TTL return cached identical responses without re-executing ledger lines.
8. **Append-Only Auditing:** The `audit_logs` table records actor identity, IP address, user agent, action type, and timestamps for all sensitive operations.

---

## 5. Future Integration Roadmap (Phase 03+)

1. **Banking Partner Integrations:** Webhook ingestion with cryptographic signature validation (HMAC-SHA256) for ACH, FedNow, SEPA, and Pix payment rails.
2. **Bitcoin Institutional Custody:** Qualified institutional multi-signature custody APIs, hardware security module (HSM) key orchestration, and blockchain address generators.
3. **Card Issuing Rails:** Visa/Mastercard processor integration with real-time auth stream webhooks and automated pending hold release timers.
4. **Loan & Grant Engine:** Amortization schedule calculator, document upload vault with virus scanning, and approval workflows.
