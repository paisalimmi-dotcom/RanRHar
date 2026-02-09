import { apiClient } from '@/lib/api-client';
import type { MenuCategory, RestaurantInfo } from '../types';

type MenuResponse = {
    restaurant: RestaurantInfo;
    categories: MenuCategory[];
};

type MenuApiResponse = {
    restaurant?: { name?: string; branchName?: string };
    categories?: MenuCategory[];
};

const MOCK_MENU: MenuResponse = {
    restaurant: { name: "RanRHar (Mock)", branchName: "สาขา 001 (Mock)", tableCode: "" },
    categories: [
        { id: "cat-1", name: "แนะนำ", items: [
            { id: "m-1", name: "ผัดไทย", priceTHB: 199, imageUrl: "https://picsum.photos/seed/padthai/400/300" },
            { id: "m-2", name: "ต้มยำกุ้ง", priceTHB: 249, imageUrl: "https://picsum.photos/seed/tomyum/400/300" },
            { id: "m-3", name: "แกงเขียวหวาน", priceTHB: 189, imageUrl: "https://picsum.photos/seed/greencurry/400/300" },
        ]},
        { id: "cat-2", name: "อาหารจานหลัก", items: [
            { id: "m-4", name: "ไก่ย่าง", priceTHB: 159, imageUrl: "https://picsum.photos/seed/chicken/400/300" },
            { id: "m-5", name: "ข้าวผัด", priceTHB: 89, imageUrl: "https://picsum.photos/seed/friedrice/400/300" },
            { id: "m-6", name: "ผัดผัก", priceTHB: 79, imageUrl: "https://picsum.photos/seed/veggies/400/300" },
        ]},
        { id: "cat-3", name: "เครื่องดื่ม", items: [
            { id: "m-7", name: "ชาเย็น", priceTHB: 45, imageUrl: "https://picsum.photos/seed/thaitea/400/300" },
            { id: "m-8", name: "มะพร้าวอ่อน", priceTHB: 55, imageUrl: "https://picsum.photos/seed/coconut/400/300" },
            { id: "m-9", name: "สมูทตี้มะม่วง", priceTHB: 65, imageUrl: "https://picsum.photos/seed/mango/400/300" },
        ]},
    ],
};

export const menuService = {
    async getMenuForTable(tableCode: string): Promise<MenuResponse> {
        try {
            const data = await apiClient.get<MenuApiResponse>(
                `/menu?tableCode=${encodeURIComponent(tableCode)}`,
                false
            );
            return {
                restaurant: {
                    name: data.restaurant?.name ?? 'RanRHar',
                    branchName: data.restaurant?.branchName ?? 'สาขา 001',
                    tableCode,
                },
                categories: data.categories ?? [],
            };
        } catch {
            return { ...MOCK_MENU, restaurant: { ...MOCK_MENU.restaurant, tableCode } };
        }
    },
};
