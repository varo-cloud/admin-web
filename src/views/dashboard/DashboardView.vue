<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NSelect, NSpace, NProgress, NCard, NSpin, useMessage } from 'naive-ui'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import StatCard from '@/components/StatCard.vue'
import { fetchDashboardSummary } from '@/api/dashboard'
import { formatUsd } from '@/utils/currency'
import type { DashboardSummary } from '@/types/admin'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const router = useRouter()
const message = useMessage()
const loading = ref(true)
const range = ref('7d')
const summary = ref<DashboardSummary | null>(null)

const rangeOptions = [
  { label: '24 小时', value: '24h' },
  { label: '7 天', value: '7d' },
  { label: '30 天', value: '30d' },
]

async function load() {
  loading.value = true
  try {
    summary.value = await fetchDashboardSummary(range.value)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const failureWarning = computed(() => (summary.value?.failureRate24h ?? 0) > 0.05)

const chartOption = computed(() => {
  const trend = summary.value?.trend ?? []
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['任务数', '充值', '消费', '新用户'] },
    grid: { left: 40, right: 20, bottom: 30, top: 40 },
    xAxis: { type: 'category', data: trend.map((t) => t.date.slice(5)) },
    yAxis: { type: 'value' },
    series: [
      { name: '任务数', type: 'line', data: trend.map((t) => t.generations) },
      { name: '充值', type: 'line', data: trend.map((t) => t.revenueUsd) },
      { name: '消费', type: 'line', data: trend.map((t) => t.spendUsd) },
      { name: '新用户', type: 'line', data: trend.map((t) => t.newUsers) },
    ],
  }
})

const genTotal = computed(() => summary.value?.generationsToday.total ?? 0)
const genCompleted = computed(() => summary.value?.generationsToday.completed ?? 0)
const genFailed = computed(() => summary.value?.generationsToday.failed ?? 0)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">仪表盘</h1>
      <NSelect v-model:value="range" :options="rangeOptions" style="width: 120px" @update:value="load" />
    </div>

    <NSpin :show="loading">
      <div v-if="summary" class="stats-grid">
        <StatCard title="总用户数" :value="summary.usersTotal" />
        <StatCard title="今日新增" :value="summary.usersNewToday" />
        <StatCard title="7 日活跃" :value="summary.usersActive7d" />
        <StatCard
          title="待处理充值"
          :value="summary.pendingTopupsCount"
          :warning="summary.pendingTopupsCount > 0"
          :clickable="summary.pendingTopupsCount > 0"
          :hint="summary.pendingTopupsCount > 0 ? '点击查看' : undefined"
          @click="router.push('/billing/transactions?status=pending')"
        />
      </div>

      <div v-if="summary" class="mid-grid">
        <NCard title="今日任务">
          <p>总计 {{ genTotal }}</p>
          <NSpace vertical>
            <div>已完成 {{ genCompleted }} ({{ genTotal ? Math.round((genCompleted / genTotal) * 100) : 0 }}%)</div>
            <NProgress type="line" :percentage="genTotal ? (genCompleted / genTotal) * 100 : 0" status="success" />
            <div :class="{ 'text-red': failureWarning }">失败 {{ genFailed }}</div>
            <NProgress
              v-if="genTotal"
              type="line"
              :percentage="(genFailed / genTotal) * 100"
              :status="failureWarning ? 'error' : 'default'"
            />
          </NSpace>
        </NCard>
        <NCard title="今日充值 / 消费">
          <p class="big-num">{{ formatUsd(summary.revenueTodayUsd) }} / {{ formatUsd(summary.spendTodayUsd) }}</p>
          <p class="sub">Web {{ summary.generationsTodayByChannel.web }} · API {{ summary.generationsTodayByChannel.api }}</p>
        </NCard>
      </div>

      <NCard v-if="summary" title="7 日趋势" style="margin-top: 16px">
        <VChart :option="chartOption" style="height: 320px" autoresize />
      </NCard>
    </NSpin>
  </div>
</template>

<style scoped>
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
.big-num {
  font-size: 24px;
  font-weight: 700;
}
.sub {
  color: #64748b;
  font-size: 13px;
}
.text-red {
  color: #dc2626;
}
@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .mid-grid {
    grid-template-columns: 1fr;
  }
}
</style>
