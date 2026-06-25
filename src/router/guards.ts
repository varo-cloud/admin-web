import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function setupGuards(router: Router) {
  router.beforeEach(async (to) => {
    if (to.meta.public) return true

    const auth = useAuthStore()
    if (!auth.hasToken()) return { path: '/login', query: { redirect: to.fullPath } }

    try {
      const profile = await auth.ensureAdminProfile()
      if (profile.role !== 'admin') {
        await auth.signOut()
        return { path: '/login', query: { error: 'forbidden' } }
      }
      return true
    } catch {
      if (!auth.hasToken()) return { path: '/login', query: { redirect: to.fullPath } }
      await auth.signOut()
      return { path: '/login', query: { error: 'forbidden' } }
    }
  })
}
