import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { paymentRoutes } from './payments';
import { authRoutes } from './auth';

describe('Payment Routes', () => {
    const fastify = Fastify({ logger: false });

    beforeAll(async () => {
        await fastify.register(cookie);
        await fastify.register(authRoutes, { prefix: '' });
        await fastify.register(paymentRoutes, { prefix: '' });
    });

    afterAll(async () => {
        await fastify.close();
    });

    describe('POST /orders/:id/payment', () => {
        it('returns 401 without auth', async () => {
            const res = await fastify.inject({
                method: 'POST',
                url: '/orders/1/payment',
                payload: { amount: 100, method: 'CASH' },
            });
            expect(res.statusCode).toBe(401);
        });

        it('returns 400 when amount does not match order total', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'cashier@test.com', password: 'password123' },
            });
            const cookie = loginRes.headers['set-cookie'];
            if (!cookie) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'POST',
                url: '/orders/1/payment',
                payload: { amount: 100, method: 'CASH' },
                headers: { cookie },
            });
            expect(res.statusCode).toBe(400);
            const body = JSON.parse(res.payload);
            expect(body.error).toContain('match');
        });

        it('records payment when authenticated and amount matches', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'cashier@test.com', password: 'password123' },
            });
            expect(loginRes.statusCode).toBe(200);
            const cookie = loginRes.headers['set-cookie'];
            if (!cookie) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'POST',
                url: '/orders/1/payment',
                payload: { amount: 448, method: 'CASH' },
                headers: { cookie },
            });
            expect(res.statusCode).toBe(201);
            const body = JSON.parse(res.payload);
            expect(body.orderId).toBe('1');
            expect(body.amount).toBe(448);
            expect(body.method).toBe('CASH');
        });
    });

    describe('GET /orders/:id/payment', () => {
        it('returns 401 without auth', async () => {
            const res = await fastify.inject({
                method: 'GET',
                url: '/orders/1/payment',
            });
            expect(res.statusCode).toBe(401);
        });

        it('returns payment when authenticated', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'cashier@test.com', password: 'password123' },
            });
            expect(loginRes.statusCode).toBe(200);
            const cookie = loginRes.headers['set-cookie'];
            if (!cookie) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'GET',
                url: '/orders/1/payment',
                headers: { cookie },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.id).toBe('1');
            expect(body.orderId).toBe('1');
            expect(body.amount).toBe(448);
            expect(body.method).toBe('CASH');
            expect(body.status).toBe('PAID');
            expect(body.createdBy).toEqual({ id: 3, email: 'cashier@test.com', role: 'cashier' });
        });

        it('returns 404 when payment not found', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'cashier@test.com', password: 'password123' },
            });
            const cookie = loginRes.headers['set-cookie'];
            if (!cookie) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'GET',
                url: '/orders/999/payment',
                headers: { cookie },
            });
            expect(res.statusCode).toBe(404);
        });
    });
});
