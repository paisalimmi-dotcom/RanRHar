-- Migration 015: Add KDS order statuses (NEW, ACCEPTED, COOKING, READY, SERVED)
-- Date: 2026-02-08
-- Purpose: Support detailed kitchen display system workflow

-- 1. Update orders table to include new statuses
-- Keep existing statuses for backward compatibility: PENDING, CONFIRMED, COMPLETED, CANCELLED
-- Add new KDS statuses: NEW, ACCEPTED, COOKING, READY, SERVED
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
    'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED',  -- Legacy statuses
    'NEW', 'ACCEPTED', 'COOKING', 'READY', 'SERVED'     -- KDS statuses
));

-- 2. Add index for KDS filtering (if not exists)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 3. Migration note:
-- PENDING maps to NEW (new orders)
-- CONFIRMED maps to ACCEPTED (accepted by kitchen)
-- COMPLETED maps to SERVED (served to customer)
-- New flow: NEW → ACCEPTED → COOKING → READY → SERVED

-- Rollback instructions:
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
-- ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'));
