# Seed Creator 裂变 · 前后端一体化文档

活动 ID：`creator30`。Schema：`genflow`。  
实现：用户路由 `app/routers/activity.py`，管理路由 `app/routers/admin_activity.py`，域逻辑 `app/referral.py` / `app/bonus.py`，定时任务 `app/jobs.py`（`main_jobs` 进程）。

本文档同时给 **用户端前端、管理端前端、后端/运营** 使用：产品规则 → 状态机 → 接口契约 → 对接流程 → 后端内部与运维铁律。

相关真源：`docs/specs/2026-08-13-seed-creator-referral.md`、`docs/seed-creator-ops-runbook-zh.md`。

---

## 0. 一句话规则

前 **30** 名完成 Twitter/X + Discord **人工审核** 的用户成为 Seed Creator，得 **$20 Bonus**；可邀请任意多人，**第一个**在绑定后 **3 天内**完成 **首次单笔充值 ≥ $10** 的被邀请人成为 Winner，邀请人与 Winner **各得 $10 Bonus**。Bonus 与 Cash 隔离，不可提现/转现，优先消耗，领取后 **14 天**或活动 **ends_at** 取较早者失效。总预算默认 **$1200**。

金额：库内与多数活动字段用 **credits/cents**（`1 = $0.01`）。`/api/billing/balance` 返回 **美元 float**。下文标清单位。

---

## 1. 角色与部署

| 端 | 进程 | 鉴权 | 职责 |
|---|---|---|---|
| 用户端 Frontend | — | 用户 JWT | 报名、邀请页、绑定、钱包展示 |
| 管理端 Frontend | — | 管理员 JWT | 审核、看板、风控、补发、冻结 |
| Public API | `main` | JWT | `/api/activity/*`、`/api/wallet/bonus`、余额 |
| Admin API | `main_admin` | `require_admin` | `/api/admin/activity/*` |
| Jobs | `main_jobs`（1 副本） | 无业务路由 | 过期、活动结束、发奖重试 |

无跨服务 webhook。充值达标与发奖嵌在 billing 完成事务内（SAVEPOINT 隔离）。

---

## 2. 产品参数（`creator30` 默认）

| 字段 | 默认 | 含义 |
|---|---|---|
| `seed_bonus_cents` | 2000 | 种子通过奖 $20（API **不可改**） |
| `reward_inviter_cents` | 1000 | 邀请人 $10 |
| `reward_invitee_cents` | 1000 | Winner $10 |
| `bonus_ttl_days` | 14 | Bonus 相对有效期 |
| `deposit_window_days` | 3 | 绑定后充值窗口 |
| `min_deposit_cents` | 1000 | 首笔单笔门槛 $10 |
| `seed_cap` | 30 | 种子名额 |
| `budget_cap_cents` | 120000 | 总预算 $1200（含手动补发） |
| `spent_cents` | 累加 | 已花预算（API **不可改**） |

改配置：`PATCH /api/admin/activity/campaigns/creator30` 或改表。  
Bonus 实际过期 = `min(granted_at + ttl, ends_at)`；延长 `ends_at` **不会**延长已发 lot。

---

## 3. 状态机（前后端共用）

### 3.1 Seed（`campaign_seeds.status`）

`submitted` →（人工）`approved` / `rejected`（可再提交）。  
另有 `under_review` / `cancelled`（库支持；当前主路径多为 submitted ↔ approved/rejected）。

审核通过时分配：`seed_rank`、`invite_code`、发 `$20`、`referral_reward_status = waiting_for_winner`。  
驳回（含吊销已通过）：清空 rank/code，`referral_reward_status = expired`。

### 3.2 邀请奖励名额（`referral_reward_status`）

`waiting_for_winner` → `rewarded`（产生 Winner）或 `expired`（活动结束/被拒吊销）。  
每个 Seed **仅一次**邀请开奖机会；并发下只有一个 Winner。

### 3.3 Invitation（`campaign_invites.status`）

```
waiting_for_topup ──(3天内首笔达标)──► qualified ──(发奖成功)──► winner
       │                                    │
       │(超时)                              └──(名额被抢/风控/预算不足)──► no_reward
       ▼
    expired
```

- `qualified` 可停留：达标已落库、发奖失败时由 `reward_retry` 补。
- 同一 Seed 开出 Winner 后，其余仍 `waiting_for_topup` 的邀请会被置 `no_reward`。

### 3.4 Bonus lot（`bonus_lots.status`）

`active` → `depleted`（用尽）/ `expired`（到期）/ `frozen`（风控）。  
扣费：先 Bonus（按 `expires_at` FEFO）再 Cash。Usage 退款退回原 lot；已过期 lot 不恢复、不转 Cash。Top-up 退款只动 Cash。

