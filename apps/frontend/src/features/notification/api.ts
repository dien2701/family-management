import { fetchApi } from '@/utils/api'
import type { Schemas } from '@/types/api'

export const notificationApi = {
  getAll: (page: number, size: number) =>
    fetchApi(`/api/notifications?page=${page}&size=${size}`),
  getUnreadCount: () => fetchApi('/api/notifications/unread-count'),
  read: (id: number) => fetchApi(`/api/notifications/${id}/read`, { method: 'POST' }),
  readAll: () => fetchApi('/api/notifications/read-all', { method: 'POST' }),
  getPreferences: () => fetchApi('/api/notifications/preferences'),
  updatePreferences: (data: Schemas['NotificationPref']) =>
    fetchApi('/api/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getPublicKey: () => fetchApi('/api/push/public-key').then((res) => res.text()),
  subscribePush: (data: Schemas['PushSubscription']) =>
    fetchApi('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  unsubscribePush: (endpoint: string) =>
    fetchApi('/api/push/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    }),
  testPush: () => fetchApi('/api/push/test', { method: 'POST' }),
}
