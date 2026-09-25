import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AccountListQuery } from '@/types/api'
import { adminAccountsApi, type AccountAction } from './api'

const ACCOUNTS_KEY = ['admin', 'accounts'] as const

/** Danh sách tài khoản; giữ trang cũ trên màn hình trong lúc tải trang/bộ lọc mới để không nháy skeleton. */
export function useAccounts(query: AccountListQuery) {
  return useQuery({
    queryKey: [...ACCOUNTS_KEY, 'list', query],
    queryFn: () => adminAccountsApi.list(query),
    placeholderData: keepPreviousData,
    // Admin mở tab này để chờ người mới đăng ký nên lấy lại khi quay lại cửa sổ
    refetchOnWindowFocus: true,
  })
}

/** Số tài khoản đang chờ duyệt, cho badge trên tab. */
export function useWaitingCount() {
  return useQuery({
    queryKey: [...ACCOUNTS_KEY, 'waiting-count'],
    queryFn: () => adminAccountsApi.list({ approval: 'WAITING', size: 1 }),
    select: (page) => page.totalElements ?? 0,
    refetchOnWindowFocus: true,
  })
}

/**
 * Thực hiện một thao tác lên tài khoản. Thành công hay lỗi 409 (danh sách đã cũ) đều tải lại danh sách
 * và badge để màn hình khớp với máy chủ.
 */
export function useAccountAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: AccountAction }) =>
      adminAccountsApi.act(id, action),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}
