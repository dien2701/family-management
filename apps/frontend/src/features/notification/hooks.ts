import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from './api'
import { getGuestPushPref, saveGuestPushPref } from './push'
import type { Schemas } from '@/types/api'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page: number, size: number) => [...notificationKeys.all, 'list', page, size] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
}

export function useNotifications(page: number, size: number) {
  return useQuery({
    queryKey: notificationKeys.list(page, size),
    queryFn: () => notificationApi.getAll(page, size) as Promise<Schemas['NotificationPage']>,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount() as Promise<number>,
    refetchOnWindowFocus: true,
  })
}

export function useReadNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationApi.read(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useReadAllNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationApi.readAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => notificationApi.getPreferences() as Promise<Schemas['NotificationPref']>,
  })
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Schemas['NotificationPref']) => notificationApi.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() })
    },
  })
}

export function useSubscribePush() {
  return useMutation({
    mutationFn: (data: Schemas['PushSubscription']) => notificationApi.subscribePush(data),
  })
}

export function useUnsubscribePush() {
  return useMutation({
    mutationFn: (endpoint: string) => notificationApi.unsubscribePush(endpoint),
  })
}

// Tùy chọn của thiết bị khách. `enabled` chỉ bật khi trình duyệt đã có subscription, để khỏi gọi máy chủ vô ích.
export function useGuestPushPref(enabled: boolean) {
  return useQuery({
    queryKey: [...notificationKeys.all, 'guestPref'] as const,
    queryFn: getGuestPushPref,
    enabled,
  })
}

export function useSaveGuestPushPref() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (pref: Schemas['GuestPushPref']) => saveGuestPushPref(pref),
    onSuccess: (saved) => {
      queryClient.setQueryData([...notificationKeys.all, 'guestPref'], saved)
    },
  })
}

export function useTestPush() {
  return useMutation({
    mutationFn: () => notificationApi.testPush(),
  })
}
