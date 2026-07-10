<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  NButton,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import JsonEditor from '@/components/JsonEditor.vue'
import LocaleTabs from '@/components/LocaleTabs.vue'
import type { OfferingExample } from '@/types/admin'
import type { ContentLocale } from '@/types'
import { resolveLocalizedString } from '@/utils/locale'
import {
  emptyExampleForm,
  exampleToForm,
  formToExample,
  validateExampleForm,
  type OfferingExampleForm,
} from '@/utils/offeringExamples'

const props = defineProps<{
  modelValue: OfferingExample[]
  inputSchema?: Record<string, unknown> | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: OfferingExample[]] }>()

const message = useMessage()
const dialog = useDialog()
const drawerShow = ref(false)
const exampleLocale = ref<ContentLocale>('en-US')
const editingIndex = ref<number | null>(null)
const editingForm = ref<OfferingExampleForm | null>(null)

function emitExamples(next: OfferingExample[]) {
  emit('update:modelValue', next)
}

function openEditor(index?: number) {
  exampleLocale.value = 'en-US'
  if (index != null) {
    editingIndex.value = index
    editingForm.value = exampleToForm(props.modelValue[index]!)
  } else {
    editingIndex.value = null
    editingForm.value = emptyExampleForm(props.modelValue.length)
  }
  drawerShow.value = true
}

function saveExample() {
  if (!editingForm.value) return
  const existingIds = props.modelValue.map((e) => e.id)
  const editingId = editingIndex.value != null ? props.modelValue[editingIndex.value]?.id : undefined
  const err = validateExampleForm(editingForm.value, existingIds, editingId)
  if (err) return message.warning(err)

  let example: OfferingExample
  try {
    example = formToExample(editingForm.value)
  } catch {
    return message.error('input JSON 格式无效')
  }

  const next = [...props.modelValue]
  if (editingIndex.value != null) {
    next[editingIndex.value] = example
  } else {
    next.push(example)
  }
  emitExamples(next)
  drawerShow.value = false
  message.success(editingIndex.value != null ? '示例已更新' : '示例已添加')
}

function confirmDelete(index: number) {
  const ex = props.modelValue[index]
  dialog.warning({
    title: '删除示例',
    content: `确认删除示例「${ex?.id}」？`,
    positiveText: '删除',
    onPositiveClick: () => {
      const next = props.modelValue.filter((_, i) => i !== index)
      emitExamples(next)
      message.success('已删除')
    },
  })
}

function moveExample(index: number, delta: number) {
  const next = [...props.modelValue]
  const target = index + delta
  if (target < 0 || target >= next.length) return
  ;[next[index], next[target]] = [next[target]!, next[index]!]
  next.forEach((ex, i) => {
    ex.sortOrder = i
  })
  emitExamples(next)
}

const columns: DataTableColumns<OfferingExample & { _index: number }> = [
  { title: 'ID', key: 'id', width: 140 },
  {
    title: '标题',
    key: 'title',
    ellipsis: { tooltip: true },
    render: (r) => resolveLocalizedString({ 'en-US': r.title, 'zh-CN': r.titleI18n?.['zh-CN'] ?? '' }),
  },
  {
    title: '输出预览',
    key: 'outputUrl',
    width: 80,
    render: (r) => (r.outputUrl ? '有' : '—'),
  },
  { title: '排序', key: 'sortOrder', width: 60, render: (r) => r.sortOrder ?? '—' },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (r) => {
      const idx = r._index
      return h('div', { style: 'display:flex;gap:4px;flex-wrap:wrap' }, [
        h(NButton, { size: 'tiny', onClick: () => openEditor(idx) }, () => '编辑'),
        h(
          NButton,
          { size: 'tiny', disabled: idx === 0, onClick: () => moveExample(idx, -1) },
          () => '上移',
        ),
        h(
          NButton,
          {
            size: 'tiny',
            disabled: idx === props.modelValue.length - 1,
            onClick: () => moveExample(idx, 1),
          },
          () => '下移',
        ),
        h(NButton, { size: 'tiny', type: 'error', onClick: () => confirmDelete(idx) }, () => '删除'),
      ])
    },
  },
]

const tableData = computed(() =>
  props.modelValue.map((ex, index) => ({ ...ex, _index: index })),
)
</script>

<template>
  <div class="offering-examples-editor">
    <div class="header">
      <div>
        <div class="label">Playground 示例 (Examples)</div>
        <div class="hint">
          一键加载的表单预设值与输出预览。input 的 key 须与 Input Schema 字段名一致。
        </div>
      </div>
      <NButton size="small" type="primary" @click="openEditor()">添加示例</NButton>
    </div>

    <NDataTable
      v-if="modelValue.length > 0"
      size="small"
      :columns="columns"
      :data="tableData"
      :scroll-x="640"
    />
    <div v-else class="empty">暂无示例，Playground 画廊将为空</div>

    <NDrawer v-model:show="drawerShow" :width="600" placement="right">
      <NDrawerContent
        :title="editingIndex != null ? '编辑示例' : '添加示例'"
        closable
      >
        <NForm v-if="editingForm" label-placement="top">
          <NFormItem label="ID *">
            <NInput
              v-model:value="editingForm.id"
              :disabled="editingIndex != null"
              placeholder="如 cinematic-ocean"
            />
          </NFormItem>
          <LocaleTabs v-model:locale="exampleLocale">
            <NFormItem label="标题 *">
              <NInput v-model:value="editingForm.title[exampleLocale]" />
            </NFormItem>
            <NFormItem label="说明">
              <NInput v-model:value="editingForm.description[exampleLocale]" type="textarea" :rows="2" />
            </NFormItem>
          </LocaleTabs>
          <NFormItem label="Input 预设值 *">
            <JsonEditor v-model="editingForm.inputJson" />
            <div v-if="inputSchema?.properties" class="field-hint">
              Schema 字段：
              {{ Object.keys(inputSchema.properties as Record<string, unknown>).join(', ') }}
            </div>
          </NFormItem>
          <NFormItem label="输出 URL (output_url)">
            <NInput v-model:value="editingForm.outputUrl" placeholder="https://cdn.genflow.ai/examples/..." />
          </NFormItem>
          <NFormItem label="缩略图 URL (thumbnail_url)">
            <NInput v-model:value="editingForm.thumbnailUrl" placeholder="留空则由前端从 output_url 处理" />
          </NFormItem>
          <NFormItem label="排序 (sort_order)">
            <NInputNumber v-model:value="editingForm.sortOrder" :min="0" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NButton @click="drawerShow = false">取消</NButton>
          <NButton type="primary" style="margin-left: 8px" @click="saveExample">确定</NButton>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
.offering-examples-editor {
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.label {
  font-weight: 500;
  margin-bottom: 4px;
}

.hint,
.field-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.empty {
  padding: 16px;
  text-align: center;
  color: #9ca3af;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}
</style>
