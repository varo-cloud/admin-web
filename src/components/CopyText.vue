<script setup lang="ts">
import { useMessage } from 'naive-ui'

const props = defineProps<{ text: string; label?: string }>()
const message = useMessage()

async function copy() {
  await navigator.clipboard.writeText(props.text)
  message.success('已复制')
}
</script>

<template>
  <span class="copy-text">
    <span class="mono">{{ text }}</span>
    <button type="button" class="copy-btn" @click="copy">复制</button>
  </span>
</template>

<style scoped>
.copy-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.copy-btn {
  border: none;
  background: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 12px;
}
</style>
