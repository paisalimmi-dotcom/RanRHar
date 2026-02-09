'use client'

import { useState, useEffect } from 'react'
import type { PaymentMethod } from '@/shared/types/payment'

interface SplitPaymentItem {
    amount: number
    method: PaymentMethod
    payer?: string
    notes?: string
}

interface SplitBillModalProps {
    orderId: string
    orderTotal: number
    isOpen: boolean
    onClose: () => void
    onConfirm: (payments: SplitPaymentItem[]) => Promise<void>
}

export function SplitBillModal({ orderId, orderTotal, isOpen, onClose, onConfirm }: SplitBillModalProps) {
    const [payments, setPayments] = useState<SplitPaymentItem[]>([
        { amount: 0, method: 'CASH', payer: '', notes: '' },
        { amount: 0, method: 'CASH', payer: '', notes: '' },
    ])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setPayments([
                { amount: orderTotal / 2, method: 'CASH', payer: '', notes: '' },
                { amount: orderTotal / 2, method: 'CASH', payer: '', notes: '' },
            ])
            setError(null)
        }
    }, [isOpen, orderTotal])

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const remaining = orderTotal - totalAmount
    const isValid = Math.abs(remaining) < 0.01 && payments.length >= 2 && payments.every(p => p.amount > 0)

    function addPayment() {
        if (payments.length >= 10) return
        setPayments([...payments, { amount: 0, method: 'CASH', payer: '', notes: '' }])
    }

    function removePayment(index: number) {
        if (payments.length <= 2) return
        setPayments(payments.filter((_, i) => i !== index))
    }

    function updatePayment(index: number, field: keyof SplitPaymentItem, value: string | number) {
        setPayments(payments.map((p, i) => 
            i === index ? { ...p, [field]: value } : p
        ))
    }

    function autoSplit() {
        const splitAmount = orderTotal / payments.length
        setPayments(payments.map(p => ({ ...p, amount: splitAmount })))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!isValid) {
            setError('ยอดรวมต้องเท่ากับยอดออเดอร์ และต้องมีอย่างน้อย 2 การชำระ')
            return
        }

        try {
            setLoading(true)
            setError(null)
            await onConfirm(payments.map(p => ({
                amount: p.amount,
                method: p.method,
                payer: p.payer?.trim() || undefined,
                notes: p.notes?.trim() || undefined,
            })))
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
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">แยกจ่าย (Split Bill)</h2>
                    <p className="text-sm text-gray-600 mb-6">
                        ออเดอร์ #{orderId} - ยอดรวม: ฿{orderTotal.toFixed(2)}
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Auto Split Button */}
                        <div className="mb-4">
                            <button
                                type="button"
                                onClick={autoSplit}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                            >
                                แบ่งเท่าๆ กัน
                            </button>
                        </div>

                        {/* Payment Items */}
                        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                            {payments.map((payment, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900">การชำระ #{index + 1}</h3>
                                        {payments.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removePayment(index)}
                                                className="text-red-600 hover:text-red-700 text-sm"
                                            >
                                                ลบ
                                            </button>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            จำนวนเงิน
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={payment.amount || ''}
                                            onChange={(e) => updatePayment(index, 'amount', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    {/* Payment Method */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            วิธีชำระ
                                        </label>
                                        <div className="flex gap-3">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={payment.method === 'CASH'}
                                                    onChange={() => updatePayment(index, 'method', 'CASH')}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="ml-2 text-sm">เงินสด</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={payment.method === 'QR'}
                                                    onChange={() => updatePayment(index, 'method', 'QR')}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="ml-2 text-sm">QR / PromptPay</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Payer Name */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            ผู้จ่าย (ไม่บังคับ)
                                        </label>
                                        <input
                                            type="text"
                                            value={payment.payer || ''}
                                            onChange={(e) => updatePayment(index, 'payer', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="ชื่อผู้จ่าย"
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            หมายเหตุ (ไม่บังคับ)
                                        </label>
                                        <textarea
                                            value={payment.notes || ''}
                                            onChange={(e) => updatePayment(index, 'notes', e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="หมายเหตุเพิ่มเติม"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Payment Button */}
                        {payments.length < 10 && (
                            <div className="mb-4">
                                <button
                                    type="button"
                                    onClick={addPayment}
                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                                >
                                    + เพิ่มการชำระ
                                </button>
                            </div>
                        )}

                        {/* Summary */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">ยอดรวมการชำระ:</span>
                                <span className="text-lg font-semibold">฿{totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">ยอดออเดอร์:</span>
                                <span className="text-lg font-semibold">฿{orderTotal.toFixed(2)}</span>
                            </div>
                            <div className={`flex justify-between items-center mt-2 pt-2 border-t ${remaining < -0.01 || remaining > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                                <span className="text-sm font-medium">คงเหลือ:</span>
                                <span className="text-lg font-bold">฿{remaining.toFixed(2)}</span>
                            </div>
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
                                {loading ? 'กำลังบันทึก...' : 'ยืนยันการชำระ'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
