import { ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/utils/cn'

type ListRowProps = {
  /** Icon lucide, tô màu primary. */
  icon?: LucideIcon
  /** Phần tử tự vẽ bên trái thay cho `icon` (ví dụ icon theo loại sự kiện). */
  leading?: ReactNode
  label: ReactNode
  description?: ReactNode
  /** Có `to` hoặc `onClick` thì cả dòng bấm được và có chevron, trừ khi truyền `trailing`. */
  to?: string
  onClick?: () => void
  trailing?: ReactNode
}

// Một dòng trong danh sách: icon trái, nhãn + mô tả, chevron phải, cao ≥ 56px (DESIGN §9).
// Nhóm nhiều dòng thì bọc trong <ListGroup> để có đường kẻ giữa các dòng.
export function ListRow({ icon: Icon, leading, label, description, to, onClick, trailing }: ListRowProps) {
  const body = (
    <>
      {Icon ? <Icon className="size-6 shrink-0 text-primary" aria-hidden="true" /> : leading}
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-text">{label}</span>
        {description && <span className="block text-sm text-text-muted">{description}</span>}
      </span>
      {trailing ?? ((to || onClick) && <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden="true" />)}
    </>
  )
  const base = 'flex min-h-14 items-center gap-3 py-3 text-left'
  // Dòng bấm được nới ra 8px mỗi bên để nền hover không dính sát chữ
  const interactive = cn(
    base,
    '-mx-2 w-[calc(100%+1rem)] rounded-field px-2 transition-colors duration-200 ease-out hover:bg-surface-muted',
  )

  return (
    <li>
      {to ? (
        <Link to={to} className={interactive}>
          {body}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={interactive}>
          {body}
        </button>
      ) : (
        <div className={base}>{body}</div>
      )}
    </li>
  )
}

export function ListGroup({ className, children }: { className?: string; children: ReactNode }) {
  return <ul className={cn('divide-y divide-border', className)}>{children}</ul>
}
