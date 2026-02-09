-- Migration 011: Add table_code to orders
-- Date: 2026-02-08
-- Purpose: Store table code with orders so staff can see which table ordered

-- 1. Add table_code column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_code VARCHAR(50);

-- 2. Add index for performance
CREATE INDEX IF NOT EXISTS idx_orders_table_code ON orders(table_code);

-- 3. Note: Existing orders will have table_code = NULL
-- This is acceptable - only new orders will have table_code

-- Rollback instructions:
-- DROP INDEX IF EXISTS idx_orders_table_code;
-- ALTER TABLE orders DROP COLUMN IF EXISTS table_code;
