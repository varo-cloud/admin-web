<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpin,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { fetchCampaigns, patchCampaign } from '@/api/activity'
import StatusTag from '@/components/StatusTag.vue'
import { centsToUsd, formatCents, usdToCents } from '@/utils/currency'
import { formatDateTime, toIsoString } from '@/utils/time'
import type { Campaign, CampaignPatch, CampaignState } from '@/types/admin'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const saving = ref(false)
const campaigns = ref<Campaign[]>([])
const selectedId = ref<string | null>(null)
const form = ref<Campaign | null>(null)

const stateOptions = [
  { label: '草稿 draft', value: 'draft' },
  { label: '进行中 active', value: 'active' },
  { label: '已结束 ended', value: 'ended' },
]

const selected = computed(() => campaigns.value.find((c) => c.id === selectedId.value) ?? null)

const budgetUsd = computed({
  get: () => (form.value ? centsToUsd(form.value.budgetCapCents) : 0),
  set: (v: number | null) => {
    if (form.value) form.value.budgetCapCents = usdToCents(v ?? 0)
  },
})

const minDepositUsd = computed({
  get: () => (form.value ? centsToUsd(form.value.minDepositCents) : 0),
  set: (v: number | null) => {
    if (form.value) form.value.minDepositCents = usdToCents(v ?? 0)
  },
})

const inviterUsd = computed({
  get: () => (form.value ? centsToUsd(form.value.rewardInviterCents) : 0),
  set: (v: number | null) => {
    if (form.value) form.value.rewardInviterCents = usdToCents(v ?? 0)
  },
})

const inviteeUsd = computed({
  get: () => (form.value ? centsToUsd(form.value.rewardInviteeCents) : 0),
  set: (v: number | null) => {
    if (form.value) form.value.rewardInviteeCents = usdToCents(v ?? 0)
  },
})

function cloneCampaign(c: Campaign): Campaign {
  return { ...c }
}

function selectCampaign(id: string) {
  selectedId.value = id
  const found = campaigns.value.find((c) => c.id === id)
  form.value = found ? cloneCampaign(found) : null
}

const columns: DataTableColumns<Campaign> = [
  { title: 'ID', key: 'id' },
  { title: '名称', key: 'name' },
  { title: '状态', key: 'state', render: (r) => h(StatusTag, { status: r.state }) },
  { title: '名额', key: 'seedCap' },
  {
    title: '预算',
    key: 'budgetCapCents',
    render: (r) => `${formatCents(r.spentCents)} / ${formatCents(r.budgetCapCents)}`,
  },
  { title: '开始', key: 'startsAt', render: (r) => formatDateTime(r.startsAt) },
  { title: '结束', key: 'endsAt', render: (r) => formatDateTime(r.endsAt) },
  {
    title: '操作',
    key: 'actions',
    render: (r) =>
      h(NButton, { size: 'small', onClick: () => selectCampaign(r.id) }, () => '编辑'),
  },
]

