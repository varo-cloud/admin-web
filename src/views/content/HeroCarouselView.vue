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
  NUpload,
  useDialog,
  useMessage,
  type DataTableColumns,
  type UploadFileInfo,
} from 'naive-ui'
import LocaleTabs from '@/components/LocaleTabs.vue'
import {
  createHeroSlide,
  deleteHeroSlide,
  fetchHeroCarousel,
  heroCarouselSettingsToPayload,
  heroSlideToPayload,
  reorderHeroSlides,
  updateHeroCarousel,
  updateHeroSlide,
  updateHeroSlideStatus,
  uploadHeroAsset,
} from '@/api/hero-carousel'
import type { HeroCarouselConfig, HeroCarouselSlide } from '@/types/admin'
import type { ContentLocale } from '@/types'
import { emptyLocalizedString, normalizeLocalizedString, resolveLocalizedString } from '@/utils/locale'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const savingSettings = ref(false)
const savingSlide = ref(false)
const reordering = ref(false)
const drawerShow = ref(false)
const settingsLocale = ref<ContentLocale>('en-US')
const slideLocale = ref<ContentLocale>('en-US')
const config = ref<HeroCarouselConfig | null>(null)
const slides = ref<HeroCarouselSlide[]>([])
const orderDirty = ref(false)
const editingSlide = ref<Partial<HeroCarouselSlide> & { isNew?: boolean } | null>(null)
const uploadingVideo = ref(false)
const uploadingPoster = ref(false)

const settingsForm = ref({
  slideDurationMs: 5000,
  autoplayEnabled: true,
  muted: true,
  defaultTitle: emptyLocalizedString(),
  defaultSubtitle: emptyLocalizedString(),
})

function defaultSlide(): Partial<HeroCarouselSlide> & { isNew: boolean } {
  return {
    isNew: true,
    id: '',
    sortOrder: slides.value.length,
    active: true,
    videoUrl: '',
    posterUrl: '',
    title: emptyLocalizedString(),
    subtitle: emptyLocalizedString(),
  }
}

async function load() {
  loading.value = true
  try {
    const data = await fetchHeroCarousel()
    config.value = data
    slides.value = [...data.slides]
    orderDirty.value = false
    settingsForm.value = {
      slideDurationMs: data.slideDurationMs,
      autoplayEnabled: data.autoplayEnabled,
      muted: data.muted,
      defaultTitle: normalizeLocalizedString(data.defaultTitle),
      defaultSubtitle: normalizeLocalizedString(data.defaultSubtitle),
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  if (!settingsForm.value.defaultTitle['en-US']?.trim()) {
    settingsLocale.value = 'en-US'
    return message.warning('请填写默认 Slogan 英文 (en-US)')
  }
  savingSettings.value = true
  try {
    await updateHeroCarousel(heroCarouselSettingsToPayload(settingsForm.value))
    message.success('全局设置已保存')
    await load()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    savingSettings.value = false
  }
}

function openSlideEditor(row?: HeroCarouselSlide) {
  slideLocale.value = 'en-US'
  editingSlide.value = row
    ? {
        ...row,
        title: normalizeLocalizedString(row.title ?? emptyLocalizedString()),
        subtitle: normalizeLocalizedString(row.subtitle ?? emptyLocalizedString()),
        isNew: false,
      }
    : defaultSlide()
  drawerShow.value = true
}

async function saveSlide() {
  if (!editingSlide.value) return
  if (!editingSlide.value.videoUrl?.trim()) return message.warning('请填写或上传视频 URL')
  if (!editingSlide.value.posterUrl?.trim()) return message.warning('请填写或上传缩略图 URL')

  savingSlide.value = true
  try {
    const payload = heroSlideToPayload(editingSlide.value)
    if (editingSlide.value.isNew) {
      if (editingSlide.value.id?.trim()) payload.id = editingSlide.value.id.trim()
      await createHeroSlide(payload)
      message.success('Slide 已创建')
    } else {
      await updateHeroSlide(editingSlide.value.id!, payload)
      message.success('Slide 已更新')
    }
    drawerShow.value = false
    await load()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    savingSlide.value = false
  }
}

function moveSlide(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= slides.value.length) return
  const next = [...slides.value]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item!)
  slides.value = next
  orderDirty.value = true
}

