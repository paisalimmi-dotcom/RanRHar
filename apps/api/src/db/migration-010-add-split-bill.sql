-- Migration 010: Add Split Bill Support
-- Date: 2026-02-08
-- Purpose: Support multiple payments per order (split bill)

-- 1. Add payer column to payments (optional - for tracking who paid)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payer VARCHAR(255);

-- 2. Add payment_type to distinguish single/split/combined
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'SINGLE'
    CHECK (payment_type IN ('SINGLE', 'SPLIT', 'COMBINED'));

-- 3. Note: We don't change the constraint that prevents duplicate payments
-- Instead, we allow multiple payments per order by removing the check
-- The existing check "payment already exists" will be handled in application logic
-- for SINGLE payment type, but allow multiple for SPLIT type

-- 4. Add index for payer (if needed for queries)
CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer) WHERE payer IS NOT NULL;

-- Rollback instructions:
-- ALTER TABLE payments DROP COLUMN IF EXISTS payer;
-- ALTER TABLE payments DROP COLUMN IF EXISTS payment_type;
-- DROP INDEX IF EXISTS idx_payments_payer;
