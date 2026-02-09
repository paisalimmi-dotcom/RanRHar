export type CartItem = {
    id: string;
    name: string;
    priceTHB: number;
    quantity: number;
    modifierIds?: string[]; // Selected modifier IDs
};

export type CartState = {
    items: CartItem[];
};

export type CartContextType = {
    items: CartItem[];
    addToCart: (item: { id: string; name: string; priceTHB: number; modifierIds?: string[] }) => void;
    updateItemModifiers: (itemId: string, modifierIds: string[]) => void;
    decreaseQuantity: (itemId: string) => void;
    removeItem: (itemId: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    isInitialized: boolean;
};
