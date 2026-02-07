'use client';

import React, { useState } from 'react';
import { InventoryItem, AdjustStockPayload } from '@/shared/types/inventory';

interface StockAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdjust: (payload: AdjustStockPayload) => Promise<void>;
    item: InventoryItem | null;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ isOpen, onClose, onAdjust, item }) => {
    const [type, setType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN');
    const [quantity, setQuantity] = useState(0);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !item) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity <= 0) {
            alert('Quantity must be greater than 0');
            return;
        }

        setIsSubmitting(true);
        try {
            await onAdjust({ type, quantity, reason });
            setQuantity(0);
            setReason('');
            onClose();
        } catch (error) {
            console.error('Adjustment error:', error);
            alert('Failed to adjust stock');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-blue-600 px-6 py-4 border-b border-blue-700 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold">Adjust Stock</h2>
                        <p className="text-blue-100 text-sm">{item.name}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-blue-200 px-2 py-1 font-bold text-xl">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['IN', 'OUT', 'ADJUST'] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${type === t
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {t === 'IN' ? 'Stock In (+)' : t === 'OUT' ? 'Stock Out (-)' : 'Correction'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity ({item.unit})</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            min="0.01"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Amount to change"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Note</label>
                        <textarea
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-24 resize-none"
                            placeholder="e.g., Weekly restock, Spillage, Inventory count correction..."
                        />
                    </div>

                    <div className="pt-4 flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Applying...' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockAdjustmentModal;
