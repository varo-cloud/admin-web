<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NDataTable,
  NInput,
  NSelect,
  NSwitch,
  NTag,
  NSpin,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { deleteBaseModel, fetchBaseModels, fetchOfferings, updateBaseModel } from '@/api/models'
import { formatTimestamp } from '@/utils/time'
import CopyText from '@/components/CopyText.vue'
import type { BaseModel, Offering } from '@/types/admin'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const deletingSlug = ref<string | null>(null)
const baseModels = ref<BaseModel[]>([])
const offerings = ref<Offering[]>([])
const q = ref('')
const activeFilter = ref<string>('')

const activeOptions = [
  { label: '全部', value: '' },
  { label: '已启用', value: 'true' },
  { label: '已禁用', value: 'false' },
]

const offeringsByModelId = computed(() => {
  const map = new Map<number, Offering[]>()
  for (const o of offerings.value) {
    const list = map.get(o.modelId) ?? []
    list.push(o)
    map.set(o.modelId, list)
  }
  return map
})

const filteredItems = computed(() => {
  let items = [...baseModels.value]
  const query = q.value.trim().toLowerCase()
  if (query) {
    items = items.filter(
      (m) =>
        m.slug.toLowerCase().includes(query) ||
        (m.apiModelId?.toLowerCase().includes(query) ?? false) ||
        m.description.toLowerCase().includes(query),
    )
  }
  if (activeFilter.value === 'true') items = items.filter((m) => m.active)
  if (activeFilter.value === 'false') items = items.filter((m) => !m.active)
  return items
})

async function load() {
  loading.value = true
  try {
    const [models, offers] = await Promise.all([fetchBaseModels(), fetchOfferings()])
    baseModels.value = models
    offerings.value = offers
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function deleteModelRow(row: BaseModel) {
  dialog.warning({
    title: '删除基座模型',
    content: `确认删除「${row.slug}」？将级联删除所有 Offering 和 Provider Route，此操作不可恢复。`,
    positiveText: '删除',
    onPositiveClick: async () => {
      deletingSlug.value = row.slug
      try {
        await deleteBaseModel(row.slug)
        message.success('已删除')
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '删除失败')
      } finally {
        deletingSlug.value = null
      }
    },
  })
}

function toggleStatus(row: BaseModel, active: boolean) {
  const action = active ? '启用' : '禁用'
  dialog.warning({
    title: `${action}基座模型`,
    content: active
      ? `确认启用 ${row.slug}？`
      : '禁用后其所有 Offering 均不可生成，进行中任务不受影响。',
    positiveText: '确认',
    onPositiveClick: async () => {
      try {
        await updateBaseModel(row.slug, { active })
        message.success(`${action}成功`)
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '操作失败')
      }
    },
  })
}

function renderCapabilities(row: BaseModel) {
  const caps = (offeringsByModelId.value.get(row.seqId) ?? []).map((o) => o.capability)
  if (caps.length === 0) return '—'
  return h(
    'div',
    { class: 'cap-tags' },
    caps.map((c) => h(NTag, { size: 'small', type: 'info' }, () => c)),
  )
}

const columns = computed<DataTableColumns<BaseModel>>(() => [
  { title: 'Slug', key: 'slug', render: (r) => h(CopyText, { text: r.slug }) },
  { title: '分类', key: 'category' },
  { title: '计价模式', key: 'mode' },
  { title: 'API Model ID', key: 'apiModelId', render: (r) => r.apiModelId || '—' },
  { title: '能力', key: 'capabilities', minWidth: 160, render: renderCapabilities },
  {
    title: '状态',
    key: 'active',
    render: (r) =>
      h(NTag, { type: r.active ? 'success' : 'default', size: 'small' }, () =>
        r.active ? '已启用' : '已禁用',
      ),
  },
  { title: '排序', key: 'sortOrder' },
  { title: '更新时间', key: 'updatedAt', render: (r) => formatTimestamp(r.updatedAt) },
  {
    title: '操作',
    key: 'actions',
    render: (r) =>
      h('div', { style: 'display:flex;gap:8px;align-items:center' }, [
        h(NButton, { size: 'small', onClick: () => router.push(`/models/${r.slug}/edit`) }, () => '编辑'),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            loading: deletingSlug.value === r.slug,
            disabled: deletingSlug.value !== null && deletingSlug.value !== r.slug,
            onClick: () => deleteModelRow(r),
          },
          () => '删除',
        ),
        h(NSwitch, {
          value: r.active,
          onUpdateValue: (v: boolean) => toggleStatus(r, v),
        }),
      ]),
  },
])

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">基座模型</h1>
      <NButton type="primary" @click="router.push('/models/new')">创建基座模型</NButton>
    </div>

    <div class="filter-bar">
      <NInput v-model:value="q" placeholder="搜索 slug / api_model_id" style="width: 260px" />
      <NSelect v-model:value="activeFilter" :options="activeOptions" style="width: 120px" />
    </div>

    <NSpin :show="loading">
      <NDataTable :columns="columns" :data="filteredItems" :scroll-x="1200" />
    </NSpin>
  </div>
</template>

<style scoped>
.cap-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
