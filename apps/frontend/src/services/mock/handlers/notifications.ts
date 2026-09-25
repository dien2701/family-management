import type { Schemas } from '@/types/api'
import type { HandlerContext } from '../context'
import type { MockRequest, MockRouter } from '../router'
import { requireApproved } from './common'
import { ApiError } from '../router'

function getNotificationPrefs(context: HandlerContext, accountId: number): Schemas['NotificationPref'] {
  const store = context.store
  if (!store.notificationPrefs) {
    store.notificationPrefs = {}
  }
  let pref = store.notificationPrefs[accountId]
  if (!pref) {
    pref = {
      eventReminders: true,
      systemUpdates: true,
      proposals: true,
      remindDays: [7, 3, 1, 0],
      remindTime: '08:00'
    }
    store.notificationPrefs[accountId] = pref
    context.save()
  }
  return pref
}

async function getNotifications(request: MockRequest, context: HandlerContext): Promise<Schemas['NotificationPage']> {
  await requireApproved(context)
  return {
    items: [],
    totalPages: 1
  }
}

async function getUnreadCount(request: MockRequest, context: HandlerContext): Promise<number> {
  await requireApproved(context)
  return 0
}

async function readNotification(request: MockRequest, context: HandlerContext): Promise<void> {
  await requireApproved(context)
  // No-op in mock
}

async function readAllNotifications(request: MockRequest, context: HandlerContext): Promise<void> {
  await requireApproved(context)
  // No-op in mock
}

async function getPreferences(request: MockRequest, context: HandlerContext): Promise<Schemas['NotificationPref']> {
  const user = await requireApproved(context)
  return getNotificationPrefs(context, user.id)
}

async function updatePreferences(request: MockRequest, context: HandlerContext): Promise<Schemas['NotificationPref']> {
  const user = await requireApproved(context)
  const body = request.body as Schemas['NotificationPref']
  
  const store = context.store
  if (!store.notificationPrefs) {
    store.notificationPrefs = {}
  }
  store.notificationPrefs[user.id] = body
  context.save()
  
  return body
}

async function getPublicKey(request: MockRequest, context: HandlerContext): Promise<string> {
  return 'mock-vapid-public-key-abcdefghijklmnopqrstuvwxyz1234567890'
}

async function subscribePush(request: MockRequest, context: HandlerContext): Promise<void> {
  await requireApproved(context)
  throw new ApiError(503, 'ServiceUnavailable', 'Cần kết nối máy chủ')
}

async function unsubscribePush(request: MockRequest, context: HandlerContext): Promise<void> {
  await requireApproved(context)
  throw new ApiError(503, 'ServiceUnavailable', 'Cần kết nối máy chủ')
}

async function testPush(request: MockRequest, context: HandlerContext): Promise<void> {
  await requireApproved(context)
  throw new ApiError(503, 'ServiceUnavailable', 'Cần kết nối máy chủ')
}

export function registerNotificationHandlers(router: MockRouter): void {
  router.on('GET', '/notifications', getNotifications)
  router.on('GET', '/notifications/unread-count', getUnreadCount)
  router.on('POST', '/notifications/:id/read', readNotification)
  router.on('POST', '/notifications/read-all', readAllNotifications)
  router.on('GET', '/notifications/preferences', getPreferences)
  router.on('PUT', '/notifications/preferences', updatePreferences)
  
  // Notice we need special handling if we want to return plain text for public-key instead of JSON
  // But MockRouter currently wraps all successful results in JSON unless modified. Let's see if MockRouter supports text.
  // We can just return it as string, and hope the frontend handles it or if MockRouter JSON.stringifys it.
  router.on('GET', '/push/public-key', getPublicKey)
  router.on('POST', '/push/subscribe', subscribePush)
  router.on('DELETE', '/push/subscribe', unsubscribePush)
  router.on('POST', '/push/test', testPush)
}
