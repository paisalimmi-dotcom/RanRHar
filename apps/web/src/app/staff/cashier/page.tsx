'use client';

import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { AuthGuard } from '@/features/auth';
import { StaffNav } from '@/features/auth/components/StaffNav';
import { orderApi } from '@/features/order/order.api';
import { paymentApi } from '@/features/payment/payment.api';
import { PaymentModal } from '@/features/payment/components/PaymentModal';
import { SplitBillModal } from '@/features/payment/components/SplitBillModal';
import { CombinedBillModal } from '@/features/payment/components/CombinedBillModal';
import { ReceiptModal } from '@/components/ReceiptModal';
import type { Order, OrderStatus } from '@/shared/types/order';
import type { PaymentMethod } from '@/shared/types/payment';
import { useEffect, useState } from 'react';

const STATUS_COLORS: Record<OrderStatus, string> = {
    // Legacy statuses
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
    COMPLETED: 'bg-green-100 text-green-800 border-green-300',
    CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300',
    // KDS statuses
    NEW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-300',
    COOKING: 'bg-orange-100 text-orange-800 border-orange-300',
    READY: 'bg-green-100 text-green-800 border-green-300',
    SERVED: 'bg-gray-100 text-gray-800 border-gray-300',
};

export default function CashierPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentModal, setPaymentModal] = useState<{ orderId: string; total: number } | null>(null);
    const [splitBillModal, setSplitBillModal] = useState<{ orderId: string; total: number } | null>(null);
    const [combinedBillModal, setCombinedBillModal] = useState<boolean>(false);
    const [receiptModal, setReceiptModal] = useState<Order | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('UNPAID');

    useEffect(() => {
        loadOrders();
        // Auto-refresh every 10 seconds for cashier view
        const interval = setInterval(loadOrders, 10000);
        return () => clearInterval(interval);
    }, []);

    async function loadOrders() {
        try {
            setLoading(true);
            setError(null);
            const data = await orderApi.getOrders();
            setOrders(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดออเดอร์ได้');
        } finally {
            setLoading(false);
        }
    }

    async function handlePayment(orderId: string, method: PaymentMethod, notes?: string) {
        const order = orders.find(o => o.id === orderId);
        if (!order) throw new Error('ไม่พบออเดอร์');

        await paymentApi.recordPayment(orderId, order.total, method, notes);
        await loadOrders();
    }

    async function handleSplitPayment(orderId: string, payments: Array<{ amount: number; method: PaymentMethod; payer?: string; notes?: string }>) {
        await paymentApi.splitPayment(orderId, payments);
        await loadOrders();
    }

    async function handleCombinedPayment(orderIds: string[], amount: number, method: PaymentMethod, notes?: string) {
        await paymentApi.combinedPayment(orderIds, amount, method, notes);
        await loadOrders();
    }

    const filteredOrders = orders.filter(order => {
        if (filter === 'UNPAID') return !order.payment;
        if (filter === 'PAID') return !!order.payment;
        return true;
    });

    const unpaidOrders = orders.filter(o => !o.payment);
    const totalUnpaid = unpaidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalPaidToday = orders
        .filter(o => o.payment && new Date(o.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum, o) => sum + (o.payment?.amount || 0), 0);

    return (
        <AuthGuard allowedRoles={['manager', 'staff', 'cashier']}>
            <div className="min-h-screen bg-gray-100 pb-12">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">แคชเชียร์</h1>
                                <p className="text-sm text-gray-600 mt-1">จัดการการชำระเงินและใบเสร็จ</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <StaffNav />
                                <button
                                    onClick={loadOrders}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-600 mb-1">ยอดค้างชำระ</div>
                            <div className="text-2xl font-bold text-orange-600">
                                ฿{totalUnpaid.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {unpaidOrders.length} ออเดอร์
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-600 mb-1">ยอดชำระวันนี้</div>
                            <div className="text-2xl font-bold text-green-600">
                                ฿{totalPaidToday.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {orders.filter(o => o.payment && new Date(o.createdAt).toDateString() === new Date().toDateString()).length} ออเดอร์
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-600 mb-1">ออเดอร์ทั้งหมด</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {orders.length}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                ทั้งหมด
                            </div>
                        </div>
                    </div>

                    {/* Filters and Actions */}
                    <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('ALL')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                ทั้งหมด
                            </button>
                            <button
                                onClick={() => setFilter('UNPAID')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    filter === 'UNPAID' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                ค้างชำระ ({unpaidOrders.length})
                            </button>
                            <button
                                onClick={() => setFilter('PAID')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    filter === 'PAID' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                ชำระแล้ว
                            </button>
                        </div>
                        {filter === 'UNPAID' && unpaidOrders.length >= 2 && (
                            <button
                                onClick={() => setCombinedBillModal(true)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                            >
                                จ่ายรวม ({unpaidOrders.length} ออเดอร์)
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    {loading && filteredOrders.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <TableSkeleton rows={8} />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <p className="text-gray-500 text-lg mb-2">
                                {filter === 'UNPAID' ? 'ไม่มีออเดอร์ค้างชำระ' : filter === 'PAID' ? 'ยังไม่มีออเดอร์ที่ชำระแล้ว' : 'ยังไม่มีออเดอร์'}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                เลขออเดอร์
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                โต๊ะ
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                รายการ
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                รวม
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                สถานะ
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                การชำระเงิน
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                สร้างเมื่อ
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                การจัดการ
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{order.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {order.tableCode ? (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                                                            {order.tableCode}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {order.items.length} รายการ
                                                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                                        {order.items.map(item => `${item.name} (×${item.quantity})`).join(', ')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    ฿{order.total.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status]}`}>
                                                        {order.status === 'NEW' ? 'ใหม่' :
                                                         order.status === 'ACCEPTED' ? 'รับแล้ว' :
                                                         order.status === 'COOKING' ? 'กำลังทำ' :
                                                         order.status === 'READY' ? 'พร้อมเสิร์ฟ' :
                                                         order.status === 'SERVED' ? 'เสิร์ฟแล้ว' :
                                                         order.status === 'PENDING' ? 'รอทำ' :
                                                         order.status === 'CONFIRMED' ? 'กำลังทำ' :
                                                         order.status === 'COMPLETED' ? 'เสร็จแล้ว' :
                                                         'ยกเลิก'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {order.payment ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-green-600 font-semibold text-sm">✓ จ่ายแล้ว</span>
                                                            <span className="text-xs text-gray-500">
                                                                {order.payment.method === 'CASH' ? 'เงินสด' : 'QR Code'}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                ฿{order.payment.amount.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-orange-600 font-semibold text-sm">ค้างชำระ</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(order.createdAt).toLocaleString('th-TH', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {!order.payment ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setPaymentModal({ orderId: order.id, total: order.total })}
                                                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                            >
                                                                จ่าย
                                                            </button>
                                                            <button
                                                                onClick={() => setSplitBillModal({ orderId: order.id, total: order.total })}
                                                                className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                                                            >
                                                                แยกจ่าย
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setReceiptModal(order)}
                                                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                                                        >
                                                            ใบเสร็จ
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>

                {/* Payment Modal */}
                {paymentModal && (
                    <PaymentModal
                        orderId={paymentModal.orderId}
                        orderTotal={paymentModal.total}
                        isOpen={!!paymentModal}
                        onClose={() => setPaymentModal(null)}
                        onConfirm={(method, notes) => handlePayment(paymentModal.orderId, method, notes)}
                    />
                )}

                {/* Split Bill Modal */}
                {splitBillModal && (
                    <SplitBillModal
                        orderId={splitBillModal.orderId}
                        orderTotal={splitBillModal.total}
                        isOpen={!!splitBillModal}
                        onClose={() => setSplitBillModal(null)}
                        onConfirm={(payments) => handleSplitPayment(splitBillModal.orderId, payments)}
                    />
                )}

                {/* Combined Bill Modal */}
                {combinedBillModal && (
                    <CombinedBillModal
                        orders={unpaidOrders}
                        isOpen={combinedBillModal}
                        onClose={() => setCombinedBillModal(false)}
                        onConfirm={(orderIds, amount, method, notes) => handleCombinedPayment(orderIds, amount, method, notes)}
                    />
                )}

                {/* Receipt Modal */}
                <ReceiptModal
                    order={receiptModal}
                    isOpen={!!receiptModal}
                    onClose={() => setReceiptModal(null)}
                />
            </div>
        </AuthGuard>
    );
}
