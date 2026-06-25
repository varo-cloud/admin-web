<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NTabPane,
  NTabs,
  useMessage,
} from 'naive-ui'
import JsonEditor from '@/components/JsonEditor.vue'
import LocaleTabs from '@/components/LocaleTabs.vue'
import {
  createModel,
  fetchModelDetail,
  modelToPayload,
  updateModel,
} from '@/api/models'
import type { AdminModelDetail } from '@/types/admin'
import type { ContentLocale, ModelFaqItem } from '@/types'
import { emptyLocalizedString, normalizeLocalizedString } from '@/utils/locale'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const isNew = computed(() => route.name === 'model-new')
const modelId = computed(() => route.params.id as string | undefined)

const saving = ref(false)
const dirty = ref(false)
const schemaJson = ref('{}')
const basicLocale = ref<ContentLocale>('en-US')
const docsLocale = ref<ContentLocale>('en-US')

const form = ref<Partial<AdminModelDetail>>({
  id: '',
  name: emptyLocalizedString(),
  displayName: emptyLocalizedString(),
  provider: '',
  capabilities: [],
  description: emptyLocalizedString(),
  thumbnailUrl: '',
  modelPath: '',
  apiModelId: '',
  active: false,
  isHot: false,
  sortOrder: 100,
  startingPriceUsd: 0,
  standardPriceUsd: 0,
  priceUnit: 'per_second',
  priceDetail: '',
  discountPercent: 0,
  perRunPriceUsd: 0,
  runsPerTenUsd: 0,
  inputSchema: {},
  readmeMd: emptyLocalizedString(),
  faq: [],
})

const capInput = ref('')
const faqItems = ref<ModelFaqItem[]>([])

const priceUnitOptions = [
  { label: 'per_second', value: 'per_second' },
  { label: 'per_image', value: 'per_image' },
  { label: 'per_million_tokens', value: 'per_million_tokens' },
  { label: 'per_hour', value: 'per_hour' },
]

function markDirty() {
  dirty.value = true
}

function ensureLocalizedFields() {
  form.value.name = normalizeLocalizedString(form.value.name)
  form.value.displayName = normalizeLocalizedString(form.value.displayName)
  form.value.description = normalizeLocalizedString(form.value.description)
  form.value.readmeMd = normalizeLocalizedString(form.value.readmeMd)
}

async function loadModel() {
  if (isNew.value) return
  const data = await fetchModelDetail(modelId.value!)
  form.value = {
    ...data,
    name: normalizeLocalizedString(data.name),
    displayName: normalizeLocalizedString(data.displayName),
    description: normalizeLocalizedString(data.description),
    readmeMd: normalizeLocalizedString(data.readmeMd),
  }
  schemaJson.value = JSON.stringify(data.inputSchema ?? {}, null, 2)
  faqItems.value = (data.faq ?? []).map((item) => ({
    question: normalizeLocalizedString(item.question),
    answer: normalizeLocalizedString(item.answer),
  }))
}

onMounted(async () => {
  try {
    await loadModel()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  }
})

function addCap() {
  const v = capInput.value.trim()
  if (v && !form.value.capabilities?.includes(v)) {
    form.value.capabilities = [...(form.value.capabilities ?? []), v]
    capInput.value = ''
    markDirty()
  }
}

function addFaq() {
  faqItems.value.push({ question: emptyLocalizedString(), answer: emptyLocalizedString() })
  markDirty()
}

function validateLocalizedFields(): boolean {
  ensureLocalizedFields()
  if (!form.value.name?.['en-US']?.trim()) {
    message.error('请填写英文完整名称 (en-US)')
    basicLocale.value = 'en-US'
    return false
  }
  if (!form.value.description?.['en-US']?.trim()) {
    message.error('请填写英文描述 (en-US)')
    basicLocale.value = 'en-US'
    return false
  }
  return true
}

