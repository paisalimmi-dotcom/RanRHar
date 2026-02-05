# 02_SECURITY_RBAC_RLS — RanRHar

## Objective
Implement security-first access control using:
- Supabase Row Level Security (RLS) as hard isolation
- RBAC (role/permission) as business authorization
- Full audit trail for sensitive actions

## Roles
- OWNER
- MANAGER
- CASHIER
- KITCHEN
- STAFF

## Scope model (future-ready)
- SELF
- BRANCH
- REGION (future)
- ALL (owner)

For MVP: enforce BRANCH + SELF.

## Hard rules
- Every business table has: restaurant_id, branch_id, created_at, updated_at
- RLS must deny by default (no broad public access)
- All mutations must:
  1) validate input
  2) check permission server-side
  3) write audit_logs with before/after JSON

## Required tables for authz/audit
- roles
- permissions
- role_permissions
- user_roles
- audit_logs

## RLS requirements
Deliver a supabase/rls.sql with policies that:
- allow authenticated users to read/write only within their restaurant_id + branch_id scope
- allow STAFF to read own profile and own attendance only
- allow KITCHEN to read orders/kitchen tickets for their branch, but not billing/payroll
- allow CASHIER to manage bills/payments for branch, but not inventory adjustments
- allow MANAGER to manage menu/inventory/payroll/expenses for branch
- allow OWNER to access all branches (future)

## Audit requirements (minimum)
Audit log entries for:
- menu price changes
- bill create/split/void/payment
- stock adjustments, invoice receive, stock move
- payroll approve/lock
- role/permission changes
Include: actor_user_id, action, entity, entity_id, before_json, after_json, created_at.

## Deliverables
- RBAC permission list (docs/RBAC.md)
- RLS SQL (supabase/rls.sql)
- Audit schema and helper function for inserts

