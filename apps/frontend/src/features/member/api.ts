import { api } from '@/services/client'
import { uploadAvatar } from '@/services/upload'
import type {
  MemberDetail,
  MemberInput,
  MemberPage,
  Relative,
  RelativeInput,
} from '@/types/api'

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
    api.get<MemberPage>('/members', { query: query as Record<string, string | number | boolean | null | undefined> }),
  getMemberDetail: (id: number) => api.get<MemberDetail>(`/members/${id}`),
  createMember: (input: MemberInput) => api.post<MemberDetail>('/members', input),
  updateMember: (id: number, input: MemberInput) =>
    api.put<MemberDetail>(`/members/${id}`, input),
  deleteMember: (id: number) => api.delete<void>(`/members/${id}`),
  getRelatives: (id: number) => api.get<Relative[]>(`/members/${id}/relatives`),
  addRelative: (id: number, input: RelativeInput) =>
    api.post<Relative>(`/members/${id}/relatives`, input),
  updateRelative: (id: number, relativeId: number, label: string) =>
    api.put<Relative>(`/members/${id}/relatives/${relativeId}`, { label }),
  deleteRelative: (id: number, relativeId: number) =>
    api.delete<void>(`/members/${id}/relatives/${relativeId}`),
  uploadAvatar: (memberId: number, file: File) => uploadAvatar({ kind: 'AVATAR', memberId }, file),
}
