import { http, unwrap } from './http'
import type { PricingItem } from '@/types/admin'
import type { PricingPriceUnit } from '@/types'

function mapItem(raw: Record<string, unknown>): PricingItem {
  return {
    id: String(raw.id),
    modelId: String(raw.model_id),
    name: String(raw.name),
    standardPriceUsd: Number(raw.standard_price_usd),
    startingPriceUsd: Number(raw.starting_price_usd),
    priceUnit: raw.price_unit as PricingPriceUnit,
    discountPercent: Number(raw.discount_percent),
    category: String(raw.category),
    mediaType: String(raw.media_type),
    sortOrder: Number(raw.sort_order),
  }
}

export async function fetchPricingItems(): Promise<PricingItem[]> {
  const raw = await unwrap<Record<string, unknown>[]>(http.get('/api/admin/pricing'))
  return raw.map(mapItem)
}

export async function createPricingItem(payload: Record<string, unknown>) {
  const raw = await unwrap<Record<string, unknown>>(http.post('/api/admin/pricing', payload))
  return mapItem(raw)
}

export async function updatePricingItem(id: string, payload: Record<string, unknown>) {
  const raw = await unwrap<Record<string, unknown>>(http.put(`/api/admin/pricing/${id}`, payload))
  return mapItem(raw)
}

export async function deletePricingItem(id: string) {
  return unwrap(http.delete(`/api/admin/pricing/${id}`))
}
