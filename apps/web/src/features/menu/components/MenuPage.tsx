'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, useMemo } from 'react';
import { CartProvider, useCart, CartSummary } from '../../cart';
import { authStore } from '../../auth/auth.store';
import type { MenuCategory, MenuItem, RestaurantInfo } from '../types';

const TABLE_CODE_KEY = 'ranrhar_table_code';
const ITEMS_PER_PAGE = 12; // Show 12 items initially, then "โหลดเพิ่ม" for 30+ items

type MenuPageProps = {
    initialData: {
        restaurant: RestaurantInfo;
        categories: MenuCategory[];
    };
};


function MenuContent({ data }: { data: MenuPageProps['initialData'] }) {
    useEffect(() => {
        if (data?.restaurant?.tableCode) {
            sessionStorage.setItem(TABLE_CODE_KEY, data.restaurant.tableCode);
        }
    }, [data?.restaurant?.tableCode]);

    const { restaurant, categories } = data;
    const { addToCart } = useCart();
    const [search, setSearch] = useState('');
    const [showStaffLink, setShowStaffLink] = useState(false);
    useEffect(() => {
        setShowStaffLink(!!authStore.getSession());
    }, []);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const filteredCategories = useMemo(() => {
        if (!search.trim()) return categories;
        const q = search.toLowerCase().trim();
        return categories
            .map((cat) => ({
                ...cat,
                items: cat.items.filter((it) => it.name.toLowerCase().includes(q)),
            }))
            .filter((cat) => cat.items.length > 0);
    }, [categories, search]);

    const scrollToSection = (id: string) => {
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <main className="min-h-screen pb-24 font-sans bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center mb-3">
                        <h1 className="text-2xl font-bold text-gray-900">เมนู</h1>
                        {showStaffLink && (
                            <Link
                                href="/staff"
                                className="text-sm text-blue-600 hover:underline font-medium"
                            >
                                เจ้าหน้าที่ →
                            </Link>
                        )}
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                        <span>โต๊ะ {restaurant.tableCode}</span>
                        <span className="mx-2">·</span>
                        <span>{restaurant.name}</span>
                        <span className="mx-2">·</span>
                        <span>{restaurant.branchName}</span>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder="ค้นหาเมนู..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Category tabs */}
                <div className="overflow-x-auto -mb-px scrollbar-hide">
                    <div className="flex gap-1 px-4 min-w-max pb-2">
                        {filteredCategories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => scrollToSection(cat.id)}
                                className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {filteredCategories.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        {search ? 'ไม่พบเมนูที่ตรงกับคำค้นหา' : 'ยังไม่มีเมนู'}
                    </div>
                ) : (
                    filteredCategories.map((cat) => (
                        <CategorySection
                            key={cat.id}
                            category={cat}
                            sectionRef={(el) => { sectionRefs.current[cat.id] = el; }}
                            addToCart={addToCart}
                            expanded={expandedCategories.has(cat.id)}
                            onToggleExpand={() => {
                                setExpandedCategories((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(cat.id)) next.delete(cat.id);
                                    else next.add(cat.id);
                                    return next;
                                });
                            }}
                            itemsPerPage={ITEMS_PER_PAGE}
                        />
                    ))
                )}
            </div>
        </main>
    );
}

function CategorySection({
    category,
    sectionRef,
    addToCart,
    expanded,
    onToggleExpand,
    itemsPerPage,
}: {
    category: MenuCategory;
    sectionRef: (el: HTMLDivElement | null) => void;
    addToCart: (item: MenuItem) => void;
    expanded: boolean;
    onToggleExpand: () => void;
    itemsPerPage: number;
}) {
    const items = category.items;
    const hasMore = items.length > itemsPerPage;
    const displayItems = hasMore && !expanded ? items.slice(0, itemsPerPage) : items;
    const remaining = items.length - itemsPerPage;

    return (
        <section ref={sectionRef} id={category.id} className="scroll-mt-48">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pt-2">{category.name}</h2>
            <div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                style={{ maxWidth: 1200 }}
            >
                {displayItems.map((it) => (
                    <MenuItemCard key={it.id} item={it} onAdd={() => addToCart(it)} />
                ))}
            </div>
            {hasMore && !expanded && (
                <button
                    type="button"
                    onClick={onToggleExpand}
                    className="mt-4 w-full py-3 text-blue-600 font-medium rounded-xl border-2 border-dashed border-blue-200 hover:bg-blue-50 transition-colors"
                >
                    โหลดเพิ่ม ({remaining} รายการ)
                </button>
            )}
            {hasMore && expanded && (
                <button
                    type="button"
                    onClick={onToggleExpand}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                >
                    ย่อเมนู
                </button>
            )}
        </section>
    );
}

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
    return (
        <div
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
            role="button"
            tabIndex={0}
            onClick={(e) => {
                if ((e.target as HTMLElement).closest('button')) return;
                onAdd();
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onAdd();
                }
            }}
        >
            {item.imageUrl ? (
                <div className="relative w-full aspect-[4/3] bg-gray-100">
                    <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        sizes="(max-width: 768px) 50vw, 33vw"
                    />
                </div>
            ) : (
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200" />
            )}
            <div className="p-4">
                <div className="font-semibold text-gray-900 text-base mb-2 line-clamp-2">{item.name}</div>
                <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-blue-600">฿{item.priceTHB}</span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onAdd(); }}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        เพิ่ม
                    </button>
                </div>
            </div>
        </div>
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
