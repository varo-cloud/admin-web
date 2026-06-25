import type { MockMethod } from 'vite-plugin-mock'
import { addAuditLog, mockStore } from './store'
import { fail, paginate, pathParam, requireAdmin, success } from './_util'

export default [
  {
    url: '/api/admin/generations',
    method: 'get',
    response: ({ query, headers }: { query: Record<string, string>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      let items = [...mockStore.generations]
      if (query.status) {
        const statuses = query.status.split(',')
        items = items.filter((g) => statuses.includes(g.status))
      }
      if (query.model_id) items = items.filter((g) => g.model_id === query.model_id)
      if (query.email) items = items.filter((g) => g.user_email.includes(query.email))
      if (query.invocation_channel) items = items.filter((g) => g.invocation_channel === query.invocation_channel)
      if (query.refunded === 'true') items = items.filter((g) => g.refunded)
      if (query.refunded === 'false') items = items.filter((g) => !g.refunded)
      const offset = Number(query.offset) || 0
      const limit = Number(query.limit) || 20
      return success(paginate(items, offset, limit))
    },
  },
  {
    url: /\/api\/admin\/generations\/([^/]+)$/,
    method: 'get',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const taskId = decodeURIComponent(pathParam(url, /\/generations\/([^/?]+)$/) ?? '')
      const gen = mockStore.generations.find((g) => g.task_id === taskId)
      if (!gen) return fail('任务不存在', 404)
      return success(gen)
    },
  },
  {
    url: /\/api\/admin\/generations\/([^/]+)\/refund$/,
    method: 'post',
    response: ({
      body,
      headers,
      url,
    }: {
      body: { reason?: string }
      headers: Record<string, string>
      url: string
    }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const taskId = decodeURIComponent(pathParam(url, /\/generations\/([^/]+)\/refund/) ?? '')
      const gen = mockStore.generations.find((g) => g.task_id === taskId)
      if (!gen) return fail('任务不存在', 404)
      if (gen.refunded) return fail('该任务已退款', 409)
      if (gen.cost_usd <= 0) return fail('无可退款金额', 400)

      gen.refunded = true
      const user = mockStore.users.find((u) => u.id === gen.user_id)
      const prevBalance = user?.balanceUsd ?? 0
      if (user) user.balanceUsd = Math.round((user.balanceUsd + gen.cost_usd) * 100) / 100

      const reason = String(body.reason ?? '')
      addAuditLog({
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
        action: 'generation_refund',
        target_type: 'generation',
        target_id: taskId,
        reason,
        before_snapshot: { refunded: false },
        after_snapshot: { refunded: true },
      })

      return success({
        task_id: taskId,
        refunded_usd: gen.cost_usd,
        new_user_balance_usd: user?.balanceUsd ?? prevBalance,
        billing_record_id: `br-refund-${Date.now()}`,
      })
    },
  },
] as MockMethod[]
