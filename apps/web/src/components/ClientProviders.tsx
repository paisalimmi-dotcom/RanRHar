'use client';

import { CartProvider } from '@/features/cart/CartProvider';
import { ThemeProvider, ThemePicker } from '@/features/theme';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { LanguageAwareLayout } from './LanguageAwareLayout';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider>
            <LanguageAwareLayout>
                <ThemeProvider>
                    <CartProvider>
                        {children}
                        <ThemePicker />
                    </CartProvider>
                </ThemeProvider>
            </LanguageAwareLayout>
        </I18nProvider>
    );
}
