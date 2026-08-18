import { http, unwrap } from './http'
import type {
  ActivityDashboard,
  BonusGrant,
  BonusGrantPayload,
  BonusGrantResult,
  BonusGrantsPage,
  BonusLotStateResult,
  BonusSource,
  Campaign,
  CampaignPatch,
  CampaignState,
  Invitation,
  InvitationsPage,
  InvitationStatus,
  RiskLevel,
  RiskUpdateResult,
  SeedCreator,
  SeedCreatorsPage,
  SeedReviewPayload,
  SeedReviewResult,
  SeedStatus,
} from '@/types/admin'
import { parseTimestamp } from '@/utils/time'

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function asString(value: unknown): string | null {
  if (value == null || value === '') return null
  return String(value)
}

function asTime(value: unknown): number | null {
  if (typeof value === 'number' || typeof value === 'string') {
    return parseTimestamp(value)
  }
  return null
}

interface ApiCampaign {
  id: string
  name: string
  state: CampaignState
  seed_bonus_cents: number
  reward_inviter_cents: number
  reward_invitee_cents: number
  bonus_ttl_minutes: number
  deposit_window_minutes: number
  min_deposit_cents: number
  seed_cap: number
  budget_cap_cents: number
  spent_cents: number
  starts_at: string | number | null
  ends_at: string | number | null
  created_at: string | number
}

function mapCampaign(raw: ApiCampaign): Campaign {
  return {
    id: raw.id,
    name: raw.name,
    state: raw.state,
    seedBonusCents: asNumber(raw.seed_bonus_cents),
    rewardInviterCents: asNumber(raw.reward_inviter_cents),
    rewardInviteeCents: asNumber(raw.reward_invitee_cents),
    bonusTtlMinutes: asNumber(raw.bonus_ttl_minutes),
    depositWindowMinutes: asNumber(raw.deposit_window_minutes),
    minDepositCents: asNumber(raw.min_deposit_cents),
    seedCap: asNumber(raw.seed_cap),
    budgetCapCents: asNumber(raw.budget_cap_cents),
    spentCents: asNumber(raw.spent_cents),
    startsAt: asTime(raw.starts_at),
    endsAt: asTime(raw.ends_at),
    createdAt: asTime(raw.created_at) ?? 0,
  }
}

function mapSeedCreator(raw: Record<string, unknown>): SeedCreator {
  return {
    id: String(raw.id),
    userId: String(raw.user_id ?? ''),
    campaignId: String(raw.campaign_id ?? ''),
    seedRank: raw.seed_rank == null ? null : asNumber(raw.seed_rank),
    status: raw.status as SeedStatus,
    twitterUsername: asString(raw.twitter_username),
    twitterUrl: asString(raw.twitter_url),
    discordUsername: asString(raw.discord_username),
    discordUserId: asString(raw.discord_user_id),
    submittedAt: asTime(raw.submitted_at),
    reviewerId: asString(raw.reviewer_id),
    reviewedAt: asTime(raw.reviewed_at),
    rejectReason: asString(raw.reject_reason),
    riskLevel: (raw.risk_level as RiskLevel) || 'none',
    riskNote: asString(raw.risk_note),
  }
}

function mapInvitation(raw: Record<string, unknown>): Invitation {
  return {
    id: String(raw.id),
    campaignId: String(raw.campaign_id ?? ''),
    seedId: String(raw.seed_id ?? ''),
    inviterUserId: String(raw.inviter_user_id ?? ''),
    inviteeUserId: String(raw.invitee_user_id ?? ''),
    status: raw.status as InvitationStatus,
    registeredAt: asTime(raw.registered_at),
    depositDeadline: asTime(raw.deposit_deadline),
    qualifiedAt: asTime(raw.qualified_at),
    firstTopupCents: raw.first_topup_cents == null ? null : asNumber(raw.first_topup_cents),
    firstTopupAt: asTime(raw.first_topup_at),
    isWinner: Boolean(raw.is_winner),
  }
}

