import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

export default function OrdersLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b px-4 py-3">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            </header>
            <div className="max-w-6xl mx-auto p-8">
                <div className="mb-6 flex justify-between">
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="bg-white rounded-lg shadow-md p-8">
                    <TableSkeleton rows={6} />
                </div>
            </div>
        </div>
    );
}
