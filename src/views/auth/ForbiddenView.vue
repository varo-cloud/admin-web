<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NAlert, NButton, NCard, NSpace } from 'naive-ui'
import { mainSiteAuthUrl, mainSiteHomeUrl } from '@/utils/mainSite'

const route = useRoute()

const reason = computed(() => String(route.query.reason ?? 'forbidden'))
const isUnauthenticated = computed(() => reason.value === 'unauthenticated')

const title = computed(() => (isUnauthenticated.value ? '请先登录' : '无权限访问'))
const description = computed(() =>
  isUnauthenticated.value
    ? '管理后台与主站共享登录态，请先在主站完成登录后再访问。'
    : '当前账号不是管理员，无法访问管理后台。',
)

const redirectPath = computed(() => {
  const value = route.query.redirect
  return typeof value === 'string' && value ? value : undefined
})

const isMockDev = computed(
  () => import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false',
)
</script>

<template>
  <div class="forbidden-page">
    <NCard class="forbidden-card" :title="title">
      <NSpace vertical :size="16">
        <NAlert :type="isUnauthenticated ? 'warning' : 'error'" :show-icon="false">
          {{ description }}
        </NAlert>
        <NAlert v-if="isMockDev && isUnauthenticated" type="info" :show-icon="false">
          当前为 Mock 开发模式，无需主站登录。请刷新页面；若仍失败，清除浏览器 localStorage 中的
          auth_token 后重试。
        </NAlert>
        <NSpace>
          <NButton v-if="isUnauthenticated && !isMockDev" type="primary" tag="a" :href="mainSiteAuthUrl(redirectPath)">
            前往登录
          </NButton>
          <NButton tag="a" :href="mainSiteHomeUrl()">返回主站</NButton>
        </NSpace>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped>
.forbidden-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f8fafc;
}
.forbidden-card {
  width: 100%;
  max-width: 440px;
}
</style>
