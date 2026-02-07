import { FastifyInstance } from 'fastify';
import { pool } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

interface RecordPaymentRequest {
    amount: number;
    method: 'CASH' | 'QR';
    notes?: string;
}

export async function paymentRoutes(fastify: FastifyInstance) {
    // POST /orders/:id/payment - Record payment for an order
    fastify.post<{
        Params: {
            id: string;
        };
        Body: RecordPaymentRequest;
    }>('/orders/:id/payment', {
        preHandler: [authMiddleware, requireRole('staff', 'cashier')],
    }, async (request, reply) => {
        const { id: orderId } = request.params;
        const { amount, method, notes } = request.body;

        // Validate input
        if (typeof amount !== 'number' || amount <= 0) {
            return reply.status(400).send({ error: 'Valid amount is required' });
        }

        if (!method || !['CASH', 'QR'].includes(method)) {
            return reply.status(400).send({ error: 'Payment method must be CASH or QR' });
        }

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
            console.error('Record payment error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // GET /orders/:id/payment - Get payment details for an order
    fastify.get<{
        Params: {
            id: string;
        };
    }>('/orders/:id/payment', {
        preHandler: [authMiddleware, requireRole('owner', 'staff', 'cashier')],
    }, async (request, reply) => {
        const { id: orderId } = request.params;

        try {
            const result = await pool.query(
                `SELECT p.id, p.order_id, p.amount, p.method, p.status, p.paid_at, p.created_by, p.notes,
                        u.email, u.role
                 FROM payments p
                 JOIN users u ON p.created_by = u.id
                 WHERE p.order_id = $1`,
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
            });
        } catch (error) {
            console.error('Get payment error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
