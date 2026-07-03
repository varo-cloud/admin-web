import { http, unwrap } from './http'
import type { AdminAssetUpload } from '@/types/admin'

interface ApiAdminAssetUpload {
  url: string
  filename: string
  content_type: string
  size_bytes: number
  key: string
}

function mapUpload(raw: ApiAdminAssetUpload): AdminAssetUpload {
  return {
    url: raw.url,
    filename: raw.filename,
    contentType: raw.content_type,
    sizeBytes: raw.size_bytes,
    key: raw.key,
  }
}

export async function uploadAdminFile(file: File, options?: { prefix?: string }): Promise<AdminAssetUpload> {
  const form = new FormData()
  form.append('file', file)
  if (options?.prefix?.trim()) form.append('prefix', options.prefix.trim())
  const raw = await unwrap<ApiAdminAssetUpload>(
    http.post('/admin/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    }),
  )
  return mapUpload(raw)
}

export async function deleteAdminFile(key: string): Promise<{ deleted: boolean; key: string }> {
  const raw = await unwrap<{ deleted: boolean; key: string }>(
    http.delete('/admin/upload', { data: { key } }),
  )
  return raw
}
