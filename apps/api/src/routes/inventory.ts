import { FastifyInstance } from 'fastify';
import { pool } from '../db';
import { ApiError, Errors } from '../lib/errors';
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
        preHandler: [authMiddleware, requireRole('manager', 'staff')],
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
            if (error instanceof ApiError) {
                throw error;
            }
            throw Errors.system.internal('Failed to retrieve inventory');
        }
    });

    // POST /inventory - Create a new inventory item
    fastify.post<{
        Body: CreateItemRequest;
    }>('/inventory', {
        preHandler: [authMiddleware, requireRole('manager', 'staff')],
    }, async (request, reply) => {
        const { name, quantity, unit, minQuantity } = request.body;

        if (!name || typeof quantity !== 'number' || !unit || typeof minQuantity !== 'number') {
            throw Errors.validation.required('name, quantity, unit, minQuantity');
        }
        if (quantity < 0) {
            throw Errors.inventory.invalidQuantity(quantity);
        }
        if (minQuantity < 0) {
            throw Errors.inventory.invalidQuantity(minQuantity);
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
            if (error instanceof ApiError) {
                throw error;
            }
            throw Errors.system.internal('Failed to create inventory item');
        } finally {
            client.release();
        }
    });

    // PATCH /inventory/:id - Update item metadata or adjust stock
    fastify.patch<{
        Params: { id: string };
        Body: UpdateItemRequest & { adjustment?: AdjustStockRequest };
    }>('/inventory/:id', {
        preHandler: [authMiddleware, requireRole('manager', 'staff')],
    }, async (request, reply) => {
        const { id } = request.params;
        const itemId = parseInt(id, 10);
        if (isNaN(itemId) || itemId < 1) {
            throw Errors.validation.invalidId(id);
        }

        const { name, minQuantity, adjustment } = request.body;

        if (minQuantity !== undefined && minQuantity < 0) {
            throw Errors.inventory.invalidQuantity(minQuantity);
        }

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

                values.push(itemId);
                await client.query(
                    `UPDATE inventory_items SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`,
                    values
                );
            }

            // 2. Process stock adjustment if provided
            if (adjustment) {
                const { type, quantity, reason } = adjustment;

                if (!['IN', 'OUT', 'ADJUST'].includes(type) || typeof quantity !== 'number' || quantity <= 0) {
                    throw Errors.validation.invalidFormat('adjustment', 'valid type (IN/OUT/ADJUST) and positive quantity');
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
                    [change, itemId]
                );

                if (updateRes.rows.length === 0) {
                    throw Errors.inventory.itemNotFound(id);
                }

                // Record movement
                await client.query(
                    `INSERT INTO stock_movements (item_id, type, quantity, reason, created_by)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [itemId, type, quantity, reason, request.user!.userId]
                );
            }

            await client.query('COMMIT');

            const finalResult = await pool.query(
                `SELECT id, name, quantity, unit, min_quantity as "minQuantity" FROM inventory_items WHERE id = $1`,
                [itemId]
            );

            return reply.send(finalResult.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            request.log.error({ err: error }, 'Update inventory error');
            const errorMessage = error instanceof Error ? error.message : '';
            if (errorMessage === 'Item not found') {
                const itemId = (request.params as { id: string }).id;
                throw Errors.inventory.itemNotFound(itemId);
            }
            if (errorMessage === 'Invalid adjustment data') {
                throw Errors.validation.invalidFormat('adjustment data', 'valid format');
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw Errors.system.internal('Failed to adjust inventory stock');
        } finally {
            client.release();
        }
    });

    // GET /inventory/:id/movements - Get movement history for an item
    fastify.get<{
        Params: { id: string };
    }>('/inventory/:id/movements', {
        preHandler: [authMiddleware, requireRole('manager', 'staff')],
    }, async (request, reply) => {
        const { id } = request.params;
        const itemId = parseInt(id, 10);
        if (isNaN(itemId) || itemId < 1) {
            throw Errors.validation.invalidId(id);
        }

        try {
            const result = await pool.query(
                `SELECT sm.id, sm.type, sm.quantity, sm.reason, sm.created_at as "createdAt", u.email as "createdByEmail"
                 FROM stock_movements sm
                 JOIN users u ON sm.created_by = u.id
                 WHERE sm.item_id = $1
                 ORDER BY sm.created_at DESC
                 LIMIT 50`,
                [itemId]
            );

            return reply.send({ movements: result.rows });
        } catch (error) {
            request.log.error({ err: error }, 'Get movements error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
