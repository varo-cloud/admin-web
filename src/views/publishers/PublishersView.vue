<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import {
  NButton,
  NCard,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NPagination,
  NSelect,
  NSpin,
  NSwitch,
  NTag,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import LocaleTabs from '@/components/LocaleTabs.vue'
import {
  assignPublisherModels,
  createPublisher,
  deletePublisher,
  fetchPublishers,
  i18nToDisplayNameLocalized,
  publisherToPayload,
  updatePublisher,
} from '@/api/publishers'
import { fetchBaseModels } from '@/api/models'
import type { BaseModel, Publisher } from '@/types/admin'
import type { ContentLocale, LocalizedString } from '@/types'
import { emptyLocalizedString, resolveLocalizedString } from '@/utils/locale'
import { formatTimestamp } from '@/utils/time'
import CopyText from '@/components/CopyText.vue'

const SLUG_PATTERN = /^[a-z0-9-]{2,64}$/

type PublisherForm = Partial<Publisher> & {
  isNew?: boolean
  displayNameLocalized: LocalizedString
}

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const saving = ref(false)
const assigning = ref(false)
const drawerShow = ref(false)
const assignDrawerShow = ref(false)
const locale = ref<ContentLocale>('en-US')
const items = ref<Publisher[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const q = ref('')
const activeFilter = ref<string>('')
const editing = ref<PublisherForm | null>(null)
const assigningPublisher = ref<Publisher | null>(null)
const baseModels = ref<BaseModel[]>([])
const selectedModelSlugs = ref<string[]>([])
const initialModelSlugs = ref<string[]>([])

const activeOptions = [
  { label: '全部状态', value: '' },
  { label: '已启用', value: 'true' },
  { label: '已停用', value: 'false' },
]

const modelOptions = computed(() =>
  baseModels.value.map((m) => ({
    label:
      m.publisherSlug && m.publisherSlug !== assigningPublisher.value?.slug
        ? `${m.slug} (当前: ${m.publisherSlug})`
        : m.slug,
    value: m.slug,
  })),
)

function defaultPublisher(): PublisherForm {
  return {
    isNew: true,
    slug: '',
    displayName: '',
    displayNameLocalized: emptyLocalizedString(),
    logoUrl: null,
    coverUrl: null,
    description: '',
    active: true,
    sortOrder: 0,
  }
}

function publisherLabel(row: Publisher) {
  return resolveLocalizedString({
    'en-US': row.displayName,
    'zh-CN': row.displayNameI18n?.['zh-CN'] ?? '',
  })
}

async function load() {
  loading.value = true
  try {
    const res = await fetchPublishers({
      offset: (page.value - 1) * pageSize.value,
      limit: pageSize.value,
      q: q.value.trim() || undefined,
      active: activeFilter.value === '' ? undefined : activeFilter.value === 'true',
    })
    items.value = res.items
    total.value = res.total
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  void load()
}

function openEditor(row?: Publisher) {
  locale.value = 'en-US'
  editing.value = row
    ? {
        ...row,
        displayNameLocalized: i18nToDisplayNameLocalized(row.displayName, row.displayNameI18n),
        isNew: false,
      }
    : defaultPublisher()
  drawerShow.value = true
}

async function savePublisher() {
  if (!editing.value) return
  const slug = editing.value.slug?.trim()
  if (editing.value.isNew) {
    if (!slug) return message.warning('请填写 slug')
    if (!SLUG_PATTERN.test(slug)) {
      return message.warning('slug 仅含小写字母、数字、连字符，长度 2–64')
    }
  }
  if (!editing.value.displayNameLocalized['en-US']?.trim()) {
    locale.value = 'en-US'
    return message.warning('请填写展示名称英文 (en-US)')
  }

  saving.value = true
  try {
    const payload = publisherToPayload(
      { ...editing.value, displayNameLocalized: editing.value.displayNameLocalized },
      { includeSlug: !!editing.value.isNew },
    )
    if (editing.value.isNew) {
      await createPublisher(payload)
      message.success('发布方已创建')
    } else {
      await updatePublisher(editing.value.slug!, payload)
      message.success('发布方已更新')
    }
    drawerShow.value = false
    await load()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

function toggleStatus(row: Publisher, active: boolean) {
  const action = active ? '启用' : '停用'
  const run = async () => {
    try {
      await updatePublisher(row.slug, { active })
      message.success(`${action}成功`)
      await load()
    } catch (e) {
      message.error(e instanceof Error ? e.message : `${action}失败`)
    }
  }
  if (active) {
    void run()
    return
  }
  dialog.warning({
    title: '停用发布方',
    content: '停用后前台 facets 不再展示该发布方，已关联模型卡片 publisher 字段将为 null。',
    positiveText: '确认',
    onPositiveClick: run,
  })
}

function removePublisher(row: Publisher) {
  const hasModels = row.modelCount > 0
  dialog.warning({
    title: '删除发布方',
    content: hasModels
      ? `「${row.slug}」仍关联 ${row.modelCount} 个基座模型，须先解绑后再删除。`
      : `确认删除发布方「${row.slug}」？此操作不可恢复。`,
    positiveText: hasModels ? '知道了' : '删除',
    positiveButtonProps: hasModels ? { type: 'default' } : { type: 'error' },
    onPositiveClick: async () => {
      if (hasModels) return
      try {
        await deletePublisher(row.slug)
        message.success('已删除')
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '删除失败')
      }
    },
  })
}

async function openAssignModels(row: Publisher) {
  assigningPublisher.value = row
  try {
    baseModels.value = await fetchBaseModels()
    const bound = baseModels.value.filter((m) => m.publisherSlug === row.slug).map((m) => m.slug)
    selectedModelSlugs.value = [...bound]
    initialModelSlugs.value = [...bound]
    assignDrawerShow.value = true
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载模型列表失败')
  }
}

async function saveAssignModels() {
  if (!assigningPublisher.value) return
  const slug = assigningPublisher.value.slug
  const toClear = initialModelSlugs.value.filter((s) => !selectedModelSlugs.value.includes(s))
  const toSet = selectedModelSlugs.value.filter((s) => !initialModelSlugs.value.includes(s))

  assigning.value = true
  try {
    const messages: string[] = []
    if (toClear.length) {
      const res = await assignPublisherModels(slug, { modelSlugs: toClear, mode: 'clear' })
      messages.push(`解绑 ${res.updated.length} 个`)
      if (res.notFound.length) messages.push(`未找到: ${res.notFound.join(', ')}`)
    }
    if (toSet.length) {
      const res = await assignPublisherModels(slug, { modelSlugs: toSet, mode: 'set' })
      messages.push(`绑定 ${res.updated.length} 个`)
      if (res.notFound.length) messages.push(`未找到: ${res.notFound.join(', ')}`)
    }
    if (!toClear.length && !toSet.length) {
      message.info('无变更')
    } else {
      message.success(messages.join('；'))
    }
    assignDrawerShow.value = false
    await load()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '绑定失败')
  } finally {
    assigning.value = false
  }
}

const columns: DataTableColumns<Publisher> = [
  { title: 'Slug', key: 'slug', render: (r) => h(CopyText, { text: r.slug }) },
  {
    title: '展示名称',
    key: 'displayName',
    render: (r) => publisherLabel(r),
  },
  {
    title: 'Logo',
    key: 'logoUrl',
    width: 70,
    render: (r) => (r.logoUrl ? '有' : '—'),
  },
  {
    title: 'Cover',
    key: 'coverUrl',
    width: 70,
    render: (r) => (r.coverUrl ? '有' : '—'),
  },
  { title: '关联模型', key: 'modelCount', width: 90 },
  { title: '排序', key: 'sortOrder', width: 70 },
  {
    title: '状态',
    key: 'active',
    width: 90,
    render: (r) =>
      h(NTag, { type: r.active ? 'success' : 'default', size: 'small' }, () => (r.active ? '启用' : '停用')),
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    width: 160,
    render: (r) => formatTimestamp(r.updatedAt),
  },
  {
    title: '操作',
    key: 'actions',
    render: (r) =>
      h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;align-items:center' }, [
        h(NButton, { size: 'small', onClick: () => openEditor(r) }, () => '编辑'),
        h(NButton, { size: 'small', onClick: () => openAssignModels(r) }, () => '绑定模型'),
        h(NSwitch, { value: r.active, size: 'small', onUpdateValue: (v: boolean) => toggleStatus(r, v) }),
        h(NButton, { size: 'small', type: 'error', onClick: () => removePublisher(r) }, () => '删除'),
      ]),
  },
]

watch([page, activeFilter], () => {
  void load()
})

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">发布方 (Publisher)</h1>
    </div>

    <NSpin :show="loading">
      <NCard>
        <p class="hint">
          管理模型研发/发布组织（如 ByteDance、Kuaishou），与 upstream 路由层的 provider 不同。
          停用后前台 facets 隐藏，但 Admin 侧模型绑定仍保留。
        </p>
        <div class="toolbar">
          <NInput
            v-model:value="q"
            placeholder="搜索 slug / 展示名称"
            clearable
            style="width: 240px"
            @keyup.enter="search"
          />
          <NSelect v-model:value="activeFilter" :options="activeOptions" style="width: 120px" />
          <NButton @click="search">搜索</NButton>
          <NButton type="primary" @click="openEditor()">新建发布方</NButton>
        </div>
        <NDataTable :columns="columns" :data="items" :scroll-x="1000" />
        <div class="pagination">
          <NPagination
            v-model:page="page"
            v-model:page-size="pageSize"
            :item-count="total"
            show-size-picker
            :page-sizes="[20, 50, 100]"
            @update:page="load"
            @update:page-size="() => { page = 1; load() }"
          />
        </div>
      </NCard>
    </NSpin>

    <NDrawer v-model:show="drawerShow" :width="520">
      <NDrawerContent :title="editing?.isNew ? '新建发布方' : `编辑发布方 · ${editing?.slug}`">
        <NForm v-if="editing" label-placement="top">
          <NFormItem label="Slug *">
            <NInput
              v-model:value="editing.slug"
              :disabled="!editing.isNew"
              placeholder="如 bytedance"
            />
          </NFormItem>
          <LocaleTabs v-model:locale="locale">
            <NFormItem :label="locale === 'en-US' ? '展示名称 *' : '展示名称'">
              <NInput v-model:value="editing.displayNameLocalized[locale]" />
            </NFormItem>
          </LocaleTabs>
          <NFormItem label="Logo URL">
            <NInput v-model:value="editing.logoUrl" placeholder="https://cdn.example.com/logo.svg" />
          </NFormItem>
          <NFormItem label="Cover URL">
            <NInput v-model:value="editing.coverUrl" placeholder="https://cdn.example.com/cover.jpg" />
          </NFormItem>
          <NFormItem label="简介（Admin 用）">
            <NInput v-model:value="editing.description" type="textarea" :rows="3" />
          </NFormItem>
          <NFormItem label="排序">
            <NInputNumber v-model:value="editing.sortOrder" :min="0" style="width: 100%" />
          </NFormItem>
          <NFormItem label="启用">
            <NSwitch v-model:value="editing.active" />
          </NFormItem>
          <NButton type="primary" :loading="saving" @click="savePublisher">保存</NButton>
        </NForm>
      </NDrawerContent>
    </NDrawer>

    <NDrawer v-model:show="assignDrawerShow" :width="520">
      <NDrawerContent :title="`绑定模型 · ${assigningPublisher?.slug}`" closable>
        <p class="hint">
          选择要绑定到此发布方的基座模型。已绑定到其他发布方的模型若被选中，将被迁移过来。
        </p>
        <NForm label-placement="top">
          <NFormItem label="基座模型">
            <NSelect
              v-model:value="selectedModelSlugs"
              :options="modelOptions"
              multiple
              filterable
              placeholder="选择模型 slug"
            />
          </NFormItem>
        </NForm>
        <template #footer>
          <NButton @click="assignDrawerShow = false">取消</NButton>
          <NButton type="primary" :loading="assigning" style="margin-left: 8px" @click="saveAssignModels">
            保存绑定
          </NButton>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
.hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: #64748b;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
