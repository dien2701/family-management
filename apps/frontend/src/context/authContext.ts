import { createContext } from 'react'
import type { AuthResponse, Me } from '@/types/api'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthContextValue = {
  status: AuthStatus
  user: Me | null
  /** Nhận kết quả đăng nhập/đăng ký/xác thực OTP/Google: lưu access token vào bộ nhớ. */
  setSession: (session: AuthResponse) => void
  /** Đăng xuất chủ động (không nhớ trang để quay lại khi đăng nhập lần sau). */
  loggedOut?: boolean
  /** Đổi refresh cookie lấy token mới để cập nhật claim (sau khi được duyệt hoặc đổi vai trò). Trả false nếu không làm mới được. */
  refresh: () => Promise<boolean>
  /** Cập nhật thông tin tài khoản từ `/api/me` mà không đổi token (ví dụ sau khi đồng ý chính sách). */
  updateUser: (user: Me) => void
  /** Ném lỗi nếu máy chủ không thu hồi được phiên, để giao diện báo cho người dùng. */
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
