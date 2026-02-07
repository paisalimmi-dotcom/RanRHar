// Auth API Adapter
// Replaces mock localStorage auth with backend API calls

import { apiClient, TOKEN_KEY } from '@/lib/api-client';
import type { AuthResponse, User } from './auth.types';

export const authApi = {
    /**
     * Login with email and password
     * Returns JWT token and user data
     */
    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>(
            '/auth/login',
            { email, password },
            false // No auth required for login
        );
        return response;
    },

    /**
     * Get current user info using stored token
     * Validates token and returns user data
     */
    async getMe(): Promise<User> {
        const response = await apiClient.get<User>(
            '/me',
            true // Auth required
        );
        return response;
    },

    /**
     * Store auth token in localStorage
     */
    storeToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, token);
        }
    },

    /**
     * Remove auth token from localStorage
     */
    clearToken(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
        }
    },

    /**
     * Get stored auth token
     */
    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(TOKEN_KEY);
    },
};
