import type { MockMethod } from 'vite-plugin-mock'
import { mockStore } from './store'
import { fail, pathParam, requireAdmin, success } from './_util'

type MockBaseModel = (typeof mockStore.baseModels)[number]
type MockOffering = (typeof mockStore.offerings)[number]
type MockProviderRoute = (typeof mockStore.providerRoutes)[number]

function stripRoute(route: MockProviderRoute) {
  const { api_key_encrypted: _, ...rest } = route
  return rest
}

function findBaseModel(slug: string) {
  return mockStore.baseModels.find((m) => m.slug === slug)
}

function nextSeqId(items: { seq_id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.seq_id), 0) + 1
}

export default [
  // ── Base Models ──
  {
    url: '/api/admin/base-models',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const items = [...mockStore.baseModels].sort(
        (a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at),
      )
      return success(items)
    },
  },
  {
    url: '/api/admin/base-models',
    method: 'post',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const slug = String(body.slug ?? '')
      if (!slug) return fail('slug 必填', 422)
      if (mockStore.baseModels.some((m) => m.slug === slug)) return fail('slug 冲突', 409)
      const now = new Date().toISOString()
      const model: MockBaseModel = {
        seq_id: nextSeqId(mockStore.baseModels),
        slug,
        category: (body.category as MockBaseModel['category']) ?? 'video',
        api_model_id: (body.api_model_id as string | null) ?? null,
        mode: body.mode as MockBaseModel['mode'],
        rate: (body.rate as Record<string, unknown>) ?? {},
        description: String(body.description ?? ''),
        active: body.active !== false,
        sort_order: Number(body.sort_order) || 0,
        created_at: now,
        updated_at: now,
      }
      mockStore.baseModels.push(model)
      return success(model)
    },
  },
  {
    url: /\/api\/admin\/base-models\/([^/]+)$/,
    method: 'get',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const slug = decodeURIComponent(pathParam(url, /\/base-models\/([^/?]+)$/) ?? '')
      const model = findBaseModel(slug)
      if (!model) return fail('Model not found', 404)
      return success(model)
    },
  },
  {
    url: /\/api\/admin\/base-models\/([^/]+)$/,
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
      const slug = decodeURIComponent(pathParam(url, /\/base-models\/([^/?]+)$/) ?? '')
      const idx = mockStore.baseModels.findIndex((m) => m.slug === slug)
      if (idx < 0) return fail('Model not found', 404)
      const prev = mockStore.baseModels[idx]
      mockStore.baseModels[idx] = {
        ...prev,
        category: (body.category as MockBaseModel['category']) ?? prev.category,
        mode: (body.mode as MockBaseModel['mode']) ?? prev.mode,
        rate: (body.rate as Record<string, unknown>) ?? prev.rate,
        api_model_id: body.api_model_id !== undefined ? (body.api_model_id as string | null) : prev.api_model_id,
        description: body.description !== undefined ? String(body.description) : prev.description,
        active: body.active !== undefined ? Boolean(body.active) : prev.active,
        sort_order: body.sort_order !== undefined ? Number(body.sort_order) : prev.sort_order,
        updated_at: new Date().toISOString(),
      }
      return success(mockStore.baseModels[idx])
    },
  },
  {
    url: /\/api\/admin\/base-models\/([^/]+)$/,
    method: 'delete',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const slug = decodeURIComponent(pathParam(url, /\/base-models\/([^/?]+)$/) ?? '')
      const idx = mockStore.baseModels.findIndex((m) => m.slug === slug)
      if (idx < 0) return fail('Model not found', 404)
      const model = mockStore.baseModels[idx]
      mockStore.baseModels.splice(idx, 1)
      mockStore.offerings = mockStore.offerings.filter((o) => o.model_id !== model.seq_id)
      mockStore.providerRoutes = mockStore.providerRoutes.filter((r) => r.model_id !== model.seq_id)
      return success({ deleted: true })
    },
  },

  // ── Offerings ──
  {
    url: '/api/admin/model-offerings',
    method: 'get',
    response: ({ query, headers }: { query: Record<string, string>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      let items = [...mockStore.offerings]
      if (query.model_id) {
        const modelId = Number(query.model_id)
        items = items.filter((o) => o.model_id === modelId)
      }
      return success(items)
    },
  },
  {
    url: '/api/admin/model-offerings',
    method: 'post',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const modelId = Number(body.model_id)
      const capability = String(body.capability ?? '')
      if (!modelId || !capability) return fail('校验失败', 422)
      if (mockStore.offerings.some((o) => o.model_id === modelId && o.capability === capability)) {
        return fail('capability 冲突', 409)
      }
      const now = new Date().toISOString()
      const offering: MockOffering = {
        seq_id: nextSeqId(mockStore.offerings),
        model_id: modelId,
        capability,
        display_name: String(body.display_name ?? ''),
        description: String(body.description ?? ''),
        thumbnail_url: (body.thumbnail_url as string | null) ?? null,
        icon_url: (body.icon_url as string | null) ?? null,
        starting_price_usd: (body.starting_price_usd as number | null) ?? null,
        standard_price_usd: (body.standard_price_usd as number | null) ?? null,
        price_unit: (body.price_unit as string | null) ?? null,
        price_detail: (body.price_detail as string | null) ?? null,
        readme_md: (body.readme_md as string | null) ?? null,
        readme_md_i18n: (body.readme_md_i18n as Record<string, string> | null) ?? null,
        faq: (body.faq as MockOffering['faq']) ?? [],
        faq_i18n: (body.faq_i18n as Record<string, unknown> | null) ?? null,
        input_schema: (body.input_schema as Record<string, unknown> | null) ?? null,
        examples: (body.examples as MockOffering['examples']) ?? [],
        is_hot: Boolean(body.is_hot),
        is_new: Boolean(body.is_new),
        active: body.active !== false,
        sort_order: Number(body.sort_order) || 0,
        created_at: now,
        updated_at: now,
      }
      mockStore.offerings.push(offering)
      return success(offering)
    },
  },
  {
    url: /\/api\/admin\/model-offerings\/(\d+)$/,
    method: 'get',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const seqId = Number(pathParam(url, /\/model-offerings\/(\d+)$/) ?? 0)
      const offering = mockStore.offerings.find((o) => o.seq_id === seqId)
      if (!offering) return fail('Offering not found', 404)
      return success(offering)
    },
  },
  {
    url: /\/api\/admin\/model-offerings\/(\d+)$/,
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
      const seqId = Number(pathParam(url, /\/model-offerings\/(\d+)$/) ?? 0)
      const idx = mockStore.offerings.findIndex((o) => o.seq_id === seqId)
      if (idx < 0) return fail('Offering not found', 404)
      const prev = mockStore.offerings[idx]
      mockStore.offerings[idx] = {
        ...prev,
        capability: body.capability !== undefined ? String(body.capability) : prev.capability,
        display_name: body.display_name !== undefined ? String(body.display_name) : prev.display_name,
        description: body.description !== undefined ? String(body.description) : prev.description,
        thumbnail_url: body.thumbnail_url !== undefined ? (body.thumbnail_url as string | null) : prev.thumbnail_url,
        icon_url: body.icon_url !== undefined ? (body.icon_url as string | null) : prev.icon_url,
        starting_price_usd:
          body.starting_price_usd !== undefined ? (body.starting_price_usd as number | null) : prev.starting_price_usd,
        standard_price_usd:
          body.standard_price_usd !== undefined ? (body.standard_price_usd as number | null) : prev.standard_price_usd,
        price_unit: body.price_unit !== undefined ? (body.price_unit as string | null) : prev.price_unit,
        price_detail: body.price_detail !== undefined ? (body.price_detail as string | null) : prev.price_detail,
        readme_md: body.readme_md !== undefined ? (body.readme_md as string | null) : prev.readme_md,
        readme_md_i18n:
          body.readme_md_i18n !== undefined
            ? (body.readme_md_i18n as Record<string, string> | null)
            : prev.readme_md_i18n,
        faq: body.faq !== undefined ? (body.faq as MockOffering['faq']) : prev.faq,
        faq_i18n: body.faq_i18n !== undefined ? (body.faq_i18n as Record<string, unknown> | null) : prev.faq_i18n,
        input_schema:
          body.input_schema !== undefined ? (body.input_schema as Record<string, unknown> | null) : prev.input_schema,
        examples: body.examples !== undefined ? (body.examples as MockOffering['examples']) : prev.examples,
        is_hot: body.is_hot !== undefined ? Boolean(body.is_hot) : prev.is_hot,
        is_new: body.is_new !== undefined ? Boolean(body.is_new) : prev.is_new,
        active: body.active !== undefined ? Boolean(body.active) : prev.active,
        sort_order: body.sort_order !== undefined ? Number(body.sort_order) : prev.sort_order,
        updated_at: new Date().toISOString(),
      }
      return success(mockStore.offerings[idx])
    },
  },
  {
    url: /\/api\/admin\/model-offerings\/(\d+)$/,
    method: 'delete',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const seqId = Number(pathParam(url, /\/model-offerings\/(\d+)$/) ?? 0)
      const idx = mockStore.offerings.findIndex((o) => o.seq_id === seqId)
      if (idx < 0) return fail('Offering not found', 404)
      mockStore.offerings.splice(idx, 1)
      return success({ deleted: true })
    },
  },

  // ── Provider Routes ──
  {
    url: /\/api\/admin\/base-models\/([^/]+)\/provider-routes$/,
    method: 'get',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const slug = decodeURIComponent(pathParam(url, /\/base-models\/([^/]+)\/provider-routes/) ?? '')
      const model = findBaseModel(slug)
      if (!model) return fail('Model not found', 404)
      const items = mockStore.providerRoutes
        .filter((r) => r.model_id === model.seq_id)
        .sort((a, b) => a.priority - b.priority)
        .map(stripRoute)
      return success(items)
    },
  },
  {
    url: /\/api\/admin\/base-models\/([^/]+)\/provider-routes$/,
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
      const slug = decodeURIComponent(pathParam(url, /\/base-models\/([^/]+)\/provider-routes/) ?? '')
      const model = findBaseModel(slug)
      if (!model) return fail('Model not found', 404)
      const provider = String(body.provider ?? '')
      const priority = body.priority !== undefined ? Number(body.priority) : 0
      if (mockStore.providerRoutes.some((r) => r.model_id === model.seq_id && r.provider === provider)) {
        return fail('provider 冲突', 409)
      }
      if (mockStore.providerRoutes.some((r) => r.model_id === model.seq_id && r.priority === priority)) {
        return fail('priority 冲突', 409)
      }
      const now = new Date().toISOString()
      const route: MockProviderRoute = {
        seq_id: nextSeqId(mockStore.providerRoutes),
        model_id: model.seq_id,
        provider,
        priority,
        base_url: String(body.base_url ?? ''),
        api_key_encrypted: `enc:${String(body.api_key ?? '')}`,
        api_model_id: (body.api_model_id as string | null) ?? null,
        active: body.active !== false,
        created_at: now,
        updated_at: now,
      }
      mockStore.providerRoutes.push(route)
      return success(stripRoute(route))
    },
  },
  {
    url: /\/api\/admin\/base-models\/([^/]+)\/provider-routes\/(\d+)$/,
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
      const slug = decodeURIComponent(pathParam(url, /\/base-models\/([^/]+)\/provider-routes/) ?? '')
      const seqId = Number(pathParam(url, /\/provider-routes\/(\d+)$/) ?? 0)
      const model = findBaseModel(slug)
      if (!model) return fail('Model not found', 404)
      const idx = mockStore.providerRoutes.findIndex((r) => r.seq_id === seqId && r.model_id === model.seq_id)
      if (idx < 0) return fail('Route not found', 404)
      const prev = mockStore.providerRoutes[idx]
      mockStore.providerRoutes[idx] = {
        ...prev,
        provider: body.provider !== undefined ? String(body.provider) : prev.provider,
        priority: body.priority !== undefined ? Number(body.priority) : prev.priority,
        base_url: body.base_url !== undefined ? String(body.base_url) : prev.base_url,
        api_key_encrypted:
          body.api_key !== undefined ? `enc:${String(body.api_key)}` : prev.api_key_encrypted,
        api_model_id:
          body.api_model_id !== undefined ? (body.api_model_id as string | null) : prev.api_model_id,
        active: body.active !== undefined ? Boolean(body.active) : prev.active,
        updated_at: new Date().toISOString(),
      }
      return success(stripRoute(mockStore.providerRoutes[idx]))
    },
  },
  {
    url: /\/api\/admin\/base-models\/([^/]+)\/provider-routes\/(\d+)$/,
    method: 'delete',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const slug = decodeURIComponent(pathParam(url, /\/base-models\/([^/]+)\/provider-routes/) ?? '')
      const seqId = Number(pathParam(url, /\/provider-routes\/(\d+)$/) ?? 0)
      const model = findBaseModel(slug)
      if (!model) return fail('Model not found', 404)
      const idx = mockStore.providerRoutes.findIndex((r) => r.seq_id === seqId && r.model_id === model.seq_id)
      if (idx < 0) return fail('Route not found', 404)
      mockStore.providerRoutes.splice(idx, 1)
      return success({ deleted: true })
    },
  },
] as MockMethod[]
