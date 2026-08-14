import type { MockMethod } from 'vite-plugin-mock'
import { addAuditLog } from './store'
import { fail, paginate, pathParam, requireAdmin, success } from './_util'

type CampaignState = 'draft' | 'active' | 'ended'
type SeedStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'cancelled'
type InviteStatus = 'waiting_for_topup' | 'qualified' | 'winner' | 'no_reward' | 'expired'
type LotStatus = 'active' | 'depleted' | 'expired' | 'frozen'
type RiskLevel = 'none' | 'low' | 'med' | 'high'
type BonusSource = 'seed_bonus' | 'inviter_reward' | 'invitee_reward' | 'manual'

interface MockCampaign {
  id: string
  name: string
  state: CampaignState
  seed_bonus_cents: number
  reward_inviter_cents: number
  reward_invitee_cents: number
  bonus_ttl_days: number
  deposit_window_days: number
  min_deposit_cents: number
  seed_cap: number
  budget_cap_cents: number
  spent_cents: number
  starts_at: string
  ends_at: string
  created_at: string
}

interface MockSeed {
  id: string
  user_id: string
  campaign_id: string
  seed_rank: number | null
  status: SeedStatus
  twitter_username: string | null
  twitter_url: string | null
  discord_username: string | null
  discord_user_id: string | null
  invite_code: string | null
  submitted_at: string
  reviewer_id: string | null
  reviewed_at: string | null
  reject_reason: string | null
  risk_level: RiskLevel
  risk_note: string | null
}

interface MockInvite {
  id: string
  campaign_id: string
  seed_id: string
  inviter_user_id: string
  invitee_user_id: string
  status: InviteStatus
  registered_at: string
  deposit_deadline: string
  qualified_at: string | null
  first_topup_cents: number | null
  first_topup_at: string | null
  is_winner: boolean
  risk_level: RiskLevel
  risk_note: string | null
}

interface MockLot {
  id: string
  user_id: string
  campaign_id: string
  source: BonusSource
  amount_granted_cents: number
  amount_remaining_cents: number
  granted_at: string
  expires_at: string
  status: LotStatus
  business_key: string
}

const CAMPAIGN_PATCH_FIELDS = new Set([
  'name',
  'state',
  'seed_cap',
  'budget_cap_cents',
  'bonus_ttl_days',
  'deposit_window_days',
  'min_deposit_cents',
  'reward_inviter_cents',
  'reward_invitee_cents',
  'starts_at',
  'ends_at',
])

const day = 86400000

function iso(offsetDays: number, extraMs = 0) {
  return new Date(Date.now() + offsetDays * day + extraMs).toISOString()
}

function hour(n: number) {
  return n * 3600000
}

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const campaigns: MockCampaign[] = [
  {
    id: 'creator30',
    name: 'Varo Seed Creator Referral',
    state: 'active',
    seed_bonus_cents: 2000,
    reward_inviter_cents: 1000,
    reward_invitee_cents: 1000,
    bonus_ttl_days: 14,
    deposit_window_days: 3,
    min_deposit_cents: 1000,
    seed_cap: 30,
    budget_cap_cents: 120000,
    spent_cents: 5000,
    starts_at: iso(-5),
    ends_at: iso(25),
    created_at: iso(-6),
  },
  {
    id: 'creator30-draft',
    name: '下一期草稿',
    state: 'draft',
    seed_bonus_cents: 2000,
    reward_inviter_cents: 1000,
    reward_invitee_cents: 1000,
    bonus_ttl_days: 14,
    deposit_window_days: 3,
    min_deposit_cents: 1000,
    seed_cap: 30,
    budget_cap_cents: 120000,
    spent_cents: 0,
    starts_at: iso(30),
    ends_at: iso(60),
    created_at: iso(-1),
  },
]

