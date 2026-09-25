// Cửa vào của lớp giả lập (VITE_API_MODE=mock, chỉ ở dev server). `client.ts` nạp module này bằng import động.
// Chỉ endpoint có handler mới bị giả lập, còn lại trả `handled: false` để client gọi backend thật.
import type { Me } from '@/types/api'
import { todayInVietnam } from '@/utils/lunar'
import type { HandlerContext, RealApi } from './context'
import { buildRouter } from './handlers'
import { withLinkedMember } from './links'
import type { MockRouter, Query } from './router'
import { loadStore, saveStore } from './store'

export { STORE_KEY, exportStoreJson, resetStore } from './store'

// Trễ nhỏ cho thấy trạng thái đang tải; test đặt về 0
let delayMs = 250
export const setMockDelay = (ms: number) => {
  delayMs = ms
}

let router: MockRouter | null = null

export type MockResult = { handled: false } | { handled: true; data: unknown }

type MockOptions = { query?: Query; body?: unknown }

/** Vai trò người gọi luôn lấy từ `/api/me` thật, nên đăng nhập và duyệt tài khoản vẫn do backend quyết định. */
export async function handleMock(
  method: string,
  path: string,
  options: MockOptions,
  real: RealApi,
): Promise<MockResult> {
  router ??= buildRouter()
  const matched = router.match(method, path)
  if (!matched) return { handled: false }

  const store = loadStore()
  const context: HandlerContext = {
    store,
    save: () => saveStore(store),
    real,
    // Liên kết "Tôi là ai" nằm trong kho giả lập nên gắn `memberId` vào `/me` của backend thật
    viewer: async () => withLinkedMember(store, await real<Me>('GET', '/me')),
    today: todayInVietnam,
  }
  if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
  const data = await matched.handler(
    { method, path, params: matched.params, query: options.query ?? {}, body: options.body },
    context,
  )
  return { handled: true, data }
}
