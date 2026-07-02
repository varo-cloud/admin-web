export const ADMIN_EMAIL = 'admin@varo.cloud'

export interface MockUser {
  id: string
  email: string
  role: 'user' | 'admin'
  status: 'active' | 'suspended'
  balanceUsd: number
  apiKeysCount: number
  createdAt: number
  lastActiveAt: number
  spentThisMonthUsd: number
}

export interface MockModel {
  id: string
  name: { 'en-US': string; 'zh-CN'?: string }
  display_name?: { 'en-US': string; 'zh-CN'?: string }
  provider: string
  capabilities: string[]
  description: { 'en-US': string; 'zh-CN'?: string }
  thumbnail_url?: string
  model_path: string
  api_model_id: string
  active: boolean
  is_hot: boolean
  is_new: boolean
  sort_order: number
  starting_price_usd: number
  standard_price_usd?: number
  price_unit: string
  price_detail?: string
  discount_percent?: number
  per_run_price_usd?: number
  runs_per_ten_usd?: number
  input_schema: Record<string, unknown>
  readme_md?: { 'en-US': string; 'zh-CN'?: string }
  faq: { question: { 'en-US': string; 'zh-CN'?: string }; answer: { 'en-US': string; 'zh-CN'?: string } }[]
  created_at: number
  updated_at: number
}

export interface MockGeneration {
  task_id: string
  user_id: string
  user_email: string
  model_id: string
  api_model_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  cost_usd: number
  duration: number
  invocation_channel: 'web' | 'api'
  api_key_id: string | null
  api_key_prefix: string | null
  refunded: boolean
  input: Record<string, unknown>
  output: { type: string; url?: string } | null
  billing_record_id: string | null
  upstream_task_id: string | null
  upstream_error: string | null
  timeline: { status: string; at: number }[]
  created_at: number
  completed_at: number | null
}

export interface MockTransaction {
  id: string
  user_id: string
  user_email: string
  amount_usd: number
  package_id: string
  status: 'pending' | 'completed' | 'failed' | 'expired'
  payment_method: string
  payment_detail: string
  stripe_session_id: string
  receipt_url: string | null
  created_at: number
  completed_at: number | null
}

export interface MockBillingPackage {
  id: string
  price_usd: number
  label: { 'en-US'?: string; 'zh-CN'?: string } | null
  sort_order: number
  active: boolean
  created_at: number
  updated_at: number
}

export interface MockApiKey {
  id: string
  user_id: string
  user_email: string
  name: string
  prefix: string
  is_active: boolean
  total_calls: number
  total_spend_usd: number
  last_used_at: number | null
  created_at: number
}

export interface MockAuditLog {
  id: string
  admin_user_id: string
  admin_email: string
  action: string
  target_type: string
  target_id: string
  reason: string
  before_snapshot: Record<string, unknown> | null
  after_snapshot: Record<string, unknown> | null
  created_at: number
}

const now = Date.now()
const day = 86400000

function daysAgo(n: number) {
  return now - n * day
}

