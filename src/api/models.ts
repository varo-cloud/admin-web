import { http, unwrap } from './http'
import type { AdminModelDetail, AdminModelListItem, ModelsPage } from '@/types/admin'
import type { LocalizedString, ModelFaqItem, PricingPriceUnit } from '@/types'
import { localizedStringToPayload, mapApiLocalized } from '@/utils/locale'

interface ApiModelListItem {
  id: string
  name: LocalizedString
  display_name?: LocalizedString
  provider: string
  capabilities: string[]
  active: boolean
  is_hot: boolean
  is_new: boolean
  starting_price_usd: number
  price_unit: PricingPriceUnit
  sort_order: number
  updated_at: number
}

interface ApiModelDetail extends ApiModelListItem {
  description: LocalizedString
  thumbnail_url?: string
  model_path: string
  api_model_id: string
  standard_price_usd?: number
  price_detail?: string
  discount_percent?: number
  per_run_price_usd?: number
  runs_per_ten_usd?: number
  input_schema: Record<string, unknown>
  readme_md?: LocalizedString
  faq: ApiFaqItem[]
  created_at: number
}

interface ApiFaqItem {
  question: LocalizedString
  answer: LocalizedString
}

function mapFaqItem(raw: ApiFaqItem): ModelFaqItem {
  return {
    question: mapApiLocalized(raw.question),
    answer: mapApiLocalized(raw.answer),
  }
}

function mapListItem(raw: ApiModelListItem): AdminModelListItem {
  return {
    id: raw.id,
    name: mapApiLocalized(raw.name),
    displayName: raw.display_name ? mapApiLocalized(raw.display_name) : undefined,
    provider: raw.provider,
    capabilities: raw.capabilities,
    active: raw.active,
    isHot: raw.is_hot ?? false,
    isNew: raw.is_new ?? false,
    startingPriceUsd: raw.starting_price_usd,
    priceUnit: raw.price_unit,
    sortOrder: raw.sort_order,
    updatedAt: raw.updated_at,
  }
}

function mapDetail(raw: ApiModelDetail): AdminModelDetail {
  return {
    ...mapListItem(raw),
    description: mapApiLocalized(raw.description),
    thumbnailUrl: raw.thumbnail_url,
    modelPath: raw.model_path,
    apiModelId: raw.api_model_id,
    standardPriceUsd: raw.standard_price_usd,
    priceDetail: raw.price_detail,
    discountPercent: raw.discount_percent,
    perRunPriceUsd: raw.per_run_price_usd,
    runsPerTenUsd: raw.runs_per_ten_usd,
    inputSchema: raw.input_schema,
    readmeMd: raw.readme_md ? mapApiLocalized(raw.readme_md) : undefined,
    faq: (raw.faq ?? []).map(mapFaqItem),
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
    http.get('/admin/models', { params: query }),
  )
  return { items: raw.items.map(mapListItem), total: raw.total, offset: raw.offset, limit: raw.limit }
}

export async function fetchModelDetail(modelId: string): Promise<AdminModelDetail> {
  const raw = await unwrap<ApiModelDetail>(http.get(`/admin/models/${encodeURIComponent(modelId)}`))
  return mapDetail(raw)
}

export async function createModel(payload: Record<string, unknown>): Promise<AdminModelDetail> {
  const raw = await unwrap<ApiModelDetail>(http.post('/admin/models', payload))
  return mapDetail(raw)
}

export async function updateModel(modelId: string, payload: Record<string, unknown>): Promise<AdminModelDetail> {
  const raw = await unwrap<ApiModelDetail>(
    http.put(`/admin/models/${encodeURIComponent(modelId)}`, payload),
  )
  return mapDetail(raw)
}

export async function updateModelStatus(modelId: string, active: boolean) {
  return unwrap(http.patch(`/admin/models/${encodeURIComponent(modelId)}/status`, { active }))
}

export function modelToPayload(model: Partial<AdminModelDetail>): Record<string, unknown> {
  return {
    id: model.id,
    name: localizedStringToPayload(model.name),
    display_name: model.displayName ? localizedStringToPayload(model.displayName) : undefined,
    provider: model.provider,
    capabilities: model.capabilities,
    description: localizedStringToPayload(model.description),
    thumbnail_url: model.thumbnailUrl,
    model_path: model.modelPath,
    api_model_id: model.apiModelId,
    active: model.active,
    is_hot: model.isHot,
    is_new: model.isNew,
    sort_order: model.sortOrder,
    starting_price_usd: model.startingPriceUsd,
    standard_price_usd: model.standardPriceUsd,
    price_unit: model.priceUnit,
    price_detail: model.priceDetail,
    discount_percent: model.discountPercent,
    per_run_price_usd: model.perRunPriceUsd,
    runs_per_ten_usd: model.runsPerTenUsd,
    input_schema: model.inputSchema,
    readme_md: model.readmeMd ? localizedStringToPayload(model.readmeMd) : undefined,
    faq: model.faq?.map((item) => ({
      question: localizedStringToPayload(item.question),
      answer: localizedStringToPayload(item.answer),
    })),
  }
}