async function saveOrder() {
  reordering.value = true
  try {
    const data = await reorderHeroSlides(slides.value.map((s) => s.id))
    slides.value = data.slides
    orderDirty.value = false
    message.success('排序已保存')
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存排序失败')
  } finally {
    reordering.value = false
  }
}

function toggleSlideStatus(row: HeroCarouselSlide, active: boolean) {
  const action = active ? '启用' : '停用'
  const run = async () => {
    await updateHeroSlideStatus(row.id, active)
    message.success(`${action}成功`)
    await load()
  }
  if (active) {
    void run()
    return
  }
  dialog.warning({
    title: '停用 Slide',
    content: '停用后该 slide 不会出现在用户端轮播中，确认继续？',
    positiveText: '确认',
    onPositiveClick: run,
  })
}

function removeSlide(row: HeroCarouselSlide) {
  dialog.warning({
    title: '删除 Slide',
    content: '将删除该 slide 记录，不会自动删除 CDN 上的媒体文件。确认删除？',
    positiveText: '删除',
    onPositiveClick: async () => {
      await deleteHeroSlide(row.id)
      message.success('已删除')
      await load()
    },
  })
}

async function handleUpload(kind: 'video' | 'poster', options: { file: UploadFileInfo }) {
  const file = options.file.file
  if (!file || !editingSlide.value) return
  const uploading = kind === 'video' ? uploadingVideo : uploadingPoster
  uploading.value = true
  try {
    const result = await uploadHeroAsset(file, kind)
    if (kind === 'video') editingSlide.value.videoUrl = result.url
    else editingSlide.value.posterUrl = result.url
    message.success('上传成功')
  } catch (e) {
    message.error(e instanceof Error ? e.message : '上传失败')
  } finally {
    uploading.value = false
  }
}

function slideSlogan(row: HeroCarouselSlide) {
  const text = resolveLocalizedString(row.title)
  return text || '（使用全局默认）'
}

const columns: DataTableColumns<HeroCarouselSlide> = [
  {
    title: '排序',
    key: 'sort',
    width: 90,
    render: (_row, index) =>
      h('div', { style: 'display:flex;gap:4px' }, [
        h(NButton, { size: 'tiny', disabled: index === 0, onClick: () => moveSlide(index, -1) }, () => '↑'),
        h(NButton, { size: 'tiny', disabled: index === slides.value.length - 1, onClick: () => moveSlide(index, 1) }, () => '↓'),
      ]),
  },
  {
    title: '缩略图',
    key: 'posterUrl',
    width: 120,
    render: (r) =>
      r.posterUrl
        ? h('img', { src: r.posterUrl, alt: r.id, style: 'width:96px;height:54px;object-fit:cover;border-radius:4px' })
        : '—',
  },
  {
    title: '视频',
    key: 'videoUrl',
    render: (r) => (r.videoUrl ? '已上传' : '—'),
  },
  {
    title: 'Slogan',
    key: 'title',
    render: (r) => slideSlogan(r),
  },
  {
    title: '状态',
    key: 'active',
    render: (r) => h(NTag, { type: r.active ? 'success' : 'default', size: 'small' }, () => (r.active ? '启用' : '停用')),
  },
  {
    title: '操作',
    key: 'actions',
    render: (r) =>
      h('div', { style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap' }, [
        h(NButton, { size: 'small', onClick: () => openSlideEditor(r) }, () => '编辑'),
        h(NSwitch, { value: r.active, size: 'small', onUpdateValue: (v: boolean) => toggleSlideStatus(r, v) }),
        h(NButton, { size: 'small', type: 'error', onClick: () => removeSlide(r) }, () => '删除'),
      ]),
  },
]

