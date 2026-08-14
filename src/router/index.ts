import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupGuards } from './guards'

const routes: RouteRecordRaw[] = [
  {
    path: '/forbidden',
    name: 'forbidden',
    meta: { public: true },
    component: () => import('@/views/auth/ForbiddenView.vue'),
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
      { path: 'publishers', name: 'publishers', component: () => import('@/views/publishers/PublishersView.vue') },
      { path: 'models/new', name: 'model-new', component: () => import('@/views/models/ModelEditView.vue') },
      { path: 'models/:slug/edit', name: 'model-edit', component: () => import('@/views/models/ModelEditView.vue') },
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
      {
        path: 'billing/packages',
        name: 'billing-packages',
        component: () => import('@/views/billing/PackagesView.vue'),
      },
      {
        path: 'content/hero-carousel',
        name: 'hero-carousel',
        component: () => import('@/views/content/HeroCarouselView.vue'),
      },
      {
        path: 'content/upload',
        name: 'upload',
        component: () => import('@/views/content/UploadView.vue'),
      },
      { path: 'activity', name: 'activity-dashboard', component: () => import('@/views/activity/ActivityDashboardView.vue') },
      {
        path: 'activity/seed-creators',
        name: 'activity-seed-creators',
        component: () => import('@/views/activity/SeedCreatorsView.vue'),
      },
      {
        path: 'activity/invitations',
        name: 'activity-invitations',
        component: () => import('@/views/activity/InvitationsView.vue'),
      },
      {
        path: 'activity/bonus-grants',
        name: 'activity-bonus-grants',
        component: () => import('@/views/activity/BonusGrantsView.vue'),
      },
      {
        path: 'activity/campaigns',
        name: 'activity-campaigns',
        component: () => import('@/views/activity/CampaignsView.vue'),
      },
      { path: 'settings', name: 'settings', component: () => import('@/views/settings/SettingsView.vue') },
    ],
  },
  { path: '/login', redirect: '/dashboard' },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

setupGuards(router)

export default router
