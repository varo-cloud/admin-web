import { http, unwrap } from './http'
import type {
  AdminGenerationDetail,
  AdminGenerationListItem,
  GenerationsPage,
  RefundResult,
} from '@/types/admin'
import type { GenerationStatus, InvocationChannel } from '@/types'

function resolveModel(raw: Record<string, unknown>): string {
  if (raw.model != null) return String(raw.model)
  if (raw.model_id != null) return String(raw.model_id)
  return ''
}

function mapListItem(raw: Record<string, unknown>): AdminGenerationListItem {
  return {
    taskId: String(raw.task_id),
    userId: String(raw.user_id),
    userEmail: String(raw.user_email),
    model: resolveModel(raw),
    status: raw.status as GenerationStatus,
    costUsd: Number(raw.cost_usd),
    duration: Number(raw.duration),
    invocationChannel: raw.invocation_channel as InvocationChannel,
    apiKeyPrefix: raw.api_key_prefix ? String(raw.api_key_prefix) : null,
    refunded: Boolean(raw.refunded),
    createdAt: Number(raw.created_at),
  }
}

function mapDetail(raw: Record<string, unknown>): AdminGenerationDetail {
  const result = raw.result as Record<string, unknown> | undefined
  const legacyOutput = (raw.output as AdminGenerationDetail['output']) ?? null
  const output: AdminGenerationDetail['output'] =
    result && (result.output_url != null || result.type != null)
      ? {
          type: String(result.type ?? 'unknown'),
          url: result.output_url != null ? String(result.output_url) : undefined,
        }
      : legacyOutput
  const outputUrl =
    result?.output_url != null
      ? String(result.output_url)
      : raw.output_url != null
        ? String(raw.output_url)
        : output?.url != null
          ? String(output.url)
          : undefined
  const input =
    (raw.request as Record<string, unknown> | undefined) ??
    (raw.input as Record<string, unknown> | undefined) ??
    {}
  return {
    ...mapListItem(raw),
    apiKeyId: raw.api_key_id ? String(raw.api_key_id) : null,
    input,
    output,
    outputUrl,
    billingRecordId: raw.billing_record_id ? String(raw.billing_record_id) : null,
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
