<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  hint?: string
  warning?: boolean
  clickable?: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <div
    class="stat-card"
    :class="{ warning, clickable }"
    @click="clickable ? $emit('click') : undefined"
  >
    <div class="label">{{ title }}</div>
    <div class="value">{{ value }}</div>
    <div v-if="hint" class="hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}
.stat-card.warning {
  border-color: #f59e0b;
  background: #fffbeb;
}
.stat-card.clickable {
  cursor: pointer;
}
.label {
  font-size: 13px;
  color: #64748b;
}
.value {
  font-size: 28px;
  font-weight: 700;
  margin-top: 4px;
}
.hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}
</style>
