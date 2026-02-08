import { FastifyInstance } from 'fastify';
import { pool } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

interface CreateItemRequest {
    name: string;
    quantity: number;
    unit: string;
    minQuantity: number;
}

interface UpdateItemRequest {
    name?: string;
    minQuantity?: number;
}

interface AdjustStockRequest {
    type: 'IN' | 'OUT' | 'ADJUST';
    quantity: number;
    reason: string;
}

export async function inventoryRoutes(fastify: FastifyInstance) {
    // GET /inventory - List all inventory items
    fastify.get('/inventory', {
        preHandler: [authMiddleware, requireRole('owner', 'staff')],
    }, async (request, reply) => {
        try {
            const result = await pool.query(
                `SELECT id, name, quantity, unit, min_quantity as "minQuantity", created_at as "createdAt", updated_at as "updatedAt"
                 FROM inventory_items
                 ORDER BY name ASC`
            );

            return reply.send({ items: result.rows });
        } catch (error) {
            request.log.error({ err: error }, 'Get inventory error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // POST /inventory - Create a new inventory item
    fastify.post<{
        Body: CreateItemRequest;
    }>('/inventory', {
        preHandler: [authMiddleware, requireRole('owner', 'staff')],
    }, async (request, reply) => {
        const { name, quantity, unit, minQuantity } = request.body;

        if (!name || typeof quantity !== 'number' || !unit || typeof minQuantity !== 'number') {
            return reply.status(400).send({ error: 'Missing required fields' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const itemResult = await client.query(
                `INSERT INTO inventory_items (name, quantity, unit, min_quantity)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, name, quantity, unit, min_quantity as "minQuantity"`,
                [name, quantity, unit, minQuantity]
            );

            const newItem = itemResult.rows[0];

            // Record initial stock movement if quantity > 0
            if (quantity > 0) {
                await client.query(
                    `INSERT INTO stock_movements (item_id, type, quantity, reason, created_by)
                     VALUES ($1, 'IN', $2, 'Initial stock', $3)`,
                    [newItem.id, quantity, request.user!.userId]
                );
            }

            await client.query('COMMIT');
            return reply.status(201).send(newItem);
        } catch (error) {
            await client.query('ROLLBACK');
            request.log.error({ err: error }, 'Create inventory item error');
            return reply.status(500).send({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    });

    // PATCH /inventory/:id - Update item metadata or adjust stock
    fastify.patch<{
        Params: { id: string };
        Body: UpdateItemRequest & { adjustment?: AdjustStockRequest };
    }>('/inventory/:id', {
        preHandler: [authMiddleware, requireRole('owner', 'staff')],
    }, async (request, reply) => {
        const { id } = request.params;
        const { name, minQuantity, adjustment } = request.body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Update metadata if provided
            if (name !== undefined || minQuantity !== undefined) {
                const updates: string[] = [];
                const values: unknown[] = [];
                let paramIndex = 1;

                if (name !== undefined) {
                    updates.push(`name = $${paramIndex++}`);
                    values.push(name);
                }
                if (minQuantity !== undefined) {
                    updates.push(`min_quantity = $${paramIndex++}`);
                    values.push(minQuantity);
                }

                values.push(id);
                await client.query(
                    `UPDATE inventory_items SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`,
                    values
                );
            }

            // 2. Process stock adjustment if provided
            if (adjustment) {
                const { type, quantity, reason } = adjustment;

                if (!['IN', 'OUT', 'ADJUST'].includes(type) || typeof quantity !== 'number' || quantity <= 0) {
                    throw new Error('Invalid adjustment data');
                }

                // Calculate numeric change
                let change = quantity;
                if (type === 'OUT') change = -quantity;

                // Update total quantity
                const updateRes = await client.query(
                    `UPDATE inventory_items 
                     SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $2
                     RETURNING quantity`,
                    [change, id]
                );

                if (updateRes.rows.length === 0) {
                    throw new Error('Item not found');
                }

                // Record movement
                await client.query(
                    `INSERT INTO stock_movements (item_id, type, quantity, reason, created_by)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [id, type, quantity, reason, request.user!.userId]
                );
            }

            await client.query('COMMIT');

            const finalResult = await pool.query(
                `SELECT id, name, quantity, unit, min_quantity as "minQuantity" FROM inventory_items WHERE id = $1`,
                [id]
            );

            return reply.send(finalResult.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            request.log.error({ err: error }, 'Update inventory error');
            const errorMessage = error instanceof Error ? error.message : '';
            if (errorMessage === 'Item not found') return reply.status(404).send({ error: 'Item not found' });
            if (errorMessage === 'Invalid adjustment data') return reply.status(400).send({ error: errorMessage });
            return reply.status(500).send({ error: 'Internal server error' });
        } finally {
            client.release();
        }
    });

    // GET /inventory/:id/movements - Get movement history for an item
    fastify.get<{
        Params: { id: string };
    }>('/inventory/:id/movements', {
        preHandler: [authMiddleware, requireRole('owner', 'staff')],
    }, async (request, reply) => {
        const { id } = request.params;

        try {
            const result = await pool.query(
                `SELECT sm.id, sm.type, sm.quantity, sm.reason, sm.created_at as "createdAt", u.email as "createdByEmail"
                 FROM stock_movements sm
                 JOIN users u ON sm.created_by = u.id
                 WHERE sm.item_id = $1
                 ORDER BY sm.created_at DESC
                 LIMIT 50`,
                [id]
            );

            return reply.send({ movements: result.rows });
        } catch (error) {
            request.log.error({ err: error }, 'Get movements error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
