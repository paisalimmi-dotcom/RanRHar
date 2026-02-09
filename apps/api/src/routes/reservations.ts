import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { pool } from '../db';
import { auditLog } from '../lib/audit';
import { authMiddleware, requireRole } from '../middleware/auth';

export async function reservationRoutes(fastify: FastifyInstance) {
    // POST /reservations - Create reservation (public, no auth required)
    fastify.post('/reservations', {
        config: {
            rateLimit: {
                max: 10,
                timeWindow: '1 minute',
            },
        },
        schema: {
            body: Type.Object({
                tableCode: Type.String({ maxLength: 50 }),
                customerName: Type.String({ minLength: 1, maxLength: 255 }),
                customerPhone: Type.Optional(Type.String({ maxLength: 50 })),
                customerEmail: Type.Optional(Type.String({ maxLength: 255 })),
                reservationDate: Type.String({ format: 'date' }),
                reservationTime: Type.String({ pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' }),
                partySize: Type.Integer({ minimum: 1, maximum: 50 }),
                notes: Type.Optional(Type.String({ maxLength: 500 })),
            }),
        },
    }, async (request, reply) => {
        const {
            tableCode,
            customerName,
            customerPhone,
            customerEmail,
            reservationDate,
            reservationTime,
            partySize,
            notes,
        } = request.body as {
            tableCode: string;
            customerName: string;
            customerPhone?: string;
            customerEmail?: string;
            reservationDate: string;
            reservationTime: string;
            partySize: number;
            notes?: string;
        };

        try {
            // Validate reservation date is not in the past
            const resDate = new Date(reservationDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (resDate < today) {
                return reply.status(400).send({ error: 'Reservation date cannot be in the past' });
            }

            // Validate reservation time is reasonable (e.g., within business hours)
            const [hours, minutes] = reservationTime.split(':').map(Number);
            if (hours < 8 || hours > 22) {
                return reply.status(400).send({ error: 'Reservation time must be between 08:00 and 22:00' });
            }

            const result = await pool.query(
                `INSERT INTO reservations (table_code, customer_name, customer_phone, customer_email, reservation_date, reservation_time, party_size, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id, table_code, customer_name, customer_phone, customer_email, reservation_date, reservation_time, party_size, status, notes, created_at`,
                [tableCode, customerName, customerPhone || null, customerEmail || null, reservationDate, reservationTime, partySize, notes || null]
            );

            const reservation = result.rows[0];
            await auditLog({
                action: 'reservation.create',
                entityType: 'reservation',
                entityId: reservation.id.toString(),
                metadata: { tableCode, customerName, reservationDate, reservationTime, partySize },
                ip: request.ip,
            });

            return reply.status(201).send({
                id: reservation.id.toString(),
                tableCode: reservation.table_code,
                customerName: reservation.customer_name,
                customerPhone: reservation.customer_phone,
                customerEmail: reservation.customer_email,
                reservationDate: reservation.reservation_date.toISOString().split('T')[0],
                reservationTime: reservation.reservation_time,
                partySize: reservation.party_size,
                status: reservation.status,
                notes: reservation.notes,
                createdAt: reservation.created_at.toISOString(),
            });
        } catch (error) {
            request.log.error({ err: error }, 'Create reservation error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // GET /reservations - Get reservations (manager/staff only)
    fastify.get('/reservations', {
        preHandler: [authMiddleware, requireRole('manager', 'staff', 'host')],
        schema: {
            querystring: Type.Object({
                date: Type.Optional(Type.String({ format: 'date' })),
                status: Type.Optional(Type.Union([
                    Type.Literal('PENDING'),
                    Type.Literal('CONFIRMED'),
                    Type.Literal('SEATED'),
                    Type.Literal('CANCELLED'),
                    Type.Literal('COMPLETED'),
                ])),
                tableCode: Type.Optional(Type.String({ maxLength: 50 })),
            }),
        },
    }, async (request, reply) => {
        const { date, status, tableCode } = request.query as {
            date?: string;
            status?: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'COMPLETED';
            tableCode?: string;
        };

        try {
            let query = `
                SELECT id, table_code, customer_name, customer_phone, customer_email, 
                       reservation_date, reservation_time, party_size, status, notes, 
                       created_at, updated_at, created_by, confirmed_by, confirmed_at
                FROM reservations
                WHERE 1=1
            `;
            const params: unknown[] = [];
            let paramIndex = 1;

            if (date) {
                query += ` AND reservation_date = $${paramIndex++}`;
                params.push(date);
            }

            if (status) {
                query += ` AND status = $${paramIndex++}`;
                params.push(status);
            }

            if (tableCode) {
                query += ` AND table_code = $${paramIndex++}`;
                params.push(tableCode);
            }

            query += ` ORDER BY reservation_date ASC, reservation_time ASC`;

            const result = await pool.query(query, params);

            return reply.send({
                reservations: result.rows.map((r: any) => ({
                    id: r.id.toString(),
                    tableCode: r.table_code,
                    customerName: r.customer_name,
                    customerPhone: r.customer_phone,
                    customerEmail: r.customer_email,
                    reservationDate: r.reservation_date.toISOString().split('T')[0],
                    reservationTime: r.reservation_time,
                    partySize: r.party_size,
                    status: r.status,
                    notes: r.notes,
                    createdAt: r.created_at.toISOString(),
                    updatedAt: r.updated_at.toISOString(),
                    createdBy: r.created_by,
                    confirmedBy: r.confirmed_by,
                    confirmedAt: r.confirmed_at?.toISOString(),
                })),
            });
        } catch (error) {
            request.log.error({ err: error }, 'Get reservations error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // GET /reservations/:id - Get single reservation
    fastify.get('/reservations/:id', {
        preHandler: [authMiddleware, requireRole('manager', 'staff', 'host')],
        schema: {
            params: Type.Object({
                id: Type.String({ pattern: '^[0-9]+$' }),
            }),
        },
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            const result = await pool.query(
                `SELECT id, table_code, customer_name, customer_phone, customer_email, 
                        reservation_date, reservation_time, party_size, status, notes, 
                        created_at, updated_at, created_by, confirmed_by, confirmed_at
                 FROM reservations
                 WHERE id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Reservation not found' });
            }

            const r = result.rows[0];
            return reply.send({
                id: r.id.toString(),
                tableCode: r.table_code,
                customerName: r.customer_name,
                customerPhone: r.customer_phone,
                customerEmail: r.customer_email,
                reservationDate: r.reservation_date.toISOString().split('T')[0],
                reservationTime: r.reservation_time,
                partySize: r.party_size,
                status: r.status,
                notes: r.notes,
                createdAt: r.created_at.toISOString(),
                updatedAt: r.updated_at.toISOString(),
                createdBy: r.created_by,
                confirmedBy: r.confirmed_by,
                confirmedAt: r.confirmed_at?.toISOString(),
            });
        } catch (error) {
            request.log.error({ err: error }, 'Get reservation error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // PATCH /reservations/:id/status - Update reservation status (manager/staff/host only)
    fastify.patch('/reservations/:id/status', {
        preHandler: [authMiddleware, requireRole('manager', 'staff', 'host')],
        schema: {
            params: Type.Object({
                id: Type.String({ pattern: '^[0-9]+$' }),
            }),
            body: Type.Object({
                status: Type.Union([
                    Type.Literal('PENDING'),
                    Type.Literal('CONFIRMED'),
                    Type.Literal('SEATED'),
                    Type.Literal('CANCELLED'),
                    Type.Literal('COMPLETED'),
                ]),
            }),
        },
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'COMPLETED' };

        try {
            let query = `UPDATE reservations SET status = $1`;
            const params: unknown[] = [status];
            let paramIndex = 2;

            // If confirming, set confirmed_by and confirmed_at
            if (status === 'CONFIRMED') {
                query += `, confirmed_by = $${paramIndex++}, confirmed_at = CURRENT_TIMESTAMP`;
                params.push(request.user!.userId);
            }

            query += ` WHERE id = $${paramIndex++} RETURNING id, table_code, customer_name, reservation_date, reservation_time, status, confirmed_by, confirmed_at`;
            params.push(id);

            const result = await pool.query(query, params);

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Reservation not found' });
            }

            const reservation = result.rows[0];
            await auditLog({
                action: 'reservation.update',
                entityType: 'reservation',
                entityId: reservation.id.toString(),
                actorId: request.user!.userId,
                actorEmail: request.user!.email,
                metadata: { status, tableCode: reservation.table_code },
            });

            return reply.send({
                id: reservation.id.toString(),
                status: reservation.status,
                confirmedBy: reservation.confirmed_by,
                confirmedAt: reservation.confirmed_at?.toISOString(),
            });
        } catch (error) {
            request.log.error({ err: error }, 'Update reservation status error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // DELETE /reservations/:id - Cancel reservation (manager/staff/host only)
    fastify.delete('/reservations/:id', {
        preHandler: [authMiddleware, requireRole('manager', 'staff', 'host')],
        schema: {
            params: Type.Object({
                id: Type.String({ pattern: '^[0-9]+$' }),
            }),
        },
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            // Instead of deleting, update status to CANCELLED
            const result = await pool.query(
                `UPDATE reservations 
                 SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1
                 RETURNING id`,
                [id]
            );

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Reservation not found' });
            }

            await auditLog({
                action: 'reservation.cancel',
                entityType: 'reservation',
                entityId: id,
                actorId: request.user!.userId,
                actorEmail: request.user!.email,
            });

            return reply.status(204).send();
        } catch (error) {
            request.log.error({ err: error }, 'Cancel reservation error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