### 3.5 风险等级

`none | low | med | high`。Seed 与 Invitation **各有**一套。发奖时任一为 `high` 则不自动发，Invitation → `no_reward`。  
**只在开奖时读**；开奖后再标无效。追回已发额度用 **freeze lot**。

---

## 4. 通用 API 约定

### 响应信封

```json
{ "code": 0, "message": "ok", "data": <下文响应体> }
```

错误：`{ "code": <HTTP>, "message": "<本地化>", "data": null }`（`Accept-Language`: `en-US` / `zh-CN`）。  
下文「响应」= `data`。错误表里的是消息 id；前端用 HTTP/`code` + 业务分支，勿硬编码英文。

### 鉴权

| 端 | Header |
|---|---|
| 用户 | `Authorization: Bearer <access_token>` |
| 管理 | 同上，且库内 `role=admin` |

### 「当前活动」

用户端 + 管理端 Dashboard/手动补发：`state <> 'draft'` 中 `created_at` 最新一行。  
草稿仅出现在 `GET /api/admin/activity/campaigns`。无活动 → `404 no_campaign_configured`。

---

## 5. 用户端 API（Public）

### 5.1 `GET /api/activity/seed-creator`

活动信息 + 我的报名。未报名 `me = null`。

```json
{
  "campaign": {
    "id": "creator30",
    "state": "active",
    "seed_cap": 30,
    "seed_approved": 26,
    "ends_at": "..."
  },
  "me": {
    "status": "approved",
    "seed_rank": 7,
    "invite_code": "ABC123",
    "referral_reward_status": "waiting_for_winner"
  }
}
```

错误：`404 no_campaign_configured`

---

### 5.2 `POST /api/activity/seed-creator/submit`

报名/更新。活动须 `active`。四字段均可选，**至少一个非空**，否则 `422`。

```json
{
  "twitter_username": "alice",
  "twitter_url": "https://x.com/alice",
  "discord_username": "alice#0001",
  "discord_user_id": "123456789012345678"
}
```

长度上限：100 / 500 / 100 / 64。  
响应：`{ "status": "submitted" }`  
错误：`400 campaign_closed`，`409 already_approved`，`404 no_campaign_configured`

已 `approved` 不可覆盖；被拒可再交。

---

### 5.3 `GET /api/activity/referral`

仅已通过且有 `invite_code` 的 Seed Creator。

```json
{
  "invite_code": "ABC123",
  "invite_url": "https://varo.cloud/invite/ABC123",
  "invited_count": 12,
  "referral_reward_status": "waiting_for_winner"
}
```

`invite_url` = `{FRONTEND_URL}/invite/{code}`。  
错误：`404 not_a_seed_creator` / `no_campaign_configured`

---

### 5.4 `GET /api/activity/referral/invitations`

我作为邀请人的列表（非 Seed 返回 `[]`）。

```json
[
  {
    "invitee_masked": "al***",
    "registered": true,
    "topped_up": false,
    "status": "waiting_for_topup",
    "deadline": "..."
  }
]
```

`invitee_masked`：邮箱本地部分打码。`topped_up`：是否有首充记录。

---

### 5.5 `POST /api/activity/referral/bind`

新用户首登后由**前端主动调用**（后端不改 `verify_otp`）。

请求：`{ "code": "ABC123" }`  
成功：`{ "bound": true }`

| HTTP | id | 含义 |
|---|---|---|
| 400 | `invalid_code` | 码无效 / Seed 未通过 |
| 400 | `campaign_closed` | 活动关闭 |
| 400 | `self_invite` | 自邀 |
| 400 | `not_fresh` | 已有成功充值 |
| 409 | `already_bound` | 已绑定 |

一账号只能绑一个邀请人。须在产生首笔成功充值**之前**绑定。

---

### 5.6 `GET /api/wallet/bonus`

单位：**cents**。

```json
{
  "total_bonus_cents": 3000,
  "grants": [
    {
      "source": "seed_bonus",
      "amount_cents": 2000,
      "remaining_cents": 2000,
      "expires_at": "...",
      "status": "active"
    }
  ]
}
```

`source`：`seed_bonus` | `inviter_reward` | `invitee_reward` | `manual`

---

### 5.7 `GET /api/billing/balance`（钱包展示，非裂变专用）

单位：**美元 float**。

```json
{
  "cash": 10.0,
  "bonus": 30.0,
  "bonus_expires_at": "...",
  "total": 40.0,
  "balance_usd": 40.0
}
```

