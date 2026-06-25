<script setup lang="ts">
import { ref, watch } from 'vue'
import { NInput, NButton, NSpace, useMessage } from 'naive-ui'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const message = useMessage()
const local = ref(props.modelValue)

watch(
  () => props.modelValue,
  (v) => {
    local.value = v
  },
)

watch(local, (v) => emit('update:modelValue', v))

function formatJson() {
  try {
    const parsed = JSON.parse(local.value || '{}')
    local.value = JSON.stringify(parsed, null, 2)
  } catch {
    message.error('JSON 格式无效')
  }
}
</script>

<template>
  <div>
    <NSpace style="margin-bottom: 8px">
      <NButton size="small" @click="formatJson">Format JSON</NButton>
    </NSpace>
    <NInput v-model:value="local" type="textarea" :rows="16" class="mono" />
  </div>
</template>
