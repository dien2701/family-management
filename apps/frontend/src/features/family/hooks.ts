import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/client'
import { familyApi } from './api'

const FAMILY_KEY = ['family'] as const
const INVITATIONS_KEY = ['family', 'invitations'] as const

export function useFamily() {
  return useQuery({ queryKey: FAMILY_KEY, queryFn: familyApi.get })
}

export function useInvitations(enabled: boolean) {
  return useQuery({ queryKey: INVITATIONS_KEY, queryFn: familyApi.listInvitations, enabled })
}

/**
 * Tạo hoặc tham gia family xong thì đổi refresh cookie lấy token mới để claim có familyId;
 * route guard sẽ đưa người dùng sang app chính.
 */
function useEnterFamily<TVars>(action: (vars: TVars) => Promise<unknown>) {
  const { refresh } = useAuth()
  return useMutation({
    mutationFn: async (vars: TVars) => {
      await action(vars)
      if (!(await refresh())) {
        throw new ApiError(0, {
          title: 'Đã xong nhưng chưa cập nhật được phiên đăng nhập. Hãy tải lại trang.',
        })
      }
    },
  })
}

export const useCreateFamily = () => useEnterFamily(familyApi.create)
export const useJoinFamily = () => useEnterFamily(familyApi.join)

/**
 * Rời, chuyển quyền: backend thu hồi refresh token của người thực hiện nên refresh sẽ bị từ chối (401)
 * và phiên kết thúc. Gọi refresh để phiên được dọn đúng cách rồi xóa cache của phiên cũ.
 */
function useEndSession<TVars>(action: (vars: TVars) => Promise<unknown>) {
  const { refresh } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: TVars) => {
      await action(vars)
      await refresh()
      queryClient.clear()
    },
  })
}

export const useLeaveFamily = () => useEndSession(() => familyApi.leave())
export const useTransferManager = () => useEndSession(familyApi.transferManager)

export function useRemoveAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: familyApi.removeAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FAMILY_KEY }),
  })
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: familyApi.createInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_KEY }),
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: familyApi.revokeInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_KEY }),
  })
}
