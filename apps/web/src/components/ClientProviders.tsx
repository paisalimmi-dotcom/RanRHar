'use client';

import { CartProvider } from '@/features/cart/CartProvider';
import { ThemeProvider, ThemePicker } from '@/features/theme';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <CartProvider>
                {children}
                <ThemePicker />
            </CartProvider>
        </ThemeProvider>
    );
}
