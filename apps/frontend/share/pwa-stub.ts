// Bản gửi ngoài không có service worker: thay module ảo của vite-plugin-pwa bằng đồ giả rỗng.
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as [boolean, (v: boolean) => void],
    offlineReady: [false, () => {}] as [boolean, (v: boolean) => void],
    updateServiceWorker: async () => {},
  }
}
