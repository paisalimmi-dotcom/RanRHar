-- Migration 008: Add manager role
-- Date: 2026-02-08
-- Purpose: owner = view only, manager = full operational management

-- 1. Add manager to role check
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('owner', 'manager', 'staff', 'cashier', 'guest'));

-- 2. Insert manager test user (password: password123)
INSERT INTO users (email, password_hash, role) VALUES
    ('manager@test.com', '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', 'manager')
ON CONFLICT (email) DO NOTHING;
