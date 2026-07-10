import type { OfferingExample } from '@/types/admin'
import type { LocalizedString } from '@/types'
import { localizedStringToPayload, normalizeLocalizedString } from '@/utils/locale'

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/

export interface OfferingExampleForm {
  id: string
  title: LocalizedString
  description: LocalizedString
  inputJson: string
  outputUrl: string
  thumbnailUrl: string
  sortOrder: number | null
}

export function emptyExampleForm(sortOrder = 0): OfferingExampleForm {
  return {
    id: '',
    title: { 'en-US': '', 'zh-CN': '' },
    description: { 'en-US': '', 'zh-CN': '' },
    inputJson: '{}',
    outputUrl: '',
    thumbnailUrl: '',
    sortOrder,
  }
}

export function mapApiExample(raw: Record<string, unknown>): OfferingExample {
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    titleI18n: (raw.title_i18n as Record<string, string> | null) ?? null,
    description: raw.description != null ? String(raw.description) : null,
    descriptionI18n: (raw.description_i18n as Record<string, string> | null) ?? null,
    input: (raw.input as Record<string, unknown>) ?? {},
    outputUrl: raw.output_url != null ? String(raw.output_url) : null,
    thumbnailUrl: raw.thumbnail_url != null ? String(raw.thumbnail_url) : null,
    sortOrder: raw.sort_order != null ? Number(raw.sort_order) : null,
  }
}

export function exampleToApiPayload(example: OfferingExample): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: example.id,
    title: example.title,
    input: example.input,
  }
  if (example.titleI18n && Object.keys(example.titleI18n).length > 0) {
    payload.title_i18n = example.titleI18n
  }
  if (example.description?.trim()) payload.description = example.description.trim()
  if (example.descriptionI18n && Object.keys(example.descriptionI18n).length > 0) {
    payload.description_i18n = example.descriptionI18n
  }
  if (example.outputUrl?.trim()) payload.output_url = example.outputUrl.trim()
  if (example.thumbnailUrl?.trim()) payload.thumbnail_url = example.thumbnailUrl.trim()
  if (example.sortOrder != null) payload.sort_order = example.sortOrder
  return payload
}

export function exampleToForm(example: OfferingExample): OfferingExampleForm {
  const title = normalizeLocalizedString(example.titleI18n)
  title['en-US'] = example.title || title['en-US'] || ''

  const description = normalizeLocalizedString(example.descriptionI18n)
  if (example.description) description['en-US'] = example.description

  return {
    id: example.id,
    title,
    description,
    inputJson: JSON.stringify(example.input ?? {}, null, 2),
    outputUrl: example.outputUrl ?? '',
    thumbnailUrl: example.thumbnailUrl ?? '',
    sortOrder: example.sortOrder ?? null,
  }
}

export function formToExample(form: OfferingExampleForm): OfferingExample {
  const titleEn = form.title['en-US']?.trim() ?? ''
  const titleI18nPayload = localizedStringToPayload(form.title)
  delete titleI18nPayload['en-US']
  const titleI18n = Object.keys(titleI18nPayload).length > 0 ? titleI18nPayload : null

  const descEn = form.description['en-US']?.trim() ?? ''
  const descI18nPayload = localizedStringToPayload(form.description)
  delete descI18nPayload['en-US']
  const descriptionI18n = Object.keys(descI18nPayload).length > 0 ? descI18nPayload : null

  const descZh = form.description['zh-CN']?.trim()
  const description =
    descEn || descZh
      ? descEn || null
      : null

  return {
    id: form.id.trim(),
    title: titleEn,
    titleI18n,
    description,
    descriptionI18n,
    input: JSON.parse(form.inputJson || '{}'),
    outputUrl: form.outputUrl.trim() || null,
    thumbnailUrl: form.thumbnailUrl.trim() || null,
    sortOrder: form.sortOrder,
  }
}

export function validateExampleForm(
  form: OfferingExampleForm,
  existingIds: string[],
  editingId?: string,
): string | null {
  const id = form.id.trim()
  if (!id) return '请填写示例 ID'
  if (!ID_PATTERN.test(id)) return 'ID 格式无效，须为小写字母/数字/连字符，且以字母或数字开头'
  if (existingIds.includes(id) && id !== editingId) return `ID「${id}」已存在`

  if (!form.title['en-US']?.trim()) return '请填写英文标题 (en-US)'

  try {
    const input = JSON.parse(form.inputJson || '{}')
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
      return 'input 必须是 JSON 对象'
    }
  } catch {
    return 'input JSON 格式无效'
  }

  for (const urlField of [
    { label: 'output_url', value: form.outputUrl },
    { label: 'thumbnail_url', value: form.thumbnailUrl },
  ]) {
    const v = urlField.value.trim()
    if (v && !/^https?:\/\/.+/i.test(v)) return `${urlField.label} 须为 http(s) URL`
  }

  return null
}

export function parseOfferingModelId(model: string): { slug: string; capability: string } | null {
  const trimmed = model.trim()
  const slash = trimmed.indexOf('/')
  if (slash <= 0 || slash >= trimmed.length - 1) return null
  return {
    slug: trimmed.slice(0, slash),
    capability: trimmed.slice(slash + 1),
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function suggestExampleId(input: Record<string, unknown>, taskId: string): string {
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : ''
  const fromPrompt = slugify(prompt)
  if (fromPrompt && ID_PATTERN.test(fromPrompt)) return fromPrompt
  const short = taskId.replace(/-/g, '').slice(0, 8)
  return `gen-${short}`
}

export function suggestExampleTitle(input: Record<string, unknown>): string {
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : ''
  if (!prompt) return 'Generation example'
  return prompt.length > 80 ? `${prompt.slice(0, 77)}...` : prompt
}

export function exampleFormFromGeneration(
  input: Record<string, unknown>,
  outputUrl: string,
  taskId: string,
  sortOrder = 0,
): OfferingExampleForm {
  const title = suggestExampleTitle(input)
  return {
    id: suggestExampleId(input, taskId),
    title: { 'en-US': title, 'zh-CN': '' },
    description: { 'en-US': '', 'zh-CN': '' },
    inputJson: JSON.stringify(input ?? {}, null, 2),
    outputUrl,
    thumbnailUrl: '',
    sortOrder,
  }
}

export function upsertExample(
  examples: OfferingExample[],
  example: OfferingExample,
): { list: OfferingExample[]; replaced: boolean } {
  const idx = examples.findIndex((e) => e.id === example.id)
  if (idx >= 0) {
    const list = [...examples]
    list[idx] = example
    return { list, replaced: true }
  }
  return { list: [...examples, example], replaced: false }
}

export function validateExamplesList(examples: OfferingExample[]): string | null {
  const ids = new Set<string>()
  for (const ex of examples) {
    if (!ex.id?.trim()) return '存在缺少 ID 的示例'
    if (!ID_PATTERN.test(ex.id)) return `示例 ID「${ex.id}」格式无效`
    if (ids.has(ex.id)) return `示例 ID「${ex.id}」重复`
    ids.add(ex.id)
    if (!ex.title?.trim()) return `示例「${ex.id}」缺少标题`
    if (!ex.input || typeof ex.input !== 'object' || Array.isArray(ex.input)) {
      return `示例「${ex.id}」的 input 必须是对象`
    }
  }
  return null
}
