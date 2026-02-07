import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Security: Enforce strong JWT secret
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required');
}

if (JWT_SECRET.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be at least 32 characters long. Generate using: openssl rand -base64 32');
}

if (JWT_SECRET === 'your-secret-key-change-in-production' || JWT_SECRET === 'change-me') {
    throw new Error('FATAL: JWT_SECRET must be changed from default value. Generate using: openssl rand -base64 32');
}

export interface JWTPayload {
    userId: number;
    email: string;
    role: 'owner' | 'staff' | 'cashier';
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: JWTPayload;
    }
}

export async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Unauthorized: Missing token' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload;

        request.user = decoded;
    } catch {
        // Security: Don't leak token validation details
        return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
    }
}

export function requireRole(...allowedRoles: Array<'owner' | 'staff' | 'cashier'>) {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        if (!request.user) {
            return reply.status(401).send({ error: 'Unauthorized: No user context' });
        }

        if (!allowedRoles.includes(request.user.role)) {
            return reply.status(403).send({
                error: 'Forbidden: Insufficient permissions',
                required: allowedRoles,
                current: request.user.role
            });
        }
    };
}

export function generateToken(payload: JWTPayload): string {
    // Security: Reduced from 7d to 1h to minimize token theft impact
    return jwt.sign(payload, JWT_SECRET!, { expiresIn: '1h' });
}
