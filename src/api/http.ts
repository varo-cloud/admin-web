import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, TokenPair } from '@/types'
import { apiBaseUrl, userApiBaseUrl } from '@/utils/apiBaseUrl'
import { resolveRefreshToken, resolveRequestBearerToken } from '@/utils/devAuthToken'

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

function isAuthExemptUrl(url?: string): boolean {
  if (!url) return false
  return url.includes('/auth/refresh') || url.includes('/auth/logout')
}

let refreshPromise: Promise<string | null> | null = null

async function tryRefreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken() ?? resolveRefreshToken()
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { data } = await axios.post<ApiResponse<TokenPair>>(
          `${userApiBaseUrl()}/auth/refresh`,
          { refresh_token: refreshToken },
        )
        if (data.code !== 0 || !data.data) throw new Error(data.message)
        setToken(data.data.access_token)
        setRefreshToken(data.data.refresh_token)
        return data.data.access_token
      } catch {
        clearAuthTokens()
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

function attachApiInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use((config) => {
    const token = resolveRequestBearerToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  client.interceptors.response.use(
    (response) => {
      const payload = response.data as ApiResponse<unknown>
      if (payload.code !== 0) return Promise.reject(new Error(payload.message || 'Request failed'))
      return response
    },
    async (error: AxiosError<ApiResponse<unknown>>) => {
      const config = error.config as RetryableRequestConfig | undefined
      const payload = error.response?.data
      const isUnauthorized = error.response?.status === 401 || payload?.code === 401

      if (
        config &&
        !config._retry &&
        isUnauthorized &&
        !isAuthExemptUrl(config.url)
      ) {
        config._retry = true
        const newToken = await tryRefreshAccessToken()
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`
          return client(config)
        }
      }

      return Promise.reject(new Error(payload?.message || error.message || 'Request failed'))
    },
  )
}

function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 15000 })
  attachApiInterceptors(client)
  return client
}

/** Admin API client (`/admin/*`). */
export const http = createApiClient(apiBaseUrl())

/** User / auth API client (`/user/*`, `/auth/*`). */
export const userHttp = createApiClient(userApiBaseUrl())

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function clearAuthTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await promise
  return data.data
}
