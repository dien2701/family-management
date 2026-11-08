import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/utils/cn'

type IconTileProps = {
  /** Có `to` thì là link, không thì là nút gọi `onClick`. */
  to?: string
  onClick?: () => void
  icon: LucideIcon
  label: string
  /** Ô có viền, nền surface, đổ bóng (trang Thêm). */
  boxed?: boolean
  /** Số việc đang chờ: > 0 thì hiện chấm số ở góc ô icon, kèm chữ cho trình đọc màn hình. */
  count?: number
  countLabel?: (count: number) => string
}

// Ô lối tắt: icon trong ô bo 12px nền secondary + nhãn 14px tối đa 2 dòng; đặt trong lưới 4 cột (DESIGN §9)
export function IconTile({ to, onClick, icon: Icon, label, boxed, count, countLabel }: IconTileProps) {
  const hasCount = count !== undefined && count > 0
  const className = cn(
    'flex min-h-11 w-full cursor-pointer flex-col items-center gap-2 px-1 text-center transition-colors duration-200 ease-out',
    boxed
      ? 'h-full rounded-card border border-border bg-surface py-3 shadow-card hover:border-accent'
      : 'rounded-field py-2 hover:bg-surface-muted',
  )
  const body = (
    <>
      <span className="relative flex size-12 items-center justify-center rounded-field bg-secondary text-secondary-fg">
        <Icon className="size-6" aria-hidden="true" />
        {hasCount && (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 min-w-6 rounded-full bg-warning-bg px-1.5 text-center text-sm leading-6 font-semibold text-warning tabular-nums ring-2 ring-surface"
          >
            {count}
          </span>
        )}
      </span>
      <span className="line-clamp-2 text-sm leading-tight font-medium text-text">{label}</span>
      {hasCount && <span className="sr-only">{countLabel ? countLabel(count) : count}</span>}
    </>
  )
  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  )
}
