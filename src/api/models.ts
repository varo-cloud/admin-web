import { http, unwrap } from './http'
import type { BaseModel, ModelCategory, Offering, PricingMode, ProviderRoute } from '@/types/admin'
import type { LocalizedString } from '@/types'
import { exampleToApiPayload, mapApiExample } from '@/utils/offeringExamples'
import { localizedStringToPayload, mapApiLocalized } from '@/utils/locale'

function parseTimestamp(value: string | number): number {
  if (typeof value === 'number') return value
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : 0
}

interface ApiBaseModel {
  seq_id: number
  slug: string
  category: ModelCategory
  api_model_id: string | null
  mode: PricingMode
  rate: Record<string, unknown>
  description: string
  icon_url: string | null
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  publisher_id?: number | null
  publisher_slug?: string | null
}

interface ApiOffering {
  seq_id: number
  model_id: number
  capability: string
  display_name: string
  description: string
  thumbnail_url: string | null
  starting_price_usd: number | null
  standard_price_usd: number | null
  price_unit: string | null
  price_detail: string | null
  readme_md: string | null
  readme_md_i18n: Record<string, string> | null
  faq: Array<Record<string, unknown>>
  faq_i18n: Record<string, unknown> | null
  input_schema: Record<string, unknown> | null
  examples: Array<Record<string, unknown>>
  is_hot: boolean
  is_new: boolean
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface ApiProviderRoute {
  seq_id: number
  model_id: number
  provider: string
  priority: number
  base_url: string
  api_model_id: string | null
  active: boolean
  created_at: string
  updated_at: string
}

function mapBaseModel(raw: ApiBaseModel): BaseModel {
  return {
    seqId: raw.seq_id,
    slug: raw.slug,
    category: raw.category,
    apiModelId: raw.api_model_id,
    mode: raw.mode,
    rate: raw.rate ?? {},
    description: raw.description ?? '',
    iconUrl: raw.icon_url ?? null,
    publisherId: raw.publisher_id ?? null,
    publisherSlug: raw.publisher_slug ?? null,
    active: raw.active,
    sortOrder: raw.sort_order,
    createdAt: parseTimestamp(raw.created_at),
    updatedAt: parseTimestamp(raw.updated_at),
  }
}

function mapOffering(raw: ApiOffering): Offering {
  return {
    seqId: raw.seq_id,
    modelId: raw.model_id,
    capability: raw.capability,
    displayName: raw.display_name,
    description: raw.description ?? '',
    thumbnailUrl: raw.thumbnail_url,
    startingPriceUsd: raw.starting_price_usd,
    standardPriceUsd: raw.standard_price_usd,
    priceUnit: raw.price_unit,
    priceDetail: raw.price_detail,
    readmeMd: raw.readme_md,
    readmeMdI18n: raw.readme_md_i18n,
    faq: raw.faq ?? [],
    faqI18n: raw.faq_i18n,
    inputSchema: raw.input_schema,
    examples: (raw.examples ?? []).map(mapApiExample),
    isHot: raw.is_hot ?? false,
    isNew: raw.is_new ?? false,
    active: raw.active,
    sortOrder: raw.sort_order,
    createdAt: parseTimestamp(raw.created_at),
    updatedAt: parseTimestamp(raw.updated_at),
  }
}

function mapProviderRoute(raw: ApiProviderRoute): ProviderRoute {
  return {
    seqId: raw.seq_id,
    modelId: raw.model_id,
    provider: raw.provider,
    priority: raw.priority,
    baseUrl: raw.base_url,
    apiModelId: raw.api_model_id,
    active: raw.active,
    createdAt: parseTimestamp(raw.created_at),
    updatedAt: parseTimestamp(raw.updated_at),
  }
}

export function baseModelToPayload(model: Partial<BaseModel>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (model.slug !== undefined) payload.slug = model.slug
  if (model.category !== undefined) payload.category = model.category
  if (model.mode !== undefined) payload.mode = model.mode
  if (model.rate !== undefined) payload.rate = model.rate
  if (model.apiModelId !== undefined) payload.api_model_id = model.apiModelId
  if (model.description !== undefined) payload.description = model.description
  if (model.iconUrl !== undefined) payload.icon_url = model.iconUrl
  if (model.publisherSlug !== undefined) payload.publisher_slug = model.publisherSlug
  if (model.active !== undefined) payload.active = model.active
  if (model.sortOrder !== undefined) payload.sort_order = model.sortOrder
  return payload
}

export function offeringToPayload(
  offering: Partial<Offering>,
  options: { includeModelId?: boolean } = { includeModelId: true },
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (options.includeModelId && offering.modelId !== undefined) payload.model_id = offering.modelId
  if (offering.capability !== undefined) payload.capability = offering.capability
  if (offering.displayName !== undefined) payload.display_name = offering.displayName
  if (offering.description !== undefined) payload.description = offering.description
  if (offering.thumbnailUrl !== undefined) payload.thumbnail_url = offering.thumbnailUrl
  if (offering.startingPriceUsd !== undefined) payload.starting_price_usd = offering.startingPriceUsd
  if (offering.standardPriceUsd !== undefined) payload.standard_price_usd = offering.standardPriceUsd
  if (offering.priceUnit !== undefined) payload.price_unit = offering.priceUnit
  if (offering.priceDetail !== undefined) payload.price_detail = offering.priceDetail
  if (offering.readmeMd !== undefined) payload.readme_md = offering.readmeMd
  if (offering.readmeMdI18n !== undefined) payload.readme_md_i18n = offering.readmeMdI18n
  if (offering.faq !== undefined) payload.faq = offering.faq
  if (offering.faqI18n !== undefined) payload.faq_i18n = offering.faqI18n
  if (offering.inputSchema !== undefined) payload.input_schema = offering.inputSchema
  if (offering.examples !== undefined) {
    payload.examples = offering.examples.map(exampleToApiPayload)
  }
  if (offering.isHot !== undefined) payload.is_hot = offering.isHot
  if (offering.isNew !== undefined) payload.is_new = offering.isNew
  if (offering.active !== undefined) payload.active = offering.active
  if (offering.sortOrder !== undefined) payload.sort_order = offering.sortOrder
  return payload
}

export function providerRouteToPayload(
  route: Partial<ProviderRoute> & { apiKey?: string },
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (route.provider !== undefined) payload.provider = route.provider
  if (route.priority !== undefined) payload.priority = route.priority
  if (route.baseUrl !== undefined) payload.base_url = route.baseUrl
  if (route.apiKey !== undefined) payload.api_key = route.apiKey
  if (route.apiModelId !== undefined) payload.api_model_id = route.apiModelId
  if (route.active !== undefined) payload.active = route.active
  return payload
}

/** @deprecated 兼容旧调用，返回基座模型列表 */
export async function fetchModels(_params?: { limit?: number }) {
  const items = await fetchBaseModels()
  return { items, total: items.length, offset: 0, limit: items.length }
}

export async function fetchBaseModels(params?: { publisher?: string }): Promise<BaseModel[]> {
  const raw = await unwrap<ApiBaseModel[]>(http.get('/admin/base-models', { params }))
  return raw.map(mapBaseModel)
}

export async function fetchBaseModel(slug: string): Promise<BaseModel> {
  const raw = await unwrap<ApiBaseModel>(http.get(`/admin/base-models/${encodeURIComponent(slug)}`))
  return mapBaseModel(raw)
}

export async function createBaseModel(payload: Record<string, unknown>): Promise<BaseModel> {
  const raw = await unwrap<ApiBaseModel>(http.post('/admin/base-models', payload))
  return mapBaseModel(raw)
}

export async function updateBaseModel(slug: string, payload: Record<string, unknown>): Promise<BaseModel> {
  const raw = await unwrap<ApiBaseModel>(
    http.put(`/admin/base-models/${encodeURIComponent(slug)}`, payload),
  )
  return mapBaseModel(raw)
}

export async function deleteBaseModel(slug: string) {
  return unwrap(http.delete(`/admin/base-models/${encodeURIComponent(slug)}`))
}

export async function fetchOfferings(modelId?: number): Promise<Offering[]> {
  const params = modelId != null ? { model_id: modelId } : undefined
  const raw = await unwrap<ApiOffering[]>(http.get('/admin/model-offerings', { params }))
  return raw.map(mapOffering)
}

export async function fetchOffering(seqId: number): Promise<Offering> {
  const raw = await unwrap<ApiOffering>(http.get(`/admin/model-offerings/${seqId}`))
  return mapOffering(raw)
}

export async function createOffering(payload: Record<string, unknown>): Promise<Offering> {
  const raw = await unwrap<ApiOffering>(http.post('/admin/model-offerings', payload))
  return mapOffering(raw)
}

export async function updateOffering(seqId: number, payload: Record<string, unknown>): Promise<Offering> {
  const raw = await unwrap<ApiOffering>(http.put(`/admin/model-offerings/${seqId}`, payload))
  return mapOffering(raw)
}

export async function deleteOffering(seqId: number) {
  return unwrap(http.delete(`/admin/model-offerings/${seqId}`))
}

export async function fetchProviderRoutes(slug: string): Promise<ProviderRoute[]> {
  const raw = await unwrap<ApiProviderRoute[]>(
    http.get(`/admin/base-models/${encodeURIComponent(slug)}/provider-routes`),
  )
  return raw.map(mapProviderRoute)
}

export async function createProviderRoute(
  slug: string,
  payload: Record<string, unknown>,
): Promise<ProviderRoute> {
  const raw = await unwrap<ApiProviderRoute>(
    http.post(`/admin/base-models/${encodeURIComponent(slug)}/provider-routes`, payload),
  )
  return mapProviderRoute(raw)
}

export async function updateProviderRoute(
  slug: string,
  seqId: number,
  payload: Record<string, unknown>,
): Promise<ProviderRoute> {
  const raw = await unwrap<ApiProviderRoute>(
    http.put(`/admin/base-models/${encodeURIComponent(slug)}/provider-routes/${seqId}`, payload),
  )
  return mapProviderRoute(raw)
}

export async function deleteProviderRoute(slug: string, seqId: number) {
  return unwrap(http.delete(`/admin/base-models/${encodeURIComponent(slug)}/provider-routes/${seqId}`))
}

export function localizedToI18n(value: LocalizedString | undefined): Record<string, string> | null {
  if (!value) return null
  const payload = localizedStringToPayload(value)
  return Object.keys(payload).length > 0 ? payload : null
}

export function i18nToLocalized(value: Record<string, string> | null | undefined): LocalizedString {
  if (!value) return { 'en-US': '', 'zh-CN': '' }
  return mapApiLocalized(value)
}
