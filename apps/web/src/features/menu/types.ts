export interface Menu {
    id: string;
    name: string;
    items: MenuItem[];
}

export interface MenuItem {
    id: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
}

export interface RestaurantInfo {
    id: string;
    name: string;
    branchName: string;
}

export interface MenuState {
    isLoading: boolean;
    error: string | null;
    restaurant: RestaurantInfo | null;
    menu: Menu | null;
}
