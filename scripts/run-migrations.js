#!/usr/bin/env node
/**
 * Run database migrations without psql.
 * Usage: node scripts/run-migrations.js [DATABASE_URL]
 * Or: DATABASE_URL=... node scripts/run-migrations.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];
if (!DATABASE_URL) {
    console.error('Usage: DATABASE_URL=postgresql://user:pass@host:5432/db node scripts/run-migrations.js');
    console.error('   Or: node scripts/run-migrations.js postgresql://user:pass@host:5432/db');
    process.exit(1);
}

const MIGRATIONS = [
    'schema.sql',
    'migration-001-add-order-status.sql',
    'migration-002-add-payments.sql',
    'migration-003-add-inventory.sql',
    'migration-004-add-guest-and-fix-passwords.sql',
    'migration-005-add-menu.sql',
    'migration-006-add-idempotency.sql',
    'migration-007-add-audit-log.sql',
];

const DB_DIR = path.join(__dirname, '../apps/api/src/db');

async function run() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        const res = await pool.query('SELECT 1');
        if (res.rows.length === 0) throw new Error('Connection test failed');
        console.log('Database connected');
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }

    for (const file of MIGRATIONS) {
        const filePath = path.join(DB_DIR, file);
        if (!fs.existsSync(filePath)) {
            console.warn(`Skipping (not found): ${file}`);
            continue;
        }
        const sql = fs.readFileSync(filePath, 'utf8');
        try {
            await pool.query(sql);
            console.log(`OK: ${file}`);
        } catch (err) {
            if (err.message.includes('already exists') || err.code === '42P07') {
                console.log(`Skip (exists): ${file}`);
            } else {
                console.error(`FAIL: ${file}`, err.message);
                process.exit(1);
            }
        }
    }

    await pool.end();
    console.log('Migrations complete');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
