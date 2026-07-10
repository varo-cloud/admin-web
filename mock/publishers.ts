import type { MockMethod } from 'vite-plugin-mock'
import { mockStore } from './store'
import { fail, paginate, pathParam, requireAdmin, success } from './_util'

type MockPublisher = (typeof mockStore.publishers)[number]

const SLUG_PATTERN = /^[a-z0-9-]{2,64}$/

function nextSeqId(items: { seq_id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.seq_id), 0) + 1
}

function findPublisher(slug: string) {
  return mockStore.publishers.find((p) => p.slug === slug)
}

function modelCountForPublisher(publisherId: number) {
  return mockStore.baseModels.filter((m) => m.publisher_id === publisherId).length
}

function enrichPublisher(publisher: MockPublisher) {
  return {
    ...publisher,
    model_count: modelCountForPublisher(publisher.seq_id),
  }
}

function sortedPublishers() {
  return [...mockStore.publishers].sort(
    (a, b) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug),
  )
}

function filterPublishers(query: Record<string, string>) {
  let items = sortedPublishers()
  const q = query.q?.trim().toLowerCase()
  if (q) {
    items = items.filter(
      (p) =>
        p.slug.toLowerCase().includes(q) ||
        p.display_name.toLowerCase().includes(q),
    )
  }
  if (query.active === 'true') items = items.filter((p) => p.active)
  if (query.active === 'false') items = items.filter((p) => !p.active)
  return items
}

export default [
  {
    url: '/api/admin/publishers',
    method: 'get',
    response: ({ query, headers }: { query: Record<string, string>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const offset = Math.max(0, Number(query.offset) || 0)
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
      const filtered = filterPublishers(query).map(enrichPublisher)
      return success(paginate(filtered, offset, limit))
    },
  },
  {
    url: '/api/admin/publishers',
    method: 'post',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const slug = String(body.slug ?? '').trim()
      const displayName = String(body.display_name ?? '').trim()
      if (!slug || !displayName) return fail('validation_error', 422)
      if (!SLUG_PATTERN.test(slug)) return fail('validation_error', 422)
      if (mockStore.publishers.some((p) => p.slug === slug)) {
        return fail('Publisher slug already exists', 409)
      }
      const now = new Date().toISOString()
      const publisher: MockPublisher = {
        seq_id: nextSeqId(mockStore.publishers),
        slug,
        display_name: displayName,
        display_name_i18n: (body.display_name_i18n as Record<string, string> | null) ?? null,
        logo_url: (body.logo_url as string | null) ?? null,
        description: String(body.description ?? ''),
        active: body.active !== false,
        sort_order: Number(body.sort_order) || 0,
        created_at: now,
        updated_at: now,
      }
      mockStore.publishers.push(publisher)
      return success(enrichPublisher(publisher))
    },
  },
  {
    url: /\/api\/admin\/publishers\/([^/]+)$/,
    method: 'get',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const slug = decodeURIComponent(pathParam(url, /\/publishers\/([^/?]+)$/) ?? '')
      const publisher = findPublisher(slug)
      if (!publisher) return fail('Publisher not found', 404)
      return success(enrichPublisher(publisher))
    },
  },
  {
    url: /\/api\/admin\/publishers\/([^/]+)$/,
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
      const slug = decodeURIComponent(pathParam(url, /\/publishers\/([^/?]+)$/) ?? '')
      const idx = mockStore.publishers.findIndex((p) => p.slug === slug)
      if (idx < 0) return fail('Publisher not found', 404)
      const prev = mockStore.publishers[idx]
      mockStore.publishers[idx] = {
        ...prev,
        display_name: body.display_name !== undefined ? String(body.display_name) : prev.display_name,
        display_name_i18n:
          body.display_name_i18n !== undefined
            ? (body.display_name_i18n as Record<string, string> | null)
            : prev.display_name_i18n,
        logo_url: body.logo_url !== undefined ? (body.logo_url as string | null) : prev.logo_url,
        description: body.description !== undefined ? String(body.description) : prev.description,
        active: body.active !== undefined ? Boolean(body.active) : prev.active,
        sort_order: body.sort_order !== undefined ? Number(body.sort_order) : prev.sort_order,
        updated_at: new Date().toISOString(),
      }
      return success(enrichPublisher(mockStore.publishers[idx]))
    },
  },
  {
    url: /\/api\/admin\/publishers\/([^/]+)$/,
    method: 'delete',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const slug = decodeURIComponent(pathParam(url, /\/publishers\/([^/?]+)$/) ?? '')
      const publisher = findPublisher(slug)
      if (!publisher) return fail('Publisher not found', 404)
      if (modelCountForPublisher(publisher.seq_id) > 0) {
        return fail('Publisher has associated models', 409)
      }
      const idx = mockStore.publishers.findIndex((p) => p.slug === slug)
      mockStore.publishers.splice(idx, 1)
      return success({ deleted: true })
    },
  },
  {
    url: /\/api\/admin\/publishers\/([^/]+)\/assign-models$/,
    method: 'post',
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
      const slug = decodeURIComponent(pathParam(url, /\/publishers\/([^/]+)\/assign-models$/) ?? '')
      const publisher = findPublisher(slug)
      if (!publisher) return fail('Publisher not found', 404)
      const modelSlugs = Array.isArray(body.model_slugs) ? body.model_slugs.map(String) : []
      const mode = body.mode === 'clear' ? 'clear' : 'set'
      const updated: string[] = []
      const notFound: string[] = []

      for (const modelSlug of modelSlugs) {
        const model = mockStore.baseModels.find((m) => m.slug === modelSlug)
        if (!model) {
          notFound.push(modelSlug)
          continue
        }
        if (mode === 'set') {
          model.publisher_id = publisher.seq_id
        } else {
          if (model.publisher_id === publisher.seq_id) {
            model.publisher_id = null
          }
        }
        model.updated_at = new Date().toISOString()
        updated.push(modelSlug)
      }

      updated.sort()
      notFound.sort()
      return success({ updated, not_found: notFound })
    },
  },
] as MockMethod[]
