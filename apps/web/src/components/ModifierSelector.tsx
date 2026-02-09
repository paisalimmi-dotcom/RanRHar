'use client';

import { useState } from 'react';
import type { MenuModifier } from '@/features/menu/types';

interface ModifierSelectorProps {
    modifiers: MenuModifier[];
    selectedIds: string[];
    onSelectionChange: (selectedIds: string[]) => void;
    onClose: () => void;
    onConfirm: () => void;
}

export function ModifierSelector({
    modifiers,
    selectedIds,
    onSelectionChange,
    onClose,
    onConfirm,
}: ModifierSelectorProps) {
    const toggleModifier = (modifierId: string) => {
        const newSelection = selectedIds.includes(modifierId)
            ? selectedIds.filter(id => id !== modifierId)
            : [...selectedIds, modifierId];
        onSelectionChange(newSelection);
    };

    const totalDelta = modifiers
        .filter(m => selectedIds.includes(m.id))
        .reduce((sum, m) => sum + m.priceDelta, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">เลือกตัวเลือกเพิ่มเติม</h3>
                    
                    {modifiers.length === 0 ? (
                        <p className="text-gray-500 text-sm">ไม่มีตัวเลือกเพิ่มเติม</p>
                    ) : (
                        <div className="space-y-2 mb-4">
                            {modifiers.map((modifier) => {
                                const isSelected = selectedIds.includes(modifier.id);
                                return (
                                    <label
                                        key={modifier.id}
                                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleModifier(modifier.id)}
                                            className="w-5 h-5 text-blue-600 rounded"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{modifier.name}</div>
                                            {modifier.priceDelta !== 0 && (
                                                <div className="text-sm text-gray-600">
                                                    {modifier.priceDelta > 0 ? '+' : ''}฿{modifier.priceDelta.toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}

                    {totalDelta !== 0 && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm text-gray-600">ราคาเพิ่มเติม:</div>
                            <div className="text-lg font-semibold text-blue-600">
                                {totalDelta > 0 ? '+' : ''}฿{totalDelta.toFixed(2)}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            ตกลง
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
