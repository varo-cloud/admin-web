import type { MockMethod } from 'vite-plugin-mock'
import { addAuditLog, mockStore } from './store'
import { fail, pathParam, requireAdmin, success } from './_util'

type LocalizedRecord = { 'en-US'?: string; 'zh-CN'?: string } | null | undefined

function resolveLocaleText(value: LocalizedRecord, locale: string, fallback?: LocalizedRecord): string {
  const pick = (obj: LocalizedRecord) => {
    if (!obj) return ''
    if (locale === 'zh-CN') return obj['zh-CN']?.trim() || obj['en-US']?.trim() || ''
    return obj['en-US']?.trim() || obj['zh-CN']?.trim() || ''
  }
  return pick(value) || pick(fallback) || ''
}

function heroCarouselResponse() {
  const { heroCarousel } = mockStore
  return {
    slide_duration_ms: heroCarousel.slide_duration_ms,
    autoplay_enabled: heroCarousel.autoplay_enabled,
    muted: heroCarousel.muted,
    default_title: heroCarousel.default_title,
    default_subtitle: heroCarousel.default_subtitle,
    slides: [...heroCarousel.slides].sort((a, b) => a.sort_order - b.sort_order),
    updated_at: heroCarousel.updated_at,
  }
}

function publicHeroCarouselResponse(headers: Record<string, string>) {
  const locale = headers['x-locale'] || headers['accept-language']?.split(',')[0]?.trim() || 'en-US'
  const { heroCarousel } = mockStore
  const activeSlides = [...heroCarousel.slides]
    .filter((s) => s.active)
    .sort((a, b) => a.sort_order - b.sort_order)

  return {
    slide_duration_ms: heroCarousel.slide_duration_ms,
    autoplay_enabled: heroCarousel.autoplay_enabled,
    muted: heroCarousel.muted,
    default_title: resolveLocaleText(heroCarousel.default_title, locale),
    default_subtitle: resolveLocaleText(heroCarousel.default_subtitle, locale),
    slides: activeSlides.map((slide) => ({
      id: slide.id,
      sort_order: slide.sort_order,
      video_url: slide.video_url,
      poster_url: slide.poster_url,
      title: resolveLocaleText(slide.title, locale, heroCarousel.default_title),
      subtitle: resolveLocaleText(slide.subtitle, locale, heroCarousel.default_subtitle),
    })),
  }
}

