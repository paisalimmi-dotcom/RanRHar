'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

export const PRESET_COLORS = [
    { name: 'ทอง', value: '#d4af37' },
    { name: 'ฟ้า', value: '#0ea5e9' },
    { name: 'เขียว', value: '#10b981' },
    { name: 'ชมพู', value: '#ec4899' },
    { name: 'ม่วง', value: '#8b5cf6' },
    { name: 'ส้ม', value: '#f97316' },
] as const;

type ThemeContextType = {
    accentColor: string;
    mode: ThemeMode;
    setAccentColor: (color: string) => void;
    setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'ranrhar-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [accentColor, setAccentState] = useState('#d4af37');
    const [mode, setModeState] = useState<ThemeMode>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const { accent, mode: m } = JSON.parse(stored);
                if (accent) setAccentState(accent);
                if (m === 'light' || m === 'dark') setModeState(m);
            }
        } catch {
            // ignore
        }
        setMounted(true);
    }, []);

    const setAccentColor = (color: string) => {
        setAccentState(color);
        if (typeof window !== 'undefined') {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, accent: color }));
        }
    };

    const setMode = (m: ThemeMode) => {
        setModeState(m);
        if (typeof window !== 'undefined') {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, mode: m }));
        }
    };

    useEffect(() => {
        if (!mounted) return;
        const root = document.documentElement;
        root.style.setProperty('--accent', accentColor);
        root.style.setProperty('--accent-muted', accentColor + '40');
        root.style.setProperty('--accent-subtle', accentColor + '15');
        root.dataset.theme = mode;
    }, [accentColor, mode, mounted]);

    return (
        <ThemeContext.Provider value={{ accentColor, mode, setAccentColor, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