换算：`cents / 100 = USD`。`profile` / `billing/summary` 的 `balance_usd` 也是总额，并带 `cash_usd` / `bonus_usd`。  
**管理端用户列表的 `balance_usd` 只表示 Cash**，Bonus 在 `bonus_usd`——与用户端不同。

---

## 6. 管理端 API（Admin）

前缀：`/api/admin/activity`。写操作写审计日志。

### 6.1 `GET /campaigns`

含 draft。响应：`{ "items": [Campaign...] }`  
Campaign 字段：`id, name, state, seed_bonus_cents, reward_inviter_cents, reward_invitee_cents, bonus_ttl_days, deposit_window_days, min_deposit_cents, seed_cap, budget_cap_cents, spent_cents, starts_at, ends_at, created_at`

### 6.2 `PATCH /campaigns/{campaign_id}`

白名单：`name, state, seed_cap, budget_cap_cents, bonus_ttl_days, deposit_window_days, min_deposit_cents, reward_inviter_cents, reward_invitee_cents, starts_at, ends_at`  
不可改：`spent_cents`、`seed_bonus_cents`。  
`state` ∈ `draft|active|ended`。非法字段 → `400 invalid_campaign_field`；非法 state → `invalid_state`；无记录 → `404 not_found`。  
响应：完整 Campaign。

### 6.3 `GET /seed-creators`

Query：`status?`，`campaign_id?`，`offset`（默认 0），`limit`（默认 20，1–100）。  
响应：`{ items, total, offset, limit }`  
item：`id, user_id, campaign_id, seed_rank, status, twitter_*, discord_*, submitted_at, reviewer_id, reviewed_at, reject_reason, risk_level, risk_note`

### 6.4 `POST /seed-creators/{seed_id}/review`

```json
{
  "decision": "approve",
  "twitter_verified": true,
  "discord_verified": true,
  "reject_reason": null
}
```

`decision` 仅 `approve|reject`。  
approve 成功：`{ "status": "approved", "seed_rank", "invite_code" }`；幂等重试带 `"idempotent": true`。  
reject 成功：`{ "status": "rejected" }`（同时吊销码与名额）。  
错误：`not_found` / `campaign_closed` / `seed_cap_reached` / `budget_exceeded` / `invalid_decision`

### 6.5 `POST /seed-creators/{seed_id}/risk`

`{ "level": "high", "note": "..." }` → `{ "level": "high" }`  
level ∈ `none|low|med|high`。创作者刷量用此接口（连坐整个 Seed）。

### 6.6 `GET /invitations`

Query：`campaign_id?`，分页同左。  
item：`id, campaign_id, seed_id, inviter_user_id, invitee_user_id, status, registered_at, deposit_deadline, qualified_at, first_topup_cents, first_topup_at, is_winner`  
**不返回** `risk_level`/`risk_note`（可写不可读回；查 SQL 或审计）。

### 6.7 `POST /invitations/{invite_id}/risk`

同 6.5。仅拦被邀请人，保留 Seed 名额。审计 `invite_risk`。

### 6.8 `GET /bonus-grants`

Query：`user_id?`，`campaign_id?`，分页。  
item：`id, user_id, source, amount_granted_cents, amount_remaining_cents, granted_at, expires_at, status`

### 6.9 `GET /dashboard`

当前活动聚合。无活动 → `404 no_campaign_configured`。

| 字段 | 含义 |
|---|---|
| `seed_cap` / `seed_approved` / `seed_pending` | 名额 / 已过 / 待审 |
| `invited_users` | 邀请总数 |
| `qualified` / `winners` / `no_reward` | 达标待发 / 已中 / 未中 |
| `qualified_total` | 三者之和 |
| `*_issued_cents` / `total_issued_cents` | 发放额（含 manual） |
| `budget_cap_cents` / `spent_cents` / `remaining_budget_cents` | 预算 |

### 6.10 `POST /bonus/grant`

与自动奖共用预算。

```json
{
  "user_id": "<uuid>",
  "cents": 1000,
  "reason": "补发",
  "idempotency_key": "makeup-<invite_id>"
}
```

`cents`：1…10_000_000。  
首次：`{ lot_id, business_key }`；幂等：`{ lot_id: null, business_key, idempotent: true }`  
错误：`no_campaign_configured` / `budget_exceeded`

### 6.11 `POST /bonus/{lot_id}/freeze` · `/unfreeze`

成功：`{ lot_id, status }`（freeze→`frozen`；unfreeze→`active`|`depleted`）。  
错误：`404 not_found`，`409 invalid_lot_state`。冻结仍会到期，解冻不复活已过期 lot。

