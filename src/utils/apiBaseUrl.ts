/**
 * Resolve API base path for subpath deployments (e.g. GitHub Pages).
 *
 * VITE_API_BASE_URL=/api points to the domain-root API prefix (shared with main site),
 * not under the admin app BASE_URL.
 * Local / GitHub Pages root site: /api
 */
export function apiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL || 'api').trim()

  if (/^https?:\/\//i.test(configured)) {
    return configured.replace(/\/$/, '')
  }

  if (configured.startsWith('/')) {
    return configured.replace(/\/$/, '')
  }

  const apiPath = configured.replace(/^\//, '')
  return `${import.meta.env.BASE_URL}${apiPath}`.replace(/\/$/, '')
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
