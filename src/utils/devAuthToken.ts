const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

function readEnvToken(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed || null
}

export function getDevAuthTokenFromEnv(): string | null {
  return (
    readEnvToken(import.meta.env.VITE_DEV_AUTH_TOKEN) ??
    readEnvToken(import.meta.env.VITE_DEV_BEARER_TOKEN)
  )
}

export function getDevRefreshTokenFromEnv(): string | null {
  return readEnvToken(import.meta.env.VITE_DEV_REFRESH_TOKEN)
}

export function hasDevAuthEnv(): boolean {
  return import.meta.env.DEV && Boolean(getDevAuthTokenFromEnv())
}

export function initDevAuthFromEnv(): boolean {
  if (!import.meta.env.DEV) return false

  const accessToken = getDevAuthTokenFromEnv()
  if (!accessToken) return false

  localStorage.setItem(TOKEN_KEY, accessToken)

  const refreshToken = getDevRefreshTokenFromEnv()
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  return true
}

/** Mock 开发：无 token 时写入管理员 mock token，便于独立启动 admin-web。 */
export function initMockAdminTokenIfNeeded(): boolean {
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'false') return false
  if (localStorage.getItem(TOKEN_KEY)) return false

  localStorage.setItem(TOKEN_KEY, `mock_access_admin-001_${Date.now()}`)
  return true
}

export function resolveRequestBearerToken(): string | null {
  const stored = localStorage.getItem(TOKEN_KEY)
  if (stored) return stored

  if (import.meta.env.DEV) {
    return getDevAuthTokenFromEnv()
  }

  return null
}

export function resolveRefreshToken(): string | null {
  const stored = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (stored) return stored

  if (import.meta.env.DEV) {
    return getDevRefreshTokenFromEnv()
  }

  return null
}