---

## 7. 错误码总表

| 消息 id | HTTP | 位置 |
|---|---|---|
| `no_campaign_configured` | 404 | 用户活动、dashboard、grant |
| `campaign_closed` | 400 | 报名、绑定、审核 |
| `not_a_seed_creator` | 404 | GET referral |
| `invalid_code` / `self_invite` / `not_fresh` | 400 | bind |
| `already_bound` | 409 | bind |
| `already_approved` | 409 | submit |
| `invalid_decision` | 400 | review |
| `invalid_level` | 400 | risk |
| `seed_cap_reached` / `budget_exceeded` | 400 | review、grant |
| `invalid_campaign_field` / `invalid_state` | 400 | PATCH campaign |
| `invalid_lot_state` | 409 | freeze/unfreeze |
| `not_found` | 404 | 资源不存在 |

文案：`app/locale.py`（en-US / zh-CN）。

---

## 8. 前端对接流程

### 8.1 用户端页面

```
落地页 GET /activity/seed-creator
  ├─ me == null          → 报名表单 → POST /submit
  ├─ submitted/under_review → 审核中
  ├─ rejected            → 可再报名
  ├─ approved            → 邀请页 GET /referral + /invitations，分享 invite_url
  └─ campaign.ended      → 只读结束态

被邀请人：打开 /invite/{code} → 注册/登录拿 JWT → 立刻 POST /referral/bind
  → 引导 3 天内完成首笔单笔 ≥ $10 真实充值（Stripe/NOWPayments 成功单）

钱包：顶栏 GET /billing/balance（USD）；明细 GET /wallet/bonus（cents÷100）
```

### 8.2 管理端页面

```
Dashboard → GET /dashboard
审核队列 → GET /seed-creators?status=submitted → POST .../review
邀请表   → GET /invitations；可疑 invitee → POST .../invitations/{id}/risk
创作者刷量 → POST .../seed-creators/{id}/risk
补发     → POST /bonus/grant（固定 idempotency_key）
追回额度 → GET /bonus-grants 找 lot → POST .../freeze
活动参数 → GET/PATCH /campaigns
```

### 8.3 前端不调用的部分

充值完成后的达标（`on_topup_completed`）与发奖（`award_referral`）在 billing 事务内自动执行；失败由 `reward_retry` 补。前端只需保证 **先 bind、再充值**。

---

## 9. 后端内部（实现与联调）

### 9.1 模块地图

| 模块 | 作用 |
|---|---|
| `app/referral.py` | 报名、审核、绑定、达标、发奖、invite/campaign/reward sweep |
| `app/bonus.py` | grant / FEFO spend / refund_to_lot / freeze / expire |
| `app/credits.py` | `deduct_credits`：先 Bonus 后 Cash |
| `app/routers/billing.py` | 充值完成 → `_reward_referral`（两段 SAVEPOINT） |
| `app/jobs.py` | 统一调度；仅 `main_jobs` 拉起 |
| 表 | `campaigns`, `campaign_seeds`, `campaign_invites`, `bonus_lots`, `bonus_ledger`, `job_runs` |

### 9.2 充值钩子（达标与发奖拆分）

同一外层事务、`grant_credits` 之后：

1. **SAVEPOINT qualify** → `referral.on_topup_completed`：首笔 completed 且 ≥ 门槛、窗口内、`completed_at ≤ ends_at`、活动 `active` → Invitation `qualified`。异常回滚到 SAVEPOINT，**充值仍提交**。
2. **SAVEPOINT award** → `referral.award_referral`：锁序 campaign → invite → seed；挑 Winner、发两笔 Bonus、累加 `spent_cents`、同 Seed 其余 waiting → `no_reward`。失败不回滚达标，留给 `reward_retry`。

首充**只认** `transactions.status='completed'` 的真实充值单；不累计多笔；非首笔不达标。

幂等 `business_key`：

- Seed：`SEED_CREATOR_REWARD:{user_id}:{campaign_id}`
- 邀请人：`REFERRAL_INVITER:{invite_id}`
- 被邀请人：`REFERRAL_INVITEE:{invite_id}`
- 手动：`MANUAL:{idempotency_key}`

### 9.3 定时任务（间隔约 600s + jitter）

| job_name | 行为 |
|---|---|
| `bonus_expire` | active/frozen 且到期 → expired，清零，写 ledger |
| `invite_expire` | waiting 且过 deadline → expired |
| `campaign_end` | active 且 `now ≥ ends_at` → `state=ended` |
| `reward_retry` | 认领 `qualified` 且 seed 仍 waiting_for_winner → `award_referral` |
| （另有 oauth_cleanup / cost_settle） | 与裂变无关，同进程 |

