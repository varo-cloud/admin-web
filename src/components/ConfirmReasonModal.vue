<script setup lang="ts">
import { ref, watch } from 'vue'
import { NModal, NInput } from 'naive-ui'

const props = defineProps<{
  show: boolean
  title: string
  confirmText?: string
  minReasonLength?: number
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: [reason: string]
}>()

const reason = ref('')

watch(
  () => props.show,
  (v) => {
    if (v) reason.value = ''
  },
)

function handleConfirm() {
  emit('confirm', reason.value.trim())
}

const canSubmit = () => reason.value.trim().length >= (props.minReasonLength ?? 5)
</script>

<template>
  <NModal
    :show="show"
    preset="dialog"
    :title="title"
    :positive-text="confirmText ?? '确认'"
    negative-text="取消"
    :positive-button-props="{ disabled: !canSubmit() }"
    @update:show="(v) => emit('update:show', v)"
    @positive-click="handleConfirm"
  >
    <NInput
      v-model:value="reason"
      type="textarea"
      placeholder="请填写原因（必填）"
      :rows="3"
    />
  </NModal>
</template>
