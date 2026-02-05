# 02_SECURITY_RBAC_RLS — RanRHar

This document defines the security baseline for RanRHar:
- Tenant isolation with Supabase Row Level Security (RLS) as the hard boundary
- RBAC (roles/permissions) for business authorization
- Audit logging for sensitive actions
MVP: single restaurant + single branch, but policies must be multi-branch ready.

## 0) Non-negotiables
- RLS deny-by-default for all business tables.
- All business tables include: restaurant_id, branch_id.
- Server-side authorization required for all mutations (RBAC).
- Never trust frontend-only checks.
- PII (customer tax profiles) is opt-in only and restricted.
- Every sensitive mutation writes an immutable audit log entry.

## 1) Roles (MVP)
- OWNER
- MANAGER
- CASHIER
- KITCHEN
- STAFF
Customer is anonymous by default (no auth required for menu browsing and placing orders in MVP).

## 2) Scope model (MVP + future)
MVP scopes:
- SELF (own records)
- BRANCH (records in assigned branch)
Future:
- REGION / GROUP / ALL

Rules:
- STAFF: SELF for personal records; BRANCH for operational read where needed (e.g. view own shift assignments)
- KITCHEN: BRANCH scope for orders/kds; no billing/payroll/PII
- CASHIER: BRANCH scope for billing/receipts/tax invoice issuance; limited read of orders needed to bill
- MANAGER: BRANCH scope for menu/inventory/payroll/expenses
- OWNER: ALL branches (future-ready)

## 3) Permission model (RBAC)
Permissions must be granular and composable. Example naming:
- menu.read, menu.write
- order.read, order.create, order.update_status
- kds.read, kds.update_status
- bill.read, bill.create, bill.split, bill.pay, bill.void
- receipt.read, receipt.issue
- tax_invoice.issue
- customer_tax_profile.read, customer_tax_profile.write
- inventory.read, inventory.receive_invoice, inventory.adjust
- payroll.read, payroll.write, payroll.lock
- expenses.read, expenses.write, budget.write
- rbac.manage (owner/manager only)

Deliverable from SEC later:
- docs/RBAC.md must list full permissions and role mapping.

## 4) Customer PII controls (tax profiles)
- Default: no customer PII collected.
- Tax profile only when customer requests invoice.
- Access allowed only for CASHIER, MANAGER, OWNER.
- All create/update operations must be audited (before/after).
- Do not expose tax profiles to kitchen/staff.

## 5) Audit logging (minimum requirements)
Audit log records must include:
- actor_user_id
- actor_role (at time of action)
- restaurant_id, branch_id
- action (string)
- entity (table/domain)
- entity_id
- before_json (nullable)
- after_json (nullable)
- created_at

Minimum audited actions:
- menu price changes
- promotions create/update/disable
- bill create/split/move items/payment/void
- receipt issuance
- tax profile create/update
- inventory invoice receive, stock adjustments
- payroll approve/lock
- role/permission changes

## 6) RLS design (Supabase)
### 6.1 Deny-by-default
- Enable RLS on all tables.
- No permissive policies by default.

### 6.2 Branch isolation
For authenticated users:
- They can only access rows where (restaurant_id matches) AND (branch_id is within their allowed branch set).

MVP simplest approach:
- profiles table stores restaurant_id + home_branch_id
- user_roles links user_id to branch_id (optional, future multi-branch)
- A helper view/function can resolve allowed branches.

### 6.3 Public/anonymous access (customer)
Anonymous access must be minimal and safe:
- Allow read-only access to published menu and table lookup by tableCode.
- Allow create order limited to a validated tableCode context.
- No access to any staff-only or financial tables.

## 7) Deliverables (Wave 1 security outputs)
- docs/RBAC.md (permission list + mapping)
- supabase/rls.sql (baseline policies)
- Audit log schema + helper insert function

## 8) Questions / TODOs
- Do we allow anonymous order placement in MVP? (recommended yes)
- Do we require staff login for cashier? (yes)
- Any PDPA retention requirements? (TODO)