function mapBonusGrant(raw: Record<string, unknown>): BonusGrant {
  return {
    id: String(raw.id),
    userId: String(raw.user_id ?? ''),
    source: raw.source as BonusSource,
    amountGrantedCents: asNumber(raw.amount_granted_cents),
    amountRemainingCents: asNumber(raw.amount_remaining_cents),
    grantedAt: asTime(raw.granted_at),
    expiresAt: asTime(raw.expires_at),
    status: raw.status as BonusGrant['status'],
  }
}

function mapDashboard(raw: Record<string, unknown>): ActivityDashboard {
  return {
    seedCap: asNumber(raw.seed_cap),
    seedApproved: asNumber(raw.seed_approved),
    seedPending: asNumber(raw.seed_pending),
    invitedUsers: asNumber(raw.invited_users),
    qualified: asNumber(raw.qualified),
    winners: asNumber(raw.winners),
    noReward: asNumber(raw.no_reward),
    qualifiedTotal: asNumber(raw.qualified_total),
    seedIssuedCents: asNumber(raw.seed_issued_cents),
    inviterIssuedCents: asNumber(raw.inviter_issued_cents),
    inviteeIssuedCents: asNumber(raw.invitee_issued_cents),
    manualIssuedCents: asNumber(raw.manual_issued_cents),
    totalIssuedCents: asNumber(raw.total_issued_cents),
    budgetCapCents: asNumber(raw.budget_cap_cents),
    spentCents: asNumber(raw.spent_cents),
    remainingBudgetCents: asNumber(raw.remaining_budget_cents),
  }
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const raw = await unwrap<{ items: ApiCampaign[] }>(http.get('/admin/activity/campaigns'))
  return (raw.items ?? []).map(mapCampaign)
}

export async function patchCampaign(campaignId: string, patch: CampaignPatch): Promise<Campaign> {
  const body: Record<string, unknown> = {}
  if (patch.name !== undefined) body.name = patch.name
  if (patch.state !== undefined) body.state = patch.state
  if (patch.seedCap !== undefined) body.seed_cap = patch.seedCap
  if (patch.budgetCapCents !== undefined) body.budget_cap_cents = patch.budgetCapCents
  if (patch.bonusTtlMinutes !== undefined) body.bonus_ttl_minutes = patch.bonusTtlMinutes
  if (patch.depositWindowMinutes !== undefined) body.deposit_window_minutes = patch.depositWindowMinutes
  if (patch.minDepositCents !== undefined) body.min_deposit_cents = patch.minDepositCents
  if (patch.rewardInviterCents !== undefined) body.reward_inviter_cents = patch.rewardInviterCents
  if (patch.rewardInviteeCents !== undefined) body.reward_invitee_cents = patch.rewardInviteeCents
  if (patch.startsAt !== undefined) body.starts_at = patch.startsAt
  if (patch.endsAt !== undefined) body.ends_at = patch.endsAt

  const raw = await unwrap<ApiCampaign>(http.patch(`/admin/activity/campaigns/${campaignId}`, body))
  return mapCampaign(raw)
}

export interface FetchSeedCreatorsParams {
  status?: string
  campaignId?: string
  offset?: number
  limit?: number
}

