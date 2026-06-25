import { http, unwrap } from './http'
import type { AdminApiKeyListItem, ApiKeysPage } from '@/types/admin'

function mapKey(raw: Record<string, unknown>): AdminApiKeyListItem {
  return {
    id: String(raw.id),
    userId: String(raw.user_id),
    userEmail: String(raw.user_email),
    name: String(raw.name),
    prefix: String(raw.prefix),
    isActive: Boolean(raw.is_active),
    totalCalls: Number(raw.total_calls),
    totalSpendUsd: Number(raw.total_spend_usd),
    lastUsedAt: raw.last_used_at ? Number(raw.last_used_at) : null,
    createdAt: Number(raw.created_at),
  }
}

export async function fetchApiKeys(params: Record<string, unknown> = {}): Promise<ApiKeysPage> {
  const raw = await unwrap<{ items: Record<string, unknown>[]; total: number; offset: number; limit: number }>(
    http.get('/api/admin/api-keys', { params }),
  )
  return { items: raw.items.map(mapKey), total: raw.total, offset: raw.offset, limit: raw.limit }
}

export async function revokeApiKey(keyId: string) {
  return unwrap(http.delete(`/api/admin/api-keys/${keyId}`))
}
