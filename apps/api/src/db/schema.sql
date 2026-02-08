-- RanRHar Database Schema
-- Feature-06A: Backend API Integration

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'staff', 'cashier')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(20) NOT NULL CHECK (method IN ('CASH', 'QR')),
    status VARCHAR(20) NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'REFUNDED')),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id),
    notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Seed data for testing
-- Password for all users: password123
-- Hash generated with bcryptjs, rounds=10 (run: node seed-passwords.js)
INSERT INTO users (email, password_hash, role) VALUES
    ('owner@test.com', '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', 'owner'),
    ('staff@test.com', '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', 'staff'),
    ('cashier@test.com', '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', 'cashier')
ON CONFLICT (email) DO NOTHING;
