import type { Attachment, FileSignResponse } from '@/types/api'
import { api, ApiError } from './client'

/**
 * Ảnh đại diện: xin chữ ký → gửi thẳng lên Cloudinary → xác nhận với máy chủ (IDEA §6.7).
 * `AVATAR` cần `memberId`; `ACCOUNT_AVATAR` là ảnh của tài khoản đang đăng nhập (máy chủ lấy chủ ảnh từ token).
 */
export async function uploadAvatar(
  target: { kind: 'AVATAR' | 'ACCOUNT_AVATAR'; memberId?: number },
  file: File,
): Promise<Attachment> {
  const { kind, memberId } = target
  const sign = await api.post<FileSignResponse>('/files/sign', {
    kind,
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
    kind,
    memberId,
    publicId: uploaded.public_id,
    fileName: file.name,
  })
}
