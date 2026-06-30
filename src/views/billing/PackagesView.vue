<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import {
  NButton,
  NCard,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NSpin,
  NTag,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import LocaleTabs from '@/components/LocaleTabs.vue'
import { fetchTransactions } from '@/api/billing'
import {
  billingPackageToPayload,
  createBillingPackage,
  deleteBillingPackage,
  fetchBillingPackages,
  reorderBillingPackages,
  updateBillingPackage,
  updateBillingPackageStatus,
} from '@/api/billing-packages'
import type { BillingPackage } from '@/types/admin'
import type { ContentLocale } from '@/types'
import { formatUsd } from '@/utils/currency'
import { emptyLocalizedString, normalizeLocalizedString, resolveLocalizedString } from '@/utils/locale'

const PACKAGE_ID_PATTERN = /^[a-z][a-z0-9_-]{0,31}$/

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const saving = ref(false)
const reordering = ref(false)
const drawerShow = ref(false)
const locale = ref<ContentLocale>('en-US')
const packages = ref<BillingPackage[]>([])
const orderDirty = ref(false)
const pendingPresetIds = ref<Set<string>>(new Set())
const editing = ref<Partial<BillingPackage> & { isNew?: boolean } | null>(null)

function defaultPackage(): Partial<BillingPackage> & { isNew: boolean } {
  return {
    isNew: true,
    id: '',
    priceUsd: 10,
    label: emptyLocalizedString(),
    sortOrder: packages.value.length,
    active: true,
  }
}

async function loadPendingPresets() {
  try {
    const res = await fetchTransactions({ status: 'pending', limit: 100 })
    pendingPresetIds.value = new Set(res.items.map((t) => t.packageId).filter(Boolean))
  } catch {
    pendingPresetIds.value = new Set()
  }
}

async function load() {
  loading.value = true
  try {
    const [data] = await Promise.all([fetchBillingPackages(), loadPendingPresets()])
    packages.value = data
    orderDirty.value = false
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function packageLabel(row: BillingPackage) {
  return resolveLocalizedString(row.label) || row.id
}

function openEditor(row?: BillingPackage) {
  locale.value = 'en-US'
  editing.value = row
    ? {
        ...row,
        label: normalizeLocalizedString(row.label ?? emptyLocalizedString()),
        isNew: false,
      }
    : defaultPackage()
  drawerShow.value = true
}

async function savePackage() {
  if (!editing.value) return
  if (editing.value.isNew) {
    const id = editing.value.id?.trim()
    if (!id) return message.warning('请填写档位 ID')
    if (!PACKAGE_ID_PATTERN.test(id)) {
      return message.warning('ID 须为小写字母开头，仅含 a-z、0-9、_、-，最长 32 字符')
    }
  }
  const priceUsd = editing.value.priceUsd
  if (priceUsd == null || priceUsd < 0.01 || priceUsd > 10000) {
    return message.warning('金额须在 $0.01 ~ $10,000 之间')
  }
  if (!editing.value.label?.['en-US']?.trim()) {
    locale.value = 'en-US'
    return message.warning('请填写展示名称英文 (en-US)')
  }

  saving.value = true
  try {
    const payload = billingPackageToPayload(editing.value)
    if (editing.value.isNew) {
      await createBillingPackage(payload)
      message.success('档位已创建')
    } else {
      await updateBillingPackage(editing.value.id!, payload)
      message.success('档位已更新')
    }
    drawerShow.value = false
    await load()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

function movePackage(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= packages.value.length) return
  const next = [...packages.value]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item!)
  packages.value = next
  orderDirty.value = true
}

async function saveOrder() {
  reordering.value = true
  try {
    packages.value = await reorderBillingPackages(packages.value.map((p) => p.id))
    orderDirty.value = false
    message.success('排序已保存')
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存排序失败')
  } finally {
    reordering.value = false
  }
}

function toggleStatus(row: BillingPackage, active: boolean) {
  const action = active ? '启用' : '停用'
  const run = async () => {
    try {
      await updateBillingPackageStatus(row.id, active)
      message.success(`${action}成功`)
      await load()
    } catch (e) {
      message.error(e instanceof Error ? e.message : `${action}失败`)
    }
  }
  if (active) {
    void run()
    return
  }
  dialog.warning({
    title: '停用档位',
    content: '停用后该档位不会出现在用户端充值选项中，确认继续？',
    positiveText: '确认',
    onPositiveClick: run,
  })
}

function removePackage(row: BillingPackage) {
  dialog.warning({
    title: '删除档位',
    content: `确认删除档位「${row.id}」？`,
    positiveText: '删除',
    onPositiveClick: async () => {
      try {
        await deleteBillingPackage(row.id)
        message.success('已删除')
        await load()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '删除失败')
      }
    },
  })
}

const columns: DataTableColumns<BillingPackage> = [
  {
    title: '排序',
    key: 'sort',
    width: 90,
    render: (_row, index) =>
      h('div', { style: 'display:flex;gap:4px' }, [
        h(NButton, { size: 'tiny', disabled: index === 0, onClick: () => movePackage(index, -1) }, () => '↑'),
        h(
          NButton,
          { size: 'tiny', disabled: index === packages.value.length - 1, onClick: () => movePackage(index, 1) },
          () => '↓',
        ),
      ]),
  },
  {
    title: 'ID',
    key: 'id',
    width: 120,
  },
  {
    title: '金额 USD',
    key: 'priceUsd',
    width: 120,
    render: (r) => formatUsd(r.priceUsd),
  },
  {
    title: '展示名称',
    key: 'label',
    render: (r) => packageLabel(r),
  },
  {
    title: '状态',
    key: 'active',
    width: 90,
    render: (r) => h(NTag, { type: r.active ? 'success' : 'default', size: 'small' }, () => (r.active ? '启用' : '停用')),
  },
  {
    title: '操作',
    key: 'actions',
    render: (r) => {
      const hasPending = pendingPresetIds.value.has(r.id)
      return h('div', { style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap' }, [
        h(NButton, { size: 'small', onClick: () => openEditor(r) }, () => '编辑'),
        h(NSwitch, { value: r.active, size: 'small', onUpdateValue: (v: boolean) => toggleStatus(r, v) }),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            disabled: hasPending,
            title: hasPending ? '存在 pending 充值订单，无法删除' : undefined,
            onClick: () => removePackage(r),
          },
          () => '删除',
        ),
      ])
    },
  },
]

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">充值预设档位</h1>
    </div>

    <NSpin :show="loading">
      <NCard>
        <p class="hint">
          管理用户端 Billing 页快捷充值金额，启用后通过公开接口 <code>GET /api/billing/packages</code> 下发。
        </p>
        <div class="toolbar">
          <NButton type="primary" @click="openEditor()">新增档位</NButton>
          <NButton :disabled="!orderDirty" :loading="reordering" @click="saveOrder">保存排序</NButton>
        </div>
        <NDataTable :columns="columns" :data="packages" />
      </NCard>
    </NSpin>

    <NDrawer v-model:show="drawerShow" :width="480">
      <NDrawerContent :title="editing?.isNew ? '新增档位' : `编辑档位 · ${editing?.id}`">
        <NForm v-if="editing" label-placement="top">
          <NFormItem label="ID">
            <NInput
              v-model:value="editing.id"
              :disabled="!editing.isNew"
              placeholder="如 starter、pro"
            />
          </NFormItem>
          <NFormItem label="金额 USD">
            <NInputNumber
              v-model:value="editing.priceUsd"
              :min="0.01"
              :max="10000"
              :precision="2"
              :step="1"
              style="width: 100%"
            />
          </NFormItem>
          <LocaleTabs v-model:locale="locale">
            <NFormItem :label="locale === 'en-US' ? '展示名称 *' : '展示名称'">
              <NInput v-model:value="editing.label![locale]" />
            </NFormItem>
          </LocaleTabs>
          <NFormItem label="启用">
            <NSwitch v-model:value="editing.active" />
          </NFormItem>
          <NButton type="primary" :loading="saving" @click="savePackage">保存</NButton>
        </NForm>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
.hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: #64748b;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
