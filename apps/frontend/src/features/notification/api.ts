import { api } from '@/services/client'
import type { NotificationPage, NotificationPref, PushSubscription } from '@/types/api'

export const notificationApi = {
  getAll: (page: number, size: number) =>
    api.get<NotificationPage>('/notifications', { query: { page, size } }),
  getUnreadCount: () => api.get<number>('/notifications/unread-count'),
  read: (id: number) => api.post<void>(`/notifications/${id}/read`),
  readAll: () => api.post<void>('/notifications/read-all'),
  getPreferences: () => api.get<NotificationPref>('/notifications/preferences'),
  updatePreferences: (data: NotificationPref) =>
    api.put<NotificationPref>('/notifications/preferences', data),
  getPublicKey: () => api.get<string>('/push/public-key', { responseType: 'text' }),
  subscribePush: (data: PushSubscription) => api.post<void>('/push/subscribe', data),
  unsubscribePush: (endpoint: string) => api.delete<void>('/push/subscribe', { body: { endpoint } }),
  testPush: () => api.post<void>('/push/test'),
}
