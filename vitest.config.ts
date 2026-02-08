import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        include: ['**/*.test.ts', '**/*.spec.ts'],
        exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
        environment: 'node',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './apps/web/src'),
        },
    },
});
