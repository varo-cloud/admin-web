<script setup lang="ts">
import { h, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NCheckbox,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NSelect,
  NSpin,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { fetchCampaigns, fetchSeedCreators, reviewSeedCreator } from '@/api/activity'
import CopyText from '@/components/CopyText.vue'
import StatusTag from '@/components/StatusTag.vue'
import { formatDateTime } from '@/utils/time'
import type { SeedCreator, SeedReviewDecision } from '@/types/admin'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const loading = ref(false)
const items = ref<SeedCreator[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const status = ref((route.query.status as string) || '')
const campaignId = ref((route.query.campaign_id as string) || '')

const reviewShow = ref(false)
const reviewing = ref<SeedCreator | null>(null)
const decision = ref<SeedReviewDecision>('approve')
const twitterVerified = ref(true)
const discordVerified = ref(true)
const rejectReason = ref('')
const submitting = ref(false)

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待审核', value: 'submitted' },
  { label: '审核中', value: 'under_review' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已取消', value: 'cancelled' },
]

const campaignOptions = ref<{ label: string; value: string }[]>([{ label: '全部活动', value: '' }])

function openReview(row: SeedCreator, next: SeedReviewDecision) {
  reviewing.value = row
  decision.value = next
  twitterVerified.value = next === 'approve'
  discordVerified.value = next === 'approve'
  rejectReason.value = ''
  reviewShow.value = true
}

function canSubmitReview() {
  if (!reviewing.value) return false
  if (decision.value === 'approve') return twitterVerified.value && discordVerified.value
  return rejectReason.value.trim().length >= 2
}

async function submitReview() {
  if (!reviewing.value || !canSubmitReview()) return
  submitting.value = true
  try {
    const result = await reviewSeedCreator(reviewing.value.id, {
      decision: decision.value,
      twitterVerified: twitterVerified.value,
      discordVerified: discordVerified.value,
      rejectReason: decision.value === 'reject' ? rejectReason.value.trim() : null,
    })
    if (result.idempotent) {
      message.info('该申请已审核过，本次为幂等返回')
    } else if (result.status === 'approved') {
      message.success(`已通过，排名 #${result.seedRank ?? '—'}，邀请码 ${result.inviteCode ?? '—'}`)
    } else {
      message.success('已拒绝')
    }
    reviewShow.value = false
    await load()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '审核失败')
  } finally {
    submitting.value = false
  }
}

const columns: DataTableColumns<SeedCreator> = [
  {
    title: '排名',
    key: 'seedRank',
    width: 70,
    render: (r) => (r.seedRank != null ? `#${r.seedRank}` : '—'),
  },
  {
    title: 'User ID',
    key: 'userId',
    render: (r) => h(CopyText, { text: r.userId }),
  },
  {
    title: 'Twitter/X',
    key: 'twitterUsername',
    render: (r) => {
      const name = r.twitterUsername ? `@${r.twitterUsername}` : '—'
      if (!r.twitterUrl) return name
      return h('a', { href: r.twitterUrl, target: '_blank', rel: 'noopener' }, name)
    },
  },
  {
    title: 'Discord',
    key: 'discordUsername',
    render: (r) => r.discordUsername ?? r.discordUserId ?? '—',
  },
  { title: '状态', key: 'status', render: (r) => h(StatusTag, { status: r.status }) },
  { title: '风险', key: 'riskLevel', render: (r) => h(StatusTag, { status: r.riskLevel }) },
  { title: '提交时间', key: 'submittedAt', render: (r) => formatDateTime(r.submittedAt) },
  {
    title: '审核人',
    key: 'reviewerId',
    render: (r) => (r.reviewerId ? h(CopyText, { text: r.reviewerId }) : '—'),
  },
  { title: '审核时间', key: 'reviewedAt', render: (r) => formatDateTime(r.reviewedAt) },
  {
    title: '拒绝原因',
    key: 'rejectReason',
    ellipsis: { tooltip: true },
    render: (r) => r.rejectReason ?? '—',
  },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    render: (r) =>
      h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, [
        h(NButton, { size: 'small', type: 'primary', onClick: () => openReview(r, 'approve') }, () => '通过'),
        h(NButton, { size: 'small', type: 'error', onClick: () => openReview(r, 'reject') }, () => '拒绝'),
      ]),
  },
]

async function load() {
  loading.value = true
  try {
    const res = await fetchSeedCreators({
      status: status.value || undefined,
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
  router.replace({
    query: {
      ...(status.value ? { status: status.value } : {}),
      ...(campaignId.value ? { campaign_id: campaignId.value } : {}),
    },
  })
  load()
}

watch(
  () => route.query.status,
  (v) => {
    status.value = (v as string) || ''
    page.value = 1
    load()
  },
)

onMounted(async () => {
  try {
    const list = await fetchCampaigns()
    campaignOptions.value = [
      { label: '全部活动', value: '' },
      ...list.map((c) => ({ label: `${c.name} (${c.id})`, value: c.id })),
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
        <h1 class="page-title">种子审核</h1>
        <p class="page-desc">人工核验 Twitter/X 与 Discord。通过后发放 $20 Bonus 并分配邀请码；驳回已通过会吊销码与名额。</p>
      </div>
    </div>

    <div class="filter-bar">
      <NSelect v-model:value="status" :options="statusOptions" style="width: 150px" />
      <NSelect v-model:value="campaignId" :options="campaignOptions" style="width: 220px" />
      <NButton type="primary" @click="search">搜索</NButton>
    </div>

    <NSpin :show="loading">
      <NDataTable :columns="columns" :data="items" :scroll-x="1280" />
      <NPagination
        v-model:page="page"
        :page-size="pageSize"
        :item-count="total"
        style="margin-top: 16px; justify-content: flex-end"
        @update:page="load"
      />
    </NSpin>

    <NModal
      v-model:show="reviewShow"
      preset="card"
      :title="decision === 'approve' ? '通过审核' : '拒绝申请'"
      style="width: 480px"
    >
      <p v-if="reviewing" class="meta">User {{ reviewing.userId }}</p>
      <NForm label-placement="top">
        <template v-if="decision === 'approve'">
          <NFormItem>
            <NCheckbox v-model:checked="twitterVerified">已核验 Twitter/X</NCheckbox>
          </NFormItem>
          <NFormItem>
            <NCheckbox v-model:checked="discordVerified">已核验 Discord</NCheckbox>
          </NFormItem>
        </template>
        <NFormItem v-else label="拒绝原因">
          <NInput v-model:value="rejectReason" type="textarea" :rows="3" placeholder="请填写拒绝原因" />
        </NFormItem>
      </NForm>
      <NButton type="primary" block :disabled="!canSubmitReview()" :loading="submitting" @click="submitReview">
        {{ decision === 'approve' ? '确认通过并发放 $20 Bonus' : '确认拒绝' }}
      </NButton>
    </NModal>
  </div>
</template>

<style scoped>
.page-desc,
.meta {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}
.meta {
  margin-bottom: 12px;
}
</style>
