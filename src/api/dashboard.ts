import { http, unwrap } from './http'
import type { DashboardSummary } from '@/types/admin'

interface ApiDashboard {
  users_total: number
  users_new_today: number
  users_new_this_week: number
  users_active_7d: number
  generations_today: DashboardSummary['generationsToday']
  generations_today_by_channel: DashboardSummary['generationsTodayByChannel']
  revenue_today_usd: number
  spend_today_usd: number
  failure_rate_24h: number
  pending_topups_count: number
  trend: {
    date: string
    generations: number
    revenue_usd: number
    spend_usd: number
    new_users: number
  }[]
}

function mapDashboard(raw: ApiDashboard): DashboardSummary {
  return {
    usersTotal: raw.users_total,
    usersNewToday: raw.users_new_today,
    usersNewThisWeek: raw.users_new_this_week,
    usersActive7d: raw.users_active_7d,
    generationsToday: raw.generations_today,
    generationsTodayByChannel: raw.generations_today_by_channel,
    revenueTodayUsd: raw.revenue_today_usd,
    spendTodayUsd: raw.spend_today_usd,
    failureRate24h: raw.failure_rate_24h,
    pendingTopupsCount: raw.pending_topups_count,
    trend: raw.trend.map((t) => ({
      date: t.date,
      generations: t.generations,
      revenueUsd: t.revenue_usd,
      spendUsd: t.spend_usd,
      newUsers: t.new_users,
    })),
  }
}

export async function fetchDashboardSummary(range = '7d'): Promise<DashboardSummary> {
  const raw = await unwrap<ApiDashboard>(http.get('/admin/dashboard/summary', { params: { range } }))
  return mapDashboard(raw)
}
