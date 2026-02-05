import { Menu, RestaurantInfo } from '../types';

// TODO: Replace with actual Supabase client from packages/shared or local config
// const supabase = createClient(...)

export const menuService = {
    getMenuByTableCode: async (tableCode: string): Promise<{ restaurant: RestaurantInfo; menu: Menu }> => {
        // TODO: Implement Supabase query to fetch menu based on tableCode
        // Logic:
        // 1. Query 'tables' table by code -> get table_id, branch_id
        // 2. Query 'branches' by branch_id -> get restaurant info
        // 3. Query 'menus' by branch_id (active menu) -> get menu items

        console.log(`[Mock] Fetching menu for tableCode: ${tableCode}`);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock data for scaffold
        return {
            restaurant: {
                id: 'res-mock-001',
                name: 'RanRHar Eats (Demo)',
                branchName: 'Downtown Branch',
            },
            menu: {
                id: 'menu-mock-001',
                name: 'All Day Dining',
                items: [
                    { id: 'item-1', name: 'Signature Burger', price: 15.99, description: 'Best burger in town.' },
                    { id: 'item-2', name: 'Caesar Salad', price: 12.50, description: 'Fresh romaine with parmesan.' },
                ],
            },
        };
    },
};