async function save() {
  if (!validateLocalizedFields()) return

  try {
    const parsed = JSON.parse(schemaJson.value || '{}')
    form.value.inputSchema = parsed
  } catch {
    return message.error('Input Schema JSON 无效')
  }

  form.value.faq = faqItems.value.filter((f) => f.question['en-US']?.trim() || f.question['zh-CN']?.trim())

  saving.value = true
  try {
    const payload = modelToPayload(form.value)
    if (isNew.value) {
      const created = await createModel(payload)
      message.success('创建成功，请完成配置后上架')
      dirty.value = false
      router.replace(`/models/${created.id}/edit`)
    } else {
      await updateModel(modelId.value!, payload)
      message.success('保存成功')
      dirty.value = false
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

onBeforeRouteLeave((_to, _from, next) => {
  if (!dirty.value) return next()
  if (window.confirm('有未保存的更改，确定离开？')) next()
  else next(false)
})
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ isNew ? '创建模型' : `编辑模型 · ${form.id}` }}</h1>
      <div>
        <NButton style="margin-right: 8px" @click="router.push('/models')">取消</NButton>
        <NButton type="primary" :loading="saving" @click="save">保存</NButton>
      </div>
    </div>

    <NTabs type="line" @update:value="markDirty">
      <NTabPane name="basic" tab="基本信息">
        <LocaleTabs v-model:locale="basicLocale">
          <NForm label-placement="top" style="max-width: 640px">
            <NFormItem label="ID *">
              <NInput v-model:value="form.id" :disabled="!isNew" @update:value="markDirty" />
            </NFormItem>
            <NFormItem :label="basicLocale === 'en-US' ? '完整名称 *' : '完整名称'">
              <NInput v-model:value="form.name![basicLocale]" @update:value="markDirty" />
            </NFormItem>
            <NFormItem label="展示名称">
              <NInput v-model:value="form.displayName![basicLocale]" @update:value="markDirty" />
            </NFormItem>
            <NFormItem label="提供商 *">
              <NInput v-model:value="form.provider" @update:value="markDirty" />
            </NFormItem>
            <NFormItem label="能力 *">
              <div class="cap-row">
                <NInput v-model:value="capInput" placeholder="如 text-to-video" @keyup.enter="addCap" />
                <NButton @click="addCap">添加</NButton>
              </div>
              <div class="caps">{{ form.capabilities?.join(', ') }}</div>
            </NFormItem>
            <NFormItem :label="basicLocale === 'en-US' ? '描述 *' : '描述'">
              <textarea v-model="form.description![basicLocale]" class="textarea" rows="3" @input="markDirty" />
            </NFormItem>
            <NFormItem label="缩略图 URL">
              <NInput v-model:value="form.thumbnailUrl" @update:value="markDirty" />
            </NFormItem>
            <NFormItem label="model_path *">
              <NInput v-model:value="form.modelPath" @update:value="markDirty" />
            </NFormItem>
            <NFormItem label="api_model_id *">
              <NInput v-model:value="form.apiModelId" @update:value="markDirty" />
            </NFormItem>
            <NFormItem label="热门">
              <NSwitch v-model:value="form.isHot" @update:value="markDirty" />
            </NFormItem>
            <NFormItem label="排序">
              <NInputNumber v-model:value="form.sortOrder" @update:value="markDirty" />
            </NFormItem>
            <NFormItem label="上架">
              <NSwitch v-model:value="form.active" @update:value="markDirty" />
            </NFormItem>
          </NForm>
        </LocaleTabs>
      </NTabPane>

      <NTabPane name="pricing" tab="定价">
        <NForm label-placement="top" style="max-width: 480px">
          <NFormItem label="起价 USD">
            <NInputNumber v-model:value="form.startingPriceUsd" :step="0.001" @update:value="markDirty" />
          </NFormItem>
          <NFormItem label="标准价 USD">
            <NInputNumber v-model:value="form.standardPriceUsd" :step="0.001" @update:value="markDirty" />
          </NFormItem>
          <NFormItem label="计价单位">
            <NSelect
              v-model:value="form.priceUnit"
              :options="priceUnitOptions"
              @update:value="markDirty"
            />
          </NFormItem>
          <NFormItem label="价格详情">
            <NInput v-model:value="form.priceDetail" placeholder="如 720p" @update:value="markDirty" />
          </NFormItem>
          <NFormItem label="折扣 %">
            <NInputNumber v-model:value="form.discountPercent" :min="0" :max="100" @update:value="markDirty" />
          </NFormItem>
          <NFormItem label="单次运行价">
            <NInputNumber v-model:value="form.perRunPriceUsd" :step="0.01" @update:value="markDirty" />
          </NFormItem>
          <NFormItem label="runs/10 USD">
            <NInputNumber v-model:value="form.runsPerTenUsd" @update:value="markDirty" />
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="schema" tab="Input Schema">
        <JsonEditor v-model="schemaJson" @update:model-value="markDirty" />
      </NTabPane>

      <NTabPane name="docs" tab="文档 FAQ">
        <LocaleTabs v-model:locale="docsLocale">
          <NFormItem label="readme_md">
            <textarea v-model="form.readmeMd![docsLocale]" class="textarea" rows="8" @input="markDirty" />
          </NFormItem>
          <NButton size="small" @click="addFaq">添加 FAQ</NButton>
          <div v-for="(item, i) in faqItems" :key="i" class="faq-item">
            <NInput
              v-model:value="item.question[docsLocale]"
              placeholder="问题"
              @update:value="markDirty"
            />
            <textarea
              v-model="item.answer[docsLocale]"
              class="textarea"
              rows="2"
              placeholder="回答"
              @input="markDirty"
            />
          </div>
        </LocaleTabs>
      </NTabPane>
    </NTabs>
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
.cap-row {
  display: flex;
  gap: 8px;
}
.caps {
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
}
.faq-item {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
