import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ME_KEY } from '@/hooks/useMe'
import { linkApi } from './api'

const MINE_KEY = ['link-requests', 'mine'] as const

/** Các yêu cầu "Đây là tôi" của tài khoản này, mới nhất trước. */
export function useMyLinkRequests() {
  return useQuery({
    queryKey: MINE_KEY,
    queryFn: linkApi.myRequests,
    // Admin có thể vừa duyệt hoặc từ chối ở nơi khác
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  })
}

/** Hồ sơ của thành viên đang liên kết (dùng chung khóa với trang hồ sơ nên không tải thừa). */
export function useLinkedMember(memberId: number | undefined) {
  return useQuery({
    queryKey: ['members', memberId],
    queryFn: () => linkApi.getMember(memberId!),
    enabled: memberId !== undefined,
  })
}

export function useCreateLinkRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memberId: number) => linkApi.createRequest(memberId),
    // Lỗi 409 (đã có yêu cầu, thành viên vừa được người khác nhận) cũng cần tải lại cho khớp máy chủ
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: MINE_KEY }),
        queryClient.invalidateQueries({ queryKey: ME_KEY }),
      ]),
  })
}

export function useUnlinkMe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: linkApi.unlink,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ME_KEY }),
        queryClient.invalidateQueries({ queryKey: MINE_KEY }),
        // Hồ sơ vừa mất dấu "Đây là bạn" và quyền sửa
        queryClient.invalidateQueries({ queryKey: ['members'] }),
      ]),
  })
}
