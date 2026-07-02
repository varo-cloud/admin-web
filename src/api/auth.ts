import { userHttp, unwrap } from './http'
import type { AdminProfile } from '@/types'

interface ApiProfile {
  id: string
  email: string
  role: 'user' | 'admin'
  balance_usd: number
}

export async function fetchProfile(): Promise<AdminProfile> {
  const raw = await unwrap<ApiProfile>(userHttp.get('/user/profile'))
  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    balanceUsd: raw.balance_usd,
  }
}
