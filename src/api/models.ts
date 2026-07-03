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
  icon_url?: string
  model_path: string
  api_model_id: string
  standard_price_usd?: number
  price_detail?: string
  discount_percent?: number
  per_run_price_usd?: number
  runs_per_ten_usd?: number
  input_schema: Record<string, unknown>
  readme_md?: LocalizedString | string
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
    capabilities: raw.capabilities ?? [],
    active: raw.active,
    isHot: raw.is_hot ?? false,
    isNew: raw.is_new ?? false,
    startingPriceUsd: raw.starting_price_usd,
    priceUnit: raw.price_unit,
    sortOrder: raw.sort_order,
    updatedAt: raw.updated_at,
  }
}

function mapReadmeMd(raw: LocalizedString | string | undefined): LocalizedString | undefined {
  if (raw == null) return undefined
  if (typeof raw === 'string') return raw.trim() ? { 'en-US': raw } : undefined
  return mapApiLocalized(raw)
}

function mapDetail(raw: ApiModelDetail): AdminModelDetail {
  return {
    ...mapListItem(raw),
    description: mapApiLocalized(raw.description),
    thumbnailUrl: raw.thumbnail_url,
    iconUrl: raw.icon_url,
    modelPath: raw.model_path,
    apiModelId: raw.api_model_id,
    standardPriceUsd: raw.standard_price_usd,
    priceDetail: raw.price_detail,
    discountPercent: raw.discount_percent,
    perRunPriceUsd: raw.per_run_price_usd,
    runsPerTenUsd: raw.runs_per_ten_usd,
    inputSchema: raw.input_schema,
    readmeMd: mapReadmeMd(raw.readme_md),
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

export async function deleteModel(modelId: string) {
  return unwrap(http.delete(`/admin/models/${encodeURIComponent(modelId)}`))
}

export function modelToPayload(model: Partial<AdminModelDetail>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (model.id !== undefined) payload.id = model.id
  if (model.name !== undefined) payload.name = localizedStringToPayload(model.name)
  if (model.displayName !== undefined) {
    payload.display_name = model.displayName ? localizedStringToPayload(model.displayName) : undefined
  }
  if (model.provider !== undefined) payload.provider = model.provider
  if (model.capabilities !== undefined) payload.capabilities = model.capabilities
  if (model.description !== undefined) payload.description = localizedStringToPayload(model.description)
  if (model.thumbnailUrl !== undefined) payload.thumbnail_url = model.thumbnailUrl
  if (model.iconUrl !== undefined) payload.icon_url = model.iconUrl
  if (model.modelPath !== undefined) payload.model_path = model.modelPath
  if (model.apiModelId !== undefined) payload.api_model_id = model.apiModelId
  if (model.active !== undefined) payload.active = model.active
  if (model.isHot !== undefined) payload.is_hot = model.isHot
  if (model.isNew !== undefined) payload.is_new = model.isNew
  if (model.sortOrder !== undefined) payload.sort_order = model.sortOrder
  if (model.startingPriceUsd !== undefined) payload.starting_price_usd = model.startingPriceUsd
  if (model.standardPriceUsd !== undefined) payload.standard_price_usd = model.standardPriceUsd
  if (model.priceUnit !== undefined) payload.price_unit = model.priceUnit
  if (model.priceDetail !== undefined) payload.price_detail = model.priceDetail
  if (model.discountPercent !== undefined) payload.discount_percent = model.discountPercent
  if (model.perRunPriceUsd !== undefined) payload.per_run_price_usd = model.perRunPriceUsd
  if (model.runsPerTenUsd !== undefined) payload.runs_per_ten_usd = model.runsPerTenUsd
  if (model.inputSchema !== undefined) payload.input_schema = model.inputSchema
  if (model.readmeMd !== undefined) {
    payload.readme_md = model.readmeMd ? localizedStringToPayload(model.readmeMd) : undefined
  }
  if (model.faq !== undefined) {
    payload.faq = model.faq.map((item) => ({
      question: localizedStringToPayload(item.question),
      answer: localizedStringToPayload(item.answer),
    }))
  }
  return payload
}
