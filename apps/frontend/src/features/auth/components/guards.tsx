import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageSpinner } from '@/components/shared/FullPageSpinner'
import { useAuth } from '@/hooks/useAuth'
import { approvalAreaOf, homePathFor, isAdmin, safeInternalPath, type ApprovalArea } from '../routing'

/**
 * Chờ khôi phục phiên rồi mới vẽ trang. Các trang xem công khai (DECISIONS #88) không bắt đăng nhập nên phải đợi
 * biết đã đăng nhập hay chưa trước khi gọi API, nếu không sẽ lấy về bản dữ liệu của khách (thiếu SĐT/email).
 */
export function SessionReady() {
  const { status } = useAuth()
  if (status === 'loading') return <FullPageSpinner />
  return <Outlet />
}

/** Chỉ cho người đã đăng nhập; chưa đăng nhập thì chuyển tới trang đăng nhập và nhớ trang định vào. */
export function RequireAuth() {
  const { status, loggedOut } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <FullPageSpinner />
  if (status === 'anonymous') {
    // Hết phiên hoặc mở link sâu thì nhớ trang để quay lại; đăng xuất chủ động thì không
    const from = loggedOut ? undefined : { from: `${location.pathname}${location.search}` }
    return <Navigate to="/dang-nhap" replace state={from} />
  }
  return <Outlet />
}

/** Trang đăng nhập/đăng ký...: người đã đăng nhập thì chuyển tới trang đích theo trạng thái duyệt. */
export function GuestOnly() {
  const { status, user } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <FullPageSpinner />
  if (status === 'authenticated' && user) {
    const from = safeInternalPath((location.state as { from?: unknown } | null)?.from)
    return <Navigate to={from ?? homePathFor(user)} replace />
  }
  return <Outlet />
}

/**
 * Mỗi trạng thái duyệt chỉ ở đúng khu của mình: chờ duyệt vào `/cho-duyet`, bị từ chối vào
 * `/khong-duoc-duyet`, đã duyệt vào app. Sai khu thì đưa về trang của họ.
 */
export function ApprovalGuard({ area }: { area: ApprovalArea }) {
  const { user } = useAuth()
  if (!user) return null // RequireAuth bên ngoài đã xử lý
  if (approvalAreaOf(user) !== area) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}

/** Route `/quan-tri/**`: chỉ Admin. Quyền thật vẫn do backend kiểm tra; đây chỉ để không hiện trang thừa. */
export function RequireAdmin() {
  const { user } = useAuth()
  if (!isAdmin(user)) return <Navigate to="/" replace />
  return <Outlet />
}
