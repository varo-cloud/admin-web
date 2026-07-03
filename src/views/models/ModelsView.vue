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
  NPagination,
  NSpin,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { deleteModel, fetchModels, updateModelStatus } from '@/api/models'
import { formatUsd, formatPriceUnit } from '@/utils/currency'
import { formatTimestamp } from '@/utils/time'
import CopyText from '@/components/CopyText.vue'
import type { AdminModelListItem } from '@/types/admin'
import { resolveLocalizedString } from '@/utils/locale'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const deletingId = ref<string | null>(null)
const items = ref<AdminModelListItem[]>([])
const total = ref(0)
const page = ref(1)
const q = ref('')
const activeFilter = ref<string>('')

const activeOptions = [
  { label: '全部', value: '' },
  { label: '已上架', value: 'true' },
  { label: '草稿', value: 'false' },
]

async function load() {
  loading.value = true
  try {
    const res = await fetchModels({
      offset: (page.value - 1) * 20,
      limit: 20,
      q: q.value || undefined,
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

function copyModel(row: AdminModelListItem) {
  const label = resolveLocalizedString(row.displayName) || resolveLocalizedString(row.name) || row.id
  const newId = `${row.id}_${Date.now()}`
  dialog.info({
    title: '复制模型',
    content: `将基于「${label}」打开创建页，参数与原模型一致（新 ID：${newId}），默认草稿（未上架）。`,
    positiveText: '确认复制',
    onPositiveClick: () => {
      router.push({ path: '/models/new', query: { copyFrom: row.id, newId } })
    },
  })
}

function deleteModelRow(row: AdminModelListItem) {
  const label = resolveLocalizedString(row.displayName) || resolveLocalizedString(row.name) || row.id
  dialog.warning({
    title: '删除模型',
    content: `确认删除「${label}」？此操作不可恢复。`,
    positiveText: '删除',
    onPositiveClick: async () => {
      deletingId.value = row.id
      try {
        await deleteModel(row.id)
        message.success('已删除')
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '删除失败')
      } finally {
        deletingId.value = null
      }
    },
  })
}

function toggleStatus(row: AdminModelListItem, active: boolean) {
  const action = active ? '上架' : '下架'
  const content = active ? undefined : '下架后用户端不可见，进行中任务不受影响'
  dialog.warning({
    title: `${action}模型`,
    content: content ?? `确认${action} ${resolveLocalizedString(row.displayName) || resolveLocalizedString(row.name)}？`,
    positiveText: '确认',
    onPositiveClick: async () => {
      try {
        await updateModelStatus(row.id, active)
        message.success(`${action}成功`)
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '操作失败')
      }
    },
  })
}

function renderCapabilities(row: AdminModelListItem) {
  const caps = row.capabilities ?? []
  if (caps.length === 0) return '—'
  return h(
    'div',
    { class: 'cap-tags' },
    caps.map((c) => h(NTag, { size: 'small', type: 'info' }, () => c)),
  )
}

const columns = computed<DataTableColumns<AdminModelListItem>>(() => [
  { title: 'ID', key: 'id', render: (r) => h(CopyText, { text: r.id }) },
  { title: '名称', key: 'name', render: (r) => resolveLocalizedString(r.displayName) || resolveLocalizedString(r.name) },
  { title: '提供商', key: 'provider' },
  {
    title: '能力',
    key: 'capabilities',
    minWidth: 160,
    render: renderCapabilities,
  },
  {
    title: '状态',
    key: 'active',
    render: (r) => h(NTag, { type: r.active ? 'success' : 'default', size: 'small' }, () => (r.active ? '已上架' : '草稿')),
  },
  {
    title: '热门',
    key: 'isHot',
    render: (r) =>
      r.isHot ? h(NTag, { type: 'warning', size: 'small' }, () => 'HOT') : '—',
  },
  {
    title: '新品',
    key: 'isNew',
    render: (r) =>
      r.isNew ? h(NTag, { type: 'info', size: 'small' }, () => 'NEW') : '—',
  },
  {
    title: '起价',
    key: 'startingPriceUsd',
    render: (r) => `${formatUsd(r.startingPriceUsd)}${formatPriceUnit(r.priceUnit)}`,
  },
  { title: '排序', key: 'sortOrder' },
  { title: '更新时间', key: 'updatedAt', render: (r) => formatTimestamp(r.updatedAt) },
  {
    title: '操作',
    key: 'actions',
    render: (r) =>
      h('div', { style: 'display:flex;gap:8px;align-items:center' }, [
        h(NButton, { size: 'small', onClick: () => router.push(`/models/${r.id}/edit`) }, () => '编辑'),
        h(NButton, { size: 'small', disabled: deletingId.value !== null, onClick: () => copyModel(r) }, () => '复制'),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            loading: deletingId.value === r.id,
            disabled: deletingId.value !== null && deletingId.value !== r.id,
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
      <h1 class="page-title">模型列表</h1>
      <NButton type="primary" @click="router.push('/models/new')">创建模型</NButton>
    </div>

    <div class="filter-bar">
      <NInput v-model:value="q" placeholder="搜索 ID / 名称" style="width: 220px" @keyup.enter="load" />
      <NSelect v-model:value="activeFilter" :options="activeOptions" style="width: 120px" />
      <NButton @click="load">搜索</NButton>
    </div>

    <NSpin :show="loading">
      <NDataTable :columns="columns" :data="items" :scroll-x="1400" />
      <NPagination
        v-model:page="page"
        :page-size="20"
        :item-count="total"
        style="margin-top: 16px; justify-content: flex-end"
        @update:page="load"
      />
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
