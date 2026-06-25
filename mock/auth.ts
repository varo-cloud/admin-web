import type { MockMethod } from 'vite-plugin-mock'
import { ADMIN_EMAIL, mockStore } from './store'
import { fail, success } from './_util'

const OTP_TTL_MS = 10 * 60 * 1000
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface OtpEntry {
  code: string
  expiresAt: number
}

interface RefreshTokenEntry {
  userId: string
  expiresAt: number
}

const otpStore = new Map<string, OtpEntry>()
const refreshTokens = new Map<string, RefreshTokenEntry>()

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function generateAccessToken(userId: string) {
  return `mock_access_${userId}_${Date.now()}`
}

function generateRefreshToken() {
  return `rt_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`
}

function parseAccessToken(token: string): string | null {
  const match = token.match(/^mock_access_(.+)_\d+$/)
  return match?.[1] ?? null
}

function getUserIdFromAuth(headers: Record<string, string>): string | null {
  const auth = headers.authorization || headers.Authorization
  if (!auth?.startsWith('Bearer ')) return null
  return parseAccessToken(auth.slice(7))
}

function issueTokenPair(userId: string) {
  const access_token = generateAccessToken(userId)
  const refresh_token = generateRefreshToken()
  refreshTokens.set(refresh_token, { userId, expiresAt: Date.now() + REFRESH_TTL_MS })
  return { access_token, refresh_token, token_type: 'bearer' as const }
}

function resolveUserByEmail(email: string) {
  const normalized = normalizeEmail(email)
  let user = mockStore.users.find((u) => u.email === normalized)
  if (!user && normalized === ADMIN_EMAIL) {
    user = mockStore.users.find((u) => u.id === 'admin-001')
  }
  if (!user && normalized !== ADMIN_EMAIL) {
    const id = `user-${Date.now()}`
    user = {
      id,
      email: normalized,
      role: 'user',
      status: 'active',
      balanceUsd: 3,
      apiKeysCount: 0,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      spentThisMonthUsd: 0,
    }
    mockStore.users.push(user)
  }
  return user
}

export default [
  {
    url: '/api/auth/request-otp',
    method: 'post',
    response: ({ body }: { body: { email?: string; turnstile_token?: string } }) => {
      const email = normalizeEmail(body.email ?? '')
      if (!body.turnstile_token?.trim()) return fail('人机验证失败', 400)
      if (!email.includes('@')) return fail('邮箱格式无效', 422)
      otpStore.set(email, { code: '123456', expiresAt: Date.now() + OTP_TTL_MS })
      console.info(`[admin-mock] OTP for ${email}: 任意 6 位数字均可`)
      return success({ sent: true })
    },
  },
  {
    url: '/api/auth/verify-otp',
    method: 'post',
    response: ({ body }: { body: { email?: string; code?: string; turnstile_token?: string } }) => {
      const email = normalizeEmail(body.email ?? '')
      if (!body.turnstile_token?.trim()) return fail('人机验证失败', 400)
      if (!/^\d{6}$/.test((body.code ?? '').trim())) return fail('验证码无效或已过期', 400)
      otpStore.delete(email)
      const user = resolveUserByEmail(email)
      if (!user) return fail('用户不存在', 404)
      return success(issueTokenPair(user.id))
    },
  },
  {
    url: '/api/auth/refresh',
    method: 'post',
    response: ({ body }: { body: { refresh_token?: string } }) => {
      const entry = refreshTokens.get(body.refresh_token ?? '')
      if (!entry || Date.now() > entry.expiresAt) {
        refreshTokens.delete(body.refresh_token ?? '')
        return fail('Invalid or expired refresh token', 401)
      }
      refreshTokens.delete(body.refresh_token ?? '')
      return success(issueTokenPair(entry.userId))
    },
  },
  {
    url: '/api/user/profile',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const userId = getUserIdFromAuth(headers)
      if (!userId) return fail('Unauthorized', 401)
      const user = mockStore.users.find((u) => u.id === userId)
      if (!user) return fail('Unauthorized', 401)
      return success({
        id: user.id,
        email: user.email,
        role: user.role,
        balance_usd: user.balanceUsd,
      })
    },
  },
] as MockMethod[]
