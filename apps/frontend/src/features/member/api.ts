import { api, ApiError } from '@/services/client'
import type {
  Attachment,
  FileSignResponse,
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

/** Ảnh đại diện: xin chữ ký → gửi thẳng lên Cloudinary → xác nhận với máy chủ (IDEA §6.7). */
async function uploadAvatar(memberId: number, file: File): Promise<Attachment> {
  const sign = await api.post<FileSignResponse>('/files/sign', {
    kind: 'AVATAR',
    memberId,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  })
  const body = new FormData()
  for (const [key, value] of Object.entries(sign.fields)) body.append(key, value)
  body.append('file', file)
  const response = await fetch(sign.uploadUrl, { method: 'POST', body })
  if (!response.ok) {
    throw new ApiError(response.status, { title: 'Tải ảnh lên không thành công, vui lòng thử lại.' })
  }
  const uploaded = (await response.json()) as { public_id: string }
  return api.post<Attachment>('/files/confirm', {
    kind: 'AVATAR',
    memberId,
    publicId: uploaded.public_id,
    fileName: file.name,
  })
}

export const memberApi = {
  getMembers: (query: MemberListQuery) =>
    api.get<MemberPage>('/members', { query: query as Record<string, any> }),
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
  uploadAvatar,
}
