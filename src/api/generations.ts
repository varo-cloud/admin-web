import { http, unwrap } from './http'
import type {
  AdminGenerationDetail,
  AdminGenerationListItem,
  GenerationsPage,
  RefundResult,
} from '@/types/admin'
import type { GenerationStatus, InvocationChannel } from '@/types'

function mapListItem(raw: Record<string, unknown>): AdminGenerationListItem {
  return {
    taskId: String(raw.task_id),
    userId: String(raw.user_id),
    userEmail: String(raw.user_email),
    modelId: String(raw.model_id),
    apiModelId: String(raw.api_model_id),
    status: raw.status as GenerationStatus,
    costUsd: Number(raw.cost_usd),
    duration: Number(raw.duration),
    invocationChannel: raw.invocation_channel as InvocationChannel,
    apiKeyPrefix: raw.api_key_prefix ? String(raw.api_key_prefix) : null,
    refunded: Boolean(raw.refunded),
    createdAt: Number(raw.created_at),
    completedAt: raw.completed_at ? Number(raw.completed_at) : null,
  }
}

function mapDetail(raw: Record<string, unknown>): AdminGenerationDetail {
  const base = mapListItem(raw)
  return {
    ...base,
    apiKeyId: raw.api_key_id ? String(raw.api_key_id) : null,
    input: (raw.input as Record<string, unknown>) ?? {},
    output: (raw.output as AdminGenerationDetail['output']) ?? null,
    billingRecordId: raw.billing_record_id ? String(raw.billing_record_id) : null,
    upstreamTaskId: raw.upstream_task_id ? String(raw.upstream_task_id) : null,
    upstreamError: raw.upstream_error ? String(raw.upstream_error) : null,
    timeline: ((raw.timeline as { status: GenerationStatus; at: number }[]) ?? []).map((t) => ({
      status: t.status,
      at: t.at,
    })),
  }
}

export interface FetchGenerationsParams {
  offset?: number
  limit?: number
  status?: string
  modelId?: string
  email?: string
  invocationChannel?: string
  refunded?: boolean
}

export async function fetchGenerations(params: FetchGenerationsParams = {}): Promise<GenerationsPage> {
  const query: Record<string, string | number | boolean | undefined> = {
    offset: params.offset,
    limit: params.limit,
  }
  if (params.status) query.status = params.status
  if (params.modelId) query.model_id = params.modelId
  if (params.email) query.email = params.email
  if (params.invocationChannel) query.invocation_channel = params.invocationChannel
  if (params.refunded !== undefined) query.refunded = String(params.refunded)

  const raw = await unwrap<{ items: Record<string, unknown>[]; total: number; offset: number; limit: number }>(
    http.get('/admin/generations', { params: query }),
  )
  return {
    items: raw.items.map(mapListItem),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}

export async function fetchGenerationDetail(taskId: string): Promise<AdminGenerationDetail> {
  const raw = await unwrap<Record<string, unknown>>(
    http.get(`/admin/generations/${encodeURIComponent(taskId)}`),
  )
  return mapDetail(raw)
}

export async function refundGeneration(taskId: string, reason: string): Promise<RefundResult> {
  const raw = await unwrap<{
    task_id: string
    refunded_usd: number
    new_user_balance_usd: number
    billing_record_id: string
  }>(http.post(`/admin/generations/${encodeURIComponent(taskId)}/refund`, { reason }))
  return {
    taskId: raw.task_id,
    refundedUsd: raw.refunded_usd,
    newUserBalanceUsd: raw.new_user_balance_usd,
    billingRecordId: raw.billing_record_id,
  }
}
