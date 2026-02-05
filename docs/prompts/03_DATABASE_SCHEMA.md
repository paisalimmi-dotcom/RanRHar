# 03_DATABASE_SCHEMA — RanRHar

This document defines the MVP database schema design for RanRHar.
It is vendor-neutral but optimized for PostgreSQL (Supabase).
All tables must comply with tenant isolation and security rules defined in:
- docs/prompts/00_SYSTEM.md
- docs/prompts/02_SECURITY_RBAC_RLS.md

## 0) Global conventions (non-negotiable)
- All business tables include:
  - id (uuid, primary key)
  - restaurant_id (uuid, not null)
  - branch_id (uuid, not null) unless explicitly global
  - created_at (timestamptz)
  - updated_at (timestamptz)
- Soft delete is preferred where applicable (deleted_at nullable).
- All money values stored as integer (smallest currency unit, e.g., satang).
- Use explicit status enums (text or enum) for lifecycle states.
- All sensitive tables must be compatible with RLS deny-by-default.

## 1) Core tenant & identity tables
### restaurants
- id
- name
- legal_name (nullable)
- tax_id (nullable)
- created_at, updated_at

### branches
- id
- restaurant_id
- name
- code (short human-readable)
- address
- is_active
- created_at, updated_at

### staff_profiles
- id
- user_id (Supabase auth uid)
- restaurant_id
- home_branch_id
- display_name
- role (OWNER / MANAGER / CASHIER / KITCHEN / STAFF)
- is_active
- created_at, updated_at

(Staff access to multiple branches is future via a join table.)

## 2) Menu & ordering
### menus
- id
- restaurant_id
- branch_id
- name
- is_published
- created_at, updated_at

### menu_categories
- id
- restaurant_id
- branch_id
- menu_id
- name
- position
- is_active

### menu_items
- id
- restaurant_id
- branch_id
- menu_category_id
- name
- description
- price
- image_url
- is_active

### menu_modifiers
- id
- restaurant_id
- branch_id
- menu_item_id
- name
- price_delta
- is_active

### tables
- id
- restaurant_id
- branch_id
- table_code (used in QR)
- name
- is_active

### orders
- id
- restaurant_id
- branch_id
- table_id
- status (NEW / ACCEPTED / COOKING / READY / SERVED / CANCELLED)
- total_amount
- created_at, updated_at

### order_items
- id
- restaurant_id
- branch_id
- order_id
- menu_item_id
- quantity
- unit_price
- status

## 3) Billing, receipts, VAT
### settlements
- id
- restaurant_id
- branch_id
- order_id
- method (CASH / CARD / MANUAL)
- amount
- paid_at

### receipts
- id
- restaurant_id
- branch_id
- order_id
- receipt_number (sequential per branch)
- subtotal
- service_charge
- vat_amount
- total
- issued_at

### customer_tax_profiles (PII, restricted)
- id
- restaurant_id
- name
- tax_id
- address
- phone
- email
- created_at, updated_at

### tax_invoices
- id
- restaurant_id
- branch_id
- receipt_id
- customer_tax_profile_id
- invoice_number
- issued_at

## 4) Inventory & procurement
### ingredients
- id
- restaurant_id
- branch_id
- name
- unit (kg / g / l / pcs)
- is_active

### supplier_invoices
- id
- restaurant_id
- branch_id
- supplier_name
- invoice_number
- invoice_date
- total_amount

### supplier_invoice_items
- id
- restaurant_id
- branch_id
- supplier_invoice_id
- ingredient_id
- quantity
- unit_cost
- expiry_date (nullable)

### stock_lots
- id
- restaurant_id
- branch_id
- ingredient_id
- quantity_remaining
- unit_cost
- expiry_date (nullable)

### stock_movements
- id
- restaurant_id
- branch_id
- ingredient_id
- type (IN / OUT / ADJUST)
- quantity
- reference_type
- reference_id
- created_at

## 5) Payroll / HR
### attendance_logs
- id
- restaurant_id
- branch_id
- staff_id
- clock_in
- clock_out

### leave_requests
- id
- restaurant_id
- branch_id
- staff_id
- leave_type
- start_date
- end_date
- status

### payroll_periods
- id
- restaurant_id
- branch_id
- period_start
- period_end
- status (DRAFT / APPROVED / LOCKED)

### payroll_items
- id
- restaurant_id
- branch_id
- payroll_period_id
- staff_id
- hours_worked
- ot_hours
- amount

## 6) Expenses
### expense_categories
- id
- restaurant_id
- name
- is_active

### expenses
- id
- restaurant_id
- branch_id
- expense_category_id
- amount
- expense_date
- note

## 7) Audit logs (security-critical)
### audit_logs
- id
- restaurant_id
- branch_id
- actor_user_id
- actor_role
- action
- entity
- entity_id
- before_json
- after_json
- created_at

## 8) Indexing & performance notes
- Index all foreign keys (restaurant_id, branch_id).
- Composite indexes where common filters apply (branch_id + status).
- Partial indexes for active records where applicable.

## 9) RLS compatibility notes
- RLS policies must scope access by restaurant_id and branch_id.
- customer_tax_profiles requires extra role checks (CASHIER+).
- Anonymous access limited to published menu + order creation.

## 10) Deliverables (Wave 1 DB)
- Initial schema (migrations)
- Seed data for:
  - restaurant
  - branch
  - roles
  - sample menu
- Baseline RLS policies
