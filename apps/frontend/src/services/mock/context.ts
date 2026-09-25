import type { Me } from '@/types/api'
import type { MockStore } from './store'

/** Gọi backend thật (không qua lớp giả lập). Dùng cho `/me` và cho handler "bọc" endpoint thật. */
export type RealApi = <T>(
  method: string,
  path: string,
  options?: { query?: Record<string, unknown>; body?: unknown },
) => Promise<T>

export type HandlerContext = {
  store: MockStore
  /** Ghi store xuống localStorage sau khi handler đổi dữ liệu. */
  save: () => void
  real: RealApi
  /** Người đang gọi, lấy từ `/api/me` thật. Ném 401 nếu chưa đăng nhập. */
  viewer: () => Promise<Me>
  today: () => { year: number; month: number; day: number }
}
