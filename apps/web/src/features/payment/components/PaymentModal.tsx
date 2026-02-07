'use client'

import { useState } from 'react'
import type { PaymentMethod } from '@/shared/types/payment'

interface PaymentModalProps {
    orderId: string
    orderTotal: number
    isOpen: boolean
    onClose: () => void
    onConfirm: (method: PaymentMethod, notes?: string) => Promise<void>
}

export function PaymentModal({ orderId, orderTotal, isOpen, onClose, onConfirm }: PaymentModalProps) {
    const [method, setMethod] = useState<PaymentMethod>('CASH')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        try {
            setLoading(true)
            setError(null)
            await onConfirm(method, notes || undefined)
            // Reset form
            setMethod('CASH')
            setNotes('')
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to record payment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Record Payment</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Order #{orderId}
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Amount Display */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount
                            </label>
                            <div className="text-3xl font-bold text-gray-900">
                                ฿{orderTotal.toFixed(2)}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Payment Method
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
                                    <span className="ml-3 font-medium">💵 Cash</span>
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
                                Notes (Optional)
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add any notes about this payment..."
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
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Recording...' : 'Confirm Payment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
