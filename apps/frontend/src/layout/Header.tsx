import { ArrowLeft, Bell } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useRouteTitle } from '@/hooks/useRouteTitle'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useUnreadCount } from '@/features/notification/hooks'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'
import { NotificationDropdown } from '@/features/notification/components/NotificationDropdown'

// Header gọn: quay lại + tiêu đề trang; bên phải là giao diện sáng/tối, chuông, menu tài khoản.
export function Header() {
  const title = useRouteTitle()
  const navigate = useNavigate()
  // key='default' nghĩa là trang đầu tiên của phiên, chưa có gì để quay lại trong app
  const canGoBack = useLocation().key !== 'default'
  const wide = useMediaQuery('(min-width: 1024px)')
  const [showDropdown, setShowDropdown] = useState(false)
  const unreadQuery = useUnreadCount()
  const unreadCount = unreadQuery.data ?? 0

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
          {showDropdown && wide && (
            <NotificationDropdown onClose={() => setShowDropdown(false)} />
          )}
        </div>

        <UserMenu />
      </div>
    </header>
  )
}
