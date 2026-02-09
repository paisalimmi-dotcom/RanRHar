import { FastifyInstance } from 'fastify';
import { pool } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

export async function menuRoutes(fastify: FastifyInstance) {
    // POST /menu/categories - Create category (manager only)
    fastify.post<{
        Body: { name: string; sortOrder?: number };
    }>('/menu/categories', {
        preHandler: [authMiddleware, requireRole('manager')],
    }, async (request, reply) => {
        const { name, sortOrder = 999 } = request.body;
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return reply.status(400).send({ error: 'Name is required' });
        }
        try {
            const result = await pool.query(
                `INSERT INTO menu_categories (restaurant_id, name, sort_order)
                 SELECT 1, $1, $2
                 RETURNING id, name, sort_order`, [name.trim(), sortOrder]
            );
            const row = result.rows[0];
            return reply.status(201).send({ id: row.id, name: row.name, sortOrder: row.sort_order ?? 999 });
        } catch (error) {
            request.log.error({ err: error }, 'Create category error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // PATCH /menu/categories/:id - Update category (manager only)
    fastify.patch<{
        Params: { id: string };
        Body: { name?: string; sortOrder?: number };
    }>('/menu/categories/:id', {
        preHandler: [authMiddleware, requireRole('manager')],
    }, async (request, reply) => {
        const id = parseInt(request.params.id, 10);
        if (isNaN(id) || id < 1) return reply.status(400).send({ error: 'Invalid category ID' });
        const { name, sortOrder } = request.body;
        if (!name && sortOrder === undefined) {
            return reply.status(400).send({ error: 'At least one field required: name, sortOrder' });
        }
        try {
            const updates: string[] = [];
            const values: unknown[] = [];
            let i = 1;
            if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name.trim()); }
            if (sortOrder !== undefined) { updates.push(`sort_order = $${i++}`); values.push(sortOrder); }
            values.push(id);
            const result = await pool.query(
                `UPDATE menu_categories SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, name, sort_order`,
                values
            );
            const row = result.rows[0];
            if (!row) return reply.status(404).send({ error: 'Category not found' });
            return reply.send({ id: row.id, name: row.name, sortOrder: row.sort_order ?? 999 });
        } catch (error) {
            request.log.error({ err: error }, 'Update category error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // DELETE /menu/categories/:id - Delete category (owner only, must be empty)
    fastify.delete<{
        Params: { id: string };
    }>('/menu/categories/:id', {
        preHandler: [authMiddleware, requireRole('manager')],
    }, async (request, reply) => {
        const id = parseInt(request.params.id, 10);
        if (isNaN(id) || id < 1) return reply.status(400).send({ error: 'Invalid category ID' });
        try {
            const countResult = await pool.query(
                'SELECT COUNT(*)::int as cnt FROM menu_items WHERE category_id = $1', [id]
            );
            if (countResult.rows[0]?.cnt > 0) {
                return reply.status(400).send({ error: 'Cannot delete category that has menu items. Move or delete items first.' });
            }
            await pool.query('DELETE FROM menu_categories WHERE id = $1', [id]);
            return reply.status(204).send();
        } catch (error) {
            request.log.error({ err: error }, 'Delete category error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // POST /menu/items - Create menu item (manager only)
    fastify.post<{
        Body: { categoryId: number; name: string; priceTHB: number; imageUrl?: string | null };
    }>('/menu/items', {
        preHandler: [authMiddleware, requireRole('manager')],
    }, async (request, reply) => {
        const { categoryId, name, priceTHB, imageUrl } = request.body;
        if (!categoryId || !name || typeof priceTHB !== 'number') {
            return reply.status(400).send({ error: 'categoryId, name, priceTHB required' });
        }
        try {
            const result = await pool.query(
                `INSERT INTO menu_items (category_id, name, price_thb, image_url, sort_order)
                 VALUES ($1, $2, $3, $4, 999)
                 RETURNING id, name, price_thb as "priceTHB", image_url as "imageUrl"`,
                [categoryId, name.trim(), priceTHB, imageUrl || null]
            );
            const row = result.rows[0];
            return reply.status(201).send({
                id: row.id,
                name: row.name,
                priceTHB: Number(row.priceTHB),
                imageUrl: row.imageUrl || undefined,
            });
        } catch (error) {
            request.log.error({ err: error }, 'Create menu item error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // GET /menu/admin - Get full menu for admin (manager only)
    fastify.get('/menu/admin', {
        preHandler: [authMiddleware, requireRole('manager')],
    }, async (request, reply) => {
        try {
            const [restaurantResult, categoriesResult] = await Promise.all([
                pool.query('SELECT id, name FROM restaurants LIMIT 1'),
                pool.query('SELECT mc.id, mc.name, mc.sort_order FROM menu_categories mc ORDER BY mc.sort_order ASC'),
            ]);
            const restaurant = restaurantResult.rows[0];
            const categories = categoriesResult.rows;
            if (!restaurant) return reply.status(404).send({ error: 'Restaurant not found' });

            const categoriesWithItems = await Promise.all(
                categories.map(async (cat: { id: number; name: string; sort_order: number }) => {
                    const itemsResult = await pool.query(
                        `SELECT id, name, price_thb as "priceTHB", image_url as "imageUrl"
                         FROM menu_items WHERE category_id = $1 ORDER BY sort_order ASC`,
                        [cat.id]
                    );
                    return {
                        id: cat.id,
                        name: cat.name,
                        sortOrder: cat.sort_order,
                        items: itemsResult.rows.map((r: { id: number; name: string; priceTHB: number; imageUrl: string }) => ({
                            id: r.id,
                            name: r.name,
                            priceTHB: Number(r.priceTHB),
                            imageUrl: r.imageUrl || undefined,
                        })),
                    };
                })
            );
            return reply.send({ restaurant: { name: restaurant.name, branchName: 'Branch 001' }, categories: categoriesWithItems });
        } catch (error) {
            request.log.error({ err: error }, 'Get menu admin error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // PATCH /menu/items/:id - Update menu item (manager only)
    fastify.patch<{
        Params: { id: string };
        Body: { name?: string; priceTHB?: number; imageUrl?: string | null };
    }>('/menu/items/:id', {
        preHandler: [authMiddleware, requireRole('manager')],
    }, async (request, reply) => {
        const id = parseInt(request.params.id, 10);
        if (isNaN(id) || id < 1) return reply.status(400).send({ error: 'Invalid item ID' });

        const { name, priceTHB, imageUrl } = request.body;
        if (!name && priceTHB === undefined && imageUrl === undefined) {
            return reply.status(400).send({ error: 'At least one field required: name, priceTHB, imageUrl' });
        }

        try {
            const updates: string[] = [];
            const values: unknown[] = [];
            let i = 1;
            if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name); }
            if (priceTHB !== undefined) { updates.push(`price_thb = $${i++}`); values.push(priceTHB); }
            if (imageUrl !== undefined) { updates.push(`image_url = $${i++}`); values.push(imageUrl || null); }
            values.push(id);

            const result = await pool.query(
                `UPDATE menu_items SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, name, price_thb as "priceTHB", image_url as "imageUrl"`,
                values
            );
            const row = result.rows[0];
            if (!row) return reply.status(404).send({ error: 'Menu item not found' });
            return reply.send({
                id: row.id,
                name: row.name,
                priceTHB: Number(row.priceTHB),
                imageUrl: row.imageUrl || undefined,
            });
        } catch (error) {
            request.log.error({ err: error }, 'Update menu item error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // GET /menu?tableCode=...&lang=... - Get menu for table (public, no auth)
    fastify.get<{
        Querystring: { tableCode?: string; lang?: string };
    }>('/menu', async (request, reply) => {
        const { tableCode = 'A12', lang = 'th' } = request.query;
        const isEnglish = lang === 'en';

        try {
            const [restaurantResult, categoriesResult] = await Promise.all([
                pool.query(
                    `SELECT id, name FROM restaurants LIMIT 1`
                ),
                pool.query(
                    `SELECT mc.id, mc.name, mc.name_en, mc.sort_order
                     FROM menu_categories mc
                     ORDER BY mc.sort_order ASC`
                ),
            ]);

            const restaurant = restaurantResult.rows[0];
            const categories = categoriesResult.rows;

            if (!restaurant) {
                return reply.status(404).send({ error: 'Restaurant not found' });
            }

            const categoriesWithItems = await Promise.all(
                categories.map(async (cat: { id: number; name: string; name_en: string | null; sort_order: number }) => {
                    const itemsResult = await pool.query(
                        `SELECT id, name, name_en, price_thb as "priceTHB", image_url as "imageUrl"
                         FROM menu_items
                         WHERE category_id = $1
                         ORDER BY sort_order ASC`,
                        [cat.id]
                    );
                    return {
                        id: `cat-${cat.id}`,
                        name: isEnglish && cat.name_en ? cat.name_en : cat.name,
                        items: itemsResult.rows.map((r: { id: number; name: string; name_en: string | null; priceTHB: number; imageUrl: string }) => ({
                            id: `m-${r.id}`,
                            name: isEnglish && r.name_en ? r.name_en : r.name,
                            priceTHB: Number(r.priceTHB),
                            imageUrl: r.imageUrl || undefined,
                        })),
                    };
                })
            );

            return reply.send({
                restaurant: {
                    name: restaurant.name,
                    branchName: isEnglish ? 'Branch 001' : 'สาขา 001',
                    tableCode,
                },
                categories: categoriesWithItems,
            });
        } catch (error) {
            request.log.error({ err: error }, 'Get menu error');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
