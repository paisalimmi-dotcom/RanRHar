'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Error Boundary — จับ error ที่เกิดขึ้นในแอป แสดง fallback UI แทน crash
 * Olympic Standard: User ไม่เห็น blank screen หรือ crash
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
            // Log to external service in production
            console.error('App error:', error.message);
        }
    }, [error]);

    return (
        <div
            className="min-h-[60vh] flex flex-col items-center justify-center p-6"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
        >
            <div className="max-w-md w-full text-center">
                <div className="mb-6">
                    <svg
                        className="mx-auto h-16 w-16 text-amber-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold font-display mb-2">เกิดข้อผิดพลาด</h1>
                <p className="text-[var(--text-muted)] mb-6">
                    ขออภัย เกิดปัญหาชั่วคราว กรุณาลองใหม่อีกครั้ง
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 rounded-lg font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--accent)',
                            color: '#1a1a1a',
                        }}
                    >
                        ลองอีกครั้ง
                    </button>
                    <Link
                        href="/menu/A12"
                        className="px-6 py-3 rounded-lg font-medium border transition-colors"
                        style={{
                            borderColor: 'var(--border)',
                            color: 'var(--text)',
                        }}
                    >
                        กลับไปเมนู
                    </Link>
                </div>
            </div>
        </div>
    );
}
