import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });
config(); // fallback to process.cwd() .env
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import { getMetrics, incrementRequests } from './lib/metrics';
import { authRoutes } from './routes/auth';
import { orderRoutes } from './routes/orders';
import { paymentRoutes } from './routes/payments';
import { inventoryRoutes } from './routes/inventory';
import { menuRoutes } from './routes/menu';
import { prepareDatabase, pool } from './db';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Allowed CORS origins (whitelist)
// Base + CORS_ORIGIN from env (comma-separated for multiple, e.g. "https://app.com,https://www.app.com")
const BASE_ORIGINS = ['http://localhost:3000'];
const EXTRA_ORIGINS = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
const ALLOWED_ORIGINS = [...new Set([...BASE_ORIGINS, ...EXTRA_ORIGINS])];

const fastify = Fastify({
    logger: {
        level: IS_PRODUCTION ? 'info' : 'debug',
        serializers: {
            req: (req) => ({ method: req.method, url: req.url }),
            err: (err: Error) => ({
                type: err.name,
                message: err.message,
                stack: err.stack ?? '',
            }),
        },
    },
    bodyLimit: 1048576, // 1MB limit to prevent DoS
    requestTimeout: 30000, // 30 seconds
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
});

async function start() {
    try {
        // Verify DB before accepting requests
        await prepareDatabase();

        // Security: Helmet for security headers
        await fastify.register(helmet, {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                },
            },
            hsts: IS_PRODUCTION ? {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            } : false,
        });

        // Security: Strict CORS configuration
        await fastify.register(cors, {
            origin: (origin, cb) => {
                if (!origin) {
                    if (IS_PRODUCTION) {
                        cb(new Error('No origin in production'), false);
                        return;
                    }
                    cb(null, true);
                    return;
                }

                if (ALLOWED_ORIGINS.includes(origin)) {
                    cb(null, true);
                } else {
                    cb(new Error('Not allowed by CORS'), false);
                }
            },
            credentials: true,
        });

        // Security: Global rate limiting
        await fastify.register(rateLimit, {
            max: 100,
            timeWindow: '1 minute',
            cache: 10000,
        });

        // Security: Cookie support for httpOnly auth tokens
        await fastify.register(cookie, {
            secret: process.env.JWT_SECRET,
        } as { secret?: string });

        // Security: HTTPS enforcement in production
        if (IS_PRODUCTION) {
            fastify.addHook('onRequest', async (request, reply) => {
                const proto = request.headers['x-forwarded-proto'];
                if (proto && proto !== 'https') {
                    return reply.redirect(301, `https://${request.hostname}${request.url}`);
                }
            });
        }

        // Security: Custom error handler (hide stack traces in production)
        fastify.setErrorHandler((error, request, reply) => {
            if (IS_PRODUCTION) {
                // Log error internally
                fastify.log.error({
                    error: error.message,
                    stack: error.stack,
                    url: request.url,
                    method: request.method,
                });

                // Send generic error to client
                reply.status(error.statusCode || 500).send({
                    statusCode: error.statusCode || 500,
                    error: 'Internal Server Error',
                    message: 'Something went wrong',
                });
            } else {
                // Development: send full error details
                reply.status(error.statusCode || 500).send({
                    statusCode: error.statusCode || 500,
                    error: error.name,
                    message: error.message,
                    stack: error.stack,
                });
            }
        });

        // Register routes under /v1 prefix (API versioning)
        await fastify.register(authRoutes, { prefix: '/v1' });
        await fastify.register(orderRoutes, { prefix: '/v1' });
        await fastify.register(paymentRoutes, { prefix: '/v1' });
        await fastify.register(inventoryRoutes, { prefix: '/v1' });
        await fastify.register(menuRoutes, { prefix: '/v1' });

        // Request counter for metrics
        fastify.addHook('onRequest', async () => {
            incrementRequests();
        });

        // Health check (no version - used by load balancers)
        fastify.get('/health', async () => {
            return { status: 'ok', timestamp: new Date().toISOString() };
        });

        // Metrics endpoint (Prometheus-style JSON)
        fastify.get('/metrics', async () => {
            return getMetrics();
        });

        // Deep health check (DB connectivity)
        fastify.get('/health/ready', async (_request, reply) => {
            try {
                await pool.query('SELECT 1');
                return reply.send({ status: 'ready', database: 'connected' });
            } catch {
                return reply.status(503).send({ status: 'degraded', database: 'disconnected' });
            }
        });

        // Start server
        await fastify.listen({ port: PORT, host: HOST });
        console.log(`🚀 API server running on http://${HOST}:${PORT}`);
        console.log(`🔒 Security: Helmet enabled, CORS whitelist active, Rate limiting: 100/min`);
    } catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
}

start();
