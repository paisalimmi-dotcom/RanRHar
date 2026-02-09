'use client';

import { Receipt } from './Receipt';
import type { Order } from '@/shared/types/order';

interface ReceiptModalProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ReceiptModal({ order, isOpen, onClose }: ReceiptModalProps) {
    if (!isOpen || !order) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <Receipt order={order} onClose={onClose} />
                </div>
            </div>
        </div>
    );
}
