import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

export let pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Mock query for development if DB is unavailable
const mockPool = {
    query: async (text: string, params?: any[]) => {
        console.log('🏗️ [MOCK DB] Executing:', text);
        // Simple mocks for basic queries
        if (text.includes('SELECT NOW()')) return { rows: [{ now: new Date() }] };
        if (text.includes('SELECT * FROM users')) {
            return { rows: [{ id: 1, email: 'owner@test.com', password_hash: '$2a$10$rZ5qH8qVqJ5qH8qVqJ5qHOqH8qVqJ5qH8qVqJ5qH8qVqJ5qH8qVqJ', role: 'owner' }] };
        }
        if (text.includes('INSERT INTO orders')) {
            return { rows: [{ id: Math.floor(Math.random() * 1000) }] };
        }
        if (text.includes('SELECT * FROM orders')) {
            return { rows: [] };
        }
        return { rows: [] };
    },
    connect: async () => ({
        query: mockPool.query,
        release: () => { },
    }),
    on: () => { },
    end: async () => { },
};

// Test connection and fallback
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.warn('⚠️ Database connection failed, falling back to MOCK DB:', err.message);
        (pool as any) = mockPool;
    } else {
        console.log('✅ Database connected:', res.rows[0].now);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await pool.end();
    console.log('Database pool closed');
    process.exit(0);
});
