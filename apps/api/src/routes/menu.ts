import { FastifyInstance } from 'fastify';
import { pool } from '../db';

export async function menuRoutes(fastify: FastifyInstance) {
    // GET /menu?tableCode=... - Get menu for table (public, no auth)
    fastify.get<{
        Querystring: { tableCode?: string };
    }>('/menu', async (request, reply) => {
        const { tableCode = 'A12' } = request.query;

        try {
            const [restaurantResult, categoriesResult] = await Promise.all([
                pool.query(
                    `SELECT id, name FROM restaurants LIMIT 1`
                ),
                pool.query(
                    `SELECT mc.id, mc.name, mc.sort_order
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
                categories.map(async (cat: { id: number; name: string; sort_order: number }) => {
                    const itemsResult = await pool.query(
                        `SELECT id, name, price_thb as "priceTHB", image_url as "imageUrl"
                         FROM menu_items
                         WHERE category_id = $1
                         ORDER BY sort_order ASC`,
                        [cat.id]
                    );
                    return {
                        id: `cat-${cat.id}`,
                        name: cat.name,
                        items: itemsResult.rows.map((r: { id: number; name: string; priceTHB: number; imageUrl: string }) => ({
                            id: `m-${r.id}`,
                            name: r.name,
                            priceTHB: Number(r.priceTHB),
                            imageUrl: r.imageUrl || undefined,
                        })),
                    };
                })
            );

            return reply.send({
                restaurant: {
                    name: restaurant.name,
                    branchName: 'Branch 001',
                    tableCode,
                },
                categories: categoriesWithItems,
            });
        } catch (error) {
            console.error('Get menu error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
