/**
 * Skeleton สำหรับหน้าเมนู — แสดงขณะโหลด
 */
export function MenuSkeleton() {
    return (
        <div className="min-h-screen pb-24 bg-gray-50 animate-pulse">
            <header className="sticky top-0 z-20 bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="h-8 w-32 bg-gray-200 rounded mb-3" />
                    <div className="h-4 w-64 bg-gray-100 rounded mb-3" />
                    <div className="h-10 w-full bg-gray-100 rounded-xl" />
                </div>
            </header>
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                            <div className="w-full aspect-[4/3] bg-gray-200" />
                            <div className="p-4">
                                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                                <div className="flex justify-between">
                                    <div className="h-5 w-16 bg-gray-200 rounded" />
                                    <div className="h-8 w-16 bg-gray-200 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
