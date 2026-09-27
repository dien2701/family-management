import { api } from '@/services/client'
import type { LinkRequest, MemberDetail } from '@/types/api'

/** Phía User của liên kết "Tôi là ai"; phần duyệt của Admin nằm ở `features/admin`. */
export const linkApi = {
  createRequest: (memberId: number) => api.post<LinkRequest>('/link-requests', { memberId }),
  myRequests: () => api.get<LinkRequest[]>('/link-requests/mine'),
  unlink: () => api.delete<void>('/me/member-link'),
  getMember: (id: number) => api.get<MemberDetail>(`/members/${id}`),
}
