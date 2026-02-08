import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { inventoryRoutes } from './inventory';
import { authRoutes } from './auth';

describe('Inventory Routes', () => {
    const fastify = Fastify({ logger: false });

    beforeAll(async () => {
        await fastify.register(cookie);
        await fastify.register(authRoutes, { prefix: '' });
        await fastify.register(inventoryRoutes, { prefix: '' });
    });

    afterAll(async () => {
        await fastify.close();
    });

    describe('GET /inventory', () => {
        it('returns 401 without auth', async () => {
            const res = await fastify.inject({
                method: 'GET',
                url: '/inventory',
            });
            expect(res.statusCode).toBe(401);
        });

        it('returns items when authenticated as owner', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'owner@test.com', password: 'password123' },
            });
            expect(loginRes.statusCode).toBe(200);
            const cookie = loginRes.headers['set-cookie'];
            if (!cookie) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'GET',
                url: '/inventory',
                headers: { cookie },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.items).toBeDefined();
            expect(Array.isArray(body.items)).toBe(true);
        });
    });

    describe('POST /inventory', () => {
        it('returns 401 without auth', async () => {
            const res = await fastify.inject({
                method: 'POST',
                url: '/inventory',
                payload: { name: 'Flour', quantity: 10, unit: 'kg', minQuantity: 2 },
            });
            expect(res.statusCode).toBe(401);
        });

        it('creates item when authenticated', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'owner@test.com', password: 'password123' },
            });
            const cookie = loginRes.headers['set-cookie'];
            if (!cookie) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'POST',
                url: '/inventory',
                payload: { name: 'Flour', quantity: 10, unit: 'kg', minQuantity: 2 },
                headers: { cookie },
            });
            expect(res.statusCode).toBe(201);
            const body = JSON.parse(res.payload);
            expect(body.id).toBe(2);
            expect(body.name).toBe('Flour');
            expect(body.quantity).toBe(10);
        });

        it('returns 400 when missing required fields', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'owner@test.com', password: 'password123' },
            });
            const cookie = loginRes.headers['set-cookie'];
            if (!cookie) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'POST',
                url: '/inventory',
                payload: { name: 'Flour' },
                headers: { cookie },
            });
            expect(res.statusCode).toBe(400);
        });
    });

    describe('PATCH /inventory/:id', () => {
        it('updates metadata when authenticated', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'owner@test.com', password: 'password123' },
            });
            const cookie = loginRes.headers['set-cookie'];
            if (!cookie) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'PATCH',
                url: '/inventory/1',
                payload: { name: 'Rice Updated', minQuantity: 7 },
                headers: { cookie },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.id).toBeDefined();
            expect(body.name).toBeDefined();
        });

        it('adjusts stock when authenticated', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'owner@test.com', password: 'password123' },
            });
            const cookie = loginRes.headers['set-cookie'];
            if (!cookie) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'PATCH',
                url: '/inventory/1',
                payload: { adjustment: { type: 'IN', quantity: 5, reason: 'Restock' } },
                headers: { cookie },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.quantity).toBe(15);
        });
    });

    describe('GET /inventory/:id/movements', () => {
        it('returns movements when authenticated', async () => {
            const loginRes = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'owner@test.com', password: 'password123' },
            });
            const cookie = loginRes.headers['set-cookie'];
            if (!cookie) throw new Error('No cookie');

            const res = await fastify.inject({
                method: 'GET',
                url: '/inventory/1/movements',
                headers: { cookie },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.movements).toBeDefined();
            expect(Array.isArray(body.movements)).toBe(true);
        });
    });
});
