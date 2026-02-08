// Auth API Adapter
// Replaces mock localStorage auth with backend API calls

import { apiClient } from '@/lib/api-client';
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
     * Logout via API
     * Clears httpOnly cookie
     */
    async logout(): Promise<void> {
        await apiClient.post('/auth/logout', {}, false);
    },
};