onMounted(load)
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">首页 Hero 轮播</h1>
    </div>

    <NSpin :show="loading">
      <NCard title="全局设置" style="margin-bottom: 16px">
        <NForm label-placement="top" style="max-width: 720px">
          <div class="settings-row">
            <NFormItem label="轮播间隔 (ms)">
              <NInputNumber v-model:value="settingsForm.slideDurationMs" :min="3000" :max="30000" :step="500" />
            </NFormItem>
            <NFormItem label="自动轮播">
              <NSwitch v-model:value="settingsForm.autoplayEnabled" />
            </NFormItem>
            <NFormItem label="静音">
              <NSwitch v-model:value="settingsForm.muted" />
            </NFormItem>
          </div>
          <LocaleTabs v-model:locale="settingsLocale">
            <NFormItem :label="settingsLocale === 'en-US' ? '默认 Slogan *' : '默认 Slogan'">
              <NInput v-model:value="settingsForm.defaultTitle![settingsLocale]" />
            </NFormItem>
            <NFormItem label="默认副标题">
              <textarea
                v-model="settingsForm.defaultSubtitle![settingsLocale]"
                class="textarea"
                rows="3"
              />
            </NFormItem>
          </LocaleTabs>
          <NButton type="primary" :loading="savingSettings" @click="saveSettings">保存全局设置</NButton>
        </NForm>
      </NCard>

      <NCard title="Slides">
        <div class="slide-toolbar">
          <NButton type="primary" @click="openSlideEditor()">新增 Slide</NButton>
          <NButton :disabled="!orderDirty" :loading="reordering" @click="saveOrder">保存排序</NButton>
        </div>
        <NDataTable :columns="columns" :data="slides" />
      </NCard>
    </NSpin>

    <NDrawer v-model:show="drawerShow" :width="520">
      <NDrawerContent :title="editingSlide?.isNew ? '新增 Slide' : `编辑 Slide · ${editingSlide?.id}`">
        <NForm v-if="editingSlide" label-placement="top">
          <NFormItem v-if="editingSlide.isNew" label="ID（可选）">
            <NInput v-model:value="editingSlide.id" placeholder="省略则自动生成" />
          </NFormItem>

          <NFormItem label="视频">
            <div class="media-field">
              <NInput v-model:value="editingSlide.videoUrl" placeholder="HTTPS 视频 URL" />
              <NUpload :show-file-list="false" accept="video/mp4,video/webm" @change="(o) => handleUpload('video', o)">
                <NButton :loading="uploadingVideo" size="small">上传视频</NButton>
              </NUpload>
            </div>
            <video v-if="editingSlide.videoUrl" :src="editingSlide.videoUrl" class="media-preview" controls muted />
          </NFormItem>

          <NFormItem label="缩略图">
            <div class="media-field">
              <NInput v-model:value="editingSlide.posterUrl" placeholder="HTTPS 图片 URL" />
              <NUpload :show-file-list="false" accept="image/*" @change="(o) => handleUpload('poster', o)">
                <NButton :loading="uploadingPoster" size="small">上传图片</NButton>
              </NUpload>
            </div>
            <img v-if="editingSlide.posterUrl" :src="editingSlide.posterUrl" alt="poster" class="poster-preview" />
          </NFormItem>

          <LocaleTabs v-model:locale="slideLocale">
            <NFormItem label="Slogan">
              <NInput v-model:value="editingSlide.title![slideLocale]" placeholder="留空则使用全局默认" />
            </NFormItem>
            <NFormItem label="副标题">
              <textarea
                v-model="editingSlide.subtitle![slideLocale]"
                class="textarea"
                rows="3"
                placeholder="留空则使用全局默认"
              />
            </NFormItem>
          </LocaleTabs>

          <NFormItem label="启用">
            <NSwitch v-model:value="editingSlide.active" />
          </NFormItem>

          <NButton type="primary" block :loading="savingSlide" @click="saveSlide">保存</NButton>
        </NForm>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
.settings-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
}
.slide-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: inherit;
}
.media-field {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}
.media-field :deep(.n-input) {
  flex: 1;
}
.media-preview {
  width: 100%;
  max-height: 180px;
  margin-top: 8px;
  border-radius: 6px;
  background: #000;
}
.poster-preview {
  width: 160px;
  margin-top: 8px;
  border-radius: 6px;
  object-fit: cover;
}
</style>
