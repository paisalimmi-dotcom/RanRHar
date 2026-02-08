# Database Migrations

## Overview

This document tracks all database schema migrations for the RanRHar project. Migrations must be executed in order to maintain database consistency.

**Database**: PostgreSQL 14+

**Migration Location**: `apps/api/src/db/`

---

## Migration History

### Initial Schema (schema.sql)

**Date**: 2026-02-06

**Description**: Initial database schema with users, orders, and payments tables.

**File**: [schema.sql](file:///d:/RanRHar-1/apps/api/src/db/schema.sql)

**Tables Created**:
- `users` - User accounts with email, password hash, and role
- `orders` - Customer orders with items (JSONB), total, and status
- `payments` - Payment records linked to orders

**Indexes Created**:
- `idx_users_email` - Email lookup performance
- `idx_orders_created_by` - Orders by user lookup
- `idx_orders_created_at` - Orders by date sorting
- `idx_orders_status` - Orders by status filtering
- `idx_payments_order_id` - Payment lookup by order
- `idx_payments_status` - Payment status filtering

**Seed Data**:
- 3 test user accounts (owner, staff, cashier)

**Execute**:
```bash
psql -U postgres -d ranrhar -f apps/api/src/db/schema.sql
```

**Rollback**:
```sql
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS users;
```

---

### Migration 001: Add Order Status Tracking

**Date**: 2026-02-07

**Feature**: Feature-07 - Admin Dashboard Order Management Phase 1

**Description**: Added status column to orders table for order lifecycle tracking.

**File**: [migration-001-add-order-status.sql](file:///d:/RanRHar-1/apps/api/src/db/migration-001-add-order-status.sql)

**Changes**:
- Added `status` column to `orders` table
- Default value: `PENDING`
- Constraint: `CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED'))`
- Added index `idx_orders_status` for filtering performance

**Status Values**:
- `PENDING` - Order placed, awaiting confirmation
- `CONFIRMED` - Order confirmed, in preparation
- `COMPLETED` - Order completed and delivered

**Execute**:
```bash
psql -U postgres -d ranrhar -f apps/api/src/db/migration-001-add-order-status.sql
```

**Rollback**:
```sql
DROP INDEX IF EXISTS idx_orders_status;
ALTER TABLE orders DROP COLUMN IF EXISTS status;
```

**Note**: If running after initial schema, this migration is idempotent (uses `IF NOT EXISTS`).

---

### Migration 002: Add Payments Table

**Date**: 2026-02-07

**Feature**: Feature-08 - Payment Integration

**Description**: Created payments table for recording order payments.

**File**: [migration-002-add-payments.sql](file:///d:/RanRHar-1/apps/api/src/db/migration-002-add-payments.sql)

**Changes**:
- Created `payments` table with order_id foreign key
- Payment methods: `CASH`, `QR`
- Payment status: `PAID`, `REFUNDED`
- Added indexes for performance

**Table Structure**:
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(20) NOT NULL CHECK (method IN ('CASH', 'QR')),
    status VARCHAR(20) NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'REFUNDED')),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id),
    notes TEXT
);
```

**Execute**:
```bash
psql -U postgres -d ranrhar -f apps/api/src/db/migration-002-add-payments.sql
```

**Rollback**:
```sql
DROP INDEX IF EXISTS idx_payments_status;
DROP INDEX IF EXISTS idx_payments_order_id;
DROP TABLE IF EXISTS payments;
```

**Note**: This migration is included in the main schema.sql, so only needed if upgrading from an earlier version.

---

## Migration Execution Guide

### Fresh Installation

For a new database, run only the main schema:

```bash
# Create database
psql -U postgres -c "CREATE DATABASE ranrhar;"

# Run schema (includes all tables and migrations)
psql -U postgres -d ranrhar -f apps/api/src/db/schema.sql
```

### Upgrading Existing Database

If upgrading from an earlier version, run migrations in order:

```bash
# Check current schema version (manually verify which tables/columns exist)
psql -U postgres -d ranrhar -c "\d orders"

# Run missing migrations in order
psql -U postgres -d ranrhar -f apps/api/src/db/migration-001-add-order-status.sql
psql -U postgres -d ranrhar -f apps/api/src/db/migration-002-add-payments.sql
psql -U postgres -d ranrhar -f apps/api/src/db/migration-003-add-inventory.sql
psql -U postgres -d ranrhar -f apps/api/src/db/migration-004-add-guest-and-fix-passwords.sql
```

### Verifying Migrations

```bash
# List all tables
psql -U postgres -d ranrhar -c "\dt"

# Check orders table structure
psql -U postgres -d ranrhar -c "\d orders"

# Check payments table structure
psql -U postgres -d ranrhar -c "\d payments"

