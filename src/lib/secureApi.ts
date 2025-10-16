import { supabase } from './supabase'

/**
 * Secure API Client
 * Handles authenticated requests with automatic token refresh and error handling
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: any
    headers?: Record<string, string>
    requiresCSRF?: boolean
}

interface APIError {
    error: string
    message: string
    code?: string
}

// CSRF token cache
let csrfToken: string | null = null
let csrfTokenExpiry: number = 0

/**
 * Get authentication token from Supabase
 */
async function getAuthToken(): Promise<string | null> {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
        return null
    }

    // Check if token is expiring soon (within 5 minutes)
    const expiresAt = session.expires_at
    if (expiresAt) {
        const now = Math.floor(Date.now() / 1000)
        const timeUntilExpiry = expiresAt - now

        if (timeUntilExpiry <= 300 && timeUntilExpiry > 0) {
            // Token expiring soon, refresh it
            console.log('🔄 Token expiring soon, refreshing...')
            const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()

            if (refreshError || !newSession) {
                console.error('Failed to refresh token:', refreshError)
                return session.access_token
            }

            return newSession.access_token
        }
    }

    return session.access_token
}

/**
 * Get CSRF token
 */
async function getCSRFToken(): Promise<string | null> {
    // Check if cached token is still valid
    const now = Date.now()
    if (csrfToken && now < csrfTokenExpiry) {
        return csrfToken
    }

    try {
        const response = await secureRequest('/api/auth/csrf-token', { method: 'GET', requiresCSRF: false })

        if (response.csrfToken) {
            csrfToken = response.csrfToken
            // Cache for 50 minutes (tokens expire in 60 minutes)
            csrfTokenExpiry = now + (50 * 60 * 1000)
            return csrfToken
        }
    } catch (error) {
        console.error('Failed to get CSRF token:', error)
    }

    return null
}

/**
 * Make a secure authenticated request
 */
export async function secureRequest<T = any>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = 'GET', body, headers = {}, requiresCSRF = false } = options

    // Get auth token
    const token = await getAuthToken()
    if (!token) {
        throw new Error('Not authenticated')
    }

    // Build headers
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...headers,
    }

    // Add CSRF token for state-changing operations
    if (requiresCSRF || ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const csrf = await getCSRFToken()
        if (csrf) {
            requestHeaders['X-CSRF-Token'] = csrf
        }
    }

    // Make request
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'include', // Include cookies
        })

        // Check for token expiry headers
        const tokenExpiring = response.headers.get('X-Token-Expiring')
        if (tokenExpiring === 'true') {
            console.log('⚠️  Token expiring soon, consider refreshing')
            // Could trigger a background refresh here
            supabase.auth.refreshSession().catch(console.error)
        }

        // Handle errors
        if (!response.ok) {
            const errorData: APIError = await response.json()

            // Handle specific error codes
            if (errorData.code === 'TOKEN_EXPIRED') {
                console.log('🔄 Token expired, refreshing...')
                const { error } = await supabase.auth.refreshSession()
                if (!error) {
                    // Retry request with new token
                    return secureRequest(endpoint, options)
                }
            }

            if (errorData.code === 'CSRF_TOKEN_INVALID' || errorData.code === 'CSRF_TOKEN_MISSING') {
                // Clear cached CSRF token and retry
                csrfToken = null
                csrfTokenExpiry = 0
                return secureRequest(endpoint, options)
            }

            throw new Error(errorData.message || 'Request failed')
        }

        return await response.json()
    } catch (error) {
        console.error('Request error:', error)
        throw error
    }
}

/**
 * Convenience methods
 */
export const api = {
    get: <T = any>(endpoint: string, headers?: Record<string, string>) =>
        secureRequest<T>(endpoint, { method: 'GET', headers }),

    post: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
        secureRequest<T>(endpoint, { method: 'POST', body, headers, requiresCSRF: true }),

    put: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
        secureRequest<T>(endpoint, { method: 'PUT', body, headers, requiresCSRF: true }),

    delete: <T = any>(endpoint: string, headers?: Record<string, string>) =>
        secureRequest<T>(endpoint, { method: 'DELETE', headers, requiresCSRF: true }),

    patch: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
        secureRequest<T>(endpoint, { method: 'PATCH', body, headers, requiresCSRF: true }),
}

/**
 * Get current user
 */
export async function getCurrentUser() {
    return api.get('/api/auth/me')
}

/**
 * Get token information
 */
export async function getTokenInfo() {
    return api.get('/api/auth/token-info')
}

/**
 * Refresh and validate token
 */
export async function validateTokenRefresh() {
    const { error } = await supabase.auth.refreshSession()
    if (error) {
        throw error
    }
    return api.post('/api/auth/refresh')
}

/**
 * Clear cached tokens (useful for logout)
 */
export function clearTokenCache() {
    csrfToken = null
    csrfTokenExpiry = 0
}

