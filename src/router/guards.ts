import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function setupGuards(router: Router) {
  router.beforeEach(async (to) => {
    if (to.meta.public) return true

    const auth = useAuthStore()
    if (!auth.hasToken()) {
      return {
        path: '/forbidden',
        query: { reason: 'unauthenticated', redirect: to.fullPath },
      }
    }

    try {
      await auth.ensureAdminProfile()
      return true
    } catch (e) {
      if (e instanceof Error && e.message === 'forbidden') {
        return { path: '/forbidden', query: { reason: 'forbidden' } }
      }
      auth.clearProfile()
      return {
        path: '/forbidden',
        query: { reason: 'unauthenticated', redirect: to.fullPath },
      }
    }
  })
}
