'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { CartProvider, useCart, CartSummary } from '../../cart';
import type { MenuCategory, RestaurantInfo } from '../types';

const TABLE_CODE_KEY = 'ranrhar_table_code';

type MenuPageProps = {
    initialData: {
        restaurant: RestaurantInfo;
        categories: MenuCategory[];
    };
};

function MenuContent({ data }: { data: MenuPageProps['initialData'] }) {
    // Persist table code for checkout (guest order flow)
    useEffect(() => {
        if (data?.restaurant?.tableCode) {
            sessionStorage.setItem(TABLE_CODE_KEY, data.restaurant.tableCode);
        }
    }, [data?.restaurant?.tableCode]);
    const { restaurant, categories } = data;
    const { addToCart } = useCart();

    return (
        <main style={{ padding: 24, paddingBottom: 100, fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h1 style={{ fontSize: 32, marginBottom: 0 }}>เมนู</h1>
                <Link
                    href="/staff"
                    style={{
                        fontSize: 14,
                        color: 'var(--accent, #2563eb)',
                        textDecoration: 'none',
                    }}
                >
                    เจ้าหน้าที่ →
                </Link>
            </header>
            <div style={{ marginBottom: 16 }}>
                <div><b>Table:</b> {restaurant.tableCode}</div>
                <div><b>Restaurant:</b> {restaurant.name}</div>
                <div><b>Branch:</b> {restaurant.branchName}</div>
            </div>

            {categories.map((cat) => (
                <section key={cat.id} style={{ marginTop: 20 }}>
                    <h2 style={{ fontSize: 22, marginBottom: 10 }}>{cat.name}</h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 16,
                        maxWidth: 1200
                    }}>
                        {cat.items.map((it) => (
                            <div
                                key={it.id}
                                style={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    backgroundColor: '#fff',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                }}
                            >
                                {it.imageUrl ? (
                                    <div style={{ position: 'relative', width: '100%', paddingBottom: '75%', backgroundColor: '#f5f5f5' }}>
                                        <Image
                                            src={it.imageUrl}
                                            alt={it.name}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    </div>
                                ) : (
                                    <div style={{ width: '100%', paddingBottom: '75%', background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)' }} />
                                )}

                                <div style={{ padding: 16 }}>
                                    <div style={{
                                        fontWeight: 600,
                                        fontSize: 18,
                                        marginBottom: 8,
                                        color: '#1a1a1a'
                                    }}>
                                        {it.name}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: 12
                                    }}>
                                        <div style={{
                                            fontSize: 20,
                                            fontWeight: 700,
                                            color: '#2563eb'
                                        }}>
                                            ฿{it.priceTHB}
                                        </div>

                                        <button
                                            type="button"
                                            style={{
                                                padding: '10px 20px',
                                                borderRadius: 12,
                                                border: 'none',
                                                cursor: 'pointer',
                                                backgroundColor: '#2563eb',
                                                color: '#fff',
                                                fontWeight: 600,
                                                fontSize: 14,
                                                transition: 'background-color 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#1d4ed8';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#2563eb';
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addToCart(it);
                                            }}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </main>
    );
}

export default function MenuPage({ initialData }: MenuPageProps) {
    return (
        <>
            <MenuContent data={initialData} />
            <CartSummary />
        </>
    );
}
