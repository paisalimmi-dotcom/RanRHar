import type { AuthSession, Role } from './auth.types'

const SESSION_KEY = 'auth_session'

export const authStore = {
    login(email: string, role: Role): void {
        const session: AuthSession = { email, role }
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    },

    logout(): void {
        localStorage.removeItem(SESSION_KEY)
    },

    getSession(): AuthSession | null {
        if (typeof window === 'undefined') return null

        const stored = localStorage.getItem(SESSION_KEY)
        if (!stored) return null

        try {
            return JSON.parse(stored) as AuthSession
        } catch {
            return null
        }
    },
}
