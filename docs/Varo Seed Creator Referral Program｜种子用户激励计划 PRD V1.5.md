# Varo Seed Creator Referral Program
## 种子用户激励计划｜产品需求文档

**文档版本：** V1.5  
**文档状态：** MVP / 待开发  
**活动类型：** 种子用户招募 + 社交验证 + 多人邀请 + 首充激励  
**活动周期：** T ～ T+30  
**Seed Creator 上限：** 30 人  
**Seed Creator 奖励：** $20 Bonus  
**每个 Seed Creator 邀请奖励机会：** 1 次  
**单次邀请成功奖励：** 邀请人与被邀请人各 $10 Bonus  
**被邀请用户邀请有效期：** 注册后 3 天  
**Bonus 有效期：** 领取后 14 天，且不晚于活动结束时间 T+30  
**活动预算上限：** $1,200

---

# 1. 活动概览

## 1.1 活动背景

Varo 希望通过第一批种子用户活动获取：

- 第一批高质量种子用户
- 第一批真实付费用户
- Twitter/X 与 Discord 社区用户
- 产品早期反馈

活动通过“Seed Creator + 多人邀请 + 首充奖励”的方式形成增长闭环。

---

# 1.2 活动目标

第一期活动目标：

| 指标 | 目标 |
|---|---:|
| Seed Creator | 30 人 |
| 成功邀请用户 | ≥30 人 |
| 成功首充用户 | ≥30 人 |
| 活动最大预算 | $1,200 |

---

# 1.3 一句话规则

> **前 30 名完成 Twitter/X + Discord 人工验证并审核通过的用户成为 Seed Creator，获得 $20 Bonus；Seed Creator 可以邀请任意多个好友，第一个在注册后 3 天内完成首次单笔充值 ≥ $10 的好友成为 Winner，Seed Creator 与 Winner 各获得 $10 Bonus；所有 Bonus 与用户真实充值余额分离，不可提现、不可退款，并在领取后 14 天或活动结束 T+30 时取较早时间自动失效。**

---

# 1.4 核心流程图

```text
                    活动开始 T
                         │
                         ▼
                 前 30 名用户报名
                         │
                         ▼
              Twitter/X + Discord 验证
                         │
                         ▼
                     人工审核
                         │
                         ▼
                  成为 Seed Creator
                         │
                         ▼
                    获得 $20 Bonus
                         │
                         ▼
                 获得专属邀请链接
                         │
                 可以邀请任意多个好友
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
        用户 A          用户 B         用户 C
          │              │              │
        注册            注册            注册
          │              │              │
       3天有效期       3天有效期       3天有效期
          │              │              │
          ▼              ▼              ▼
    首充 ≥ $10？     首充 ≥ $10？     首充 ≥ $10？
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                第一个完成条件的人
                         │
                    成为 Winner
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       Seed Creator +$10      Winner +$10
              │                     │
              └──────────┬──────────┘
                         ▼
                邀请奖励机会已使用
                         │
                         ▼
       后续被邀请用户即使达标也不再奖励
```

**关键理解：**

> Seed Creator 可以邀请很多人，也可以同时有很多人注册。  
> “1 次邀请奖励机会”不是“只能邀请 1 个人”，而是“最多只有 1 个 Winner”。

---

# 2. 用户参与流程

## 2.1 Seed Creator 流程

```text
进入活动页面
    ↓
注册 / 登录 Varo
    ↓
提交 Twitter/X
    ↓
提交 Discord
    ↓
提交审核
    ↓
人工审核
    ↓
审核通过
    ↓
获得 $20 Bonus
    ↓
生成专属邀请链接
    ↓
可以邀请多个好友
    ↓
等待第一个好友完成首充
    ↓
获得 $10 Bonus
```

注意：

> 邀请链接可以持续分享，不会因为某个人注册而失效。

---

# 2.2 被邀请用户流程

```text
点击 Seed Creator 邀请链接
       ↓
注册 Varo
       ↓
绑定邀请关系
       ↓
进入 3 天观察期
       ↓
完成活动要求
       ↓
首次单笔充值 ≥ $10
       ↓
判断是否为该 Seed Creator 第一个成功邀请
       ↓
        ┌─────────────┐
        │             │
       是             否
        │             │
        ▼             ▼
     Winner        NO_REWARD
        │
        ▼
自己 +$10 Bonus
邀请人 +$10 Bonus
```