const seeds: MockSeed[] = [
  {
    id: 'seed-001',
    user_id: 'user-001',
    campaign_id: 'creator30',
    seed_rank: 1,
    status: 'approved',
    twitter_username: 'alice',
    twitter_url: 'https://x.com/alice',
    discord_username: 'alice#0001',
    discord_user_id: '111111111111111111',
    invite_code: 'ABC123',
    submitted_at: iso(-4),
    reviewer_id: 'admin-001',
    reviewed_at: iso(-4, hour(2)),
    reject_reason: null,
    risk_level: 'none',
    risk_note: null,
  },
  {
    id: 'seed-002',
    user_id: 'user-002',
    campaign_id: 'creator30',
    seed_rank: 2,
    status: 'approved',
    twitter_username: 'bob_creates',
    twitter_url: 'https://x.com/bob_creates',
    discord_username: 'bob',
    discord_user_id: '222222222222222222',
    invite_code: 'BOB456',
    submitted_at: iso(-3),
    reviewer_id: 'admin-001',
    reviewed_at: iso(-3),
    reject_reason: null,
    risk_level: 'high',
    risk_note: '多账号刷量嫌疑',
  },
  {
    id: 'seed-003',
    user_id: 'user-003',
    campaign_id: 'creator30',
    seed_rank: null,
    status: 'submitted',
    twitter_username: 'charlie_x',
    twitter_url: 'https://x.com/charlie_x',
    discord_username: 'charlie#9999',
    discord_user_id: '333333333333333333',
    invite_code: null,
    submitted_at: iso(-1),
    reviewer_id: null,
    reviewed_at: null,
    reject_reason: null,
    risk_level: 'none',
    risk_note: null,
  },
  {
    id: 'seed-004',
    user_id: 'user-004',
    campaign_id: 'creator30',
    seed_rank: null,
    status: 'submitted',
    twitter_username: 'dana',
    twitter_url: 'https://x.com/dana',
    discord_username: 'dana',
    discord_user_id: '444444444444444444',
    invite_code: null,
    submitted_at: iso(0, -hour(3)),
    reviewer_id: null,
    reviewed_at: null,
    reject_reason: null,
    risk_level: 'none',
    risk_note: null,
  },
  {
    id: 'seed-005',
    user_id: 'user-005',
    campaign_id: 'creator30',
    seed_rank: null,
    status: 'rejected',
    twitter_username: 'erin',
    twitter_url: 'https://x.com/erin',
    discord_username: 'erin#1111',
    discord_user_id: '555555555555555555',
    invite_code: null,
    submitted_at: iso(-2),
    reviewer_id: 'admin-001',
    reviewed_at: iso(-2),
    reject_reason: 'Twitter 账号与提交资料不符',
    risk_level: 'low',
    risk_note: null,
  },
]

const invites: MockInvite[] = [
  {
    id: 'inv-001',
    campaign_id: 'creator30',
    seed_id: 'seed-001',
    inviter_user_id: 'user-001',
    invitee_user_id: 'user-010',
    status: 'winner',
    registered_at: iso(-3),
    deposit_deadline: iso(0),
    qualified_at: iso(-2),
    first_topup_cents: 2000,
    first_topup_at: iso(-2),
    is_winner: true,
    risk_level: 'none',
    risk_note: null,
  },
  {
    id: 'inv-002',
    campaign_id: 'creator30',
    seed_id: 'seed-001',
    inviter_user_id: 'user-001',
    invitee_user_id: 'user-011',
    status: 'waiting_for_topup',
    registered_at: iso(-1),
    deposit_deadline: iso(2),
    qualified_at: null,
    first_topup_cents: null,
    first_topup_at: null,
    is_winner: false,
    risk_level: 'none',
    risk_note: null,
  },
  {
    id: 'inv-003',
    campaign_id: 'creator30',
    seed_id: 'seed-001',
    inviter_user_id: 'user-001',
    invitee_user_id: 'user-012',
    status: 'expired',
    registered_at: iso(-5),
    deposit_deadline: iso(-2),
    qualified_at: null,
    first_topup_cents: null,
    first_topup_at: null,
    is_winner: false,
    risk_level: 'none',
    risk_note: null,
  },
  {
    id: 'inv-004',
    campaign_id: 'creator30',
    seed_id: 'seed-001',
    inviter_user_id: 'user-001',
    invitee_user_id: 'user-013',
    status: 'no_reward',
    registered_at: iso(-2),
    deposit_deadline: iso(1),
    qualified_at: iso(-1),
    first_topup_cents: 1500,
    first_topup_at: iso(-1),
    is_winner: false,
    risk_level: 'none',
    risk_note: null,
  },
  {
    id: 'inv-005',
    campaign_id: 'creator30',
    seed_id: 'seed-002',
    inviter_user_id: 'user-002',
    invitee_user_id: 'user-014',
    status: 'qualified',
    registered_at: iso(-1),
    deposit_deadline: iso(2),
    qualified_at: iso(0, -hour(2)),
    first_topup_cents: 1000,
    first_topup_at: iso(0, -hour(2)),
    is_winner: false,
    risk_level: 'med',
    risk_note: '支付方式与其他账号重合',
  },
]

