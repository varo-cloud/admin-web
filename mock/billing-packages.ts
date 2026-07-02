import type { MockMethod } from 'vite-plugin-mock'
import { addAuditLog, mockStore } from './store'
import { fail, pathParam, requireAdmin, success } from './_util'

const PACKAGE_ID_PATTERN = /^[a-z][a-z0-9_-]{0,31}$/

function sortedPackages() {
  return [...mockStore.billingPackages].sort((a, b) => a.sort_order - b.sort_order)
}

function packagesResponse() {
  return sortedPackages()
}

function publicPackagesResponse() {
  return sortedPackages()
    .filter((pkg) => pkg.active)
    .map(({ id, price_usd }) => ({ id, price_usd }))
}

function findPackage(id: string) {
  return mockStore.billingPackages.find((pkg) => pkg.id === id)
}

function hasPendingOrders(presetId: string) {
  return mockStore.transactions.some((txn) => txn.status === 'pending' && txn.package_id === presetId)
}

function hasDuplicateActivePrice(priceUsd: number, excludeId?: string) {
  return mockStore.billingPackages.some(
    (pkg) => pkg.active && pkg.price_usd === priceUsd && pkg.id !== excludeId,
  )
}

export default [
  {
    url: '/api/billing/packages',
    method: 'get',
    response: () => success(publicPackagesResponse()),
  },
  {
    url: '/api/admin/billing/packages',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      return success(packagesResponse())
    },
  },
  {
    url: '/api/admin/billing/packages/reorder',
    method: 'put',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const packageIds = Array.isArray(body.orders)
        ? body.orders.map((o: { id?: string }) => String(o.id ?? ''))
        : Array.isArray(body.package_ids)
          ? body.package_ids.map(String)
          : []
      if (packageIds.length !== mockStore.billingPackages.length) {
        return fail('orders 须包含全部档位', 400)
      }
      const knownIds = new Set(mockStore.billingPackages.map((pkg) => pkg.id))
      if (packageIds.some((id) => !knownIds.has(id))) return fail('存在未知档位 ID', 400)
      const now = Date.now()
      if (Array.isArray(body.orders)) {
        for (const order of body.orders as { id: string; sort_order?: number }[]) {
          const pkg = findPackage(order.id)
          if (pkg) {
            pkg.sort_order = Number(order.sort_order) || 0
            pkg.updated_at = now
          }
        }
      } else {
        packageIds.forEach((id, index) => {
          const pkg = findPackage(id)
          if (pkg) {
            pkg.sort_order = index
            pkg.updated_at = now
          }
        })
      }
      addAuditLog({
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
        action: 'billing_packages_reorder',
        target_type: 'billing_package',
        target_id: 'reorder',
        reason: '充值预设档位排序',
        before_snapshot: null,
        after_snapshot: { orders: body.orders ?? packageIds },
      })
      return success(packagesResponse())
    },
  },
  {
    url: '/api/admin/billing/packages',
    method: 'post',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const id = String(body.id ?? '').trim()
      if (!PACKAGE_ID_PATTERN.test(id)) return fail('id 格式无效', 400)
      if (findPackage(id)) return fail('档位 ID 已存在', 409)
      const priceUsd = Number(body.price_usd)
      if (!Number.isFinite(priceUsd) || priceUsd < 0.01 || priceUsd > 10000) {
        return fail('price_usd 须在 0.01 ~ 10000 之间', 400)
      }
      const active = body.active !== undefined ? Boolean(body.active) : true
      if (active && hasDuplicateActivePrice(priceUsd)) {
        return fail('已存在相同金额的启用档位', 409)
      }
      const now = Date.now()
      const pkg = {
        id,
        price_usd: Math.round(priceUsd * 100) / 100,
        label: (body.label as (typeof mockStore.billingPackages)[number]['label']) ?? null,
        sort_order: Number(body.sort_order ?? mockStore.billingPackages.length),
        active,
        created_at: now,
        updated_at: now,
      }
      mockStore.billingPackages.push(pkg)
      addAuditLog({
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
        action: 'billing_package_create',
        target_type: 'billing_package',
        target_id: id,
        reason: '创建充值预设档位',
        before_snapshot: null,
        after_snapshot: { id, price_usd: pkg.price_usd, active: pkg.active },
      })
      return success(pkg)
    },
  },
  {
    url: /\/api\/admin\/billing\/packages\/([^/]+)\/status$/,
    method: 'patch',
    response: ({
      body,
      headers,
      url,
    }: {
      body: Record<string, unknown>
      headers: Record<string, string>
      url: string
    }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const id = pathParam(url, /\/packages\/([^/]+)\/status/)
      const pkg = id ? findPackage(id) : undefined
      if (!pkg) return fail('档位不存在', 404)
      const active = Boolean(body.active)
      if (active && hasDuplicateActivePrice(pkg.price_usd, pkg.id)) {
        return fail('已存在相同金额的启用档位', 409)
      }
      const prevActive = pkg.active
      pkg.active = active
      pkg.updated_at = Date.now()
      addAuditLog({
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
        action: 'billing_package_status',
        target_type: 'billing_package',
        target_id: id!,
        reason: active ? '启用充值预设档位' : '停用充值预设档位',
        before_snapshot: { active: prevActive },
        after_snapshot: { active: pkg.active },
      })
      return success(pkg)
    },
  },
  {
    url: /\/api\/admin\/billing\/packages\/([^/]+)$/,
    method: 'put',
    response: ({
      body,
      headers,
      url,
    }: {
      body: Record<string, unknown>
      headers: Record<string, string>
      url: string
    }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const id = pathParam(url, /\/packages\/([^/]+)$/)
      const pkg = id ? findPackage(id) : undefined
      if (!pkg) return fail('档位不存在', 404)
      const prev = { price_usd: pkg.price_usd, active: pkg.active, label: pkg.label }
      if (body.price_usd !== undefined) {
        const priceUsd = Number(body.price_usd)
        if (!Number.isFinite(priceUsd) || priceUsd < 0.01 || priceUsd > 10000) {
          return fail('price_usd 须在 0.01 ~ 10000 之间', 400)
        }
        pkg.price_usd = Math.round(priceUsd * 100) / 100
      }
      if (body.label !== undefined) {
        pkg.label = body.label as (typeof mockStore.billingPackages)[number]['label']
      }
      if (body.active !== undefined) pkg.active = Boolean(body.active)
      if (pkg.active && hasDuplicateActivePrice(pkg.price_usd, pkg.id)) {
        return fail('已存在相同金额的启用档位', 409)
      }
      pkg.updated_at = Date.now()
      addAuditLog({
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
        action: 'billing_package_update',
        target_type: 'billing_package',
        target_id: id!,
        reason: '更新充值预设档位',
        before_snapshot: prev,
        after_snapshot: { price_usd: pkg.price_usd, active: pkg.active, label: pkg.label },
      })
      return success(pkg)
    },
  },
  {
    url: /\/api\/admin\/billing\/packages\/([^/]+)$/,
    method: 'delete',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const id = pathParam(url, /\/packages\/([^/]+)$/)
      const pkg = id ? findPackage(id) : undefined
      if (!pkg) return fail('档位不存在', 404)
      if (hasPendingOrders(id!)) return fail('存在关联充值订单', 409)
      const idx = mockStore.billingPackages.findIndex((item) => item.id === id)
      mockStore.billingPackages.splice(idx, 1)
      addAuditLog({
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
        action: 'billing_package_delete',
        target_type: 'billing_package',
        target_id: id!,
        reason: '删除充值预设档位',
        before_snapshot: { id: pkg.id, price_usd: pkg.price_usd, active: pkg.active },
        after_snapshot: null,
      })
      return success(null)
    },
  },
] as MockMethod[]