---

# 2.3 邀请奖励流程

一个 Seed Creator 可以同时邀请多个人：

```text
Seed Creator
      │
      └── ABC123 专属邀请链接
              │
      ┌───────┼────────┬────────┐
      ▼       ▼        ▼        ▼
      A       B        C        D
      │       │        │        │
     注册    注册     注册     注册
      │       │        │        │
    3天期   3天期    3天期    3天期
      │       │        │        │
      ▼       ▼        ▼        ▼
    首充?    首充?    首充?    首充?
      │       │        │        │
      └───────┴────────┴────────┘
                      │
                      ▼
             第一个 Qualified 用户
                      │
                      ▼
                   WINNER
                  /       \
                 /         \
                ▼           ▼
        Inviter +$10     Winner +$10
                      │
                      ▼
               奖励机会消耗
```

---

# 2.4 邀请失效流程

每个被邀请用户都有自己独立的 3 天有效期。

例如：

```text
Alice 邀请 Bob
        ↓
Bob 注册
        ↓
开始 3 天倒计时
        ↓
      ┌───────┴───────┐
      ▼               ▼
3天内首充≥$10      3天内未首充
      │               │
      ▼               ▼
   Winner           EXPIRED
```

Invitation 失效：

> 只影响 Bob 这一条邀请关系。

不会影响：

> Alice 继续邀请其他用户。

---

# 2.5 Bonus 使用与过期流程

```text
获得 Bonus
    ↓
Bonus Grant
    ↓
ACTIVE
    ↓
┌───────────────┬────────────────┐
▼                                ▼
用户消费                         到期
│                                │
▼                                ▼
剩余额度减少                   EXPIRED
│                                │
├── 剩余 > 0 → ACTIVE             └→ 剩余额度清零
│
└── 剩余 = 0 → DEPLETED
```

Bonus 有效期：

> 领取后 14 天，或活动结束 T+30，取较早时间。

---

# 3. 活动规则

## 3.1 Seed Creator 规则

| 规则 | 说明 |
|---|---|
| Seed Creator 数量 | 前 30 名 |
| 参加条件 | 注册 + Twitter/X + Discord |
| 验证方式 | 人工审核 |
| Seed Creator 奖励 | $20 Bonus |
| 邀请人数 | 不限 |
| 邀请链接 | 每个 Seed Creator 1 个 |
| 邀请奖励机会 | 每个 Seed Creator 1 次 |

---

# 3.2 社交验证规则

用户需要提交：

### Twitter/X

- Username
- Profile URL

管理员确认：

> 用户是否关注 Varo 官方 Twitter/X。

### Discord

- Username
- Discord User ID

管理员确认：

> 用户是否加入 Varo 官方 Discord。

第一期：

> 不开发 Twitter/X、Discord 自动验证。

采用：

> **用户提交 + 后台人工审核。**

---

# 3.3 Seed Creator 奖励规则

审核通过后：

> 获得 $20 Bonus。

奖励进入：

> Bonus Wallet

而不是：

> Cash Wallet。

---

# 3.4 邀请规则

Seed Creator：

> 可以邀请任意多个用户。

使用同一个专属邀请链接：

```text
https://varo.cloud/invite/ABC123
```

例如：

```text
ABC123
├── User A
├── User B
├── User C
├── User D
└── User E
```

---

# 3.5 邀请奖励机会规则

每个 Seed Creator：

> 只有 1 次邀请奖励机会。

但该机会在以下行为发生时**不会消耗**：

- 点击邀请链接
- 注册
- 建立邀请关系
- 邀请多个用户
- 某个邀请关系过期

只有：

> **某个 Invitee 成为 Winner 后，邀请奖励机会才会消耗。**

---

# 3.6 邀请有效期

被邀请用户完成注册并绑定邀请关系后：

> 3 天内完成首次单笔充值 ≥ $10。

超过 3 天：

> 该 Invitation 自动失效。

---

# 3.7 Invitee 首充规则

必须满足：

```text
支付状态 = SUCCESS
```

并且：

```text
首次单笔充值金额 >= $10
```

并且：

```text
充值成功时间 <= 邀请关系建立时间 + 3 天
```

---

# 3.8 不支持累计充值

例如：

```text
第一次 $5
+
第二次 $5
=
$10
```

不算达标。

必须：

> **首次单笔真实充值 ≥ $10。**

