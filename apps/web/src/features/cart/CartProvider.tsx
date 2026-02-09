'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { CartContextType, CartItem } from './cart.types';

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ranrhar_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from localStorage on mount
    React.useEffect(() => {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
            try {
                setItems(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse cart items', e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Save to localStorage on change
    React.useEffect(() => {
        if (isInitialized) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        }
    }, [items, isInitialized]);

    const addToCart = useCallback((product: { id: string; name: string; priceTHB: number; modifierIds?: string[] }) => {
        setItems((prev) => {
            // Check if exact same item with same modifiers exists
            const existing = prev.find((i) => 
                i.id === product.id && 
                JSON.stringify(i.modifierIds?.sort()) === JSON.stringify(product.modifierIds?.sort())
            );
            if (existing) {
                return prev.map((i) =>
                    i.id === product.id && JSON.stringify(i.modifierIds?.sort()) === JSON.stringify(product.modifierIds?.sort())
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prev, { ...product, quantity: 1, modifierIds: product.modifierIds || [] }];
        });
    }, []);

    const updateItemModifiers = useCallback((itemId: string, modifierIds: string[]) => {
        setItems((prev) => {
            return prev.map((i) => 
                i.id === itemId ? { ...i, modifierIds } : i
            );
        });
    }, []);

    const decreaseQuantity = useCallback((itemId: string) => {
        setItems((prev) => {
            return prev.map((i) => {
                if (i.id === itemId) {
                    return { ...i, quantity: Math.max(0, i.quantity - 1) };
                }
                return i;
            }).filter((i) => i.quantity > 0);
        });
    }, []);

    const removeItem = useCallback((itemId: string) => {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
    const totalPrice = useMemo(() => items.reduce((sum, i) => sum + (i.priceTHB * i.quantity), 0), [items]);

    const value = useMemo(() => ({
        items,
        addToCart,
        updateItemModifiers,
        decreaseQuantity,
        removeItem,
        clearCart,
        totalItems,
        totalPrice, // Note: This doesn't include modifier prices - will be calculated at checkout
        isInitialized,
    }), [items, addToCart, updateItemModifiers, decreaseQuantity, removeItem, clearCart, totalItems, totalPrice, isInitialized]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCartContext() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCartContext must be used within a CartProvider');
    }
    return context;
}
