import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './routes/auth';
import { orderRoutes } from './routes/orders';
import { paymentRoutes } from './routes/payments';
import { inventoryRoutes } from './routes/inventory';
import './db'; // Initialize database connection

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Allowed CORS origins (whitelist)
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://ranrhar.com',
    'https://www.ranrhar.com',
];

const fastify = Fastify({
    logger: {
        level: IS_PRODUCTION ? 'info' : 'debug',
    },
    bodyLimit: 1048576, // 1MB limit to prevent DoS
    requestTimeout: 30000, // 30 seconds
});

async function start() {
    try {
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
                // Allow requests with no origin (e.g., mobile apps, Postman)
                if (!origin) {
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

        // Register routes
        await fastify.register(authRoutes);
        await fastify.register(orderRoutes);
        await fastify.register(paymentRoutes);

        // Health check
        fastify.get('/health', async () => {
            return { status: 'ok', timestamp: new Date().toISOString() };
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
