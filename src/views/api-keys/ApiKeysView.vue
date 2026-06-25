<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NDataTable,
  NInput,
  NSelect,
  NPagination,
  NSpin,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { fetchApiKeys, revokeApiKey } from '@/api/api-keys'
import { formatUsd } from '@/utils/currency'
import { formatRelativeTimestamp } from '@/utils/time'
import type { AdminApiKeyListItem } from '@/types/admin'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const items = ref<AdminApiKeyListItem[]>([])
const total = ref(0)
const page = ref(1)
const q = ref('')
const isActive = ref<string>('')

const activeOptions = [
  { label: '全部', value: '' },
  { label: 'Active', value: 'true' },
  { label: 'Revoked', value: 'false' },
]

async function load() {
  loading.value = true
  try {
    const res = await fetchApiKeys({
      offset: (page.value - 1) * 20,
      limit: 20,
      q: q.value || undefined,
      is_active: isActive.value || undefined,
    })
    items.value = res.items
    total.value = res.total
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function revoke(row: AdminApiKeyListItem) {
  dialog.warning({
    title: '撤销 API Key',
    content: `确认撤销 ${row.prefix}******？`,
    positiveText: '撤销',
    onPositiveClick: async () => {
      try {
        await revokeApiKey(row.id)
        message.success('已撤销')
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '撤销失败')
      }
    },
  })
}

const columns: DataTableColumns<AdminApiKeyListItem> = [
  {
    title: '用户',
    key: 'userEmail',
    render: (r) =>
      h(NButton, { text: true, type: 'primary', onClick: () => router.push(`/users/${r.userId}`) }, () => r.userEmail),
  },
  { title: '名称', key: 'name' },
  { title: 'Key', key: 'prefix', render: (r) => `${r.prefix}******` },
  { title: '状态', key: 'isActive', render: (r) => (r.isActive ? 'Active' : 'Revoked') },
  { title: '调用', key: 'totalCalls' },
  { title: '消耗', key: 'totalSpendUsd', render: (r) => formatUsd(r.totalSpendUsd) },
  {
    title: '最后使用',
    key: 'lastUsedAt',
    render: (r) => (r.lastUsedAt ? formatRelativeTimestamp(r.lastUsedAt) : '—'),
  },
  {
    title: '操作',
    key: 'actions',
    render: (r) =>
      r.isActive
        ? h(NButton, { size: 'small', type: 'error', onClick: () => revoke(r) }, () => '撤销')
        : '—',
  },
]

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">API Key 管理</h1>
    </div>
    <div class="filter-bar">
      <NInput v-model:value="q" placeholder="email / prefix / name" style="width: 240px" />
      <NSelect v-model:value="isActive" :options="activeOptions" style="width: 120px" />
      <NButton type="primary" @click="load">搜索</NButton>
    </div>
    <NSpin :show="loading">
      <NDataTable :columns="columns" :data="items" />
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
