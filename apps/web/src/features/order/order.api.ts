// Order API Adapter
// Replaces localStorage persistence with backend API calls

import { apiClient } from '@/lib/api-client';
import type { Order, OrderItem } from '@/shared/types/order';

interface CreateOrderRequest {
    items: OrderItem[];
    total: number;
}

interface CreateOrderResponse {
    id: string;
    items: OrderItem[];
    subtotal: number;
    total: number;
    status: 'PENDING';
    createdAt: string;
    createdBy: number;
}

interface GetOrdersResponse {
    orders: Array<Order & {
        createdBy: {
            id: number;
            email: string;
            role: string;
        };
    }>;
}

export const orderApi = {
    /**
     * Create a new order via API
     * Requires authentication (staff or cashier role)
     */
    async createOrder(items: OrderItem[], total: number): Promise<Order> {
        const response = await apiClient.post<CreateOrderResponse>(
            '/orders',
            { items, total } as CreateOrderRequest,
            true // Auth required
        );

        // Transform API response to Order type
        return {
            id: response.id,
            items: response.items,
            subtotal: response.subtotal,
            total: response.total,
            status: response.status,
            createdAt: response.createdAt,
        };
    },

    /**
     * Get all orders from API
     * Requires authentication (owner or staff role)
     */
    async getOrders(): Promise<Order[]> {
        const response = await apiClient.get<GetOrdersResponse>(
            '/orders',
            true // Auth required
        );

        // Transform API response to Order[] type
        return response.orders.map(order => ({
            id: order.id,
            items: order.items,
            subtotal: order.subtotal,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt,
        }));
    },
};
