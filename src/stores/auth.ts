import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchProfile } from '@/api/auth'
import { getToken } from '@/api/http'
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
    if (profile.value?.role === 'admin') return profile.value

    const p = await loadProfile()
    if (p.role !== 'admin') {
      profile.value = p
      throw new Error('forbidden')
    }
    return p
  }

  function clearProfile() {
    profile.value = null
  }

  function hasToken() {
    return Boolean(getToken())
  }

  return { profile, loading, loadProfile, ensureAdminProfile, clearProfile, hasToken }
})
