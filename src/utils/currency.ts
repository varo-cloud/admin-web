export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`
}

export function formatPriceUnit(unit: string): string {
  const map: Record<string, string> = {
    per_second: '/秒',
    per_image: '/张',
    per_million_tokens: '/百万 tokens',
    per_hour: '/小时',
  }
  return map[unit] ?? unit
}