认领一律 `FOR UPDATE SKIP LOCKED`。执行记录进 `job_runs`。

### 9.4 审核通过要点（后端）

锁序 campaign → seed。名额取 **1..seed_cap 最低空闲 rank**（非 count+1，避免驳回后撞唯一索引）。`seed_bonus_cents=0` 合法，跳过 grant 不累 spent。重复 approve 短路返回原 rank/code。

### 9.5 管理端余额语义差异

用户侧 `balance_usd` = Cash+Bonus；管理端用户列表/详情 `balance_usd` = **仅 Cash**，`bonus_usd` 另列——因余额调整只写 Cash。

---

## 10. 运营铁律（后端/Ops，摘自 runbook）

1. **`ends_at` 要比最后一次绑定多留至少一个充值窗口（3 天）**；上线后勿缩短。
2. **排空前勿把 `state` 从 `active` 改掉。** 排空查询：
   ```sql
   SELECT status, count(*) FROM genflow.campaign_invites
   WHERE campaign_id = 'creator30'
     AND status IN ('waiting_for_topup','qualified')
   GROUP BY status;
   ```
   两计数须为 0。`qualified` 久不清查 `job_runs` 的 `reward_retry`。
3. **收口用 `seed_cap`，不要用 `state`。** `on_topup_completed` 见非 active 直接放弃，首充只有一次，暂停期付款者资格永久丢失。
4. **只驳回 `submitted` 种子。** 驳已通过会留下挂死链接的 waiting 邀请；须先排空或手动 `expired`。
5. **风控优先打 Invitation，再打 Seed。** 开奖前有效；开奖后只能 freeze lot。
6. **手动补发用确定性 `idempotency_key`**（如 `makeup-<invite_id>`），与自动奖共预算。

节流示例（不改 state）：

```sql
UPDATE genflow.campaigns
SET seed_cap = (SELECT count(*) FROM genflow.campaign_seeds
                WHERE campaign_id = 'creator30' AND status = 'approved')
WHERE id = 'creator30';
```

邀请风控只读路径（列表 API 未透出）：

```sql
SELECT id, invitee_user_id, status, risk_level, risk_note, updated_at
FROM genflow.campaign_invites
WHERE campaign_id = 'creator30' AND risk_level <> 'none';
```

---

## 11. 接口清单

**用户端**

| Method | Path |
|---|---|
| GET | `/api/activity/seed-creator` |
| POST | `/api/activity/seed-creator/submit` |
| GET | `/api/activity/referral` |
| GET | `/api/activity/referral/invitations` |
| POST | `/api/activity/referral/bind` |
| GET | `/api/wallet/bonus` |
| GET | `/api/billing/balance` |

**管理端**

| Method | Path |
|---|---|
| GET | `/api/admin/activity/campaigns` |
| PATCH | `/api/admin/activity/campaigns/{id}` |
| GET | `/api/admin/activity/seed-creators` |
| POST | `/api/admin/activity/seed-creators/{id}/review` |
| POST | `/api/admin/activity/seed-creators/{id}/risk` |
| GET | `/api/admin/activity/invitations` |
| POST | `/api/admin/activity/invitations/{id}/risk` |
| GET | `/api/admin/activity/bonus-grants` |
| GET | `/api/admin/activity/dashboard` |
| POST | `/api/admin/activity/bonus/grant` |
| POST | `/api/admin/activity/bonus/{lot_id}/freeze` |
| POST | `/api/admin/activity/bonus/{lot_id}/unfreeze` |

---

## 12. 验收对照（前后端联调 Checklist）

- [ ] 报名：至少一社交字段；活动非 active 拒绝；已通过再提交 409
- [ ] 审核：第 31 名 `seed_cap_reached`；通过得 $20 Bonus lot；幂等不双发
- [ ] 绑定：首登后 bind；已充值 / 自邀 / 重复绑定 被拒
- [ ] 首充：仅首笔 completed ≥ $10；窗口 3 天；并发仅一 Winner，双方各 $10
- [ ] 后续邀请 / 超时 → `no_reward` / `expired`，不耗第二次名额（名额已耗尽后）
- [ ] 钱包：Bonus 优先扣；余额拆分展示；过期后不可用
- [ ] 管理：dashboard 数字、手动 grant 幂等、freeze 后不可消费
- [ ] 结束：排空 waiting/qualified 后再 ended；jobs 在跑

管理端前缀：`/api/admin/activity`。用户端前缀：`/api/activity`（Bonus 钱包在 `/api/wallet/bonus`）。
