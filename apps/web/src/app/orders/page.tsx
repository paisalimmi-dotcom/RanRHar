'use client'

import { AuthGuard, authStore } from '@/features/auth'
import { StaffNav } from '@/features/auth/components/StaffNav'
import { orderApi } from '@/features/order/order.api'
import type { Order, OrderStatus } from '@/shared/types/order'
import { PaymentModal } from '@/features/payment/components/PaymentModal'
import { paymentApi } from '@/features/payment/payment.api'
import type { PaymentMethod } from '@/shared/types/payment'
import { useEffect, useState } from 'react'

const CAN_UPDATE_STATUS: import('@/features/auth/auth.types').Role[] = ['manager', 'staff', 'chef']
const CAN_RECORD_PAYMENT: import('@/features/auth/auth.types').Role[] = ['manager', 'staff', 'cashier']

const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
    COMPLETED: 'bg-green-100 text-green-800 border-green-300',
}

export default function OrdersPage() {
    const role = authStore.getSession()?.role
    const canUpdateStatus = role && CAN_UPDATE_STATUS.includes(role)
    const canRecordPayment = role && CAN_RECORD_PAYMENT.includes(role)

    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
    const [paymentModal, setPaymentModal] = useState<{ orderId: string; total: number } | null>(null)

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
            setError(error instanceof Error ? error.message : 'Failed to load orders')
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
            setError(error instanceof Error ? error.message : 'Failed to update status')
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
                            <h2 className="text-2xl font-bold">Order Management</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Showing {filteredOrders.length} of {orders.length} orders
                            </p>
                        </div>
                        <div className="flex gap-3 items-center">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
                                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ALL">All Orders ({statusCounts.ALL})</option>
                                <option value="PENDING">Pending ({statusCounts.PENDING})</option>
                                <option value="CONFIRMED">Confirmed ({statusCounts.CONFIRMED})</option>
                                <option value="COMPLETED">Completed ({statusCounts.COMPLETED})</option>
                            </select>
                            <button
                                onClick={loadOrders}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    {loading && filteredOrders.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                            Loading orders...
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                            {statusFilter === 'ALL' ? 'No orders found' : `No ${statusFilter.toLowerCase()} orders`}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Order ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Created
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                #{order.id}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
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
                                                    <option value="PENDING">PENDING</option>
                                                    <option value="CONFIRMED">CONFIRMED</option>
                                                    <option value="COMPLETED">COMPLETED</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {order.payment ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-green-600 font-semibold text-sm">✓ PAID</span>
                                                        <span className="text-xs text-gray-500">({order.payment.method})</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setPaymentModal({ orderId: order.id, total: order.total })}
                                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                    >
                                                        Record
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(order.createdAt).toLocaleString('en-US', {
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
            </div>
        </AuthGuard>
    )
}
