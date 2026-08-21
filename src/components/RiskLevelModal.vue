<script setup lang="ts">
import { ref, watch } from 'vue'
import { NModal, NSelect, NInput, NForm, NFormItem } from 'naive-ui'
import type { RiskLevel } from '@/types/admin'

const props = defineProps<{
  show: boolean
  title?: string
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: [payload: { level: RiskLevel; note: string }]
}>()

const level = ref<RiskLevel>('high')
const note = ref('')

const levelOptions = [
  { label: '无风险', value: 'none' },
  { label: '低', value: 'low' },
  { label: '中', value: 'med' },
  { label: '高（拦截自动发奖）', value: 'high' },
]

watch(
  () => props.show,
  (v) => {
    if (v) {
      level.value = 'high'
      note.value = ''
    }
  },
)

function handleConfirm() {
  emit('confirm', { level: level.value, note: note.value.trim() })
}
</script>

<template>
  <NModal
    :show="show"
    preset="dialog"
    :title="title ?? '标记风险'"
    positive-text="确认"
    negative-text="取消"
    :positive-button-props="{ disabled: !note.trim() }"
    @update:show="(v) => emit('update:show', v)"
    @positive-click="handleConfirm"
  >
    <p class="hint">高风险会在开奖时拦截自动发奖。开奖后再标无效，已发额度请改用冻结 Bonus。</p>
    <NForm label-placement="top">
      <NFormItem label="风险等级">
        <NSelect v-model:value="level" :options="levelOptions" />
      </NFormItem>
      <NFormItem label="备注">
        <NInput v-model:value="note" type="textarea" placeholder="请填写原因（必填）" :rows="3" />
      </NFormItem>
    </NForm>
  </NModal>
</template>

<style scoped>
.hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #64748b;
}
</style>
