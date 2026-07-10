import type {
  BalanceAdjustmentType,
  GenerationStatus,
  InvocationChannel,
  LocalizedString,
  Paginated,
  PaymentProvider,
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
  lastActiveAt: number | null
}

export interface AdminUserApiKey {
  id: string
  name: string
  prefix: string
  isActive: boolean
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
  createdAt: number
  apiKeys: AdminUserApiKey[]
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

export type ModelCategory = 'video' | 'image' | 'llm'
export type PricingMode = 'video' | 'audio' | 'dashscope_video' | 'sandbase_video'

export interface BaseModel {
  seqId: number
  slug: string
  category: ModelCategory
  apiModelId: string | null
  mode: PricingMode
  rate: Record<string, unknown>
  description: string
  publisherId: number | null
  publisherSlug: string | null
  active: boolean
  sortOrder: number
  createdAt: number
  updatedAt: number
}

export interface Publisher {
  seqId: number
  slug: string
  displayName: string
  displayNameI18n: Record<string, string> | null
  logoUrl: string | null
  description: string
  active: boolean
  sortOrder: number
  modelCount: number
  createdAt: number
  updatedAt: number
}

export interface AssignModelsResult {
  updated: string[]
  notFound: string[]
}

export interface OfferingExample {
  id: string
  title: string
  titleI18n?: Record<string, string> | null
  description?: string | null
  descriptionI18n?: Record<string, string> | null
  input: Record<string, unknown>
  outputUrl?: string | null
  thumbnailUrl?: string | null
  sortOrder?: number | null
}

export interface Offering {
  seqId: number
  modelId: number
  capability: string
  displayName: string
  description: string
  thumbnailUrl: string | null
  iconUrl: string | null
  startingPriceUsd: number | null
  standardPriceUsd: number | null
  priceUnit: string | null
  priceDetail: string | null
  readmeMd: string | null
  readmeMdI18n: Record<string, string> | null
  faq: Array<Record<string, unknown>>
  faqI18n: Record<string, unknown> | null
  inputSchema: Record<string, unknown> | null
  examples: OfferingExample[]
  isHot: boolean
  isNew: boolean
  active: boolean
  sortOrder: number
  createdAt: number
  updatedAt: number
}

export interface ProviderRoute {
  seqId: number
  modelId: number
  provider: string
  priority: number
  baseUrl: string
  apiModelId: string | null
  active: boolean
  createdAt: number
  updatedAt: number
}

export interface AdminGenerationListItem {
  taskId: string
  userId: string
  userEmail: string
  model: string
  status: GenerationStatus
  costUsd: number
  duration: number
  invocationChannel: InvocationChannel
  apiKeyPrefix: string | null
  refunded: boolean
  createdAt: number
}

export interface AdminUserGenerationItem {
  taskId: string
  model: string
  duration: number
  costUsd: number
  status: GenerationStatus
  invocationChannel: InvocationChannel
  refunded: boolean
  createdAt: number
}

export interface AdminGenerationDetail extends AdminGenerationListItem {
  apiKeyId: string | null
  input: Record<string, unknown>
  output: { type: string; url?: string } | null
  outputUrl?: string
  billingRecordId: string | null
}

export interface RefundResult {
  taskId: string
  refundedUsd: number
  newUserBalanceUsd: number
  billingRecordId: string
}

export interface BillingTransaction {
  id: string
  userId?: string
  userEmail?: string
  amountUsd: number
  status: TransactionStatus
  provider?: PaymentProvider
  paymentMethod: string | null
  paymentDetail: string | null
  providerSessionId: string | null
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

export interface ProcessingFee {
  percent: number
  fixedUsd: number
}

export type ProcessingFeeProvider = 'stripe' | 'nowpayments'

export type ProcessingFeeByProvider = Record<ProcessingFeeProvider, ProcessingFee>

export interface AdminConfig {
  creditsPerUsd: number
  processingFee: ProcessingFeeByProvider
}

export type UsersPage = Paginated<AdminUserListItem>
export type PublishersPage = Paginated<Publisher>
export type GenerationsPage = Paginated<AdminGenerationListItem>
export type TransactionsPage = Paginated<BillingTransaction>

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

export interface AdminAssetUpload {
  url: string
  filename: string
  contentType: string
  sizeBytes: number
  key: string
}
