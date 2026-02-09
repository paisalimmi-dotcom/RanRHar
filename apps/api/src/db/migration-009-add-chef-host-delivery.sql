-- Migration 009: Add chef, host, delivery roles
-- Date: 2026-02-08
-- Purpose: Support kitchen, front-of-house, and delivery staff

-- 1. Add new roles to role check
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('owner', 'manager', 'staff', 'cashier', 'chef', 'host', 'delivery', 'guest'));

-- 2. Insert test users (password: password123)
INSERT INTO users (email, password_hash, role) VALUES
    ('chef@test.com', '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', 'chef'),
    ('host@test.com', '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', 'host'),
    ('delivery@test.com', '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', 'delivery')
ON CONFLICT (email) DO NOTHING;
