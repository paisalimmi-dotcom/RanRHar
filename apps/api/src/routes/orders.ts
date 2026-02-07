import { FastifyInstance } from 'fastify';
import { pool } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

interface OrderItem {
    id: string;
    name: string;
    priceTHB: number;
    quantity: number;
}

export async function orderRoutes(fastify: FastifyInstance) {
    // POST /orders - Create a new order (staff, cashier)
    fastify.post<{
        Body: {
            items: OrderItem[];
            total: number;
        };
    }>('/orders', {
        preHandler: [authMiddleware, requireRole('staff', 'cashier')],
    }, async (request, reply) => {
        const { items, total } = request.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return reply.status(400).send({ error: 'Items are required' });
        }

        if (typeof total !== 'number' || total <= 0) {
            return reply.status(400).send({ error: 'Valid total is required' });
        }

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

    // GET /orders - List all orders (owner, staff)
    fastify.get('/orders', {
        preHandler: [authMiddleware, requireRole('owner', 'staff')],
    }, async (request, reply) => {
        try {
            const result = await pool.query(
                `SELECT o.id, o.items, o.total, o.status, o.created_at, o.created_by, u.email, u.role
                 FROM orders o
                 JOIN users u ON o.created_by = u.id
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
            }));

            return reply.send({ orders });
        } catch (error) {
            console.error('Get orders error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // PATCH /orders/:id/status - Update order status (owner, staff)
    fastify.patch<{
        Params: {
            id: string;
        };
        Body: {
            status: 'PENDING' | 'CONFIRMED' | 'COMPLETED';
        };
    }>('/orders/:id/status', {
        preHandler: [authMiddleware, requireRole('owner', 'staff')],
    }, async (request, reply) => {
        const { id } = request.params;
        const { status } = request.body;

        // Validate status
        const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED'];
        if (!status || !validStatuses.includes(status)) {
            return reply.status(400).send({
                error: 'Invalid status. Must be one of: PENDING, CONFIRMED, COMPLETED'
            });
        }

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
