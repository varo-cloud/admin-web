import type { ApiResponse } from '@/types'
import { mockStore } from './store'

export function success<T>(data: T, message = 'ok'): ApiResponse<T> {
  return { code: 0, message, data }
}

export function fail(message: string, code = 1): ApiResponse<null> {
  return { code, message, data: null }
}

export function paginate<T>(items: T[], offset = 0, limit = 20) {
  const slice = items.slice(offset, offset + limit)
  return { items: slice, total: items.length, offset, limit }
}

export function getAuthUserId(headers: Record<string, string>): string | null {
  const auth = headers.authorization || headers.Authorization
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const match = token.match(/^mock_access_(.+)_\d+$/)
  return match?.[1] ?? null
}

export function requireAdmin(headers: Record<string, string>) {
  const userId = getAuthUserId(headers)
  if (!userId) return { ok: false as const, response: fail('Unauthorized', 401) }
  const user = mockStore.users.find((u) => u.id === userId)
  if (!user) return { ok: false as const, response: fail('Unauthorized', 401) }
  if (user.role !== 'admin') return { ok: false as const, response: fail('Forbidden', 403) }
  return { ok: true as const, user }
}

export { ADMIN_EMAIL } from './store'

export function pathParam(url: string, pattern: RegExp): string | undefined {
  return url.split('?')[0]?.match(pattern)?.[1]
}
