import { FastifyInstance } from 'fastify';
import { pool } from '../db';
import { auditLog } from '../lib/audit';
import { incrementPayments } from '../lib/metrics';
import { authMiddleware, requireRole } from '../middleware/auth';
import { 
    OrderIdParamSchema, 
    RecordPaymentBodySchema,
    SplitPaymentBodySchema,
    CombinedPaymentBodySchema,
} from '../schemas';

export async function paymentRoutes(fastify: FastifyInstance) {
    // POST /orders/:id/payment - Record payment for an order
    fastify.post('/orders/:id/payment', {
        preHandler: [authMiddleware, requireRole('manager', 'staff', 'cashier')],
        schema: {
            params: OrderIdParamSchema,
            body: RecordPaymentBodySchema,
        },
    }, async (request, reply) => {
        const { id: orderId } = request.params as { id: string };
        const { amount, method, notes } = request.body as { amount: number; method: 'CASH' | 'QR'; notes?: string };

        try {
            // Check if order exists and get total
            const orderResult = await pool.query(
                'SELECT id, total FROM orders WHERE id = $1',
                [orderId]
            );

            if (orderResult.rows.length === 0) {
                return reply.status(404).send({ error: 'Order not found' });
            }

            const order = orderResult.rows[0];

            // Validate amount matches order total
            if (parseFloat(amount.toFixed(2)) !== parseFloat(order.total)) {
                return reply.status(400).send({
                    error: `Payment amount (${amount}) must match order total (${order.total})`
                });
            }

            // Check if payment already exists
            const existingPayment = await pool.query(
                'SELECT id FROM payments WHERE order_id = $1',
                [orderId]
            );

            if (existingPayment.rows.length > 0) {
                return reply.status(400).send({ error: 'Payment already exists for this order' });
            }

            // Record payment
            const paymentResult = await pool.query(
                `INSERT INTO payments (order_id, amount, method, notes, created_by)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, order_id, amount, method, status, paid_at, created_by, notes`,
                [orderId, amount, method, notes || null, request.user!.userId]
            );

            const payment = paymentResult.rows[0];
            await auditLog({ action: 'payment.create', entityType: 'payment', entityId: payment.id.toString(), actorId: request.user!.userId, actorEmail: request.user!.email, metadata: { orderId, amount, method } });
            incrementPayments();

            return reply.status(201).send({
                id: payment.id.toString(),
                orderId: payment.order_id.toString(),
                amount: parseFloat(payment.amount),
                method: payment.method,
                status: payment.status,
                paidAt: payment.paid_at.toISOString(),
                createdBy: payment.created_by,
                notes: payment.notes,
            });
        } catch (error) {
            request.log.error({ err: error }, 'Record payment error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // GET /orders/:id/payment - Get single payment for an order (backward compatibility)
    fastify.get('/orders/:id/payment', {
        preHandler: [authMiddleware, requireRole('owner', 'manager', 'staff', 'cashier', 'chef', 'host', 'delivery')],
        schema: {
            params: OrderIdParamSchema,
        },
    }, async (request, reply) => {
        const { id: orderId } = request.params as { id: string };

        try {
            const result = await pool.query(
                `SELECT p.id, p.order_id, p.amount, p.method, p.status, p.paid_at, p.created_by, p.notes, p.payer, p.payment_type,
                        u.email, u.role
                 FROM payments p
                 JOIN users u ON p.created_by = u.id
                 WHERE p.order_id = $1
                 ORDER BY p.paid_at ASC
                 LIMIT 1`,
                [orderId]
            );

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Payment not found' });
            }

            const payment = result.rows[0];

            return reply.send({
                id: payment.id.toString(),
                orderId: payment.order_id.toString(),
                amount: parseFloat(payment.amount),
                method: payment.method,
                status: payment.status,
                paidAt: payment.paid_at.toISOString(),
                createdBy: {
                    id: payment.created_by,
                    email: payment.email,
                    role: payment.role,
                },
                notes: payment.notes,
                payer: payment.payer,
                paymentType: payment.payment_type,
            });
        } catch (error) {
            request.log.error({ err: error }, 'Get payment error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // GET /orders/:id/payments - Get all payments for an order (supports split bill)
    fastify.get('/orders/:id/payments', {
        preHandler: [authMiddleware, requireRole('owner', 'manager', 'staff', 'cashier', 'chef', 'host', 'delivery')],
        schema: {
            params: OrderIdParamSchema,
        },
    }, async (request, reply) => {
        const { id: orderId } = request.params as { id: string };

        try {
            const result = await pool.query(
                `SELECT p.id, p.order_id, p.amount, p.method, p.status, p.paid_at, p.created_by, p.notes, p.payer, p.payment_type,
                        u.email, u.role
                 FROM payments p
                 JOIN users u ON p.created_by = u.id
                 WHERE p.order_id = $1
                 ORDER BY p.paid_at ASC`,
                [orderId]
            );

            const payments = result.rows.map((p: any) => ({
                id: p.id.toString(),
                orderId: p.order_id.toString(),
                amount: parseFloat(p.amount),
                method: p.method,
                status: p.status,
                paidAt: p.paid_at.toISOString(),
                createdBy: {
                    id: p.created_by,
                    email: p.email,
                    role: p.role,
                },
                notes: p.notes,
                payer: p.payer,
                paymentType: p.payment_type,
            }));

            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

            // Get order total
            const orderResult = await pool.query(
                'SELECT total FROM orders WHERE id = $1',
                [orderId]
            );

            const orderTotal = orderResult.rows.length > 0 ? parseFloat(orderResult.rows[0].total) : 0;

            return reply.send({
                payments,
                totalPaid,
                orderTotal,
                remaining: orderTotal - totalPaid,
                isFullyPaid: totalPaid >= orderTotal,
            });
        } catch (error) {
            request.log.error({ err: error }, 'Get payments error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // POST /orders/:id/payment/split - Split bill (multiple payments for one order)
    fastify.post('/orders/:id/payment/split', {
        preHandler: [authMiddleware, requireRole('manager', 'staff', 'cashier')],
        schema: {
            params: OrderIdParamSchema,
            body: SplitPaymentBodySchema,
        },
    }, async (request, reply) => {
        const { id: orderId } = request.params as { id: string };
        const { payments: paymentItems } = request.body as { payments: Array<{ amount: number; method: 'CASH' | 'QR'; payer?: string; notes?: string }> };

        try {
            // Check if order exists and get total
            const orderResult = await pool.query(
                'SELECT id, total FROM orders WHERE id = $1',
                [orderId]
            );

            if (orderResult.rows.length === 0) {
                return reply.status(404).send({ error: 'Order not found' });
            }

            const order = orderResult.rows[0];
            const orderTotal = parseFloat(order.total);

            // Validate total amount matches order total
            const totalAmount = paymentItems.reduce((sum, p) => sum + p.amount, 0);
            if (Math.abs(totalAmount - orderTotal) > 0.01) {
                return reply.status(400).send({
                    error: `Total payment amount (${totalAmount.toFixed(2)}) must match order total (${orderTotal.toFixed(2)})`
                });
            }

            // Check if any payment already exists (for split bill, we allow multiple)
            const existingPayments = await pool.query(
                'SELECT id FROM payments WHERE order_id = $1',
                [orderId]
            );

            if (existingPayments.rows.length > 0) {
                return reply.status(400).send({ error: 'Payments already exist for this order. Use individual payment endpoints or clear existing payments first.' });
            }

            // Insert all payments
            const createdPayments = [];
            for (const paymentItem of paymentItems) {
                const paymentResult = await pool.query(
                    `INSERT INTO payments (order_id, amount, method, notes, payer, payment_type, created_by)
                     VALUES ($1, $2, $3, $4, $5, 'SPLIT', $6)
                     RETURNING id, order_id, amount, method, status, paid_at, created_by, notes, payer, payment_type`,
                    [orderId, paymentItem.amount, paymentItem.method, paymentItem.notes || null, paymentItem.payer || null, request.user!.userId]
                );

                const payment = paymentResult.rows[0];
                await auditLog({ 
                    action: 'payment.create', 
                    entityType: 'payment', 
                    entityId: payment.id.toString(), 
                    actorId: request.user!.userId, 
                    actorEmail: request.user!.email, 
                    metadata: { orderId, amount: paymentItem.amount, method: paymentItem.method, payer: paymentItem.payer, paymentType: 'SPLIT' } 
                });
                incrementPayments();

                createdPayments.push({
                    id: payment.id.toString(),
                    orderId: payment.order_id.toString(),
                    amount: parseFloat(payment.amount),
                    method: payment.method,
                    status: payment.status,
                    paidAt: payment.paid_at.toISOString(),
                    createdBy: request.user!.userId,
                    notes: payment.notes,
                    payer: payment.payer,
                    paymentType: payment.payment_type,
                });
            }

            return reply.status(201).send({
                payments: createdPayments,
                totalPaid: totalAmount,
                orderTotal,
                isFullyPaid: true,
            });
        } catch (error) {
            request.log.error({ err: error }, 'Split payment error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // POST /orders/payment/combined - Combined bill (one payment for multiple orders)
    fastify.post('/orders/payment/combined', {
        preHandler: [authMiddleware, requireRole('manager', 'staff', 'cashier')],
        schema: {
            body: CombinedPaymentBodySchema,
        },
    }, async (request, reply) => {
        const { orderIds, amount, method, notes } = request.body as { 
            orderIds: string[]; 
            amount: number; 
            method: 'CASH' | 'QR'; 
            notes?: string 
        };

        try {
            // Validate all orders exist and get totals
            const orderResult = await pool.query(
                `SELECT id, total FROM orders WHERE id = ANY($1::int[])`,
                [orderIds.map(id => parseInt(id, 10))]
            );

            if (orderResult.rows.length !== orderIds.length) {
                return reply.status(404).send({ error: 'One or more orders not found' });
            }

            const orders = orderResult.rows;
            const totalAmount = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);

            // Validate payment amount matches total
            if (Math.abs(amount - totalAmount) > 0.01) {
                return reply.status(400).send({
                    error: `Payment amount (${amount.toFixed(2)}) must match combined order total (${totalAmount.toFixed(2)})`
                });
            }

            // Check if any order already has payment
            const existingPayments = await pool.query(
                'SELECT order_id FROM payments WHERE order_id = ANY($1::int[])',
                [orderIds.map(id => parseInt(id, 10))]
            );

            if (existingPayments.rows.length > 0) {
                return reply.status(400).send({ error: 'One or more orders already have payments' });
            }

            // Insert payment for each order
            const createdPayments = [];
            for (const orderId of orderIds) {
                const order = orders.find((o: any) => o.id.toString() === orderId);
                if (!order) continue;

                const paymentResult = await pool.query(
                    `INSERT INTO payments (order_id, amount, method, notes, payment_type, created_by)
                     VALUES ($1, $2, $3, $4, 'COMBINED', $5)
                     RETURNING id, order_id, amount, method, status, paid_at, created_by, notes, payment_type`,
                    [orderId, parseFloat(order.total), method, notes || null, request.user!.userId]
                );

                const payment = paymentResult.rows[0];
                await auditLog({ 
                    action: 'payment.create', 
                    entityType: 'payment', 
                    entityId: payment.id.toString(), 
                    actorId: request.user!.userId, 
                    actorEmail: request.user!.email, 
                    metadata: { orderId, amount: parseFloat(order.total), method, paymentType: 'COMBINED', combinedOrderIds: orderIds } 
                });
                incrementPayments();

                createdPayments.push({
                    id: payment.id.toString(),
                    orderId: payment.order_id.toString(),
                    amount: parseFloat(payment.amount),
                    method: payment.method,
                    status: payment.status,
                    paidAt: payment.paid_at.toISOString(),
                    createdBy: request.user!.userId,
                    notes: payment.notes,
                    paymentType: payment.payment_type,
                });
            }

            return reply.status(201).send({
                payments: createdPayments,
                totalPaid: amount,
                orderTotal: totalAmount,
                isFullyPaid: true,
            });
        } catch (error) {
            request.log.error({ err: error }, 'Combined payment error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
