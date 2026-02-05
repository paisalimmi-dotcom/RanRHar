# 01_ARCHITECTURE — RanRHar

## Objective
Design a production-ready full-stack monorepo for RanRHar (single branch enabled now; multi-branch ready for future 50 branches).
Deliver a clean architecture that prevents feature coupling and supports AI multi-agent development.

## Non-negotiables
- Monorepo using Turborepo
- apps/web: Next.js App Router (customer + staff + manager + owner)
- apps/worker: background jobs (alerts, scheduled tasks)
- packages/db: ORM schema + migrations + seed helpers
- packages/auth: RBAC + scope resolution helpers
- packages/shared: types + Zod schemas + constants
- packages/ui: shared UI components
- Supabase Postgres + Auth + Realtime + Storage
- Multi-tenant by design: every business table has restaurant_id + branch_id

## Required Routes (must exist)
Customer:
- /menu/[tableCode]

Staff:
- /staff/kds
- /staff/cashier

Manager:
- /manager/menu
- /manager/inventory
- /manager/payroll
- /manager/expenses

Owner:
- /owner/dashboard

## Feature module boundaries
apps/web/src/features/* must isolate code per domain:
- menu, ordering, kds, billing, promotions, inventory, procurement, payroll, expenses, reporting, rbac, audit
No cross-feature imports except via packages/shared types.

## Data flow
- Customer places order → orders tables → realtime publish → KDS receives
- Kitchen updates status → realtime publish → cashier view updates
- Billing creates receipts/tax invoices → audit logs
- Inventory FEFO consumption triggered on order completion
- Payroll uses attendance + policy to create payroll period draft then lock

## Deliverables
1) Repo folder tree (exact)
2) Boundary rules (what can import what)
3) App runtime model (web + worker)
4) Proposed “contract files” locations:
   - docs/API.md (endpoints and payload)
   - docs/RBAC.md (roles/permissions)
   - docs/ROUTES.md (routes and access)
   - docs/RUNBOOK.md (setup)

