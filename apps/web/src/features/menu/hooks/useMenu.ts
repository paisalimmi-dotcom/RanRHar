import { useEffect, useState } from "react";
import { menuService } from "../services/menu.service";
import type { MenuCategory, RestaurantInfo } from "../types";

export function useMenu(tableCode: string, lang: 'th' | 'en' = 'th') {
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
    const [categories, setCategories] = useState<MenuCategory[]>([]);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                const res = await menuService.getMenuForTable(tableCode, lang);
                if (!alive) return;
                setRestaurant(res.restaurant);
                setCategories(res.categories);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [tableCode, lang]);

    return { loading, restaurant, categories };
}
