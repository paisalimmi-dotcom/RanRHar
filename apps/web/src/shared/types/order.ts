// Order types - snapshot of cart at time of order placement
// Orders are stored independently and not linked to cart state

export type OrderItem = {
    id: string;
    name: string;
    priceTHB: number;
    quantity: number;
};

export type OrderStatus = 
    // Legacy statuses
    | 'PENDING' 
    | 'CONFIRMED' 
    | 'COMPLETED' 
    | 'CANCELLED'
    // KDS statuses
    | 'NEW'
    | 'ACCEPTED'
    | 'COOKING'
    | 'READY'
    | 'SERVED';

export type OrderPaymentSummary = {
    id: string;
    amount: number;
    method: string;
    status: string;
    paidAt?: string; // ISO timestamp
};

export type Order = {
    id: string;
    items: OrderItem[];
    subtotal: number;
    total: number;
    status: OrderStatus;
    createdAt: string; // ISO timestamp
    tableCode?: string | null; // เลขโต๊ะ
    payment?: OrderPaymentSummary | null;
};
