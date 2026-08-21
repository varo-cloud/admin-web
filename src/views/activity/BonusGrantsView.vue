<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import {
  NButton,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NPagination,
  NSelect,
  NSpin,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import {
  fetchBonusGrants,
  fetchCampaigns,
  freezeBonusLot,
  grantBonus,
  unfreezeBonusLot,
} from '@/api/activity'
import CopyText from '@/components/CopyText.vue'
import StatusTag from '@/components/StatusTag.vue'
import { formatCents, usdToCents } from '@/utils/currency'
import { formatDateTime } from '@/utils/time'
import type { BonusGrant, BonusSource, Campaign } from '@/types/admin'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const items = ref<BonusGrant[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const userId = ref('')
const campaignId = ref('')
const campaignOptions = ref<{ label: string; value: string }[]>([{ label: '全部活动', value: '' }])

const grantShow = ref(false)
const grantUserId = ref('')
const grantUsd = ref<number | null>(10)
const grantReason = ref('')
const grantKey = ref('')
const granting = ref(false)

const sourceLabels: Record<BonusSource, string> = {
  seed_bonus: '种子奖励',
  inviter_reward: '邀请人奖励',
  invitee_reward: 'Winner 奖励',
  manual: '手动补发',
}

const canGrant = computed(
  () =>
    grantUserId.value.trim().length > 0 &&
    (grantUsd.value ?? 0) > 0 &&
    grantReason.value.trim().length >= 2 &&
    grantKey.value.trim().length > 0,
)

function openGrant() {
  grantUserId.value = userId.value
  grantUsd.value = 10
  grantReason.value = '补发'
  grantKey.value = `makeup-${Date.now()}`
  grantShow.value = true
}

async function submitGrant() {
  if (!canGrant.value) return
  granting.value = true
  try {
    const result = await grantBonus({
      userId: grantUserId.value.trim(),
      cents: usdToCents(grantUsd.value!),
      reason: grantReason.value.trim(),
      idempotencyKey: grantKey.value.trim(),
    })
    if (result.idempotent) {
      message.info(`幂等命中，未重复发放（${result.businessKey}）`)
    } else {
      message.success(`已补发，lot ${result.lotId}`)
    }
    grantShow.value = false
    await load()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '补发失败')
  } finally {
    granting.value = false
  }
}

function confirmFreeze(row: BonusGrant) {
  dialog.warning({
    title: '冻结 Bonus',
    content: `冻结后该额度不可消费。到期仍会过期；解冻不会复活已过期 lot。`,
    positiveText: '冻结',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await freezeBonusLot(row.id)
        message.success(`已冻结，状态 ${res.status}`)
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '冻结失败')
      }
    },
  })
}

function confirmUnfreeze(row: BonusGrant) {
  dialog.info({
    title: '解冻 Bonus',
    content: '解冻后恢复为可消费状态（已过期 lot 不会复活）。',
    positiveText: '解冻',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await unfreezeBonusLot(row.id)
        message.success(`已解冻，状态 ${res.status}`)
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '解冻失败')
      }
    },
  })
}

const columns: DataTableColumns<BonusGrant> = [
  {
    title: 'Lot ID',
    key: 'id',
    render: (r) => h(CopyText, { text: r.id }),
  },
  {
    title: '用户',
    key: 'userId',
    render: (r) => h(CopyText, { text: r.userId }),
  },
  {
    title: '来源',
    key: 'source',
    render: (r) => sourceLabels[r.source] ?? r.source,
  },
  { title: '原始额度', key: 'amountGrantedCents', render: (r) => formatCents(r.amountGrantedCents) },
  { title: '剩余', key: 'amountRemainingCents', render: (r) => formatCents(r.amountRemainingCents) },
  { title: '状态', key: 'status', render: (r) => h(StatusTag, { status: r.status }) },
  { title: '发放时间', key: 'grantedAt', render: (r) => formatDateTime(r.grantedAt) },
  { title: '到期时间', key: 'expiresAt', render: (r) => formatDateTime(r.expiresAt) },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (r) => {
      if (r.status === 'active') {
        return h(NButton, { size: 'small', type: 'warning', onClick: () => confirmFreeze(r) }, () => '冻结')
      }
      if (r.status === 'frozen') {
        return h(NButton, { size: 'small', onClick: () => confirmUnfreeze(r) }, () => '解冻')
      }
      return '—'
    },
  },
]

async function load() {
  loading.value = true
  try {
    const res = await fetchBonusGrants({
      userId: userId.value.trim() || undefined,
      campaignId: campaignId.value || undefined,
      offset: (page.value - 1) * pageSize,
      limit: pageSize,
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

onMounted(async () => {
  try {
    const campaigns: Campaign[] = await fetchCampaigns()
    campaignOptions.value = [
      { label: '全部活动', value: '' },
      ...campaigns.map((c) => ({ label: `${c.name} (${c.id})`, value: c.id })),
    ]
  } catch {
    /* ignore */
  }
  await load()
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Bonus 发放</h1>
        <p class="page-desc">查看 Bonus lot，手动补发与自动奖共用预算。追回已发额度请冻结 lot，不要改余额。</p>
      </div>
      <NButton type="primary" @click="openGrant">手动补发</NButton>
    </div>

    <div class="filter-bar">
      <NInput v-model:value="userId" placeholder="user_id" style="width: 280px" @keyup.enter="search" />
      <NSelect v-model:value="campaignId" :options="campaignOptions" style="width: 240px" />
      <NButton type="primary" @click="search">搜索</NButton>
    </div>

    <NSpin :show="loading">
      <NDataTable :columns="columns" :data="items" :scroll-x="1200" />
      <NPagination
        v-model:page="page"
        :page-size="pageSize"
        :item-count="total"
        style="margin-top: 16px; justify-content: flex-end"
        @update:page="load"
      />
    </NSpin>

    <NModal v-model:show="grantShow" preset="card" title="手动补发 Bonus" style="width: 480px">
      <NForm label-placement="top">
        <NFormItem label="用户 ID">
          <NInput v-model:value="grantUserId" placeholder="uuid" />
        </NFormItem>
        <NFormItem :label="`金额 USD（将转为 ${grantUsd != null ? usdToCents(grantUsd) : 0} cents）`">
          <NInputNumber v-model:value="grantUsd" :min="0.01" :max="100000" :step="1" :precision="2" style="width: 100%" />
        </NFormItem>
        <NFormItem label="原因">
          <NInput v-model:value="grantReason" type="textarea" :rows="2" placeholder="补发原因" />
        </NFormItem>
        <NFormItem label="幂等键 idempotency_key">
          <NInput v-model:value="grantKey" placeholder="makeup-<invite_id>" />
        </NFormItem>
      </NForm>
      <p class="hint">建议使用确定性键，例如 makeup-&lt;invite_id&gt;，避免重复补发。</p>
      <NButton type="primary" block :disabled="!canGrant" :loading="granting" @click="submitGrant">
        确认补发 {{ grantUsd != null ? formatCents(usdToCents(grantUsd)) : '' }}
      </NButton>
    </NModal>
  </div>
</template>

<style scoped>
.page-desc,
.hint {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}
.hint {
  margin: 0 0 12px;
}
</style>
