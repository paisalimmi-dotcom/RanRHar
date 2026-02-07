'use client';

import React, { useState, useEffect } from 'react';
import { InventoryItem, CreateInventoryItemPayload } from '@/shared/types/inventory';

interface ItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateInventoryItemPayload | { name?: string; minQuantity?: number }) => Promise<void>;
    editingItem: InventoryItem | null;
}

const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, onSave, editingItem }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [unit, setUnit] = useState('kg');
    const [minQuantity, setMinQuantity] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingItem) {
            setName(editingItem.name);
            setQuantity(editingItem.quantity);
            setUnit(editingItem.unit);
            setMinQuantity(editingItem.minQuantity);
        } else {
            setName('');
            setQuantity(0);
            setUnit('kg');
            setMinQuantity(0);
        }
    }, [editingItem, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingItem) {
                await onSave({ name, minQuantity });
            } else {
                await onSave({ name, quantity, unit, minQuantity });
            }
            onClose();
        } catch (error) {
            console.error('Save item error:', error);
            alert('Failed to save item');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {editingItem ? 'Edit Item' : 'Add New Item'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 px-2 py-1">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="e.g., Jasmine Rice"
                        />
                    </div>

                    {!editingItem && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="l">l</option>
                                    <option value="ml">ml</option>
                                    <option value="pcs">pcs</option>
                                    <option value="box">box</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Alert Quantity</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={minQuantity}
                            onChange={(e) => setMinQuantity(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <p className="mt-1 text-xs text-gray-500">Highlight correctly when stock falls below this level.</p>
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
                            {isSubmitting ? 'Saving...' : 'Save Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItemModal;
