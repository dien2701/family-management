import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from './api'

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

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword })
}

export function useVerifyResetOtp() {
  return useMutation({ mutationFn: authApi.verifyResetOtp })
}

export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword })
}
