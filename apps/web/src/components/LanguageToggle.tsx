'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function LanguageToggle() {
    const { language, setLanguage } = useI18n();

    return (
        <div
            style={{
                display: 'flex',
                gap: '4px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                padding: '4px',
            }}
        >
            <button
                onClick={() => setLanguage('th')}
                style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: language === 'th' ? '#000' : 'transparent',
                    color: language === 'th' ? '#fff' : '#666',
                    fontSize: '14px',
                    fontWeight: language === 'th' ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
                aria-label="Switch to Thai"
                aria-pressed={language === 'th'}
            >
                ไทย
            </button>
            <button
                onClick={() => setLanguage('en')}
                style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: language === 'en' ? '#000' : 'transparent',
                    color: language === 'en' ? '#fff' : '#666',
                    fontSize: '14px',
                    fontWeight: language === 'en' ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
                aria-label="Switch to English"
                aria-pressed={language === 'en'}
            >
                EN
            </button>
        </div>
    );
}
