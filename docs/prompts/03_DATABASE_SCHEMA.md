# 03_DATABASE_SCHEMA — RanRHar

## Objective
Create Postgres schema + migrations + seed for a single-branch full-function demo that is multi-branch ready.

## ORM
Prefer Drizzle (TypeScript). If impossible, use Prisma. Choose one only.

## Global table requirements
All business tables must include:
- id (uuid)
- restaurant_id (uuid)
- branch_id (uuid)
- created_at, updated_at (timestamptz)
Index at least (restaurant_id, branch_id) and any foreign keys.

## Mandatory domains (tables)
Core:
- restaurants, branches, tables (qr/tableCode)
- profiles (maps auth user to business identity)
- roles, permissions, role_permissions, user_roles
- audit_logs

Menu/Ordering:
- menu_categories
- menu_items
- menu_item_i18n (th/en/ja/zh)
- menu_images (storage paths)
- modifiers, modifier_options
- orders, order_items, order_item_modifiers
- kitchen_stations, kitchen_tickets, kitchen_ticket_items

Billing/Tax:
- bills, bill_items
- payments
- receipts, tax_invoices
- sequences (receipt_no, tax_invoice_no)

Promotions:
- promotions, promotion_rules, promotion_schedules

Inventory/Procurement:
- ingredients, uoms, uom_conversions
- recipes (menu_item -> ingredient qty)
- suppliers
- purchase_invoices, purchase_invoice_items, purchase_invoice_attachments
- inventory_lots (qty, unit_cost, expiry_date)
- stock_moves, stock_move_items
- alerts (low_stock, near_expiry)

Payroll/Time:
- employees, employment_terms
- shifts, shift_assignments
- attendance_logs, attendance_adjust_requests
- leave_types, leave_requests
- payroll_periods, payroll_items, payslips

Expenses:
- expense_categories, expenses, expense_attachments
- utility_bills
- rental_contracts
- budgets, budget_alerts

## Triggers / functions (supabase/functions.sql)
1) receive_invoice() -> creates stock IN moves + lots
2) complete_order() -> FEFO stock OUT based on recipes
3) lock_payroll_period() -> prevents editing attendance/payroll for that period
4) next_sequence_number() -> receipt/tax invoice numbering

## Seed requirements (supabase/seed.sql)
Create:
- 1 restaurant, 1 branch
- 10 tables with tableCode T01..T10
- sample menu + translations + placeholder images
- sample ingredients + recipes
- sample supplier invoice with lots and expiry
- sample employees + shifts + attendance
- sample expenses + utilities + budget
- sample roles/permissions + demo users (no secrets)

## Deliverables
- packages/db schema + migrations
- supabase/migrations
- supabase/functions.sql, supabase/seed.sql

