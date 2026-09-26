import type { Schemas } from '@/types/api'
import type { HandlerContext } from '../context'
import type { MockRequest, MockRouter } from '../router'
import { requireApproved } from './common'
import { mockProblem } from '../problem'

function getNotificationPrefs(context: HandlerContext, accountId: number): Schemas['NotificationPref'] {
  const store = context.store
  if (!store.notificationPrefs) {
    store.notificationPrefs = {}
  }
  const existing = store.notificationPrefs[accountId]
  if (existing) return existing
  const pref: Schemas['NotificationPref'] = {
      notifyEvents: true,
      notifyMemorials: true,
      notifyProposals: true,
      remindDaysBefore: [7, 3, 1, 0],
      remindHour: '08:00',
  }
  store.notificationPrefs[accountId] = pref
  context.save()
  return pref
}

async function getNotifications(_request: MockRequest, context: HandlerContext): Promise<Schemas['NotificationPage']> {
  await requireApproved(context)
  return {
    items: [],
    totalPages: 1
  }
}

async function getUnreadCount(_request: MockRequest, context: HandlerContext): Promise<number> {
  await requireApproved(context)
  return 0
}

async function readNotification(_request: MockRequest, context: HandlerContext): Promise<void> {
  await requireApproved(context)
  // No-op in mock
}

async function readAllNotifications(_request: MockRequest, context: HandlerContext): Promise<void> {
  await requireApproved(context)
  // No-op in mock
}

async function getPreferences(_request: MockRequest, context: HandlerContext): Promise<Schemas['NotificationPref']> {
  const user = await requireApproved(context)
  return getNotificationPrefs(context, user.id ?? 0)
}

async function updatePreferences(request: MockRequest, context: HandlerContext): Promise<Schemas['NotificationPref']> {
  const user = await requireApproved(context)
  const body = request.body as Schemas['NotificationPref']
  
  const store = context.store
  if (!store.notificationPrefs) {
    store.notificationPrefs = {}
  }
  store.notificationPrefs[user.id ?? 0] = body
  context.save()
  
  return body
}

async function getPublicKey(): Promise<string> {
  return 'mock-vapid-public-key-abcdefghijklmnopqrstuvwxyz1234567890'
}

async function subscribePush(_request: MockRequest, context: HandlerContext): Promise<void> {
  await requireApproved(context)
  throw mockProblem(503, 'SERVER_REQUIRED', 'Cần kết nối máy chủ để dùng thông báo đẩy.')
}

async function unsubscribePush(_request: MockRequest, context: HandlerContext): Promise<void> {
  await requireApproved(context)
  throw mockProblem(503, 'SERVER_REQUIRED', 'Cần kết nối máy chủ để dùng thông báo đẩy.')
}

async function testPush(_request: MockRequest, context: HandlerContext): Promise<void> {
  await requireApproved(context)
  throw mockProblem(503, 'SERVER_REQUIRED', 'Cần kết nối máy chủ để dùng thông báo đẩy.')
}

export function registerNotificationHandlers(router: MockRouter): void {
  router.on('GET', '/notifications', getNotifications)
  router.on('GET', '/notifications/unread-count', getUnreadCount)
  router.on('POST', '/notifications/:id/read', readNotification)
  router.on('POST', '/notifications/read-all', readAllNotifications)
  router.on('GET', '/notifications/preferences', getPreferences)
  router.on('PUT', '/notifications/preferences', updatePreferences)
  
  router.on('GET', '/push/public-key', getPublicKey)
  router.on('POST', '/push/subscribe', subscribePush)
  router.on('DELETE', '/push/subscribe', unsubscribePush)
  router.on('POST', '/push/test', testPush)
}
