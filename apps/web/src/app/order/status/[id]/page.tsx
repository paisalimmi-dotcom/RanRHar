'use client';

import { orderApi } from '@/features/order/order.api';
import type { Order, OrderStatus } from '@/shared/types/order';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CancelOrderModal } from '@/components/CancelOrderModal';
import { LoadingFallback } from '@/components/LoadingFallback';
import { APIError } from '@/lib/api-client';

const STATUS_LABELS: Record<OrderStatus, string> = {
    PENDING: 'รอทำอาหาร',
    CONFIRMED: 'กำลังทำอาหาร',
    COMPLETED: 'เสร็จแล้ว',
    CANCELLED: 'ยกเลิกแล้ว',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: '#fbbf24',
    CONFIRMED: '#3b82f6',
    COMPLETED: '#10b981',
    CANCELLED: '#6b7280',
};

const STATUS_ICONS: Record<OrderStatus, string> = {
    PENDING: '⏳',
    CONFIRMED: '👨‍🍳',
    COMPLETED: '✅',
    CANCELLED: '❌',
};

export default function OrderStatusPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = params.id as string;
    const tableCode = searchParams.get('table') || null;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        loadOrder();

        const interval = setInterval(() => {
            loadOrder();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [orderId]);

    async function loadOrder() {
        try {
            setError(null);
            // Use public endpoint - no auth required
            const foundOrder = await orderApi.getOrderById(orderId, tableCode || undefined);

            if (!foundOrder) {
                setError('ไม่พบออเดอร์');
                setOrder(null);
                return;
            }

            setOrder(foundOrder);
        } catch (err) {
            const message = err instanceof APIError ? err.message : 'ไม่สามารถโหลดข้อมูลออเดอร์ได้';
            setError(message);
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }

    const handleCancel = async (reason?: string, refundRequired?: boolean) => {
        if (!order || order.status === 'CANCELLED') return;

        setIsCancelling(true);
        try {
            // For PENDING orders, use status update
            if (order.status === 'PENDING') {
                await orderApi.updateOrderStatus(order.id, 'CANCELLED');
            } else {
                // For CONFIRMED/COMPLETED, use cancel endpoint (requires manager)
                // But customer can't cancel these, so this shouldn't happen
                throw new Error('ไม่สามารถยกเลิกออเดอร์ที่กำลังทำหรือเสร็จแล้วได้');
            }
            // Reload order to get updated status
            await loadOrder();
            setShowCancelModal(false);
        } catch (err) {
            throw err; // Let modal handle error display
        } finally {
            setIsCancelling(false);
        }
    };

    if (loading) {
        return <LoadingFallback />;
    }

    if (error || !order) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        maxWidth: '600px',
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        padding: '40px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                    <h1
                        style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            marginBottom: '12px',
                        }}
                    >
                        {error || 'ไม่พบออเดอร์'}
                    </h1>
                    <p style={{ color: '#666', marginBottom: '24px' }}>
                        ออเดอร์ที่คุณค้นหาอาจถูกลบหรือไม่ถูกต้อง
                    </p>
                    <button
                        onClick={() => {
                            const table = tableCode || 'A12';
                            router.push(`/menu/${table}`);
                        }}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        กลับไปเมนู
                    </button>
                </div>
            </div>
        );
    }

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

    const canCancel = order.status === 'PENDING';

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                padding: '20px',
            }}
        >
            <div
                style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '32px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                        {STATUS_ICONS[order.status]}
                    </div>
                    <h1
                        style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            marginBottom: '8px',
                        }}
                    >
                        {STATUS_LABELS[order.status]}
                    </h1>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        ออเดอร์ #{order.id}
                        {order.tableCode && (
                            <span style={{ marginLeft: '8px' }}>
                                · โต๊ะ {order.tableCode}
                            </span>
                        )}
                    </p>
                </div>

                {/* Status Badge */}
                <div
                    style={{
                        backgroundColor: STATUS_COLORS[order.status] + '20',
                        color: STATUS_COLORS[order.status],
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '16px',
                    }}
                >
                    {STATUS_LABELS[order.status]}
                </div>

                {/* Order Details */}
                <div
                    style={{
                        backgroundColor: '#f9f9f9',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                    }}
                >
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        สั่งเมื่อ
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>
                        {formattedDate} เวลา {formattedTime}
                    </div>
                </div>

                {/* Order Items */}
                <div style={{ marginBottom: '24px' }}>
                    <h2
                        style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            marginBottom: '12px',
                            color: '#666',
                        }}
                    >
                        รายการอาหาร
                    </h2>
                    {order.items.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '12px 0',
                                borderBottom: '1px solid #eee',
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                    {item.name}
                                </div>
                                <div style={{ fontSize: '14px', color: '#666' }}>
                                    ฿{item.priceTHB} × {item.quantity}
                                </div>
                            </div>
                            <div style={{ fontWeight: '600', fontSize: '16px' }}>
                                ฿{item.priceTHB * item.quantity}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div
                    style={{
                        borderTop: '2px solid #000',
                        paddingTop: '16px',
                        marginBottom: '24px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '20px',
                            fontWeight: '700',
                        }}
                    >
                        <span>รวม</span>
                        <span>฿{order.total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    {canCancel && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            style={{
                                flex: 1,
                                padding: '12px',
                                backgroundColor: '#dc3545',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}
                        >
                            ยกเลิกออเดอร์
                        </button>
                    )}
                    <button
                        onClick={() => {
                            const table = order.tableCode || tableCode || 'A12';
                            router.push(`/menu/${table}`);
                        }}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        {canCancel ? 'สั่งเพิ่ม' : 'กลับไปเมนู'}
                    </button>
                </div>

                {/* Auto-refresh indicator */}
                <div
                    style={{
                        textAlign: 'center',
                        marginTop: '16px',
                        fontSize: '12px',
                        color: '#999',
                    }}
                >
                    อัปเดตอัตโนมัติทุก 30 วินาที
                </div>
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <CancelOrderModal
                    isOpen={showCancelModal}
                    orderId={order.id}
                    orderStatus={order.status}
                    isManager={false}
                    onConfirm={handleCancel}
                    onCancel={() => setShowCancelModal(false)}
                />
            )}
        </div>
    );
}
