import { createHash } from 'crypto';
import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { pool } from '../db';
import { auditLog } from '../lib/audit';
import { incrementOrders } from '../lib/metrics';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
    CancelOrderBodySchema,
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

function validateOrderTotal(items: OrderItem[], total: number): boolean {
    const expectedTotal = items.reduce((sum, i) => sum + i.priceTHB * i.quantity, 0);
    return parseFloat(total.toFixed(2)) === parseFloat(expectedTotal.toFixed(2));
}

// Parse item id: "m-1" -> 1, "1" -> 1
function parseItemId(id: string): number | null {
    const match = id.match(/^m-(\d+)$/) || id.match(/^(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
}

// Validate items against menu DB — prevent price manipulation
async function validateItemsAgainstMenu(items: OrderItem[]): Promise<{ valid: boolean; error?: string }> {
    try {
        const ids = items.map((i) => parseItemId(i.id)).filter((n): n is number => n !== null);
        if (ids.length !== items.length) return { valid: false, error: 'Invalid item ID format' };

        const result = await pool.query(
            'SELECT id, price_thb FROM menu_items WHERE id = ANY($1::int[])',
            [ids]
        );
        const menuMap = new Map(result.rows.map((r: { id: number; price_thb: number }) => [r.id, parseFloat(r.price_thb.toFixed(2))]));

        for (const item of items) {
            const menuId = parseItemId(item.id);
            if (menuId === null) return { valid: false, error: `Invalid item ID: ${item.id}` };
            const menuPrice = menuMap.get(menuId);
            if (menuPrice === undefined) return { valid: false, error: `Item not found: ${item.id}` };
            const clientPrice = parseFloat(item.priceTHB.toFixed(2));
            if (clientPrice !== menuPrice) return { valid: false, error: `Price mismatch for ${item.id}: expected ${menuPrice}` };
        }
        return { valid: true };
    } catch {
        return { valid: false, error: 'Menu validation failed' };
    }
}

function hashRequest(body: { items: OrderItem[]; total: number; tableCode?: string }): string {
    return createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

// Idempotency: return cached response if key+request match
async function getIdempotentResponse(
    key: string,
    requestHash: string,
    handler: () => Promise<{ status: number; body: unknown }>
): Promise<{ status: number; body: unknown }> {
    const EXPIRY_HOURS = 24;
    const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);

    try {
        const existing = await pool.query(
            'SELECT request_hash, response_status, response_body FROM idempotency_keys WHERE key = $1 AND expires_at > NOW()',
            [key]
        );
        if (existing.rows.length > 0) {
            const row = existing.rows[0];
            if (row.request_hash !== requestHash) {
                return { status: 409, body: { error: 'Idempotency key conflict: request body differs' } };
            }
            return { status: row.response_status, body: row.response_body };
        }

        const result = await handler();
        await pool.query(
            'INSERT INTO idempotency_keys (key, request_hash, response_status, response_body, expires_at) VALUES ($1, $2, $3, $4, $5)',
            [key, requestHash, result.status, JSON.stringify(result.body), expiresAt]
        );
        return result;
    } catch {
        return handler();
    }
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
    // GET /orders/:id/public - Get order status (public, no auth, rate limited)
    // Security: Verify tableCode to prevent unauthorized access
    fastify.get('/orders/:id/public', {
        config: {
            rateLimit: {
                max: 60,
                timeWindow: '1 minute',
            },
        },
        schema: {
            params: OrderIdParamSchema,
            querystring: Type.Object({
                tableCode: Type.Optional(Type.String({ maxLength: 50 })),
            }),
        },
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { tableCode } = request.query as { tableCode?: string };

        try {
            const result = await pool.query(
                `SELECT o.id, o.items, o.total, o.status, o.created_at, o.created_by, o.table_code
                 FROM orders o
                 WHERE o.id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Order not found' });
            }

            const order = result.rows[0];

            // Verify table code if provided
            if (tableCode && order.table_code && order.table_code !== tableCode) {
                return reply.status(403).send({ error: 'Order does not belong to this table' });
            }

            return reply.send({
                id: order.id.toString(),
                items: order.items,
                subtotal: parseFloat(order.total),
                total: parseFloat(order.total),
                status: order.status,
                createdAt: order.created_at.toISOString(),
                tableCode: order.table_code || null,
            });
        } catch (error) {
            request.log.error({ err: error }, 'Get public order error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // POST /orders/guest - Create order as customer (no auth, rate limited)
    // Security: 10 orders/min per IP to prevent abuse
    fastify.post('/orders/guest', {
        config: {
            rateLimit: {
                max: 10,
                timeWindow: '1 minute',
            },
        },
        schema: {
            body: CreateGuestOrderBodySchema,
        },
    }, async (request, reply) => {
        const { items, total, tableCode } = request.body as { items: OrderItem[]; total: number; tableCode?: string };

        if (!validateOrderTotal(items, total)) {
            return reply.status(400).send({
                error: 'Order total does not match sum of items. Recalculate and try again.',
            });
        }

        const menuValidation = await validateItemsAgainstMenu(items);
        if (!menuValidation.valid) {
            return reply.status(400).send({ error: menuValidation.error });
        }

        const body = { items, total, tableCode };
        const requestHash = hashRequest(body);
        const idempotencyKey = (request.headers['idempotency-key'] as string)?.trim();

        async function createGuestOrder(): Promise<{ status: number; body: unknown }> {
            try {
                const guestUserId = await getGuestUserId();
                const result = await pool.query(
                    `INSERT INTO orders (items, total, created_by, table_code) 
                     VALUES ($1, $2, $3, $4) 
                     RETURNING id, items, total, status, created_at, created_by, table_code`,
                    [JSON.stringify(items), total, guestUserId, tableCode || null]
                );
                const order = result.rows[0];
                await auditLog({ action: 'order.create', entityType: 'order', entityId: order.id.toString(), actorId: guestUserId, metadata: { total, itemCount: items.length }, ip: request.ip });
                incrementOrders();
                return {
                    status: 201,
                    body: {
                        id: order.id.toString(),
                        items: order.items,
                        subtotal: parseFloat(order.total),
                        total: parseFloat(order.total),
                        status: order.status,
                        createdAt: order.created_at.toISOString(),
                        createdBy: order.created_by,
                        tableCode: tableCode || null,
                    },
                };
            } catch (error) {
                request.log.error({ err: error }, 'Create guest order error');
                return { status: 500, body: { error: 'Internal server error' } };
            }
        }

        const result = idempotencyKey && /^[a-zA-Z0-9_-]{1,64}$/.test(idempotencyKey)
            ? await getIdempotentResponse(idempotencyKey, requestHash, createGuestOrder)
            : await createGuestOrder();

        return reply.status(result.status).send(result.body);
    });

    // POST /orders - Create a new order (staff, cashier)
    fastify.post('/orders', {
        preHandler: [authMiddleware, requireRole('staff', 'cashier')],
        schema: {
            body: CreateOrderBodySchema,
        },
    }, async (request, reply) => {
        const { items, total } = request.body as { items: OrderItem[]; total: number };

        if (!validateOrderTotal(items, total)) {
            return reply.status(400).send({
                error: 'Order total does not match sum of items. Recalculate and try again.',
            });
        }

        const menuValidation = await validateItemsAgainstMenu(items);
        if (!menuValidation.valid) {
            return reply.status(400).send({ error: menuValidation.error });
        }

        try {
            const result = await pool.query(
                `INSERT INTO orders (items, total, created_by) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, items, total, status, created_at, created_by`,
                [JSON.stringify(items), total, request.user!.userId]
            );

            const order = result.rows[0];
            await auditLog({ action: 'order.create', entityType: 'order', entityId: order.id.toString(), actorId: request.user!.userId, actorEmail: request.user!.email, metadata: { total, itemCount: items.length } });
            incrementOrders();

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
            request.log.error({ err: error }, 'Create order error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // GET /orders - List all orders with payment status (owner, staff, cashier)
    fastify.get('/orders', {
        preHandler: [authMiddleware, requireRole('owner', 'manager', 'staff', 'cashier')],
    }, async (request, reply) => {
        try {
            const result = await pool.query(
                `SELECT o.id, o.items, o.total, o.status, o.created_at, o.created_by, o.table_code, u.email, u.role,
                        p.id as payment_id, p.amount as payment_amount, p.method as payment_method, p.status as payment_status, p.paid_at as payment_paid_at
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
                tableCode: row.table_code || null,
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
                    paidAt: row.payment_paid_at ? row.payment_paid_at.toISOString() : undefined,
                } : null,
            }));

            return reply.send({ orders });
        } catch (error) {
            request.log.error({ err: error }, 'Get orders error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // PATCH /orders/:id/status - Update order status (manager, staff, chef)
    fastify.patch('/orders/:id/status', {
        preHandler: [authMiddleware, requireRole('manager', 'staff', 'chef')],
        schema: {
            params: OrderIdParamSchema,
            body: UpdateOrderStatusBodySchema,
        },
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NEW' | 'ACCEPTED' | 'COOKING' | 'READY' | 'SERVED' };

        try {
            // If cancelling, check if order can be cancelled
            if (status === 'CANCELLED') {
                const orderResult = await pool.query(
                    `SELECT status, created_by FROM orders WHERE id = $1`,
                    [id]
                );

                if (orderResult.rows.length === 0) {
                    return reply.status(404).send({ error: 'Order not found' });
                }

                const order = orderResult.rows[0];
                const userRole = request.user!.role;

                // Check if order has payment
                const paymentResult = await pool.query(
                    `SELECT id FROM payments WHERE order_id = $1 AND status = 'PAID'`,
                    [id]
                );

                if (paymentResult.rows.length > 0) {
                    return reply.status(400).send({ error: 'Cannot cancel paid order. Refund required.' });
                }

                // Only PENDING can be cancelled by anyone, CONFIRMED/COMPLETED only by manager
                if (order.status !== 'PENDING' && userRole !== 'manager') {
                    return reply.status(403).send({ error: 'Only manager can cancel CONFIRMED or COMPLETED orders' });
                }
            }

            const result = await pool.query(
                `UPDATE orders 
                 SET status = $1 
                 WHERE id = $2 
                 RETURNING id, items, total, status, created_at, created_by, table_code`,
                [status, id]
            );

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Order not found' });
            }

            const order = result.rows[0];
            await auditLog({ action: 'order.status_update', entityType: 'order', entityId: id, actorId: request.user!.userId, actorEmail: request.user!.email, metadata: { status } });

            return reply.send({
                id: order.id.toString(),
                items: order.items,
                subtotal: parseFloat(order.total),
                total: parseFloat(order.total),
                status: order.status,
                createdAt: order.created_at.toISOString(),
                createdBy: order.created_by,
                tableCode: order.table_code || null,
            });
        } catch (error) {
            request.log.error({ err: error }, 'Update order status error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // POST /orders/:id/cancel - Cancel order with reason (for manager special cases)
    fastify.post('/orders/:id/cancel', {
        preHandler: [authMiddleware, requireRole('manager')],
        schema: {
            params: OrderIdParamSchema,
            body: CancelOrderBodySchema,
        },
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { reason, refundRequired } = request.body as { reason?: string; refundRequired?: boolean };

        try {
            // Get current order status
            const orderResult = await pool.query(
                `SELECT status, created_by FROM orders WHERE id = $1`,
                [id]
            );

            if (orderResult.rows.length === 0) {
                return reply.status(404).send({ error: 'Order not found' });
            }

            const order = orderResult.rows[0];

            // Check if order has payment
            const paymentResult = await pool.query(
                `SELECT id FROM payments WHERE order_id = $1 AND status = 'PAID'`,
                [id]
            );

            if (paymentResult.rows.length > 0 && !refundRequired) {
                return reply.status(400).send({ error: 'Paid order requires refund. Set refundRequired=true' });
            }

            // Cancel the order
            const result = await pool.query(
                `UPDATE orders 
                 SET status = 'CANCELLED',
                     cancelled_at = CURRENT_TIMESTAMP,
                     cancelled_by = $1,
                     cancel_reason = $2,
                     refund_required = $3
                 WHERE id = $4
                 RETURNING id, items, total, status, created_at, created_by, table_code, cancelled_at, cancel_reason, refund_required`,
                [request.user!.userId, reason || null, refundRequired || false, id]
            );

            const cancelledOrder = result.rows[0];
            await auditLog({ 
                action: 'order.cancel', 
                entityType: 'order', 
                entityId: id, 
                actorId: request.user!.userId, 
                actorEmail: request.user!.email, 
                metadata: { reason, refundRequired, previousStatus: order.status } 
            });

            return reply.send({
                id: cancelledOrder.id.toString(),
                items: cancelledOrder.items,
                subtotal: parseFloat(cancelledOrder.total),
                total: parseFloat(cancelledOrder.total),
                status: cancelledOrder.status,
                createdAt: cancelledOrder.created_at.toISOString(),
                createdBy: cancelledOrder.created_by,
                tableCode: cancelledOrder.table_code || null,
                cancelledAt: cancelledOrder.cancelled_at?.toISOString() || null,
                cancelReason: cancelledOrder.cancel_reason || null,
                refundRequired: cancelledOrder.refund_required || false,
            });
        } catch (error) {
            request.log.error({ err: error }, 'Cancel order error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
