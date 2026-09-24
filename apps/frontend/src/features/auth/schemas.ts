import { z } from 'zod'

// Khớp EmailRules.ASCII_EMAIL của backend: chỉ ASCII để không có địa chỉ "trông giống" dùng chiếm tài khoản
const ASCII_EMAIL = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+([.][A-Za-z0-9-]+)*[.][A-Za-z]{2,}$/

const utf8Bytes = (value: string) => new TextEncoder().encode(value).length

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập email.')
  .max(254, 'Email tối đa 254 ký tự.')
  .regex(ASCII_EMAIL, "Email không hợp lệ (chỉ dùng chữ cái không dấu, số và ký tự . _ % + - ').")

// BCrypt chỉ đọc 72 byte đầu nên backend giới hạn theo byte; ký tự có dấu chiếm nhiều byte hơn
const newPasswordSchema = z
  .string()
  .min(1, 'Vui lòng nhập mật khẩu.')
  .min(8, 'Mật khẩu phải từ 8 đến 72 ký tự.')
  .refine(
    (v) => utf8Bytes(v) <= 72,
    'Mật khẩu quá dài (tối đa 72 byte, ký tự có dấu chiếm nhiều byte hơn).',
  )

const confirmPasswordSchema = z.string().min(1, 'Vui lòng nhập lại mật khẩu.')

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập họ tên.')
      .max(100, 'Họ tên tối đa 100 ký tự.'),
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
    acceptTerms: z.boolean().refine((v) => v, 'Bạn cần đồng ý điều khoản để đăng ký.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp.',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.').max(200, 'Mật khẩu quá dài.'),
})

export const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mã xác thực.')
    .regex(/^[0-9]{6}$/, 'Mã xác thực gồm 6 chữ số.'),
})

export const forgotEmailSchema = z.object({ email: emailSchema })

export const resetPasswordSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp.',
    path: ['confirmPassword'],
  })

export type RegisterValues = z.infer<typeof registerSchema>
export type LoginValues = z.infer<typeof loginSchema>
export type OtpValues = z.infer<typeof otpSchema>
export type ForgotEmailValues = z.infer<typeof forgotEmailSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
