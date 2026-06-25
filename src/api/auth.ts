import { http, setRefreshToken, setToken, unwrap } from './http'
import type { AdminProfile, ApiResponse, TokenPair } from '@/types'

interface ApiProfile {
  id: string
  email: string
  role: 'user' | 'admin'
  balance_usd: number
}

export async function requestOtp(email: string, turnstileToken: string) {
  return unwrap(http.post('/api/auth/request-otp', { email, turnstile_token: turnstileToken }))
}

export async function verifyOtp(email: string, code: string, turnstileToken: string) {
  const tokens = await unwrap<TokenPair>(
    http.post('/api/auth/verify-otp', { email, code, turnstile_token: turnstileToken }),
  )
  setToken(tokens.access_token)
  setRefreshToken(tokens.refresh_token)
  return tokens
}

export async function fetchProfile(): Promise<AdminProfile> {
  const raw = await unwrap<ApiProfile>(http.get('/api/user/profile'))
  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    balanceUsd: raw.balance_usd,
  }
}

export async function logout() {
  const refreshToken = localStorage.getItem('admin_refresh_token')
  if (refreshToken) {
    try {
      await http.post<ApiResponse<{ revoked: boolean }>>('/api/auth/logout', {
        refresh_token: refreshToken,
      })
    } catch {
      /* ignore */
    }
  }
}
