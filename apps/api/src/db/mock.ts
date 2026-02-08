const isProd = process.env.NODE_ENV === 'production';

const MOCK_MENU_ITEMS: { id: number; price_thb: number }[] = [
    { id: 1, price_thb: 199 }, { id: 2, price_thb: 249 }, { id: 3, price_thb: 189 },
    { id: 4, price_thb: 159 }, { id: 5, price_thb: 89 }, { id: 6, price_thb: 79 },
    { id: 7, price_thb: 45 }, { id: 8, price_thb: 55 }, { id: 9, price_thb: 65 },
];

export const mockPool = {
    query: async (text: string, params?: unknown[]) => {
        if (!isProd) console.log('🏗️ [MOCK DB] Executing:', text);
        if (text.includes('SELECT 1') || text.includes('SELECT NOW()')) return { rows: [{ now: new Date() }] };
        if (text.includes("guest@system") && text.includes('id')) return { rows: [{ id: 0 }] };
        if (text.includes('FROM users') && text.includes('WHERE') && text.includes('email = $1')) {
            const email = params?.[0];
            if (email === 'owner@test.com') return { rows: [{ id: 1, email: 'owner@test.com', password_hash: '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', role: 'owner' }] };
            if (email === 'staff@test.com') return { rows: [{ id: 2, email: 'staff@test.com', password_hash: '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', role: 'staff' }] };
            if (email === 'cashier@test.com') return { rows: [{ id: 3, email: 'cashier@test.com', password_hash: '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', role: 'cashier' }] };
            return { rows: [] };
        }
        if (text.includes('menu_items') && text.includes('id') && text.includes('price_thb')) {
            const ids = (params && Array.isArray(params[0]) ? params[0] : []) as number[];
            return { rows: MOCK_MENU_ITEMS.filter((m) => ids.includes(m.id)) };
        }
        if (text.includes('restaurants') && text.includes('LIMIT 1')) return { rows: [{ id: 1, name: 'RanRHar' }] };
        if (text.includes('menu_categories')) return {
            rows: [
                { id: 1, name: 'Recommended', sort_order: 0 },
                { id: 2, name: 'Main Dishes', sort_order: 1 },
                { id: 3, name: 'Beverages', sort_order: 2 },
            ],
        };
        if (text.includes('menu_items') && text.includes('category_id')) {
            const catId = params?.[0];
            const itemsByCat: Record<number, number[]> = { 1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9] };
            const ids = itemsByCat[catId as number] || [];
            const rows = MOCK_MENU_ITEMS.filter((m) => ids.includes(m.id)).map((m) => ({
                id: m.id, name: `Item ${m.id}`, priceTHB: m.price_thb, imageUrl: null,
            }));
            return { rows };
        }
        if (text.includes('idempotency_keys')) return { rows: [] };
        if (text.includes('audit_logs')) return { rows: [] };
        if (text.includes('INSERT INTO orders')) {
            const id = Math.floor(Math.random() * 1000);
            const items = typeof params?.[0] === 'string' ? JSON.parse(params[0] as string) : params?.[0] ?? [];
            return { rows: [{ id, items, total: params?.[1] ?? 0, status: 'PENDING', created_at: new Date(), created_by: params?.[2] ?? 0 }] };
        }
        if (text.includes('SELECT') && text.includes('orders') && text.includes('id') && text.includes('total')) {
            const orderId = params?.[0];
            if (orderId === '1') return { rows: [{ id: 1, total: 448 }] };
            return { rows: [] };
        }
        if (text.includes('payments') && text.includes('order_id')) {
            if (text.includes('SELECT id FROM payments')) return { rows: [] };
            if (text.includes('p.order_id') && text.includes('JOIN users')) {
                const orderId = params?.[0];
                if (orderId != null && String(orderId) !== '1') return { rows: [] };
                return { rows: [{ id: 1, order_id: 1, amount: 448, method: 'CASH', status: 'PAID', paid_at: new Date(), created_by: 3, notes: null, email: 'cashier@test.com', role: 'cashier' }] };
            }
        }
        if (text.includes('INSERT INTO payments')) {
            return { rows: [{ id: 1, order_id: params?.[0], amount: params?.[1], method: params?.[2], status: 'PAID', paid_at: new Date(), created_by: params?.[4], notes: params?.[3] }] };
        }
        if (text.includes('inventory_items')) {
            if (text.includes('SELECT') && text.includes('ORDER BY name')) return { rows: [{ id: 1, name: 'Rice', quantity: 10, unit: 'kg', minQuantity: 5, createdAt: new Date(), updatedAt: new Date() }] };
            if (text.includes('SELECT') && text.includes('WHERE id = $1')) return { rows: [{ id: params?.[0], name: 'Rice', quantity: 15, unit: 'kg', minQuantity: 5 }] };
            if (text.includes('INSERT')) return { rows: [{ id: 2, name: 'Oil', quantity: 5, unit: 'L', minQuantity: 2 }] };
        }
        if (text.includes('stock_movements') && text.includes('JOIN users')) {
            return { rows: [{ id: 1, type: 'IN', quantity: 5, reason: 'Initial stock', createdAt: new Date(), createdByEmail: 'owner@test.com' }] };
        }
        if (text.includes('stock_movements')) return { rows: [] };
        if (text.includes('orders') && text.includes('LEFT JOIN payments') && text.includes('ORDER BY')) {
            return { rows: [{ id: 1, items: [], total: 448, status: 'PENDING', created_at: new Date(), created_by: 0, email: 'guest@system', role: 'guest', payment_id: null, payment_amount: null, payment_method: null, payment_status: null }] };
        }
        if (text.includes('UPDATE orders') && text.includes('SET status')) {
            const id = params?.[1];
            if (id === '1' || id === 1) {
                return { rows: [{ id: 1, items: [], total: 448, status: (params?.[0] as string) || 'CONFIRMED', created_at: new Date(), created_by: 0 }] };
            }
            return { rows: [] };
        }
        if (text.includes('orders')) return { rows: [] };
        return { rows: [] };
    },
    connect: async () => ({
        query: async (text: string, params?: unknown[]) => {
            if (!isProd) console.log('🏗️ [MOCK DB connect] Executing:', text.split('\n')[0]);
            if (text.includes('BEGIN') || text.includes('COMMIT') || text.includes('ROLLBACK')) return { rows: [] };
            if (text.includes('INSERT INTO inventory_items') && text.includes('RETURNING')) {
                return { rows: [{ id: 2, name: params?.[0] || 'Oil', quantity: params?.[1] ?? 5, unit: params?.[2] || 'L', minQuantity: params?.[3] ?? 2 }] };
            }
            if (text.includes('INSERT INTO stock_movements')) return { rows: [] };
            if (text.includes('UPDATE inventory_items') && text.includes('quantity = quantity +')) {
                const id = params?.[1];
                return { rows: [{ quantity: id === '1' ? 15 : 10 }] };
            }
            if (text.includes('UPDATE inventory_items') && text.includes('updated_at')) return { rows: [] };
            if (text.includes('SELECT 1') || text.includes('SELECT NOW()')) return { rows: [{ now: new Date() }] };
            if (text.includes("guest@system")) return { rows: [{ id: 0 }] };
            if (text.includes('INSERT INTO orders')) return { rows: [{ id: 1, items: [], total: 0, status: 'PENDING', created_at: new Date(), created_by: 0 }] };
            return { rows: [] };
        },
        release: () => { },
    }),
    on: () => { },
    end: async () => { },
};
