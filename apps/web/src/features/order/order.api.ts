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
    tableCode?: string | null;
}

interface GetOrdersResponse {
    orders: Array<Order & {
        createdBy: {
            id: number;
            email: string;
            role: string;
        };
        payment?: { id: string; amount: number; method: string; status: string } | null;
    }>;
}

export const orderApi = {
    /**
     * Create order as guest (customer flow) - no auth required
     */
    async createGuestOrder(items: OrderItem[], total: number, tableCode?: string): Promise<Order> {
        const response = await apiClient.post<CreateOrderResponse & { tableCode?: string }>(
            '/orders/guest',
            { items, total, tableCode } as CreateOrderRequest & { tableCode?: string },
            false // No auth
        );
        return {
            id: response.id,
            items: response.items,
            subtotal: response.subtotal,
            total: response.total,
            status: response.status,
            createdAt: response.createdAt,
            tableCode: response.tableCode || null,
        };
    },

    /**
     * Create a new order via API (staff/cashier)
     * Requires authentication
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
            tableCode: response.tableCode || null,
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

        // Transform API response to Order[] type (payment included from JOIN)
        return response.orders.map(order => ({
            id: order.id,
            items: order.items,
            subtotal: order.subtotal,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt,
            tableCode: order.tableCode || null,
            payment: order.payment ?? null,
        }));
    },

    /**
     * Update order status via API
     * Requires authentication (owner or staff role)
     */
    async updateOrderStatus(orderId: string, status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'): Promise<Order> {
        const response = await apiClient.patch<CreateOrderResponse>(
            `/orders/${orderId}/status`,
            { status },
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
            tableCode: response.tableCode || null,
        };
    },

    /**
     * Cancel order with reason (manager only, for special cases)
     * Requires authentication (manager role)
     */
    async cancelOrder(orderId: string, reason?: string, refundRequired?: boolean): Promise<Order> {
        const response = await apiClient.post<CreateOrderResponse & {
            cancelledAt?: string | null;
            cancelReason?: string | null;
            refundRequired?: boolean;
        }>(
            `/orders/${orderId}/cancel`,
            { reason, refundRequired },
            true // Auth required
        );

        return {
            id: response.id,
            items: response.items,
            subtotal: response.subtotal,
            total: response.total,
            status: response.status,
            createdAt: response.createdAt,
            tableCode: response.tableCode || null,
        };
    },

    /**
     * Get order by ID (for customer order status page)
     * No auth required for guest orders
     */
    async getOrderById(orderId: string, tableCode?: string): Promise<Order | null> {
        try {
            // Try authenticated endpoint first (for staff)
            const response = await apiClient.get<Order>(
                `/orders/${orderId}`,
                true // Try with auth
            );
            return response;
        } catch {
            // If auth fails, might be guest order - would need public endpoint
            // For now, return null if not found
            return null;
        }
    },
};
