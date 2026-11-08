import { NavLink, Outlet, useLocation } from 'react-router'
import { cn } from '@/utils/cn'
import { usePendingLinkRequests } from '../hooks'
import { adminStrings as s } from '../strings'

import { usePendingProposalsCount } from '../../proposal/hooks'

// Khung chung của khu Quản trị. `/quan-tri` là lưới ô lối tắt (AdminHomePage); ở các mục con, máy tính có hàng
// chọn mục ở trên, điện thoại bỏ hàng này và quay về lưới bằng nút quay lại của header (DESIGN §9).
// Quyền thật vẫn do backend kiểm tra; route đã chặn người không phải Admin.
export function AdminLayout() {
  const isHome = useLocation().pathname.replace(/\/$/, '') === '/quan-tri'
  const pending = usePendingLinkRequests()
  const pendingCount = pending.data?.length ?? 0
  const pendingProposalsQuery = usePendingProposalsCount()
  const pendingProposalsCount = pendingProposalsQuery.data ?? 0

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label={s.nav.label} className={cn('max-md:hidden', isHome && 'hidden')}>
        <ul className="flex flex-wrap gap-2">
          <li>
            <SectionLink to="/quan-tri/tai-khoan" label={s.nav.accounts} />
          </li>
          <li>
            <SectionLink to="/quan-tri/yeu-cau-lien-ket" label={s.nav.linkRequests} count={pendingCount} />
          </li>
          <li>
            <SectionLink to="/quan-tri/de-xuat" label={s.nav.proposals} count={pendingProposalsCount} />
          </li>
          <li>
            <SectionLink to="/quan-tri/da-xoa" label={s.nav.deleted} />
          </li>
          <li>
            <SectionLink to="/quan-tri/cau-hinh" label={s.nav.settings} />
          </li>
        </ul>
      </nav>
      <Outlet />
    </div>
  )
}

function SectionLink({ to, label, count }: { to: string; label: string; count?: number }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-base font-semibold transition-colors duration-200 ease-out',
          isActive
            ? 'bg-secondary text-secondary-fg'
            : 'text-text-muted hover:bg-surface-muted hover:text-text',
        )
      }
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="min-w-6 rounded-full bg-warning-bg px-2 text-center text-sm font-semibold text-warning tabular-nums">
          {count}
        </span>
      )}
    </NavLink>
  )
}
