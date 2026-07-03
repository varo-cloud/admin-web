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

function isAllowedKey(key: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(key) && !key.includes('..')
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
      if (!isAllowedKey(key)) return fail('key 格式无效', 400)
      if (!uploadedKeys.has(key)) return fail('文件不存在', 404)

      uploadedKeys.delete(key)

      addAuditLog({
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
        action: 'admin_upload_delete',
        target_type: 'asset',
        target_id: key,
        reason: `删除文件 ${key}`,
        before_snapshot: { key },
        after_snapshot: null,
      })

      return success({ deleted: true, key })
    },
  },
] as MockMethod[]
