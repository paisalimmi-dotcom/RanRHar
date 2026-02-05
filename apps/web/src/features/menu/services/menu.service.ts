import type { MenuCategory, RestaurantInfo } from "../types";

type MenuResponse = {
    restaurant: RestaurantInfo;
    categories: MenuCategory[];
};

export const menuService = {
    async getMenuForTable(tableCode: string): Promise<MenuResponse> {
        // TODO: Replace with Supabase fetch (RLS by restaurant_id/branch_id) later.
        // For now: mock payload to validate routing + client boundary.
        return {
            restaurant: {
                name: "RanRHar (Mock)",
                branchName: "Branch 001 (Mock)",
                tableCode,
            },
            categories: [
                {
                    id: "cat-1",
                    name: "Recommended",
                    items: [
                        { id: "m-1", name: "Signature Dish", priceTHB: 199 },
                        { id: "m-2", name: "Iced Tea", priceTHB: 45 },
                    ],
                },
            ],
        };
    },
};