---

# 3.9 Winner 规则

Winner 定义：

> **该 Seed Creator 所有有效邀请关系中，第一个完成全部活动条件的 Invitee。**

判断依据：

> `qualified_at`

而不是：

- 最先注册
- 最先点击链接
- 最先提交资料

---

# 3.10 Winner 奖励

Winner 产生后：

```text
Seed Creator +$10 Bonus
Winner +$10 Bonus
```

两笔奖励分别创建独立 Bonus Grant。

---

# 3.11 Winner 产生后的处理

Winner 产生后：

> Seed Creator 的邀请奖励机会立即消耗。

后续 Invitee：

> 即使完成全部活动条件，也不再获得奖励。

其状态：

> `NO_REWARD`

但 Invitation 记录仍保留，用于数据统计和风控。

---

# 3.12 邀请失效规则

如果某个 Invitee：

> 3 天内没有完成首次单笔充值 ≥ $10。

则：

```text
Invitation = EXPIRED
```

该 Invitee 不获得奖励。

同时：

> 不影响 Seed Creator 继续邀请其他人。

---

# 3.13 Bonus 规则

Bonus 是：

> **平台赠送额度。**

Bonus：

- 不可提现
- 不可退款
- 不属于用户充值金额
- 优先于 Cash 消耗
- 有独立有效期
- 到期后未使用部分自动清零

---

# 3.14 Bonus 有效期

每笔 Bonus：

> **领取后 14 天有效。**

但是：

> 活动结束 T+30 是绝对截止时间。

最终到期时间：

```text
Expire Time
=
MIN(
    Grant Time + 14 Days,
    Activity End Time
)
```

---

# 3.15 活动结束规则

T+30 活动结束后：

- 停止新增 Seed Creator
- 停止新增 Winner
- 停止新增活动奖励
- 所有未使用 Bonus 自动清零

例如：

```text
Bonus 剩余 $8
原本还剩 5 天
活动 T+30 到达
        ↓
$8 自动失效
```

---

# 3.16 Bonus 消费规则

用户同时有 Cash 和 Bonus 时：

> **优先使用 Bonus。**

如果有多笔 Bonus：

> **优先使用最早过期的 Bonus。**

即：

> FEFO（First Expired, First Out）。

---

# 3.17 资金规则

用户钱包分成：

```text
Cash
+
Bonus
=
Total Balance
```

例如：

```text
Cash   $100
Bonus   $30
------------
Total  $130
```

但是：

> **可退款金额不等于 $130。**

可退款金额只能来自：

> Cash。

---

# 3.18 Cash 规则

Cash 来源：

> 用户真实充值。

Cash：

- 进入 Cash Ledger
- 与充值订单绑定
- 可以按照正常业务规则退款
- 不属于活动赠送额度

---

# 3.19 Bonus 规则

Bonus 来源：

- Seed Creator $20
- Inviter $10
- Winner $10

Bonus：

- 不能提现
- 不能退款
- 不能转换为 Cash
- 不参与退款计算
- 30 天活动结束时强制失效
- 单笔 Bonus 最长有效 14 天

---

# 3.20 预算规则

最大预算：

```text
Seed Creator
30 × $20 = $600
```

邀请奖励：

```text
30 × ($10 + $10) = $600
```

总预算：

```text
$600 + $600
=
$1,200
```

注意：

> 被邀请人数可以远大于 30，但每个 Seed Creator 最多产生一次邀请奖励，因此总奖励预算仍然最多为 $600。

---

# 4. 产品页面

## 4.1 活动首页

### 页面目标

让用户快速理解：

> 我是谁、能得到什么、怎么参加。

### 页面内容

**标题：**

> Become a Varo Seed Creator

**核心权益：**

> 前 30 名完成验证用户获得 $20 Bonus

**活动步骤：**

```text
注册
→ 社交验证
→ 人工审核
→ 获得 $20
→ 邀请好友
→ 首位成功邀请触发 $10/$10
```

CTA：

> **立即参加**

---

# 4.2 Seed Creator 页面

审核通过后展示：

```text
🎉 You are a Varo Seed Creator

$20 Bonus
```

同时显示：

### 我的邀请

```text
邀请人数：12
```

### 我的邀请链接

```text
https://varo.cloud/invite/ABC123
```

按钮：

> 复制邀请链接

### 邀请奖励状态

未产生 Winner：

