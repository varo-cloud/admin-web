import { http, unwrap } from './http'
import type { AdminConfig, ProcessingFee } from '@/types/admin'

function mapProcessingFee(raw: Record<string, unknown>): ProcessingFee {
  return {
    percent: Number(raw.percent),
    fixedUsd: Number(raw.fixed_usd),
  }
}

function mapConfig(raw: Record<string, unknown>): AdminConfig {
  const fee = raw.processing_fee as Record<string, unknown> | undefined
  return {
    creditsPerUsd: Number(raw.credits_per_usd),
    processingFee: fee ? mapProcessingFee(fee) : { percent: 0, fixedUsd: 0 },
  }
}

export async function fetchAdminConfig(): Promise<AdminConfig> {
  const raw = await unwrap<Record<string, unknown>>(http.get('/admin/config'))
  return mapConfig(raw)
}

export async function updateProcessingFee(fee: ProcessingFee): Promise<AdminConfig> {
  const raw = await unwrap<Record<string, unknown>>(
    http.put('/admin/config', {
      processing_fee: {
        percent: fee.percent,
        fixed_usd: fee.fixedUsd,
      },
    }),
  )
  return mapConfig(raw)
}

export function validateProcessingFee(fee: ProcessingFee): string | null {
  if (!Number.isFinite(fee.percent) || fee.percent < 0 || fee.percent >= 1) {
    return '费率 percent 须满足 0 ≤ percent < 1'
  }
  if (!Number.isFinite(fee.fixedUsd) || fee.fixedUsd < 0) {
    return '固定费用 fixed_usd 须 ≥ 0'
  }
  return null
}
