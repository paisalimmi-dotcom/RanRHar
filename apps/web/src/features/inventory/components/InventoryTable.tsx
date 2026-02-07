'use client';

import React from 'react';
import { InventoryItem } from '@/shared/types/inventory';

interface InventoryTableProps {
    items: InventoryItem[];
    onEdit: (item: InventoryItem) => void;
    onAdjust: (item: InventoryItem) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ items, onEdit, onAdjust }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min. Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {items.map((item) => {
                        const isLowStock = item.quantity <= item.minQuantity;
                        return (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isLowStock ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                    {item.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">{item.unit}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.minQuantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isLowStock ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                            Low Stock
                                        </span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Healthy
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => onAdjust(item)}
                                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded"
                                    >
                                        Adjust
                                    </button>
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1 rounded"
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic">
                                No inventory items found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default InventoryTable;
