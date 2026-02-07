// Payment API Adapter
// Feature-08: Payment Integration

import { apiClient } from '@/lib/api-client';
import type { Payment, PaymentMethod } from '@/shared/types/payment';

interface RecordPaymentRequest {
    amount: number;
    method: PaymentMethod;
    notes?: string;
}

interface RecordPaymentResponse {
    id: string;
    orderId: string;
    amount: number;
    method: PaymentMethod;
    status: 'PAID' | 'REFUNDED';
    paidAt: string;
    createdBy: number;
    notes?: string;
}

interface GetPaymentResponse {
    id: string;
    orderId: string;
    amount: number;
    method: PaymentMethod;
    status: 'PAID' | 'REFUNDED';
    paidAt: string;
    createdBy: {
        id: number;
        email: string;
        role: string;
    };
    notes?: string;
}

export const paymentApi = {
    /**
     * Record payment for an order
     * Requires authentication (staff or cashier role)
     */
    async recordPayment(
        orderId: string,
        amount: number,
        method: PaymentMethod,
        notes?: string
    ): Promise<Payment> {
        const response = await apiClient.post<RecordPaymentResponse>(
            `/orders/${orderId}/payment`,
            { amount, method, notes } as RecordPaymentRequest,
            true // Auth required
        );

        return {
            id: response.id,
            orderId: response.orderId,
            amount: response.amount,
            method: response.method,
            status: response.status,
            paidAt: response.paidAt,
            createdBy: response.createdBy,
            notes: response.notes,
        };
    },

    /**
     * Get payment details for an order
     * Requires authentication (owner, staff, or cashier role)
     */
    async getPayment(orderId: string): Promise<Payment | null> {
        try {
            const response = await apiClient.get<GetPaymentResponse>(
                `/orders/${orderId}/payment`,
                true // Auth required
            );

            return {
                id: response.id,
                orderId: response.orderId,
                amount: response.amount,
                method: response.method,
                status: response.status,
                paidAt: response.paidAt,
                createdBy: response.createdBy,
                notes: response.notes,
            };
        } catch (error: unknown) {
            // Return null if payment not found (404)
            if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
                return null;
            }
            throw error;
        }
    },
};
