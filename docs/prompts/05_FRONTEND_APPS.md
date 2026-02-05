# 05_FRONTEND_APPS — RanRHar

This document defines UI portals, routes, and frontend responsibilities for MVP.
Must align with:
- docs/prompts/00_SYSTEM.md
- docs/prompts/01_ARCHITECTURE.md
- docs/prompts/02_SECURITY_RBAC_RLS.md
- docs/prompts/03_DATABASE_SCHEMA.md
- docs/prompts/04_BACKEND_SERVICES.md

Implementation target: Next.js App Router (apps/web).
UI must be responsive and photo-rich for menu browsing.
All business rules and authorization are enforced server-side; frontend gating is UX only.

## 0) Global UI requirements
- i18n languages: th, en, ja, zh
- Currency: THB display (formatting), store integer minor units server-side
- Images: menu images from storage, lazy-load, responsive
- Accessibility: readable font sizes, large tap targets for customer menu
- Realtime: KDS + customer order status via Supabase Realtime subscriptions

## 1) Portals
### 1.1 Customer (public, anonymous default)
- Entry via QR -> /menu/[tableCode]
- Features:
  - browse menu categories
  - item details + modifiers
  - cart
  - place order
  - order status view
  - optional: call staff (future)

### 1.2 Staff (authenticated)
- KDS screen (kitchen)
- Cashier screen (billing/receipt)
- Staff permissions determine which routes are visible

### 1.3 Manager (authenticated, elevated)
- Manage menu, promotions (MVP minimal)
- Inventory (supplier invoices, stock adjustments, alerts)
- Payroll (attendance, leave, payroll periods)
- Expenses (utilities/rent/other categories)

### 1.4 Owner (authenticated, highest)
- Dashboard summary: sales, receipts count, inventory alerts, labor/expenses summary
- Future: multi-branch consolidation

## 2) Route map (must exist)
Customer:
- /menu/[tableCode]
  - loads table context via getTableContext
  - lists published menu via listMenu
  - manages cart locally (client state)
  - calls createOrder
  - subscribes to order status updates

Staff:
- /staff/kds
  - lists active orders (kdsListOrders)
  - realtime subscription for new orders/status updates
  - UI for status transitions (buttons)
- /staff/cashier
  - lists open orders (cashierListOpenOrders)
  - settlement create (createSettlement)
  - issue receipt (issueReceipt)
  - optional tax invoice (issueTaxInvoice + tax profile form/select)

Manager:
- /manager/menu
  - CRUD menu, categories, items, modifiers
  - image upload UI (storage)
- /manager/inventory
  - ingredients CRUD
  - receive supplier invoice (form + line items)
  - stock alerts (low stock / expiring)
  - manual stock adjustment
- /manager/payroll
  - staff list (basic)
  - attendance log view
  - leave requests approve
  - payroll period create -> compute draft -> approve/lock
- /manager/expenses
  - expense categories CRUD
  - create expense entries (utilities, rent, other)
  - monthly list view

Owner:
- /owner/dashboard
  - KPIs by branch (MVP single branch)
  - summary tiles:
    - today sales (sum settlements)
    - receipts issued
    - low stock alerts count
    - expiring stock count
    - payroll period status
    - expenses this month

## 3) Layout & navigation
- Public customer layout: minimal header, language switch, cart icon
- Authenticated layout:
  - sidebar navigation based on role permissions (UX only)
  - branch selector UI (MVP fixed, future multi-branch)
- Provide quick switch:
  - KDS <-> Cashier for staff with both permissions

## 4) i18n strategy
- Use a single i18n system across portals.
- Source strings:
  - UI labels in locale files: /apps/web/src/i18n/*
- Menu item translations:
  - MVP: store menu text in one language + allow translation fields later
  - Preferred: menu_items has name_th, name_en, name_ja, name_zh (future)
  - Until then, display fallback ordering: selected -> th -> en

## 5) State management
- Customer cart state: client-side (local state) keyed by tableCode
- Order status: server fetch + realtime updates
- Staff dashboards: server fetch + realtime

## 6) Forms & validation
- Use shared Zod schemas from packages/shared where possible
- Validate on client for UX, but server remains source of truth

## 7) Security notes (frontend)
- Never embed secrets in frontend
- Do not rely on client role checks for authorization
- Hide routes in UI based on role, but backend must enforce

## 8) UX specifics (MVP)
Customer:
- Category tabs
- Item card with photo, price THB
- Cart summary fixed bottom bar

KDS:
- Columns by status (NEW/COOKING/READY) optional
- Fast status buttons
- Large readable typography

Cashier:
- Select order -> show totals -> record settlement -> issue receipt
- Tax invoice option appears only after receipt issued

Manager:
- Simple CRUD screens
- Inventory receive invoice: repeatable line items table

## 9) Deliverables (Wave 2 frontend)
- All routes render without errors
- Customer can place order end-to-end with realtime updates
- KDS can update statuses
- Cashier can record payment + issue receipt
- Manager CRUD skeleton for inventory/payroll/expenses
- Language switch present; THB formatting correct
