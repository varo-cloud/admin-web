import type {
  BalanceAdjustmentType,
  GenerationStatus,
  InvocationChannel,
  LocalizedString,
  ModelFaqItem,
  Paginated,
  PricingPriceUnit,
  TransactionStatus,
  UserRole,
  UserStatus,
} from './index'

export interface DashboardSummary {
  usersTotal: number
  usersNewToday: number
  usersNewThisWeek: number
  usersActive7d: number
  generationsToday: {
    total: number
    queued: number
    processing: number
    completed: number
    failed: number
  }
  generationsTodayByChannel: { web: number; api: number }
  revenueTodayUsd: number
  spendTodayUsd: number
  failureRate24h: number
  pendingTopupsCount: number
  trend: DashboardTrendPoint[]
}

export interface DashboardTrendPoint {
  date: string
  generations: number
  revenueUsd: number
  spendUsd: number
  newUsers: number
}

export interface AdminUserListItem {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  balanceUsd: number
  apiKeysCount: number
  createdAt: number
  lastActiveAt: number
}

export interface AdminUserApiKey {
  id: string
  name: string
  prefix: string
  isActive: boolean
  totalCalls: number
  totalSpendUsd: number
  lastUsedAt: number | null
  createdAt: number
}

export interface AdminUserDetail {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  balanceUsd: number
  balanceCredits: number
  spentThisMonthUsd: number
  createdAt: number
  apiKeys: AdminUserApiKey[]
  autoTopUp: {
    enabled: boolean
    thresholdUsd: number
    packageId: string
  }
  modelPreferences: {
    favourites: string[]
    recent: { id: string; visitedAt: number }[]
  }
}

export interface BalanceAdjustmentPayload {
  amountUsd: number
  type: BalanceAdjustmentType
  reason: string
  idempotencyKey?: string
}

export interface BalanceAdjustmentResult {
  userId: string
  previousBalanceUsd: number
  newBalanceUsd: number
  adjustmentUsd: number
  billingRecordId: string
}

export interface AdminModelListItem {
  id: string
  name: LocalizedString
  displayName?: LocalizedString
  provider: string
  capabilities: string[]
  active: boolean
  isHot: boolean
  isNew: boolean
  startingPriceUsd: number
  priceUnit: PricingPriceUnit
  sortOrder: number
  updatedAt: number
}

export interface AdminModelDetail {
  id: string
  name: LocalizedString
  displayName?: LocalizedString
  provider: string
  capabilities: string[]
  description: LocalizedString
  thumbnailUrl?: string
  modelPath: string
  apiModelId: string
  active: boolean
  isHot: boolean
  isNew: boolean
  sortOrder: number
  startingPriceUsd: number
  standardPriceUsd?: number
  priceUnit: PricingPriceUnit
  priceDetail?: string
  discountPercent?: number
  perRunPriceUsd?: number
  runsPerTenUsd?: number
  inputSchema: Record<string, unknown>
  readmeMd?: LocalizedString
  faq: ModelFaqItem[]
  createdAt: number
  updatedAt: number
}

export interface AdminGenerationListItem {
  taskId: string
  userId: string
  userEmail: string
  modelId: string
  apiModelId: string
  status: GenerationStatus
  costUsd: number
  duration: number
  invocationChannel: InvocationChannel
  apiKeyPrefix: string | null
  refunded: boolean
  createdAt: number
  completedAt: number | null
}

export interface GenerationTimelineEntry {
  status: GenerationStatus
  at: number
}

export interface AdminGenerationDetail extends AdminGenerationListItem {
  apiKeyId: string | null
  input: Record<string, unknown>
  output: { type: string; url?: string } | null
  billingRecordId: string | null
  upstreamTaskId: string | null
  upstreamError: string | null
  timeline: GenerationTimelineEntry[]
}

export interface RefundResult {
  taskId: string
  refundedUsd: number
  newUserBalanceUsd: number
  billingRecordId: string
}

export interface BillingTransaction {
  id: string
  userId: string
  userEmail: string
  amountUsd: number
  packageId: string
  status: TransactionStatus
  paymentMethod: string
  paymentDetail: string
  stripeSessionId: string
  receiptUrl: string | null
  createdAt: number
  completedAt: number | null
}

export interface BillingPackage {
  id: string
  priceUsd: number
  label?: LocalizedString
  sortOrder: number
  active: boolean
  createdAt: number
  updatedAt: number
}

export interface BillingRecord {
  id: string
  style: string
  detail: string
  amountUsd: number
  createdAt: number
}

export interface AdminApiKeyListItem {
  id: string
  userId: string
  userEmail: string
  name: string
  prefix: string
  isActive: boolean
  totalCalls: number
  totalSpendUsd: number
  lastUsedAt: number | null
  createdAt: number
}

export interface PricingItem {
  id: string
  modelId: string
  name: LocalizedString
  standardPriceUsd: number
  startingPriceUsd: number
  priceUnit: PricingPriceUnit
  discountPercent: number
  category: string
  mediaType: string
  sortOrder: number
}

export interface ProcessingFee {
  percent: number
  fixedUsd: number
}

export interface AdminConfig {
  creditsPerUsd: number
  processingFee: ProcessingFee
}

export interface AuditLog {
  id: string
  adminUserId: string
  adminEmail: string
  action: string
  targetType: string
  targetId: string
  reason: string
  beforeSnapshot: Record<string, unknown> | null
  afterSnapshot: Record<string, unknown> | null
  createdAt: number
}

export type UsersPage = Paginated<AdminUserListItem>
export type ModelsPage = Paginated<AdminModelListItem>
export type GenerationsPage = Paginated<AdminGenerationListItem>
export type TransactionsPage = Paginated<BillingTransaction>
export type ApiKeysPage = Paginated<AdminApiKeyListItem>
export type AuditLogsPage = Paginated<AuditLog>

export interface HeroCarouselSlide {
  id: string
  sortOrder: number
  active: boolean
  videoUrl: string
  posterUrl: string
  title?: LocalizedString
  subtitle?: LocalizedString
  createdAt: number
  updatedAt: number
}

export interface HeroCarouselConfig {
  slideDurationMs: number
  autoplayEnabled: boolean
  muted: boolean
  defaultTitle: LocalizedString
  defaultSubtitle: LocalizedString
  slides: HeroCarouselSlide[]
  updatedAt: number
}

export interface HeroCarouselAssetUpload {
  url: string
  kind: 'video' | 'poster'
  contentType: string
  sizeBytes: number
}