export const mockStore = {
  users: [
    {
      id: 'admin-001',
      email: ADMIN_EMAIL,
      role: 'admin' as const,
      status: 'active' as const,
      balanceUsd: 0,
      apiKeysCount: 0,
      createdAt: daysAgo(90),
      lastActiveAt: now,
      spentThisMonthUsd: 0,
    },
    {
      id: 'user-001',
      email: 'alice@example.com',
      role: 'user' as const,
      status: 'active' as const,
      balanceUsd: 17.5,
      apiKeysCount: 2,
      createdAt: daysAgo(30),
      lastActiveAt: daysAgo(0),
      spentThisMonthUsd: 96.28,
    },
    {
      id: 'user-002',
      email: 'bob@example.com',
      role: 'user' as const,
      status: 'active' as const,
      balanceUsd: 42.0,
      apiKeysCount: 1,
      createdAt: daysAgo(15),
      lastActiveAt: daysAgo(1),
      spentThisMonthUsd: 23.5,
    },
    {
      id: 'user-003',
      email: 'charlie@example.com',
      role: 'user' as const,
      status: 'suspended' as const,
      balanceUsd: 5.0,
      apiKeysCount: 0,
      createdAt: daysAgo(60),
      lastActiveAt: daysAgo(10),
      spentThisMonthUsd: 0,
    },
  ] as MockUser[],

  models: [
    {
      id: 'seedance-t2v',
      name: {
        'en-US': 'Seedance 2.0 Text-to-Video',
        'zh-CN': 'Seedance 2.0 文生视频',
      },
      display_name: {
        'en-US': 'Seedance 2.0',
        'zh-CN': 'Seedance 2.0',
      },
      provider: 'ByteDance',
      capabilities: ['text-to-video'],
      description: {
        'en-US': 'Text-to-video generation model.',
        'zh-CN': '高质量文生视频模型',
      },
      thumbnail_url: 'https://picsum.photos/seed/seedance/400/225',
      model_path: 'bytedance/seedance-2.0/text-to-video',
      api_model_id: 'dreamina-seedance-2-0-260128',
      active: true,
      is_hot: true,
      is_new: false,
      sort_order: 10,
      starting_price_usd: 0.072,
      standard_price_usd: 0.09,
      price_unit: 'per_second',
      price_detail: '720p',
      discount_percent: 20,
      per_run_price_usd: 0.36,
      runs_per_ten_usd: 27,
      input_schema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', title: 'Prompt' },
          duration: { type: 'integer', minimum: 2, maximum: 10, default: 5 },
        },
        required: ['prompt'],
      },
      readme_md: {
        'en-US': '## Seedance 2.0\n\nText-to-video model.',
        'zh-CN': '## Seedance 2.0\n\n文生视频模型。',
      },
      faq: [
        {
          question: {
            'en-US': 'How long can videos be?',
            'zh-CN': '支持多长视频？',
          },
          answer: {
            'en-US': '2-10 seconds',
            'zh-CN': '2-10 秒',
          },
        },
      ],
      created_at: daysAgo(60),
      updated_at: daysAgo(2),
    },
    {
      id: 'seedance-i2v',
      name: {
        'en-US': 'Seedance 2.0 Image-to-Video',
        'zh-CN': 'Seedance 2.0 图生视频',
      },
      display_name: {
        'en-US': 'Seedance I2V',
        'zh-CN': 'Seedance 图生视频',
      },
      provider: 'ByteDance',
      capabilities: ['image-to-video'],
      description: {
        'en-US': 'Image-to-video generation model.',
        'zh-CN': '图生视频模型',
      },
      model_path: 'bytedance/seedance-2.0/image-to-video',
      api_model_id: 'dreamina-seedance-i2v',
      active: false,
      is_hot: false,
      is_new: true,
      sort_order: 20,
      starting_price_usd: 0.084,
      standard_price_usd: 0.1,
      price_unit: 'per_second',
      price_detail: '480p',
      discount_percent: 15,
      input_schema: { type: 'object', properties: {} },
      faq: [],
      created_at: daysAgo(45),
      updated_at: daysAgo(5),
    },
  ] as MockModel[],

  generations: [
    {
      task_id: 'cgt-20260611195952-9l74f',
      user_id: 'user-001',
      user_email: 'alice@example.com',
      model_id: 'seedance-t2v',
      api_model_id: 'dreamina-seedance-2-0-260128',
      status: 'failed',
      cost_usd: 2.0,
      duration: 5,
      invocation_channel: 'web',
      api_key_id: null,
      api_key_prefix: null,
      refunded: false,
      input: { prompt: 'A cat walking in rain', duration: 5, resolution: '720p' },
      output: null,
      billing_record_id: 'br-001',
      upstream_task_id: 'cgt-upstream-xxx',
      upstream_error: 'Upstream timeout',
      timeline: [
        { status: 'queued', at: daysAgo(1) },
        { status: 'processing', at: daysAgo(1) + 3000 },
        { status: 'failed', at: daysAgo(1) + 60000 },
      ],
      created_at: daysAgo(1),
      completed_at: daysAgo(1) + 60000,
    },
    {
      task_id: 'cgt-20260612103000-ab12',
      user_id: 'user-002',
      user_email: 'bob@example.com',
      model_id: 'seedance-t2v',
      api_model_id: 'dreamina-seedance-2-0-260128',
      status: 'completed',
      cost_usd: 0.36,
      duration: 5,
      invocation_channel: 'api',
      api_key_id: 'key-001',
      api_key_prefix: 'sk_live_1f78',
      refunded: false,
      input: { prompt: 'Ocean waves at sunset' },
      output: { type: 'video', url: 'https://example.com/video.mp4' },
      billing_record_id: 'br-002',
      upstream_task_id: null,
      upstream_error: null,
      timeline: [
        { status: 'queued', at: daysAgo(0) },
        { status: 'processing', at: daysAgo(0) + 5000 },
        { status: 'completed', at: daysAgo(0) + 45000 },
      ],
      created_at: daysAgo(0),
      completed_at: daysAgo(0) + 45000,
    },
  ] as MockGeneration[],

  transactions: [
    {
      id: 'txn-001',
      user_id: 'user-001',
      user_email: 'alice@example.com',
      amount_usd: 10,
      package_id: 'starter',
      status: 'completed',
      payment_method: 'stripe',
      payment_detail: 'Visa ••4242',
      stripe_session_id: 'cs_test_a1b2c3',
      receipt_url: 'https://pay.stripe.com/receipts/example',
      created_at: daysAgo(3),
      completed_at: daysAgo(3) + 60000,
    },
    {
      id: 'txn-002',
      user_id: 'user-002',
      user_email: 'bob@example.com',
      amount_usd: 25,
      package_id: 'pro',
      status: 'pending',
      payment_method: 'stripe',
      payment_detail: 'Mastercard ••5555',
      stripe_session_id: 'cs_test_d4e5f6',
      receipt_url: null,
      created_at: daysAgo(0),
      completed_at: null,
    },
    {
      id: 'txn-003',
      user_id: 'user-001',
      user_email: 'alice@example.com',
      amount_usd: 10,
      package_id: 'starter',
      status: 'pending',
      payment_method: 'stripe',
      payment_detail: 'Visa ••4242',
      stripe_session_id: 'cs_test_g7h8i9',
      receipt_url: null,
      created_at: daysAgo(1),
      completed_at: null,
    },
  ] as MockTransaction[],

  billingPackages: [
    {
      id: 'starter',
      price_usd: 10,
      label: { 'en-US': 'Starter', 'zh-CN': '入门档' },
      sort_order: 0,
      active: true,
      created_at: daysAgo(30),
      updated_at: daysAgo(30),
    },
    {
      id: 'pro',
      price_usd: 25,
      label: { 'en-US': 'Pro', 'zh-CN': '专业档' },
      sort_order: 1,
      active: true,
      created_at: daysAgo(30),
      updated_at: daysAgo(30),
    },
    {
      id: 'business',
      price_usd: 50,
      label: { 'en-US': 'Business', 'zh-CN': '商务档' },
      sort_order: 2,
      active: true,
      created_at: daysAgo(30),
      updated_at: daysAgo(30),
    },
  ] as MockBillingPackage[],

  apiKeys: [
    {
      id: 'key-001',
      user_id: 'user-001',
      user_email: 'alice@example.com',
      name: 'production',
      prefix: 'sk_live_1f78',
      is_active: true,
      total_calls: 120,
      total_spend_usd: 45,
      last_used_at: daysAgo(0),
      created_at: daysAgo(20),
    },
    {
      id: 'key-002',
      user_id: 'user-001',
      user_email: 'alice@example.com',
      name: 'dev',
      prefix: 'sk_test_9abc',
      is_active: true,
      total_calls: 15,
      total_spend_usd: 3.5,
      last_used_at: daysAgo(5),
      created_at: daysAgo(25),
    },
    {
      id: 'key-003',
      user_id: 'user-002',
      user_email: 'bob@example.com',
      name: 'default',
      prefix: 'sk_live_2a3b',
      is_active: false,
      total_calls: 50,
      total_spend_usd: 12,
      last_used_at: daysAgo(30),
      created_at: daysAgo(14),
    },
  ] as MockApiKey[],

  pricing: [
    {
      id: 'veo-31-lite-i2v',
      model_id: 'seedance-i2v',
      name: {
        'en-US': 'Seedance 2.0 Image-to-Video',
        'zh-CN': 'Seedance 2.0 图生视频',
      },
      standard_price_usd: 0.1,
      starting_price_usd: 0.084,
      price_unit: 'per_second',
      discount_percent: 15,
      category: 'image-video',
      media_type: 'video',
      sort_order: 20,
    },
  ],

  config: {
    credits_per_usd: 100,
    processing_fee: {
      percent: 0.029,
      fixed_usd: 0.3,
    },
  },

  auditLogs: [
    {
      id: 'audit-001',
      admin_user_id: 'admin-001',
      admin_email: ADMIN_EMAIL,
      action: 'balance_adjustment',
      target_type: 'user',
      target_id: 'user-001',
      reason: '注册体验金补发',
      before_snapshot: { balance_usd: 14.5 },
      after_snapshot: { balance_usd: 17.5 },
      created_at: daysAgo(2),
    },
  ] as MockAuditLog[],

  billingRecords: {
    'user-001': [
      { id: 'br-001', style: 'generation', detail: 'seedance-t2v', amount_usd: -2.0, created_at: daysAgo(1) },
      { id: 'br-003', style: 'bonus', detail: '注册体验金', amount_usd: 3.0, created_at: daysAgo(30) },
    ],
    'user-002': [
      { id: 'br-002', style: 'generation', detail: 'seedance-t2v', amount_usd: -0.36, created_at: daysAgo(0) },
    ],
  } as Record<string, { id: string; style: string; detail: string; amount_usd: number; created_at: number }[]>,

  idempotencyKeys: new Map<string, unknown>(),

  heroCarousel: {
    slide_duration_ms: 5000,
    autoplay_enabled: true,
    muted: true,
    default_title: {
      'en-US': 'The AI Model Cloud for Creator',
      'zh-CN': 'The AI Model Cloud for Creator',
    },
    default_subtitle: {
      'en-US':
        'Access leading video, image, audio, and language models through one unified API—with better pricing and reliable performance.',
      'zh-CN': '通过统一 API 接入领先的视频、图像、音频与语言模型——更优价格与稳定性能。',
    },
    slides: [
      {
        id: 'hero-slide-2',
        sort_order: 0,
        active: true,
        video_url: 'https://cdn.varo.cloud/assets/cover/2.mp4',
        poster_url: 'https://cdn.varo.cloud/assets/cover/2.jpg',
        title: {
          'en-US': 'The AI Model Cloud for Creator',
          'zh-CN': 'The AI Model Cloud for Creator',
        },
        subtitle: {
          'en-US':
            'Access leading video, image, audio, and language models through one unified API—with better pricing and reliable performance.',
          'zh-CN': '通过统一 API 接入领先的视频、图像、音频与语言模型——更优价格与稳定性能。',
        },
        created_at: daysAgo(30),
        updated_at: daysAgo(30),
      },
      {
        id: 'hero-slide-3',
        sort_order: 1,
        active: true,
        video_url: 'https://cdn.varo.cloud/assets/cover/3.mp4',
        poster_url: 'https://cdn.varo.cloud/assets/cover/3.jpg',
        title: {
          'en-US': 'Seedance 2.5 Coming Soon',
          'zh-CN': 'Seedance 2.5 即将上线',
        },
        subtitle: {
          'en-US':
            'Seedance 2.5 arrives in Early July with 30-second single-shot videos, expanded reference capacity, tighter generation and editing control, and support for up to 50 reference files.',
          'zh-CN':
            'Seedance 2.5 将于 7 月初上线，支持 30 秒单镜头视频、扩展参考素材容量、更精细的生成与编辑控制，以及最多 50 个参考文件。',
        },
        created_at: daysAgo(30),
        updated_at: daysAgo(30),
      },
      {
        id: 'hero-slide-4',
        sort_order: 2,
        active: true,
        video_url: 'https://cdn.varo.cloud/assets/cover/4.mp4',
        poster_url: 'https://cdn.varo.cloud/assets/cover/4.jpg',
        title: null,
        subtitle: null,
        created_at: daysAgo(30),
        updated_at: daysAgo(30),
      },
    ],
    updated_at: daysAgo(2),
  },
}

export function addAuditLog(entry: Omit<MockAuditLog, 'id' | 'created_at'>) {
  mockStore.auditLogs.unshift({
    ...entry,
    id: `audit-${Date.now()}`,
    created_at: Date.now(),
  })
}
