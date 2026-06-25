<script setup lang="ts">
import { NTabPane, NTabs } from 'naive-ui'
import { CONTENT_LOCALES, LOCALE_TAB_LABELS, type ContentLocale } from '@/utils/locale'

const locale = defineModel<ContentLocale>('locale', { default: 'en-US' })
</script>

<template>
  <div class="locale-tabs">
    <NTabs v-model:value="locale" type="segment" size="small">
      <NTabPane
        v-for="loc in CONTENT_LOCALES"
        :key="loc"
        :name="loc"
        :tab="LOCALE_TAB_LABELS[loc]"
      />
    </NTabs>
    <div class="locale-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.locale-tabs {
  margin-bottom: 16px;
}
.locale-content {
  margin-top: 16px;
}
</style>
