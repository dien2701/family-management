import { api } from '@/services/client'
import type { AuthResponse, Me, OtpSent, Schemas } from '@/types/api'

export const authApi = {
  register: (body: Schemas['RegisterRequest']) => api.post<OtpSent>('/auth/register', body),
  resendOtp: (body: Schemas['EmailRequest']) => api.post<OtpSent>('/auth/resend-otp', body),
  verifyOtp: (body: Schemas['VerifyOtpRequest']) =>
    api.post<AuthResponse>('/auth/verify-otp', body),
  login: (body: Schemas['LoginRequest']) => api.post<AuthResponse>('/auth/login', body),
  google: (body: Schemas['GoogleLoginRequest']) => api.post<AuthResponse>('/auth/google', body),
  forgotPassword: (body: Schemas['EmailRequest']) =>
    api.post<OtpSent>('/auth/forgot-password', body),
  verifyResetOtp: (body: Schemas['VerifyOtpRequest']) =>
    api.post<void>('/auth/verify-reset-otp', body),
  resetPassword: (body: Schemas['ResetPasswordRequest']) =>
    api.post<void>('/auth/reset-password', body),
  changePassword: (body: Schemas['ChangePasswordRequest']) =>
    api.post<void>('/auth/change-password', body),
  me: () => api.get<Me>('/me'),
  consent: (body: Schemas['ConsentRequest']) => api.post<Me>('/me/consent', body),
}
