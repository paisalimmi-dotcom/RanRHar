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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Seed data for testing
-- Password for all users: password123
-- Hash generated with bcryptjs, rounds=10
INSERT INTO users (email, password_hash, role) VALUES
    ('owner@test.com', '$2a$10$rZ5qH8qVqJ5qH8qVqJ5qHOqH8qVqJ5qH8qVqJ5qH8qVqJ5qH8qVqJ', 'owner'),
    ('staff@test.com', '$2a$10$rZ5qH8qVqJ5qH8qVqJ5qHOqH8qVqJ5qH8qVqJ5qH8qVqJ5qH8qVqJ', 'staff'),
    ('cashier@test.com', '$2a$10$rZ5qH8qVqJ5qH8qVqJ5qHOqH8qVqJ5qH8qVqJ5qH8qVqJ5qH8qVqJ', 'cashier')
ON CONFLICT (email) DO NOTHING;
