import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { menuRoutes } from './menu';

describe('Menu Routes', () => {
    const fastify = Fastify({ logger: false });

    beforeAll(async () => {
        await fastify.register(menuRoutes, { prefix: '' });
    });

    afterAll(async () => {
        await fastify.close();
    });

    describe('GET /menu', () => {
        it('returns menu with restaurant and categories', async () => {
            const res = await fastify.inject({
                method: 'GET',
                url: '/menu',
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.restaurant).toBeDefined();
            expect(body.restaurant.name).toBe('RanRHar');
            expect(body.restaurant.tableCode).toBe('A12');
            expect(body.categories).toBeDefined();
            expect(Array.isArray(body.categories)).toBe(true);
        });

        it('accepts tableCode query param', async () => {
            const res = await fastify.inject({
                method: 'GET',
                url: '/menu?tableCode=T5',
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.restaurant.tableCode).toBe('T5');
        });
    });
});
