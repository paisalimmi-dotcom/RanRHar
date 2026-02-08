import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { pool } from '../db';
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
            return reply.status(400).send({ error: 'Email and password are required' });
        }

        try {
            // Find user by email
            const result = await pool.query(
                'SELECT id, email, password_hash, role FROM users WHERE email = $1',
                [email]
            );

            if (result.rows.length === 0) {
                return reply.status(401).send({ error: 'Invalid credentials' });
            }

            const user = result.rows[0];

            // Guest user cannot log in (used for customer orders only)
            if (user.role === 'guest') {
                return reply.status(401).send({ error: 'Invalid credentials' });
            }

            // Verify password
            const isValid = await bcrypt.compare(password, user.password_hash);

            if (!isValid) {
                return reply.status(401).send({ error: 'Invalid credentials' });
            }

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
            console.error('Login error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // POST /auth/logout - Clear auth cookie
    fastify.post('/auth/logout', async (request, reply) => {
        reply.clearCookie('token', { path: '/' });
        return reply.send({ message: 'Logged out successfully' });
    });

    // GET /me - Get current user info
    fastify.get('/me', {
        preHandler: authMiddleware,
    }, async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        return reply.send({
            email: request.user.email,
            role: request.user.role,
        });
    });
}
