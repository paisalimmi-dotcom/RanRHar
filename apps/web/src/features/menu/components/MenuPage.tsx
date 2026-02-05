'use client';

import { useMemo } from 'react';

type MenuItem = { id: string; name: string; priceTHB: number };
type MenuCategory = { id: string; name: string; items: MenuItem[] };

const mockRestaurant = { name: 'RanRHar (Mock)', branch: 'Branch 001 (Mock)' };

function getMockMenu(): MenuCategory[] {
    return [
        {
            id: 'cat-1',
            name: 'Recommended',
            items: [
                { id: 'm-1', name: 'Signature Dish', priceTHB: 199 },
                { id: 'm-2', name: 'Iced Tea', priceTHB: 45 },
            ],
        },
    ];
}

export default function MenuPage({ tableCode }: { tableCode: string }) {
    const menu = useMemo(() => getMockMenu(), []);

    return (
        <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>Menu</h1>
            <div style={{ marginBottom: 16 }}>
                <div><b>Table:</b> {tableCode}</div>
                <div><b>Restaurant:</b> {mockRestaurant.name}</div>
                <div><b>Branch:</b> {mockRestaurant.branch}</div>
            </div>

            {menu.map((cat) => (
                <section key={cat.id} style={{ marginTop: 20 }}>
                    <h2 style={{ fontSize: 22, marginBottom: 10 }}>{cat.name}</h2>

                    <div style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
                        {cat.items.map((it) => (
                            <div
                                key={it.id}
                                style={{
                                    border: '1px solid #ddd',
                                    borderRadius: 12,
                                    padding: 12,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 700 }}>{it.name}</div>
                                    <div style={{ opacity: 0.8 }}>฿ {it.priceTHB}</div>
                                </div>

                                <button
                                    type="button"
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: 10,
                                        border: '1px solid #aaa',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => alert(`Add: ${it.name}`)}
                                >
                                    Add
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </main>
    );
}
