<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import {
  NButton,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpin,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { createPricingItem, deletePricingItem, fetchPricingItems, updatePricingItem } from '@/api/pricing'
import { formatUsd, formatPriceUnit } from '@/utils/currency'
import type { PricingItem } from '@/types/admin'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const items = ref<PricingItem[]>([])
const drawerShow = ref(false)
const editing = ref<Partial<PricingItem> | null>(null)
const saving = ref(false)

async function load() {
  loading.value = true
  try {
    items.value = await fetchPricingItems()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function openEdit(row?: PricingItem) {
  editing.value = row ? { ...row } : { id: '', modelId: '', name: '', standardPriceUsd: 0, startingPriceUsd: 0, priceUnit: 'per_second', discountPercent: 0, category: '', mediaType: 'video', sortOrder: 100 }
  drawerShow.value = true
}

async function save() {
  if (!editing.value?.id || !editing.value.name) return message.warning('请填写 ID 和名称')
  saving.value = true
  try {
    const payload = {
      id: editing.value.id,
      model_id: editing.value.modelId,
      name: editing.value.name,
      standard_price_usd: editing.value.standardPriceUsd,
      starting_price_usd: editing.value.startingPriceUsd,
      price_unit: editing.value.priceUnit,
      discount_percent: editing.value.discountPercent,
      category: editing.value.category,
      media_type: editing.value.mediaType,
      sort_order: editing.value.sortOrder,
    }
    const exists = items.value.some((i) => i.id === editing.value!.id)
    if (exists) await updatePricingItem(editing.value.id, payload)
    else await createPricingItem(payload)
    message.success('保存成功')
    drawerShow.value = false
    await load()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

function remove(row: PricingItem) {
  dialog.warning({
    title: '删除定价条目',
    content: `确认删除 ${row.name}？`,
    positiveText: '删除',
    onPositiveClick: async () => {
      await deletePricingItem(row.id)
      message.success('已删除')
      await load()
    },
  })
}

const columns: DataTableColumns<PricingItem> = [
  { title: '名称', key: 'name' },
  { title: '关联模型', key: 'modelId' },
  {
    title: '标准价 / 起价',
    key: 'price',
    render: (r) => `${formatUsd(r.standardPriceUsd)} / ${formatUsd(r.startingPriceUsd)}${formatPriceUnit(r.priceUnit)}`,
  },
  { title: '折扣', key: 'discountPercent', render: (r) => `${r.discountPercent}%` },
  { title: '排序', key: 'sortOrder' },
  {
    title: '操作',
    key: 'actions',
    render: (r) =>
      h('div', { style: 'display:flex;gap:8px' }, [
        h(NButton, { size: 'small', onClick: () => openEdit(r) }, () => '编辑'),
        h(NButton, { size: 'small', type: 'error', onClick: () => remove(r) }, () => '删除'),
      ]),
  },
]

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">定价目录</h1>
      <NButton type="primary" @click="openEdit()">新建</NButton>
    </div>
    <NSpin :show="loading">
      <NDataTable :columns="columns" :data="items" />
    </NSpin>

    <NDrawer v-model:show="drawerShow" :width="400">
      <NDrawerContent title="编辑定价">
        <NForm v-if="editing" label-placement="top">
          <NFormItem label="ID"><NInput v-model:value="editing.id" /></NFormItem>
          <NFormItem label="名称"><NInput v-model:value="editing.name" /></NFormItem>
          <NFormItem label="model_id"><NInput v-model:value="editing.modelId" /></NFormItem>
          <NFormItem label="标准价"><NInputNumber v-model:value="editing.standardPriceUsd" :step="0.001" /></NFormItem>
          <NFormItem label="起价"><NInputNumber v-model:value="editing.startingPriceUsd" :step="0.001" /></NFormItem>
          <NFormItem label="折扣 %"><NInputNumber v-model:value="editing.discountPercent" /></NFormItem>
          <NFormItem label="排序"><NInputNumber v-model:value="editing.sortOrder" /></NFormItem>
          <NButton type="primary" block :loading="saving" @click="save">保存</NButton>
        </NForm>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
