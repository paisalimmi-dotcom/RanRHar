'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Language = 'th' | 'en';

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'ranrhar_language';

// Lazy load translations
let thTranslations: Record<string, any> | null = null;
let enTranslations: Record<string, any> | null = null;

async function loadTranslations(lang: Language): Promise<Record<string, any>> {
    if (lang === 'th' && thTranslations) return thTranslations;
    if (lang === 'en' && enTranslations) return enTranslations;

    const translations = await import(`./translations/${lang}.json`);
    
    if (lang === 'th') thTranslations = translations.default;
    if (lang === 'en') enTranslations = translations.default;
    
    return translations.default;
}

function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
    const value = path.split('.').reduce((current: any, key: string) => current?.[key], obj);
    return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('th');
    const [translations, setTranslations] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load saved language preference
        const savedLang = (typeof window !== 'undefined' 
            ? localStorage.getItem(LANGUAGE_STORAGE_KEY) 
            : null) as Language | null;
        
        const initialLang = savedLang && (savedLang === 'th' || savedLang === 'en') ? savedLang : 'th';
        setLanguageState(initialLang);

        // Load translations
        loadTranslations(initialLang).then((trans) => {
            setTranslations(trans);
            setLoading(false);
        });
    }, []);

    // Reload translations when language changes (but not on initial load)
    useEffect(() => {
        if (!loading) {
            loadTranslations(language).then((trans) => {
                setTranslations(trans);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        }
    };

    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        const value = getNestedValue(translations, key);
        if (!value) {
            console.warn(`Translation key not found: ${key}`);
            return key;
        }
        return interpolate(String(value), params);
    }, [translations]);

    if (loading) {
        return <>{children}</>; // Render children while loading
    }

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        // Fallback for SSR or when provider is not available
        return {
            language: 'th' as Language,
            setLanguage: () => {},
            t: (key: string, params?: Record<string, string | number>) => key,
        };
    }
    return context;
}
