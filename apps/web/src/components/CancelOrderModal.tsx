'use client';

import { useState } from 'react';

interface CancelOrderModalProps {
    isOpen: boolean;
    orderId: string;
    orderStatus: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    isManager: boolean;
    onConfirm: (reason?: string, refundRequired?: boolean) => Promise<void>;
    onCancel: () => void;
}

export function CancelOrderModal({
    isOpen,
    orderId,
    orderStatus,
    isManager,
    onConfirm,
    onCancel,
}: CancelOrderModalProps) {
    const [reason, setReason] = useState('');
    const [refundRequired, setRefundRequired] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsCancelling(true);
        setError(null);

        try {
            await onConfirm(reason.trim() || undefined, refundRequired);
            // Reset form
            setReason('');
            setRefundRequired(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'ไม่สามารถยกเลิกออเดอร์ได้');
        } finally {
            setIsCancelling(false);
        }
    };

    const requiresReason = isManager && orderStatus !== 'PENDING';

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
            }}
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
        >
            <div
                style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '24px',
                    maxWidth: '500px',
                    width: '100%',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ fontSize: '32px', marginBottom: '16px', textAlign: 'center' }}>
                    ⚠️
                </div>
                <h2
                    id="cancel-order-title"
                    style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        marginBottom: '12px',
                        textAlign: 'center',
                    }}
                >
                    ยกเลิกออเดอร์ #{orderId}
                </h2>

                {orderStatus !== 'PENDING' && (
                    <div
                        style={{
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffc107',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '16px',
                            fontSize: '14px',
                            color: '#856404',
                        }}
                    >
                        ⚠️ ออเดอร์นี้อยู่ในสถานะ <strong>{orderStatus}</strong> การยกเลิกต้องได้รับการอนุมัติจากผู้จัดการ
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            backgroundColor: '#fee',
                            border: '1px solid #fcc',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '16px',
                            fontSize: '14px',
                            color: '#c00',
                        }}
                    >
                        {error}
                    </div>
                )}

                {requiresReason && (
                    <div style={{ marginBottom: '16px' }}>
                        <label
                            htmlFor="cancel-reason"
                            style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                marginBottom: '8px',
                                color: '#333',
                            }}
                        >
                            เหตุผลในการยกเลิก <span style={{ color: '#c00' }}>*</span>
                        </label>
                        <textarea
                            id="cancel-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="กรุณาระบุเหตุผลในการยกเลิกออเดอร์..."
                            required
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                            }}
                            aria-required="true"
                            aria-describedby="cancel-reason-help"
                        />
                        <div
                            id="cancel-reason-help"
                            style={{
                                fontSize: '12px',
                                color: '#666',
                                marginTop: '4px',
                            }}
                        >
                            เช่น อาหารมีปัญหา, ลูกค้าไม่พอใจ, ต้องทำให้ใหม่
                        </div>
                    </div>
                )}

                {isManager && (
                    <div style={{ marginBottom: '16px' }}>
                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                cursor: 'pointer',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={refundRequired}
                                onChange={(e) => setRefundRequired(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span>ต้องคืนเงิน (Refund Required)</span>
                        </label>
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#666',
                                marginTop: '4px',
                                marginLeft: '26px',
                            }}
                        >
                            เลือกถ้าลูกค้าชำระเงินแล้วและต้องคืนเงิน
                        </div>
                    </div>
                )}

                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                    }}
                >
                    <button
                        onClick={onCancel}
                        disabled={isCancelling}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: '#f5f5f5',
                            color: '#333',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: isCancelling ? 'not-allowed' : 'pointer',
                            opacity: isCancelling ? 0.5 : 1,
                        }}
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isCancelling || (requiresReason && !reason.trim())}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: isCancelling || (requiresReason && !reason.trim()) ? '#999' : '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: isCancelling || (requiresReason && !reason.trim()) ? 'not-allowed' : 'pointer',
                        }}
                        aria-busy={isCancelling}
                    >
                        {isCancelling ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิก'}
                    </button>
                </div>
            </div>
        </div>
    );
}
