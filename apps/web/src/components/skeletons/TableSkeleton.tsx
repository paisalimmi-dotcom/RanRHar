/**
 * Skeleton สำหรับตาราง/รายการ — ใช้กับ Orders, KDS
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="animate-pulse space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="h-16 bg-gray-200 rounded-lg"
                    style={{ width: '100%' }}
                />
            ))}
        </div>
    );
}
