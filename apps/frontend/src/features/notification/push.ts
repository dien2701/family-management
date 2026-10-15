import { ApiError } from '@/services/client'
import type { GuestPushPref } from '@/types/api'
import { notificationApi } from './api'

export type PushState = 'unsupported' | 'denied' | 'off' | 'on'

/**
 * `account`: tài khoản đã duyệt, subscription gắn với tài khoản. `guest`: khách hoặc tài khoản chưa duyệt,
 * subscription tự giữ tùy chọn và chỉ nhận dữ liệu công khai (DECISIONS #89).
 */
export type PushMode = 'account' | 'guest'

// Base64url (khóa VAPID) → bytes cho pushManager.subscribe
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const raw = window.atob((base64String + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

/** iPhone/iPad chỉ có Web Push khi ứng dụng đã được thêm vào Màn hình chính. */
export function needsHomeScreenInstall() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const standalone =
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return ios && !standalone
}

// getRegistration (không phải .ready) để không treo khi chưa có service worker, ví dụ npm run dev
async function currentSubscription() {
  const registration = await navigator.serviceWorker.getRegistration()
  return registration ? registration.pushManager.getSubscription() : null
}

export async function getPushState(): Promise<PushState> {
  if (!supported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission !== 'granted') return 'off'
  return (await currentSubscription()) ? 'on' : 'off'
}

const sameKey = (a: ArrayBuffer | null, b: Uint8Array) => {
  if (!a || a.byteLength !== b.length) return false
  const x = new Uint8Array(a)
  return b.every((v, i) => v === x[i])
}

// Subscription cũ ký bằng khóa VAPID khác (đã đổi khóa trên máy chủ) sẽ bị push service từ chối âm thầm: hủy và đăng ký lại
async function ensureSubscription(registration: ServiceWorkerRegistration, vapidKey: string) {
  const key = urlBase64ToUint8Array(vapidKey)
  const existing = await registration.pushManager.getSubscription()
  if (existing && sameKey(existing.options.applicationServerKey, key)) return existing
  await existing?.unsubscribe()
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
}

/** Gửi subscription lên máy chủ; `pref` chỉ có nghĩa với khách (bỏ trống = giữ tùy chọn hiện có). */
async function upload(subscription: PushSubscription, mode: PushMode, pref?: GuestPushPref) {
  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error('Đăng ký push thất bại: thiếu endpoint hoặc khóa')
  const keys = { p256dh: json.keys.p256dh, auth: json.keys.auth }
  if (mode === 'guest') return notificationApi.putGuestPush({ endpoint: json.endpoint, keys, pref })
  await notificationApi.subscribePush({ endpoint: json.endpoint, keys })
  return undefined
}

/** Phải gọi từ thao tác bấm của người dùng (trình duyệt chỉ hỏi quyền khi đó). */
export async function enablePush(mode: PushMode = 'account') {
  if (!supported()) throw new Error('Trình duyệt không hỗ trợ thông báo đẩy')
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('Bạn đã từ chối quyền gửi thông báo')
  const registration = await navigator.serviceWorker.ready
  await upload(await ensureSubscription(registration, await notificationApi.getPublicKey()), mode)
}

/**
 * Gọi mỗi lần mở app: thiết bị đã bật push thì bảo đảm máy chủ có đúng khóa và gắn đúng chủ (đổi tài khoản, xoay khóa,
 * đăng nhập sau khi bật push khi còn là khách). Không tự bật lại khi người dùng đã tắt, nên bỏ qua nếu trình duyệt không
 * còn subscription.
 */
export async function syncPush(mode: PushMode = 'account') {
  try {
    if (!supported() || Notification.permission !== 'granted') return
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration || !(await registration.pushManager.getSubscription())) return
    await upload(await ensureSubscription(registration, await notificationApi.getPublicKey()), mode)
  } catch {
    // Chưa cấu hình VAPID (503), mất mạng... Lần mở sau thử lại
  }
}

/** Tắt thông báo trên thiết bị này (báo máy chủ trước, rồi hủy ở trình duyệt). Dùng cho nút Tắt. */
export async function disablePush(mode: PushMode = 'account') {
  if (!supported()) return
  const subscription = await currentSubscription()
  if (!subscription) return
  try {
    if (mode === 'guest') await notificationApi.deleteGuestPush(subscription.endpoint)
    else await notificationApi.unsubscribePush(subscription.endpoint)
  } finally {
    await subscription.unsubscribe()
  }
}

/**
 * Đăng xuất: thiết bị quay lại làm khách và vẫn nhận bản tin công khai (DECISIONS #89), không hủy push. Chuyển không
 * được thì hủy hẳn để người dùng cũ không còn nhận thông báo của tài khoản trên máy dùng chung.
 */
export async function releasePushToGuest() {
  if (!supported()) return
  const subscription = await currentSubscription()
  if (!subscription) return
  try {
    await notificationApi.releasePush(subscription.endpoint)
  } catch {
    await disablePush('account')
  }
}

/** Tùy chọn của thiết bị khách; `null` khi trình duyệt hoặc máy chủ chưa có subscription (hoặc đang gắn tài khoản). */
export async function getGuestPushPref(): Promise<GuestPushPref | null> {
  if (!supported()) return null
  const subscription = await currentSubscription()
  if (!subscription) return null
  try {
    return await notificationApi.lookupGuestPush(subscription.endpoint)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

export async function saveGuestPushPref(pref: GuestPushPref): Promise<GuestPushPref> {
  const subscription = await currentSubscription()
  if (!subscription) throw new Error('Thiết bị này chưa bật thông báo.')
  const saved = await upload(subscription, 'guest', pref)
  return saved ?? pref
}
