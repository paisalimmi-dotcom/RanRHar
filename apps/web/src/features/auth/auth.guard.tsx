'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Role } from './auth.types'
import { authStore } from './auth.store'

type AuthGuardProps = {
    children: React.ReactNode
    allowedRoles: Role[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const router = useRouter()

    // Compute authorization synchronously from session + allowedRoles
    const session = authStore.getSession()
    const isAuthorized = session && allowedRoles.includes(session.role)

    // useEffect only for navigation side-effects (redirects)
    useEffect(() => {
        if (!session) {
            router.push('/login')
            return
        }

        if (!allowedRoles.includes(session.role)) {
            router.push('/unauthorized')
            return
        }
    }, [router, allowedRoles, session])

    // Render children only when authorized
    if (!isAuthorized) {
        return null
    }

    return <>{children}</>
}
