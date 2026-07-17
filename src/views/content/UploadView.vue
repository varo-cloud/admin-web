<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NTag,
  NUpload,
  useDialog,
  useMessage,
  type DataTableColumns,
  type UploadCustomRequestOptions,
} from 'naive-ui'
import { deleteAdminFile, uploadAdminFile } from '@/api/upload'
import type { AdminAssetUpload } from '@/types/admin'

interface UploadRecord extends AdminAssetUpload {
  uploadedAt: number
}

const message = useMessage()
const dialog = useDialog()
const prefix = ref('uploads')
const deletingKey = ref<string | null>(null)
const records = ref<UploadRecord[]>([])

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function isPreviewableVideo(type: string): boolean {
  return type.startsWith('video/')
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    message.success('链接已复制')
  } catch {
    message.error('复制失败')
  }
}

async function customUpload(options: UploadCustomRequestOptions) {
  const file = options.file.file
  if (!file) {
    options.onError()
    return
  }
  try {
    const result = await uploadAdminFile(file, { prefix: prefix.value })
    records.value.unshift({ ...result, uploadedAt: Date.now() })
    message.success(`「${result.filename}」上传成功`)
    options.onFinish()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '上传失败')
    options.onError()
  }
}

async function runDelete(key: string, filename?: string) {
  deletingKey.value = key
  try {
    await deleteAdminFile(key)
    records.value = records.value.filter((r) => r.key !== key)
    message.success(filename ? `已删除「${filename}」` : '已删除')
  } catch (e) {
    message.error(e instanceof Error ? e.message : '删除失败')
  } finally {
    deletingKey.value = null
  }
}

function confirmDelete(row: UploadRecord) {
  dialog.warning({
    title: '删除文件',
    content: `将从对象存储永久删除「${row.filename}」，删除后 URL 将失效。确认继续？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => runDelete(row.key, row.filename),
  })
}

const columns = computed<DataTableColumns<UploadRecord>>(() => [
  {
    title: '文件名',
    key: 'filename',
    minWidth: 160,
    ellipsis: { tooltip: true },
  },
  {
    title: '类型',
    key: 'contentType',
    width: 140,
    render: (row) => row.contentType || '—',
  },
  {
    title: '大小',
    key: 'sizeBytes',
    width: 100,
    render: (row) => formatBytes(row.sizeBytes),
  },
  {
    title: 'URL',
    key: 'url',
    minWidth: 240,
    ellipsis: { tooltip: true },
    render: (row) => h('span', { class: 'url-text' }, row.url),
  },
  {
    title: 'Key',
    key: 'key',
    minWidth: 200,
    ellipsis: { tooltip: true },
    render: (row) => h('span', { class: 'url-text' }, row.key),
  },
  {
    title: '预览',
    key: 'preview',
    width: 120,
    render: (row) => {
      if (isPreviewableVideo(row.contentType)) {
        return h('video', { src: row.url, class: 'thumb', controls: true, muted: true })
      }
      return h(NTag, { size: 'small', bordered: false }, { default: () => '—' })
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    fixed: 'right',
    render: (row) =>
      h('div', { class: 'action-cell' }, [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            quaternary: true,
            onClick: () => copyText(row.url),
          },
          { default: () => '拷贝链接' },
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            quaternary: true,
            loading: deletingKey.value === row.key,
            onClick: () => confirmDelete(row),
          },
          { default: () => '删除' },
        ),
      ]),
  },
])
</script>

<template>
  <div class="upload-page">
    <h1 class="page-title">文件上传</h1>
    <p class="page-desc">上传任意类型文件到对象存储，获取可在后台配置中引用的 URL；不再使用时可直接删除以节省存储。</p>

    <NCard title="上传记录">
      <NForm label-placement="top" style="margin-bottom: 16px">
        <NFormItem label="存储前缀（prefix）">
          <NInput
            v-model:value="prefix"
            placeholder="uploads"
            maxlength="64"
            style="max-width: 360px"
          />
          <template #feedback>仅允许字母、数字、/、_、-；用于区分业务目录，如 assets/hero</template>
        </NFormItem>

        <NFormItem label="选择文件">
          <NUpload :custom-request="customUpload" multiple>
            <NButton type="primary">选择并上传</NButton>
          </NUpload>
          <template #feedback>支持任意文件类型，单文件默认上限 50MB</template>
        </NFormItem>
      </NForm>

      <NDataTable
        v-if="records.length"
        :columns="columns"
        :data="records"
        :bordered="false"
        size="small"
        scroll-x="1200"
      />
      <p v-else class="empty-hint">暂无上传记录，上传后可在列表中拷贝链接或删除文件。</p>
    </NCard>
  </div>
</template>

<style scoped>
.upload-page {
  max-width: 1100px;
}
.page-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
}
.page-desc {
  margin: 0 0 20px;
  color: #64748b;
  font-size: 14px;
}
.empty-hint {
  margin: 0;
  padding: 24px 0 8px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}
.url-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-family: ui-monospace, monospace;
}
.action-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}
.thumb {
  max-width: 96px;
  max-height: 64px;
  border-radius: 4px;
  object-fit: cover;
}
</style>
