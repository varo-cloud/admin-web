<script setup lang="ts">
import { ref, watch } from 'vue'
import { NModal, NInput } from 'naive-ui'

const props = defineProps<{
  show: boolean
  email: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: [reason: string | undefined]
}>()

const reason = ref('')

watch(
  () => props.show,
  (v) => {
    if (v) reason.value = ''
  },
)

function handleConfirm() {
  emit('confirm', reason.value.trim() || undefined)
  return false
}
</script>

<template>
  <NModal
    :show="show"
    preset="dialog"
    type="error"
    title="删除用户"
    positive-text="永久删除"
    negative-text="取消"
    :positive-button-props="{ type: 'error', loading: Boolean(loading), disabled: loading }"
    :closable="!loading"
    :mask-closable="!loading"
    @update:show="(v) => emit('update:show', v)"
    @positive-click="handleConfirm"
  >
    <p class="warn">
      确认永久删除 <strong>{{ email }}</strong> ？此操作不可恢复。
    </p>
    <ul class="hint-list">
      <li>将删除账户、登录凭证、余额账本、生成记录、模型偏好，以及该用户的活动种子与邀请。</li>
      <li>审计日志与 S3 上的生成产物会保留；其他用户的记录不会被连带删除。</li>
    </ul>
    <NInput
      v-model:value="reason"
      type="textarea"
      placeholder="删除原因（可选，写入审计日志）"
      :rows="3"
    />
  </NModal>
</template>

<style scoped>
.warn {
  margin: 0 0 8px;
}
.hint-list {
  margin: 0 0 12px;
  padding-left: 18px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}
</style>
