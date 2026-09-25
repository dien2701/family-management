import { api } from '@/services/client'
import type { MemberDetail, MemberPage } from '@/types/api'

export type MemberListQuery = {
  q?: string
  sort?: 'name' | 'age' | 'created' | 'generation'
  ageMin?: number
  ageMax?: number
  generation?: number
  deceased?: boolean
  onTree?: boolean
  page?: number
  size?: number
}

export const memberApi = {
  getMembers: (query: MemberListQuery) =>
    api.get<MemberPage>('/members', { query: query as Record<string, any> }),
  getMemberDetail: (id: number) => api.get<MemberDetail>(`/members/${id}`),
}
