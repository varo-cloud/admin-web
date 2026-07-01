import { http, unwrap } from './http'
import type { HeroCarouselAssetUpload, HeroCarouselConfig, HeroCarouselSlide } from '@/types/admin'
import type { LocalizedString } from '@/types'
import { localizedStringToPayload, mapApiLocalized } from '@/utils/locale'

interface ApiHeroSlide {
  id: string
  sort_order: number
  active: boolean
  video_url: string
  poster_url: string
  title?: LocalizedString | null
  subtitle?: LocalizedString | null
  created_at: number
  updated_at: number
}

interface ApiHeroCarousel {
  slide_duration_ms: number
  autoplay_enabled: boolean
  muted: boolean
  default_title: LocalizedString
  default_subtitle: LocalizedString
  slides: ApiHeroSlide[]
  updated_at: number
}

function mapOptionalLocalized(raw: unknown): LocalizedString | undefined {
  if (raw == null) return undefined
  const mapped = mapApiLocalized(raw)
  if (!mapped['en-US']?.trim() && !mapped['zh-CN']?.trim()) return undefined
  return mapped
}

function mapSlide(raw: ApiHeroSlide): HeroCarouselSlide {
  return {
    id: raw.id,
    sortOrder: raw.sort_order,
    active: raw.active,
    videoUrl: raw.video_url,
    posterUrl: raw.poster_url,
    title: mapOptionalLocalized(raw.title),
    subtitle: mapOptionalLocalized(raw.subtitle),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function mapConfig(raw: ApiHeroCarousel): HeroCarouselConfig {
  return {
    slideDurationMs: raw.slide_duration_ms,
    autoplayEnabled: raw.autoplay_enabled,
    muted: raw.muted,
    defaultTitle: mapApiLocalized(raw.default_title),
    defaultSubtitle: mapApiLocalized(raw.default_subtitle),
    slides: [...raw.slides].sort((a, b) => a.sort_order - b.sort_order).map(mapSlide),
    updatedAt: raw.updated_at,
  }
}

function optionalLocalizedPayload(value: LocalizedString | undefined): Record<string, string> | undefined {
  if (!value) return undefined
  const payload = localizedStringToPayload(value)
  return Object.keys(payload).length > 0 ? payload : undefined
}

export function heroCarouselSettingsToPayload(settings: {
  slideDurationMs?: number
  autoplayEnabled?: boolean
  muted?: boolean
  defaultTitle?: LocalizedString
  defaultSubtitle?: LocalizedString
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (settings.slideDurationMs !== undefined) payload.slide_duration_ms = settings.slideDurationMs
  if (settings.autoplayEnabled !== undefined) payload.autoplay_enabled = settings.autoplayEnabled
  if (settings.muted !== undefined) payload.muted = settings.muted
  if (settings.defaultTitle !== undefined) payload.default_title = localizedStringToPayload(settings.defaultTitle)
  if (settings.defaultSubtitle !== undefined) {
    payload.default_subtitle = localizedStringToPayload(settings.defaultSubtitle)
  }
  return payload
}

export function heroSlideToPayload(slide: Partial<HeroCarouselSlide>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (slide.id !== undefined) payload.id = slide.id
  if (slide.sortOrder !== undefined) payload.sort_order = slide.sortOrder
  if (slide.active !== undefined) payload.active = slide.active
  if (slide.videoUrl !== undefined) payload.video_url = slide.videoUrl
  if (slide.posterUrl !== undefined) payload.poster_url = slide.posterUrl
  const title = optionalLocalizedPayload(slide.title)
  const subtitle = optionalLocalizedPayload(slide.subtitle)
  if (title !== undefined) payload.title = title
  if (subtitle !== undefined) payload.subtitle = subtitle
  return payload
}

export async function fetchHeroCarousel(): Promise<HeroCarouselConfig> {
  const raw = await unwrap<ApiHeroCarousel>(http.get('/admin/hero-carousel'))
  return mapConfig(raw)
}

export async function updateHeroCarousel(payload: Record<string, unknown>): Promise<HeroCarouselConfig> {
  const raw = await unwrap<ApiHeroCarousel>(http.put('/admin/hero-carousel', payload))
  return mapConfig(raw)
}

export async function createHeroSlide(payload: Record<string, unknown>): Promise<HeroCarouselSlide> {
  const raw = await unwrap<ApiHeroSlide>(http.post('/admin/hero-carousel/slides', payload))
  return mapSlide(raw)
}

export async function updateHeroSlide(slideId: string, payload: Record<string, unknown>): Promise<HeroCarouselSlide> {
  const raw = await unwrap<ApiHeroSlide>(
    http.put(`/admin/hero-carousel/slides/${encodeURIComponent(slideId)}`, payload),
  )
  return mapSlide(raw)
}

export async function updateHeroSlideStatus(slideId: string, active: boolean) {
  return unwrap(
    http.patch(`/admin/hero-carousel/slides/${encodeURIComponent(slideId)}/status`, { active }),
  )
}

export async function deleteHeroSlide(slideId: string) {
  return unwrap(http.delete(`/admin/hero-carousel/slides/${encodeURIComponent(slideId)}`))
}

export async function reorderHeroSlides(slideIds: string[]): Promise<HeroCarouselConfig> {
  const raw = await unwrap<ApiHeroCarousel>(http.put('/admin/hero-carousel/slides/reorder', { slide_ids: slideIds }))
  return mapConfig(raw)
}

export async function uploadHeroAsset(file: File, kind: 'video' | 'poster'): Promise<HeroCarouselAssetUpload> {
  const form = new FormData()
  form.append('file', file)
  form.append('kind', kind)
  const raw = await unwrap<{
    url: string
    kind: 'video' | 'poster'
    content_type: string
    size_bytes: number
  }>(http.post('/admin/hero-carousel/assets', form, { headers: { 'Content-Type': 'multipart/form-data' } }))
  return {
    url: raw.url,
    kind: raw.kind,
    contentType: raw.content_type,
    sizeBytes: raw.size_bytes,
  }
}
