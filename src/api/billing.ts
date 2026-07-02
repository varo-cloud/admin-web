import { http, unwrap } from './http'
import type { BillingTransaction, TransactionsPage } from '@/types/admin'
import type { PaymentProvider, TransactionStatus } from '@/types'

export function mapBillingTransaction(raw: Record<string, unknown>): BillingTransaction {
  return {
    id: String(raw.id),
    userId: raw.user_id != null ? String(raw.user_id) : undefined,
    userEmail: raw.user_email != null ? String(raw.user_email) : undefined,
    amountUsd: Number(raw.amount_usd),
    status: raw.status as TransactionStatus,
    provider: raw.provider != null ? (raw.provider as PaymentProvider) : undefined,
    paymentMethod: raw.payment_method != null ? String(raw.payment_method) : null,
    paymentDetail: raw.payment_detail != null ? String(raw.payment_detail) : null,
    providerSessionId:
      raw.provider_session_id != null
        ? String(raw.provider_session_id)
        : raw.stripe_session_id != null
          ? String(raw.stripe_session_id)
          : null,
    receiptUrl: raw.receipt_url != null ? String(raw.receipt_url) : null,
    createdAt: Number(raw.created_at),
    completedAt: raw.completed_at != null ? Number(raw.completed_at) : null,
  }
}

export interface FetchTransactionsParams {
  offset?: number
  limit?: number
  status?: string
  email?: string
  userId?: string
}

export async function fetchTransactions(params: FetchTransactionsParams = {}): Promise<TransactionsPage> {
  const raw = await unwrap<{ items: Record<string, unknown>[]; total: number; offset: number; limit: number }>(
    http.get('/admin/billing/transactions', { params }),
  )
  return {
    items: raw.items.map(mapBillingTransaction),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}
