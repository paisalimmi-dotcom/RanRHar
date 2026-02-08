import { FastifyInstance } from 'fastify';
import { pool } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
    CreateGuestOrderBodySchema,
    CreateOrderBodySchema,
    OrderIdParamSchema,
    UpdateOrderStatusBodySchema,
} from '../schemas';

interface OrderItem {
    id: string;
    name: string;
    priceTHB: number;
    quantity: number;
}

// Guest order endpoint - no auth required (for customer QR ordering)
async function getGuestUserId(): Promise<number> {
    const result = await pool.query(
        "SELECT id FROM users WHERE email = 'guest@system' AND role = 'guest' LIMIT 1"
    );
    if (result.rows.length === 0) {
        throw new Error('Guest user not configured. Run migration-004.');
    }
    return result.rows[0].id;
}

export async function orderRoutes(fastify: FastifyInstance) {
    // POST /orders/guest - Create order as customer (no auth, rate limited)
    fastify.post('/orders/guest', {
        config: {
            rateLimit: {
                max: 20,
                timeWindow: '1 minute',
            },
        },
        schema: {
            body: CreateGuestOrderBodySchema,
        },
    }, async (request, reply) => {
        const { items, total, tableCode } = request.body as { items: OrderItem[]; total: number; tableCode?: string };

        try {
            const guestUserId = await getGuestUserId();

            const result = await pool.query(
                `INSERT INTO orders (items, total, created_by) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, items, total, status, created_at, created_by`,
                [JSON.stringify(items), total, guestUserId]
            );

            const order = result.rows[0];

            return reply.status(201).send({
                id: order.id.toString(),
                items: order.items,
                subtotal: parseFloat(order.total),
                total: parseFloat(order.total),
                status: order.status,
                createdAt: order.created_at.toISOString(),
                createdBy: order.created_by,
                tableCode: tableCode || null,
            });
        } catch (error) {
            console.error('Create guest order error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // POST /orders - Create a new order (staff, cashier)
    fastify.post('/orders', {
        preHandler: [authMiddleware, requireRole('staff', 'cashier')],
        schema: {
            body: CreateOrderBodySchema,
        },
    }, async (request, reply) => {
        const { items, total } = request.body as { items: OrderItem[]; total: number };

        try {
            const result = await pool.query(
                `INSERT INTO orders (items, total, created_by) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, items, total, status, created_at, created_by`,
                [JSON.stringify(items), total, request.user!.userId]
            );

            const order = result.rows[0];

            return reply.status(201).send({
                id: order.id.toString(),
                items: order.items,
                subtotal: parseFloat(order.total),
                total: parseFloat(order.total),
                status: order.status,
                createdAt: order.created_at.toISOString(),
                createdBy: order.created_by,
            });
        } catch (error) {
            console.error('Create order error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // GET /orders - List all orders with payment status (owner, staff)
    fastify.get('/orders', {
        preHandler: [authMiddleware, requireRole('owner', 'staff')],
    }, async (request, reply) => {
        try {
            const result = await pool.query(
                `SELECT o.id, o.items, o.total, o.status, o.created_at, o.created_by, u.email, u.role,
                        p.id as payment_id, p.amount as payment_amount, p.method as payment_method, p.status as payment_status
                 FROM orders o
                 JOIN users u ON o.created_by = u.id
                 LEFT JOIN payments p ON p.order_id = o.id
                 ORDER BY o.created_at DESC
                 LIMIT 100`
            );

            const orders = result.rows.map(row => ({
                id: row.id.toString(),
                items: row.items,
                subtotal: parseFloat(row.total),
                total: parseFloat(row.total),
                status: row.status,
                createdAt: row.created_at.toISOString(),
                createdBy: {
                    id: row.created_by,
                    email: row.email,
                    role: row.role,
                },
                payment: row.payment_id ? {
                    id: row.payment_id.toString(),
                    amount: parseFloat(row.payment_amount),
                    method: row.payment_method,
                    status: row.payment_status,
                } : null,
            }));

            return reply.send({ orders });
        } catch (error) {
            console.error('Get orders error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // PATCH /orders/:id/status - Update order status (owner, staff)
    fastify.patch('/orders/:id/status', {
        preHandler: [authMiddleware, requireRole('owner', 'staff')],
        schema: {
            params: OrderIdParamSchema,
            body: UpdateOrderStatusBodySchema,
        },
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' };

        try {
            const result = await pool.query(
                `UPDATE orders 
                 SET status = $1 
                 WHERE id = $2 
                 RETURNING id, items, total, status, created_at, created_by`,
                [status, id]
            );

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Order not found' });
            }

            const order = result.rows[0];

            return reply.send({
                id: order.id.toString(),
                items: order.items,
                subtotal: parseFloat(order.total),
                total: parseFloat(order.total),
                status: order.status,
                createdAt: order.created_at.toISOString(),
                createdBy: order.created_by,
            });
        } catch (error) {
            console.error('Update order status error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
