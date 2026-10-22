# Country banking identifier coverage (prototype)

Registry version: `2026.03.1` (`CountryBankingRegistry.ts`).

## Fully supported (verified domestic structure + synthetic generation)

| Country | Scheme | Components |
|---------|--------|------------|
| US (+ AS, GU, MP, PR, VI, UM) | US ABA + DDA | routing number, account number |
| GB (+ IM, JE, GG) | UK sort code / account / GB IBAN | sort code, account number, IBAN |
| ES | Spanish CCC + IBAN | bank, branch, control digits, account, IBAN |
| DE | German BLZ + IBAN | BLZ, account, IBAN |
| BR | FEBRABAN-style | banco, agência, conta, Pix key (unique) |

## Partially supported (IBAN length + Mod 97-10 only)

Countries listed in `iso13616IbanLengths.json` without a full domestic rule use `IBAN_SYNTHETIC_PARTIAL`. Checksum is valid; BBAN uses an internal `AVEN` synthetic prefix and is **not** a national bank assignment.

## Unsupported (`FORMAT_NOT_IMPLEMENTED`)

Remaining ISO 3166 signup countries (e.g. JP, CN without IBAN registry entry) have explicit registry rows with `syntheticGenerationSupport: false`. KYC approval does **not** fabricate domestic details for these jurisdictions.

## KYC trigger

Domestic identifiers are generated only after KYC reaches `APPROVED` in `KycService.reviewProfile` (signup country must match KYC `verifiedCountryCode`).

Optional prototype bypass: set `BYPASS_KYC_GATES=true` to auto-approve KYC and generate identifiers on register/login/Overview. Defaults to `false`.

## API

- `GET /api/v1/domestic-accounts/me` — customer view (authenticated)
- `GET /api/v1/domestic-accounts/coverage-matrix` — admin/compliance diagnostics
- `POST /api/v1/domestic-accounts/admin/retry` — idempotent retry / dry-run backfill

## Persistence

Runtime records are held in `DomesticBankAccountService` (prototype). Prisma model `CustomerDomesticBankAccount` and migration `20261019180000_customer_domestic_bank_accounts` define the durable schema for future DB wiring.
