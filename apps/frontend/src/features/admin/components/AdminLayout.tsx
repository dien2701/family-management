import { NavLink, Outlet } from 'react-router'
import { cn } from '@/utils/cn'
import { usePendingLinkRequests } from '../hooks'
import { adminStrings as s } from '../strings'

// Khung chung của khu Quản trị: hàng chọn mục ở trên, nội dung của mục ở dưới. Đề xuất, Thành viên đã xóa và
// Cấu hình sẽ thêm vào đây ở các đợt sau. Quyền thật vẫn do backend kiểm tra; route đã chặn người không phải Admin.
export function AdminLayout() {
  const pending = usePendingLinkRequests()
  const pendingCount = pending.data?.length ?? 0

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label={s.nav.label}>
        <ul className="flex flex-wrap gap-2">
          <li>
            <SectionLink to="/quan-tri/tai-khoan" label={s.nav.accounts} />
          </li>
          <li>
            <SectionLink to="/quan-tri/yeu-cau-lien-ket" label={s.nav.linkRequests} count={pendingCount} />
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
