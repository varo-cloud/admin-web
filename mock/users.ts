import type { MockMethod } from 'vite-plugin-mock'
import { addAuditLog, mockStore } from './store'
import { fail, paginate, pathParam, requireAdmin, success } from './_util'

export default [
  {
    url: '/api/admin/users',
    method: 'get',
    response: ({ query, headers }: { query: Record<string, string>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response

      let items = [...mockStore.users]
      const q = query.q?.trim().toLowerCase()
      if (q) {
        items = items.filter((u) => u.email.includes(q) || u.id.includes(q))
      }
      if (query.role) items = items.filter((u) => u.role === query.role)
      if (query.status) items = items.filter((u) => u.status === query.status)

      const sort = query.sort || '-created_at'
      const desc = sort.startsWith('-')
      const field = desc ? sort.slice(1) : sort
      items.sort((a, b) => {
        let av: number | string = 0
        let bv: number | string = 0
        if (field === 'balance_usd') {
          av = a.balanceUsd
          bv = b.balanceUsd
        } else if (field === 'last_active_at') {
          av = a.lastActiveAt
          bv = b.lastActiveAt
        } else {
          av = a.createdAt
          bv = b.createdAt
        }
        return desc ? (bv as number) - (av as number) : (av as number) - (bv as number)
      })

      const offset = Number(query.offset) || 0
      const limit = Number(query.limit) || 20
      const page = paginate(items, offset, limit)
      return success({
        ...page,
        items: page.items.map((u) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          status: u.status,
          balance_usd: u.balanceUsd,
          api_keys_count: u.apiKeysCount,
          created_at: u.createdAt,
          last_active_at: u.lastActiveAt,
        })),
      })
    },
  },
  {
    url: /\/api\/admin\/users\/([^/]+)$/,
    method: 'get',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const userId = pathParam(url, /\/users\/([^/?]+)$/)
      const user = mockStore.users.find((u) => u.id === userId)
      if (!user) return fail('用户不存在', 404)
      const keys = mockStore.apiKeys.filter((k) => k.user_id === userId)
      return success({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        balance_usd: user.balanceUsd,
        balance_credits: Math.round(user.balanceUsd * mockStore.config.credits_per_usd),
        created_at: user.createdAt,
        api_keys: keys
          .filter((k) => k.is_active)
          .map((k) => ({
            id: k.id,
            name: k.name,
            prefix: k.prefix,
            is_active: k.is_active,
            last_used_at: k.last_used_at,
            created_at: k.created_at,
          })),
        model_preferences: {
          favourites: ['seedance-t2v'],
          recent: [{ id: 'seedance-t2v', visited_at: user.lastActiveAt }],
        },
      })
    },
  },
  {
    url: /\/api\/admin\/users\/([^/]+)\/balance-adjustment$/,
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
      const userId = pathParam(url, /\/users\/([^/]+)\/balance/)
      const user = mockStore.users.find((u) => u.id === userId)
      if (!user) return fail('用户不存在', 404)

      const amount = Number(body.amount_usd)
      const reason = String(body.reason ?? '')
      if (!amount || amount <= 0) return fail('金额必须大于 0', 400)
      if (reason.length < 5) return fail('原因至少 5 个字', 400)

      const idempotencyKey = body.idempotency_key as string | undefined
      if (idempotencyKey && mockStore.idempotencyKeys.has(idempotencyKey)) {
        return success(mockStore.idempotencyKeys.get(idempotencyKey))
      }

      const previous = user.balanceUsd
      user.balanceUsd = Math.round((previous + amount) * 100) / 100
      const result = {
        user_id: user.id,
        previous_balance_usd: previous,
        new_balance_usd: user.balanceUsd,
        adjustment_usd: amount,
        billing_record_id: `br-${Date.now()}`,
      }
      if (idempotencyKey) mockStore.idempotencyKeys.set(idempotencyKey, result)

      addAuditLog({
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
        action: 'balance_adjustment',
        target_type: 'user',
        target_id: user.id,
        reason,
        before_snapshot: { balance_usd: previous },
        after_snapshot: { balance_usd: user.balanceUsd },
      })

      return success(result)
    },
  },
  {
    url: /\/api\/admin\/users\/([^/]+)$/,
    method: 'patch',
    response: ({
      body,
      headers,
      url,
    }: {
      body: { status?: string }
      headers: Record<string, string>
      url: string
    }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const userId = pathParam(url, /\/users\/([^/?]+)$/)
      const user = mockStore.users.find((u) => u.id === userId)
      if (!user) return fail('用户不存在', 404)
      if (body.status === 'suspended' || body.status === 'active') {
        user.status = body.status
      }
      return success({ id: user.id, status: user.status })
    },
  },
  {
    url: /\/api\/admin\/users\/([^/]+)\/billing\/transactions$/,
    method: 'get',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const userId = pathParam(url, /\/users\/([^/]+)\/billing/)
      const items = mockStore.transactions.filter((t) => t.user_id === userId)
      return success(paginate(items, 0, 20))
    },
  },
  {
    url: /\/api\/admin\/users\/([^/]+)\/billing\/records$/,
    method: 'get',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const userId = pathParam(url, /\/users\/([^/]+)\/billing/)
      const items = mockStore.billingRecords[userId ?? ''] ?? []
      return success(paginate(items, 0, 20))
    },
  },
  {
    url: /\/api\/admin\/users\/([^/]+)\/generations$/,
    method: 'get',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const userId = pathParam(url, /\/users\/([^/]+)\/generations/)
      const items = mockStore.generations
        .filter((g) => g.user_id === userId)
        .map(({ task_id, model, duration, cost_usd, status, invocation_channel, refunded, created_at }) => ({
          task_id,
          model,
          duration,
          cost_usd,
          status,
          invocation_channel,
          refunded,
          created_at,
        }))
      return success(paginate(items, 0, 20))
    },
  },
] as MockMethod[]
