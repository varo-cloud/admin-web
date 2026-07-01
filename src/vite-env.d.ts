/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_USE_MOCK: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_BASE?: string
  readonly VITE_DEV_API_PROXY_TARGET?: string
  readonly VITE_DEV_AUTH_TOKEN?: string
  readonly VITE_DEV_BEARER_TOKEN?: string
  readonly VITE_DEV_REFRESH_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
