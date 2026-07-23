<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NCode,
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
import { fetchGenerations, fetchGenerationUpstreamStatus } from '@/api/generations'
import { fetchBaseModels, fetchOfferings } from '@/api/models'
import StatusTag from '@/components/StatusTag.vue'
import CopyText from '@/components/CopyText.vue'
import { formatUsd } from '@/utils/currency'
import { formatTimestamp } from '@/utils/time'
import type { AdminGenerationListItem, GenerationUpstreamStatus } from '@/types/admin'

const router = useRouter()
const message = useMessage()
const loading = ref(false)
const items = ref<AdminGenerationListItem[]>([])
const total = ref(0)
const page = ref(1)

const status = ref<string | null>(null)
const channel = ref<string | null>(null)
const modelId = ref<string | null>(null)
const email = ref('')
const refunded = ref<string | null>(null)
const modelOptions = ref<{ label: string; value: string }[]>([])

const upstreamDrawerShow = ref(false)
const upstreamLoading = ref(false)
const upstreamStatus = ref<GenerationUpstreamStatus | null>(null)

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: 'queued', value: 'queued' },
  { label: 'processing', value: 'processing' },
  { label: 'succeeded', value: 'succeeded' },
  { label: 'completed', value: 'completed' },
  { label: 'failed', value: 'failed' },
]
const channelOptions = [
  { label: '全部渠道', value: '' },
  { label: 'web', value: 'web' },
  { label: 'api', value: 'api' },
  { label: 'playground', value: 'playground' },
]
const refundedOptions = [
  { label: '全部', value: '' },
  { label: '已退款', value: 'true' },
  { label: '未退款', value: 'false' },
]

async function load() {
  loading.value = true
  try {
    const res = await fetchGenerations({
      offset: (page.value - 1) * 20,
      limit: 20,
      status: status.value || undefined,
      invocationChannel: channel.value || undefined,
      modelId: modelId.value || undefined,
      email: email.value || undefined,
      refunded: refunded.value === '' ? undefined : refunded.value === 'true',
    })
    items.value = res.items
    total.value = res.total
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const [baseModels, offerings] = await Promise.all([fetchBaseModels(), fetchOfferings()])
  const slugBySeqId = new Map(baseModels.map((m) => [m.seqId, m.slug]))
  modelOptions.value = [
    { label: '全部模型', value: '' },
    ...offerings.map((o) => {
      const slug = slugBySeqId.get(o.modelId)
      const fullSlug = slug ? `${slug}/${o.capability}` : String(o.seqId)
      return { label: fullSlug, value: fullSlug }
    }),
  ]
  await load()
})

function extractUpstreamErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const error = (body as { error?: unknown }).error
  if (!error || typeof error !== 'object') return null
  const msg = (error as { message?: unknown }).message
  return typeof msg === 'string' && msg ? msg : null
}

const upstreamErrorMessage = computed(() =>
  upstreamStatus.value?.upstream
    ? extractUpstreamErrorMessage(upstreamStatus.value.upstream.body)
    : null,
)

const upstreamBodyJson = computed(() =>
  upstreamStatus.value?.upstream?.body != null
    ? JSON.stringify(upstreamStatus.value.upstream.body, null, 2)
    : null,
)

async function openUpstreamStatus(taskId: string) {
  upstreamDrawerShow.value = true
  upstreamLoading.value = true
  upstreamStatus.value = null
  try {
    upstreamStatus.value = await fetchGenerationUpstreamStatus(taskId)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '查询上游状态失败')
    upstreamDrawerShow.value = false
  } finally {
    upstreamLoading.value = false
  }
}

const columns: DataTableColumns<AdminGenerationListItem> = [
  { title: 'Task ID', key: 'taskId', render: (r) => h(CopyText, { text: r.taskId }) },
  {
    title: '用户',
    key: 'userEmail',
    render: (r) =>
      h(NButton, { text: true, type: 'primary', onClick: () => router.push(`/users/${r.userId}`) }, () => r.userEmail),
  },
  { title: '模型', key: 'model' },
  { title: '状态', key: 'status', render: (r) => h(StatusTag, { status: r.status }) },
  { title: '费用', key: 'costUsd', render: (r) => formatUsd(r.costUsd) },
  { title: '时长', key: 'duration', render: (r) => `${r.duration}s` },
  { title: '渠道', key: 'invocationChannel' },
  { title: '已退款', key: 'refunded', render: (r) => (r.refunded ? '✓' : '—') },
  { title: '创建时间', key: 'createdAt', render: (r) => formatTimestamp(r.createdAt) },
  {
    title: '操作',
    key: 'actions',
    render: (r) =>
      h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, [
        h(NButton, { size: 'small', onClick: () => router.push(`/generations/${r.taskId}`) }, () => '查看'),
        r.status === 'failed'
          ? h(
              NButton,
              { size: 'small', type: 'warning', onClick: () => openUpstreamStatus(r.taskId) },
              () => '上游失败',
            )
          : null,
      ]),
  },
]
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">任务列表</h1>
    </div>

    <div class="filter-bar">
      <NSelect v-model:value="status" :options="statusOptions" style="width: 140px" />
      <NSelect v-model:value="channel" :options="channelOptions" style="width: 120px" />
      <NSelect v-model:value="modelId" :options="modelOptions" style="width: 180px" />
      <NInput v-model:value="email" placeholder="用户 email" style="width: 180px" />
      <NSelect v-model:value="refunded" :options="refundedOptions" style="width: 120px" />
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

    <NDrawer v-model:show="upstreamDrawerShow" :width="520">
      <NDrawerContent title="上游失败信息" closable>
        <NSpin :show="upstreamLoading">
          <template v-if="upstreamStatus">
            <p class="meta-row">
              Task ID: <span class="mono">{{ upstreamStatus.taskId }}</span>
            </p>
            <p class="meta-row">模型: {{ upstreamStatus.model }}</p>
            <p class="meta-row">
              我方状态: <StatusTag :status="upstreamStatus.ourStatus" />
            </p>
            <p class="meta-row">供应商: {{ upstreamStatus.providerUsed ?? '—' }}</p>
            <p class="meta-row">路由供应商: {{ upstreamStatus.routeProvider ?? '—' }}</p>
            <p class="meta-row">
              供应商 Task ID:
              <span class="mono">{{ upstreamStatus.providerTaskId ?? '—' }}</span>
            </p>

            <template v-if="upstreamStatus.upstream">
              <p class="meta-row">
                上游 HTTP: {{ upstreamStatus.upstream.httpStatus ?? '—' }}
              </p>
              <p v-if="upstreamStatus.upstream.url" class="meta-row">
                上游 URL:
                <a
                  :href="upstreamStatus.upstream.url"
                  target="_blank"
                  rel="noopener"
                  class="mono"
                >{{ upstreamStatus.upstream.url }}</a>
              </p>

              <div v-if="upstreamErrorMessage" class="error-box">
                {{ upstreamErrorMessage }}
              </div>

              <section v-if="upstreamBodyJson" class="body-section">
                <h3 class="section-title">上游响应</h3>
                <NCode :code="upstreamBodyJson" language="json" word-wrap />
              </section>
            </template>
            <p v-else class="empty">暂无上游详情</p>
          </template>
        </NSpin>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
.meta-row {
  margin: 0 0 8px;
  font-size: 13px;
  color: #334155;
  word-break: break-all;
}
.error-box {
  margin: 16px 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.body-section {
  margin-top: 16px;
}
.section-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}
.empty {
  color: #94a3b8;
  font-size: 13px;
}
</style>
