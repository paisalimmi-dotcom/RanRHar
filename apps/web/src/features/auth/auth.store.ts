import type { AuthSession, Role } from './auth.types'
import { authApi } from './auth.api'

const SESSION_KEY = 'auth_session'

export const authStore = {
    /**
     * Login with email and password via API
     * Stores token and session in localStorage
     */
    async login(email: string, password: string): Promise<void> {
        try {
            const response = await authApi.login(email, password)

            // Store JWT token
            authApi.storeToken(response.accessToken)

            // Store session data
            const session: AuthSession = {
                email: response.user.email,
                role: response.user.role,
            }
            localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        } catch (error) {
            console.error('Login failed:', error)
            throw error
        }
    },

    logout(): void {
        authApi.clearToken()
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

    /**
     * Validate session with backend
     * Returns true if token is valid, false otherwise
     */
    async validateSession(): Promise<boolean> {
        try {
            const token = authApi.getToken()
            if (!token) return false

            await authApi.getMe()
            return true
        } catch {
            // Token invalid or expired
            this.logout()
            return false
        }
    },
}
