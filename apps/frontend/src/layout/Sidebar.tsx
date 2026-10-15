import { TreeDeciduous } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { isAdmin, isApproved } from '@/features/auth/routing'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'
import { ADMIN_NAV_ITEM, AI_NAV_ITEM, PRAYER_NAV_ITEM, navItemsFor, type NavItem } from './navItems'

// ≥1024px: sidebar 240px có chữ; 768–1023px: rail 72px chỉ icon (DESIGN §4, §6)
export function Sidebar() {
  const { user } = useAuth()
  const base = navItemsFor(user)
  // Quản trị cần đăng nhập và đã duyệt, chỉ Admin. Trợ lý AI ai cũng có (DECISIONS #91). Chèn trước mục cuối để mục
  // cuối giữ nguyên chỗ
  const items: readonly NavItem[] = isApproved(user)
    ? [...base.slice(0, -1), AI_NAV_ITEM, ...(isAdmin(user) ? [ADMIN_NAV_ITEM] : []), ...base.slice(-1)]
    : [...base.slice(0, -1), AI_NAV_ITEM, PRAYER_NAV_ITEM, ...base.slice(-1)]

  return (
    <aside className="sticky top-0 hidden h-dvh w-[72px] shrink-0 flex-col border-r border-border bg-surface md:flex lg:w-60">
      <Link
        to="/"
        aria-label="Tộc Phả – về Tổng quan"
        title="Về Tổng quan"
        className="flex h-16 cursor-pointer items-center justify-center gap-3 rounded-button transition-opacity duration-200 ease-out hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:justify-start lg:px-5"
      >
        <span className="flex size-10 items-center justify-center rounded-button bg-primary text-primary-fg">
          <TreeDeciduous className="size-6" aria-hidden="true" />
        </span>
        <span className="hidden text-lg leading-tight font-bold text-primary lg:inline">
          Tộc Phả
        </span>
      </Link>

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
