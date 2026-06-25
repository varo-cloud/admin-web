export type ContentLocale = 'en-US' | 'zh-CN'

export type LocalizedString = Partial<Record<ContentLocale, string>>

export const CONTENT_LOCALES: ContentLocale[] = ['en-US', 'zh-CN']

export const LOCALE_TAB_LABELS: Record<ContentLocale, string> = {
  'en-US': 'English (en-US)',
  'zh-CN': '简体中文 (zh-CN)',
}

export function emptyLocalizedString(): LocalizedString {
  return { 'en-US': '', 'zh-CN': '' }
}

/** 列表展示：优先 en-US，无则 fallback zh-CN */
export function resolveLocalizedString(
  value: LocalizedString | string | undefined | null,
  preferred: ContentLocale = 'en-US',
): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  const fallback: ContentLocale = preferred === 'en-US' ? 'zh-CN' : 'en-US'
  return value[preferred]?.trim() || value[fallback]?.trim() || ''
}

export function normalizeLocalizedString(value: LocalizedString | string | undefined | null): LocalizedString {
  if (!value) return emptyLocalizedString()
  if (typeof value === 'string') return { 'en-US': value, 'zh-CN': '' }
  return {
    'en-US': value['en-US'] ?? '',
    'zh-CN': value['zh-CN'] ?? '',
  }
}

export function localizedStringToPayload(value: LocalizedString | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  const normalized = normalizeLocalizedString(value)
  if (normalized['en-US']?.trim()) result['en-US'] = normalized['en-US'].trim()
  if (normalized['zh-CN']?.trim()) result['zh-CN'] = normalized['zh-CN'].trim()
  return result
}

export function mapApiLocalized(raw: unknown): LocalizedString {
  return normalizeLocalizedString(raw as LocalizedString | string | undefined)
}
