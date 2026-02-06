export type CartItem = {
    id: string;
    name: string;
    priceTHB: number;
    quantity: number;
};

export type CartState = {
    items: CartItem[];
};

export type CartContextType = {
    items: CartItem[];
    addToCart: (item: { id: string; name: string; priceTHB: number }) => void;
    decreaseQuantity: (itemId: string) => void;
    removeItem: (itemId: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
};
