// Payment types for frontend
// Feature-08: Payment Integration

export type PaymentMethod = 'CASH' | 'QR';
export type PaymentStatus = 'PAID' | 'REFUNDED';

export type Payment = {
    id: string;
    orderId: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    paidAt: string; // ISO timestamp
    createdBy: number | {
        id: number;
        email: string;
        role: string;
    };
    notes?: string;
};
