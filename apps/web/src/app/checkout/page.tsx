'use client';

import { APIError } from '@/lib/api-client';
import { CartProvider } from '@/features/cart/CartProvider';
import { useCart } from '@/features/cart/hooks/useCart';
import { createOrder } from '@/features/order/order.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthGuard } from '@/features/auth';
import { ConfirmTableChangeModal } from '@/components/ConfirmTableChangeModal';

const TABLE_CODE_KEY = 'ranrhar_table_code';
const LAST_ORDER_TABLE_KEY = 'lastOrderTableCode';

function CheckoutContent() {
    const { items, totalItems, totalPrice, clearCart, isInitialized } = useCart();
    const router = useRouter();
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [currentTableCode, setCurrentTableCode] = useState<string | null>(null);
    const [lastOrderTableCode, setLastOrderTableCode] = useState<string | null>(null);

    // Get table codes from sessionStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const current = sessionStorage.getItem(TABLE_CODE_KEY);
            const last = sessionStorage.getItem(LAST_ORDER_TABLE_KEY);
            setCurrentTableCode(current);
            setLastOrderTableCode(last);
        }
    }, []);

    // Redirect if cart is empty, but wait until initialized
    useEffect(() => {
        if (isInitialized && totalItems === 0) {
            const tableCode = typeof window !== 'undefined' ? sessionStorage.getItem(TABLE_CODE_KEY) : null;
            router.push(tableCode ? `/menu/${tableCode}` : '/menu/A12');
        }
    }, [totalItems, router, isInitialized]);

    const handlePlaceOrder = async () => {
        if (items.length === 0) return;

        // Check if table code changed from last order
        if (currentTableCode && lastOrderTableCode && currentTableCode !== lastOrderTableCode) {
            setShowConfirmModal(true);
            return;
        }

        await executePlaceOrder();
    };

    const executePlaceOrder = async () => {
        setIsPlacingOrder(true);
        setShowConfirmModal(false);

        try {
            setOrderError(null);
            const order = await createOrder(items);
            clearCart();
            router.push(`/order/success/${order.id}`);
        } catch (error) {
            const message = error instanceof APIError ? error.message : 'ไม่สามารถสั่งอาหารได้ กรุณาลองใหม่อีกครั้ง';
            setOrderError(message);
        } finally {
            setIsPlacingOrder(false);
        }
    };

    if (totalItems === 0) {
        return null; // Will redirect via useEffect
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            padding: '20px',
            paddingBottom: '100px'
        }}>
            <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
                    สั่งอาหาร
                </h1>

                {orderError && (
                    <div style={{ marginBottom: '16px', padding: '12px', background: '#fee', color: '#c00', borderRadius: '8px', fontSize: '14px' }}>
                        {orderError}
                    </div>
                )}

                {/* Order Items */}
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#666' }}>
                        สรุปรายการ
                    </h2>
                    {items.map((item) => (
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

                {/* Totals */}
                <div style={{
                    borderTop: '2px solid #000',
                    paddingTop: '16px',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                    }}>
                        <span style={{ fontSize: '14px', color: '#666' }}>ยอดรวม</span>
                        <span style={{ fontWeight: '600' }}>฿{totalPrice}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '20px',
                        fontWeight: '700'
                    }}>
                        <span>รวมทั้งหมด</span>
                        <span>฿{totalPrice}</span>
                    </div>
                </div>

                {/* Place Order Button */}
                <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    aria-busy={isPlacingOrder}
                    aria-label={isPlacingOrder ? 'กำลังสั่งอาหาร...' : 'สั่งอาหาร'}
                    style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: isPlacingOrder ? '#666' : '#000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '18px',
                        fontWeight: '700',
                        cursor: isPlacingOrder ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.1s',
                    }}
                    onMouseDown={(e) => !isPlacingOrder && (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {isPlacingOrder ? 'กำลังสั่งอาหาร...' : 'สั่งอาหาร'}
                </button>

                {/* Back Link */}
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                        onClick={() => {
                            const tableCode = typeof window !== 'undefined' ? sessionStorage.getItem(TABLE_CODE_KEY) : null;
                            router.push(tableCode ? `/menu/${tableCode}` : '/menu/A12');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#666',
                            fontSize: '14px',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        ← กลับไปเมนู
                    </button>
                </div>
            </div>

            {/* Confirm Table Change Modal */}
            {currentTableCode && lastOrderTableCode && (
                <ConfirmTableChangeModal
                    isOpen={showConfirmModal}
                    currentTable={currentTableCode}
                    lastOrderTable={lastOrderTableCode}
                    onConfirm={executePlaceOrder}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <CheckoutContent />
    );
}
