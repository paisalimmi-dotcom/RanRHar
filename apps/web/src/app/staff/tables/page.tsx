'use client';

import { AuthGuard } from '@/features/auth';
import { orderApi } from '@/features/order/order.api';
import type { Order } from '@/shared/types/order';
import { useEffect, useState } from 'react';
import Link from 'next/link';

function TablesContent() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 15000); // Refresh every 15s
        return () => clearInterval(interval);
    }, []);

    async function loadOrders() {
        try {
            const data = await orderApi.getOrders();
            setOrders(data);
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    }

    const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED');
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
    const paidOrders = orders.filter((o) => o.payment?.status === 'PAID');

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">สรุปโต๊ะ — พนักงานเสิร์ฟ</h1>
                <div className="flex gap-2">
                    <Link
                        href="/staff"
                        className="px-3 py-1 text-sm text-gray-600 hover:underline"
                    >
                        ← Staff
                    </Link>
                    <button
                        onClick={loadOrders}
                        disabled={loading}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? '...' : 'Refresh'}
                    </button>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                <section className="bg-white rounded-xl p-6 shadow">
                    <h2 className="text-lg font-semibold mb-4 text-amber-700">
                        รออาหาร ({pendingOrders.length})
                    </h2>
                    <div className="space-y-3">
                        {pendingOrders.length === 0 ? (
                            <p className="text-gray-500 text-sm">ไม่มีออเดอร์รอ</p>
                        ) : (
                            pendingOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className={`p-4 rounded-lg border cursor-pointer transition ${
                                        selectedOrderId === order.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() =>
                                        setSelectedOrderId(
                                            selectedOrderId === order.id
                                                ? null
                                                : order.id
                                        )
                                    }
                                >
                                    <div className="font-semibold">ออเดอร์ #{order.id}</div>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded ${
                                            order.status === 'PENDING'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}
                                    >
                                        {order.status === 'PENDING' ? 'รอทำ' : 'กำลังทำ'}
                                    </span>
                                    <ul className="mt-2 text-sm text-gray-600">
                                        {order.items.map((item, i) => (
                                            <li key={i}>
                                                {item.name} × {item.quantity}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="text-sm font-medium mt-1">
                                        ฿{order.total.toFixed(2)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="bg-white rounded-xl p-6 shadow">
                    <h2 className="text-lg font-semibold mb-4 text-green-700">
                        เสร็จแล้ว / จ่ายแล้ว ({completedOrders.length})
                    </h2>
                    <div className="space-y-3">
                        {completedOrders.length === 0 ? (
                            <p className="text-gray-500 text-sm">ไม่มี</p>
                        ) : (
                            completedOrders.slice(0, 10).map((order) => (
                                <div
                                    key={order.id}
                                    className="p-4 rounded-lg border border-gray-200"
                                >
                                    <div className="font-semibold">ออเดอร์ #{order.id}</div>
                                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
                                        {order.payment ? '✓ จ่ายแล้ว' : 'เสร็จแล้ว'}
                                    </span>
                                    <div className="text-sm mt-1">
                                        ฿{order.total.toFixed(2)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            <div className="mt-6 text-sm text-gray-500">
                ออเดอร์ทั้งหมด: {orders.length} | จ่ายแล้ว: {paidOrders.length}
            </div>
        </div>
    );
}

export default function TablesPage() {
    return (
        <AuthGuard allowedRoles={['owner', 'staff', 'cashier']}>
            <TablesContent />
        </AuthGuard>
    );
}
