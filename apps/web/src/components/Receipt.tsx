'use client';

import type { Order } from '@/shared/types/order';

interface ReceiptProps {
    order: Order;
    receiptNumber?: string;
    onClose?: () => void;
}

export function Receipt({ order, receiptNumber, onClose }: ReceiptProps) {
    const receiptNum = receiptNumber || `RCP-${order.id.padStart(6, '0')}`;
    const orderDate = new Date(order.createdAt);
    const formattedDate = orderDate.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = orderDate.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .receipt-container,
                    .receipt-container * {
                        visibility: visible;
                    }
                    .receipt-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .receipt-actions {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="receipt-container bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-6 border-b pb-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">RanRHar Restaurant</h1>
                    <p className="text-sm text-gray-600">123 ถนนสุขุมวิท กรุงเทพฯ 10110</p>
                    <p className="text-sm text-gray-600">โทร: 02-123-4567</p>
                </div>

                {/* Receipt Info */}
                <div className="mb-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">เลขที่ใบเสร็จ:</span>
                        <span className="font-semibold">{receiptNum}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">ออเดอร์ #:</span>
                        <span className="font-semibold">{order.id}</span>
                    </div>
                    {order.tableCode && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">โต๊ะ:</span>
                            <span className="font-semibold">{order.tableCode}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-600">วันที่:</span>
                        <span>{formattedDate} {formattedTime}</span>
                    </div>
                </div>

                {/* Items */}
                <div className="mb-4 border-t border-b py-4">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 text-gray-600 font-medium">รายการ</th>
                                <th className="text-center py-2 text-gray-600 font-medium">จำนวน</th>
                                <th className="text-right py-2 text-gray-600 font-medium">ราคา</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="py-2">
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-gray-500">฿{item.priceTHB.toFixed(2)}</div>
                                    </td>
                                    <td className="text-center py-2">{item.quantity}</td>
                                    <td className="text-right py-2 font-medium">
                                        ฿{(item.priceTHB * item.quantity).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Payment Info */}
                {order.payment && (
                    <div className="mb-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">วิธีชำระ:</span>
                            <span className="font-semibold">
                                {order.payment.method === 'CASH' ? 'เงินสด' : 'QR Code'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">ชำระเมื่อ:</span>
                            <span>
                                {order.payment.paidAt
                                    ? new Date(order.payment.paidAt).toLocaleString('th-TH', {
                                          year: 'numeric',
                                          month: '2-digit',
                                          day: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })
                                    : '-'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Totals */}
                <div className="mb-6 space-y-2">
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>รวมทั้งสิ้น:</span>
                        <span>฿{order.total.toFixed(2)}</span>
                    </div>
                    {order.payment && (
                        <>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">รับเงิน:</span>
                                <span>฿{order.payment.amount.toFixed(2)}</span>
                            </div>
                            {order.payment.amount > order.total && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>เงินทอน:</span>
                                    <span>฿{(order.payment.amount - order.total).toFixed(2)}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 border-t pt-4">
                    <p>ขอบคุณที่ใช้บริการ</p>
                    <p className="mt-1">ขออภัยหากมีข้อผิดพลาด กรุณาติดต่อร้าน</p>
                </div>

                {/* Actions */}
                {onClose && (
                    <div className="receipt-actions mt-6 flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            พิมพ์ใบเสร็จ
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            ปิด
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
