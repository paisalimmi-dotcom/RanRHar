import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { orderRoutes } from './orders';
import { authRoutes } from './auth';

describe('Order Routes', () => {
    const fastify = Fastify({ logger: false });

    beforeAll(async () => {
        await fastify.register(cookie);
        await fastify.register(authRoutes, { prefix: '' });
        await fastify.register(orderRoutes, { prefix: '' });
    });

    afterAll(async () => {
        await fastify.close();
    });

    describe('POST /orders/guest - total validation', () => {
        it('rejects when total does not match items sum', async () => {
            const res = await fastify.inject({
                method: 'POST',
                url: '/orders/guest',
                payload: {
                    items: [
                        { id: 'm-1', name: 'Pad Thai', priceTHB: 99, quantity: 2 },
                    ],
                    total: 1,
                },
            });

            expect(res.statusCode).toBe(400);
            const body = JSON.parse(res.payload);
            expect(body.error).toContain('total does not match');
        });

        it('rejects when total is slightly off (floating point)', async () => {
            const res = await fastify.inject({
                method: 'POST',
                url: '/orders/guest',
                payload: {
                    items: [{ id: 'm-1', name: 'Pad Thai', priceTHB: 99, quantity: 1 }],
                    total: 98,
                },
            });

            expect(res.statusCode).toBe(400);
        });

        it('rejects when item price does not match menu DB', async () => {
            // m-1 in menu is 199 THB, client sends 99 — must be rejected
            const res = await fastify.inject({
                method: 'POST',
                url: '/orders/guest',
                payload: {
                    items: [{ id: 'm-1', name: 'Pad Thai', priceTHB: 99, quantity: 1 }],
                    total: 99,
                },
            });

            expect(res.statusCode).toBe(400);
            const body = JSON.parse(res.payload);
            expect(body.error).toMatch(/Price mismatch|Menu validation failed|Item not found/);
        });

        it('accepts valid order when price matches menu DB', async () => {
            // m-1 = 199, m-2 = 249; 199*1 + 249*1 = 448
            const res = await fastify.inject({
                method: 'POST',
                url: '/orders/guest',
                payload: {
                    items: [
                        { id: 'm-1', name: 'Pad Thai', priceTHB: 199, quantity: 1 },
                        { id: 'm-2', name: 'Tom Yum', priceTHB: 249, quantity: 1 },
                    ],
                    total: 448,
                },
            });

            expect(res.statusCode).toBe(201);
            const body = JSON.parse(res.payload);
            expect(body.id).toBeDefined();
            expect(body.total).toBe(448);
            expect(body.status).toBe('PENDING');
        });
    });

    describe('GET /orders', () => {
        it('returns 401 without auth', async () => {
            const res = await fastify.inject({
                method: 'GET',
                url: '/orders',
            });
            expect(res.statusCode).toBe(401);
        });

        it('returns orders when authenticated as owner', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'owner@test.com', password: 'password123' },
            });
            const cookie = loginRes.headers['set-cookie'];
            if (!cookie) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'GET',
                url: '/orders',
                headers: { cookie },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.orders).toBeDefined();
            expect(Array.isArray(body.orders)).toBe(true);
        });
    });

    describe('POST /orders (staff)', () => {
        it('returns 401 without auth', async () => {
            const res = await fastify.inject({
                method: 'POST',
                url: '/orders',
                payload: { items: [{ id: 'm-1', name: 'A', priceTHB: 199, quantity: 1 }], total: 199 },
            });
            expect(res.statusCode).toBe(401);
        });

        it('creates order when authenticated as staff', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'cashier@test.com', password: 'password123' },
            });
            const cookie = loginRes.headers['set-cookie'];
            if (!cookie) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'POST',
                url: '/orders',
                payload: {
                    items: [
                        { id: 'm-1', name: 'Pad Thai', priceTHB: 199, quantity: 1 },
                        { id: 'm-2', name: 'Tom Yum', priceTHB: 249, quantity: 1 },
                    ],
                    total: 448,
                },
                headers: { cookie },
            });
            expect(res.statusCode).toBe(201);
            const body = JSON.parse(res.payload);
            expect(body.id).toBeDefined();
            expect(body.total).toBe(448);
        });
    });

    describe('PATCH /orders/:id/status', () => {
        it('returns 401 without auth', async () => {
            const res = await fastify.inject({
                method: 'PATCH',
                url: '/orders/1/status',
                payload: { status: 'CONFIRMED' },
            });
            expect(res.statusCode).toBe(401);
        });

        it('updates status when authenticated', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'staff@test.com', password: 'password123' },
            });
            const cookie = loginRes.headers['set-cookie'];
            if (!cookie) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'PATCH',
                url: '/orders/1/status',
                payload: { status: 'CONFIRMED' },
                headers: { cookie },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.id).toBe('1');
            expect(body.status).toBe('CONFIRMED');
        });
    });
});
