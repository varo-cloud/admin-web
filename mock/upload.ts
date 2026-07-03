import type { MockMethod } from 'vite-plugin-mock'
import { fail, requireAdmin, success } from './_util'

const uploadedKeys = new Set<string>()

function guessContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    pdf: 'application/pdf',
    json: 'application/json',
    txt: 'text/plain',
    zip: 'application/zip',
  }
  return map[ext] ?? 'application/octet-stream'
}

function sanitizePrefix(raw: unknown): string {
  const value = String(raw ?? 'uploads').trim() || 'uploads'
  return value.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '') || 'uploads'
}

function randomObjectId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

export default [
  {
    url: '/api/admin/upload',
    method: 'post',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response

      const filename = String(body.filename ?? body.name ?? 'file.bin')
      const prefix = sanitizePrefix(body.prefix)
      const sizeBytes = Number(body.size ?? body.size_bytes ?? 1024)
      const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : ''
      const key = `${prefix}/${randomObjectId()}${ext}`
      const url = `https://cdn.varo.cloud/${key}`

      uploadedKeys.add(key)

      return success({
        url,
        filename,
        content_type: guessContentType(filename),
        size_bytes: sizeBytes,
        key,
      })
    },
  },
  {
    url: '/api/admin/upload',
    method: 'delete',
    response: ({ body, headers }: { body: { key?: string }; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response

      const key = String(body?.key ?? '').trim()
      if (!key) return fail('key 不能为空', 400)

      uploadedKeys.delete(key)

      return success({ deleted: true, key })
    },
  },
] as MockMethod[]
