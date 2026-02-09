'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authStore } from '@/features/auth/auth.store';

import type { Role } from '@/features/auth/auth.types';

type NavLink = {
    href: string;
    label: string;
    desc: string;
    icon: string;
    roles?: Role[];
};

const ALL_LINKS: NavLink[] = [
    { href: '/menu/A12', label: 'ดูเมนู', desc: 'สั่งอาหารที่โต๊ะ', icon: '◉' },
    { href: '/login', label: 'เข้าสู่ระบบ', desc: 'Staff · Manager · Cashier · Chef · Host · Delivery', icon: '◆' },
    { href: '/staff/kds', label: 'KDS (ครัว)', desc: 'หน้าจอแสดงออเดอร์สำหรับพ่อครัว', icon: '🍳', roles: ['manager', 'staff', 'chef'] },
    { href: '/orders', label: 'รายการออเดอร์', desc: 'จัดการคำสั่งซื้อ บันทึกการชำระ', icon: '○', roles: ['owner', 'manager', 'staff', 'cashier', 'chef', 'host', 'delivery'] },
    { href: '/inventory', label: 'จัดการสต็อก', desc: 'คลังสินค้าและวัตถุดิบ', icon: '◇', roles: ['manager', 'staff'] },
    { href: '/staff/tables', label: 'สรุปโต๊ะ', desc: 'ออเดอร์ตามสถานะ สำหรับพนักงานเสิร์ฟ', icon: '◎', roles: ['owner', 'manager', 'staff', 'cashier', 'host', 'delivery'] },
    { href: '/admin', label: 'Admin', desc: 'จัดการเมนู ตั้งค่าร้าน', icon: '⚙', roles: ['owner', 'manager'] },
];

export default function StaffPage() {
    const [links, setLinks] = useState<NavLink[]>([]);

    useEffect(() => {
        const session = authStore.getSession();
        const role = session?.role;

        if (!role) {
            setLinks(ALL_LINKS.filter((l) => l.href !== '/admin'));
        } else {
            setLinks(
                ALL_LINKS.filter(
                    (l) =>
                        l.href === '/menu/A12' ||
                        !l.roles ||
                        l.roles.includes(role)
                )
            );
        }
    }, []);

    return (
        <main className="min-h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
            <div className="fixed inset-0 pointer-events-none">
                <div
                    className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-40"
                    style={{ backgroundColor: 'var(--accent-subtle)' }}
                />
                <div
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-30"
                    style={{ backgroundColor: 'var(--accent-subtle)' }}
                />
            </div>

            <div className="relative min-h-screen flex flex-col">
                <header className="flex-1 flex flex-col items-center justify-center px-6 py-24">
                    <p
                        className="text-sm tracking-[0.3em] uppercase mb-4 font-medium"
                        style={{ color: 'var(--accent)' }}
                    >
                        Staff Portal
                    </p>
                    <h1 className="font-display text-6xl sm:text-7xl md:text-8xl font-medium tracking-tight text-center">
                        RanRHar
                    </h1>
                    <p className="mt-6 text-lg max-w-md text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        เข้าสู่ระบบหรือจัดการร้านอาหาร
                    </p>
                </header>

                <nav className="px-6 pb-24">
                    <div className="max-w-3xl mx-auto">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {links.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group relative flex items-center gap-5 p-6 rounded-xl border backdrop-blur-xl transition-all duration-500 overflow-hidden hover:border-[var(--accent-muted)]"
                                    style={{
                                        borderColor: 'var(--border)',
                                        backgroundColor: 'var(--bg-card)',
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                        style={{ background: 'linear-gradient(to right, var(--accent-subtle), transparent)' }}
                                    />
                                    <span
                                        className="relative text-2xl font-display transition-colors duration-300 group-hover:opacity-100 opacity-60"
                                        style={{ color: 'var(--accent)' }}
                                    >
                                        {item.icon}
                                    </span>
                                    <div className="relative flex-1 min-w-0">
                                        <div
                                            className="font-semibold text-lg transition-colors duration-300 group-hover:opacity-100"
                                            style={{ color: 'var(--text)' }}
                                        >
                                            {item.label}
                                        </div>
                                        <div
                                            className="text-sm mt-1 transition-colors duration-300"
                                            style={{ color: 'var(--text-subtle)' }}
                                        >
                                            {item.desc}
                                        </div>
                                    </div>
                                    <span
                                        className="relative text-xl transition-all duration-300 group-hover:translate-x-1"
                                        style={{ color: 'var(--accent)' }}
                                    >
                                        →
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </nav>

                <footer className="px-6 py-8 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-center text-sm" style={{ color: 'var(--text-subtle)' }}>
                        © RanRHar · ระบบ POS สำหรับร้านอาหาร
                    </p>
                </footer>
            </div>
        </main>
    );
}
