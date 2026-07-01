import { http, unwrap } from './http'
import type { PricingItem } from '@/types/admin'
import type { PricingPriceUnit } from '@/types'
import { localizedStringToPayload, mapApiLocalized } from '@/utils/locale'

function mapItem(raw: Record<string, unknown>): PricingItem {
  return {
    id: String(raw.id),
    modelId: String(raw.model_id),
    name: mapApiLocalized(raw.name),
    standardPriceUsd: Number(raw.standard_price_usd),
    startingPriceUsd: Number(raw.starting_price_usd),
    priceUnit: raw.price_unit as PricingPriceUnit,
    discountPercent: Number(raw.discount_percent),
    category: String(raw.category),
    mediaType: String(raw.media_type),
    sortOrder: Number(raw.sort_order),
  }
}

export function pricingToPayload(item: Partial<PricingItem>): Record<string, unknown> {
  return {
    id: item.id,
    model_id: item.modelId,
    name: localizedStringToPayload(item.name),
    standard_price_usd: item.standardPriceUsd,
    starting_price_usd: item.startingPriceUsd,
    price_unit: item.priceUnit,
    discount_percent: item.discountPercent,
    category: item.category,
    media_type: item.mediaType,
    sort_order: item.sortOrder,
  }
}

export async function fetchPricingItems(): Promise<PricingItem[]> {
  const raw = await unwrap<Record<string, unknown>[]>(http.get('/admin/pricing'))
  return raw.map(mapItem)
}

export async function createPricingItem(payload: Record<string, unknown>) {
  const raw = await unwrap<Record<string, unknown>>(http.post('/admin/pricing', payload))
  return mapItem(raw)
}

export async function updatePricingItem(id: string, payload: Record<string, unknown>) {
  const raw = await unwrap<Record<string, unknown>>(http.put(`/admin/pricing/${id}`, payload))
  return mapItem(raw)
}

export async function deletePricingItem(id: string) {
  return unwrap(http.delete(`/admin/pricing/${id}`))
}
