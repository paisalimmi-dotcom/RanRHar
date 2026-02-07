import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './routes/auth';
import { orderRoutes } from './routes/orders';
import './db'; // Initialize database connection

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
    logger: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
});

async function start() {
    try {
        // Register CORS
        await fastify.register(cors, {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true,
        });

        // Register routes
        await fastify.register(authRoutes);
        await fastify.register(orderRoutes);

        // Health check
        fastify.get('/health', async () => {
            return { status: 'ok', timestamp: new Date().toISOString() };
        });

        // Start server
        await fastify.listen({ port: PORT, host: HOST });
        console.log(`🚀 API server running on http://${HOST}:${PORT}`);
    } catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
}

start();