> 等待首位成功邀请

已产生 Winner：

> 邀请奖励已领取

---

# 4.3 邀请列表

展示：

| 用户 | 注册 | 首充 | 状态 |
|---|---|---|---|
| Alice | ✅ | ❌ | 3 天观察中 |
| Bob | ✅ | ✅ | Winner |
| Carol | ✅ | ❌ | 已失效 |
| David | ✅ | ✅ | 无奖励 |

---

# 4.4 被邀请用户页面

用户通过邀请码进入：

> 你正在通过 Alice 的邀请参加 Varo 活动。

展示：

```text
注册
↓
完成活动要求
↓
3天内首次单笔充值 ≥ $10
```

状态：

> **距离邀请有效期结束还有 2 天 6 小时**

---

# 4.5 Winner 页面

如果用户成为 Winner：

> 🎉 Congratulations!

> You are the first successful invitee.

展示：

```text
Your Bonus
+$10
```

并说明：

> 邀请人同时获得 $10 Bonus。

---

# 4.6 NO_REWARD 页面

如果用户后续达标：

> 你已经完成活动条件。

> 但该邀请奖励已由其他用户先触发，本次不再发放 Bonus。

---

# 4.7 Bonus 页面

展示：

```text
Total Bonus
$30
```

分批展示：

```text
$20
Seed Creator Bonus
Expires in 5 days

$10
Referral Bonus
Expires in 12 days
```

说明：

> Bonus 不可提现、不可退款，并将在有效期结束后自动失效。

---

# 4.8 后台 Seed Creator 审核

管理员可以查看：

| 字段 | 说明 |
|---|---|
| User ID | 用户 ID |
| Seed Rank | Seed Creator 排名 |
| Twitter/X | 用户账号 |
| Twitter URL | Profile |
| Discord | Discord 信息 |
| 提交时间 | 申请时间 |
| 状态 | 待审核 / 通过 / 拒绝 |
| 审核人 | 管理员 |
| 审核时间 | 审核时间 |
| 拒绝原因 | 原因 |

操作：

> 通过 / 拒绝

---

# 4.9 后台 Invitation

| Seed Creator | Invitee | 注册 | 首充 | 状态 | Winner |
|---|---|---|---|---|---|
| Alice | Bob | ✅ | ✅ | WINNER | ✅ |
| Alice | Carol | ✅ | ❌ | WAITING | ❌ |
| Alice | David | ✅ | ❌ | EXPIRED | ❌ |
| Alice | Emma | ✅ | ✅ | NO_REWARD | ❌ |

---

# 4.10 后台 Bonus Grant

| 用户 | 来源 | 原始额度 | 剩余 | 创建时间 | 到期时间 | 状态 |
|---|---|---:|---:|---|---|---|
| Alice | Seed Creator | $20 | $8 | 8/12 | 8/26 | ACTIVE |
| Alice | Referral | $10 | $10 | 8/15 | 8/29 | ACTIVE |
| Bob | Referral | $10 | $0 | 8/15 | 8/29 | DEPLETED |

---

# 4.11 活动 Dashboard

建议展示：

```text
Seed Creator
30 / 30

Approved
26

Pending Review
4

Invited Users
128

Qualified Users
18

Winners
18 / 30

Seed Creator Bonus
$520 / $600

Referral Bonus
$360 / $600

Total Bonus Issued
$880

Remaining Budget
$320
```

其中：

> `Invited Users` 可以远大于 30。

因为 Seed Creator 可以邀请多人。

---

# 5. 核心数据与状态

## 5.1 Seed Creator 状态机

```text
NOT_JOINED
    ↓
REGISTERED
    ↓
SUBMITTED
    ↓
UNDER_REVIEW
    ↓
APPROVED
    ↓
REWARDED
```

异常：

```text
REJECTED
CANCELLED
```

---

# 5.2 Invitation 状态机

```text
INVITED
    ↓
REGISTERED
    ↓
WAITING_FOR_TOPUP
    ↓
┌──────────────────┐
│                  │
QUALIFIED        EXPIRED
│
↓
┌──────────────────┐
│                  │
WINNER           NO_REWARD
```

### 状态说明

**INVITED**

用户点击邀请链接。

**REGISTERED**

用户完成注册，并绑定邀请人。

**WAITING_FOR_TOPUP**

等待用户完成 3 天内首充 ≥ $10。

**QUALIFIED**

