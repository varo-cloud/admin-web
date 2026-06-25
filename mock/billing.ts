import type { MockMethod } from 'vite-plugin-mock'
import { mockStore } from './store'
import { paginate, requireAdmin, success } from './_util'

export default [
  {
    url: '/api/admin/billing/transactions',
    method: 'get',
    response: ({ query, headers }: { query: Record<string, string>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      let items = [...mockStore.transactions]
      if (query.status) items = items.filter((t) => t.status === query.status)
      if (query.email) items = items.filter((t) => t.user_email.includes(query.email))
      if (query.user_id) items = items.filter((t) => t.user_id === query.user_id)
      const offset = Number(query.offset) || 0
      const limit = Number(query.limit) || 20
      return success(paginate(items, offset, limit))
    },
  },
] as MockMethod[]
