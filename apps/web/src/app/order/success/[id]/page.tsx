'use client';

import { getOrderById } from '@/features/order/order.store';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';

export default function OrderSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    // Compute order synchronously since getOrderById is synchronous (localStorage lookup)
    const order = useMemo(() => getOrderById(orderId), [orderId]);

    if (!order) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    maxWidth: '600px',
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '40px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
                        ไม่พบออเดอร์
                    </h1>
                    <p style={{ color: '#666', marginBottom: '24px' }}>
                        ออเดอร์ที่คุณค้นหาอาจถูกลบหรือไม่ถูกต้อง
                    </p>
                    <button
                        onClick={() => router.push('/menu/A12')}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
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
        day: 'numeric'
    });
    const formattedTime = orderDate.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                {/* Success Icon */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                        สั่งอาหารสำเร็จ!
                    </h1>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        เลขออเดอร์: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{order.id}</span>
                    </p>
                </div>

                {/* Order Details */}
                <div style={{
                    backgroundColor: '#f9f9f9',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px'
                }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        สั่งเมื่อ
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>
                        {formattedDate} at {formattedTime}
                    </div>
                </div>

                {/* Order Items */}
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#666' }}>
                        รายการอาหาร
                    </h2>
                    {order.items.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '12px 0',
                                borderBottom: '1px solid #eee'
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
                <div style={{
                    borderTop: '2px solid #000',
                    paddingTop: '16px',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '20px',
                        fontWeight: '700'
                    }}>
                        <span>รวมทั้งหมด</span>
                        <span>฿{order.total}</span>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <button
                        onClick={() => {
                            const tableCode = order.tableCode || 'A12';
                            router.push(`/order/status/${order.id}?table=${tableCode}`);
                        }}
                        style={{
                            flex: 1,
                            padding: '16px',
                            backgroundColor: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'transform 0.1s',
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        ดูสถานะออเดอร์
                    </button>
                </div>

                {/* Back to Menu Button */}
                <button
                    onClick={() => {
                        const tableCode = order.tableCode || 'A12';
                        router.push(`/menu/${tableCode}`);
                    }}
                    style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: '#000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '18px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'transform 0.1s',
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    กลับไปเมนู
                </button>
            </div>
        </div>
    );
}
