import { notificationApi } from './api'

export type PushState = 'unsupported' | 'denied' | 'off' | 'on'

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

async function upload(subscription: PushSubscription) {
  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error('Đăng ký push thất bại: thiếu endpoint hoặc khóa')
  await notificationApi.subscribePush({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } })
}

/** Phải gọi từ thao tác bấm của người dùng (trình duyệt chỉ hỏi quyền khi đó). */
export async function enablePush() {
  if (!supported()) throw new Error('Trình duyệt không hỗ trợ thông báo đẩy')
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('Bạn đã từ chối quyền gửi thông báo')
  const registration = await navigator.serviceWorker.ready
  await upload(await ensureSubscription(registration, await notificationApi.getPublicKey()))
}

/** Gọi mỗi lần mở app: đã cho phép thì bảo đảm thiết bị này đang gắn với tài khoản hiện tại (đổi tài khoản, xoay khóa, subscription bị trình duyệt xóa). */
export async function syncPush() {
  try {
    if (!supported() || Notification.permission !== 'granted') return
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) return
    await upload(await ensureSubscription(registration, await notificationApi.getPublicKey()))
  } catch {
    // Chưa cấu hình VAPID (503), mất mạng... Lần mở sau thử lại
  }
}

/** Tắt thông báo trên thiết bị này (báo máy chủ trước, rồi hủy ở trình duyệt). Dùng cho nút Tắt và khi đăng xuất. */
export async function disablePush() {
  if (!supported()) return
  const subscription = await currentSubscription()
  if (!subscription) return
  try {
    await notificationApi.unsubscribePush(subscription.endpoint)
  } finally {
    await subscription.unsubscribe()
  }
}
