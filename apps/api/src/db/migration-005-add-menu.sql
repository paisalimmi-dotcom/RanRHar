-- Migration 005: Add menu tables
-- Feature: Menu from database
-- Date: 2026-02-08

-- Restaurants (single-tenant for now)
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu categories
CREATE TABLE IF NOT EXISTS menu_categories (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price_thb DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);

-- Seed default restaurant and menu (matches mock data)
INSERT INTO restaurants (id, name) VALUES (1, 'RanRHar')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES
    (1, 1, 'แนะนำ', 0),
    (2, 1, 'อาหารจานหลัก', 1),
    (3, 1, 'เครื่องดื่ม', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO menu_items (id, category_id, name, price_thb, image_url, sort_order) VALUES
    (1, 1, 'ผัดไทย', 199, 'https://picsum.photos/seed/padthai/400/300', 0),
    (2, 1, 'ต้มยำกุ้ง', 249, 'https://picsum.photos/seed/tomyum/400/300', 1),
    (3, 1, 'แกงเขียวหวาน', 189, 'https://picsum.photos/seed/greencurry/400/300', 2),
    (4, 2, 'ไก่ย่าง', 159, 'https://picsum.photos/seed/chicken/400/300', 0),
    (5, 2, 'ข้าวผัด', 89, 'https://picsum.photos/seed/friedrice/400/300', 1),
    (6, 2, 'ผัดผัก', 79, 'https://picsum.photos/seed/veggies/400/300', 2),
    (7, 3, 'ชาเย็น', 45, 'https://picsum.photos/seed/thaitea/400/300', 0),
    (8, 3, 'มะพร้าวอ่อน', 55, 'https://picsum.photos/seed/coconut/400/300', 1),
    (9, 3, 'สมูทตี้มะม่วง', 65, 'https://picsum.photos/seed/mango/400/300', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price_thb = EXCLUDED.price_thb, image_url = EXCLUDED.image_url;

-- Rollback instructions:
-- DROP TABLE IF EXISTS menu_items;
-- DROP TABLE IF EXISTS menu_categories;
-- DROP TABLE IF EXISTS restaurants;
