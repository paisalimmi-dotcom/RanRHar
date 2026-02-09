const isProd = process.env.NODE_ENV === 'production';

// Mutable store for menu categories (CRUD in dev)
let mockCategoriesStore: { id: number; name: string; sort_order: number }[] = [
    { id: 1, name: 'แนะนำ', sort_order: 0 },
    { id: 2, name: 'อาหารจานหลัก', sort_order: 1 },
    { id: 3, name: 'เครื่องดื่ม', sort_order: 2 },
];
let nextCategoryId = 4;

// Mutable store for menu items (allows owner to edit image/name/price in dev)
const mockMenuStore: Record<number, { name: string; price_thb: number; imageUrl: string | null; category_id: number }> = {
    1: { name: 'ผัดไทย', price_thb: 199, imageUrl: 'https://picsum.photos/seed/padthai/400/300', category_id: 1 },
    2: { name: 'ต้มยำกุ้ง', price_thb: 249, imageUrl: 'https://picsum.photos/seed/tomyum/400/300', category_id: 1 },
    3: { name: 'แกงเขียวหวาน', price_thb: 189, imageUrl: 'https://picsum.photos/seed/greencurry/400/300', category_id: 1 },
    4: { name: 'ไก่ย่าง', price_thb: 159, imageUrl: 'https://picsum.photos/seed/chicken/400/300', category_id: 2 },
    5: { name: 'ข้าวผัด', price_thb: 89, imageUrl: 'https://picsum.photos/seed/friedrice/400/300', category_id: 2 },
    6: { name: 'ผัดผัก', price_thb: 79, imageUrl: 'https://picsum.photos/seed/veggies/400/300', category_id: 2 },
    7: { name: 'ชาเย็น', price_thb: 45, imageUrl: 'https://picsum.photos/seed/thaitea/400/300', category_id: 3 },
    8: { name: 'มะพร้าวอ่อน', price_thb: 55, imageUrl: 'https://picsum.photos/seed/coconut/400/300', category_id: 3 },
    9: { name: 'สมูทตี้มะม่วง', price_thb: 65, imageUrl: 'https://picsum.photos/seed/mango/400/300', category_id: 3 },
};
let nextItemId = 10;

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
            if (email === 'manager@test.com') return { rows: [{ id: 4, email: 'manager@test.com', password_hash: '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', role: 'manager' }] };
            if (email === 'staff@test.com') return { rows: [{ id: 2, email: 'staff@test.com', password_hash: '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', role: 'staff' }] };
            if (email === 'cashier@test.com') return { rows: [{ id: 3, email: 'cashier@test.com', password_hash: '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', role: 'cashier' }] };
            if (email === 'chef@test.com') return { rows: [{ id: 5, email: 'chef@test.com', password_hash: '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', role: 'chef' }] };
            if (email === 'host@test.com') return { rows: [{ id: 6, email: 'host@test.com', password_hash: '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', role: 'host' }] };
            if (email === 'delivery@test.com') return { rows: [{ id: 7, email: 'delivery@test.com', password_hash: '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', role: 'delivery' }] };
            return { rows: [] };
        }
        if (text.includes('menu_items') && text.includes('ANY') && text.includes('price_thb')) {
            const ids = (params && Array.isArray(params[0]) ? params[0] : []) as number[];
            return { rows: MOCK_MENU_ITEMS.filter((m) => ids.includes(m.id)) };
        }
        if (text.includes('restaurants') && text.includes('LIMIT 1')) return { rows: [{ id: 1, name: 'RanRHar' }] };
        if (text.includes('menu_categories') && text.includes('SELECT') && !text.includes('INSERT')) {
            return { rows: [...mockCategoriesStore].sort((a, b) => a.sort_order - b.sort_order) };
        }
        if (text.includes('INSERT INTO menu_categories') && text.includes('RETURNING')) {
            const name = params?.[0] as string;
            const sort_order = (params?.[1] as number) ?? 999;
            const id = nextCategoryId++;
            mockCategoriesStore.push({ id, name: name || 'New', sort_order });
            return { rows: [{ id, name: name || 'New', sort_order }] };
        }
        if (text.includes('UPDATE menu_categories') && text.includes('RETURNING')) {
            const p = params ?? [];
            const id = p[p.length - 1] as number;
            const cat = mockCategoriesStore.find((c) => c.id === id);
            if (!cat) return { rows: [] };
            const nameIdx = text.match(/name = \$(\d+)/)?.[1];
            const orderIdx = text.match(/sort_order = \$(\d+)/)?.[1];
            if (nameIdx) cat.name = p[parseInt(nameIdx, 10) - 1] as string;
            if (orderIdx) cat.sort_order = p[parseInt(orderIdx, 10) - 1] as number;
            return { rows: [{ id: cat.id, name: cat.name, sort_order: cat.sort_order }] };
        }
        if (text.includes('DELETE FROM menu_categories')) {
            const id = params?.[0] as number;
            mockCategoriesStore = mockCategoriesStore.filter((c) => c.id !== id);
            return { rows: [] };
        }
        if (text.includes('menu_items') && text.includes('category_id') && text.includes('SELECT')) {
            const catId = params?.[0];
            const rows = Object.entries(mockMenuStore)
                .filter(([, s]) => s.category_id === catId)
                .map(([id, s]) => ({ id: parseInt(id, 10), name: s.name, priceTHB: s.price_thb, imageUrl: s.imageUrl }));
            return { rows };
        }
        if (text.includes('COUNT') && text.includes('menu_items') && text.includes('category_id')) {
            const catId = params?.[0] as number;
            const cnt = Object.values(mockMenuStore).filter((s) => s.category_id === catId).length;
            return { rows: [{ cnt }] };
        }
        if (text.includes('INSERT INTO menu_items') && text.includes('RETURNING')) {
            const categoryId = params?.[0] as number;
            const name = params?.[1] as string;
            const price_thb = params?.[2] as number;
            const imageUrl = (params?.[3] as string) || null;
            const id = nextItemId++;
            (mockMenuStore as Record<number, { name: string; price_thb: number; imageUrl: string | null; category_id: number }>)[id] = {
                name: name || 'New Item', price_thb: price_thb ?? 0, imageUrl, category_id: categoryId,
            };
            MOCK_MENU_ITEMS.push({ id, price_thb: price_thb ?? 0 });
            return { rows: [{ id, name: name || 'New Item', priceTHB: price_thb ?? 0, imageUrl }] };
        }
        if (text.includes('UPDATE menu_items') && text.includes('RETURNING')) {
            const p = params ?? [];
            const id = p[p.length - 1] as number;
            const store = mockMenuStore[id];
            if (!store) return { rows: [] };
            const nameIdx = text.match(/name = \$(\d+)/)?.[1];
            const priceIdx = text.match(/price_thb = \$(\d+)/)?.[1];
            const imageIdx = text.match(/image_url = \$(\d+)/)?.[1];
            if (nameIdx) store.name = p[parseInt(nameIdx, 10) - 1] as string;
            if (priceIdx) {
                store.price_thb = p[parseInt(priceIdx, 10) - 1] as number;
                const m = MOCK_MENU_ITEMS.find((x) => x.id === id);
                if (m) m.price_thb = store.price_thb;
            }
            if (imageIdx) store.imageUrl = p[parseInt(imageIdx, 10) - 1] as string | null;
            return { rows: [{ id, name: store.name, priceTHB: store.price_thb, imageUrl: store.imageUrl }] };
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
