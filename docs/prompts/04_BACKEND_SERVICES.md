# 04_BACKEND_SERVICES — RanRHar

This document defines backend services, server actions/API routes, and business rules for MVP.
Must comply with:
- docs/prompts/00_SYSTEM.md
- docs/prompts/02_SECURITY_RBAC_RLS.md
- docs/prompts/03_DATABASE_SCHEMA.md

Implementation target: Next.js App Router (server actions or route handlers) + Supabase.
All mutations require:
- Zod validation
- RBAC permission check (server-side)
- RLS enforcement at DB
- Audit log entry (before/after where applicable)
Use transactions for billing, inventory, payroll, and role changes.

## 0) Backend structure (recommended)
apps/web/src/server/
- auth/ (session, role, scope resolution)
- permissions/ (permission checks)
- audit/ (audit write helper)
- domains/
  - menu/
  - ordering/
  - kds/
  - billing/
  - promotions/
  - inventory/
  - payroll/
  - expenses/
- db/ (supabase client wrapper)

Public API routes (if used):
apps/web/src/app/api/**

## 1) Authorization & scope rules
- Every request resolves: actor_user_id, actor_role, restaurant_id, branch scope set.
- RBAC:
  - Map roles -> permissions (docs/RBAC.md later)
- Scope:
  - Cashier/Kitchen/Manager: branch scope
  - Owner: all branches (future)
- Never trust client-provided restaurant_id/branch_id; derive from session or validated table_code.

## 2) Public (customer) endpoints/actions
### 2.1 Resolve table context
Action: getTableContext(tableCode)
- Input: { tableCode: string }
- Output: { restaurant_id, branch_id, table_id, table_name }
- Rules:
  - table_code must exist and be active
  - return minimal fields
- Security:
  - Public read only, no PII

### 2.2 List published menu
Action: listMenu(tableCode)
- Input: { tableCode }
- Output: categories + items + modifiers (published only)
- Rules:
  - only menus with is_published = true
  - branch-scoped

### 2.3 Create order (anonymous)
Action: createOrder(tableCode, items[])
- Input:
  - tableCode
  - items: [{ menu_item_id, quantity, modifier_ids?[] }]
- Output: { order_id, status, totals }
- Rules:
  - validate item exists and active
  - compute totals server-side
  - initial status = NEW
- Security:
  - public create permitted only with valid table context
  - do not allow arbitrary branch/restaurant

### 2.4 Get order status
Action: getOrderStatus(order_id, tableCode)
- Input: { order_id, tableCode }
- Output: order + items + statuses
- Rules:
  - only allow if order belongs to the same table/branch context

## 3) Staff/KDS endpoints/actions
### 3.1 KDS list orders
Action: kdsListOrders(branch_id, filter?)
- Permission: kds.read
- Output: recent orders with items and statuses
- Must be branch-scoped

### 3.2 Update item/order status
Action: kdsUpdateStatus(order_id, order_item_id?, status, reason?)
- Permission: kds.update_status
- Rules:
  - validate allowed transitions
  - write audit log
  - publish realtime event

### 3.3 Cashier view orders
Action: cashierListOpenOrders()
- Permission: order.read + bill.create (or cashier equivalent)

## 4) Billing endpoints/actions (transactions required)
### 4.1 Create settlement (record payment)
Action: createSettlement(order_id, method, amount)
- Permission: bill.pay
- Rules:
  - transaction:
    - verify order totals
    - insert settlement
    - optionally mark order paid (if using status)
  - audit log

### 4.2 Issue receipt (basic VAT/service charge)
Action: issueReceipt(order_id)
- Permission: receipt.issue
- Rules:
  - transaction:
    - compute subtotal/service/vat/total
    - generate receipt_number sequential per branch
    - insert receipt
  - audit log

### 4.3 Issue tax invoice (optional)
Action: issueTaxInvoice(receipt_id, tax_profile_input | existing_tax_profile_id)
- Permission: tax_invoice.issue + customer_tax_profile.read/write
- Rules:
  - if new/edited tax profile -> audit PII change
  - generate invoice_number (format placeholder)
  - insert tax invoice
  - audit log

### 4.4 Void receipt / payment (MVP optional)
Action: voidReceipt(receipt_id, reason)
- Permission: bill.void
- Rules:
  - transaction + audit

## 5) Promotions (MVP minimal)
### 5.1 CRUD promotions
Actions:
- createPromotion(...)
- updatePromotion(...)
- disablePromotion(...)
Permissions: promotions.write
Rules:
- promotions applied at order create time (MVP) or at cashier (future)
- audit log for changes

## 6) Inventory & procurement (MVP)
### 6.1 Receive supplier invoice
Action: receiveSupplierInvoice(invoice, items[])
- Permission: inventory.receive_invoice
- Rules:
  - transaction:
    - insert supplier_invoice + items
    - create stock_lots for each item
    - insert stock_movements (IN)
  - audit log

### 6.2 Manual stock adjustment
Action: adjustStock(ingredient_id, quantity_delta, reason)
- Permission: inventory.adjust
- Rules:
  - transaction:
    - apply adjustment via stock_movements (ADJUST)
    - update stock_lots strategy (simple: newest lot; future: FEFO)
  - audit log

### 6.3 Alerts (computed endpoints)
- listLowStock(thresholds)
- listExpiringStock(days)
Permissions: inventory.read

## 7) Payroll/HR (MVP)
### 7.1 Attendance logging
Actions:
- clockIn(staff_id)
- clockOut(staff_id)
Permissions: payroll.write (or staff self permission)
Rules:
- staff can create own logs; manager can edit with audit

### 7.2 Leave requests
Actions:
- requestLeave(...)
- approveLeave(...)
Permissions: payroll.write / payroll.lock (approve)
Audit required on approvals

### 7.3 Payroll periods
Actions:
- createPayrollPeriod(start,end)
- computePayrollDraft(period_id)
- approvePayroll(period_id)
- lockPayroll(period_id)
Permissions: payroll.write / payroll.lock
Rules:
- store OT hours; OT rate config is placeholder (future)
- audit all approve/lock

## 8) Expenses (MVP)
Actions:
- createExpenseCategory(name)
- createExpense(branch_id, category_id, amount, date, note)
- listExpenses(filters)
Permissions: expenses.write/read
Audit for create/update/delete

## 9) Realtime events (Supabase)
Publish events on:
- order.created
- order.status_updated
- receipt.issued
- inventory.updated (optional)
Consumers:
- Customer order status view
- KDS screen
- Cashier screen

## 10) Error handling & validation
- Use Zod for all inputs.
- Return typed errors:
  - VALIDATION_ERROR
  - PERMISSION_DENIED
  - NOT_FOUND
  - CONFLICT (invalid transitions)
- Never leak PII in errors.

## 11) Deliverables (Wave 2 backend)
- Server actions/API for:
  - customer: table context, menu, create order, order status
  - staff: KDS list + update status
  - cashier: settlement + receipt + tax invoice
  - manager: inventory invoice receive + adjust; payroll period + lock; expenses CRUD
- Audit helper + permission middleware
- Transaction wrappers for critical flows
