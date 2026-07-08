function resolveApiBaseUrl(configured: string): string {
  const value = configured.trim()

  if (/^https?:\/\//i.test(value)) {
    return value.replace(/\/$/, '')
  }

  if (value.startsWith('/')) {
    return value.replace(/\/$/, '')
  }

  const apiPath = value.replace(/^\//, '')
  return `${import.meta.env.BASE_URL}${apiPath}`.replace(/\/$/, '')
}

/**
 * Admin API base (default axios client). Deployed: https://admin.varo.cloud/api
 */
export function apiBaseUrl(): string {
  return resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL || 'api')
}

/**
 * User / auth API base (profile, token refresh). Deployed: https://api.varo.cloud/api
 * Falls back to VITE_API_BASE_URL when unset (local dev proxy on /api).
 */
export function userApiBaseUrl(): string {
  const configured = import.meta.env.VITE_USER_API_BASE_URL?.trim()
  if (configured) return resolveApiBaseUrl(configured)
  return apiBaseUrl()
}

/** Map mock route like `/api/models/:id` to the deployed API prefix. */
export function toProdMockUrl(mockUrl: string): string {
  const base = apiBaseUrl()

  if (mockUrl.startsWith('/api')) {
    return mockUrl.replace(/^\/api/, base)
  }

  const normalized = mockUrl.startsWith('/') ? mockUrl : `/${mockUrl}`
  return `${base}${normalized}`
}

/** Map user/auth mock routes to the user API prefix. */
export function toProdUserMockUrl(mockUrl: string): string {
  const base = userApiBaseUrl()

  if (mockUrl.startsWith('/api')) {
    return mockUrl.replace(/^\/api/, base)
  }

  const normalized = mockUrl.startsWith('/') ? mockUrl : `/${mockUrl}`
  return `${base}${normalized}`
}
