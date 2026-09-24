import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageSpinner } from '@/components/shared/FullPageSpinner'
import { useAuth } from '@/hooks/useAuth'
import { areaOf, homePathFor, safeInternalPath, type Area } from '../routing'

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

/** Trang đăng nhập/đăng ký...: người đã đăng nhập thì chuyển tới trang đích theo vai trò. */
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

/** Mỗi khu vực (family, onboarding, admin) chỉ mở cho đúng nhóm người dùng, còn lại đưa về trang của họ. */
export function AreaGuard({ area }: { area: Area }) {
  const { user } = useAuth()
  if (!user) return null // RequireAuth bên ngoài đã xử lý
  if (areaOf(user) !== area) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}
