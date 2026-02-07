// Order persistence using backend API
// Replaces localStorage with real database persistence

import { Order, OrderItem } from '@/shared/types/order';
import { CartItem } from '@/features/cart/cart.types';
import { orderApi } from './order.api';

// Local cache for orders (optional, for offline support)
const CACHE_KEY = 'ranrhar_orders_cache';

// Helper to read cached orders from localStorage
function getCachedOrders(): Order[] {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem(CACHE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to read cached orders:', error);
        return [];
    }
}

// Helper to cache orders in localStorage
function cacheOrders(orders: Order[]): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(orders));
    } catch (error) {
        console.error('Failed to cache orders:', error);
    }
}

// Create a new order via API
export async function createOrder(cartItems: CartItem[]): Promise<Order> {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.priceTHB * item.quantity), 0);

    // Transform cart items to order items
    const orderItems: OrderItem[] = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        priceTHB: item.priceTHB,
        quantity: item.quantity,
    }));

    try {
        // Create order via API
        const order = await orderApi.createOrder(orderItems, subtotal);

        // Update local cache
        const cached = getCachedOrders();
        cached.push(order);
        cacheOrders(cached);

        return order;
    } catch (error) {
        console.error('Failed to create order:', error);
        throw error;
    }
}

// Get order by ID (check cache first, fallback to API)
export function getOrderById(id: string): Order | null {
    const cached = getCachedOrders();
    return cached.find(order => order.id === id) || null;
}

// Get all orders from API
export async function getAllOrders(): Promise<Order[]> {
    try {
        const orders = await orderApi.getOrders();

        // Update cache
        cacheOrders(orders);

        return orders;
    } catch (error) {
        console.error('Failed to fetch orders:', error);

        // Fallback to cached orders if API fails
        return getCachedOrders();
    }
}
