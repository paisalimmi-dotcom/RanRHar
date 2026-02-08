// API Client for RanRHar Backend
// Centralized HTTP client with auth, timeout, and retry

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE_URL = `${API_BASE.replace(/\/$/, '')}/v1`;

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

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
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
    requireAuth?: boolean;
    timeout?: number;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = 'GET', body, headers = {}, timeout = DEFAULT_TIMEOUT_MS } = options;

    const url = `${API_BASE_URL}${endpoint}`;

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    const config: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: 'include',
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    config.signal = controller.signal;

    const isMutating = MUTATING_METHODS.includes(method);
    const maxAttempts = isMutating ? 0 : MAX_RETRIES;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch(url, config);

            const contentType = response.headers.get('content-type');
            const isJson = contentType?.includes('application/json');

            if (!response.ok) {
                const errorData = isJson ? await response.json() : await response.text();
                const err = new APIError(
                    (typeof errorData === 'object' && errorData?.error) || `HTTP ${response.status}`,
                    response.status,
                    errorData
                );
                if (!isMutating && response.status >= 500 && attempt < maxAttempts) {
                    lastError = err;
                    await sleep(RETRY_DELAY_MS * (attempt + 1));
                    continue;
                }
                throw err;
            }

            clearTimeout(timeoutId);
            return isJson ? await response.json() : ({} as T);
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof APIError) throw error;

            const isRetryable =
                !isMutating &&
                (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) &&
                attempt < maxAttempts;

            if (isRetryable) {
                lastError = error;
                await sleep(RETRY_DELAY_MS * (attempt + 1));
                continue;
            }

            throw new APIError('Network error', 0, lastError ?? error);
        }
    }

    throw new APIError('Network error', 0, lastError);
}

export const apiClient = {
    get: <T>(endpoint: string, requireAuth = false) =>
        apiRequest<T>(endpoint, { method: 'GET', requireAuth }),

    post: <T>(endpoint: string, body: unknown, requireAuth = false) =>
        apiRequest<T>(endpoint, { method: 'POST', body, requireAuth }),

    put: <T>(endpoint: string, body: unknown, requireAuth = false) =>
        apiRequest<T>(endpoint, { method: 'PUT', body, requireAuth }),

    patch: <T>(endpoint: string, body: unknown, requireAuth = false) =>
        apiRequest<T>(endpoint, { method: 'PATCH', body, requireAuth }),

    delete: <T>(endpoint: string, requireAuth = false) =>
        apiRequest<T>(endpoint, { method: 'DELETE', requireAuth }),
};

