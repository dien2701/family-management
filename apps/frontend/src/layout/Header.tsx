import { ArrowLeft, Bell, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useRouteTitle } from '@/hooks/useRouteTitle'

// Ô tìm kiếm và chuông chỉ là khung giữ chỗ: chức năng làm ở các đợt sau (tìm kiếm Đợt 11, thông báo GĐ2).
// Tên người Việt thì tên gọi đứng cuối nên lấy chữ cái đầu của từ cuối làm avatar.
const initialOf = (fullName?: string) =>
  fullName?.trim().split(/\s+/).at(-1)?.[0]?.toUpperCase() ?? '?'
export function Header() {
  const title = useRouteTitle()
  const { user } = useAuth()
  const navigate = useNavigate()
  // key='default' nghĩa là trang đầu tiên của phiên, chưa có gì để quay lại trong app
  const canGoBack = useLocation().key !== 'default'

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

        <div className="min-w-0 flex-1">
          <nav aria-label="Vị trí hiện tại" className="hidden lg:block">
            <ol className="flex items-center gap-1.5 text-sm text-text-muted">
              <li>Tộc Phả</li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{title}</li>
            </ol>
          </nav>
          <h1 className="truncate text-xl leading-tight font-bold md:text-2xl">{title}</h1>
        </div>

        <div className="relative hidden w-72 lg:block">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            disabled
            aria-label="Tìm kiếm"
            placeholder="Tìm kiếm (sắp có)"
            className="min-h-11 w-full rounded-field border border-border bg-surface-muted pr-3 pl-10 text-base placeholder:text-text-muted disabled:cursor-not-allowed"
          />
        </div>

        <Button variant="ghost" size="icon" disabled aria-label="Thông báo" title="Sắp có">
          <Bell />
        </Button>

        <span
          role="img"
          aria-label={user?.fullName ? `Tài khoản: ${user.fullName}` : 'Tài khoản'}
          title={user?.fullName}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold text-secondary-fg"
        >
          {initialOf(user?.fullName)}
        </span>
      </div>
    </header>
  )
}
