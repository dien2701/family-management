import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/client'
import type { Me } from '@/types/api'

export const ME_KEY = ['me'] as const

/**
 * `/api/me` của tài khoản đang đăng nhập. Đây là nguồn của `memberId` (thành viên đã liên kết "Tôi là ai"):
 * thông tin trong phiên đăng nhập chỉ được cập nhật khi đăng nhập hoặc làm mới token nên có thể cũ.
 */
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => api.get<Me>('/me'),
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  })
}
