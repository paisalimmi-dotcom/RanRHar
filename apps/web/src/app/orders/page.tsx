'use client'

import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { AuthGuard, authStore } from '@/features/auth'
import { StaffNav } from '@/features/auth/components/StaffNav'
import { orderApi } from '@/features/order/order.api'
import type { Order, OrderStatus } from '@/shared/types/order'
import { PaymentModal } from '@/features/payment/components/PaymentModal'
import { SplitBillModal } from '@/features/payment/components/SplitBillModal'
import { CombinedBillModal } from '@/features/payment/components/CombinedBillModal'
import { paymentApi } from '@/features/payment/payment.api'
import type { PaymentMethod } from '@/shared/types/payment'
import { CancelOrderModal } from '@/components/CancelOrderModal'
import { useEffect, useState } from 'react'

const CAN_UPDATE_STATUS: import('@/features/auth/auth.types').Role[] = ['manager', 'staff', 'chef']
const CAN_RECORD_PAYMENT: import('@/features/auth/auth.types').Role[] = ['manager', 'staff', 'cashier']
const CAN_CANCEL_ORDER: import('@/features/auth/auth.types').Role[] = ['manager']

const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
    COMPLETED: 'bg-green-100 text-green-800 border-green-300',
    CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300',
}

export default function OrdersPage() {
    const role = authStore.getSession()?.role
    const canUpdateStatus = role && CAN_UPDATE_STATUS.includes(role)
    const canRecordPayment = role && CAN_RECORD_PAYMENT.includes(role)
    const canCancelOrder = role && CAN_CANCEL_ORDER.includes(role)
    const isManager = role === 'manager'

    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
    const [paymentModal, setPaymentModal] = useState<{ orderId: string; total: number } | null>(null)
    const [splitBillModal, setSplitBillModal] = useState<{ orderId: string; total: number } | null>(null)
    const [combinedBillModal, setCombinedBillModal] = useState<boolean>(false)
    const [cancelModal, setCancelModal] = useState<{ orderId: string; orderStatus: OrderStatus } | null>(null)

    useEffect(() => {
        loadOrders()
    }, [])

    async function loadOrders() {
        try {
            setLoading(true)
            setError(null)
            const data = await orderApi.getOrders()
            setOrders(data)
        } catch (error) {
                                            setError(error instanceof Error ? error.message : 'ไม่สามารถโหลดออเดอร์ได้')
        } finally {
            setLoading(false)
        }
    }

    async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
        try {
            setUpdatingOrderId(orderId)
            setError(null)

            // Optimistic update
            setOrders(prev =>
                prev.map(order =>
                    order.id === orderId ? { ...order, status: newStatus } : order
                )
            )

            // API call
            await orderApi.updateOrderStatus(orderId, newStatus)
        } catch (error) {
            // Revert on error
            setError(error instanceof Error ? error.message : 'ไม่สามารถอัปเดตสถานะได้')
            await loadOrders()
        } finally {
            setUpdatingOrderId(null)
        }
    }

    async function handleRecordPayment(method: PaymentMethod, notes?: string) {
        if (!paymentModal) return

        await paymentApi.recordPayment(
            paymentModal.orderId,
            paymentModal.total,
            method,
            notes
        )
        // Refresh orders to get updated payment (included in GET /orders)
        await loadOrders()
        setPaymentModal(null)
    }

    async function handleSplitPayment(payments: Array<{ amount: number; method: PaymentMethod; payer?: string; notes?: string }>) {
        if (!splitBillModal) return

        await paymentApi.splitPayment(splitBillModal.orderId, payments)
        // Refresh orders to get updated payment
        await loadOrders()
        setSplitBillModal(null)
    }

    async function handleCombinedPayment(orderIds: string[], amount: number, method: PaymentMethod, notes?: string) {
        await paymentApi.combinedPayment(orderIds, amount, method, notes)
        // Refresh orders to get updated payment
        await loadOrders()
        setCombinedBillModal(false)
    }

    // Get orders that can be combined (not paid yet)
    const availableOrders = orders.filter(o => !o.payment && o.status !== 'CANCELLED')

    async function handleCancelOrder(reason?: string, refundRequired?: boolean) {
        if (!cancelModal) return

        try {
            const order = orders.find(o => o.id === cancelModal.orderId)
            if (!order) return

            // For PENDING orders, use status update
            if (cancelModal.orderStatus === 'PENDING') {
                await orderApi.updateOrderStatus(cancelModal.orderId, 'CANCELLED')
            } else {
                // For CONFIRMED/COMPLETED, use cancel endpoint (requires manager)
                await orderApi.cancelOrder(cancelModal.orderId, reason, refundRequired)
            }

            // Refresh orders
            await loadOrders()
            setCancelModal(null)
        } catch (error) {
            throw error // Let modal handle error display
        }
    }

    // Filter orders based on selected status
    const filteredOrders = statusFilter === 'ALL'
        ? orders
        : orders.filter(order => order.status === statusFilter)

    // Calculate status counts
    const statusCounts = {
        ALL: orders.length,
        PENDING: orders.filter(o => o.status === 'PENDING').length,
        CONFIRMED: orders.filter(o => o.status === 'CONFIRMED').length,
        COMPLETED: orders.filter(o => o.status === 'COMPLETED').length,
    }

    return (
        <AuthGuard allowedRoles={['owner', 'manager', 'staff', 'cashier', 'chef', 'host', 'delivery']}>
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow-sm border-b px-4 py-3">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                        <h1 className="text-lg font-semibold text-gray-900">รายการออเดอร์</h1>
                        <StaffNav />
                    </div>
                </header>
                <div className="max-w-6xl mx-auto p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">จัดการออเดอร์</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                แสดง {filteredOrders.length} จาก {orders.length} ออเดอร์
                            </p>
                        </div>
                        <div className="flex gap-3 items-center">
                            {canRecordPayment && availableOrders.length >= 2 && (
                                <button
                                    onClick={() => setCombinedBillModal(true)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                >
                                    จ่ายรวม ({availableOrders.length})
                                </button>
                            )}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
                                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ALL">ทั้งหมด ({statusCounts.ALL})</option>
                                <option value="PENDING">รอทำ ({statusCounts.PENDING})</option>
                                <option value="CONFIRMED">กำลังทำ ({statusCounts.CONFIRMED})</option>
                                <option value="COMPLETED">เสร็จแล้ว ({statusCounts.COMPLETED})</option>
                            </select>
                            <button
                                onClick={loadOrders}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
                            </button>
                        </div>
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
                                {statusFilter === 'ALL' ? 'ยังไม่มีออเดอร์' : `ไม่มีออเดอร์สถานะ ${statusFilter}`}
                            </p>
                            <p className="text-gray-400 text-sm">ลูกค้าสามารถสั่งอาหารผ่านเมนูได้</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {order.items.map(item => `${item.name} (×${item.quantity})`).join(', ')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                ฿{order.total.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                                    disabled={updatingOrderId === order.id}
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status]} disabled:opacity-50 cursor-pointer`}
                                                >
                                                    <option value="PENDING">รอทำ</option>
                                                    <option value="CONFIRMED">กำลังทำ</option>
                                                    <option value="COMPLETED">เสร็จแล้ว</option>
                                                    <option value="CANCELLED">ยกเลิกแล้ว</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {order.payment ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-green-600 font-semibold text-sm">✓ จ่ายแล้ว</span>
                                                        <span className="text-xs text-gray-500">({order.payment.method === 'CASH' ? 'เงินสด' : 'QR'})</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setPaymentModal({ orderId: order.id, total: order.total })}
                                                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                        >
                                                            บันทึก
                                                        </button>
                                                        <button
                                                            onClick={() => setSplitBillModal({ orderId: order.id, total: order.total })}
                                                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                                        >
                                                            แยกจ่าย
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(order.createdAt).toLocaleString('th-TH', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {paymentModal && (
                    <PaymentModal
                        orderId={paymentModal.orderId}
                        orderTotal={paymentModal.total}
                        isOpen={true}
                        onClose={() => setPaymentModal(null)}
                        onConfirm={handleRecordPayment}
                    />
                )}

                {splitBillModal && (
                    <SplitBillModal
                        orderId={splitBillModal.orderId}
                        orderTotal={splitBillModal.total}
                        isOpen={true}
                        onClose={() => setSplitBillModal(null)}
                        onConfirm={handleSplitPayment}
                    />
                )}

                {combinedBillModal && (
                    <CombinedBillModal
                        orders={availableOrders}
                        isOpen={true}
                        onClose={() => setCombinedBillModal(false)}
                        onConfirm={handleCombinedPayment}
                    />
                )}

                {cancelModal && (
                    <CancelOrderModal
                        isOpen={true}
                        orderId={cancelModal.orderId}
                        orderStatus={cancelModal.orderStatus}
                        isManager={isManager}
                        onConfirm={handleCancelOrder}
                        onCancel={() => setCancelModal(null)}
                    />
                )}
            </div>
        </AuthGuard>
    )
}
