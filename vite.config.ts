import path from 'node:path'
import type { ClientRequest } from 'node:http'
import type { ProxyOptions } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMockServe } from 'vite-plugin-mock'

function resolveDevApiProxyTarget(env: Record<string, string>, key: string): string | null {
  const configured = env[key]?.trim()
  if (!configured || !/^https?:\/\//i.test(configured)) return null

  try {
    return new URL(configured).origin
  } catch {
    return null
  }
}

function createDevProxyEntry(target: string, devBearerToken?: string): ProxyOptions {
  return {
    target,
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
  }
}

function buildDevProxy(env: Record<string, string>): Record<string, ProxyOptions> | undefined {
  const devBearerToken = (env.VITE_DEV_AUTH_TOKEN ?? env.VITE_DEV_BEARER_TOKEN)?.trim()
  const adminTarget =
    resolveDevApiProxyTarget(env, 'VITE_DEV_ADMIN_API_PROXY_TARGET') ??
    resolveDevApiProxyTarget(env, 'VITE_DEV_API_PROXY_TARGET')
  const userTarget = resolveDevApiProxyTarget(env, 'VITE_DEV_USER_API_PROXY_TARGET')

  if (adminTarget && userTarget) {
    return {
      '/api/user': createDevProxyEntry(userTarget, devBearerToken),
      '/api/auth': createDevProxyEntry(userTarget, devBearerToken),
      '/api/admin': createDevProxyEntry(adminTarget, devBearerToken),
    }
  }

  const fallbackTarget = adminTarget ?? userTarget
  if (!fallbackTarget) return undefined

  return {
    '/api': createDevProxyEntry(fallbackTarget, devBearerToken),
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDevServe = command === 'serve'
  const proxy = isDevServe ? buildDevProxy(env) : undefined

  return {
    base: env.VITE_BASE || '/',
    plugins: [
      vue(),
      viteMockServe({
        mockPath: 'mock',
        enable: command === 'serve' && env.VITE_USE_MOCK === 'true',
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
