'use client';

import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { AuthGuard } from '@/features/auth';
import { StaffNav } from '@/features/auth/components/StaffNav';
import { orderApi } from '@/features/order/order.api';
import type { Order, OrderStatus } from '@/shared/types/order';
import { useEffect, useState } from 'react';

const STATUS_LABELS: Record<OrderStatus, string> = {
    PENDING: 'รอทำ',
    CONFIRMED: 'กำลังทำ',
    COMPLETED: 'เสร็จแล้ว',
    CANCELLED: 'ยกเลิก',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: 'bg-amber-50 border-amber-300',
    CONFIRMED: 'bg-blue-50 border-blue-300',
    COMPLETED: 'bg-green-50 border-green-300',
    CANCELLED: 'bg-gray-50 border-gray-300',
};

function KDSContent() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    async function loadOrders() {
        try {
            const data = await orderApi.getOrders();
            // Filter out cancelled orders from KDS
            setOrders(data.filter(o => o.status !== 'CANCELLED'));
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
        try {
            setUpdatingOrderId(orderId);
            setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
            );
            await orderApi.updateOrderStatus(orderId, newStatus);
        } catch {
            await loadOrders();
        } finally {
            setUpdatingOrderId(null);
        }
    }

    const columns: OrderStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED'];

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">KDS — Kitchen Display</h1>
                <div className="flex gap-4 items-center">
                    <StaffNav dark />
                    <span className="text-sm text-gray-400">
                        อัปเดตอัตโนมัติทุก 30 วินาที
                    </span>
                    <button
                        onClick={loadOrders}
                        disabled={loading}
                        className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600 disabled:opacity-50"
                    >
                        {loading ? '...' : 'Refresh'}
                    </button>
                </div>
            </header>

            {loading && orders.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {columns.map((status) => (
                        <div
                            key={status}
                            className={`rounded-xl border-2 p-4 min-h-[400px] ${STATUS_COLORS[status]} text-gray-900`}
                        >
                            <h2 className="text-lg font-bold mb-4">{STATUS_LABELS[status]}</h2>
                            <TableSkeleton rows={4} />
                        </div>
                    ))}
                </div>
            ) : !loading && orders.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-lg">ยังไม่มีออเดอร์รอทำ</p>
                    <p className="text-sm mt-2">ออเดอร์จะแสดงเมื่อลูกค้าสั่งอาหาร</p>
                </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {columns.map((status) => {
                    const columnOrders = orders.filter((o) => o.status === status);
                    return (
                        <div
                            key={status}
                            className={`rounded-xl border-2 p-4 min-h-[400px] ${STATUS_COLORS[status]} text-gray-900`}
                        >
                            <h2 className="text-lg font-bold mb-4 flex justify-between">
                                <span>{STATUS_LABELS[status]}</span>
                                <span className="bg-black/10 px-2 rounded">
                                    {columnOrders.length}
                                </span>
                            </h2>
                            <div className="space-y-3">
                                {columnOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="bg-white rounded-lg p-4 shadow border"
                                    >
                                        <div className="font-bold text-sm mb-2 flex justify-between items-center">
                                            <span>ออเดอร์ #{order.id}</span>
                                            {order.tableCode && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                                    โต๊ะ {order.tableCode}
                                                </span>
                                            )}
                                        </div>
                                        <ul className="text-sm space-y-1 mb-3">
                                            {order.items.map((item, i) => (
                                                <li key={i}>
                                                    {item.name} × {item.quantity}
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="text-xs text-gray-500 mb-2">
                                            ฿{order.total.toFixed(2)}
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {status === 'PENDING' && (
                                                <button
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            order.id,
                                                            'CONFIRMED'
                                                        )
                                                    }
                                                    disabled={
                                                        updatingOrderId === order.id
                                                    }
                                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    รับออเดอร์
                                                </button>
                                            )}
                                            {status === 'CONFIRMED' && (
                                                <button
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            order.id,
                                                            'COMPLETED'
                                                        )
                                                    }
                                                    disabled={
                                                        updatingOrderId === order.id
                                                    }
                                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    เสร็จแล้ว
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            )}
        </div>
    );
}

export default function KDSPage() {
    return (
        <AuthGuard allowedRoles={['manager', 'staff', 'chef']}>
            <KDSContent />
        </AuthGuard>
    );
}
