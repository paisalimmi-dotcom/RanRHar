'use client'

import { AuthGuard } from '@/features/auth'

export default function AdminPage() {
    return (
        <AuthGuard allowedRoles={['owner']}>
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-gray-600">
                            This page is only accessible to owners.
                        </p>
                    </div>
                </div>
            </div>
        </AuthGuard>
    )
}
