'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';
import { useEffect } from 'react';

export function LanguageAwareLayout({ children }: { children: React.ReactNode }) {
    const { language } = useI18n();

    useEffect(() => {
        // Update html lang attribute
        document.documentElement.lang = language;
    }, [language]);

    return <>{children}</>;
}
