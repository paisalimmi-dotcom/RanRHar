-- Migration 004: Add guest user for customer orders + fix password hashes
-- Date: 2026-02-08
-- Purpose: Allow customers to place orders without staff login; fix invalid bcrypt hashes

-- 1. Fix password hashes for existing test users (password: password123)
-- Hash generated with: node seed-passwords.js
UPDATE users SET password_hash = '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u'
WHERE email IN ('owner@test.com', 'staff@test.com', 'cashier@test.com');

-- 2. Add 'guest' role to allow customer orders
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('owner', 'staff', 'cashier', 'guest'));

-- 3. Insert guest user for customer-placed orders (never used for login)
-- Uses same hash format; auth blocks role=guest from logging in
INSERT INTO users (email, password_hash, role) VALUES
    ('guest@system', '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', 'guest')
ON CONFLICT (email) DO NOTHING;

-- Rollback instructions:
-- DELETE FROM users WHERE email = 'guest@system';
-- ALTER TABLE users DROP CONSTRAINT users_role_check;
-- ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('owner', 'staff', 'cashier'));
