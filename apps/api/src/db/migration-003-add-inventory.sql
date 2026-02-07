-- Migration 003: Add inventory tables
-- Feature-09: Inventory Management
-- Date: 2026-02-07

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL, -- e.g., kg, g, l, ml, pcs, box
    min_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_movements table for audit trail
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUST')),
    quantity DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item_id ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);

-- Rollback instructions:
-- DROP TABLE IF EXISTS stock_movements;
-- DROP TABLE IF EXISTS inventory_items;
