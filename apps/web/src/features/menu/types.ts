export type RestaurantInfo = {
    name: string;
    branchName: string;
    tableCode: string;
};

export type MenuItem = {
    id: string;
    name: string;
    priceTHB: number;
    imageUrl?: string;
};

export type MenuCategory = {
    id: string;
    name: string;
    items: MenuItem[];
};
