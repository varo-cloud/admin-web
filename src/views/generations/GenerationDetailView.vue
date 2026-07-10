<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton,
  NCard,
  NCode,
  NSpin,
  useDialog,
  useMessage,
} from 'naive-ui'
import ConfirmReasonModal from '@/components/ConfirmReasonModal.vue'
import SetGenerationExampleDrawer from '@/components/SetGenerationExampleDrawer.vue'
import StatusTag from '@/components/StatusTag.vue'
import { fetchGenerationDetail, refundGeneration } from '@/api/generations'
import { formatUsd } from '@/utils/currency'
import { parseOfferingModelId } from '@/utils/offeringExamples'
import type { AdminGenerationDetail } from '@/types/admin'

const route = useRoute()
const message = useMessage()
const dialog = useDialog()
const taskId = computed(() => route.params.id as string)
const loading = ref(true)
const detail = ref<AdminGenerationDetail | null>(null)
const showRefund = ref(false)
const showSetExample = ref(false)

const canRefund = computed(
  () => detail.value && !detail.value.refunded && detail.value.costUsd > 0,
)

const outputUrl = computed(() => detail.value?.outputUrl ?? detail.value?.output?.url)

const isCompleted = computed(() => {
  const s = detail.value?.status
  return s === 'completed' || s === 'succeeded'
})

const outputType = computed(() => detail.value?.output?.type ?? '')

const isVideoOutput = computed(
  () => outputType.value === 'video' || (outputUrl.value?.match(/\.(mp4|webm|mov)(\?|$)/i) ?? false),
)

const isImageOutput = computed(
  () => outputType.value === 'image' || (outputUrl.value?.match(/\.(png|jpe?g|gif|webp)(\?|$)/i) ?? false),
)

const canSetExample = computed(() => {
  if (!detail.value || !isCompleted.value || !outputUrl.value) return false
  return parseOfferingModelId(detail.value.model) != null
})

const inputJson = computed(() =>
  detail.value ? JSON.stringify(detail.value.input, null, 2) : '{}',
)

const outputJson = computed(() =>
  detail.value?.output ? JSON.stringify(detail.value.output, null, 2) : null,
)

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
          <p v-if="detail.apiKeyPrefix" class="meta">API Key: {{ detail.apiKeyPrefix }}</p>
          <p v-if="detail.billingRecordId" class="meta">账单记录: {{ detail.billingRecordId }}</p>
        </div>
        <div class="header-actions">
          <NButton v-if="canSetExample" type="primary" @click="showSetExample = true">
            设为示例
          </NButton>
          <NButton v-if="canRefund" type="warning" @click="showRefund = true">退还费用</NButton>
        </div>
      </div>

      <NCard>
        <div class="io-grid">
          <section class="io-section">
            <h3 class="section-title">输入</h3>
            <NCode :code="inputJson" language="json" word-wrap />
          </section>

          <section class="io-section">
            <h3 class="section-title">输出</h3>
            <template v-if="isCompleted && outputUrl">
              <video
                v-if="isVideoOutput"
                :src="outputUrl"
                class="media-preview"
                controls
                playsinline
              />
              <img v-else-if="isImageOutput" :src="outputUrl" class="media-preview image" alt="输出预览" />
              <NCode v-else-if="outputJson" :code="outputJson" language="json" word-wrap />
              <a :href="outputUrl" target="_blank" rel="noopener" class="output-link">打开原文件</a>
            </template>
            <p v-else class="empty">暂无输出</p>
          </section>
        </div>
      </NCard>
    </div>
  </NSpin>

  <ConfirmReasonModal
    v-model:show="showRefund"
    title="退还费用"
    confirm-text="下一步"
    @confirm="handleRefundRequest"
  />

  <SetGenerationExampleDrawer
    v-if="detail && outputUrl"
    v-model:show="showSetExample"
    :model="detail.model"
    :task-id="detail.taskId"
    :input="detail.input"
    :output-url="outputUrl"
  />
</template>

<style scoped>
.meta {
  color: #64748b;
  font-size: 13px;
  margin-top: 4px;
}
.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.io-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
@media (max-width: 960px) {
  .io-grid {
    grid-template-columns: 1fr;
  }
}
.io-section {
  min-width: 0;
}
.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}
.media-preview {
  width: 100%;
  max-height: 420px;
  border-radius: 8px;
  background: #0f172a;
}
.media-preview.image {
  object-fit: contain;
  background: #f8fafc;
}
.output-link {
  display: inline-block;
  margin-top: 12px;
  font-size: 13px;
}
.empty {
  color: #94a3b8;
}
</style>
