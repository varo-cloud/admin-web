const SECOND_MS = 1000

export function toMillis(timestamp: number): number {
  if (!Number.isFinite(timestamp)) return Number.NaN
  return timestamp < 1e12 ? timestamp * SECOND_MS : timestamp
}

export function parseTimestamp(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

export function formatTimestamp(timestamp: number | string | null | undefined): string {
  if (timestamp == null || timestamp === '') return ''
  const parsed = typeof timestamp === 'number' ? timestamp : parseTimestamp(timestamp)
  if (parsed == null) return ''
  const date = new Date(toMillis(parsed))
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${minute}`
}

export function formatDateTime(value: string | number | null | undefined): string {
  return formatTimestamp(value) || '—'
}

export function toIsoString(timestamp: number | null | undefined): string | undefined {
  if (timestamp == null || !Number.isFinite(timestamp)) return undefined
  return new Date(toMillis(timestamp)).toISOString()
}

export function formatRelativeTimestamp(timestamp: number): string {
  const diffSec = Math.round((toMillis(timestamp) - Date.now()) / SECOND_MS)
  const abs = Math.abs(diffSec)

  if (abs < 60) return `${Math.abs(diffSec)} 秒前`
  const diffMin = Math.round(diffSec / 60)
  if (abs < 3600) return `${Math.abs(diffMin)} 分钟前`
  const diffHour = Math.round(diffSec / 3600)
  if (abs < 86400) return `${Math.abs(diffHour)} 小时前`
  return `${Math.abs(Math.round(diffSec / 86400))} 天前`
}

export function truncateId(id: string, len = 8): string {
  if (id.length <= len) return id
  return `${id.slice(0, len)}…`
}
