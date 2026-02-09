export type RestaurantInfo = {
    name: string;
    branchName: string;
    tableCode: string;
};

export type MenuModifier = {
    id: string;
    name: string;
    priceDelta: number; // Price change (+10, -5, 0)
};

export type MenuItem = {
    id: string;
    name: string;
    priceTHB: number;
    imageUrl?: string;
    modifiers?: MenuModifier[]; // Optional modifiers for this item
};

export type MenuCategory = {
    id: string;
    name: string;
    items: MenuItem[];
};
