import { http, unwrap } from './http'
import type { AdminModelDetail, AdminModelListItem, ModelsPage } from '@/types/admin'
import type { ModelFaqItem, PricingPriceUnit } from '@/types'

interface ApiModelListItem {
  id: string
  name: string
  display_name?: string
  provider: string
  capabilities: string[]
  active: boolean
  is_hot: boolean
  starting_price_usd: number
  price_unit: PricingPriceUnit
  sort_order: number
  updated_at: number
}

interface ApiModelDetail extends ApiModelListItem {
  description: string
  thumbnail_url?: string
  model_path: string
  api_model_id: string
  standard_price_usd?: number
  price_detail?: string
  discount_percent?: number
  per_run_price_usd?: number
  runs_per_ten_usd?: number
  input_schema: Record<string, unknown>
  readme_md?: string
  faq: ModelFaqItem[]
  created_at: number
}

function mapListItem(raw: ApiModelListItem): AdminModelListItem {
  return {
    id: raw.id,
    name: raw.name,
    displayName: raw.display_name,
    provider: raw.provider,
    capabilities: raw.capabilities,
    active: raw.active,
    isHot: raw.is_hot,
    startingPriceUsd: raw.starting_price_usd,
    priceUnit: raw.price_unit,
    sortOrder: raw.sort_order,
    updatedAt: raw.updated_at,
  }
}

function mapDetail(raw: ApiModelDetail): AdminModelDetail {
  return {
    ...mapListItem(raw),
    description: raw.description,
    thumbnailUrl: raw.thumbnail_url,
    modelPath: raw.model_path,
    apiModelId: raw.api_model_id,
    standardPriceUsd: raw.standard_price_usd,
    priceDetail: raw.price_detail,
    discountPercent: raw.discount_percent,
    perRunPriceUsd: raw.per_run_price_usd,
    runsPerTenUsd: raw.runs_per_ten_usd,
    inputSchema: raw.input_schema,
    readmeMd: raw.readme_md,
    faq: raw.faq ?? [],
    createdAt: raw.created_at,
  }
}

export interface FetchModelsParams {
  offset?: number
  limit?: number
  q?: string
  active?: boolean
}

export async function fetchModels(params: FetchModelsParams = {}): Promise<ModelsPage> {
  const query: Record<string, string | number> = { ...params } as Record<string, string | number>
  if (params.active !== undefined) query.active = String(params.active)
  const raw = await unwrap<{ items: ApiModelListItem[]; total: number; offset: number; limit: number }>(
    http.get('/api/admin/models', { params: query }),
  )
  return { items: raw.items.map(mapListItem), total: raw.total, offset: raw.offset, limit: raw.limit }
}

export async function fetchModelDetail(modelId: string): Promise<AdminModelDetail> {
  const raw = await unwrap<ApiModelDetail>(http.get(`/api/admin/models/${encodeURIComponent(modelId)}`))
  return mapDetail(raw)
}

export async function createModel(payload: Record<string, unknown>): Promise<AdminModelDetail> {
  const raw = await unwrap<ApiModelDetail>(http.post('/api/admin/models', payload))
  return mapDetail(raw)
}

export async function updateModel(modelId: string, payload: Record<string, unknown>): Promise<AdminModelDetail> {
  const raw = await unwrap<ApiModelDetail>(
    http.put(`/api/admin/models/${encodeURIComponent(modelId)}`, payload),
  )
  return mapDetail(raw)
}

export async function updateModelStatus(modelId: string, active: boolean) {
  return unwrap(http.patch(`/api/admin/models/${encodeURIComponent(modelId)}/status`, { active }))
}

export function modelToPayload(model: Partial<AdminModelDetail>): Record<string, unknown> {
  return {
    id: model.id,
    name: model.name,
    display_name: model.displayName,
    provider: model.provider,
    capabilities: model.capabilities,
    description: model.description,
    thumbnail_url: model.thumbnailUrl,
    model_path: model.modelPath,
    api_model_id: model.apiModelId,
    active: model.active,
    is_hot: model.isHot,
    sort_order: model.sortOrder,
    starting_price_usd: model.startingPriceUsd,
    standard_price_usd: model.standardPriceUsd,
    price_unit: model.priceUnit,
    price_detail: model.priceDetail,
    discount_percent: model.discountPercent,
    per_run_price_usd: model.perRunPriceUsd,
    runs_per_ten_usd: model.runsPerTenUsd,
    input_schema: model.inputSchema,
    readme_md: model.readmeMd,
    faq: model.faq,
  }
}
