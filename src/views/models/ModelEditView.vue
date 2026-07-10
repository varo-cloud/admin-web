<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NTabPane,
  NTabs,
  NTag,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import JsonEditor from '@/components/JsonEditor.vue'
import LocaleTabs from '@/components/LocaleTabs.vue'
import OfferingExamplesEditor from '@/components/OfferingExamplesEditor.vue'
import {
  baseModelToPayload,
  createBaseModel,
  createOffering,
  createProviderRoute,
  deleteOffering,
  deleteProviderRoute,
  fetchBaseModel,
  fetchOfferings,
  fetchProviderRoutes,
  localizedToI18n,
  offeringToPayload,
  providerRouteToPayload,
  updateBaseModel,
  updateOffering,
  updateProviderRoute,
} from '@/api/models'
import type { BaseModel, Offering, OfferingExample, ProviderRoute } from '@/types/admin'
import type { ContentLocale } from '@/types'
import { emptyLocalizedString, normalizeLocalizedString } from '@/utils/locale'
import { validateExamplesList } from '@/utils/offeringExamples'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const isNew = computed(() => route.name === 'model-new')
const modelSlug = computed(() => route.params.slug as string | undefined)

const saving = ref(false)
const dirty = ref(false)
const rateJson = ref('{}')
const schemaJson = ref('{}')
const editingExamples = ref<OfferingExample[]>([])
const docsLocale = ref<ContentLocale>('en-US')

const editingInputSchema = computed(() => {
  try {
    return JSON.parse(schemaJson.value || '{}') as Record<string, unknown>
  } catch {
    return {}
  }
})

const baseForm = ref<Partial<BaseModel>>({
  slug: '',
  category: 'video',
  mode: 'video',
  apiModelId: null,
  rate: {},
  description: '',
  active: true,
  sortOrder: 0,
})

const offerings = ref<Offering[]>([])
const routes = ref<ProviderRoute[]>([])
const offeringDrawer = ref(false)
const routeDrawer = ref(false)
const offeringSaving = ref(false)
const routeSaving = ref(false)
const editingOffering = ref<(Partial<Offering> & { isCreating?: boolean }) | null>(null)
const editingRoute = ref<(Partial<ProviderRoute> & { isCreating?: boolean; apiKey?: string }) | null>(null)
const readmeLocalized = ref(emptyLocalizedString())

const categoryOptions = [
  { label: 'video', value: 'video' },
  { label: 'image', value: 'image' },
  { label: 'llm', value: 'llm' },
]

const modeOptions = [
  { label: 'video', value: 'video' },
  { label: 'audio', value: 'audio' },
  { label: 'dashscope_video', value: 'dashscope_video' },
  { label: 'sandbase_video', value: 'sandbase_video' },
]

const priceUnitOptions = [
  { label: 'per_second', value: 'per_second' },
  { label: 'per_image', value: 'per_image' },
  { label: 'per_million_tokens', value: 'per_million_tokens' },
  { label: 'per_hour', value: 'per_hour' },
]

function markDirty() {
  dirty.value = true
}

function applyBaseModel(data: BaseModel) {
  baseForm.value = { ...data }
  rateJson.value = JSON.stringify(data.rate ?? {}, null, 2)
}

async function loadRelated() {
  if (!modelSlug.value || isNew.value) return
  const [offers, providerRoutes] = await Promise.all([
    fetchOfferings(baseForm.value.seqId),
    fetchProviderRoutes(modelSlug.value),
  ])
  offerings.value = offers
  routes.value = providerRoutes
}

async function loadModel() {
  if (isNew.value) return
  const data = await fetchBaseModel(modelSlug.value!)
  applyBaseModel(data)
  await loadRelated()
}

onMounted(async () => {
  try {
    await loadModel()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  }
})

watch(
  () => route.params.slug,
  async () => {
    if (isNew.value) return
    try {
      await loadModel()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败')
    }
  },
)

function validateBaseForm(): boolean {
  if (!baseForm.value.slug?.trim()) {
    message.error('请填写 slug')
    return false
  }
  if (!baseForm.value.mode) {
    message.error('请选择计价模式')
    return false
  }
  try {
    baseForm.value.rate = JSON.parse(rateJson.value || '{}')
  } catch {
    message.error('Rate JSON 无效')
    return false
  }
  return true
}

