import { notificationApi } from './api'

// Helper to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Trình duyệt không hỗ trợ Web Push');
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Bạn đã từ chối quyền gửi thông báo');
  }

  const registration = await navigator.serviceWorker.ready;
  const vapidKey = await notificationApi.getPublicKey()
  const applicationServerKey = urlBase64ToUint8Array(vapidKey)
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey
  });

  const subJson = subscription.toJSON()
  if (!subJson.endpoint || !subJson.keys) {
    throw new Error('Đăng ký push thất bại: Không có endpoint hoặc keys')
  }

  await notificationApi.subscribePush({
    endpoint: subJson.endpoint,
    keys: {
      p256dh: subJson.keys.p256dh!,
      auth: subJson.keys.auth!
    }
  })
}
