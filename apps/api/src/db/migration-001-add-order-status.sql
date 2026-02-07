-- Migration 001: Add order status tracking
-- Feature-07: Admin Dashboard Order Management Phase 1
-- Date: 2026-02-07

-- Add status column with default value and constraint
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED'));

-- Add index for filtering performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Rollback instructions:
-- DROP INDEX IF EXISTS idx_orders_status;
-- ALTER TABLE orders DROP COLUMN IF EXISTS status;
