import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        include: ['**/*.test.ts', '**/*.spec.ts'],
        exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
        environment: 'node',
        env: {
            DATABASE_URL: process.env.DATABASE_URL || '',
            JWT_SECRET: process.env.JWT_SECRET || 'test-secret-at-least-32-characters-long-for-vitest',
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            include: ['apps/api/src/**/*.ts'],
            exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**', '**/db/mock.ts'],
            thresholds: {
                statements: 50,
                branches: 40,
                functions: 60,
                lines: 50,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './apps/web/src'),
        },
    },
});
