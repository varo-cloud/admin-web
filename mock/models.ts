import type { MockMethod } from 'vite-plugin-mock'
import { addAuditLog, mockStore } from './store'
import { fail, paginate, requireAdmin, success } from './_util'

export default [
  {
    url: '/api/admin/models',
    method: 'get',
    response: ({ query, headers }: { query: Record<string, string>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      let items = [...mockStore.models]
      const q = query.q?.trim().toLowerCase()
      if (q) {
        items = items.filter(
          (m) =>
            m.id.includes(q) ||
            m.name.toLowerCase().includes(q) ||
            m.provider.toLowerCase().includes(q),
        )
      }
      if (query.active === 'true') items = items.filter((m) => m.active)
      if (query.active === 'false') items = items.filter((m) => !m.active)
      const offset = Number(query.offset) || 0
      const limit = Number(query.limit) || 20
      return success(paginate(items, offset, limit))
    },
  },
  {
    url: '/api/admin/models',
    method: 'post',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const id = String(body.id ?? '')
      if (!id) return fail('模型 ID 必填', 400)
      if (mockStore.models.some((m) => m.id === id)) return fail('模型 ID 已存在', 409)
      const now = Date.now()
      const model = {
        id,
        name: String(body.name ?? id),
        display_name: body.display_name as string | undefined,
        provider: String(body.provider ?? ''),
        capabilities: (body.capabilities as string[]) ?? [],
        description: String(body.description ?? ''),
        thumbnail_url: body.thumbnail_url as string | undefined,
        model_path: String(body.model_path ?? ''),
        api_model_id: String(body.api_model_id ?? ''),
        active: false,
        is_hot: Boolean(body.is_hot),
        sort_order: Number(body.sort_order) || 100,
        starting_price_usd: Number(body.starting_price_usd) || 0,
        standard_price_usd: body.standard_price_usd as number | undefined,
        price_unit: String(body.price_unit ?? 'per_second'),
        price_detail: body.price_detail as string | undefined,
        discount_percent: body.discount_percent as number | undefined,
        per_run_price_usd: body.per_run_price_usd as number | undefined,
        runs_per_ten_usd: body.runs_per_ten_usd as number | undefined,
        input_schema: (body.input_schema as Record<string, unknown>) ?? { type: 'object', properties: {} },
        readme_md: body.readme_md as string | undefined,
        faq: (body.faq as { question: string; answer: string }[]) ?? [],
        created_at: now,
        updated_at: now,
      }
      mockStore.models.push(model)
      return success(model)
    },
  },
  {
    url: /\/api\/admin\/models\/([^/]+)$/,
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }, req: { url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const modelId = decodeURIComponent(req.url.match(/\/models\/([^/?]+)/)?.[1] ?? '')
      const model = mockStore.models.find((m) => m.id === modelId)
      if (!model) return fail('模型不存在', 404)
      return success(model)
    },
  },
  {
    url: /\/api\/admin\/models\/([^/]+)$/,
    method: 'put',
    response: (
      { body, headers }: { body: Record<string, unknown>; headers: Record<string, string> },
      req: { url: string },
    ) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const modelId = decodeURIComponent(req.url.match(/\/models\/([^/?]+)/)?.[1] ?? '')
      const idx = mockStore.models.findIndex((m) => m.id === modelId)
      if (idx < 0) return fail('模型不存在', 404)
      const prev = mockStore.models[idx]
      mockStore.models[idx] = {
        ...prev,
        ...body,
        id: modelId,
        updated_at: Date.now(),
      } as typeof prev
      addAuditLog({
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
        action: 'model_update',
        target_type: 'model',
        target_id: modelId,
        reason: '模型更新',
        before_snapshot: { active: prev.active },
        after_snapshot: { active: mockStore.models[idx].active },
      })
      return success(mockStore.models[idx])
    },
  },
  {
    url: /\/api\/admin\/models\/([^/]+)\/status$/,
    method: 'patch',
    response: (
      { body, headers }: { body: { active?: boolean }; headers: Record<string, string> },
      req: { url: string },
    ) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const modelId = decodeURIComponent(req.url.match(/\/models\/([^/]+)\/status/)?.[1] ?? '')
      const model = mockStore.models.find((m) => m.id === modelId)
      if (!model) return fail('模型不存在', 404)
      model.active = Boolean(body.active)
      model.updated_at = Date.now()
      return success({ id: model.id, active: model.active })
    },
  },
] as MockMethod[]
