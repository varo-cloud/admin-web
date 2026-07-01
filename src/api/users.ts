import { http, unwrap } from './http'
import type {
  AdminUserDetail,
  AdminUserListItem,
  BalanceAdjustmentPayload,
  BalanceAdjustmentResult,
  BillingRecord,
  BillingTransaction,
  UsersPage,
} from '@/types/admin'
import type { Paginated } from '@/types'

interface ApiUserListItem {
  id: string
  email: string
  role: 'user' | 'admin'
  status: 'active' | 'suspended'
  balance_usd: number
  api_keys_count: number
  created_at: number
  last_active_at: number
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
    spent_this_month_usd: number
    created_at: number
    api_keys: {
      id: string
      name: string
      prefix: string
      is_active: boolean
      total_calls: number
      total_spend_usd: number
      last_used_at: number | null
      created_at: number
    }[]
    auto_top_up: { enabled: boolean; threshold_usd: number; package_id: string }
    model_preferences: { favourites: string[]; recent: { id: string; visited_at: number }[] }
  }>(http.get(`/admin/users/${userId}`))

  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    status: raw.status,
    balanceUsd: raw.balance_usd,
    balanceCredits: raw.balance_credits,
    spentThisMonthUsd: raw.spent_this_month_usd,
    createdAt: raw.created_at,
    apiKeys: raw.api_keys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      isActive: k.is_active,
      totalCalls: k.total_calls,
      totalSpendUsd: k.total_spend_usd,
      lastUsedAt: k.last_used_at,
      createdAt: k.created_at,
    })),
    autoTopUp: {
      enabled: raw.auto_top_up.enabled,
      thresholdUsd: raw.auto_top_up.threshold_usd,
      packageId: raw.auto_top_up.package_id,
    },
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

export async function updateUserStatus(userId: string, status: 'active' | 'suspended') {
  return unwrap(http.patch(`/admin/users/${userId}`, { status }))
}

export async function fetchUserTransactions(userId: string): Promise<Paginated<BillingTransaction>> {
  const raw = await unwrap<{ items: Record<string, unknown>[]; total: number; offset: number; limit: number }>(
    http.get(`/admin/users/${userId}/billing/transactions`),
  )
  return {
    items: raw.items.map(mapTransaction),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}

export async function fetchUserBillingRecords(userId: string): Promise<Paginated<BillingRecord>> {
  const raw = await unwrap<{ items: Record<string, unknown>[]; total: number; offset: number; limit: number }>(
    http.get(`/admin/users/${userId}/billing/records`),
  )
  return {
    items: raw.items.map((r) => ({
      id: String(r.id),
      style: String(r.style),
      detail: String(r.detail),
      amountUsd: Number(r.amount_usd),
      createdAt: Number(r.created_at),
    })),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}

function mapTransaction(raw: Record<string, unknown>): BillingTransaction {
  return {
    id: String(raw.id),
    userId: String(raw.user_id),
    userEmail: String(raw.user_email),
    amountUsd: Number(raw.amount_usd),
    packageId: String(raw.package_id),
    status: raw.status as BillingTransaction['status'],
    paymentMethod: String(raw.payment_method),
    paymentDetail: String(raw.payment_detail),
    stripeSessionId: String(raw.stripe_session_id),
    receiptUrl: raw.receipt_url ? String(raw.receipt_url) : null,
    createdAt: Number(raw.created_at),
    completedAt: raw.completed_at ? Number(raw.completed_at) : null,
  }
}
