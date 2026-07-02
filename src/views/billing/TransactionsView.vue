<script setup lang="ts">
import { h, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NInput,
  NSelect,
  NPagination,
  NSpin,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { fetchTransactions } from '@/api/billing'
import StatusTag from '@/components/StatusTag.vue'
import { formatUsd } from '@/utils/currency'
import { formatTimestamp } from '@/utils/time'
import type { BillingTransaction } from '@/types/admin'

const route = useRoute()
const message = useMessage()
const loading = ref(false)
const items = ref<BillingTransaction[]>([])
const total = ref(0)
const page = ref(1)
const status = ref((route.query.status as string) || '')
const email = ref('')
const drawerShow = ref(false)
const selected = ref<BillingTransaction | null>(null)

const statusOptions = [
  { label: '全部', value: '' },
  { label: 'pending', value: 'pending' },
  { label: 'completed', value: 'completed' },
  { label: 'failed', value: 'failed' },
  { label: 'expired', value: 'expired' },
  { label: 'partial', value: 'partial' },
]

const providerLabels: Record<string, string> = {
  stripe: 'Stripe',
  nowpayments: 'NOWPayments',
}

async function load() {
  loading.value = true
  try {
    const res = await fetchTransactions({
      offset: (page.value - 1) * 20,
      limit: 20,
      status: status.value || undefined,
      email: email.value || undefined,
    })
    items.value = res.items
    total.value = res.total
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => route.query.status,
  (v) => {
    status.value = (v as string) || ''
    load()
  },
)

onMounted(load)

const columns: DataTableColumns<BillingTransaction> = [
  { title: '交易 ID', key: 'id' },
  { title: '用户', key: 'userEmail', render: (r) => r.userEmail ?? '—' },
  { title: '金额', key: 'amountUsd', render: (r) => formatUsd(r.amountUsd) },
  {
    title: '渠道',
    key: 'provider',
    render: (r) => (r.provider ? providerLabels[r.provider] ?? r.provider : '—'),
  },
  { title: '状态', key: 'status', render: (r) => h(StatusTag, { status: r.status }) },
  { title: '支付方式', key: 'paymentDetail', render: (r) => r.paymentDetail ?? r.paymentMethod ?? '—' },
  { title: '创建时间', key: 'createdAt', render: (r) => formatTimestamp(r.createdAt) },
  {
    title: '完成时间',
    key: 'completedAt',
    render: (r) => (r.completedAt ? formatTimestamp(r.completedAt) : '—'),
  },
  {
    title: '操作',
    key: 'actions',
    render: (r) =>
      h('div', { style: 'display:flex;gap:8px' }, [
        h(NButton, { size: 'small', onClick: () => { selected.value = r; drawerShow.value = true } }, () => '详情'),
        r.receiptUrl
          ? h(NButton, { size: 'small', tag: 'a', href: r.receiptUrl, target: '_blank' }, () => '收据')
          : null,
      ]),
  },
]
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">充值订单</h1>
    </div>

    <div class="filter-bar">
      <NSelect v-model:value="status" :options="statusOptions" style="width: 140px" />
      <NInput v-model:value="email" placeholder="用户 email" style="width: 200px" />
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

    <NDrawer v-model:show="drawerShow" :width="420">
      <NDrawerContent v-if="selected" title="订单详情">
        <p>ID: {{ selected.id }}</p>
        <p>用户: {{ selected.userEmail ?? '—' }}</p>
        <p>金额: {{ formatUsd(selected.amountUsd) }}</p>
        <p>渠道: {{ selected.provider ? providerLabels[selected.provider] ?? selected.provider : '—' }}</p>
        <p>状态: <StatusTag :status="selected.status" /></p>
        <p v-if="selected.paymentMethod">支付方式: {{ selected.paymentMethod }}</p>
        <p v-if="selected.paymentDetail">支付详情: {{ selected.paymentDetail }}</p>
        <p v-if="selected.providerSessionId">
          渠道会话: <span class="mono">{{ selected.providerSessionId }}</span>
        </p>
        <p v-if="selected.receiptUrl">
          <a :href="selected.receiptUrl" target="_blank" rel="noopener">查看收据</a>
        </p>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
