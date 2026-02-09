-- Migration 016: Add Menu Modifiers Support
-- Date: 2026-02-08
-- Purpose: Support modifiers (options) for menu items (e.g., size, spice level, add-ons)

-- 1. Create menu_modifiers table
CREATE TABLE IF NOT EXISTS menu_modifiers (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    price_delta DECIMAL(10, 2) NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 999,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_modifiers_menu_item_id ON menu_modifiers(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_modifiers_is_active ON menu_modifiers(is_active);

-- 3. Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_modifiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for updated_at
CREATE TRIGGER trigger_menu_modifiers_updated_at
    BEFORE UPDATE ON menu_modifiers
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_modifiers_updated_at();

-- 5. Add modifier_ids column to orders.items JSONB (will be handled in application layer)
-- Note: We'll store modifier IDs in the order items JSON structure
-- Example: {"id": "1", "name": "ผัดไทย", "quantity": 1, "modifierIds": [1, 2]}

-- Rollback instructions:
-- DROP TRIGGER IF EXISTS trigger_menu_modifiers_updated_at ON menu_modifiers;
-- DROP FUNCTION IF EXISTS update_menu_modifiers_updated_at();
-- DROP INDEX IF EXISTS idx_menu_modifiers_is_active;
-- DROP INDEX IF EXISTS idx_menu_modifiers_menu_item_id;
-- DROP TABLE IF EXISTS menu_modifiers;
