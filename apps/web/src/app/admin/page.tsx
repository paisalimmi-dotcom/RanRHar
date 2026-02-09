'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/features/auth/auth.guard'
import { StaffNav } from '@/features/auth/components/StaffNav'
import { authStore } from '@/features/auth/auth.store'

export default function AdminPage() {
    const [role, setRole] = useState<string | null>(null)
    useEffect(() => {
        setRole(authStore.getSession()?.role ?? null)
    }, [])

    const isManager = role === 'manager'

    return (
        <AuthGuard allowedRoles={['owner', 'manager']}>
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <StaffNav />
                    </div>
                </header>
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {role === 'owner' && (
                        <p className="mb-6 text-gray-600">
                            หน้าที่คุณ: ดูภาพรวม — ดูรายการออเดอร์ สต็อก ได้ที่เมนูด้านบน
                        </p>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {isManager && (
                            <Link
                                href="/admin/menu"
                                className="block p-6 bg-white rounded-xl shadow hover:shadow-md border border-gray-200 hover:border-blue-300 transition-all"
                            >
                                <span className="text-2xl">🍽️</span>
                                <h2 className="mt-2 text-lg font-semibold text-gray-900">จัดการเมนู</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    แก้ไขชื่อ ราคา รูปภาพ ของรายการเมนู
                                </p>
                            </Link>
                        )}
                    </div>
                </main>
            </div>
        </AuthGuard>
    )
}
