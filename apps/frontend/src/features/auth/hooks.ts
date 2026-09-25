import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from './api'

/** Chu kỳ tự hỏi lại trạng thái duyệt ở trang chờ duyệt (IDEA §5). */
export const APPROVAL_POLL_MS = 30_000

const ME_KEY = ['me'] as const

// Các hook đăng nhập tự lưu phiên vào AuthProvider khi thành công; điều hướng do route guard lo.

export function useRegister() {
  return useMutation({ mutationFn: authApi.register })
}

export function useResendOtp() {
  return useMutation({ mutationFn: authApi.resendOtp })
}

export function useVerifyOtp() {
  const { setSession } = useAuth()
  return useMutation({ mutationFn: authApi.verifyOtp, onSuccess: setSession })
}

export function useLogin() {
  const { setSession } = useAuth()
  return useMutation({ mutationFn: authApi.login, onSuccess: setSession })
}

export function useGoogleLogin() {
  const { setSession } = useAuth()
  return useMutation({ mutationFn: authApi.google, onSuccess: setSession })
}

/** Ghi nhận đồng ý chính sách (đăng nhập Google lần đầu); xong thì cập nhật `consentRequired` của phiên. */
export function useAcceptConsent() {
  const { updateUser } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.consent({ acceptTerms: true }),
    onSuccess: (me) => {
      // Bản `/me` đang cache (của useApprovalWatch) cũng phải mới, kẻo nó ghi đè lại `consentRequired` cũ
      queryClient.setQueryData(ME_KEY, me)
      updateUser(me)
    },
  })
}

/**
 * Trang chờ duyệt: hỏi `/api/me` mỗi 30 giây và khi cửa sổ được focus lại.
 * Được duyệt thì đổi refresh cookie lấy token mới (token cũ còn claim chưa duyệt) rồi route guard đưa vào app;
 * trạng thái khác (bị từ chối) thì chỉ cập nhật phiên. Refresh lỗi mạng sẽ được thử lại ở lần hỏi kế tiếp.
 */
export function useApprovalWatch() {
  const { updateUser, refresh } = useAuth()
  const query = useQuery({
    queryKey: ME_KEY,
    queryFn: authApi.me,
    staleTime: 0,
    refetchInterval: APPROVAL_POLL_MS,
    refetchOnWindowFocus: true,
  })
  const { data, dataUpdatedAt } = query

  useEffect(() => {
    if (!data) return
    if (data.approvalStatus === 'APPROVED') void refresh()
    else updateUser(data)
  }, [data, dataUpdatedAt, refresh, updateUser])

  return query
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword })
}

export function useVerifyResetOtp() {
  return useMutation({ mutationFn: authApi.verifyResetOtp })
}

export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword })
}
