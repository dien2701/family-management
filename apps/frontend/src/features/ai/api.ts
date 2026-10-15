import { api } from '@/services/client'
import type {
  AiConversation,
  AiConversationUpdate,
  AiDraft,
  AiMessage,
  AiQuota,
} from '@/types/api'
import { deviceHeaders } from './deviceId'

export const aiApi = {
  quota: () => api.get<AiQuota>('/ai/quota', { headers: deviceHeaders() }),
  conversations: (q: string) =>
    api.get<AiConversation[]>(`/ai/conversations${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  messages: (conversationId: number) =>
    api.get<AiMessage[]>(`/ai/messages?conversationId=${conversationId}&limit=200`),
  updateConversation: (id: number, body: AiConversationUpdate) =>
    api.patch<AiConversation>(`/ai/conversations/${id}`, body),
  deleteConversation: (id: number) => api.delete<void>(`/ai/conversations/${id}`),
  submitDraft: (id: number) => api.post<AiDraft>(`/ai/drafts/${id}/submit`),
  applyDraft: (id: number) => api.post<AiDraft>(`/ai/drafts/${id}/apply`),
}
