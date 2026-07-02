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
import {
  fetchAdminConfig,
  updateProcessingFee,
  validateProcessingFeeByProvider,
} from '@/api/config'
import type { AdminConfig, ProcessingFeeByProvider } from '@/types/admin'
import { formatUsd } from '@/utils/currency'

const message = useMessage()
const loading = ref(true)
const saving = ref(false)
const config = ref<AdminConfig | null>(null)
const form = ref<ProcessingFeeByProvider>({
  stripe: { percent: 0, fixedUsd: 0 },
  nowpayments: { percent: 0, fixedUsd: 0 },
})

function percentDisplay(fee: { percent: number }) {
  const pct = fee.percent * 100
  if (!Number.isFinite(pct)) return '—'
  return `${pct.toFixed(2)}%`
}

async function load() {
  loading.value = true
  try {
    const data = await fetchAdminConfig()
    config.value = data
    form.value = {
      stripe: { ...data.processingFee.stripe },
      nowpayments: { ...data.processingFee.nowpayments },
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function saveProcessingFee() {
  const error = validateProcessingFeeByProvider(form.value)
  if (error) {
    message.warning(error)
    return
  }

  saving.value = true
  try {
    const data = await updateProcessingFee(form.value)
    config.value = data
    form.value = {
      stripe: { ...data.processingFee.stripe },
      nowpayments: { ...data.processingFee.nowpayments },
    }
    message.success('支付手续费配置已保存')
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

const providerCards = computed(() => [
  {
    key: 'stripe' as const,
    title: 'Stripe（银行卡）',
    hint: '例如 percent=0.029、fixed_usd=0.3 表示 2.9% + $0.30',
  },
  {
    key: 'nowpayments' as const,
    title: 'NOWPayments（加密货币）',
    hint: '默认 0 表示按面额计价，不加 gross-up',
  },
])
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">系统配置</h1>
      <p class="page-desc">管理各支付渠道的充值手续费等全局参数</p>
    </div>

    <NSpin :show="loading">
      <template v-if="config">
        <NAlert type="info" :bordered="false" style="margin-bottom: 16px">
          <code>processing_fee</code> 按支付渠道分开配置。Stripe 与加密货币各自 gross-up，互不影响。
        </NAlert>

        <NCard
          v-for="card in providerCards"
          :key="card.key"
          :title="`支付手续费 · ${card.title}`"
          style="margin-bottom: 16px"
        >
          <p class="card-hint">{{ card.hint }}</p>
          <NForm label-placement="left" label-width="180">
            <NFormItem label="比例 percent">
              <div class="field-row">
                <NInputNumber
                  v-model:value="form[card.key].percent"
                  :min="0"
                  :max="0.999999"
                  :step="0.001"
                  :precision="6"
                  style="width: 200px"
                />
                <span class="field-hint">
                  当前约 {{ percentDisplay(form[card.key]) }}（须 0 ≤ percent &lt; 1）
                </span>
              </div>
            </NFormItem>
            <NFormItem label="固定费用 fixed_usd">
              <div class="field-row">
                <NInputNumber
                  v-model:value="form[card.key].fixedUsd"
                  :min="0"
                  :step="0.01"
                  :precision="2"
                  style="width: 200px"
                />
                <span class="field-hint">每笔 {{ formatUsd(form[card.key].fixedUsd) }}（须 ≥ 0）</span>
              </div>
            </NFormItem>
          </NForm>
        </NCard>

        <NButton type="primary" :loading="saving" style="margin-bottom: 16px" @click="saveProcessingFee">
          保存手续费配置
        </NButton>

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
.page-desc,
.card-hint {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 14px;
}
.card-hint {
  margin: 0 0 16px;
  font-size: 13px;
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
