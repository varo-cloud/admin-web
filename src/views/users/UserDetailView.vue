<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInputNumber,
  NModal,
  NSelect,
  NSpin,
  NTabs,
  NTabPane,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import {
  adjustUserBalance,
  fetchUserDetail,
  fetchUserGenerations,
  fetchUserTransactions,
} from '@/api/users'
import StatusTag from '@/components/StatusTag.vue'
import { formatUsd } from '@/utils/currency'
import { formatTimestamp } from '@/utils/time'
import type { AdminUserDetail, AdminUserGenerationItem, BillingTransaction } from '@/types/admin'
import type { BalanceAdjustmentType } from '@/types'

const route = useRoute()
const message = useMessage()
const dialog = useDialog()
const userId = computed(() => route.params.id as string)
const loading = ref(true)
const detail = ref<AdminUserDetail | null>(null)

const transactions = ref<BillingTransaction[]>([])
const generations = ref<AdminUserGenerationItem[]>([])

const showAdjust = ref(false)
const adjustType = ref<BalanceAdjustmentType>('bonus')
const adjustAmount = ref<number | null>(3)
const adjustReason = ref('')
const adjustLoading = ref(false)

const typeOptions = [
  { label: '赠送 (bonus)', value: 'bonus' },
  { label: '手动充值 (manual_topup)', value: 'manual_topup' },
  { label: '退款 (refund)', value: 'refund' },
  { label: '纠错 (correction)', value: 'correction' },
]

async function loadDetail() {
  loading.value = true
  try {
    detail.value = await fetchUserDetail(userId.value)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

async function loadTabs() {
  const [txRes, genRes] = await Promise.all([
    fetchUserTransactions(userId.value),
    fetchUserGenerations(userId.value, { limit: 20 }),
  ])
  transactions.value = txRes.items
  generations.value = genRes.items
}

onMounted(async () => {
  await loadDetail()
  await loadTabs()
})

const canSubmitAdjust = computed(() => (adjustAmount.value ?? 0) > 0 && adjustReason.value.trim().length >= 5)

function confirmAdjust() {
  if (!detail.value || !canSubmitAdjust.value) return
  dialog.warning({
    title: '确认调整',
    content: `确认为 ${detail.value.email} ${adjustType.value === 'bonus' ? '赠送' : '调整'} ${formatUsd(adjustAmount.value!)}？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: submitAdjust,
  })
}

async function submitAdjust() {
  if (!detail.value) return
  adjustLoading.value = true
  try {
    await adjustUserBalance(userId.value, {
      amountUsd: adjustAmount.value!,
      type: adjustType.value,
      reason: adjustReason.value.trim(),
    })
    message.success('余额调整成功')
    showAdjust.value = false
    adjustReason.value = ''
    await loadDetail()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '调整失败')
  } finally {
    adjustLoading.value = false
  }
}

const txColumns: DataTableColumns<BillingTransaction> = [
  { title: 'ID', key: 'id' },
  { title: '金额', key: 'amountUsd', render: (r) => formatUsd(r.amountUsd) },
  { title: '状态', key: 'status', render: (r) => h(StatusTag, { status: r.status }) },
  { title: '支付方式', key: 'paymentMethod', render: (r) => r.paymentMethod ?? '—' },
  { title: '创建时间', key: 'createdAt', render: (r) => formatTimestamp(r.createdAt) },
]

const genColumns: DataTableColumns<AdminUserGenerationItem> = [
  { title: 'Task ID', key: 'taskId' },
  { title: '模型', key: 'model' },
  { title: '状态', key: 'status', render: (r) => h(StatusTag, { status: r.status }) },
  { title: '费用', key: 'costUsd', render: (r) => formatUsd(r.costUsd) },
  { title: '时间', key: 'createdAt', render: (r) => formatTimestamp(r.createdAt) },
]
</script>

<template>
  <NSpin :show="loading">
    <div v-if="detail">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ detail.email }}</h1>
          <p class="meta">
            余额 {{ formatUsd(detail.balanceUsd) }} · 注册 {{ formatTimestamp(detail.createdAt) }}
          </p>
        </div>
        <div class="actions">
          <NButton type="primary" @click="showAdjust = true">调整余额</NButton>
        </div>
      </div>

      <NTabs type="line">
        <NTabPane name="overview" tab="概览">
          <NCard>
            <p>角色：{{ detail.role }} · 状态：{{ detail.status }}</p>
            <p class="credits-hint">内部 credits: {{ detail.balanceCredits }}（1 USD = 100 credits）</p>
            <p>收藏模型：{{ detail.modelPreferences.favourites.join(', ') || '—' }}</p>
          </NCard>
        </NTabPane>
        <NTabPane name="keys" tab="API Keys">
          <NDataTable
            :columns="[
              { title: '名称', key: 'name' },
              { title: 'Prefix', key: 'prefix' },
              { title: '状态', key: 'isActive', render: (r) => (r.isActive ? 'Active' : 'Revoked') },
              { title: '最近使用', key: 'lastUsedAt', render: (r) => (r.lastUsedAt ? formatTimestamp(r.lastUsedAt) : '—') },
            ]"
            :data="detail.apiKeys"
          />
        </NTabPane>
        <NTabPane name="tx" tab="充值记录">
          <NDataTable :columns="txColumns" :data="transactions" />
        </NTabPane>
        <NTabPane name="gens" tab="生成记录">
          <NDataTable :columns="genColumns" :data="generations" />
        </NTabPane>
      </NTabs>
    </div>
  </NSpin>

  <NModal v-model:show="showAdjust" preset="card" title="调整余额" style="width: 440px">
    <p>用户：{{ detail?.email }}</p>
    <p>当前余额：{{ formatUsd(detail?.balanceUsd ?? 0) }}</p>
    <NForm label-placement="top">
      <NFormItem label="调整类型">
        <NSelect v-model:value="adjustType" :options="typeOptions" />
      </NFormItem>
      <NFormItem label="金额 USD">
        <NInputNumber v-model:value="adjustAmount" :min="0.01" :step="0.01" style="width: 100%" />
      </NFormItem>
      <NFormItem label="原因 *">
        <textarea v-model="adjustReason" rows="3" class="reason-input" placeholder="至少 5 个字" />
      </NFormItem>
    </NForm>
    <NButton type="primary" block :disabled="!canSubmitAdjust" :loading="adjustLoading" @click="confirmAdjust">
      确认调整
    </NButton>
  </NModal>
</template>

<style scoped>
.meta {
  color: #64748b;
  font-size: 13px;
  margin: 4px 0 0;
}
.actions {
  display: flex;
  gap: 8px;
}
.credits-hint {
  font-size: 12px;
  color: #94a3b8;
}
.reason-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: inherit;
}
</style>
