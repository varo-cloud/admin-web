<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NInput,
  NSelect,
  NDataTable,
  NButton,
  NTag,
  NPagination,
  NSpin,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { fetchUsers } from '@/api/users'
import { formatUsd } from '@/utils/currency'
import { formatRelativeTimestamp, formatTimestamp } from '@/utils/time'
import CopyText from '@/components/CopyText.vue'
import type { AdminUserListItem } from '@/types/admin'

const router = useRouter()
const message = useMessage()
const loading = ref(false)
const items = ref<AdminUserListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20

const q = ref('')
const role = ref<string | null>(null)
const status = ref<string | null>(null)
const sort = ref('-created_at')

const roleOptions = [
  { label: '全部角色', value: '' },
  { label: 'user', value: 'user' },
  { label: 'admin', value: 'admin' },
]
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: 'active', value: 'active' },
  { label: 'suspended', value: 'suspended' },
]
const sortOptions = [
  { label: '注册时间 ↓', value: '-created_at' },
  { label: '注册时间 ↑', value: 'created_at' },
  { label: '余额 ↓', value: '-balance_usd' },
  { label: '最近活跃 ↓', value: '-last_active_at' },
]

const columns: DataTableColumns<AdminUserListItem> = [
  {
    title: 'Email',
    key: 'email',
    render: (row) =>
      h(
        NButton,
        { text: true, type: 'primary', onClick: () => router.push(`/users/${row.id}`) },
        { default: () => row.email },
      ),
  },
  {
    title: 'User ID',
    key: 'id',
    render: (row) => h(CopyText, { text: row.id }),
  },
  {
    title: '角色',
    key: 'role',
    render: (row) => h(NTag, { size: 'small', type: row.role === 'admin' ? 'warning' : 'default' }, () => row.role),
  },
  { title: '余额', key: 'balanceUsd', render: (row) => formatUsd(row.balanceUsd) },
  { title: 'API Keys', key: 'apiKeysCount' },
  { title: '注册时间', key: 'createdAt', render: (row) => formatTimestamp(row.createdAt) },
  {
    title: '最近活跃',
    key: 'lastActiveAt',
    render: (row) => (row.lastActiveAt ? formatRelativeTimestamp(row.lastActiveAt) : '—'),
  },
  {
    title: '操作',
    key: 'actions',
    render: (row) =>
      h(NButton, { size: 'small', onClick: () => router.push(`/users/${row.id}`) }, { default: () => '查看' }),
  },
]

async function load() {
  loading.value = true
  try {
    const res = await fetchUsers({
      offset: (page.value - 1) * pageSize,
      limit: pageSize,
      q: q.value || undefined,
      role: role.value || undefined,
      status: status.value || undefined,
      sort: sort.value,
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
  load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">用户列表</h1>
    </div>

    <div class="filter-bar">
      <NInput v-model:value="q" placeholder="搜索 email / user_id" style="width: 220px" @keyup.enter="search" />
      <NSelect v-model:value="role" :options="roleOptions" style="width: 140px" />
      <NSelect v-model:value="status" :options="statusOptions" style="width: 140px" />
      <NSelect v-model:value="sort" :options="sortOptions" style="width: 160px" />
      <NButton type="primary" @click="search">搜索</NButton>
    </div>

    <NSpin :show="loading">
      <NDataTable :columns="columns" :data="items" :bordered="false" />
      <NPagination
        v-model:page="page"
        :page-size="pageSize"
        :item-count="total"
        style="margin-top: 16px; justify-content: flex-end"
        @update:page="load"
      />
    </NSpin>
  </div>
</template>
