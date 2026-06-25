import type { MockMethod } from 'vite-plugin-mock'
import { mockStore } from './store'
import { requireAdmin, success } from './_util'

function buildTrend(range: string) {
  const days = range === '24h' ? 1 : range === '30d' ? 30 : 7
  const trend = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    trend.push({
      date: d.toISOString().slice(0, 10),
      generations: 300 + Math.floor(Math.random() * 200),
      revenue_usd: 800 + Math.random() * 500,
      spend_usd: 600 + Math.random() * 400,
      new_users: 5 + Math.floor(Math.random() * 15),
    })
  }
  return trend
}

export default [
  {
    url: '/api/admin/dashboard/summary',
    method: 'get',
    response: ({ query, headers }: { query: Record<string, string>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const range = query.range || '7d'
      const pending = mockStore.transactions.filter((t) => t.status === 'pending').length
      return success({
        users_total: mockStore.users.length,
        users_new_today: 12,
        users_new_this_week: 85,
        users_active_7d: 320,
        generations_today: { total: 450, queued: 5, processing: 12, completed: 420, failed: 13 },
        generations_today_by_channel: { web: 180, api: 270 },
        revenue_today_usd: 1250,
        spend_today_usd: 890.5,
        failure_rate_24h: 0.029,
        pending_topups_count: pending,
        trend: buildTrend(range),
      })
    },
  },
] as MockMethod[]
