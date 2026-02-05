# 01_ARCHITECTURE — RanRHar

## Objective
Design a production-ready full-stack monorepo for RanRHar (single branch now; multi-branch ready up to 50 branches).
Deliver a clean architecture that prevents feature coupling and supports AI multi-agent development.

## MVP scope (what we build first)
MVP must fully support ONE restaurant with ONE branch, but be multi-branch ready.

Customer (anonymous by default):
- Scan QR (table QR) -> browse menu (photo-rich, TH/EN/JP/ZH) -> add to cart -> place order
- Pay (MVP: record payment as cash/card/manual; online payment is future)
- View order status updates

Staff:
- KDS receives orders and updates statuses (NEW -> ACCEPTED -> COOKING -> READY -> SERVED; CANCELLED with reason)
- Cashier issues receipt (basic VAT/service charge), manages tax profile only when requested

Manager/Owner:
- Menu/pricing/promotions management
- Inventory: ingredients, supplier invoices, stock deduction (MVP: manual deduction + lot/expiry tracking), alerts (low stock, expiry)
- Payroll: attendance, leave, late/absent, OT (rate configurable later), approvals
- Expenses: utilities (electric/water), rent, other categories
Future:
- Multi-branch (up to 50), branch groups/regions, regional manager role

## Platform & stack (cost-efficient MVP)
MVP is Web-based (responsive):
- Customer portal: mobile web (PWA-ready)
- Staff/KDS/Manager/Owner: web dashboards

Core stack:
- Monorepo using Turborepo
- apps/web: Next.js App Router (customer + staff + manager + owner)
- apps/worker: background jobs (alerts, scheduled tasks)
- packages/db: ORM schema + migrations + seed helpers
- packages/auth: RBAC + scope resolution helpers
- packages/shared: types + Zod schemas + constants
- packages/ui: shared UI components
- Supabase Postgres + Auth + Realtime + Storage

## Non-negotiables
- Multi-tenant by design: every business table has restaurant_id + branch_id
- Tenant isolation must be enforced with Supabase RLS (deny-by-default)
- Authorization is server-side (RBAC); client checks are never sufficient
- Sensitive actions write immutable audit logs
- Feature isolation: no cross-feature imports except via packages/shared types/contracts

## Repo layout (target)
- docs/prompts/** : agent instructions
- apps/web/**     : Next.js application (all portals)
- apps/worker/**  : scheduled/background jobs
- packages/**     : shared libs (db/auth/shared/ui)
- supabase/**     : migrations, policies, seeds (if used)

## Feature module boundaries (apps/web/src/features/*)
apps/web/src/features/* must isolate code per domain:
menu, ordering, kds, billing, promotions, inventory, procurement, payroll, expenses, reporting, rbac, audit

Rule:
- No cross-feature imports.
- Shared types/contracts only through packages/shared (Zod + types).
- UI primitives through packages/ui.
- Auth helpers through packages/auth.

## Required routes (must exist)
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

## Tenancy & hierarchy model (future 50 branches)
Core hierarchy:
- restaurant (tenant)
- branch
Optional grouping (future):
- region
- branch_group

Rules:
- All business records include restaurant_id and branch_id (unless globally scoped).
- Regional manager can be scoped to a set of branches via branch_group/region mapping.

## Identity model (MVP)
- Staff/Manager/Owner require authentication (Supabase Auth).
- Customer is anonymous by default.
- Staff assigned to restaurant + home branch (future: multi-branch access).

## Data flow (key lifecycles)
### Ordering + realtime
Customer places order -> orders tables persisted -> realtime publish -> KDS receives
Kitchen updates status -> realtime publish -> cashier/customer views update

### Billing
Billing creates receipts (MVP basic VAT/service charge) -> audit logs
Tax profile used only when customer requests invoice (opt-in PII; access restricted + audited)

### Inventory
Inventory invoices create stock lots (with expiry when applicable)
MVP deductions:
- manual deduction + lot tracking (FEFO encouraged)
Future:
- recipe-based deduction triggered on order completion

### Payroll/HR
Attendance (clock in/out) + policy -> payroll period draft -> manager approves/locks
OT tracked in minutes/hours; rate configurable later (store policy placeholders)

### Expenses
Utilities/rent/other categories recorded per branch; reporting per branch and consolidated later

## App runtime model
- apps/web: handles UI + server actions/API routes + realtime subscriptions
- apps/worker: scheduled jobs (expiry alerts, low stock alerts, daily summaries)

## Non-functional requirements
- Performance: fast menu browsing (image CDN, pagination), near-realtime KDS
- Reliability: avoid single points beyond DB
- Security: strict tenant isolation, auditability
- Cost: prefer low-cost managed services initially (Supabase + standard hosting)

## Deliverables (Wave 1)
- Working customer ordering flow (anonymous)
- Working KDS flow (realtime status updates)
- Basic settlement record + receipt output
- Skeleton CRUD for inventory, payroll, expenses (with audit hooks)
- i18n scaffolding (TH/EN/JP/ZH) for menu & UI

## Proposed contract files (locations)
- docs/API.md (endpoints and payload)
- docs/RBAC.md (roles/permissions)
- docs/ROUTES.md (routes and access)
- docs/RUNBOOK.md (setup)

## Questions / TODOs (confirm before heavy build)
- Payment: MVP "manual settlement" acceptable? (recommended yes)
- Inventory: start with manual deduction + invoice lots? (recommended yes)
- Recipes: required in MVP or Phase 2?
- Menu structure: categories + modifiers + set menus (MVP needs categories + modifiers)
- Tax invoice numbering format (Phase 2)


