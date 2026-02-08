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

    globalThis.__db_pool = newPool;
    return newPool;
}

/** Proxy so prepareDatabase() can swap to mock and all consumers get current pool */
export const pool = new Proxy({} as Pool, {
    get(_, prop) {
        return (getPool() as unknown as Record<string | symbol, unknown>)[prop];
    },
});

/** Verify DB connection before server starts; fallback to mock on failure */
export async function prepareDatabase(): Promise<void> {
    const p = getPool();
    try {
        const res = await p.query('SELECT 1');
        if (res.rows.length > 0) {
            console.log('✅ Database connected');
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('⚠️ Database connection failed, falling back to MOCK DB:', msg);
        (globalThis as { __db_pool?: Pool }).__db_pool = mockPool as unknown as Pool;
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    const p = getPool();
    if (p && typeof (p as Pool).end === 'function') {
        await (p as Pool).end();
    }
    console.log('Database pool closed');
    process.exit(0);
});