用户满足全部条件。

**WINNER**

该 Seed Creator 下第一个成功完成条件的用户。

**NO_REWARD**

用户满足条件，但 Winner 已经产生。

**EXPIRED**

3 天内没有完成首充条件。

---

# 5.3 Seed Creator 邀请奖励状态

```text
WAITING_FOR_WINNER
        ↓
REWARDED
```

活动结束：

```text
WAITING_FOR_WINNER
        ↓
EXPIRED
```

注意：

> 创建 Invitation 不会改变该状态。

只有 Winner 产生时才变成：

> `REWARDED`

---

# 5.4 Bonus 状态机

```text
PENDING
    ↓
ACTIVE
    ↓
┌──────────────┬──────────────┐
▼                             ▼
消费                          到期
│                             │
▼                             ▼
DEPLETED                    EXPIRED
```

特殊状态：

```text
FROZEN
```

用于风控。

---

# 5.5 数据模型

## activity_participant

```text
id
user_id

seed_rank
status

twitter_username
twitter_profile_url
twitter_verified

discord_username
discord_user_id
discord_verified

invite_code

referral_reward_status
winning_invitee_id
winning_invitation_id
referral_rewarded_at

submitted_at
reviewed_at
reviewer_id
reject_reason

created_at
updated_at
```

---

## activity_invitation

```text
id

invite_code
inviter_id
invitee_id

registered_at
qualified_at
expired_at

first_topup_order_id
first_topup_amount
first_topup_at

qualification_status
is_winner

created_at
updated_at
```

数据库约束：

```text
UNIQUE(invitee_id)
```

保证：

> 一个 Invitee 只能绑定一个 Inviter。

---

## reward

```text
id
user_id

reward_type
amount
wallet_type

business_key
status

created_at
updated_at
```

---

## bonus_grant

```text
id
user_id

grant_type
source
source_id

original_amount
remaining_amount

start_at
expire_at

status

created_at
updated_at
```

---

## wallet

```text
user_id

cash_balance
bonus_balance

updated_at
```

其中：

> `bonus_balance` 可以作为 ACTIVE Bonus Grant 的汇总缓存，真正的资金来源以 `bonus_grant + wallet_ledger` 为准。

---

## wallet_ledger

```text
id
user_id

wallet_type
ledger_type

amount

source
source_id

balance_before
balance_after

created_at
```

---

# 6. 系统实现

## 6.1 核心 API

### 获取活动状态

```http
GET /api/activity/seed-creator
```

### 提交 Seed Creator 申请

```http
POST /api/activity/seed-creator/submit
```

### 获取邀请信息

```http
GET /api/activity/referral
```

### 获取邀请列表

```http
GET /api/activity/referral/invitations
```

### 获取 Bonus

```http
GET /api/wallet/bonus
```

---

# 6.2 支付事件

支付系统发送：

```text
TOPUP_SUCCESS
```

活动系统收到后判断：

```text
是否存在有效 Invitation
        ↓
是否完成活动要求
        ↓
是否首次单笔充值 ≥ $10
        ↓
是否在 3 天有效期内
        ↓
Seed Creator 是否已经产生 Winner
```

---

# 6.3 Winner 判定流程

```text
TOPUP_SUCCESS
      ↓
找到 Invitation
      ↓
检查 Invitation 是否过期
      ↓
检查是否首次单笔充值 ≥ $10
      ↓
生成 qualified_at
      ↓
锁定 Inviter Participant
      ↓
检查 referral_reward_status
      ↓
┌────────────────────┐
│                    │
WAITING_FOR_WINNER  REWARDED
│                    │
↓                    ↓
WINNER              NO_REWARD
│
├── Inviter +$10 Bonus
└── Invitee +$10 Bonus
```

---

# 6.4 并发控制

如果两个 Invitee 几乎同时满足条件：

```text
Bob → TOPUP_SUCCESS
Carol → TOPUP_SUCCESS
```

系统必须保证：

> **只能有一个 Winner。**

推荐：

```text
BEGIN TRANSACTION

SELECT participant
FOR UPDATE
```

检查：

```text
referral_reward_status
```

如果仍然：

```text
WAITING_FOR_WINNER
```

则：

> 当前 Invitee 成为 Winner。

然后：

```text
referral_reward_status = REWARDED
```

之后所有请求：

> `NO_REWARD`

---

# 6.5 邀请过期任务

