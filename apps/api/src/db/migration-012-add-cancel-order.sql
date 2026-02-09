-- Migration 012: Add Cancel Order Support
-- Date: 2026-02-08
-- Purpose: Support order cancellation with tracking

-- 1. Add CANCELLED status to orders
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'));

-- 2. Add cancellation tracking columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_required BOOLEAN DEFAULT FALSE;

-- 3. Add index for cancelled orders queries
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at ON orders(cancelled_at) WHERE cancelled_at IS NOT NULL;

-- Rollback instructions:
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
-- ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED'));
-- ALTER TABLE orders DROP COLUMN IF EXISTS cancelled_at;
-- ALTER TABLE orders DROP COLUMN IF EXISTS cancelled_by;
-- ALTER TABLE orders DROP COLUMN IF EXISTS cancel_reason;
-- ALTER TABLE orders DROP COLUMN IF EXISTS refund_required;
-- DROP INDEX IF EXISTS idx_orders_cancelled_at;
