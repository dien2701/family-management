import { LogOut, Settings, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { initialOf } from '@/utils/text'

const ITEM =
  'flex min-h-11 w-full items-center gap-3 px-4 text-left text-base transition-colors hover:bg-surface-muted'

/** Avatar ở góc phải header: bấm mở menu Hồ sơ cá nhân, Cài đặt, Đăng xuất. */
export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={user?.fullName ? `Tài khoản: ${user.fullName}` : 'Tài khoản'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold text-secondary-fg transition-colors hover:bg-secondary-hover"
      >
        {initialOf(user?.fullName)}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-40 mt-2 w-64 overflow-hidden rounded-card border border-border bg-surface py-1 shadow-overlay"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate font-semibold">{user?.fullName}</p>
            <p className="truncate text-sm text-text-muted">{user?.email}</p>
          </div>
          <Link role="menuitem" to="/ho-so" className={ITEM} onClick={() => setOpen(false)}>
            <UserRound className="size-5 text-text-muted" aria-hidden="true" />
            Hồ sơ cá nhân
          </Link>
          <Link role="menuitem" to="/cai-dat" className={ITEM} onClick={() => setOpen(false)}>
            <Settings className="size-5 text-text-muted" aria-hidden="true" />
            Cài đặt
          </Link>
          <button
            type="button"
            role="menuitem"
            className={`${ITEM} border-t border-border text-danger`}
            onClick={() => void logout().catch(() => setOpen(false))}
          >
            <LogOut className="size-5" aria-hidden="true" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}
