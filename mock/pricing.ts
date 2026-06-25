import type { MockMethod } from 'vite-plugin-mock'
import { mockStore } from './store'
import { fail, pathParam, requireAdmin, success } from './_util'

export default [
  {
    url: '/api/admin/pricing',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      return success(mockStore.pricing)
    },
  },
  {
    url: '/api/admin/pricing',
    method: 'post',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const item = { id: String(body.id ?? `pricing-${Date.now()}`), ...body } as (typeof mockStore.pricing)[0]
      mockStore.pricing.push(item)
      return success(item)
    },
  },
  {
    url: /\/api\/admin\/pricing\/([^/]+)$/,
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
      const id = pathParam(url, /\/pricing\/([^/?]+)/)
      const idx = mockStore.pricing.findIndex((p) => p.id === id)
      if (idx < 0) return fail('定价条目不存在', 404)
      mockStore.pricing[idx] = { ...mockStore.pricing[idx], ...body, id: id! }
      return success(mockStore.pricing[idx])
    },
  },
  {
    url: /\/api\/admin\/pricing\/([^/]+)$/,
    method: 'delete',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const id = pathParam(url, /\/pricing\/([^/?]+)/)
      const idx = mockStore.pricing.findIndex((p) => p.id === id)
      if (idx < 0) return fail('定价条目不存在', 404)
      mockStore.pricing.splice(idx, 1)
      return success({ deleted: true })
    },
  },
] as MockMethod[]
