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
  iconUrl: string | null
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
  coverUrl: string | null
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
  /** 上游供应商已结算成本；null 表示尚未结算或不适用，不代表零成本 */
  upstreamCostUsd: number | null
  duration: number
  invocationChannel: InvocationChannel
  apiKeyPrefix: string | null
  refunded: boolean
  errorCode: string | null
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

export interface GenerationUpstreamUsage {
  totalTokens: number
  promptTokens: number
  completionTokens: number
  cachedTokens: number
  reasoningTokens: number
  cacheCreationTokens: number
}

export interface AdminGenerationDetail extends AdminGenerationListItem {
  category: string | null
  capability: string | null
  apiKeyId: string | null
  /** 上游返回的原始 usage；视频/图片 SandBase 的 token 字段常为 0，勿据此做用量展示 */
  upstreamUsage: GenerationUpstreamUsage | null
  /** 结算轮询次数；达到 12 表示已停止重试 */
  costAttempts: number
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

export interface RehostResult {
  taskId: string
  status: string
}

export interface GenerationUpstreamStatus {
  taskId: string
  model: string
  ourStatus: string
  providerUsed: string | null
  providerTaskId: string | null
  routeProvider: string | null
  upstream: {
    url: string | null
    httpStatus: number | null
    body: unknown
  } | null
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

export type CampaignState = 'draft' | 'active' | 'ended'
export type SeedStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'cancelled'
export type InvitationStatus = 'waiting_for_topup' | 'qualified' | 'winner' | 'no_reward' | 'expired'
export type BonusLotStatus = 'active' | 'depleted' | 'expired' | 'frozen'
export type BonusSource = 'seed_bonus' | 'inviter_reward' | 'invitee_reward' | 'manual'
export type RiskLevel = 'none' | 'low' | 'med' | 'high'
export type SeedReviewDecision = 'approve' | 'reject'

export interface Campaign {
  id: string
  name: string
  state: CampaignState
  seedBonusCents: number
  rewardInviterCents: number
  rewardInviteeCents: number
  bonusTtlDays: number
  depositWindowDays: number
  minDepositCents: number
  seedCap: number
  budgetCapCents: number
  spentCents: number
  startsAt: number | null
  endsAt: number | null
  createdAt: number
}

export interface CampaignPatch {
  name?: string
  state?: CampaignState
  seedCap?: number
  budgetCapCents?: number
  bonusTtlDays?: number
  depositWindowDays?: number
  minDepositCents?: number
  rewardInviterCents?: number
  rewardInviteeCents?: number
  startsAt?: string | null
  endsAt?: string | null
}

export interface SeedCreator {
  id: string
  userId: string
  campaignId: string
  seedRank: number | null
  status: SeedStatus
  twitterUsername: string | null
  twitterUrl: string | null
  discordUsername: string | null
  discordUserId: string | null
  submittedAt: number | null
  reviewerId: string | null
  reviewedAt: number | null
  rejectReason: string | null
  riskLevel: RiskLevel
  riskNote: string | null
}

export interface SeedReviewPayload {
  decision: SeedReviewDecision
  twitterVerified: boolean
  discordVerified: boolean
  rejectReason?: string | null
}

export interface SeedReviewResult {
  status: SeedStatus
  seedRank?: number | null
  inviteCode?: string | null
  idempotent?: boolean
}

export interface Invitation {
  id: string
  campaignId: string
  seedId: string
  inviterUserId: string
  inviteeUserId: string
  status: InvitationStatus
  registeredAt: number | null
  depositDeadline: number | null
  qualifiedAt: number | null
  firstTopupCents: number | null
  firstTopupAt: number | null
  isWinner: boolean
}

export interface BonusGrant {
  id: string
  userId: string
  source: BonusSource
  amountGrantedCents: number
  amountRemainingCents: number
  grantedAt: number | null
  expiresAt: number | null
  status: BonusLotStatus
}

export interface ActivityDashboard {
  seedCap: number
  seedApproved: number
  seedPending: number
  invitedUsers: number
  qualified: number
  winners: number
  noReward: number
  qualifiedTotal: number
  seedIssuedCents: number
  inviterIssuedCents: number
  inviteeIssuedCents: number
  manualIssuedCents: number
  totalIssuedCents: number
  budgetCapCents: number
  spentCents: number
  remainingBudgetCents: number
}

export interface BonusGrantPayload {
  userId: string
  cents: number
  reason: string
  idempotencyKey: string
}

export interface BonusGrantResult {
  lotId: string | null
  businessKey: string
  idempotent?: boolean
}

export interface BonusLotStateResult {
  lotId: string
  status: BonusLotStatus
}

export interface RiskUpdateResult {
  level: RiskLevel
}

export type SeedCreatorsPage = Paginated<SeedCreator>
export type InvitationsPage = Paginated<Invitation>
export type BonusGrantsPage = Paginated<BonusGrant>
