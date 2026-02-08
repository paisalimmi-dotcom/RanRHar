export const mockPool = {
    query: async (text: string, params?: unknown[]) => {
        console.log('🏗️ [MOCK DB] Executing:', text);
        if (text.includes('SELECT 1') || text.includes('SELECT NOW()')) return { rows: [{ now: new Date() }] };
        if (text.includes("guest@system") && text.includes('id')) return { rows: [{ id: 0 }] };
        if (text.includes('SELECT') && text.includes('users') && text.includes('email')) {
            return { rows: [{ id: 1, email: 'owner@test.com', password_hash: '$2a$10$SJexab18MV21UVdfePJQ5.IrHsArLxcOTFJ.IRaFb6MzdlMAWrs8u', role: 'owner' }] };
        }
        if (text.includes('INSERT INTO orders')) return { rows: [{ id: Math.floor(Math.random() * 1000) }] };
        if (text.includes('orders')) return { rows: [] };
        return { rows: [] };
    },
    connect: async () => ({
        query: async (text: string, params?: unknown[]) => {
            if (text.includes('SELECT 1') || text.includes('SELECT NOW()')) return { rows: [{ now: new Date() }] };
            if (text.includes("guest@system")) return { rows: [{ id: 0 }] };
            if (text.includes('INSERT INTO orders')) return { rows: [{ id: Math.floor(Math.random() * 1000) }] };
            return { rows: [] };
        },
        release: () => { },
    }),
    on: () => { },
    end: async () => { },
};