export async function fetchSeedCreators(params: FetchSeedCreatorsParams = {}): Promise<SeedCreatorsPage> {
  const raw = await unwrap<{ items: Record<string, unknown>[]; total: number; offset: number; limit: number }>(
    http.get('/admin/activity/seed-creators', {
      params: {
        status: params.status || undefined,
        campaign_id: params.campaignId || undefined,
        offset: params.offset,
        limit: params.limit,
      },
    }),
  )
  return {
    items: (raw.items ?? []).map(mapSeedCreator),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}

export async function reviewSeedCreator(seedId: string, payload: SeedReviewPayload): Promise<SeedReviewResult> {
  const raw = await unwrap<{
    status: SeedStatus
    seed_rank?: number | null
    invite_code?: string | null
    idempotent?: boolean
  }>(
    http.post(`/admin/activity/seed-creators/${seedId}/review`, {
      decision: payload.decision,
      twitter_verified: payload.twitterVerified,
      discord_verified: payload.discordVerified,
      reject_reason: payload.rejectReason ?? null,
    }),
  )
  return {
    status: raw.status,
    seedRank: raw.seed_rank ?? null,
    inviteCode: raw.invite_code ?? null,
    idempotent: raw.idempotent,
  }
}

export async function updateSeedRisk(seedId: string, level: RiskLevel, note: string): Promise<RiskUpdateResult> {
  const raw = await unwrap<{ level: RiskLevel }>(
    http.post(`/admin/activity/seed-creators/${seedId}/risk`, { level, note }),
  )
  return { level: raw.level }
}

export interface FetchInvitationsParams {
  campaignId?: string
  offset?: number
  limit?: number
}

export async function fetchInvitations(params: FetchInvitationsParams = {}): Promise<InvitationsPage> {
  const raw = await unwrap<{ items: Record<string, unknown>[]; total: number; offset: number; limit: number }>(
    http.get('/admin/activity/invitations', {
      params: {
        campaign_id: params.campaignId || undefined,
        offset: params.offset,
        limit: params.limit,
      },
    }),
  )
  return {
    items: (raw.items ?? []).map(mapInvitation),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}

export async function updateInvitationRisk(
  inviteId: string,
  level: RiskLevel,
  note: string,
): Promise<RiskUpdateResult> {
  const raw = await unwrap<{ level: RiskLevel }>(
    http.post(`/admin/activity/invitations/${inviteId}/risk`, { level, note }),
  )
  return { level: raw.level }
}

export interface FetchBonusGrantsParams {
  userId?: string
  campaignId?: string
  offset?: number
  limit?: number
}

export async function fetchBonusGrants(params: FetchBonusGrantsParams = {}): Promise<BonusGrantsPage> {
  const raw = await unwrap<{ items: Record<string, unknown>[]; total: number; offset: number; limit: number }>(
    http.get('/admin/activity/bonus-grants', {
      params: {
        user_id: params.userId || undefined,
        campaign_id: params.campaignId || undefined,
        offset: params.offset,
        limit: params.limit,
      },
    }),
  )
  return {
    items: (raw.items ?? []).map(mapBonusGrant),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}

export async function fetchActivityDashboard(): Promise<ActivityDashboard> {
  const raw = await unwrap<Record<string, unknown>>(http.get('/admin/activity/dashboard'))
  return mapDashboard(raw)
}

export async function grantBonus(payload: BonusGrantPayload): Promise<BonusGrantResult> {
  const raw = await unwrap<{ lot_id: string | null; business_key: string; idempotent?: boolean }>(
    http.post('/admin/activity/bonus/grant', {
      user_id: payload.userId,
      cents: payload.cents,
      reason: payload.reason,
      idempotency_key: payload.idempotencyKey,
    }),
  )
  return {
    lotId: raw.lot_id,
    businessKey: raw.business_key,
    idempotent: raw.idempotent,
  }
}

export async function freezeBonusLot(lotId: string): Promise<BonusLotStateResult> {
  const raw = await unwrap<{ lot_id: string; status: BonusLotStateResult['status'] }>(
    http.post(`/admin/activity/bonus/${lotId}/freeze`),
  )
  return { lotId: raw.lot_id, status: raw.status }
}

export async function unfreezeBonusLot(lotId: string): Promise<BonusLotStateResult> {
  const raw = await unwrap<{ lot_id: string; status: BonusLotStateResult['status'] }>(
    http.post(`/admin/activity/bonus/${lotId}/unfreeze`),
  )
  return { lotId: raw.lot_id, status: raw.status }
}
