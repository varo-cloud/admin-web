import axios, { getAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { MockMethod } from 'vite-plugin-mock'
import { match as matchPath } from 'path-to-regexp'
import { http, userHttp } from '@/api/http'
import { toProdMockUrl, toProdUserMockUrl } from '@/utils/apiBaseUrl'
import authMock from '../../mock/auth'
import dashboardMock from '../../mock/dashboard'
import usersMock from '../../mock/users'
import modelsMock from '../../mock/models'
import generationsMock from '../../mock/generations'
import billingMock from '../../mock/billing'
import billingPackagesMock from '../../mock/billing-packages'
import configMock from '../../mock/config'
import heroCarouselMock from '../../mock/hero-carousel'

const mockModules: MockMethod[] = [
  ...authMock,
  ...dashboardMock,
  ...usersMock,
  ...modelsMock,
  ...generationsMock,
  ...billingMock,
  ...billingPackagesMock,
  ...configMock,
  ...heroCarouselMock,
]

function joinUrl(base: string, path: string): string {
  if (!path || /^https?:\/\//i.test(path)) return path
  const normalizedBase = base.replace(/\/+$/, '')
  const normalizedPath = path.replace(/^\/+/, '')
  return normalizedPath ? `${normalizedBase}/${normalizedPath}` : normalizedBase
}

function queryFromUrl(url: string): Record<string, string> {
  const search = url.split('?')[1]
  if (!search) return {}
  return Object.fromEntries(new URLSearchParams(search))
}

function normalizeHeaders(
  headers: InternalAxiosRequestConfig['headers'],
): Record<string, string> {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) return {}
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') normalized[key.toLowerCase()] = value
  }
  return normalized
}

function resolveRequestUrl(config: InternalAxiosRequestConfig): string {
  const combined = joinUrl(config.baseURL ?? '', config.url ?? '')
  if (/^https?:\/\//i.test(combined)) {
    const url = new URL(combined)
    return `${url.pathname}${url.search}`
  }
  return combined
}

function mockDeployUrl(mockUrl: string | RegExp): string {
  if (mockUrl instanceof RegExp) return mockUrl.source
  if (mockUrl.includes('/user/') || mockUrl.includes('/auth/')) {
    return toProdUserMockUrl(mockUrl)
  }
  return toProdMockUrl(mockUrl)
}

function matchMockUrl(mockUrl: string | RegExp, pathname: string): Record<string, string> | false {
  if (mockUrl instanceof RegExp) {
    return mockUrl.test(pathname) ? {} : false
  }
  const matched = matchPath(mockUrl, { decode: decodeURIComponent })(pathname)
  if (matched === false) return false
  const params: Record<string, string> = {}
  for (const [key, value] of Object.entries(matched.params)) {
    if (typeof value === 'string') params[key] = value
    else if (Array.isArray(value)) params[key] = value[0] ?? ''
  }
  return params
}

function resolveMockResponse(config: InternalAxiosRequestConfig): unknown | null {
  const method = (config.method ?? 'get').toLowerCase()
  const requestUrl = resolveRequestUrl(config)
  const pathname = requestUrl.split('?')[0] ?? requestUrl
  const query: Record<string, string> = { ...queryFromUrl(requestUrl) }

  if (config.params && typeof config.params === 'object') {
    for (const [key, value] of Object.entries(config.params)) {
      if (value !== undefined && value !== null) query[key] = String(value)
    }
  }

  let parsedBody: unknown = config.data
  if (typeof parsedBody === 'string') {
    try {
      parsedBody = JSON.parse(parsedBody)
    } catch {
      /* keep raw */
    }
  }

  for (const mock of mockModules) {
    const mockMethod = (mock.method ?? 'get').toLowerCase()
    if (mockMethod !== method) continue

    const matched = matchMockUrl(mockDeployUrl(mock.url), pathname)
    if (matched === false) continue

    Object.assign(query, matched)

    if (typeof mock.response === 'function') {
      return mock.response({
        method,
        body: parsedBody as Record<string, unknown>,
        query,
        headers: normalizeHeaders(config.headers),
        url: requestUrl,
      })
    }
    return mock.response
  }

  return null
}

export async function setupProdMockServer(): Promise<void> {
  const realAdapter = getAdapter(http.defaults.adapter ?? axios.defaults.adapter)

  const mockAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const mockData = resolveMockResponse(config)
    if (mockData !== null) {
      return {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config,
        request: {},
      }
    }
    return realAdapter(config)
  }

  http.defaults.adapter = mockAdapter
  userHttp.defaults.adapter = mockAdapter
}
