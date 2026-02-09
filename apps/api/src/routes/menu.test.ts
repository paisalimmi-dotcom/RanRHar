import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { menuRoutes } from './menu';
import { authRoutes } from './auth';

describe('Menu Routes', () => {
    const fastify = Fastify({ logger: false });

    beforeAll(async () => {
        await fastify.register(cookie);
        await fastify.register(authRoutes, { prefix: '' });
        await fastify.register(menuRoutes, { prefix: '' });
    });

    afterAll(async () => {
        await fastify.close();
    });

    describe('GET /menu/admin', () => {
        it('returns 401 without auth', async () => {
            const res = await fastify.inject({ method: 'GET', url: '/menu/admin' });
            expect(res.statusCode).toBe(401);
        });

        it('returns menu when authenticated as manager', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'manager@test.com', password: 'password123' },
            });
            expect(loginRes.statusCode).toBe(200);
            const cookieHeader = loginRes.headers['set-cookie'];
            if (!cookieHeader) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'GET',
                url: '/menu/admin',
                headers: { cookie: cookieHeader },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.restaurant).toBeDefined();
            expect(body.categories).toBeDefined();
            expect(Array.isArray(body.categories)).toBe(true);
        });
    });

    describe('PATCH /menu/items/:id', () => {
        it('returns 401 without auth', async () => {
            const res = await fastify.inject({
                method: 'PATCH',
                url: '/menu/items/1',
                payload: { imageUrl: 'https://example.com/image.jpg' },
            });
            expect(res.statusCode).toBe(401);
        });

        it('updates imageUrl when authenticated as manager', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'manager@test.com', password: 'password123' },
            });
            expect(loginRes.statusCode).toBe(200);
            const cookieHeader = loginRes.headers['set-cookie'];
            if (!cookieHeader) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'PATCH',
                url: '/menu/items/1',
                headers: { cookie: cookieHeader },
                payload: { imageUrl: 'https://example.com/new-image.jpg' },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.id).toBe(1);
            expect(body.imageUrl).toBe('https://example.com/new-image.jpg');
        });
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
