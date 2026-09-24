import { describe, expect, it } from 'vitest'
import { loginSchema, otpSchema, registerSchema, resetPasswordSchema } from './schemas'

const valid = {
  fullName: 'Đặng Văn An',
  email: 'an@example.com',
  password: 'matkhau123',
  confirmPassword: 'matkhau123',
  acceptTerms: true,
}

type Parsed = { error?: { issues: { path: PropertyKey[]; message: string }[] } }

/** Lỗi đầu tiên của từng trường, để kiểm tra lỗi hiện đúng trường. */
function fieldErrors(result: Parsed) {
  const map: Record<string, string> = {}
  for (const issue of result.error?.issues ?? []) map[String(issue.path[0])] ??= issue.message
  return map
}

describe('registerSchema', () => {
  it('chấp nhận dữ liệu hợp lệ và cắt khoảng trắng đầu/cuối', () => {
    const result = registerSchema.safeParse({
      ...valid,
      fullName: '  Đặng Văn An ',
      email: ' an@example.com ',
    })
    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ fullName: 'Đặng Văn An', email: 'an@example.com' })
  })

  it('báo lỗi ở từng trường khi bỏ trống', () => {
    const errors = fieldErrors(
      registerSchema.safeParse({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
      }),
    )
    expect(errors).toEqual({
      fullName: 'Vui lòng nhập họ tên.',
      email: 'Vui lòng nhập email.',
      password: 'Vui lòng nhập mật khẩu.',
      confirmPassword: 'Vui lòng nhập lại mật khẩu.',
      acceptTerms: 'Bạn cần đồng ý điều khoản để đăng ký.',
    })
  })

  it('từ chối họ tên chỉ có khoảng trắng', () => {
    expect(fieldErrors(registerSchema.safeParse({ ...valid, fullName: '   ' })).fullName).toBe(
      'Vui lòng nhập họ tên.',
    )
  })

  it('từ chối email không hợp lệ, gồm cả email có dấu (backend chỉ nhận ASCII)', () => {
    for (const email of ['an', 'an@', 'an@example', 'an@gmaíl.com', 'ân@example.com']) {
      expect(fieldErrors(registerSchema.safeParse({ ...valid, email })).email, email).toBeDefined()
    }
  })

  it('mật khẩu phải từ 8 ký tự', () => {
    const errors = fieldErrors(
      registerSchema.safeParse({ ...valid, password: 'abc1234', confirmPassword: 'abc1234' }),
    )
    expect(errors.password).toBe('Mật khẩu phải từ 8 đến 72 ký tự.')
  })

  it('giới hạn mật khẩu theo byte UTF-8 như backend (BCrypt 72 byte)', () => {
    // 40 ký tự "ế" = 120 byte: chưa tới 72 ký tự nhưng vượt 72 byte
    const long = 'ế'.repeat(40)
    const errors = fieldErrors(
      registerSchema.safeParse({ ...valid, password: long, confirmPassword: long }),
    )
    expect(errors.password).toContain('72 byte')
    const max = 'a'.repeat(72)
    expect(
      registerSchema.safeParse({ ...valid, password: max, confirmPassword: max }).success,
    ).toBe(true)
  })

  it('báo lỗi ở ô nhập lại khi hai mật khẩu không khớp', () => {
    const errors = fieldErrors(registerSchema.safeParse({ ...valid, confirmPassword: 'khac12345' }))
    expect(errors).toEqual({ confirmPassword: 'Mật khẩu nhập lại không khớp.' })
  })

  it('bắt buộc đồng ý điều khoản', () => {
    expect(
      fieldErrors(registerSchema.safeParse({ ...valid, acceptTerms: false })).acceptTerms,
    ).toBe('Bạn cần đồng ý điều khoản để đăng ký.')
  })
})

describe('loginSchema', () => {
  it('chỉ yêu cầu email đúng dạng và mật khẩu không rỗng', () => {
    expect(loginSchema.safeParse({ email: 'an@example.com', password: 'x' }).success).toBe(true)
    expect(
      fieldErrors(loginSchema.safeParse({ email: 'an@example.com', password: '' })).password,
    ).toBe('Vui lòng nhập mật khẩu.')
  })
})

describe('otpSchema', () => {
  it('chỉ nhận đúng 6 chữ số', () => {
    expect(otpSchema.safeParse({ otp: '123456' }).success).toBe(true)
    for (const otp of ['12345', '1234567', 'abcdef', '12 456']) {
      expect(otpSchema.safeParse({ otp }).success, otp).toBe(false)
    }
    expect(fieldErrors(otpSchema.safeParse({ otp: '' })).otp).toBe('Vui lòng nhập mã xác thực.')
  })
})

describe('resetPasswordSchema', () => {
  it('kiểm tra mật khẩu mới và ô nhập lại', () => {
    expect(
      resetPasswordSchema.safeParse({ newPassword: 'matkhau123', confirmPassword: 'matkhau123' })
        .success,
    ).toBe(true)
    expect(
      fieldErrors(
        resetPasswordSchema.safeParse({ newPassword: 'matkhau123', confirmPassword: 'khac' }),
      ),
    ).toEqual({ confirmPassword: 'Mật khẩu nhập lại không khớp.' })
  })
})
