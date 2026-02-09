'use client'

import { useState, useEffect } from 'react'
import type { Order } from '@/shared/types/order'
import type { PaymentMethod } from '@/shared/types/payment'

interface CombinedBillModalProps {
    orders: Order[]
    isOpen: boolean
    onClose: () => void
    onConfirm: (orderIds: string[], amount: number, method: PaymentMethod, notes?: string) => Promise<void>
}

export function CombinedBillModal({ orders, isOpen, onClose, onConfirm }: CombinedBillModalProps) {
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
    const [method, setMethod] = useState<PaymentMethod>('CASH')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setSelectedOrderIds(new Set())
            setMethod('CASH')
            setNotes('')
            setError(null)
        }
    }, [isOpen])

    const selectedOrders = orders.filter(o => selectedOrderIds.has(o.id))
    const totalAmount = selectedOrders.reduce((sum, o) => sum + o.total, 0)
    const isValid = selectedOrderIds.size >= 2 && totalAmount > 0

    function toggleOrder(orderId: string) {
        const newSet = new Set(selectedOrderIds)
        if (newSet.has(orderId)) {
            newSet.delete(orderId)
        } else {
            newSet.add(orderId)
        }
        setSelectedOrderIds(newSet)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!isValid) {
            setError('กรุณาเลือกอย่างน้อย 2 ออเดอร์')
            return
        }

        try {
            setLoading(true)
            setError(null)
            await onConfirm(Array.from(selectedOrderIds), totalAmount, method, notes?.trim() || undefined)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกการชำระได้')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 my-8">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">จ่ายรวม (Combined Bill)</h2>
                    <p className="text-sm text-gray-600 mb-6">
                        เลือกออเดอร์ที่ต้องการจ่ายรวมกัน
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Order Selection */}
                        <div className="mb-6 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                            {orders.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">ไม่มีออเดอร์ที่สามารถจ่ายรวมได้</p>
                            ) : (
                                <div className="space-y-2">
                                    {orders.map((order) => {
                                        const isSelected = selectedOrderIds.has(order.id)
                                        const hasPayment = !!order.payment
                                        
                                        return (
                                            <label
                                                key={order.id}
                                                className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                                    isSelected 
                                                        ? 'border-blue-500 bg-blue-50' 
                                                        : hasPayment
                                                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => !hasPayment && toggleOrder(order.id)}
                                                        disabled={hasPayment}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-900">
                                                            ออเดอร์ #{order.id}
                                                            {order.tableCode && (
                                                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                                    โต๊ะ {order.tableCode}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            {order.items.length} รายการ · สถานะ: {order.status}
                                                        </div>
                                                        {hasPayment && (
                                                            <div className="text-xs text-green-600 mt-1">
                                                                ✓ จ่ายแล้ว
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-lg font-bold text-gray-900">
                                                        ฿{order.total.toFixed(2)}
                                                    </div>
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        {selectedOrders.length > 0 && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">จำนวนออเดอร์:</span>
                                    <span className="text-lg font-semibold">{selectedOrders.length} ออเดอร์</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">ยอดรวม:</span>
                                    <span className="text-2xl font-bold text-gray-900">฿{totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {/* Payment Method */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                วิธีชำระ
                            </label>
                            <div className="space-y-3">
                                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                    style={{ borderColor: method === 'CASH' ? '#3b82f6' : '#e5e7eb' }}>
                                    <input
                                        type="radio"
                                        name="method"
                                        value="CASH"
                                        checked={method === 'CASH'}
                                        onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="ml-3 font-medium">💵 เงินสด</span>
                                </label>
                                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                    style={{ borderColor: method === 'QR' ? '#3b82f6' : '#e5e7eb' }}>
                                    <input
                                        type="radio"
                                        name="method"
                                        value="QR"
                                        checked={method === 'QR'}
                                        onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="ml-3 font-medium">📱 QR / PromptPay</span>
                                </label>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mb-6">
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                                หมายเหตุ (ไม่บังคับ)
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="หมายเหตุเพิ่มเติม..."
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !isValid}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'กำลังบันทึก...' : `ยืนยันการชำระ ฿${totalAmount.toFixed(2)}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
