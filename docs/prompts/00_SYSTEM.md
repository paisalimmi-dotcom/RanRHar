# 00_SYSTEM — RanRHar (Project Rules)

## Product intent
RanRHar is a QR ordering and restaurant operations platform.
Default customer flow is anonymous: scan QR -> order -> pay.
Customer personal data is NOT required for normal ordering.

The system must support an optional customer tax profile for cases where
a customer requests a tax invoice for company reimbursement.

## Customer PII policy
- By default, customers provide no personal data.
- Optional tax profile may include: name, phone, address, tax ID.
- Tax profile is opt-in only and used solely for invoice issuance.
- PII access is restricted to CASHIER, MANAGER, and OWNER roles.
- All creation or modification of tax profiles must be audited.

## Hosting strategy (cost-efficient MVP)
- Cloud-first architecture for MVP.
- Frontend and backend implemented as a single web application.
- Target stack:
  - Web app: Next.js
  - Database & Auth: Supabase (Postgres + Auth + Realtime + Storage)
- Architecture must remain portable for future on-premise or local deployments.

## Tax and VAT scope
- MVP supports:
  - Receipts
  - Service charge
  - Basic VAT calculation
- Design must allow future expansion to:
  - Full tax invoices
  - Legal document numbering
  - Audit trails and corrections

## Multi-branch future support
- MVP starts with a single restaurant and single branch.
- All business data models MUST include:
  - restaurant_id
  - branch_id
- This is mandatory to support scaling to 50+ branches in the future.

## Security non-negotiables
- Enforce tenant isolation using Supabase Row Level Security (RLS).
- Authorization must be enforced server-side (RBAC).
- Client-side checks alone are never sufficient.
- All sensitive actions must write immutable audit logs.

## AI agent operating rules
- All agents must follow AGENTS.md and this SYSTEM file.
- Do not guess missing requirements.
- If a rule is unclear, ask or mark TODO.
- Never introduce secrets, API keys, or credentials into the repository.
- Prefer deterministic, testable logic.
- E2E tests define feature completion.