定时任务扫描：

```text
status = WAITING_FOR_TOPUP
AND
registered_at + 3 days <= NOW()
```

执行：

```text
Invitation
→ EXPIRED
```

注意：

> 不修改 Seed Creator 的奖励机会状态。

如果此前没有 Winner：

> 继续保持 `WAITING_FOR_WINNER`。

---

# 6.6 Bonus 过期任务

定时任务扫描：

```text
status = ACTIVE
AND
expire_at <= NOW()
```

执行：

```text
remaining_amount = 0
status = EXPIRED
```

同时写入：

```text
wallet_ledger
ledger_type = EXPIRE
```

---

# 6.7 活动结束任务

T+30 执行：

### 停止

- 新 Seed Creator
- 新 Winner
- 新活动奖励

### 清零

所有：

```text
status = ACTIVE
```

的 Bonus Grant：

```text
remaining_amount = 0
status = EXPIRED
```

---

# 6.8 Bonus 有效期计算

统一：

```text
expire_at =
MIN(
    created_at + 14 days,
    activity_end_at
)
```

例如：

```text
Activity End = 8/31

Bonus Created = 8/25
Normal Expire = 9/8

Final Expire = 8/31
```

---

# 6.9 Bonus 消费算法

第一优先级：

> Bonus。

第二优先级：

> Cash。

多个 Bonus：

> 按 `expire_at ASC` 消耗。

即：

```text
FEFO
First Expired, First Out
```

---

# 6.10 资金隔离

系统必须保证：

```text
Cash
≠
Bonus
```

Cash Ledger：

```text
TOPUP
CONSUME
REFUND
```

Bonus Ledger：

```text
GRANT
CONSUME
EXPIRE
ADJUST
FREEZE
UNFREEZE
```

---

# 6.11 退款逻辑

退款系统：

> **只读取 Cash Ledger / Cash Balance。**

不能读取：

```text
Total Balance
```

例如：

```text
Cash = $100
Bonus = $20
Total = $120
```

退款最多：

> $100。

---

# 6.12 Bonus 不得转为 Cash

禁止：

```text
Bonus
 ↓
Cash
 ↓
Refund
```

禁止：

```text
Expired Bonus
 ↓
Cash
```

禁止：

```text
Bonus
 ↓
Withdrawal
```

---

# 6.13 奖励幂等

每笔奖励必须有唯一：

> `business_key`

Seed Creator：

```text
SEED_CREATOR_REWARD:{user_id}
```

Inviter：

```text
REFERRAL_INVITER:{invitation_id}
```

Invitee：

```text
REFERRAL_INVITEE:{invitation_id}
```

防止：

> Webhook 重复、接口重试、任务重跑导致重复奖励。

---

# 6.14 Bonus Ledger 示例

用户获得 $20：

```text
+20 GRANT
```

使用 $12：

```text
-12 CONSUME
```

剩余 $8 到期：

```text
-8 EXPIRE
```

最终：

```text
+20
-12
-8
= 0
```

---

# 7. 异常与反作弊

## 7.1 自邀请

禁止：

```text
inviter_id = invitee_id
```

---

# 7.2 一个用户多个邀请人

一个 Invitee：

> 只能绑定一个 Inviter。

首次成功绑定后：

> 不允许修改。

数据库：

```text
UNIQUE(invitee_id)
```

---

# 7.3 多账号风险

可以记录风险标记：

- IP
- Device
- 支付方式
- 注册行为

高风险用户：

> 暂停自动发奖，进入人工审核。

---

# 7.4 异常充值

重点关注：

- 短时间大量充值
- 充值后立即退款
- 多账号共用支付方式
- 异常设备批量注册

---

# 7.5 支付成功但奖励未到账

后台支持：

> 手动补发 Bonus。

补发必须：

> 创建新的 Bonus Grant + Ledger。

不能直接修改余额。

---

# 8. 通知机制

## 8.1 Seed Creator 审核通过

> 🎉 恭喜，你已成为 Varo Seed Creator，$20 Bonus 已到账，有效期 14 天。

---

## 8.2 好友注册

> 你的好友已经通过邀请链接注册，3 天内完成首次单笔充值 ≥ $10 即有机会触发邀请奖励。

---

## 8.3 邀请即将失效

建议在：

> 到期前 1 天

提醒：

> 你的好友邀请将在 1 天后失效，请提醒 TA 完成首次充值。

