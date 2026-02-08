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
    const [validated, setValidated] = useState<boolean | null>(null)

    const session = authStore.getSession()
    const sessionEmail = session?.email ?? ''
    const rolesKey = allowedRoles.join(',')

    useEffect(() => {
        let cancelled = false

        async function validate() {
            const currentSession = authStore.getSession()
            if (!currentSession) {
                router.push('/login')
                return
            }
            if (!allowedRoles.includes(currentSession.role)) {
                router.push('/unauthorized')
                return
            }
            const ok = await authStore.validateSession()
            if (cancelled) return
            setValidated(ok)
            if (!ok) {
                router.push('/login')
            }
        }

        validate()
        return () => { cancelled = true }
    }, [router, sessionEmail, rolesKey])

    const isAuthorized = session && allowedRoles.includes(session.role) && validated === true

    if (!session || !allowedRoles.includes(session.role)) {
        return null
    }

    if (validated === false || validated === null) {
        return null
    }

    return <>{children}</>
}
