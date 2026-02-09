'use client';

import Link from 'next/link';
import { authStore } from '../auth.store';
import { LogoutButton } from '../LogoutButton';

import type { Role } from '../auth.types';

type NavItem = {
    href: string;
    label: string;
    roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
    { href: '/staff', label: 'Staff', roles: ['owner', 'manager', 'staff', 'cashier', 'chef', 'host', 'delivery'] },
    { href: '/orders', label: 'ออเดอร์', roles: ['owner', 'manager', 'staff', 'cashier', 'chef', 'host', 'delivery'] },
    { href: '/staff/tables', label: 'สรุปโต๊ะ', roles: ['owner', 'manager', 'staff', 'cashier', 'host', 'delivery'] },
    { href: '/staff/kds', label: 'KDS (ครัว)', roles: ['manager', 'staff', 'chef'] },
    { href: '/inventory', label: 'สต็อก', roles: ['manager', 'staff'] },
    { href: '/admin', label: 'Admin', roles: ['owner', 'manager'] },
];

export function StaffNav({ dark }: { dark?: boolean }) {
    const session = authStore.getSession();
    const role = session?.role;

    if (!role) return null;

    const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
    const linkClass = dark
        ? 'text-gray-300 hover:text-white font-medium text-sm'
        : 'text-gray-600 hover:text-gray-900 font-medium text-sm';

    return (
        <nav className="flex items-center gap-4">
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={linkClass}
                >
                    {item.label}
                </Link>
            ))}
            <LogoutButton />
        </nav>
    );
}