# List all indexes
psql -U postgres -d ranrhar -c "\di"
```

---

## Creating New Migrations

### Naming Convention

```
migration-XXX-description.sql
```

- `XXX`: Zero-padded sequential number (001, 002, 003, ...)
- `description`: Brief kebab-case description

**Examples**:
- `migration-003-add-inventory-table.sql`
- `migration-004-add-user-timestamps.sql`

### Migration Template

```sql
-- Migration XXX: [Description]
-- Feature-XX: [Feature Name]
-- Date: YYYY-MM-DD

-- [SQL statements here]

-- Rollback instructions:
-- [SQL statements to undo this migration]
```

### Best Practices

1. **Idempotent**: Use `IF NOT EXISTS` / `IF EXISTS` where possible
2. **Documented**: Include feature reference and date
3. **Reversible**: Always include rollback instructions
4. **Tested**: Test both migration and rollback before committing
5. **Atomic**: Keep migrations focused on a single change
6. **Indexed**: Add indexes for frequently queried columns
7. **Constrained**: Use CHECK constraints for data validation

### Example Migration

```sql
-- Migration 003: Add inventory table
-- Feature-09: Inventory Management
-- Date: 2026-02-08

CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    min_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);

-- Rollback instructions:
-- DROP INDEX IF EXISTS idx_inventory_name;
-- DROP TABLE IF EXISTS inventory;
```

---

## Migration Checklist

Before deploying a migration to production:

- [ ] Migration file follows naming convention
- [ ] Migration includes header comment with feature reference and date
- [ ] Migration is idempotent (safe to run multiple times)
- [ ] Rollback instructions are included and tested
- [ ] Migration tested on development database
- [ ] Migration tested on staging database (if available)
- [ ] Database backup created before production migration
- [ ] Migration added to this MIGRATIONS.md document
- [ ] Migration number is sequential
- [ ] Related API/application code is ready to deploy

---

## Troubleshooting

### Migration Failed

1. Check error message in psql output
2. Verify database connection
3. Check for syntax errors in SQL
4. Verify table/column names don't conflict
5. Check foreign key constraints

### Rollback Migration

```bash
# Execute rollback commands from migration file
psql -U postgres -d ranrhar -c "DROP INDEX IF EXISTS idx_orders_status;"
psql -U postgres -d ranrhar -c "ALTER TABLE orders DROP COLUMN IF EXISTS status;"
```

### Check Migration Status

```bash
# List all tables
psql -U postgres -d ranrhar -c "\dt"

# Describe specific table
psql -U postgres -d ranrhar -c "\d orders"

# Check for specific column
psql -U postgres -d ranrhar -c "SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name='status';"
```

---

### Migration 003: Add Inventory Tables

**Date**: 2026-02-07

**Feature**: Feature-09 - Inventory Management

**File**: `apps/api/src/db/migration-003-add-inventory.sql`

**Changes**: Created `inventory_items` and `stock_movements` tables.

**Execute**: `psql -U postgres -d ranrhar -f apps/api/src/db/migration-003-add-inventory.sql`

---

### Migration 004: Add Guest User & Fix Passwords

**Date**: 2026-02-08

**Feature**: Customer Order Flow (Guest)

**File**: `apps/api/src/db/migration-004-add-guest-and-fix-passwords.sql`

**Changes**:
- Added `guest` role to users CHECK constraint
- Fixed bcrypt hashes for test users (password: password123)
- Inserted `guest@system` user for customer-placed orders

**Execute**: `psql -U postgres -d ranrhar -f apps/api/src/db/migration-004-add-guest-and-fix-passwords.sql`

---

### Migration 005: Add Menu Tables

**Date**: 2026-02-08

**Feature**: Menu from Database

**File**: `apps/api/src/db/migration-005-add-menu.sql`

**Changes**:
- Created `restaurants`, `menu_categories`, `menu_items` tables
- Seed data for default menu (9 items across 3 categories)

**Execute**: `psql -U postgres -d ranrhar -f apps/api/src/db/migration-005-add-menu.sql`

---

## Future Migrations (Planned)

The following migrations are planned for upcoming features:

- **Migration 006**: Add staff management tables
- **Migration 005**: Add menu management tables
- **Migration 006**: Add analytics/reporting tables

---

## Database Backup & Restore

### Create Backup

```bash
# Full database backup
pg_dump -U postgres ranrhar > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only
pg_dump -U postgres -s ranrhar > schema_backup.sql

# Data only
pg_dump -U postgres -a ranrhar > data_backup.sql
```

### Restore Backup

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS ranrhar;"
psql -U postgres -c "CREATE DATABASE ranrhar;"

# Restore from backup
psql -U postgres -d ranrhar < backup_20260207_133314.sql
```

> [!CAUTION]
> **Always create a backup before running migrations in production.** Database changes can be destructive and may result in data loss if not properly tested.
