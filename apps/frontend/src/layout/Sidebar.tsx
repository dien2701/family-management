import { TreeDeciduous } from 'lucide-react'
import { NavLink } from 'react-router'
import { isAdmin } from '@/features/auth/routing'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'
import { ADMIN_NAV_ITEM, NAV_ITEMS, type NavItem } from './navItems'

// ≥1024px: sidebar 240px có chữ; 768–1023px: rail 72px chỉ icon (DESIGN §4, §6)
export function Sidebar() {
  const { user } = useAuth()
  // Mục Quản trị chỉ hiện cho Admin; chèn trước "Thêm" để "Thêm" luôn là mục cuối
  const items: readonly NavItem[] = isAdmin(user)
    ? [...NAV_ITEMS.slice(0, -1), ADMIN_NAV_ITEM, ...NAV_ITEMS.slice(-1)]
    : NAV_ITEMS

  return (
    <aside className="sticky top-0 hidden h-dvh w-[72px] shrink-0 flex-col border-r border-border bg-surface md:flex lg:w-60">
      <div className="flex h-16 items-center justify-center gap-3 lg:justify-start lg:px-5">
        <span className="flex size-10 items-center justify-center rounded-button bg-primary text-primary-fg">
          <TreeDeciduous className="size-6" aria-hidden="true" />
        </span>
        <span className="hidden text-lg leading-tight font-bold text-primary lg:inline">
          Tộc Phả
        </span>
      </div>

      <nav aria-label="Điều hướng chính" className="px-3 py-2">
        <ul className="flex flex-col gap-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                aria-label={label}
                title={label}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center justify-center gap-3 rounded-button text-base font-medium transition-colors duration-200 ease-out lg:justify-start lg:px-3',
                    isActive
                      ? 'bg-primary text-primary-fg'
                      : 'text-text-muted hover:bg-surface-muted hover:text-text',
                  )
                }
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
