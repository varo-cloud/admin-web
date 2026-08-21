<script setup lang="ts">
import { NTag } from 'naive-ui'

const props = defineProps<{ status: string }>()

const colorMap: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  completed: 'success',
  succeeded: 'success',
  approved: 'success',
  winner: 'success',
  rewarded: 'success',
  partial: 'warning',
  pending: 'info',
  processing: 'info',
  submitted: 'info',
  under_review: 'info',
  qualified: 'info',
  waiting_for_topup: 'warning',
  waiting_for_winner: 'warning',
  queued: 'default',
  suspended: 'default',
  expired: 'default',
  draft: 'default',
  ended: 'default',
  cancelled: 'default',
  depleted: 'default',
  no_reward: 'default',
  frozen: 'warning',
  failed: 'error',
  revoked: 'error',
  rejected: 'error',
  high: 'error',
  med: 'warning',
  low: 'info',
  none: 'default',
}

const labelMap: Record<string, string> = {
  active: '活跃',
  completed: '已完成',
  succeeded: '已完成',
  approved: '已通过',
  winner: 'Winner',
  rewarded: '已发奖',
  partial: '部分完成',
  pending: '待处理',
  processing: '处理中',
  submitted: '待审核',
  under_review: '审核中',
  qualified: '已达标',
  waiting_for_topup: '待充值',
  waiting_for_winner: '待 Winner',
  queued: '排队中',
  suspended: '已禁用',
  expired: '已过期',
  draft: '草稿',
  ended: '已结束',
  cancelled: '已取消',
  depleted: '已用尽',
  no_reward: '未中奖',
  frozen: '已冻结',
  failed: '失败',
  revoked: '已撤销',
  rejected: '已拒绝',
  high: '高风险',
  med: '中风险',
  low: '低风险',
  none: '无风险',
}
</script>

<template>
  <NTag :type="colorMap[status] ?? 'default'" size="small">
    {{ labelMap[status] ?? status }}
  </NTag>
</template>
