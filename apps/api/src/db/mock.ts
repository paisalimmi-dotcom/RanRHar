export const mockPool = {
    query: async (text: string, params?: any[]) => {
        console.log('🏗️ [MOCK DB] Executing:', text);
        // Simple mocks for basic queries
        if (text.includes('SELECT NOW()')) return { rows: [{ now: new Date() }] };
        if (text.includes('SELECT * FROM users')) {
            return { rows: [{ id: 1, email: 'owner@test.com', password_hash: '$2a$10$rZ5qH8qVqJ5qH8qVqJ5qHOqH8qVqJ5qH8qVqJ5qH8qVqJ5qH8qVqJ', role: 'owner' }] };
        }
        if (text.includes('INSERT INTO orders')) {
            return { rows: [{ id: Math.floor(Math.random() * 1000) }] };
        }
        if (text.includes('SELECT * FROM orders')) {
            return { rows: [] };
        }
        return { rows: [] };
    },
    connect: async () => ({
        query: async (text: string, params?: any[]) => {
            // Re-use the main query logic for consistency
            if (text.includes('SELECT NOW()')) return { rows: [{ now: new Date() }] };
            if (text.includes('SELECT * FROM users')) {
                return { rows: [{ id: 1, email: 'owner@test.com', password_hash: '$2a$10$rZ5qH8qVqJ5qH8qVqJ5qHOqH8qVqJ5qH8qVqJ5qH8qVqJ5qH8qVqJ', role: 'owner' }] };
            }
            if (text.includes('INSERT INTO orders')) {
                return { rows: [{ id: Math.floor(Math.random() * 1000) }] };
            }
            if (text.includes('SELECT * FROM orders')) {
                return { rows: [] };
            }
            return { rows: [] };
        },
        release: () => { },
    }),
    on: () => { },
    end: async () => { },
};
