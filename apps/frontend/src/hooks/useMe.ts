import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/client'
import type { Me } from '@/types/api'
import { useAuth } from './useAuth'

export const ME_KEY = ['me'] as const

/**
 * `/api/me` của tài khoản đang đăng nhập. Đây là nguồn của `memberId` (thành viên đã liên kết "Tôi là ai"):
 * thông tin trong phiên đăng nhập chỉ được cập nhật khi đăng nhập hoặc làm mới token nên có thể cũ.
 * Khách (chưa đăng nhập) không gọi: các trang xem công khai cũng dùng hook này (DECISIONS #88).
 */
export function useMe() {
  const { status } = useAuth()
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => api.get<Me>('/me'),
    enabled: status === 'authenticated',
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  })
}
