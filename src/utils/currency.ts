export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`
}

/**
 * 上游成本展示：有数值显示金额；null 时结合 cost_attempts 判断结算状态。
 * 列表接口无 cost_attempts 时，null 显示为「—」。
 * 非 SandBase（byteplus/ark/dashscope）完成时 cost_attempts=12 属正常，显示「不适用」。
 */
export function formatUpstreamCostUsd(
  upstreamCostUsd: number | null | undefined,
  costAttempts?: number | null,
): string {
  if (upstreamCostUsd != null && Number.isFinite(upstreamCostUsd)) {
    return formatUsd(upstreamCostUsd)
  }
  if (costAttempts == null) return '—'
  if (costAttempts >= 12) return '不适用'
  return '结算中'
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
