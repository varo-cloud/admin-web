import { http, unwrap } from './http'
import type {
  AdminGenerationDetail,
  AdminGenerationListItem,
  GenerationUpstreamStatus,
  GenerationUpstreamUsage,
  GenerationsPage,
  RefundResult,
  RehostResult,
} from '@/types/admin'
import type { GenerationStatus, InvocationChannel } from '@/types'

function resolveModel(raw: Record<string, unknown>): string {
  if (raw.model != null) return String(raw.model)
  if (raw.model_id != null) return String(raw.model_id)
  return ''
}

function mapUpstreamCostUsd(raw: Record<string, unknown>): number | null {
  if (raw.upstream_cost_usd == null) return null
  const n = Number(raw.upstream_cost_usd)
  return Number.isFinite(n) ? n : null
}

function mapUpstreamUsage(raw: Record<string, unknown>): GenerationUpstreamUsage | null {
  const usage = raw.upstream_usage
  if (usage == null || typeof usage !== 'object') return null
  const u = usage as Record<string, unknown>
  return {
    totalTokens: Number(u.total_tokens ?? 0),
    promptTokens: Number(u.prompt_tokens ?? 0),
    completionTokens: Number(u.completion_tokens ?? 0),
    cachedTokens: Number(u.cached_tokens ?? 0),
    reasoningTokens: Number(u.reasoning_tokens ?? 0),
    cacheCreationTokens: Number(u.cache_creation_tokens ?? 0),
  }
}

function mapListItem(raw: Record<string, unknown>): AdminGenerationListItem {
  return {
    taskId: String(raw.task_id),
    userId: String(raw.user_id),
    userEmail: String(raw.user_email),
    model: resolveModel(raw),
    status: raw.status as GenerationStatus,
    costUsd: Number(raw.cost_usd),
    upstreamCostUsd: mapUpstreamCostUsd(raw),
    duration: Number(raw.duration),
    invocationChannel: raw.invocation_channel as InvocationChannel,
    apiKeyPrefix: raw.api_key_prefix ? String(raw.api_key_prefix) : null,
    refunded: Boolean(raw.refunded),
    errorCode: raw.error_code != null ? String(raw.error_code) : null,
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
    category: raw.category != null ? String(raw.category) : null,
    capability: raw.capability != null ? String(raw.capability) : null,
    apiKeyId: raw.api_key_id ? String(raw.api_key_id) : null,
    upstreamUsage: mapUpstreamUsage(raw),
    costAttempts: raw.cost_attempts != null ? Number(raw.cost_attempts) : 0,
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

export async function rehostGeneration(taskId: string): Promise<RehostResult> {
  const raw = await unwrap<{ task_id: string; status: string }>(
    http.post(`/admin/generations/${encodeURIComponent(taskId)}/rehost`),
  )
  return {
    taskId: raw.task_id,
    status: raw.status,
  }
}

export async function fetchGenerationUpstreamStatus(taskId: string): Promise<GenerationUpstreamStatus> {
  const raw = await unwrap<{
    task_id: string
    model: string
    our_status: string
    provider_used?: string | null
    provider_task_id?: string | null
    route_provider?: string | null
    upstream?: {
      url?: string | null
      http_status?: number | null
      body?: unknown
    } | null
  }>(http.get(`/admin/generations/${encodeURIComponent(taskId)}/upstream-status`))

  const upstream = raw.upstream
  return {
    taskId: raw.task_id,
    model: raw.model,
    ourStatus: raw.our_status,
    providerUsed: raw.provider_used ?? null,
    providerTaskId: raw.provider_task_id ?? null,
    routeProvider: raw.route_provider ?? null,
    upstream: upstream
      ? {
          url: upstream.url ?? null,
          httpStatus: upstream.http_status ?? null,
          body: upstream.body ?? null,
        }
      : null,
  }
}
