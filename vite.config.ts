import path from 'node:path'
import type { ClientRequest } from 'node:http'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMockServe } from 'vite-plugin-mock'

function resolveDevApiProxyTarget(env: Record<string, string>): string | null {
  const configured = env.VITE_DEV_API_PROXY_TARGET?.trim()
  if (!configured || !/^https?:\/\//i.test(configured)) return null

  try {
    return new URL(configured).origin
  } catch {
    return null
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDevServe = command === 'serve'
  const devApiProxyTarget = isDevServe ? resolveDevApiProxyTarget(env) : null
  const devBearerToken = env.VITE_DEV_BEARER_TOKEN?.trim()
  const proxy = devApiProxyTarget
    ? {
        '/api': {
          target: devApiProxyTarget,
          changeOrigin: true,
          secure: true,
          ...(devBearerToken
            ? {
                configure: (proxyServer: { on: (event: 'proxyReq', listener: (req: ClientRequest) => void) => void }) => {
                  proxyServer.on('proxyReq', (proxyReq) => {
                    proxyReq.removeHeader('authorization')
                    proxyReq.setHeader('Authorization', `Bearer ${devBearerToken}`)
                  })
                },
              }
            : {}),
        },
      }
    : undefined

  return {
    base: env.VITE_BASE || '/',
    plugins: [
      vue(),
      viteMockServe({
        mockPath: 'mock',
        enable: command === 'serve' && env.VITE_USE_MOCK !== 'false',
        ignore: (fileName) => fileName.includes('_util') || fileName.includes('store'),
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: proxy ? { proxy } : undefined,
  }
})
