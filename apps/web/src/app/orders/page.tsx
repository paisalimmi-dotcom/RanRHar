'use client'

import { AuthGuard } from '@/features/auth'

export default function OrdersPage() {
    return (
        <AuthGuard allowedRoles={['owner', 'staff']}>
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Orders</h1>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-gray-600">
                            This page is accessible to owners and staff.
                        </p>
                    </div>
                </div>
            </div>
        </AuthGuard>
    )
}
