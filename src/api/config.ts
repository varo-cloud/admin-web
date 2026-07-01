import { http, unwrap } from './http'
import type { CreditPackage, SystemConfig } from '@/types/admin'

function mapConfig(raw: Record<string, unknown>): SystemConfig {
  const packages = (raw.credit_packages as Record<string, unknown>[]) ?? []
  const secrets = (raw.secrets as Record<string, { configured: boolean }>) ?? {}
  return {
    creditsPerUsd: Number(raw.credits_per_usd),
    creditPackages: packages.map(
      (p): CreditPackage => ({
        id: String(p.id),
        priceUsd: Number(p.price_usd),
        credits: Number(p.credits),
        stripePriceId: String(p.stripe_price_id),
      }),
    ),
    signupBonusUsd: Number(raw.signup_bonus_usd),
    initialBalanceUsd: Number(raw.initial_balance_usd),
    defaultRateLimitRpm: Number(raw.default_rate_limit_rpm),
    uploadMaxSizeMb: Number(raw.upload_max_size_mb),
    secrets,
  }
}

export async function fetchConfig(): Promise<SystemConfig> {
  const raw = await unwrap<Record<string, unknown>>(http.get('/admin/config'))
  return mapConfig(raw)
}

export async function updateConfig(payload: Record<string, unknown>): Promise<SystemConfig> {
  const raw = await unwrap<Record<string, unknown>>(http.put('/admin/config', payload))
  return mapConfig(raw)
}