---

## 8.4 邀请失效

> 该好友 3 天内未完成首次充值，本次邀请已失效。你仍可以继续邀请其他好友。

---

## 8.5 Winner

> 🎉 你的好友成为第一个完成活动条件的人，你和 TA 各获得 $10 Bonus。

---

## 8.6 后续用户无奖励

> 你的好友已经完成活动条件，但该邀请奖励已由其他好友先触发，本次不再产生 Bonus。

---

## 8.7 Bonus 到期提醒

建议：

- 到期前 7 天
- 到期前 3 天
- 到期前 1 天

例如：

> 你的 $20 Bonus 将在 3 天后过期，请及时使用。

---

# 9. 验收标准

## 9.1 Seed Creator

- [ ] 前 30 名符合条件用户可以参加
- [ ] 第 31 名不能获得 $20 Bonus
- [ ] 必须提交 Twitter/X + Discord
- [ ] 支持人工审核
- [ ] 审核通过后获得 $20 Bonus
- [ ] $20 Bonus 领取后 14 天有效
- [ ] T+30 为最终截止时间

---

## 9.2 Invitation

- [ ] 一个 Seed Creator 可以邀请多个用户
- [ ] 一个 Seed Creator 有一个专属邀请链接
- [ ] 同一邀请链接可以被多个用户使用
- [ ] 多个 Invitee 可以同时处于有效状态
- [ ] 注册不会消耗邀请奖励机会
- [ ] 点击链接不会消耗邀请奖励机会
- [ ] 建立 Invitation 不会消耗邀请奖励机会
- [ ] 每个 Invitee 有独立 3 天有效期
- [ ] 某个 Invitee 失效不会影响其他 Invitee
- [ ] Invitee 3 天内未首充则自身 Invitation EXPIRED
- [ ] Seed Creator 可以继续邀请新的用户
- [ ] 第一个 Qualified Invitee 成为 Winner
- [ ] Winner 与 Seed Creator 各获得 $10 Bonus
- [ ] Winner 产生后邀请奖励机会才消耗
- [ ] 后续 Invitee 状态为 NO_REWARD
- [ ] 并发情况下只能产生一个 Winner

---

## 9.3 Bonus

- [ ] Bonus 与 Cash 完全分离
- [ ] 每次奖励创建独立 Bonus Grant
- [ ] Bonus 领取后 14 天有效
- [ ] T+30 为绝对截止时间
- [ ] Bonus 优先于 Cash 消费
- [ ] 多个 Bonus 按最早过期时间消费
- [ ] 到期后剩余金额自动清零
- [ ] 到期写入 Ledger
- [ ] Bonus 不可退款
- [ ] Bonus 不可提现
- [ ] Bonus 不得转换为 Cash

---

## 9.4 Wallet

- [ ] Cash Balance 独立
- [ ] Bonus Balance 独立
- [ ] 所有资金变动进入 Ledger
- [ ] Refund 仅处理 Cash
- [ ] Bonus 不参与 Refund
- [ ] Bonus 不得转换为 Cash
- [ ] 活动结束后 Bonus 自动清零

---

# 10. MVP 开发范围

## 第一阶段必须开发

### 用户端

- [ ] 活动 Landing Page
- [ ] Seed Creator 报名
- [ ] Twitter/X 信息提交
- [ ] Discord 信息提交
- [ ] 审核状态
- [ ] $20 Bonus 展示
- [ ] 专属邀请链接
- [ ] 多 Invitee 支持
- [ ] 邀请列表
- [ ] 3 天邀请有效期
- [ ] Winner 状态
- [ ] $10 Bonus 展示
- [ ] Bonus 到期展示

### 后台

- [ ] Seed Creator 审核
- [ ] Invitation 管理
- [ ] Winner 查看
- [ ] Bonus Grant 查看
- [ ] 活动 Dashboard
- [ ] 风险标记
- [ ] 手动补发 Bonus
- [ ] Bonus 冻结 / 解冻

### 后端

- [ ] Activity Participant
- [ ] Invitation
- [ ] Reward
- [ ] Bonus Grant
- [ ] Wallet
- [ ] Wallet Ledger
- [ ] 支付成功事件监听
- [ ] Winner 并发控制
- [ ] Invitation Expiration Job
- [ ] Bonus Expiration Job
- [ ] 奖励幂等
- [ ] Cash / Bonus 资金隔离

