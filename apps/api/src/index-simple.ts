import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://ranrhar.com',
    'https://www.ranrhar.com',
];

const fastify = Fastify({
    logger: {
        level: 'debug',
    },
});

async function start() {
    try {
        // CORS: Same whitelist as main API (reject null in production)
        const isProd = process.env.NODE_ENV === 'production';
        await fastify.register(cors, {
            origin: (origin, cb) => {
                if (!origin) {
                    if (isProd) cb(new Error('No origin in production'), false);
                    else cb(null, true);
                    return;
                }
                if (ALLOWED_ORIGINS.includes(origin)) cb(null, true);
                else cb(new Error('Not allowed by CORS'), false);
            },
            credentials: true,
        });

        // Health check
        fastify.get('/health', async () => {
            return { status: 'ok', timestamp: new Date().toISOString() };
        });

        // Mock auth endpoint
        fastify.post('/auth/login', async () => {
            return {
                token: 'mock-token-123',
                user: { email: 'test@test.com', role: 'owner' }
            };
        });

        // Start server
        await fastify.listen({ port: PORT, host: HOST });
        console.log(`🚀 API server running on http://${HOST}:${PORT}`);
        console.log(`📝 This is a simplified version without database`);
    } catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
}

start();
