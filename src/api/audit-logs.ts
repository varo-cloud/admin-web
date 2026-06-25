import { http, unwrap } from './http'
import type { AuditLog, AuditLogsPage } from '@/types/admin'

function mapLog(raw: Record<string, unknown>): AuditLog {
  return {
    id: String(raw.id),
    adminUserId: String(raw.admin_user_id),
    adminEmail: String(raw.admin_email),
    action: String(raw.action),
    targetType: String(raw.target_type),
    targetId: String(raw.target_id),
    reason: String(raw.reason),
    beforeSnapshot: (raw.before_snapshot as Record<string, unknown>) ?? null,
    afterSnapshot: (raw.after_snapshot as Record<string, unknown>) ?? null,
    createdAt: Number(raw.created_at),
  }
}

export async function fetchAuditLogs(params: { offset?: number; limit?: number } = {}): Promise<AuditLogsPage> {
  const raw = await unwrap<{ items: Record<string, unknown>[]; total: number; offset: number; limit: number }>(
    http.get('/api/admin/audit-logs', { params }),
  )
  return {
    items: raw.items.map(mapLog),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}
