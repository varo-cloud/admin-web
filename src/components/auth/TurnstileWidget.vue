<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef } from 'vue'

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script'
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA'

interface TurnstileRenderOptions {
  sitekey: string
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const emit = defineEmits<{
  verified: [token: string]
  expired: []
  error: []
}>()

const containerRef = ref<HTMLElement | null>(null)
const widgetId = shallowRef<string | null>(null)

function resolveSiteKey() {
  return import.meta.env.VITE_TURNSTILE_SITE_KEY || TURNSTILE_TEST_SITE_KEY
}

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.turnstile) return resolve()
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Turnstile failed')), { once: true })
    })
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = TURNSTILE_SCRIPT_ID
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Turnstile failed'))
    document.head.appendChild(script)
  })
}

function renderWidget() {
  if (!containerRef.value || !window.turnstile) return
  widgetId.value = window.turnstile.render(containerRef.value, {
    sitekey: resolveSiteKey(),
    theme: 'light',
    callback: (token) => emit('verified', token),
    'expired-callback': () => emit('expired'),
    'error-callback': () => emit('error'),
  })
}

defineExpose({
  reset() {
    if (widgetId.value && window.turnstile) window.turnstile.reset(widgetId.value)
  },
})

onMounted(async () => {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    emit('verified', 'mock-turnstile-token')
    return
  }
  try {
    await loadTurnstileScript()
    renderWidget()
  } catch {
    emit('error')
  }
})

onUnmounted(() => {
  if (widgetId.value && window.turnstile) {
    window.turnstile.remove(widgetId.value)
    widgetId.value = null
  }
})
</script>

<template>
  <div ref="containerRef" class="turnstile-widget" />
</template>

<style scoped>
.turnstile-widget {
  display: flex;
  justify-content: center;
  min-height: 65px;
}
</style>