const lots: MockLot[] = [
  {
    id: 'lot-001',
    user_id: 'user-001',
    campaign_id: 'creator30',
    source: 'seed_bonus',
    amount_granted_cents: 2000,
    amount_remaining_cents: 800,
    granted_at: iso(-4),
    expires_at: iso(10),
    status: 'active',
    business_key: 'SEED_CREATOR_REWARD:user-001:creator30',
  },
  {
    id: 'lot-002',
    user_id: 'user-001',
    campaign_id: 'creator30',
    source: 'inviter_reward',
    amount_granted_cents: 1000,
    amount_remaining_cents: 1000,
    granted_at: iso(-2),
    expires_at: iso(12),
    status: 'active',
    business_key: 'REFERRAL_INVITER:inv-001',
  },
  {
    id: 'lot-003',
    user_id: 'user-010',
    campaign_id: 'creator30',
    source: 'invitee_reward',
    amount_granted_cents: 1000,
    amount_remaining_cents: 0,
    granted_at: iso(-2),
    expires_at: iso(12),
    status: 'depleted',
    business_key: 'REFERRAL_INVITEE:inv-001',
  },
  {
    id: 'lot-004',
    user_id: 'user-002',
    campaign_id: 'creator30',
    source: 'seed_bonus',
    amount_granted_cents: 2000,
    amount_remaining_cents: 2000,
    granted_at: iso(-3),
    expires_at: iso(11),
    status: 'frozen',
    business_key: 'SEED_CREATOR_REWARD:user-002:creator30',
  },
  {
    id: 'lot-005',
    user_id: 'user-015',
    campaign_id: 'creator30',
    source: 'manual',
    amount_granted_cents: 500,
    amount_remaining_cents: 0,
    granted_at: iso(-16),
    expires_at: iso(-2),
    status: 'expired',
    business_key: 'MANUAL:makeup-legacy',
  },
]

function currentCampaign(): MockCampaign | undefined {
  return campaigns
    .filter((c) => c.state !== 'draft')
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0]
}

function publicSeed(seed: MockSeed) {
  const { invite_code: _code, ...rest } = seed
  return rest
}

function publicInvite(invite: MockInvite) {
  const { risk_level: _level, risk_note: _note, ...rest } = invite
  return rest
}

function lowestRank(campaignId: string, cap: number): number | null {
  const used = new Set(
    seeds.filter((s) => s.campaign_id === campaignId && s.status === 'approved' && s.seed_rank != null).map((s) => s.seed_rank),
  )
  for (let i = 1; i <= cap; i++) {
    if (!used.has(i)) return i
  }
  return null
}

function issuedCents(source: BonusSource) {
  return lots.filter((l) => l.source === source).reduce((sum, l) => sum + l.amount_granted_cents, 0)
}

function parseLimit(query: Record<string, string>) {
  const offset = Number(query.offset) || 0
  let limit = Number(query.limit) || 20
  if (limit < 1) limit = 1
  if (limit > 100) limit = 100
  return { offset, limit }
}

