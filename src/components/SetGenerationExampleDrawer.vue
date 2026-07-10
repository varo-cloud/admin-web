<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpin,
  useMessage,
} from 'naive-ui'
import JsonEditor from '@/components/JsonEditor.vue'
import LocaleTabs from '@/components/LocaleTabs.vue'
import { fetchBaseModel, fetchOfferings, offeringToPayload, updateOffering } from '@/api/models'
import type { ContentLocale } from '@/types'
import type { Offering } from '@/types/admin'
import {
  exampleFormFromGeneration,
  formToExample,
  parseOfferingModelId,
  suggestExampleId,
  upsertExample,
  validateExampleForm,
  type OfferingExampleForm,
} from '@/utils/offeringExamples'

const props = defineProps<{
  show: boolean
  model: string
  taskId: string
  input: Record<string, unknown>
  outputUrl: string
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  saved: [offering: Offering]
}>()

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const exampleLocale = ref<ContentLocale>('en-US')
const offering = ref<Offering | null>(null)
const form = ref<OfferingExampleForm | null>(null)

async function loadOffering() {
  const parsed = parseOfferingModelId(props.model)
  if (!parsed) {
    message.error('模型格式无效，须为 {base_model}/{capability}')
    emit('update:show', false)
    return
  }

  loading.value = true
  offering.value = null
  form.value = null
  try {
    const baseModel = await fetchBaseModel(parsed.slug)
    const offerings = await fetchOfferings(baseModel.seqId)
    const match = offerings.find((o) => o.capability === parsed.capability)
    if (!match) {
      message.error(`未找到 offering：${props.model}`)
      emit('update:show', false)
      return
    }
    offering.value = match
    const suggestedId = suggestExampleId(props.input, props.taskId)
    const existing = match.examples.find((e) => e.id === suggestedId)
    form.value = exampleFormFromGeneration(
      props.input,
      props.outputUrl,
      props.taskId,
      existing?.sortOrder ?? match.examples.length,
    )
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载 offering 失败')
    emit('update:show', false)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      exampleLocale.value = 'en-US'
      void loadOffering()
    }
  },
)

async function save() {
  if (!offering.value || !form.value) return
  const id = form.value.id.trim()
  const replacing = offering.value.examples.some((e) => e.id === id)
  const err = validateExampleForm(
    form.value,
    offering.value.examples.map((e) => e.id),
    replacing ? id : undefined,
  )
  if (err) return message.warning(err)

  let example
  try {
    example = formToExample(form.value)
  } catch {
    return message.error('input JSON 格式无效')
  }

  saving.value = true
  try {
    const { list: nextExamples, replaced } = upsertExample(offering.value.examples, example)
    const updated = await updateOffering(
      offering.value.seqId,
      offeringToPayload({ examples: nextExamples }),
    )
    message.success(replaced ? `已更新示例「${example.id}」` : `已添加示例到 ${props.model}`)
    emit('saved', updated)
    emit('update:show', false)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <NDrawer :show="show" :width="600" placement="right" @update:show="emit('update:show', $event)">
    <NDrawerContent title="设为 Playground 示例" closable>
      <NSpin :show="loading">
        <template v-if="offering && form">
          <p class="hint">
            将当前生成的 input / output 添加为
            <span class="mono">{{ model }}</span> 的 Playground 示例。
          </p>
          <NForm label-placement="top">
            <NFormItem label="ID *">
              <NInput v-model:value="form.id" placeholder="如 cinematic-ocean" />
            </NFormItem>
            <LocaleTabs v-model:locale="exampleLocale">
              <NFormItem label="标题 *">
                <NInput v-model:value="form.title[exampleLocale]" />
              </NFormItem>
              <NFormItem label="说明">
                <NInput v-model:value="form.description[exampleLocale]" type="textarea" :rows="2" />
              </NFormItem>
            </LocaleTabs>
            <NFormItem label="Input 预设值 *">
              <JsonEditor v-model="form.inputJson" :height="200" />
            </NFormItem>
            <NFormItem label="输出 URL (result.output_url)">
              <NInput v-model:value="form.outputUrl" placeholder="来自 generation result.output_url" />
            </NFormItem>
            <NFormItem label="缩略图 URL (thumbnail_url)">
              <NInput v-model:value="form.thumbnailUrl" placeholder="可选" />
            </NFormItem>
            <NFormItem label="排序 (sort_order)">
              <NInputNumber v-model:value="form.sortOrder" :min="0" style="width: 100%" />
            </NFormItem>
          </NForm>
          <div class="actions">
            <NButton @click="emit('update:show', false)">取消</NButton>
            <NButton type="primary" :loading="saving" @click="save">保存示例</NButton>
          </div>
        </template>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.hint {
  color: #64748b;
  font-size: 13px;
  margin: 0 0 16px;
  line-height: 1.5;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
