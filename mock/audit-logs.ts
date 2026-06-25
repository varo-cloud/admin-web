import type { MockMethod } from 'vite-plugin-mock'
import { mockStore } from './store'
import { paginate, requireAdmin, success } from './_util'

export default [
  {
    url: '/api/admin/audit-logs',
    method: 'get',
    response: ({ query, headers }: { query: Record<string, string>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const offset = Number(query.offset) || 0
      const limit = Number(query.limit) || 20
      return success(paginate(mockStore.auditLogs, offset, limit))
    },
  },
] as MockMethod[]