---

# 11. MVP 暂不开发

以下能力暂时不做：

- Twitter/X API 自动关注验证
- Discord API 自动验证
- 排行榜
- 多级邀请
- 邀请数量额外奖励
- 复杂积分系统
- 自动化社交传播统计
- 复杂风控模型
- 动态奖励金额
- 多活动同时运行

---

# 12. 最终业务流程

```text
                         活动开始 T
                              │
                              ▼
                       前30名用户报名
                              │
                              ▼
                 Twitter/X + Discord 验证
                              │
                              ▼
                          人工审核
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
                   通过              拒绝
                     │
                     ▼
               Seed Creator
                     │
                     ▼
                 +$20 Bonus
                     │
                     ▼
             获得专属邀请链接
                     │
              可以邀请任意多人
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
     用户A          用户B          用户C
       │             │             │
     注册           注册           注册
       │             │             │
    3天有效期      3天有效期      3天有效期
       │             │             │
       ▼             ▼             ▼
  首充≥$10?      首充≥$10?      首充≥$10?
       │             │             │
       └─────────────┼─────────────┘
                     ▼
            第一个 Qualified 用户
                     │
                     ▼
                   WINNER
                  /       \
                 ▼         ▼
          Inviter +$10   Winner +$10
                 │         │
                 └────┬────┘
                      ▼
             邀请奖励机会已使用
                      │
                      ▼
          后续 Invitee = NO_REWARD
```

---

# 13. 最终资金流程

```text
                        用户真实充值
                              │
                              ▼
                         Cash Balance
                              │
                       ┌──────┴──────┐
                       ▼             ▼
                      消费          Refund
                       │
                       ▼
                     Cash


                        活动奖励
                           │
                           ▼
                       Bonus Grant
                           │
                        ACTIVE
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
               消费                   到期
                │                     │
                ▼                     ▼
         remaining 减少             EXPIRED
                │                     │
          ┌─────┴─────┐               ▼
          ▼           ▼           剩余清零
        还有余额      用完
          │           │
          ▼           ▼
        ACTIVE      DEPLETED
```

必须始终满足：

```text
Cash ≠ Bonus
```

以及：

```text
Refundable Amount
=
符合退款条件的 Cash
```

而：

```text
Bonus Refundable Amount
=
$0
```

---

# 14. 最终产品规则总结

### Seed Creator

> 前 30 名完成 Twitter/X + Discord 人工验证的用户成为 Seed Creator，并获得 $20 Bonus。

### 邀请

> 每个 Seed Creator 拥有一个专属邀请链接，可以邀请任意多个用户。

### 邀请关系

> 每个被邀请用户独立建立一条 Invitation，并拥有自己的 3 天有效期。

### 邀请奖励机会

> 每个 Seed Creator 只有 1 次邀请奖励机会，但注册、点击、建立邀请关系、邀请失败都不会消耗该机会。

### Winner

> 第一个在有效期内完成首次单笔充值 ≥ $10 的被邀请用户成为 Winner。

### 邀请奖励

> Winner 与其 Seed Creator 各获得 $10 Bonus。

### Winner 后

> Winner 产生后，该 Seed Creator 的邀请奖励机会被消耗；其他被邀请用户即使后续完成条件，也不再获得奖励。

### Bonus

> 所有奖励均为 Bonus，与 Cash 完全分离。Bonus 不可提现、不可退款，优先于 Cash 消耗；每笔 Bonus 领取后 14 天有效，但活动结束 T+30 是最终截止时间。

### 活动结束

> T+30 活动结束时，所有未使用 Bonus 自动清零。

---

# 15. 产品核心原则

整个活动只需要记住三个核心概念：

### ① 邀请人数不限

> Seed Creator 可以尽可能多地邀请用户。

### ② 每个人独立计算

> 每个 Invitee 都有自己独立的注册时间、3 天有效期和首充状态。

### ③ 奖励机会只有一次

> 第一个成功完成条件的人触发奖励，之后该 Seed Creator 不再产生额外邀请奖励。

因此最简单的用户理解就是：

> **“我可以邀请很多人，谁先完成首充谁就成为我的 Winner；在 Winner 出现之前，我可以一直邀请；Winner 出现之后，我和 TA 各拿 $10，后面的人不再奖励。”**

这就是本次 Seed Creator Referral Program 的核心产品机制。