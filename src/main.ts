import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import '@/styles/global.css'
import App from './App.vue'
import router from './router'

async function bootstrap() {
  if (import.meta.env.PROD && import.meta.env.VITE_USE_MOCK === 'true') {
    const { setupProdMockServer } = await import('@/mock/setupProdMockServer')
    await setupProdMockServer()
  }

  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.use(naive)
  app.mount('#app')
}

bootstrap()
