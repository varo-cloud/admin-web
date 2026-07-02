<script setup lang="ts">
import { NTag } from 'naive-ui'

const props = defineProps<{ status: string }>()

const colorMap: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  completed: 'success',
  succeeded: 'success',
  partial: 'warning',
  pending: 'info',
  processing: 'info',
  queued: 'default',
  suspended: 'default',
  expired: 'default',
  failed: 'error',
  revoked: 'error',
  draft: 'default',
}

const labelMap: Record<string, string> = {
  active: '活跃',
  completed: '已完成',
  succeeded: '已完成',
  partial: '部分完成',
  pending: '待处理',
  processing: '处理中',
  queued: '排队中',
  suspended: '已禁用',
  expired: '已过期',
  failed: '失败',
  revoked: '已撤销',
}
</script>

<template>
  <NTag :type="colorMap[status] ?? 'default'" size="small">
    {{ labelMap[status] ?? status }}
  </NTag>
</template>
