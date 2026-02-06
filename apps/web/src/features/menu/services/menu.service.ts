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
                        {
                            id: "m-1",
                            name: "Signature Pad Thai",
                            priceTHB: 199,
                            imageUrl: "https://picsum.photos/seed/padthai/400/300",
                        },
                        {
                            id: "m-2",
                            name: "Tom Yum Goong",
                            priceTHB: 249,
                            imageUrl: "https://picsum.photos/seed/tomyum/400/300",
                        },
                        {
                            id: "m-3",
                            name: "Green Curry",
                            priceTHB: 189,
                            imageUrl: "https://picsum.photos/seed/greencurry/400/300",
                        },
                    ],
                },
                {
                    id: "cat-2",
                    name: "Main Dishes",
                    items: [
                        {
                            id: "m-4",
                            name: "Grilled Chicken",
                            priceTHB: 159,
                            imageUrl: "https://picsum.photos/seed/chicken/400/300",
                        },
                        {
                            id: "m-5",
                            name: "Fried Rice",
                            priceTHB: 89,
                            imageUrl: "https://picsum.photos/seed/friedrice/400/300",
                        },
                        {
                            id: "m-6",
                            name: "Stir-Fried Vegetables",
                            priceTHB: 79,
                            imageUrl: "https://picsum.photos/seed/veggies/400/300",
                        },
                    ],
                },
                {
                    id: "cat-3",
                    name: "Beverages",
                    items: [
                        {
                            id: "m-7",
                            name: "Thai Iced Tea",
                            priceTHB: 45,
                            imageUrl: "https://picsum.photos/seed/thaitea/400/300",
                        },
                        {
                            id: "m-8",
                            name: "Fresh Coconut",
                            priceTHB: 55,
                            imageUrl: "https://picsum.photos/seed/coconut/400/300",
                        },
                        {
                            id: "m-9",
                            name: "Mango Smoothie",
                            priceTHB: 65,
                            imageUrl: "https://picsum.photos/seed/mango/400/300",
                        },
                    ],
                },
            ],
        };
    },
};
