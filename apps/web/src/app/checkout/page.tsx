'use client';

import { CartProvider } from '@/features/cart/CartProvider';
import { useCart } from '@/features/cart/hooks/useCart';
import { createOrder } from '@/features/order/order.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function CheckoutContent() {
    const { items, totalItems, totalPrice, clearCart } = useCart();
    const router = useRouter();

    // Redirect if cart is empty
    useEffect(() => {
        if (totalItems === 0) {
            router.push('/menu/A12');
        }
    }, [totalItems, router]);

    const handlePlaceOrder = () => {
        if (items.length === 0) return;

        // Create order snapshot
        const order = createOrder(items);

        // Clear cart
        clearCart();

        // Redirect to success page
        router.push(`/order/success/${order.id}`);
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
                    Checkout
                </h1>

                {/* Order Items */}
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#666' }}>
                        Order Summary
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
                        <span style={{ fontSize: '14px', color: '#666' }}>Subtotal</span>
                        <span style={{ fontWeight: '600' }}>฿{totalPrice}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '20px',
                        fontWeight: '700'
                    }}>
                        <span>Total</span>
                        <span>฿{totalPrice}</span>
                    </div>
                </div>

                {/* Place Order Button */}
                <button
                    onClick={handlePlaceOrder}
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
                    Place Order
                </button>

                {/* Back Link */}
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                        onClick={() => router.push('/menu/A12')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#666',
                            fontSize: '14px',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        ← Back to Menu
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <CartProvider>
            <CheckoutContent />
        </CartProvider>
    );
}
