<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NAlert, NButton, NCard, NProgress, NSpin, useMessage } from 'naive-ui'
import StatCard from '@/components/StatCard.vue'
import { fetchActivityDashboard, fetchCampaigns } from '@/api/activity'
import { formatCents } from '@/utils/currency'
import { formatDateTime } from '@/utils/time'
import type { ActivityDashboard, Campaign } from '@/types/admin'

const router = useRouter()
const message = useMessage()
const loading = ref(true)
const dashboard = ref<ActivityDashboard | null>(null)
const campaign = ref<Campaign | null>(null)
const missingCampaign = ref(false)

async function load() {
  loading.value = true
  missingCampaign.value = false
  try {
    const campaigns = await fetchCampaigns()
    campaign.value =
      campaigns
        .filter((c) => c.state !== 'draft')
        .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null
    dashboard.value = await fetchActivityDashboard()
  } catch (e) {
    const msg = e instanceof Error ? e.message : '加载失败'
    if (/no_campaign_configured/i.test(msg) || /404/.test(msg)) {
      missingCampaign.value = true
      dashboard.value = null
    } else {
      message.error(msg)
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)

const seedRatio = computed(() => {
  const d = dashboard.value
  if (!d || !d.seedCap) return 0
  return Math.min(100, Math.round((d.seedApproved / d.seedCap) * 100))
})

const budgetRatio = computed(() => {
  const d = dashboard.value
  if (!d || !d.budgetCapCents) return 0
  return Math.min(100, Math.round((d.spentCents / d.budgetCapCents) * 100))
})

const budgetWarning = computed(() => budgetRatio.value >= 80)
const pendingWarning = computed(() => (dashboard.value?.seedPending ?? 0) > 0)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">种子激励看板</h1>
        <p v-if="campaign" class="page-desc">
          {{ campaign.name }} · {{ campaign.id }} · 截止 {{ formatDateTime(campaign.endsAt) }}
        </p>
      </div>
      <NButton @click="router.push('/activity/campaigns')">活动配置</NButton>
    </div>

    <NSpin :show="loading">
      <NAlert v-if="missingCampaign" type="warning" title="尚未配置活动" style="margin-bottom: 16px">
        当前没有非草稿活动。请先在活动配置中创建或将草稿改为 active。
      </NAlert>

      <template v-if="dashboard">
        <NAlert
          v-if="pendingWarning"
          type="info"
          :bordered="false"
          style="margin-bottom: 16px"
          :title="`有 ${dashboard.seedPending} 条种子申请待审核`"
        >
          前 30 名通过 Twitter/X + Discord 人工审核后成为 Seed Creator，获得 $20 Bonus。
        </NAlert>

        <div class="stats-grid">
          <StatCard
            title="Seed Creator"
            :value="`${dashboard.seedApproved} / ${dashboard.seedCap}`"
            :hint="`待审 ${dashboard.seedPending}`"
            :warning="pendingWarning"
            :clickable="pendingWarning"
            @click="router.push('/activity/seed-creators?status=submitted')"
          />
          <StatCard
            title="邀请用户"
            :value="dashboard.invitedUsers"
            hint="可远大于种子名额"
            clickable
            @click="router.push('/activity/invitations')"
          />
          <StatCard
            title="Winners"
            :value="`${dashboard.winners} / ${dashboard.seedCap}`"
            :hint="`达标待发 ${dashboard.qualified} · 未中 ${dashboard.noReward}`"
            clickable
            @click="router.push('/activity/invitations')"
          />
          <StatCard
            title="剩余预算"
            :value="formatCents(dashboard.remainingBudgetCents)"
            :hint="`已花 ${formatCents(dashboard.spentCents)} / ${formatCents(dashboard.budgetCapCents)}`"
            :warning="budgetWarning"
          />
        </div>

        <div class="mid-grid">
          <NCard title="名额进度">
            <p>已通过 {{ dashboard.seedApproved }} / 上限 {{ dashboard.seedCap }}</p>
            <NProgress type="line" :percentage="seedRatio" :status="seedRatio >= 100 ? 'warning' : 'success'" />
            <p class="sub">待审核 {{ dashboard.seedPending }}。收口请调 seed_cap，不要把活动 state 从 active 改掉。</p>
          </NCard>
          <NCard title="预算消耗">
            <p>{{ formatCents(dashboard.spentCents) }} / {{ formatCents(dashboard.budgetCapCents) }}</p>
            <NProgress type="line" :percentage="budgetRatio" :status="budgetWarning ? 'warning' : 'success'" />
            <p class="sub">含自动奖励与手动补发。手动补发与自动奖共用预算。</p>
          </NCard>
        </div>

        <NCard title="Bonus 发放" style="margin-top: 16px">
          <div class="issued-grid">
            <div>
              <div class="label">种子奖励</div>
              <div class="value">{{ formatCents(dashboard.seedIssuedCents) }}</div>
            </div>
            <div>
              <div class="label">邀请人奖励</div>
              <div class="value">{{ formatCents(dashboard.inviterIssuedCents) }}</div>
            </div>
            <div>
              <div class="label">Winner 奖励</div>
              <div class="value">{{ formatCents(dashboard.inviteeIssuedCents) }}</div>
            </div>
            <div>
              <div class="label">手动补发</div>
              <div class="value">{{ formatCents(dashboard.manualIssuedCents) }}</div>
            </div>
            <div>
              <div class="label">合计已发</div>
              <div class="value">{{ formatCents(dashboard.totalIssuedCents) }}</div>
            </div>
          </div>
        </NCard>
      </template>
    </NSpin>
  </div>
</template>

<style scoped>
.page-desc {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.mid-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.issued-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}
.label {
  font-size: 13px;
  color: #64748b;
}
.value {
  font-size: 22px;
  font-weight: 700;
  margin-top: 4px;
}
.sub {
  color: #64748b;
  font-size: 13px;
  margin-top: 8px;
}
@media (max-width: 960px) {
  .stats-grid,
  .issued-grid,
  .mid-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
