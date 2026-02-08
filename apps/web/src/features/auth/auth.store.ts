import type { AuthSession } from './auth.types'
import { authApi } from './auth.api'

const SESSION_KEY = 'auth_session'

export const authStore = {
    /**
     * Login with email and password via API
     * Stores token and session in localStorage
     */
    async login(email: string, password: string): Promise<AuthSession> {
        try {
            const response = await authApi.login(email, password)

            // Session data (still useful for UI state, even if token is in cookie)
            const session: AuthSession = {
                email: response.user.email,
                role: response.user.role,
            }
            localStorage.setItem(SESSION_KEY, JSON.stringify(session))
            return session
        } catch (error) {
            console.error('Login failed:', error)
            throw error
        }
    },

    async logout(): Promise<void> {
        try {
            await authApi.logout()
        } catch (error) {
            console.error('Logout failed:', error)
        } finally {
            localStorage.removeItem(SESSION_KEY)
        }
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

    /**
     * Validate session with backend
     */
    async validateSession(): Promise<boolean> {
        try {
            // Just try to get user info - cookie will be sent automatically
            await authApi.getMe()
            return true
        } catch {
            // Token invalid or expired
            await this.logout()
            return false
        }
    },
}
