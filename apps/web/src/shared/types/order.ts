// Order types - snapshot of cart at time of order placement
// Orders are stored independently and not linked to cart state

export type OrderItem = {
    id: string;
    name: string;
    priceTHB: number;
    quantity: number;
};

export type OrderStatus = 'PENDING';

export type Order = {
    id: string;
    items: OrderItem[];
    subtotal: number;
    total: number;
    status: OrderStatus;
    createdAt: string; // ISO timestamp
};
