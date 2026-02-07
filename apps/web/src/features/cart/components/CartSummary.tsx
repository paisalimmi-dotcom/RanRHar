'use client';

import { useCart } from '../hooks/useCart';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CartSummary() {
    const { items, totalItems, totalPrice, addToCart, decreaseQuantity, clearCart } = useCart();
    const [isExpanded, setIsExpanded] = useState(false);
    const router = useRouter();

    if (totalItems === 0) {
        return null;
    }

    const handlePlaceOrder = () => {
        router.push('/checkout');
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden',
        }}>
            {/* Expanded List */}
            {isExpanded && (
                <div style={{ padding: 16, maxHeight: '60vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 18 }}>Your Cart</h3>
                        <button onClick={() => clearCart()} style={{ color: 'red', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>Clear All</button>
                    </div>
                    {items.map((item) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #eee' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600 }}>{item.name}</div>
                                <div style={{ fontSize: 14, color: '#666' }}>฿ {item.priceTHB} x {item.quantity}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                    onClick={() => decreaseQuantity(item.id)}
                                    style={{ width: 28, height: 28, borderRadius: 14, border: '1px solid #ddd', background: '#fff' }}
                                > - </button>
                                <span style={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                                <button
                                    onClick={() => addToCart(item)}
                                    style={{ width: 28, height: 28, borderRadius: 14, border: '1px solid #ddd', background: '#fff' }}
                                > + </button>
                            </div>
                        </div>
                    ))}
                    <div style={{ marginTop: 16 }}>
                        <button
                            onClick={handlePlaceOrder}
                            style={{
                                width: '100%',
                                padding: 14,
                                backgroundColor: '#000',
                                color: '#fff',
                                borderRadius: 12,
                                border: 'none',
                                fontSize: 16,
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            Place Order - ฿ {totalPrice}
                        </button>
                    </div>
                </div>
            )}

            {/* Summary Bar */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? '#f9f9f9' : '#fff',
                    borderTop: isExpanded ? '1px solid #eee' : 'none'
                }}
            >
                <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{totalItems} items</div>
                    {!isExpanded && <div style={{ fontSize: 13, color: '#666' }}>Tap to view details</div>}
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                    ฿ {totalPrice}
                    <span style={{ marginLeft: 8, fontSize: 14, color: isExpanded ? '#000' : '#888' }}>
                        {isExpanded ? '▼' : '▲'}
                    </span>
                </div>
            </div>
        </div>
    );
}
