<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton,
  NCard,
  NCode,
  NSpin,
  NTabPane,
  NTabs,
  useDialog,
  useMessage,
} from 'naive-ui'
import ConfirmReasonModal from '@/components/ConfirmReasonModal.vue'
import StatusTag from '@/components/StatusTag.vue'
import { fetchGenerationDetail, refundGeneration } from '@/api/generations'
import { formatUsd } from '@/utils/currency'
import type { AdminGenerationDetail } from '@/types/admin'

const route = useRoute()
const message = useMessage()
const dialog = useDialog()
const taskId = computed(() => route.params.id as string)
const loading = ref(true)
const detail = ref<AdminGenerationDetail | null>(null)
const showRefund = ref(false)

const canRefund = computed(
  () => detail.value && !detail.value.refunded && detail.value.costUsd > 0,
)

const outputUrl = computed(() => detail.value?.outputUrl ?? detail.value?.output?.url)

const isCompleted = computed(() => {
  const s = detail.value?.status
  return s === 'completed' || s === 'succeeded'
})

async function load() {
  loading.value = true
  try {
    detail.value = await fetchGenerationDetail(taskId.value)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function handleRefundRequest(reason: string) {
  dialog.warning({
    title: '确认退款',
    content: `确认为任务 ${taskId.value} 退还 ${formatUsd(detail.value?.costUsd ?? 0)}？`,
    positiveText: '确认退款',
    onPositiveClick: async () => {
      try {
        await refundGeneration(taskId.value, reason)
        message.success('退款成功')
        showRefund.value = false
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '退款失败')
      }
    },
  })
}
</script>

<template>
  <NSpin :show="loading">
    <div v-if="detail">
      <div class="page-header">
        <div>
          <h1 class="page-title mono">Task: {{ detail.taskId }}</h1>
          <p class="meta">
            <StatusTag :status="detail.status" />
            费用 {{ formatUsd(detail.costUsd) }} · 已退款 {{ detail.refunded ? '是' : '否' }}
          </p>
          <p class="meta">
            用户 {{ detail.userEmail }} · 渠道 {{ detail.invocationChannel }} · 模型 {{ detail.model }}
          </p>
        </div>
        <NButton v-if="canRefund" type="warning" @click="showRefund = true">退还费用</NButton>
      </div>

      <NTabs type="line">
        <NTabPane name="overview" tab="概览">
          <NCard>
            <p v-if="detail.apiKeyPrefix">API Key: {{ detail.apiKeyPrefix }}</p>
            <p v-if="detail.billingRecordId">账单记录: {{ detail.billingRecordId }}</p>
          </NCard>
        </NTabPane>
        <NTabPane name="input" tab="输入 JSON">
          <NCode :code="JSON.stringify(detail.input, null, 2)" language="json" word-wrap />
        </NTabPane>
        <NTabPane name="output" tab="输出">
          <template v-if="isCompleted && outputUrl">
            <a :href="outputUrl" target="_blank" rel="noopener">打开视频</a>
          </template>
          <p v-else class="empty">暂无输出</p>
        </NTabPane>
      </NTabs>
    </div>
  </NSpin>

  <ConfirmReasonModal
    v-model:show="showRefund"
    title="退还费用"
    confirm-text="下一步"
    @confirm="handleRefundRequest"
  />
</template>

<style scoped>
.meta {
  color: #64748b;
  font-size: 13px;
  margin-top: 4px;
}
.empty {
  color: #94a3b8;
}
</style>
