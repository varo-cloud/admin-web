import { http, unwrap } from './http'
import type { BillingTransaction, TransactionsPage } from '@/types/admin'
import type { TransactionStatus } from '@/types'

function mapTransaction(raw: Record<string, unknown>): BillingTransaction {
  return {
    id: String(raw.id),
    userId: String(raw.user_id),
    userEmail: String(raw.user_email),
    amountUsd: Number(raw.amount_usd),
    packageId: String(raw.package_id),
    status: raw.status as TransactionStatus,
    paymentMethod: String(raw.payment_method),
    paymentDetail: String(raw.payment_detail),
    stripeSessionId: String(raw.stripe_session_id),
    receiptUrl: raw.receipt_url ? String(raw.receipt_url) : null,
    createdAt: Number(raw.created_at),
    completedAt: raw.completed_at ? Number(raw.completed_at) : null,
  }
}

export interface FetchTransactionsParams {
  offset?: number
  limit?: number
  status?: string
  email?: string
}

export async function fetchTransactions(params: FetchTransactionsParams = {}): Promise<TransactionsPage> {
  const raw = await unwrap<{ items: Record<string, unknown>[]; total: number; offset: number; limit: number }>(
    http.get('/admin/billing/transactions', { params }),
  )
  return {
    items: raw.items.map(mapTransaction),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}
