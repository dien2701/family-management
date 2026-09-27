import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ME_KEY } from '@/hooks/useMe'
import type { AccountListQuery, Schemas } from '@/types/api'
import { adminAccountsApi, linkRequestsApi, adminSettingsApi, adminDeletedMembersApi, type AccountAction } from './api'

const ACCOUNTS_KEY = ['admin', 'accounts'] as const
const LINK_REQUESTS_KEY = ['admin', 'link-requests'] as const

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

/** Liên kết đổi thì dòng tài khoản, hàng đợi yêu cầu, hồ sơ (email được chép sang) và `/me` đều cũ. */
function useInvalidateLinks() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
      queryClient.invalidateQueries({ queryKey: LINK_REQUESTS_KEY }),
      queryClient.invalidateQueries({ queryKey: ['members'] }),
      queryClient.invalidateQueries({ queryKey: ME_KEY }),
    ])
}

/** Yêu cầu liên kết đang chờ duyệt, cũ nhất trước. Admin mở trang này để chờ nên lấy lại khi quay lại cửa sổ. */
export function usePendingLinkRequests() {
  return useQuery({
    queryKey: [...LINK_REQUESTS_KEY, 'PENDING'],
    queryFn: () => linkRequestsApi.list('PENDING'),
    refetchOnWindowFocus: true,
  })
}

export function useLinkRequestAction() {
  const invalidate = useInvalidateLinks()
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
      action === 'approve' ? linkRequestsApi.approve(id) : linkRequestsApi.reject(id),
    // Lỗi 409 (yêu cầu đã được xử lý, thành viên vừa có tài khoản khác) cũng cần tải lại danh sách
    onSettled: invalidate,
  })
}

export function useLinkMember() {
  const invalidate = useInvalidateLinks()
  return useMutation({
    mutationFn: ({ accountId, memberId }: { accountId: number; memberId: number }) =>
      adminAccountsApi.linkMember(accountId, memberId),
    onSettled: invalidate,
  })
}

export function useUnlinkMember() {
  const invalidate = useInvalidateLinks()
  return useMutation({
    mutationFn: (accountId: number) => adminAccountsApi.unlinkMember(accountId),
    onSettled: invalidate,
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminSettingsApi.get(),
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: Schemas['SystemSettings']) => adminSettingsApi.update(settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  })
}

export function useDeletedMembers(page: number, size: number) {
  return useQuery({
    queryKey: ['admin', 'deleted-members', page, size],
    queryFn: () => adminDeletedMembersApi.list({ page, size }),
    placeholderData: keepPreviousData,
  })
}

export function useDeletedMemberSnapshot(auditId: number | null) {
  return useQuery({
    queryKey: ['admin', 'deleted-members', auditId],
    queryFn: () => auditId ? adminDeletedMembersApi.get(auditId) : Promise.reject('No auditId'),
    enabled: auditId !== null,
  })
}