async function load() {
  loading.value = true
  try {
    campaigns.value = await fetchCampaigns()
    const keep = selectedId.value && campaigns.value.some((c) => c.id === selectedId.value)
    const next = keep
      ? selectedId.value!
      : campaigns.value.find((c) => c.state !== 'draft')?.id ?? campaigns.value[0]?.id ?? null
    if (next) selectCampaign(next)
    else {
      selectedId.value = null
      form.value = null
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function buildPatch(): CampaignPatch | null {
  if (!form.value || !selected.value) return null
  const next = form.value
  const prev = selected.value
  const patch: CampaignPatch = {}
  if (next.name !== prev.name) patch.name = next.name
  if (next.state !== prev.state) patch.state = next.state as CampaignState
  if (next.seedCap !== prev.seedCap) patch.seedCap = next.seedCap
  if (next.budgetCapCents !== prev.budgetCapCents) patch.budgetCapCents = next.budgetCapCents
  if (next.bonusTtlDays !== prev.bonusTtlDays) patch.bonusTtlDays = next.bonusTtlDays
  if (next.depositWindowDays !== prev.depositWindowDays) patch.depositWindowDays = next.depositWindowDays
  if (next.minDepositCents !== prev.minDepositCents) patch.minDepositCents = next.minDepositCents
  if (next.rewardInviterCents !== prev.rewardInviterCents) patch.rewardInviterCents = next.rewardInviterCents
  if (next.rewardInviteeCents !== prev.rewardInviteeCents) patch.rewardInviteeCents = next.rewardInviteeCents
  if (next.startsAt !== prev.startsAt) patch.startsAt = toIsoString(next.startsAt) ?? null
  if (next.endsAt !== prev.endsAt) patch.endsAt = toIsoString(next.endsAt) ?? null
  return patch
}

function confirmSave() {
  const patch = buildPatch()
  if (!patch || !form.value) return
  if (Object.keys(patch).length === 0) {
    message.info('没有改动')
    return
  }

  const leavingActive = selected.value?.state === 'active' && patch.state && patch.state !== 'active'
  const content = leavingActive
    ? '即将把活动从 active 改掉。排空 waiting_for_topup / qualified 邀请前不要改 state，否则窗口内首充资格会永久丢失。确认继续？'
    : `将更新活动 ${form.value.id} 的 ${Object.keys(patch).length} 项配置。`

  dialog.warning({
    title: '保存活动配置',
    content,
    positiveText: '保存',
    negativeText: '取消',
    onPositiveClick: submitSave,
  })
}

async function submitSave() {
  if (!form.value) return
  const patch = buildPatch()
  if (!patch || Object.keys(patch).length === 0) return
  saving.value = true
  try {
    const updated = await patchCampaign(form.value.id, patch)
    message.success('已保存')
    const idx = campaigns.value.findIndex((c) => c.id === updated.id)
    if (idx >= 0) campaigns.value[idx] = updated
    else campaigns.value.push(updated)
    selectCampaign(updated.id)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">活动配置</h1>
        <p class="page-desc">可改名额、预算、窗口和结束时间。种子奖励金额与已花预算不可改。</p>
      </div>
    </div>

    <NAlert type="warning" title="运营注意" style="margin-bottom: 16px">
      <ul class="rules">
        <li><code>ends_at</code> 要比最后一次绑定多留至少一个充值窗口（默认 3 天），上线后不要缩短。</li>
        <li>排空 waiting / qualified 邀请前，不要把 <code>state</code> 从 active 改掉。</li>
        <li>收口用 <code>seed_cap</code>，不要用暂停 state——非 active 时首充资格会永久丢失。</li>
      </ul>
    </NAlert>

    <NSpin :show="loading">
      <NDataTable :columns="columns" :data="campaigns" style="margin-bottom: 16px" />

      <NCard v-if="form" :title="`编辑 ${form.id}`">
        <NForm label-placement="left" label-width="180">
          <NFormItem label="名称">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem label="状态">
            <NSelect v-model:value="form.state" :options="stateOptions" style="width: 240px" />
          </NFormItem>
          <NFormItem label="种子名额 seed_cap">
            <NInputNumber v-model:value="form.seedCap" :min="0" :precision="0" style="width: 200px" />
          </NFormItem>
          <NFormItem label="总预算 USD">
            <NInputNumber v-model:value="budgetUsd" :min="0" :step="10" :precision="2" style="width: 200px" />
            <span class="hint">{{ form.budgetCapCents }} cents · 已花 {{ formatCents(form.spentCents) }}（只读）</span>
          </NFormItem>
          <NFormItem label="邀请人奖励 USD">
            <NInputNumber v-model:value="inviterUsd" :min="0" :step="1" :precision="2" style="width: 200px" />
          </NFormItem>
          <NFormItem label="Winner 奖励 USD">
            <NInputNumber v-model:value="inviteeUsd" :min="0" :step="1" :precision="2" style="width: 200px" />
          </NFormItem>
          <NFormItem label="首充门槛 USD">
            <NInputNumber v-model:value="minDepositUsd" :min="0" :step="1" :precision="2" style="width: 200px" />
          </NFormItem>
          <NFormItem label="充值窗口（天）">
            <NInputNumber v-model:value="form.depositWindowDays" :min="1" :precision="0" style="width: 200px" />
          </NFormItem>
          <NFormItem label="Bonus 有效期（天）">
            <NInputNumber v-model:value="form.bonusTtlDays" :min="1" :precision="0" style="width: 200px" />
            <span class="hint">实际过期 = min(领取 + TTL, ends_at)；延长 ends_at 不会延长已发 lot</span>
          </NFormItem>
          <NFormItem label="开始时间">
            <NDatePicker v-model:value="form.startsAt" type="datetime" clearable />
          </NFormItem>
          <NFormItem label="结束时间">
            <NDatePicker v-model:value="form.endsAt" type="datetime" clearable />
          </NFormItem>
          <NFormItem label="种子奖励（只读）">
            <span>{{ formatCents(form.seedBonusCents) }} · API 不可改</span>
          </NFormItem>
        </NForm>
        <NButton type="primary" :loading="saving" @click="confirmSave">保存</NButton>
      </NCard>
    </NSpin>
  </div>
</template>

<style scoped>
.page-desc {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}
.rules {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.7;
}
.hint {
  margin-left: 12px;
  color: #64748b;
  font-size: 13px;
}
code {
  font-size: 12px;
  background: #f1f5f9;
  padding: 1px 4px;
  border-radius: 4px;
}
</style>
