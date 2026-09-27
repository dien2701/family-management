// Đăng nhập giả lập để xem FE khi chưa chạy backend (mặc định của `npm run dev:mock`). Mọi email/mật khẩu đều vào được
// với vai trò Admin đã duyệt. Đặt `VITE_MOCK_AUTH=real` để quay lại dùng `/auth/*` và `/me` của backend thật.
// Không có token thật: `accessToken` chỉ là chuỗi giữ chỗ, "phiên" chỉ là cờ trong localStorage để tải lại trang
// vẫn còn đăng nhập.
import type { AccountAdmin, AccountAdminPage, AuthResponse, Me } from '@/types/api'
import type { RealApi } from '../context'
import { mockProblem, validationProblem } from '../problem'
import type { MockRequest, MockRouter } from '../router'
import { isObject } from './common'

const SESSION_KEY = 'giapha.mock.session'

// Test cũ của lớp giả lập tự dựng `/me` bằng stub nên không bị chặn ở đây
export const mockAuthEnabled = () => import.meta.env.VITE_MOCK_AUTH !== 'real' && import.meta.env.MODE !== 'test'

function readSession(): { email: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as { email: string }) : null
  } catch {
    return null
  }
}

const writeSession = (email: string | null) => {
  try {
    if (email === null) localStorage.removeItem(SESSION_KEY)
    else localStorage.setItem(SESSION_KEY, JSON.stringify({ email }))
  } catch {
    // Trình duyệt chặn localStorage thì phiên chỉ sống đến khi tải lại trang
  }
}

// Bản xem thử một file (npm run build:share) đổi vai trò bằng khóa này; mặc định Admin
const mockRole = (): 'ADMIN' | 'USER' => {
  try {
    return localStorage.getItem('giapha.mock.role') === 'USER' ? 'USER' : 'ADMIN'
  } catch {
    return 'ADMIN'
  }
}

function accountOf(email: string): AccountAdmin {
  const role = mockRole()
  return {
    id: 1,
    email,
    fullName: role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng',
    systemRole: role,
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
    createdAt: '2026-01-01T00:00:00Z',
  }
}

function meOf(email: string): Me {
  const { id, fullName, systemRole, status, approvalStatus } = accountOf(email)
  return { id, email, fullName, systemRole, status, approvalStatus, consentRequired: false }
}

const authResponse = (email: string): AuthResponse => ({
  accessToken: 'mock-access-token',
  tokenType: 'Bearer',
  expiresIn: 900,
  user: meOf(email),
})

const unauthenticated = () => mockProblem(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.')

function login({ body }: MockRequest): AuthResponse {
  const email = isObject(body) && typeof body.email === 'string' ? body.email.trim() : ''
  if (!email) throw validationProblem([{ field: 'email', message: 'Vui lòng nhập email.' }])
  writeSession(email)
  return authResponse(email)
}

function refresh(): AuthResponse {
  const session = readSession()
  if (!session) throw unauthenticated()
  return authResponse(session.email)
}

export function registerAuthHandlers(router: MockRouter) {
  if (!mockAuthEnabled()) return
  router.on('POST', '/auth/login', login)
  router.on('POST', '/auth/refresh', refresh)
  router.on('POST', '/auth/logout', () => writeSession(null))
}

/** Thay cho backend thật ở những chỗ lớp giả lập gọi `real` (`/me`, danh sách tài khoản). */
export function offlineReal(real: RealApi): RealApi {
  if (!mockAuthEnabled()) return real
  return (async (method, path, options) => {
    if (method === 'GET' && (path === '/me' || path === '/admin/accounts')) {
      const session = readSession()
      if (!session) throw unauthenticated()
      if (path === '/me') return meOf(session.email)
      const page: AccountAdminPage = {
        items: [accountOf(session.email)],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      }
      return page
    }
    return real(method, path, options)
  }) as RealApi
}
