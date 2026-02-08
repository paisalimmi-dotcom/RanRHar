import { Pool } from 'pg';
import { mockPool } from './mock';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

// Declare global type for TypeScript
declare global {
    var __db_pool: Pool | undefined;
}

// Singleton Pattern: Reuse existing pool across hot-reloads
function getPool(): Pool {
    if (globalThis.__db_pool) {
        return globalThis.__db_pool;
    }

    const newPool = new Pool({
        connectionString: DATABASE_URL,
        max: 5, // Reduced for dev stability (5 is plenty for local)
        idleTimeoutMillis: 10000, // Close idle connections faster
        connectionTimeoutMillis: 3000,
    });

    // Test connection and fallback
    newPool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.warn('⚠️ Database connection failed, falling back to MOCK DB:', err.message);
            globalThis.__db_pool = mockPool as unknown as Pool;
        } else {
            console.log('✅ Database connected:', res.rows[0].now);
        }
    });

    globalThis.__db_pool = newPool;
    return newPool;
}

export const pool = getPool();

// Graceful shutdown (only register once)
if (!globalThis.__db_pool) {
    process.on('SIGINT', async () => {
        await pool.end();
        console.log('Database pool closed');
        process.exit(0);
    });
}
