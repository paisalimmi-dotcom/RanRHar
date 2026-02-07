'use client';

import { CartProvider } from '@/features/cart/CartProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <CartProvider>
            {children}
        </CartProvider>
    );
}
