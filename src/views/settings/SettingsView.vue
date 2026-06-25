<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpin,
  useDialog,
  useMessage,
} from 'naive-ui'
import { fetchConfig, updateConfig } from '@/api/config'
import type { SystemConfig } from '@/types/admin'

const message = useMessage()
const dialog = useDialog()
const loading = ref(true)
const saving = ref(false)
const config = ref<SystemConfig | null>(null)
const secretInputs = ref<Record<string, string>>({})

async function load() {
  loading.value = true
  try {
    config.value = await fetchConfig()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function saveBilling() {
  if (!config.value) return
  saving.value = true
  try {
    await updateConfig({
      credits_per_usd: config.value.creditsPerUsd,
      signup_bonus_usd: config.value.signupBonusUsd,
      default_rate_limit_rpm: config.value.defaultRateLimitRpm,
      upload_max_size_mb: config.value.uploadMaxSizeMb,
    })
    message.success('配置已保存')
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function savePackages() {
  if (!config.value) return
  saving.value = true
  try {
    await updateConfig({
      credit_packages: config.value.creditPackages.map((p) => ({
        id: p.id,
        price_usd: p.priceUsd,
        credits: p.credits,
        stripe_price_id: p.stripePriceId,
      })),
    })
    message.success('套餐已保存')
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

function saveSecret(key: string) {
  const value = secretInputs.value[key]?.trim()
  if (!value) return message.warning('请输入新值')
  dialog.warning({
    title: '更新密钥',
    content: `确认更新 ${key}？`,
    positiveText: '确认',
    onPositiveClick: async () => {
      await updateConfig({ secrets: { [key]: value } })
      message.success('密钥已更新')
      secretInputs.value[key] = ''
      await load()
    },
  })
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">系统配置</h1>
    </div>

    <NSpin :show="loading">
      <template v-if="config">
        <NCard title="计费" style="margin-bottom: 16px">
          <NForm label-placement="left" label-width="160">
            <NFormItem label="credits_per_usd">
              <NInputNumber v-model:value="config.creditsPerUsd" />
            </NFormItem>
            <NFormItem label="注册体验金 USD">
              <NInputNumber v-model:value="config.signupBonusUsd" :step="0.01" />
            </NFormItem>
            <NFormItem label="default_rate_limit_rpm">
              <NInputNumber v-model:value="config.defaultRateLimitRpm" />
            </NFormItem>
            <NFormItem label="upload_max_size_mb">
              <NInputNumber v-model:value="config.uploadMaxSizeMb" />
            </NFormItem>
            <NButton type="primary" :loading="saving" @click="saveBilling">保存计费配置</NButton>
          </NForm>
        </NCard>

        <NCard title="套餐 credit_packages" style="margin-bottom: 16px">
          <div v-for="pkg in config.creditPackages" :key="pkg.id" class="pkg-row">
            <strong>{{ pkg.id }}</strong>
            <NInputNumber v-model:value="pkg.priceUsd" placeholder="price_usd" />
            <NInputNumber v-model:value="pkg.credits" placeholder="credits" />
            <NInput v-model:value="pkg.stripePriceId" placeholder="stripe_price_id" />
          </div>
          <NButton type="primary" :loading="saving" style="margin-top: 12px" @click="savePackages">
            保存套餐
          </NButton>
        </NCard>

        <NCard title="密钥">
          <div v-for="(meta, key) in config.secrets" :key="key" class="secret-row">
            <span>{{ key }}</span>
            <span :class="meta.configured ? 'ok' : 'no'">{{ meta.configured ? '已配置' : '未配置' }}</span>
            <NInput v-model:value="secretInputs[key]" placeholder="输入新值（不回显）" style="width: 240px" />
            <NButton size="small" @click="saveSecret(String(key))">更新</NButton>
          </div>
        </NCard>
      </template>
    </NSpin>
  </div>
</template>

<style scoped>
.pkg-row {
  display: grid;
  grid-template-columns: 100px 1fr 1fr 1fr;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.secret-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.ok {
  color: #16a34a;
}
.no {
  color: #94a3b8;
}
</style>
