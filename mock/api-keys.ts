import type { MockMethod } from 'vite-plugin-mock'
import { addAuditLog, mockStore } from './store'
import { fail, paginate, requireAdmin, success } from './_util'

export default [
  {
    url: '/api/admin/api-keys',
    method: 'get',
    response: ({ query, headers }: { query: Record<string, string>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      let items = [...mockStore.apiKeys]
      const q = query.q?.trim().toLowerCase()
      if (q) {
        items = items.filter(
          (k) =>
            k.user_email.includes(q) ||
            k.prefix.includes(q) ||
            k.name.toLowerCase().includes(q),
        )
      }
      if (query.is_active === 'true') items = items.filter((k) => k.is_active)
      if (query.is_active === 'false') items = items.filter((k) => !k.is_active)
      const offset = Number(query.offset) || 0
      const limit = Number(query.limit) || 20
      return success(paginate(items, offset, limit))
    },
  },
  {
    url: /\/api\/admin\/api-keys\/([^/]+)$/,
    method: 'delete',
    response: ({ headers }: { headers: Record<string, string> }, req: { url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const keyId = req.url.match(/\/api-keys\/([^/?]+)/)?.[1]
      const key = mockStore.apiKeys.find((k) => k.id === keyId)
      if (!key) return fail('API Key 不存在', 404)
      key.is_active = false
      addAuditLog({
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
        action: 'api_key_revoke',
        target_type: 'api_key',
        target_id: keyId!,
        reason: '管理员撤销',
        before_snapshot: { is_active: true },
        after_snapshot: { is_active: false },
      })
      return success({ revoked: true })
    },
  },
] as MockMethod[]
