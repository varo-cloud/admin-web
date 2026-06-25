/**
 * App base path prefix for subpath deployments (e.g. GitHub Pages /admin-web/).
 * API paths in code start with `/api/...`; axios joins baseURL + path.
 */
export function apiBaseUrl(): string {
  const base = import.meta.env.BASE_URL || '/'
  if (base === '/') return ''
  return base.endsWith('/') ? base.slice(0, -1) : base
}

/** Strip deploy base so mock routes can match `/api/...` paths. */
export function stripDeployBase(pathname: string): string {
  const prefix = apiBaseUrl()
  if (prefix && pathname.startsWith(prefix)) {
    const rest = pathname.slice(prefix.length)
    return rest.startsWith('/') ? rest : `/${rest}`
  }
  return pathname
}

/** Map mock route `/api/...` to the deployed URL prefix (for logging/debug). */
export function toProdMockUrl(mockUrl: string): string {
  const prefix = apiBaseUrl()
  return prefix ? `${prefix}${mockUrl}` : mockUrl
}
