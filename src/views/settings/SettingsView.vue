<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInputNumber,
  NSpin,
  useMessage,
} from 'naive-ui'
import { fetchAdminConfig, updateProcessingFee, validateProcessingFee } from '@/api/config'
import type { AdminConfig, ProcessingFee } from '@/types/admin'
import { formatUsd } from '@/utils/currency'

const message = useMessage()
const loading = ref(true)
const saving = ref(false)
const config = ref<AdminConfig | null>(null)
const form = ref<ProcessingFee>({ percent: 0, fixedUsd: 0 })

const percentDisplay = computed(() => {
  const pct = form.value.percent * 100
  if (!Number.isFinite(pct)) return '—'
  return `${pct.toFixed(2)}%`
})

async function load() {
  loading.value = true
  try {
    const data = await fetchAdminConfig()
    config.value = data
    form.value = { ...data.processingFee }
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function saveProcessingFee() {
  const error = validateProcessingFee(form.value)
  if (error) {
    message.warning(error)
    return
  }

  saving.value = true
  try {
    const data = await updateProcessingFee(form.value)
    config.value = data
    form.value = { ...data.processingFee }
    message.success('支付手续费配置已保存')
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">系统配置</h1>
      <p class="page-desc">管理充值支付手续费等全局参数</p>
    </div>

    <NSpin :show="loading">
      <template v-if="config">
        <NCard title="支付手续费 processing_fee" style="margin-bottom: 16px">
          <NAlert type="info" :bordered="false" style="margin-bottom: 16px">
            充值订单在 Stripe 等渠道产生的额外手续费由 <code>percent</code>（比例）与
            <code>fixed_usd</code>（每笔固定美元）共同决定。例如 percent=0.029、fixed_usd=0.3
            表示 2.9% + $0.30。
          </NAlert>

          <NForm label-placement="left" label-width="180">
            <NFormItem label="比例 percent">
              <div class="field-row">
                <NInputNumber
                  v-model:value="form.percent"
                  :min="0"
                  :max="0.999999"
                  :step="0.001"
                  :precision="6"
                  style="width: 200px"
                />
                <span class="field-hint">当前约 {{ percentDisplay }}（须 0 ≤ percent &lt; 1）</span>
              </div>
            </NFormItem>
            <NFormItem label="固定费用 fixed_usd">
              <div class="field-row">
                <NInputNumber
                  v-model:value="form.fixedUsd"
                  :min="0"
                  :step="0.01"
                  :precision="2"
                  style="width: 200px"
                />
                <span class="field-hint">每笔 {{ formatUsd(form.fixedUsd) }}（须 ≥ 0）</span>
              </div>
            </NFormItem>
            <NButton type="primary" :loading="saving" @click="saveProcessingFee">保存手续费配置</NButton>
          </NForm>
        </NCard>

        <NCard title="只读参数">
          <NForm label-placement="left" label-width="180">
            <NFormItem label="credits_per_usd">
              <div class="field-row">
                <NInputNumber :value="config.creditsPerUsd" disabled style="width: 200px" />
                <span class="field-hint">$1 兑换 credits 数，由系统固定为 100，不可通过 Admin 修改</span>
              </div>
            </NFormItem>
          </NForm>
        </NCard>
      </template>
    </NSpin>
  </div>
</template>

<style scoped>
.page-desc {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 14px;
}
.field-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.field-hint {
  color: #64748b;
  font-size: 13px;
}
code {
  font-size: 12px;
  background: #f1f5f9;
  padding: 1px 4px;
  border-radius: 4px;
}
</style>
