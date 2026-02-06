'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Role } from './auth.types'
import { authStore } from './auth.store'

type AuthGuardProps = {
    children: React.ReactNode
    allowedRoles: Role[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        const session = authStore.getSession()

        if (!session) {
            router.push('/login')
            return
        }

        if (!allowedRoles.includes(session.role)) {
            router.push('/unauthorized')
            return
        }

        setIsAuthorized(true)
    }, [router, allowedRoles])

    if (!isAuthorized) {
        return null
    }

    return <>{children}</>
}
