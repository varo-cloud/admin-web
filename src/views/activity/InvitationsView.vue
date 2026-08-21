<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import {
  NButton,
  NDataTable,
  NPagination,
  NSelect,
  NSpin,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { fetchCampaigns, fetchInvitations, updateInvitationRisk } from '@/api/activity'
import CopyText from '@/components/CopyText.vue'
import RiskLevelModal from '@/components/RiskLevelModal.vue'
import StatusTag from '@/components/StatusTag.vue'
import { formatCents } from '@/utils/currency'
import { formatDateTime } from '@/utils/time'
import type { Campaign, Invitation, RiskLevel } from '@/types/admin'

const message = useMessage()
const loading = ref(false)
const items = ref<Invitation[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const campaignId = ref('')
const campaignOptions = ref<{ label: string; value: string }[]>([{ label: '全部活动', value: '' }])

const riskShow = ref(false)
const riskTarget = ref<Invitation | null>(null)

const columns: DataTableColumns<Invitation> = [
  {
    title: '邀请人',
    key: 'inviterUserId',
    render: (r) => h(CopyText, { text: r.inviterUserId }),
  },
  {
    title: '被邀请人',
    key: 'inviteeUserId',
    render: (r) => h(CopyText, { text: r.inviteeUserId }),
  },
  { title: '状态', key: 'status', render: (r) => h(StatusTag, { status: r.status }) },
  {
    title: 'Winner',
    key: 'isWinner',
    width: 80,
    render: (r) => (r.isWinner ? '✅' : '—'),
  },
  {
    title: '首充',
    key: 'firstTopupCents',
    render: (r) => (r.firstTopupCents != null ? formatCents(r.firstTopupCents) : '—'),
  },
  { title: '注册时间', key: 'registeredAt', render: (r) => formatDateTime(r.registeredAt) },
  { title: '充值截止', key: 'depositDeadline', render: (r) => formatDateTime(r.depositDeadline) },
  { title: '达标时间', key: 'qualifiedAt', render: (r) => formatDateTime(r.qualifiedAt) },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: (r) =>
      h(
        NButton,
        { size: 'small', onClick: () => { riskTarget.value = r; riskShow.value = true } },
        () => '风险',
      ),
  },
]

async function load() {
  loading.value = true
  try {
    const res = await fetchInvitations({
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

async function submitRisk(payload: { level: RiskLevel; note: string }) {
  if (!riskTarget.value) return
  try {
    await updateInvitationRisk(riskTarget.value.id, payload.level, payload.note)
    message.success('已标记被邀请人风险（保留 Seed 名额）')
    riskShow.value = false
  } catch (e) {
    message.error(e instanceof Error ? e.message : '更新失败')
  }
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
        <h1 class="page-title">邀请记录</h1>
        <p class="page-desc">
          每个 Seed 仅一次开奖机会。风控优先打 Invitation，再打 Seed；列表不回传风险字段，标记后请以审计/SQL 为准。
        </p>
      </div>
    </div>

    <div class="filter-bar">
      <NSelect v-model:value="campaignId" :options="campaignOptions" style="width: 240px" />
      <NButton type="primary" @click="search">搜索</NButton>
    </div>

    <NSpin :show="loading">
      <NDataTable :columns="columns" :data="items" :scroll-x="1100" />
      <NPagination
        v-model:page="page"
        :page-size="pageSize"
        :item-count="total"
        style="margin-top: 16px; justify-content: flex-end"
        @update:page="load"
      />
    </NSpin>

    <RiskLevelModal v-model:show="riskShow" title="标记被邀请人风险" @confirm="submitRisk" />
  </div>
</template>

<style scoped>
.page-desc {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}
</style>
