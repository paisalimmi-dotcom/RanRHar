'use client';

/**
 * Loading fallback — แสดงขณะโหลด แทน blank screen
 * Olympic Standard: User เห็น feedback ทันที ไม่สับสน
 */
export function LoadingFallback() {
    return (
        <div
            className="min-h-[40vh] flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }}
        >
            <div className="flex flex-col items-center gap-3">
                <div
                    className="w-8 h-8 rounded-full border-2 border-current border-t-transparent animate-spin"
                    aria-hidden
                />
                <span className="text-sm">กำลังโหลด...</span>
            </div>
        </div>
    );
}
