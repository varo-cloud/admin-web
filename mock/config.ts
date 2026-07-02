import type { MockMethod } from 'vite-plugin-mock'
import { mockStore, addAuditLog } from './store'
import { requireAdmin, success, fail } from './_util'

function validateProcessingFee(fee: Record<string, unknown>): string | null {
  const percent = Number(fee.percent)
  const fixedUsd = Number(fee.fixed_usd)
  if (!Number.isFinite(percent) || percent < 0 || percent >= 1) {
    return 'percent must satisfy 0 <= percent < 1'
  }
  if (!Number.isFinite(fixedUsd) || fixedUsd < 0) {
    return 'fixed_usd must be >= 0'
  }
  return null
}

export default [
  {
    url: '/api/admin/config',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      return success(mockStore.config)
    },
  },
  {
    url: '/api/admin/config',
    method: 'put',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response

      if (body.credits_per_usd !== undefined) {
        return fail('credits_per_usd is read-only', 400)
      }

      if (body.processing_fee !== undefined) {
        const fee = body.processing_fee as Record<string, unknown>
        const validationError = validateProcessingFee(fee)
        if (validationError) return fail(validationError, 400)

        const before = { ...mockStore.config.processing_fee }
        mockStore.config.processing_fee = {
          percent: Number(fee.percent),
          fixed_usd: Number(fee.fixed_usd),
        }
        addAuditLog({
          action: 'config_update',
          target_type: 'config',
          target_id: 'processing_fee',
          reason: '更新支付手续费',
          before_snapshot: { processing_fee: before },
          after_snapshot: { processing_fee: mockStore.config.processing_fee },
          admin_user_id: auth.user.id,
          admin_email: auth.user.email,
        })
      } else if (Object.keys(body).length > 0) {
        return fail('Only processing_fee can be updated', 400)
      }

      return success(mockStore.config)
    },
  },
] as MockMethod[]
