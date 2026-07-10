import { http, unwrap } from './http'
import type { AssignModelsResult, Publisher, PublishersPage } from '@/types/admin'
import type { LocalizedString } from '@/types'
import { localizedStringToPayload, mapApiLocalized } from '@/utils/locale'

interface ApiPublisher {
  seq_id: number
  slug: string
  display_name: string
  display_name_i18n: Record<string, string> | null
  logo_url: string | null
  description: string
  active: boolean
  sort_order: number
  model_count?: number
  created_at: number
  updated_at: number
}

function parseTimestamp(value: string | number): number {
  if (typeof value === 'number') return value
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : 0
}

function mapPublisher(raw: ApiPublisher): Publisher {
  return {
    seqId: raw.seq_id,
    slug: raw.slug,
    displayName: raw.display_name,
    displayNameI18n: raw.display_name_i18n,
    logoUrl: raw.logo_url,
    description: raw.description ?? '',
    active: raw.active,
    sortOrder: raw.sort_order,
    modelCount: raw.model_count ?? 0,
    createdAt: parseTimestamp(raw.created_at),
    updatedAt: parseTimestamp(raw.updated_at),
  }
}

export interface FetchPublishersParams {
  offset?: number
  limit?: number
  q?: string
  active?: boolean
}

export async function fetchPublishers(params: FetchPublishersParams = {}): Promise<PublishersPage> {
  const raw = await unwrap<{ items: ApiPublisher[]; total: number; offset: number; limit: number }>(
    http.get('/admin/publishers', { params }),
  )
  return {
    items: raw.items.map(mapPublisher),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}

export async function fetchPublisher(slug: string): Promise<Publisher> {
  const raw = await unwrap<ApiPublisher>(http.get(`/admin/publishers/${encodeURIComponent(slug)}`))
  return mapPublisher(raw)
}

export function publisherToPayload(
  publisher: Partial<Publisher> & { displayNameLocalized?: LocalizedString },
  options: { includeSlug?: boolean } = {},
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (options.includeSlug && publisher.slug !== undefined) payload.slug = publisher.slug

  if (publisher.displayNameLocalized !== undefined) {
    const i18n = localizedStringToPayload(publisher.displayNameLocalized)
    const en = i18n['en-US']
    if (en) payload.display_name = en
    const { 'en-US': _, ...rest } = i18n
    if (Object.keys(rest).length > 0) payload.display_name_i18n = rest
  } else if (publisher.displayName !== undefined) {
    payload.display_name = publisher.displayName
    if (publisher.displayNameI18n !== undefined) payload.display_name_i18n = publisher.displayNameI18n
  }

  if (publisher.logoUrl !== undefined) payload.logo_url = publisher.logoUrl
  if (publisher.description !== undefined) payload.description = publisher.description
  if (publisher.active !== undefined) payload.active = publisher.active
  if (publisher.sortOrder !== undefined) payload.sort_order = publisher.sortOrder
  return payload
}

export async function createPublisher(payload: Record<string, unknown>): Promise<Publisher> {
  const raw = await unwrap<ApiPublisher>(http.post('/admin/publishers', payload))
  return mapPublisher(raw)
}

export async function updatePublisher(slug: string, payload: Record<string, unknown>): Promise<Publisher> {
  const raw = await unwrap<ApiPublisher>(http.put(`/admin/publishers/${encodeURIComponent(slug)}`, payload))
  return mapPublisher(raw)
}

export async function deletePublisher(slug: string) {
  return unwrap<{ deleted: boolean }>(http.delete(`/admin/publishers/${encodeURIComponent(slug)}`))
}

export async function assignPublisherModels(
  slug: string,
  payload: { modelSlugs: string[]; mode?: 'set' | 'clear' },
): Promise<AssignModelsResult> {
  const raw = await unwrap<{ updated: string[]; not_found: string[] }>(
    http.post(`/admin/publishers/${encodeURIComponent(slug)}/assign-models`, {
      model_slugs: payload.modelSlugs,
      mode: payload.mode ?? 'set',
    }),
  )
  return { updated: raw.updated, notFound: raw.not_found }
}

export function i18nToDisplayNameLocalized(
  displayName: string,
  i18n: Record<string, string> | null | undefined,
): LocalizedString {
  const localized = mapApiLocalized(i18n)
  localized['en-US'] = displayName || localized['en-US'] || ''
  return localized
}
