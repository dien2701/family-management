import { ArrowLeft, Bell, LogIn } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { isApproved } from '@/features/auth/routing'
import { useAuth } from '@/hooks/useAuth'
import { useRouteTitle } from '@/hooks/useRouteTitle'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useUnreadCount } from '@/features/notification/hooks'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'
import { NotificationDropdown } from '@/features/notification/components/NotificationDropdown'

// Chuông chỉ vẽ cho tài khoản đã duyệt: thông báo cần đăng nhập, khách gọi sẽ 401
function NotificationBell() {
  const navigate = useNavigate()
  const wide = useMediaQuery('(min-width: 1024px)')
  const [showDropdown, setShowDropdown] = useState(false)
  const unreadCount = useUnreadCount().data ?? 0

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Thông báo"
        onClick={() => {
          if (wide) setShowDropdown(!showDropdown)
          else navigate('/thong-bao')
        }}
      >
        <Bell />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-danger-fg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>
      {showDropdown && wide && <NotificationDropdown onClose={() => setShowDropdown(false)} />}
    </div>
  )
}

// Header gọn: quay lại + tiêu đề trang; bên phải là giao diện sáng/tối, rồi chuông + menu tài khoản
// (đã duyệt) hoặc nút Đăng nhập (khách, DECISIONS #88). Tài khoản chưa duyệt chỉ có nút giao diện, đã có banner ở trên nội dung.
export function Header() {
  const title = useRouteTitle()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  // key='default' nghĩa là trang đầu tiên của phiên, chưa có gì để quay lại trong app
  const canGoBack = location.key !== 'default'

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-2 px-4 md:px-6 lg:h-16 lg:gap-4">
        {canGoBack && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Quay lại"
            className="-ml-2"
            onClick={() => void navigate(-1)}
          >
            <ArrowLeft />
          </Button>
        )}

        <h1 className="min-w-0 flex-1 truncate text-xl leading-tight font-bold md:text-2xl">{title}</h1>

        <ThemeToggle />

        {isApproved(user) && (
          <>
            <NotificationBell />
            <UserMenu />
          </>
        )}
        {!user && (
          <Button asChild>
            {/* Nhớ trang đang xem để đăng nhập xong quay lại đúng chỗ */}
            <Link to="/dang-nhap" state={{ from: `${location.pathname}${location.search}` }}>
              <LogIn aria-hidden="true" />
              Đăng nhập
            </Link>
          </Button>
        )}
      </div>
    </header>
  )
}
