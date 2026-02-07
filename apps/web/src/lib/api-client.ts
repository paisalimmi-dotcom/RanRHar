// API Client for RanRHar Backend
// Centralized HTTP client with auth token injection

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'auth_token';

export class APIError extends Error {
    constructor(
        message: string,
        public status: number,
        public data?: unknown
    ) {
        super(message);
        this.name = 'APIError';
    }
}

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
    requireAuth?: boolean;
}

async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = 'GET', body, headers = {}, requireAuth = false } = options;

    const url = `${API_BASE_URL}${endpoint}`;

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    // Inject auth token if required
    if (requireAuth && typeof window !== 'undefined') {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
        }
    }

    const config: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: 'include',
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, config);

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        const isJson = contentType?.includes('application/json');

        if (!response.ok) {
            const errorData = isJson ? await response.json() : await response.text();
            throw new APIError(
                errorData?.error || `HTTP ${response.status}`,
                response.status,
                errorData
            );
        }

        return isJson ? await response.json() : ({} as T);
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError('Network error', 0, error);
    }
}

export const apiClient = {
    get: <T>(endpoint: string, requireAuth = false) =>
        apiRequest<T>(endpoint, { method: 'GET', requireAuth }),

    post: <T>(endpoint: string, body: unknown, requireAuth = false) =>
        apiRequest<T>(endpoint, { method: 'POST', body, requireAuth }),

    put: <T>(endpoint: string, body: unknown, requireAuth = false) =>
        apiRequest<T>(endpoint, { method: 'PUT', body, requireAuth }),

    delete: <T>(endpoint: string, requireAuth = false) =>
        apiRequest<T>(endpoint, { method: 'DELETE', requireAuth }),
};

export { TOKEN_KEY };
