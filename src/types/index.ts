export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface Paginated<T> {
  items: T[]
  total: number
  offset: number
  limit: number
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

export type UserRole = 'user' | 'admin'
export type UserStatus = 'active' | 'suspended'

export interface AdminProfile {
  id: string
  email: string
  role: UserRole
  balanceUsd: number
}

export type PricingPriceUnit =
  | 'per_second'
  | 'per_image'
  | 'per_million_tokens'
  | 'per_hour'

export type GenerationStatus = 'queued' | 'processing' | 'completed' | 'failed'
export type InvocationChannel = 'web' | 'api'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'expired'
export type BalanceAdjustmentType = 'manual_topup' | 'bonus' | 'refund' | 'correction'

export interface ModelFaqItem {
  question: string
  answer: string
}
