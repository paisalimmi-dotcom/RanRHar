-- Migration 013: Add i18n support for menu (name_en columns)
-- Date: 2026-02-08
-- Purpose: Support English names for menu categories and items

-- 1. Add name_en column to menu_categories
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS name_en VARCHAR(100);

-- 2. Add name_en column to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);

-- 3. Update existing categories with English names
UPDATE menu_categories SET name_en = 'Recommended' WHERE id = 1 AND name = 'แนะนำ';
UPDATE menu_categories SET name_en = 'Main Dishes' WHERE id = 2 AND name = 'อาหารจานหลัก';
UPDATE menu_categories SET name_en = 'Beverages' WHERE id = 3 AND name = 'เครื่องดื่ม';

-- 4. Update existing menu items with English names
UPDATE menu_items SET name_en = 'Pad Thai' WHERE id = 1 AND name = 'ผัดไทย';
UPDATE menu_items SET name_en = 'Tom Yum Goong' WHERE id = 2 AND name = 'ต้มยำกุ้ง';
UPDATE menu_items SET name_en = 'Green Curry' WHERE id = 3 AND name = 'แกงเขียวหวาน';
UPDATE menu_items SET name_en = 'Grilled Chicken' WHERE id = 4 AND name = 'ไก่ย่าง';
UPDATE menu_items SET name_en = 'Fried Rice' WHERE id = 5 AND name = 'ข้าวผัด';
UPDATE menu_items SET name_en = 'Stir-fried Vegetables' WHERE id = 6 AND name = 'ผัดผัก';
UPDATE menu_items SET name_en = 'Thai Iced Tea' WHERE id = 7 AND name = 'ชาเย็น';
UPDATE menu_items SET name_en = 'Mango Smoothie' WHERE id = 9 AND name = 'สมูทตี้มะม่วง';
