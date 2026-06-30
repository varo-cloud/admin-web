<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NButton,
  NAvatar,
  type MenuOption,
} from 'naive-ui'
import {
  HomeOutline,
  PeopleOutline,
  CubeOutline,
  FlashOutline,
  CardOutline,
  KeyOutline,
  PricetagOutline,
  SettingsOutline,
  DocumentTextOutline,
  VideocamOutline,
  WalletOutline,
} from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'
import { NIcon } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

function renderIcon(icon: typeof HomeOutline) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions: MenuOption[] = [
  { label: '仪表盘', key: '/dashboard', icon: renderIcon(HomeOutline) },
  { label: '用户', key: '/users', icon: renderIcon(PeopleOutline) },
  { label: '模型', key: '/models', icon: renderIcon(CubeOutline) },
  { label: '任务', key: '/generations', icon: renderIcon(FlashOutline) },
  { label: '充值订单', key: '/billing/transactions', icon: renderIcon(CardOutline) },
  { label: '充值档位', key: '/billing/packages', icon: renderIcon(WalletOutline) },
  { label: 'API Keys', key: '/api-keys', icon: renderIcon(KeyOutline) },
  { label: '定价', key: '/pricing', icon: renderIcon(PricetagOutline) },
  { label: 'Hero 轮播', key: '/content/hero-carousel', icon: renderIcon(VideocamOutline) },
  { label: '系统配置', key: '/settings', icon: renderIcon(SettingsOutline) },
  { label: '审计日志', key: '/audit-logs', icon: renderIcon(DocumentTextOutline) },
]

const activeKey = computed(() => {
  const path = route.path
  if (path.startsWith('/users')) return '/users'
  if (path.startsWith('/models')) return '/models'
  if (path.startsWith('/generations')) return '/generations'
  if (path.startsWith('/billing')) return path
  if (path.startsWith('/content')) return path
  return path
})

async function handleLogout() {
  await auth.signOut()
  router.push('/login')
}
</script>

<template>
  <NLayout has-sider style="min-height: 100vh">
    <NLayoutSider bordered :width="220" :native-scrollbar="false">
      <div class="brand">Varo Admin</div>
      <NMenu
        :value="activeKey"
        :options="menuOptions"
        @update:value="(key) => router.push(String(key))"
      />
    </NLayoutSider>
    <NLayout>
      <NLayoutHeader bordered class="header">
        <span class="header-title">管理控制台</span>
        <div class="header-actions">
          <NAvatar round size="small">{{ auth.profile?.email?.[0]?.toUpperCase() ?? 'A' }}</NAvatar>
          <span class="email">{{ auth.profile?.email }}</span>
          <NButton size="small" quaternary @click="handleLogout">退出</NButton>
        </div>
      </NLayoutHeader>
      <NLayoutContent content-style="padding: 24px">
        <RouterView />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<style scoped>
.brand {
  padding: 20px 16px;
  font-size: 18px;
  font-weight: 700;
  border-bottom: 1px solid var(--n-border-color);
}
.header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
}
.header-title {
  font-weight: 600;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.email {
  font-size: 13px;
  color: #64748b;
}
</style>
