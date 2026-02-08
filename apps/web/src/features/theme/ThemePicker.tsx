'use client';

import { useState } from 'react';
import { useTheme, PRESET_COLORS } from './ThemeContext';

export function ThemePicker() {
    const { accentColor, mode, setAccentColor, setMode } = useTheme();
    const [open, setOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <button
                onClick={() => setOpen(!open)}
                className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-transform hover:scale-110"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                title="ปรับโทนสี"
                aria-label="ปรับโทนสี"
            >
                🎨
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0"
                        onClick={() => setOpen(false)}
                        aria-hidden
                    />
                    <div
                        className="absolute bottom-16 right-0 w-72 p-4 rounded-xl border shadow-xl"
                        style={{
                            backgroundColor: 'var(--bg-card, #161616)',
                            borderColor: 'var(--border, #2a2a2a)',
                        }}
                    >
                        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
                            ปรับโทนสี
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    onClick={() => setAccentColor(c.value)}
                                    className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                                    style={{
                                        backgroundColor: c.value,
                                        borderColor: accentColor === c.value ? '#fff' : 'transparent',
                                    }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMode('dark')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                                    mode === 'dark' ? 'opacity-100' : 'opacity-50'
                                }`}
                                style={{
                                    backgroundColor: mode === 'dark' ? 'var(--accent-subtle)' : 'transparent',
                                    color: 'var(--accent)',
                                }}
                            >
                                โทนมืด
                            </button>
                            <button
                                onClick={() => setMode('light')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                                    mode === 'light' ? 'opacity-100' : 'opacity-50'
                                }`}
                                style={{
                                    backgroundColor: mode === 'light' ? 'var(--accent-subtle)' : 'transparent',
                                    color: 'var(--accent)',
                                }}
                            >
                                โทนสว่าง
                            </button>
                        </div>
                        <input
                            type="color"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="w-full h-8 mt-2 rounded cursor-pointer border-0"
                            title="เลือกสีเอง"
                        />
                        <p className="text-xs mt-2 opacity-60" style={{ color: 'var(--text-muted)' }}>
                            เลือกสีเอง
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
