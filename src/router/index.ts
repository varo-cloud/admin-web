import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupGuards } from './guards'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    meta: { public: true },
    component: () => import('@/views/login/LoginView.vue'),
  },
  {
    path: '/',
    component: () => import('@/components/layout/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/dashboard/DashboardView.vue') },
      { path: 'users', name: 'users', component: () => import('@/views/users/UsersView.vue') },
      { path: 'users/:id', name: 'user-detail', component: () => import('@/views/users/UserDetailView.vue') },
      { path: 'models', name: 'models', component: () => import('@/views/models/ModelsView.vue') },
      { path: 'models/new', name: 'model-new', component: () => import('@/views/models/ModelEditView.vue') },
      { path: 'models/:id/edit', name: 'model-edit', component: () => import('@/views/models/ModelEditView.vue') },
      {
        path: 'generations',
        name: 'generations',
        component: () => import('@/views/generations/GenerationsView.vue'),
      },
      {
        path: 'generations/:id',
        name: 'generation-detail',
        component: () => import('@/views/generations/GenerationDetailView.vue'),
      },
      {
        path: 'billing/transactions',
        name: 'billing-transactions',
        component: () => import('@/views/billing/TransactionsView.vue'),
      },
      { path: 'api-keys', name: 'api-keys', component: () => import('@/views/api-keys/ApiKeysView.vue') },
      { path: 'pricing', name: 'pricing', component: () => import('@/views/pricing/PricingView.vue') },
      {
        path: 'content/hero-carousel',
        name: 'hero-carousel',
        component: () => import('@/views/content/HeroCarouselView.vue'),
      },
      { path: 'settings', name: 'settings', component: () => import('@/views/settings/SettingsView.vue') },
      { path: 'audit-logs', name: 'audit-logs', component: () => import('@/views/audit-logs/AuditLogsView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

setupGuards(router)

export default router
