<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import { NCode, NDataTable, NSpin, useMessage, type DataTableColumns } from 'naive-ui'
import { fetchAuditLogs } from '@/api/audit-logs'
import { formatTimestamp } from '@/utils/time'
import type { AuditLog } from '@/types/admin'

const message = useMessage()
const loading = ref(false)
const items = ref<AuditLog[]>([])
const total = ref(0)
const page = ref(1)

async function load() {
  loading.value = true
  try {
    const res = await fetchAuditLogs({ offset: (page.value - 1) * 20, limit: 20 })
    items.value = res.items
    total.value = res.total
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

const columns: DataTableColumns<AuditLog> = [
  { title: '时间', key: 'createdAt', render: (r) => formatTimestamp(r.createdAt) },
  { title: '操作人', key: 'adminEmail' },
  { title: '动作', key: 'action' },
  {
    title: '目标',
    key: 'target',
    render: (r) => `${r.targetType} / ${r.targetId}`,
  },
  { title: '原因', key: 'reason' },
  {
    title: '详情',
    key: 'detail',
    render: (r) =>
      h(NCode, {
        code: JSON.stringify({ before: r.beforeSnapshot, after: r.afterSnapshot }, null, 2),
        language: 'json',
        wordWrap: true,
      }),
  },
]

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">审计日志</h1>
    </div>
    <NSpin :show="loading">
      <NDataTable :columns="columns" :data="items" />
    </NSpin>
  </div>
</template>
