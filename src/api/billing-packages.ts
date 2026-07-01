import { http, unwrap } from './http'
import type { BillingPackage } from '@/types/admin'
import type { LocalizedString } from '@/types'
import { localizedStringToPayload, mapApiLocalized } from '@/utils/locale'

interface ApiBillingPackage {
  id: string
  price_usd: number
  label?: LocalizedString | null
  sort_order: number
  active: boolean
  created_at: number
  updated_at: number
}

function mapOptionalLabel(raw: unknown): LocalizedString | undefined {
  if (raw == null) return undefined
  const mapped = mapApiLocalized(raw)
  if (!mapped['en-US']?.trim() && !mapped['zh-CN']?.trim()) return undefined
  return mapped
}

function mapPackage(raw: ApiBillingPackage): BillingPackage {
  return {
    id: raw.id,
    priceUsd: raw.price_usd,
    label: mapOptionalLabel(raw.label),
    sortOrder: raw.sort_order,
    active: raw.active,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function optionalLabelPayload(value: LocalizedString | undefined): Record<string, string> | undefined {
  if (!value) return undefined
  const payload = localizedStringToPayload(value)
  return Object.keys(payload).length > 0 ? payload : undefined
}

export function billingPackageToPayload(pkg: Partial<BillingPackage>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (pkg.id !== undefined) payload.id = pkg.id
  if (pkg.priceUsd !== undefined) payload.price_usd = pkg.priceUsd
  if (pkg.active !== undefined) payload.active = pkg.active
  if (pkg.sortOrder !== undefined) payload.sort_order = pkg.sortOrder
  const label = optionalLabelPayload(pkg.label)
  if (label !== undefined) payload.label = label
  return payload
}

export async function fetchBillingPackages(): Promise<BillingPackage[]> {
  const raw = await unwrap<ApiBillingPackage[]>(http.get('/admin/billing/packages'))
  return [...raw].sort((a, b) => a.sort_order - b.sort_order).map(mapPackage)
}

export async function createBillingPackage(payload: Record<string, unknown>): Promise<BillingPackage> {
  const raw = await unwrap<ApiBillingPackage>(http.post('/admin/billing/packages', payload))
  return mapPackage(raw)
}

export async function updateBillingPackage(id: string, payload: Record<string, unknown>): Promise<BillingPackage> {
  const raw = await unwrap<ApiBillingPackage>(
    http.put(`/admin/billing/packages/${encodeURIComponent(id)}`, payload),
  )
  return mapPackage(raw)
}

export async function updateBillingPackageStatus(id: string, active: boolean) {
  return unwrap(http.patch(`/admin/billing/packages/${encodeURIComponent(id)}/status`, { active }))
}

export async function deleteBillingPackage(id: string) {
  return unwrap(http.delete(`/admin/billing/packages/${encodeURIComponent(id)}`))
}

export async function reorderBillingPackages(packageIds: string[]): Promise<BillingPackage[]> {
  const raw = await unwrap<ApiBillingPackage[]>(
    http.put('/admin/billing/packages/reorder', { package_ids: packageIds }),
  )
  return [...raw].sort((a, b) => a.sort_order - b.sort_order).map(mapPackage)
}
