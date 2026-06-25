import type { MockMethod } from 'vite-plugin-mock'
import { mockStore } from './store'
import { requireAdmin, success } from './_util'

export default [
  {
    url: '/api/admin/config',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      return success(mockStore.config)
    },
  },
  {
    url: '/api/admin/config',
    method: 'put',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      Object.assign(mockStore.config, body)
      return success(mockStore.config)
    },
  },
] as MockMethod[]
