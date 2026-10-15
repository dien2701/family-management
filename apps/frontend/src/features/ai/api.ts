import { api } from '@/services/client'
import type { AiDraft, AiMessage, AiQuota } from '@/types/api'
import { deviceHeaders } from './deviceId'

export const aiApi = {
  quota: () => api.get<AiQuota>('/ai/quota', { headers: deviceHeaders() }),
  messages: () => api.get<AiMessage[]>('/ai/messages'),
  submitDraft: (id: number) => api.post<AiDraft>(`/ai/drafts/${id}/submit`),
  applyDraft: (id: number) => api.post<AiDraft>(`/ai/drafts/${id}/apply`),
}