async function saveBaseModel() {
  if (!validateBaseForm()) return
  saving.value = true
  try {
    const payload = baseModelToPayload(baseForm.value)
    if (isNew.value) {
      const created = await createBaseModel(payload)
      message.success('基座模型创建成功，请继续配置 Offering 和 Provider Route')
      dirty.value = false
      router.replace(`/models/${created.slug}/edit`)
    } else {
      await updateBaseModel(modelSlug.value!, payload)
      message.success('保存成功')
      dirty.value = false
      await loadModel()
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

function defaultOffering(): Partial<Offering> & { isCreating: boolean } {
  return {
    isCreating: true,
    modelId: baseForm.value.seqId,
    capability: '',
    displayName: '',
    description: '',
    thumbnailUrl: null,
    iconUrl: null,
    startingPriceUsd: null,
    standardPriceUsd: null,
    priceUnit: 'per_second',
    priceDetail: null,
    readmeMd: null,
    readmeMdI18n: null,
    faq: [],
    faqI18n: null,
    inputSchema: {},
    examples: [],
    isHot: false,
    isNew: false,
    active: true,
    sortOrder: 0,
  }
}

function openOfferingEditor(row?: Offering) {
  docsLocale.value = 'en-US'
  if (row) {
    editingOffering.value = { ...row, isCreating: false }
    schemaJson.value = JSON.stringify(row.inputSchema ?? {}, null, 2)
    editingExamples.value = [...(row.examples ?? [])]
    readmeLocalized.value = row.readmeMdI18n
      ? normalizeLocalizedString(row.readmeMdI18n)
      : row.readmeMd
        ? { 'en-US': row.readmeMd, 'zh-CN': '' }
        : emptyLocalizedString()
  } else {
    editingOffering.value = defaultOffering()
    schemaJson.value = '{}'
    editingExamples.value = []
    readmeLocalized.value = emptyLocalizedString()
  }
  offeringDrawer.value = true
}

async function saveOffering() {
  if (!editingOffering.value) return
  const item = editingOffering.value
  if (!item.capability?.trim()) return message.warning('请填写 capability')
  if (!item.displayName?.trim()) return message.warning('请填写展示名称')

  try {
    item.inputSchema = JSON.parse(schemaJson.value || '{}')
  } catch {
    return message.error('Input Schema JSON 无效')
  }

  const examplesErr = validateExamplesList(editingExamples.value)
  if (examplesErr) return message.warning(examplesErr)

  item.examples = editingExamples.value
  const i18n = localizedToI18n(readmeLocalized.value)
  item.readmeMdI18n = i18n
  item.readmeMd = readmeLocalized.value['en-US']?.trim() || null

  offeringSaving.value = true
  try {
    const payload = offeringToPayload(item, { includeModelId: !!item.isCreating })
    if (item.isCreating) {
      await createOffering(payload)
      message.success('Offering 已创建')
    } else {
      await updateOffering(item.seqId!, payload)
      message.success('Offering 已更新')
    }
    offeringDrawer.value = false
    await loadRelated()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    offeringSaving.value = false
  }
}

function confirmDeleteOffering(row: Offering) {
  dialog.warning({
    title: '删除 Offering',
    content: `确认删除 ${row.capability}？`,
    positiveText: '删除',
    onPositiveClick: async () => {
      try {
        await deleteOffering(row.seqId)
        message.success('已删除')
        await loadRelated()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '删除失败')
      }
    },
  })
}

function defaultRoute(): Partial<ProviderRoute> & { isCreating: boolean; apiKey: string } {
  return {
    isCreating: true,
    provider: '',
    priority: routes.value.length,
    baseUrl: '',
    apiKey: '',
    apiModelId: null,
    active: true,
  }
}

function openRouteEditor(row?: ProviderRoute) {
  if (row) {
    editingRoute.value = { ...row, isCreating: false, apiKey: '' }
  } else {
    editingRoute.value = defaultRoute()
  }
  routeDrawer.value = true
}

async function saveRoute() {
  if (!editingRoute.value || !modelSlug.value) return
  const item = editingRoute.value
  if (!item.provider?.trim()) return message.warning('请填写 provider')
  if (!item.baseUrl?.trim()) return message.warning('请填写 base_url')
  if (item.isCreating && !item.apiKey?.trim()) return message.warning('请填写 api_key')

  routeSaving.value = true
  try {
    const payload = providerRouteToPayload(item)
    if (item.isCreating) {
      await createProviderRoute(modelSlug.value, payload)
      message.success('Provider Route 已创建')
    } else {
      if (!item.apiKey?.trim()) delete payload.api_key
      await updateProviderRoute(modelSlug.value, item.seqId!, payload)
      message.success('Provider Route 已更新')
    }
    routeDrawer.value = false
    await loadRelated()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    routeSaving.value = false
  }
}

function confirmDeleteRoute(row: ProviderRoute) {
  dialog.warning({
    title: '删除 Provider Route',
    content: `确认删除 ${row.provider}（priority ${row.priority}）？`,
    positiveText: '删除',
    onPositiveClick: async () => {
      try {
        await deleteProviderRoute(modelSlug.value!, row.seqId)
        message.success('已删除')
        await loadRelated()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '删除失败')
      }
    },
  })
}

const offeringColumns: DataTableColumns<Offering> = [
  { title: 'Capability', key: 'capability' },
  { title: '展示名称', key: 'displayName' },
  {
    title: '对外 Slug',
    key: 'fullSlug',
    render: (r) => `${modelSlug.value}/${r.capability}`,
  },
  {
    title: '状态',
    key: 'active',
    render: (r) =>
      h(NTag, { type: r.active ? 'success' : 'default', size: 'small' }, () =>
        r.active ? '启用' : '禁用',
      ),
  },
  { title: '排序', key: 'sortOrder' },
  {
    title: '示例',
    key: 'examples',
    width: 70,
    render: (r) => (r.examples?.length ? `${r.examples.length} 条` : '—'),
  },
  {
    title: '操作',
    key: 'actions',
    render: (r) =>
      h('div', { style: 'display:flex;gap:8px' }, [
        h(NButton, { size: 'small', onClick: () => openOfferingEditor(r) }, () => '编辑'),
        h(NButton, { size: 'small', type: 'error', onClick: () => confirmDeleteOffering(r) }, () => '删除'),
      ]),
  },
]

const routeColumns: DataTableColumns<ProviderRoute> = [
  { title: 'Provider', key: 'provider' },
  { title: 'Priority', key: 'priority' },
  { title: 'Base URL', key: 'baseUrl', ellipsis: { tooltip: true } },
  { title: 'API Model ID', key: 'apiModelId', render: (r) => r.apiModelId || '（继承基座）' },
  {
    title: '状态',
    key: 'active',
    render: (r) =>
      h(NTag, { type: r.active ? 'success' : 'default', size: 'small' }, () =>
        r.active ? '启用' : '禁用',
      ),
  },
  {
    title: '操作',
    key: 'actions',
    render: (r) =>
      h('div', { style: 'display:flex;gap:8px' }, [
        h(NButton, { size: 'small', onClick: () => openRouteEditor(r) }, () => '编辑'),
        h(NButton, { size: 'small', type: 'error', onClick: () => confirmDeleteRoute(r) }, () => '删除'),
      ]),
  },
]

onBeforeRouteLeave((_to, _from, next) => {
  if (!dirty.value) return next()
  if (window.confirm('有未保存的更改，确定离开？')) next()
  else next(false)
})
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">
        {{ isNew ? '创建基座模型' : `编辑基座模型 · ${baseForm.slug}` }}
      </h1>
      <div>
        <NButton style="margin-right: 8px" @click="router.push('/models')">返回列表</NButton>
        <NButton type="primary" :loading="saving" @click="saveBaseModel">
          保存基座模型
        </NButton>
      </div>
    </div>

    <NTabs type="line">
      <NTabPane name="base" tab="基座模型">
        <NForm label-placement="top" style="max-width: 640px">
          <NFormItem label="Slug *">
            <NInput
              v-model:value="baseForm.slug"
              :disabled="!isNew"
              placeholder="如 seedance-2.0"
              @update:value="markDirty"
            />
          </NFormItem>
          <NFormItem label="分类">
            <NSelect
              v-model:value="baseForm.category"
              :options="categoryOptions"
              @update:value="markDirty"
            />
          </NFormItem>
          <NFormItem label="计价模式 *">
            <NSelect v-model:value="baseForm.mode" :options="modeOptions" @update:value="markDirty" />
          </NFormItem>
          <NFormItem label="API Model ID">
            <NInput
              v-model:value="baseForm.apiModelId"
              placeholder="upstream model 名，可被 Route 覆盖"
              @update:value="markDirty"
            />
          </NFormItem>
          <NFormItem label="内部备注">
            <textarea v-model="baseForm.description" class="textarea" rows="3" @input="markDirty" />
          </NFormItem>
          <NFormItem label="Rate JSON *">
            <JsonEditor v-model="rateJson" @update:model-value="markDirty" />
          </NFormItem>
          <NFormItem label="排序">
            <NInputNumber v-model:value="baseForm.sortOrder" @update:value="markDirty" />
          </NFormItem>
          <NFormItem label="启用">
            <NSwitch v-model:value="baseForm.active" @update:value="markDirty" />
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="offerings" tab="能力条目 (Offering)" :disabled="isNew">
        <div style="margin-bottom: 12px">
          <NButton type="primary" @click="openOfferingEditor()">添加 Offering</NButton>
        </div>
        <NDataTable :columns="offeringColumns" :data="offerings" :scroll-x="900" />
      </NTabPane>

      <NTabPane name="routes" tab="Provider 路由" :disabled="isNew">
        <div style="margin-bottom: 12px">
          <NButton type="primary" @click="openRouteEditor()">添加 Route</NButton>
        </div>
        <NDataTable :columns="routeColumns" :data="routes" :scroll-x="900" />
      </NTabPane>
    </NTabs>

    <NDrawer v-model:show="offeringDrawer" :width="720" placement="right">
      <NDrawerContent :title="editingOffering?.isCreating ? '创建 Offering' : '编辑 Offering'" closable>
        <NForm v-if="editingOffering" label-placement="top">
          <NFormItem label="Capability *">
            <NInput
              v-model:value="editingOffering.capability"
              :disabled="!editingOffering.isCreating"
              placeholder="如 text-to-video"
            />
          </NFormItem>
          <NFormItem label="展示名称 *">
            <NInput v-model:value="editingOffering.displayName" />
          </NFormItem>
          <NFormItem label="描述">
            <textarea v-model="editingOffering.description" class="textarea" rows="3" />
          </NFormItem>
          <NFormItem label="缩略图 URL">
            <NInput v-model:value="editingOffering.thumbnailUrl" />
          </NFormItem>
          <NFormItem label="图标 URL">
            <NInput v-model:value="editingOffering.iconUrl" />
          </NFormItem>
          <NFormItem label="起价 USD">
            <NInputNumber v-model:value="editingOffering.startingPriceUsd" :step="0.001" />
          </NFormItem>
          <NFormItem label="标准价 USD">
            <NInputNumber v-model:value="editingOffering.standardPriceUsd" :step="0.001" />
          </NFormItem>
          <NFormItem label="计价单位">
            <NSelect v-model:value="editingOffering.priceUnit" :options="priceUnitOptions" clearable />
          </NFormItem>
          <NFormItem label="价格详情">
            <NInput v-model:value="editingOffering.priceDetail" placeholder="如 480p" />
          </NFormItem>
          <NFormItem label="热门">
            <NSwitch v-model:value="editingOffering.isHot" />
          </NFormItem>
          <NFormItem label="新品">
            <NSwitch v-model:value="editingOffering.isNew" />
          </NFormItem>
          <NFormItem label="排序">
            <NInputNumber v-model:value="editingOffering.sortOrder" />
          </NFormItem>
          <NFormItem label="启用">
            <NSwitch v-model:value="editingOffering.active" />
          </NFormItem>
          <NFormItem label="Input Schema">
            <JsonEditor v-model="schemaJson" />
          </NFormItem>
          <NFormItem label="Examples">
            <OfferingExamplesEditor
              v-model="editingExamples"
              :input-schema="editingInputSchema"
            />
          </NFormItem>
          <LocaleTabs v-model:locale="docsLocale">
            <NFormItem label="Readme">
              <textarea v-model="readmeLocalized[docsLocale]" class="textarea" rows="6" />
            </NFormItem>
          </LocaleTabs>
        </NForm>
        <template #footer>
          <NButton @click="offeringDrawer = false">取消</NButton>
          <NButton type="primary" :loading="offeringSaving" style="margin-left: 8px" @click="saveOffering">
            保存
          </NButton>
        </template>
      </NDrawerContent>
    </NDrawer>

    <NDrawer v-model:show="routeDrawer" :width="560" placement="right">
      <NDrawerContent :title="editingRoute?.isCreating ? '创建 Provider Route' : '编辑 Provider Route'" closable>
        <NForm v-if="editingRoute" label-placement="top">
          <NFormItem label="Provider *">
            <NInput v-model:value="editingRoute.provider" placeholder="如 byteplus" />
          </NFormItem>
          <NFormItem label="Priority">
            <NInputNumber v-model:value="editingRoute.priority" />
          </NFormItem>
          <NFormItem label="Base URL *">
            <NInput v-model:value="editingRoute.baseUrl" />
          </NFormItem>
          <NFormItem :label="editingRoute.isCreating ? 'API Key *' : 'API Key（留空则不修改）'">
            <NInput v-model:value="editingRoute.apiKey" type="password" show-password-on="click" />
          </NFormItem>
          <NFormItem label="API Model ID">
            <NInput
              v-model:value="editingRoute.apiModelId"
              placeholder="留空则继承基座 api_model_id"
            />
          </NFormItem>
          <NFormItem label="启用">
            <NSwitch v-model:value="editingRoute.active" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NButton @click="routeDrawer = false">取消</NButton>
          <NButton type="primary" :loading="routeSaving" style="margin-left: 8px" @click="saveRoute">
            保存
          </NButton>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
.textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: inherit;
}
</style>
