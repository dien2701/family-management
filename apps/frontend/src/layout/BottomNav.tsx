import { NavLink, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'
import { navItemsFor } from './navItems'

// <768px: đúng 5 mục, icon 24px + nhãn 12px, chừa vùng an toàn của tai thỏ (DESIGN §4, §6)
export function BottomNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  return (
    <nav
      aria-label="Điều hướng dưới"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5 gap-1 p-1.5">
        {navItemsFor(user).map(({ to, label, icon: Icon, end, alsoActiveFor }) => {
          // Trên điện thoại khu Quản trị nằm trong "Thêm" nên mục Thêm phải sáng khi đang ở đó
          const inside = alsoActiveFor?.some((p) => pathname === p || pathname.startsWith(`${p}/`))
          return (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-button text-xs font-medium whitespace-nowrap transition-colors duration-200 ease-out',
                    isActive || inside
                      ? 'bg-primary text-primary-fg'
                      : 'text-text-muted hover:bg-surface-muted hover:text-text',
                  )
                }
              >
                <Icon className="size-6" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
