'use client';

/**
 * Global Error Boundary — จับ error ใน root layout
 * เมื่อ trigger จะแทนที่ทั้ง layout — ต้องมี html, body
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="th">
            <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', background: '#0f0f0f', color: '#faf8f5' }}>
                <div style={{ maxWidth: '28rem', margin: '0 auto', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>เกิดข้อผิดพลาดร้ายแรง</h1>
                    <p style={{ color: '#a0a0a0', marginBottom: '1.5rem' }}>
                        กรุณารีเฟรชหน้าหรือลองใหม่ในภายหลัง
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#d4af37',
                            color: '#1a1a1a',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        ลองอีกครั้ง
                    </button>
                </div>
            </body>
        </html>
    );
}