export default [
  {
    url: '/api/admin/activity/campaigns',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      return success({ items: campaigns })
    },
  },
  {
    url: /\/api\/admin\/activity\/campaigns\/([^/]+)$/,
    method: 'patch',
    response: ({
      body,
      headers,
      url,
    }: {
      body: Record<string, unknown>
      headers: Record<string, string>
      url: string
    }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const id = pathParam(url, /\/campaigns\/([^/?]+)$/)
      const campaign = campaigns.find((c) => c.id === id)
      if (!campaign) return fail('not_found', 404)

      for (const key of Object.keys(body)) {
        if (!CAMPAIGN_PATCH_FIELDS.has(key)) return fail('invalid_campaign_field', 400)
      }
      if (body.state != null && !['draft', 'active', 'ended'].includes(String(body.state))) {
        return fail('invalid_state', 400)
      }

      const before = { ...campaign }
      Object.assign(campaign, body)
      addAuditLog({
        action: 'campaign_update',
        target_type: 'campaign',
        target_id: campaign.id,
        reason: '更新活动配置',
        before_snapshot: before,
        after_snapshot: { ...campaign },
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
      })
      return success(campaign)
    },
  },
  {
    url: '/api/admin/activity/seed-creators',
    method: 'get',
    response: ({ query, headers }: { query: Record<string, string>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      let items = [...seeds]
      if (query.status) items = items.filter((s) => s.status === query.status)
      if (query.campaign_id) items = items.filter((s) => s.campaign_id === query.campaign_id)
      items.sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at))
      const { offset, limit } = parseLimit(query)
      const page = paginate(items, offset, limit)
      return success({ ...page, items: page.items.map(publicSeed) })
    },
  },
  {
    url: /\/api\/admin\/activity\/seed-creators\/([^/]+)\/review$/,
    method: 'post',
    response: ({
      body,
      headers,
      url,
    }: {
      body: Record<string, unknown>
      headers: Record<string, string>
      url: string
    }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const seedId = pathParam(url, /\/seed-creators\/([^/]+)\/review$/)
      const seed = seeds.find((s) => s.id === seedId)
      if (!seed) return fail('not_found', 404)
      const campaign = campaigns.find((c) => c.id === seed.campaign_id)
      if (!campaign || campaign.state !== 'active') return fail('campaign_closed', 400)

      const decision = body.decision
      if (decision !== 'approve' && decision !== 'reject') return fail('invalid_decision', 400)

      if (decision === 'approve') {
        if (seed.status === 'approved') {
          return success({
            status: 'approved',
            seed_rank: seed.seed_rank,
            invite_code: seed.invite_code,
            idempotent: true,
          })
        }
        const rank = lowestRank(campaign.id, campaign.seed_cap)
        if (rank == null) return fail('seed_cap_reached', 400)
        if (campaign.spent_cents + campaign.seed_bonus_cents > campaign.budget_cap_cents) {
          return fail('budget_exceeded', 400)
        }

        seed.status = 'approved'
        seed.seed_rank = rank
        seed.invite_code = randomCode()
        seed.reviewer_id = auth.user.id
        seed.reviewed_at = new Date().toISOString()
        seed.reject_reason = null
        if (campaign.seed_bonus_cents > 0) {
          campaign.spent_cents += campaign.seed_bonus_cents
          lots.unshift({
            id: `lot-${Date.now()}`,
            user_id: seed.user_id,
            campaign_id: campaign.id,
            source: 'seed_bonus',
            amount_granted_cents: campaign.seed_bonus_cents,
            amount_remaining_cents: campaign.seed_bonus_cents,
            granted_at: new Date().toISOString(),
            expires_at: iso(campaign.bonus_ttl_days),
            status: 'active',
            business_key: `SEED_CREATOR_REWARD:${seed.user_id}:${campaign.id}`,
          })
        }
        addAuditLog({
          action: 'seed_review',
          target_type: 'campaign_seed',
          target_id: seed.id,
          reason: 'approve',
          before_snapshot: { status: 'submitted' },
          after_snapshot: { status: seed.status, seed_rank: seed.seed_rank },
          admin_user_id: auth.user.id,
          admin_email: auth.user.email,
        })
        return success({ status: 'approved', seed_rank: seed.seed_rank, invite_code: seed.invite_code })
      }

      seed.status = 'rejected'
      seed.seed_rank = null
      seed.invite_code = null
      seed.reviewer_id = auth.user.id
      seed.reviewed_at = new Date().toISOString()
      seed.reject_reason = body.reject_reason != null ? String(body.reject_reason) : 'rejected'
      addAuditLog({
        action: 'seed_review',
        target_type: 'campaign_seed',
        target_id: seed.id,
        reason: seed.reject_reason ?? 'reject',
        before_snapshot: null,
        after_snapshot: { status: 'rejected' },
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
      })
      return success({ status: 'rejected' })
    },
  },
  {
    url: /\/api\/admin\/activity\/seed-creators\/([^/]+)\/risk$/,
    method: 'post',
    response: ({
      body,
      headers,
      url,
    }: {
      body: Record<string, unknown>
      headers: Record<string, string>
      url: string
    }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const seedId = pathParam(url, /\/seed-creators\/([^/]+)\/risk$/)
      const seed = seeds.find((s) => s.id === seedId)
      if (!seed) return fail('not_found', 404)
      const level = String(body.level ?? '')
      if (!['none', 'low', 'med', 'high'].includes(level)) return fail('invalid_level', 400)
      seed.risk_level = level as RiskLevel
      seed.risk_note = body.note != null ? String(body.note) : seed.risk_note
      addAuditLog({
        action: 'seed_risk',
        target_type: 'campaign_seed',
        target_id: seed.id,
        reason: seed.risk_note ?? '',
        before_snapshot: null,
        after_snapshot: { level: seed.risk_level },
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
      })
      return success({ level: seed.risk_level })
    },
  },
  {
    url: '/api/admin/activity/invitations',
    method: 'get',
    response: ({ query, headers }: { query: Record<string, string>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      let items = [...invites]
      if (query.campaign_id) items = items.filter((i) => i.campaign_id === query.campaign_id)
      items.sort((a, b) => Date.parse(b.registered_at) - Date.parse(a.registered_at))
      const { offset, limit } = parseLimit(query)
      const page = paginate(items, offset, limit)
      return success({ ...page, items: page.items.map(publicInvite) })
    },
  },
  {
    url: /\/api\/admin\/activity\/invitations\/([^/]+)\/risk$/,
    method: 'post',
    response: ({
      body,
      headers,
      url,
    }: {
      body: Record<string, unknown>
      headers: Record<string, string>
      url: string
    }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const inviteId = pathParam(url, /\/invitations\/([^/]+)\/risk$/)
      const invite = invites.find((i) => i.id === inviteId)
      if (!invite) return fail('not_found', 404)
      const level = String(body.level ?? '')
      if (!['none', 'low', 'med', 'high'].includes(level)) return fail('invalid_level', 400)
      invite.risk_level = level as RiskLevel
      invite.risk_note = body.note != null ? String(body.note) : invite.risk_note
      addAuditLog({
        action: 'invite_risk',
        target_type: 'campaign_invite',
        target_id: invite.id,
        reason: invite.risk_note ?? '',
        before_snapshot: null,
        after_snapshot: { level: invite.risk_level },
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
      })
      return success({ level: invite.risk_level })
    },
  },
  {
    url: '/api/admin/activity/bonus-grants',
    method: 'get',
    response: ({ query, headers }: { query: Record<string, string>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      let items = [...lots]
      if (query.user_id) items = items.filter((l) => l.user_id === query.user_id)
      if (query.campaign_id) items = items.filter((l) => l.campaign_id === query.campaign_id)
      items.sort((a, b) => Date.parse(b.granted_at) - Date.parse(a.granted_at))
      const { offset, limit } = parseLimit(query)
      const page = paginate(items, offset, limit)
      return success({
        ...page,
        items: page.items.map(({ campaign_id: _c, business_key: _k, ...rest }) => rest),
      })
    },
  },
  {
    url: '/api/admin/activity/dashboard',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const campaign = currentCampaign()
      if (!campaign) return fail('no_campaign_configured', 404)
      const campaignSeeds = seeds.filter((s) => s.campaign_id === campaign.id)
      const campaignInvites = invites.filter((i) => i.campaign_id === campaign.id)
      const qualified = campaignInvites.filter((i) => i.status === 'qualified').length
      const winners = campaignInvites.filter((i) => i.status === 'winner').length
      const noReward = campaignInvites.filter((i) => i.status === 'no_reward').length
      return success({
        seed_cap: campaign.seed_cap,
        seed_approved: campaignSeeds.filter((s) => s.status === 'approved').length,
        seed_pending: campaignSeeds.filter((s) => s.status === 'submitted' || s.status === 'under_review').length,
        invited_users: campaignInvites.length,
        qualified,
        winners,
        no_reward: noReward,
        qualified_total: qualified + winners + noReward,
        seed_issued_cents: issuedCents('seed_bonus'),
        inviter_issued_cents: issuedCents('inviter_reward'),
        invitee_issued_cents: issuedCents('invitee_reward'),
        manual_issued_cents: issuedCents('manual'),
        total_issued_cents: lots.reduce((sum, l) => sum + l.amount_granted_cents, 0),
        budget_cap_cents: campaign.budget_cap_cents,
        spent_cents: campaign.spent_cents,
        remaining_budget_cents: campaign.budget_cap_cents - campaign.spent_cents,
      })
    },
  },
  {
    url: '/api/admin/activity/bonus/grant',
    method: 'post',
    response: ({ body, headers }: { body: Record<string, unknown>; headers: Record<string, string> }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const campaign = currentCampaign()
      if (!campaign) return fail('no_campaign_configured', 404)
      const userId = String(body.user_id ?? '')
      const cents = Number(body.cents)
      const reason = String(body.reason ?? '')
      const key = String(body.idempotency_key ?? '')
      if (!userId || !key || !Number.isFinite(cents) || cents < 1 || cents > 10_000_000) {
        return fail('invalid_request', 400)
      }
      const existing = lots.find((l) => l.business_key === `MANUAL:${key}`)
      if (existing) {
        return success({ lot_id: null, business_key: existing.business_key, idempotent: true })
      }
      if (campaign.spent_cents + cents > campaign.budget_cap_cents) return fail('budget_exceeded', 400)
      const lot: MockLot = {
        id: `lot-${Date.now()}`,
        user_id: userId,
        campaign_id: campaign.id,
        source: 'manual',
        amount_granted_cents: cents,
        amount_remaining_cents: cents,
        granted_at: new Date().toISOString(),
        expires_at: iso(campaign.bonus_ttl_days),
        status: 'active',
        business_key: `MANUAL:${key}`,
      }
      lots.unshift(lot)
      campaign.spent_cents += cents
      addAuditLog({
        action: 'bonus_grant',
        target_type: 'bonus_lot',
        target_id: lot.id,
        reason,
        before_snapshot: null,
        after_snapshot: { cents, user_id: userId },
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
      })
      return success({ lot_id: lot.id, business_key: lot.business_key })
    },
  },
  {
    url: /\/api\/admin\/activity\/bonus\/([^/]+)\/freeze$/,
    method: 'post',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const lotId = pathParam(url, /\/bonus\/([^/]+)\/freeze$/)
      const lot = lots.find((l) => l.id === lotId)
      if (!lot) return fail('not_found', 404)
      if (lot.status !== 'active') return fail('invalid_lot_state', 409)
      lot.status = 'frozen'
      addAuditLog({
        action: 'bonus_freeze',
        target_type: 'bonus_lot',
        target_id: lot.id,
        reason: 'freeze',
        before_snapshot: { status: 'active' },
        after_snapshot: { status: 'frozen' },
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
      })
      return success({ lot_id: lot.id, status: lot.status })
    },
  },
  {
    url: /\/api\/admin\/activity\/bonus\/([^/]+)\/unfreeze$/,
    method: 'post',
    response: ({ headers, url }: { headers: Record<string, string>; url: string }) => {
      const auth = requireAdmin(headers)
      if (!auth.ok) return auth.response
      const lotId = pathParam(url, /\/bonus\/([^/]+)\/unfreeze$/)
      const lot = lots.find((l) => l.id === lotId)
      if (!lot) return fail('not_found', 404)
      if (lot.status !== 'frozen') return fail('invalid_lot_state', 409)
      lot.status = lot.amount_remaining_cents > 0 ? 'active' : 'depleted'
      addAuditLog({
        action: 'bonus_unfreeze',
        target_type: 'bonus_lot',
        target_id: lot.id,
        reason: 'unfreeze',
        before_snapshot: { status: 'frozen' },
        after_snapshot: { status: lot.status },
        admin_user_id: auth.user.id,
        admin_email: auth.user.email,
      })
      return success({ lot_id: lot.id, status: lot.status })
    },
  },
] as MockMethod[]
