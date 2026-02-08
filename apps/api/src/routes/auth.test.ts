import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { authRoutes } from './auth';

describe('Auth Routes', () => {
    const fastify = Fastify({ logger: false });

    beforeAll(async () => {
        await fastify.register(cookie);
        await fastify.register(authRoutes, { prefix: '' });
    });

    afterAll(async () => {
        await fastify.close();
    });

    describe('POST /auth/login', () => {
        it('returns 400 when email or password is missing', async () => {
            const res = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'owner@test.com' },
            });
            expect(res.statusCode).toBe(400);
            const body = JSON.parse(res.payload);
            expect(body.error || body.message || body.statusCode).toBeDefined();
        });

        it('returns 401 for invalid credentials (user not found)', async () => {
            const res = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'nonexistent@test.com', password: 'password123' },
            });
            expect(res.statusCode).toBe(401);
            const body = JSON.parse(res.payload);
            expect(body.error).toBe('Invalid credentials');
        });

        it('returns 401 for wrong password', async () => {
            const res = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'owner@test.com', password: 'wrongpassword' },
            });
            expect(res.statusCode).toBe(401);
        });

        it('returns 200 and sets cookie for valid credentials', async () => {
            const res = await fastify.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'owner@test.com', password: 'password123' },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.message).toBe('Login successful');
            expect(body.user).toEqual({ email: 'owner@test.com', role: 'owner' });
            expect(res.headers['set-cookie']).toBeDefined();
        });
    });

    describe('POST /auth/logout', () => {
        it('returns 200 and clears cookie', async () => {
            const res = await fastify.inject({
                method: 'POST',
                url: '/auth/logout',
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.message).toBe('Logged out successfully');
        });
    });

    describe('GET /me', () => {
        it('returns 401 without auth', async () => {
            const res = await fastify.inject({
                method: 'GET',
                url: '/me',
            });
            expect(res.statusCode).toBe(401);
        });

        it('returns user info when authenticated', async () => {
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
                url: '/me',
                headers: { cookie },
            });
            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.email).toBe('owner@test.com');
            expect(body.role).toBe('owner');
        });
    });
});
