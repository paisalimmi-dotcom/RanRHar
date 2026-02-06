// Mock order persistence using localStorage
// TODO: Replace with backend API calls when ready

import { Order, OrderItem } from '@/shared/types/order';
import { CartItem } from '@/features/cart/cart.types';

const STORAGE_KEY = 'ranrhar_orders';

// Helper to read orders from localStorage
function getOrdersFromStorage(): Order[] {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to read orders from localStorage:', error);
        return [];
    }
}

// Helper to write orders to localStorage
function saveOrdersToStorage(orders: Order[]): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
        console.error('Failed to save orders to localStorage:', error);
    }
}

// Create a new order from cart items
export function createOrder(cartItems: CartItem[]): Order {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.priceTHB * item.quantity), 0);

    // Create order snapshot (not linked to cart)
    const order: Order = {
        id: `order_${Date.now()}`,
        items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            priceTHB: item.priceTHB,
            quantity: item.quantity,
        })),
        subtotal,
        total: subtotal, // No tax/fees in mock
        status: 'PENDING',
        createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const orders = getOrdersFromStorage();
    orders.push(order);
    saveOrdersToStorage(orders);

    return order;
}

// Get order by ID
export function getOrderById(id: string): Order | null {
    const orders = getOrdersFromStorage();
    return orders.find(order => order.id === id) || null;
}

// Get all orders (for future use)
export function getAllOrders(): Order[] {
    return getOrdersFromStorage();
}
