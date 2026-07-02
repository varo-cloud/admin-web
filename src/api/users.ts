import { http, unwrap } from './http'
import { mapBillingTransaction } from './billing'
import type {
  AdminUserDetail,
  AdminUserGenerationItem,
  AdminUserListItem,
  BalanceAdjustmentPayload,
  BalanceAdjustmentResult,
  BillingTransaction,
  UsersPage,
} from '@/types/admin'
import type { GenerationStatus, InvocationChannel, Paginated } from '@/types'

interface ApiUserListItem {
  id: string
  email: string
  role: 'user' | 'admin'
  status: 'active' | 'suspended'
  balance_usd: number
  api_keys_count: number
  created_at: number
  last_active_at: number | null
}

function mapUserListItem(raw: ApiUserListItem): AdminUserListItem {
  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    status: raw.status,
    balanceUsd: raw.balance_usd,
    apiKeysCount: raw.api_keys_count,
    createdAt: raw.created_at,
    lastActiveAt: raw.last_active_at,
  }
}

export interface FetchUsersParams {
  offset?: number
  limit?: number
  q?: string
  role?: string
  status?: string
  sort?: string
}

export async function fetchUsers(params: FetchUsersParams = {}): Promise<UsersPage> {
  const raw = await unwrap<{ items: ApiUserListItem[]; total: number; offset: number; limit: number }>(
    http.get('/admin/users', { params }),
  )
  return {
    items: raw.items.map(mapUserListItem),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}

export async function fetchUserDetail(userId: string): Promise<AdminUserDetail> {
  const raw = await unwrap<{
    id: string
    email: string
    role: 'user' | 'admin'
    status: 'active' | 'suspended'
    balance_usd: number
    balance_credits: number
    created_at: number
    api_keys: {
      id: string
      name: string
      prefix: string
      is_active: boolean
      last_used_at: number | null
      created_at: number
    }[]
    model_preferences: { favourites: string[]; recent: { id: string; visited_at: number }[] }
  }>(http.get(`/admin/users/${userId}`))

  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    status: raw.status,
    balanceUsd: raw.balance_usd,
    balanceCredits: raw.balance_credits,
    createdAt: raw.created_at,
    apiKeys: raw.api_keys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      isActive: k.is_active,
      lastUsedAt: k.last_used_at,
      createdAt: k.created_at,
    })),
    modelPreferences: {
      favourites: raw.model_preferences.favourites,
      recent: raw.model_preferences.recent.map((r) => ({ id: r.id, visitedAt: r.visited_at })),
    },
  }
}

export async function adjustUserBalance(
  userId: string,
  payload: BalanceAdjustmentPayload,
): Promise<BalanceAdjustmentResult> {
  const raw = await unwrap<{
    user_id: string
    previous_balance_usd: number
    new_balance_usd: number
    adjustment_usd: number
    billing_record_id: string
  }>(http.post(`/admin/users/${userId}/balance-adjustment`, {
    amount_usd: payload.amountUsd,
    type: payload.type,
    reason: payload.reason,
    idempotency_key: payload.idempotencyKey,
  }))
  return {
    userId: raw.user_id,
    previousBalanceUsd: raw.previous_balance_usd,
    newBalanceUsd: raw.new_balance_usd,
    adjustmentUsd: raw.adjustment_usd,
    billingRecordId: raw.billing_record_id,
  }
}

export async function fetchUserTransactions(userId: string): Promise<Paginated<BillingTransaction>> {
  const raw = await unwrap<{ items: Record<string, unknown>[]; total: number; offset: number; limit: number }>(
    http.get(`/admin/users/${userId}/billing/transactions`),
  )
  return {
    items: raw.items.map(mapBillingTransaction),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}

function mapUserGeneration(raw: Record<string, unknown>): AdminUserGenerationItem {
  return {
    taskId: String(raw.task_id),
    model: raw.model != null ? String(raw.model) : String(raw.model_id ?? ''),
    duration: Number(raw.duration),
    costUsd: Number(raw.cost_usd),
    status: raw.status as GenerationStatus,
    invocationChannel: raw.invocation_channel as InvocationChannel,
    refunded: Boolean(raw.refunded),
    createdAt: Number(raw.created_at),
  }
}

export async function fetchUserGenerations(
  userId: string,
  params: { offset?: number; limit?: number } = {},
): Promise<Paginated<AdminUserGenerationItem>> {
  const raw = await unwrap<{ items: Record<string, unknown>[]; total: number; offset: number; limit: number }>(
    http.get(`/admin/users/${userId}/generations`, { params }),
  )
  return {
    items: raw.items.map(mapUserGeneration),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}
