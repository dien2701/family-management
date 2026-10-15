// Thông tin đăng nhập đã ghi nhớ ở ô tích "Ghi nhớ đăng nhập" (email + mật khẩu, lưu thô trên máy này).
// Mọi đọc/ghi bọc try/catch vì localStorage có thể bị chặn (chế độ riêng tư).
const KEY = 'giapha.rememberedLogin'

export type RememberedLogin = { email: string; password: string }

export function readRememberedLogin(): RememberedLogin | null {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw && typeof raw === 'object') {
      const { email, password } = raw as Partial<RememberedLogin>
      if (typeof email === 'string' && typeof password === 'string') return { email, password }
    }
  } catch {
    // Dữ liệu hỏng hoặc bị chặn thì coi như chưa nhớ gì
  }
  return null
}

export function writeRememberedLogin(login: RememberedLogin | null): void {
  try {
    if (login) localStorage.setItem(KEY, JSON.stringify(login))
    else localStorage.removeItem(KEY)
  } catch {
    // Không lưu được thì bỏ qua, lần sau chỉ phải gõ lại
  }
}
