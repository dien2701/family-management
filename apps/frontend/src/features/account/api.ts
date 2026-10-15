import { api } from '@/services/client'
import { uploadAvatar } from '@/services/upload'
import type { Me } from '@/types/api'

export const accountApi = {
  getMe: () => api.get<Me>('/me'),
  uploadAvatar: (file: File) => uploadAvatar({ kind: 'ACCOUNT_AVATAR' }, file),
  removeAvatar: () => api.delete<void>('/me/avatar'),
}
