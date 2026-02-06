'use client'

import { useRouter } from 'next/navigation'
import { authStore } from '@/features/auth'

export function LogoutButton() {
    const router = useRouter()

    const handleLogout = () => {
        authStore.logout()
        router.push('/login')
    }

    return (
        <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
        >
            Logout
        </button>
    )
}
