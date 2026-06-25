import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchProfile, logout as apiLogout } from '@/api/auth'
import { clearAuthTokens, getToken } from '@/api/http'
import type { AdminProfile } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<AdminProfile | null>(null)
  const loading = ref(false)

  async function loadProfile() {
    loading.value = true
    try {
      profile.value = await fetchProfile()
      return profile.value
    } finally {
      loading.value = false
    }
  }

  async function ensureAdminProfile() {
    if (profile.value) return profile.value
    const p = await loadProfile()
    if (p.role !== 'admin') {
      await signOut()
      throw new Error('forbidden')
    }
    return p
  }

  async function signOut() {
    await apiLogout()
    clearAuthTokens()
    profile.value = null
  }

  function hasToken() {
    return Boolean(getToken())
  }

  return { profile, loading, loadProfile, ensureAdminProfile, signOut, hasToken }
})
