import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { pool } from '../db';
import { auditLog } from '../lib/audit';
import { incrementLogins, incrementFailedLogins } from '../lib/metrics';
import { ApiError, Errors } from '../lib/errors';
import { generateToken, authMiddleware } from '../middleware/auth';
import { LoginBodySchema } from '../schemas';

export async function authRoutes(fastify: FastifyInstance) {
    // POST /auth/login - Login with email and password
    // Security: Strict rate limiting to prevent brute force attacks
    fastify.post('/auth/login', {
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '15 minutes',
            },
        },
        schema: {
            body: LoginBodySchema,
        },
    }, async (request, reply) => {
        const { email, password } = request.body as { email: string; password: string };

        if (!email || !password) {
            throw Errors.validation.required('email and password');
        }

        try {
            // Find user by email
            const result = await pool.query(
                'SELECT id, email, password_hash, role FROM users WHERE email = $1',
                [email]
            );

            if (result.rows.length === 0) {
                await auditLog({ action: 'auth.failed_login', entityType: 'user', actorEmail: email, metadata: { reason: 'user_not_found' }, ip: request.ip });
                incrementFailedLogins();
                throw Errors.auth.invalidCredentials();
            }

            const user = result.rows[0];

            // Guest user cannot log in (used for customer orders only)
            if (user.role === 'guest') {
                await auditLog({ action: 'auth.failed_login', entityType: 'user', actorEmail: email, metadata: { reason: 'guest_role' }, ip: request.ip });
                incrementFailedLogins();
                throw Errors.auth.invalidCredentials();
            }

            // Verify password
            const isValid = await bcrypt.compare(password, user.password_hash);

            if (!isValid) {
                await auditLog({ action: 'auth.failed_login', entityType: 'user', actorEmail: email, metadata: { reason: 'invalid_password' }, ip: request.ip });
                incrementFailedLogins();
                throw Errors.auth.invalidCredentials();
            }

            await auditLog({ action: 'auth.login', entityType: 'user', entityId: String(user.id), actorId: user.id, actorEmail: user.email, ip: request.ip });
            incrementLogins();

            // Generate JWT token
            const token = generateToken({
                userId: user.id,
                email: user.email,
                role: user.role,
            });

            // Set httpOnly cookie
            reply.setCookie('token', token, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Secure in production
                sameSite: 'strict',
                maxAge: 3600, // 1 hour (matches token expiry)
            });

            return reply.send({
                message: 'Login successful',
                user: {
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (error) {
            request.log.error({ err: error }, 'Login error');
            if (error instanceof ApiError) {
                throw error;
            }
            throw Errors.system.internal('Failed to process login');
        }
    });

    // POST /auth/logout - Clear auth cookie
    // Security: Rate limit to prevent abuse
    fastify.post('/auth/logout', {
        config: {
            rateLimit: {
                max: 30,
                timeWindow: '1 minute',
            },
        },
    }, async (request, reply) => {
        reply.clearCookie('token', { path: '/' });
        return reply.send({ message: 'Logged out successfully' });
    });

    // GET /me - Get current user info
    fastify.get('/me', {
        preHandler: authMiddleware,
    }, async (request, reply) => {
        if (!request.user) {
            throw Errors.auth.required();
        }

        return reply.send({
            email: request.user.email,
            role: request.user.role,
        });
    });
}
