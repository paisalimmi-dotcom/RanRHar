# 09_TESTING_E2E — RanRHar

This document defines end-to-end (E2E) and critical integration tests for the MVP.
Testing is mandatory: a feature is not complete until covered by the critical-path E2E tests.

## 0) Tooling (recommended for MVP)
- Playwright for E2E (browser automation)
- Vitest for unit/integration tests (optional early)
- Test DB: Supabase project (separate env) or local supabase if available later
- Seed scripts must create:
  - 1 restaurant, 1 branch
  - 2 tables with table_code
  - 1 menu with categories/items/modifiers
  - staff users: OWNER, MANAGER, CASHIER, KITCHEN

## 1) Environments & data strategy
- Use deterministic seed data.
- Use unique order ids per test run.
- Avoid relying on real payment gateways (MVP uses manual settlement records).

## 2) Critical-path E2E scenarios (must pass)
### E2E-01: Customer scans QR -> views menu (public)
Steps:
1) Visit /menu/[tableCode]
2) Verify table context loads
3) Verify published menu renders categories + item cards with images (or placeholders)
4) Verify language switch toggles UI labels
Assertions:
- HTTP 200
- menu items visible
- currency formatted as THB

### E2E-02: Customer creates an order (public)
Steps:
1) Add 2 items to cart (with optional modifier)
2) Place order
Assertions:
- order_id returned and displayed
- order status initially NEW
- order items count matches cart

### E2E-03: KDS receives order and updates status (authenticated)
Steps:
1) Login as KITCHEN
2) Open /staff/kds
3) Verify new order appears (poll or realtime)
4) Update status: NEW -> ACCEPTED -> COOKING -> READY
Assertions:
- status transitions succeed
- updated status reflected on KDS UI
- audit log entry exists for each status change

### E2E-04: Customer sees realtime status updates (public)
Steps:
1) With the same order, customer page remains open
2) Observe status changes propagated
Assertions:
- customer view updates to READY (via realtime or refresh)
- no PII leakage

### E2E-05: Cashier records payment and issues receipt (authenticated)
Steps:
1) Login as CASHIER
2) Open /staff/cashier
3) Select the order
4) Create settlement (method=CASH)
5) Issue receipt
Assertions:
- settlement record created
- receipt issued with sequential receipt_number (per branch)
- audit log entries exist for settlement + receipt

### E2E-06: Optional tax invoice (authenticated, restricted)
Steps:
1) After receipt issued, choose "Issue tax invoice"
2) Create a new customer_tax_profile (name + tax_id + address)
3) Issue invoice
Assertions:
- tax invoice record created
- tax profile stored (restaurant-scoped)
- access restricted: KITCHEN cannot read tax profiles
- audit log includes before/after for tax profile change

### E2E-07: Inventory receive supplier invoice -> stock lots created (authenticated)
Steps:
1) Login as MANAGER
2) Open /manager/inventory
3) Receive supplier invoice with 2 ingredients line items, one with expiry_date
Assertions:
- supplier_invoice + items created
- stock_lots created and quantities match
- stock_movements IN created
- audit log written

### E2E-08: Payroll period create -> compute draft -> lock (authenticated)
Steps:
1) Login as MANAGER
2) Open /manager/payroll
3) Create payroll period
4) Compute draft
5) Lock payroll
Assertions:
- payroll_period status transitions DRAFT -> APPROVED/LOCKED (per design)
- payroll_items created
- audit logs exist for approve/lock

### E2E-09: Expenses create utilities entry (authenticated)
Steps:
1) Login as MANAGER
2) Open /manager/expenses
3) Create category (Utilities)
4) Create expense entry (electric bill)
Assertions:
- expense record created
- visible in monthly list
- audit log written

## 3) Negative/security tests (must pass)
### SEC-01: Cross-branch isolation
- Create a second branch in seeds (even if UI is MVP)
- Attempt to read branch B orders with branch A scoped user
- Expect PERMISSION_DENIED or empty result (RLS enforced)

### SEC-02: Role restrictions for PII
- Login as KITCHEN
- Attempt to fetch tax profiles endpoint/action
- Expect PERMISSION_DENIED
- Ensure no PII returned

### SEC-03: Anonymous cannot access staff routes
- Visit /staff/kds without auth
- Expect redirect/login or 401/403

## 4) Test artifacts & reporting
- Save screenshots on failure
- Save console logs on failure
- Provide a simple test report summary in CI later

## 5) Definition of Done (MVP)
MVP is considered done when:
- All Critical-path E2E scenarios pass (E2E-01 to E2E-09)
- Negative/security tests pass (SEC-01 to SEC-03)
- Seed data and test environment are reproducible