export default [
  {
    url: '/api/site/hero-carousel',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => success(publicHeroCarouselResponse(headers)),
  },
  {
    url: '/api/admin/hero-carousel',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      return success(heroCarouselResponse())
    },
  },
  {
    url: '/api/admin/hero-carousel',
    method: 'put',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const prev = { ...mockStore.heroCarousel }
      if (body.slide_duration_ms !== undefined) {
        mockStore.heroCarousel.slide_duration_ms = Number(body.slide_duration_ms)
      }
      if (body.autoplay_enabled !== undefined) {
        mockStore.heroCarousel.autoplay_enabled = Boolean(body.autoplay_enabled)
      }
      if (body.muted !== undefined) mockStore.heroCarousel.muted = Boolean(body.muted)
      if (body.default_title !== undefined) {
        mockStore.heroCarousel.default_title = body.default_title as typeof mockStore.heroCarousel.default_title
      }
      if (body.default_subtitle !== undefined) {
        mockStore.heroCarousel.default_subtitle = body.default_subtitle as typeof mockStore.heroCarousel.default_subtitle
      }
      mockStore.heroCarousel.updated_at = Date.now()
      addAuditLog({
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
        action: 'hero_carousel_update',
        target_type: 'hero_carousel',
        target_id: 'settings',
        reason: 'Hero 轮播全局设置更新',
        before_snapshot: {
          slide_duration_ms: prev.slide_duration_ms,
          autoplay_enabled: prev.autoplay_enabled,
          muted: prev.muted,
        },
        after_snapshot: {
          slide_duration_ms: mockStore.heroCarousel.slide_duration_ms,
          autoplay_enabled: mockStore.heroCarousel.autoplay_enabled,
          muted: mockStore.heroCarousel.muted,
        },
      })
      return success(heroCarouselResponse())
    },
  },
  {
    url: '/api/admin/hero-carousel/slides',
    method: 'post',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      if (!body.video_url || !body.poster_url) return fail('video_url 与 poster_url 必填', 400)
      const now = Date.now()
      const slide = {
        id: String(body.id ?? `hero-slide-${now}`),
        sort_order: Number(body.sort_order ?? mockStore.heroCarousel.slides.length),
        active: body.active !== undefined ? Boolean(body.active) : true,
        video_url: String(body.video_url),
        poster_url: String(body.poster_url),
        title: (body.title as LocalizedRecord) ?? null,
        subtitle: (body.subtitle as LocalizedRecord) ?? null,
        created_at: now,
        updated_at: now,
      }
      mockStore.heroCarousel.slides.push(slide as (typeof mockStore.heroCarousel.slides)[number])
      mockStore.heroCarousel.updated_at = now
      addAuditLog({
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
        action: 'hero_slide_create',
        target_type: 'hero_slide',
        target_id: slide.id,
        reason: '创建 Hero slide',
        before_snapshot: null,
        after_snapshot: { id: slide.id, active: slide.active },
      })
      return success(slide)
    },
  },
  {
    url: /\/api\/admin\/hero-carousel\/slides\/([^/]+)$/,
    method: 'put',
    response: ({
      body,
      headers,
      url,
    }: {
      body: Record<string, unknown>
      headers: Record<string, string>
      url: string
    }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const slideId = decodeURIComponent(pathParam(url, /\/slides\/([^/?]+)$/) ?? '')
      const idx = mockStore.heroCarousel.slides.findIndex((s) => s.id === slideId)
      if (idx < 0) return fail('Slide 不存在', 404)
      const prev = mockStore.heroCarousel.slides[idx]
      mockStore.heroCarousel.slides[idx] = {
        ...prev,
        ...body,
        id: slideId,
        updated_at: Date.now(),
      } as typeof prev
      mockStore.heroCarousel.updated_at = Date.now()
      return success(mockStore.heroCarousel.slides[idx])
    },
  },
  {
    url: /\/api\/admin\/hero-carousel\/slides\/([^/]+)\/status$/,
    method: 'patch',
    response: ({
      body,
      headers,
      url,
    }: {
      body: { active?: boolean }
      headers: Record<string, string>
      url: string
    }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const slideId = decodeURIComponent(pathParam(url, /\/slides\/([^/]+)\/status/) ?? '')
      const slide = mockStore.heroCarousel.slides.find((s) => s.id === slideId)
      if (!slide) return fail('Slide 不存在', 404)
      slide.active = Boolean(body.active)
      slide.updated_at = Date.now()
      mockStore.heroCarousel.updated_at = Date.now()
      return success({ id: slide.id, active: slide.active })
    },
  },
  {
    url: /\/api\/admin\/hero-carousel\/slides\/([^/]+)$/,
    method: 'delete',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const slideId = decodeURIComponent(pathParam(url, /\/slides\/([^/?]+)$/) ?? '')
      const idx = mockStore.heroCarousel.slides.findIndex((s) => s.id === slideId)
      if (idx < 0) return fail('Slide 不存在', 404)
      mockStore.heroCarousel.slides.splice(idx, 1)
      mockStore.heroCarousel.updated_at = Date.now()
      addAuditLog({
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
        action: 'hero_slide_delete',
        target_type: 'hero_slide',
        target_id: slideId,
        reason: '删除 Hero slide',
        before_snapshot: { id: slideId },
        after_snapshot: null,
      })
      return success({ deleted: true })
    },
  },
  {
    url: '/api/admin/hero-carousel/slides/reorder',
    method: 'put',
    response: ({ body, headers }: { body: { slide_ids?: string[] }; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const ids = body.slide_ids ?? []
      const map = new Map(mockStore.heroCarousel.slides.map((s) => [s.id, s]))
      const reordered = ids.map((id, index) => {
        const slide = map.get(id)
        if (!slide) return null
        slide.sort_order = index
        slide.updated_at = Date.now()
        return slide
      }).filter(Boolean) as typeof mockStore.heroCarousel.slides
      const remaining = mockStore.heroCarousel.slides
        .filter((s) => !ids.includes(s.id))
        .map((s, i) => ({ ...s, sort_order: reordered.length + i, updated_at: Date.now() }))
      mockStore.heroCarousel.slides = [...reordered, ...remaining]
      mockStore.heroCarousel.updated_at = Date.now()
      return success(heroCarouselResponse())
    },
  },
  {
    url: '/api/admin/hero-carousel/assets',
    method: 'post',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const kind = String(body.kind ?? 'poster')
      const ext = kind === 'video' ? 'mp4' : 'jpg'
      const url = `https://cdn.varo.cloud/assets/hero/mock/${Date.now()}.${ext}`
      return success({
        url,
        kind,
        content_type: kind === 'video' ? 'video/mp4' : 'image/jpeg',
        size_bytes: 1024 * 1024,
      })
    },
  },
] as MockMethod[]
