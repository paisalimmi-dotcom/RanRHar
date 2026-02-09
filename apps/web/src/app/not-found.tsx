import Link from 'next/link';

/**
 * 404 Not Found — หน้าเป็นมิตร พร้อมลิงก์กลับ
 * Olympic Standard: User ไม่สับสนเมื่อพิมพ์ URL ผิด
 */
export default function NotFound() {
    return (
        <div
            className="min-h-[80vh] flex flex-col items-center justify-center p-6"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
        >
            <div className="max-w-md w-full text-center">
                <p className="text-6xl font-display font-bold mb-2" style={{ color: 'var(--accent)' }}>
                    404
                </p>
                <h1 className="text-2xl font-bold font-display mb-2">ไม่พบหน้านี้</h1>
                <p className="text-[var(--text-muted)] mb-8">
                    หน้าที่คุณค้นหาอาจถูกลบหรือย้ายไปแล้ว
                </p>
                <Link
                    href="/menu/A12"
                    className="inline-block px-6 py-3 rounded-lg font-medium transition-colors"
                    style={{
                        backgroundColor: 'var(--accent)',
                        color: '#1a1a1a',
                    }}
                >
                    กลับไปเมนู
                </Link>
            </div>
        </div>
    );
}
